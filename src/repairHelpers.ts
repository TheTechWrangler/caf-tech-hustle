import type { InventoryItem, ItemQuality, ItemCondition, GameState, BusinessOffer, LabStationName } from "./types";
import { CLEAN_TEST_DESTROY_CHANCE, HIGH_RISK_DESTROY_CHANCE } from "./constants";
import { conditionFromStatus, actionEnergyCost, labBonuses, clampStat, stableRatio, rollFloatSeeded } from "./utils";
import { itemFairValue, itemResaleEstimate, isHighEndBusinessItem, deriveItemQuality } from "./gameHelpers";

export function itemQuality(item: InventoryItem): ItemQuality {
  return item.quality ?? deriveItemQuality(item);
}

export function businessOfferForItem(
  item: InventoryItem,
  state: Pick<GameState, "reputation" | "communityTrust" | "difficulty">,
  progressScore: number = 100
): BusinessOffer {
  const resale = itemResaleEstimate(item);
  const quality = itemQuality(item);
  const highEnd = isHighEndBusinessItem(item);
  const rollValue = stableRatio(`${item.id}:${state.difficulty}:business-offer`);
  // Premium offers require some progression — early players only get bargain buyers
  const canPremium = highEnd && (quality === "Excellent" || quality === "Pristine") && rollValue < 0.002
    && (state.reputation >= 35 || progressScore >= 25);
  if (canPremium) {
    const premiumRoll = stableRatio(`${item.id}:premium-multiplier`);
    const multiplier = rollFloatSeeded(1.4, 2, premiumRoll);
    return { value: Math.max(1, Math.round(resale * multiplier)), label: "Rare Premium Offer", className: "great", multiplier, premium: true };
  }
  // Early-game penalty: bargain buyers dominate before reputation/lab progress develops
  const earlyPenalty = (state.reputation < 25 && progressScore < 20) ? -0.12 : 0;
  let min = 0.85 + earlyPenalty;
  let max = 1.05 + earlyPenalty;
  if (quality === "Excellent") {
    min = 0.95 + earlyPenalty;
    max = 1.15 + earlyPenalty;
  }
  if (quality === "Pristine") {
    min = 1.05 + earlyPenalty;
    max = 1.25 + earlyPenalty;
  }
  const difficultyBump = state.difficulty === "Easy" ? 0.01 : state.difficulty === "Hard" ? -0.03 : state.difficulty === "Chaos Mode" ? -0.02 : 0;
  const trustBump = Math.min(0.02, (state.reputation + state.communityTrust) / 2200);
  const multiplier = clampStat(rollFloatSeeded(min, max, stableRatio(`${item.id}:business-multiplier`)) + difficultyBump + trustBump, min, max);
  const value = Math.max(1, Math.round(resale * multiplier));
  const ratio = value / Math.max(1, resale);
  const label = earlyPenalty < 0
    ? (ratio >= 0.93 ? "Bargain Buyer Offer" : "Below-Market Offer")
    : ratio >= 1.05 ? "Good Business Offer" : "Fair Business Offer";
  return { value, label, className: ratio >= 1.05 ? "good" : "fair", multiplier, premium: false };
}

export function businessSaleValue(
  item: InventoryItem,
  state: Pick<GameState, "reputation" | "communityTrust" | "difficulty">,
  progressScore: number = 100
): number {
  return businessOfferForItem(item, state, progressScore).value;
}

export function repairJunkChance(item: InventoryItem): number {
  const condition = item.condition ?? conditionFromStatus(item.status);
  const quality = itemQuality(item);
  let chance = 0.05;
  if (condition === "Working" || condition === "Refurbished") chance = 0.02;
  if (condition === "Needs Parts") chance = 0.06;
  if (condition === "Broken") chance = 0.08;
  if (quality === "Poor" && condition === "Broken") chance = 0.11;
  if (quality === "Excellent" || quality === "Pristine") chance = Math.min(chance, 0.02);
  return chance;
}

export function cleanTestDestroyChance(item: InventoryItem, revealed: ItemCondition): number {
  if (revealed !== "Broken") return 0;
  const highRisk = item.type === "Server" || item.type === "Workstation";
  return highRisk ? HIGH_RISK_DESTROY_CHANCE : CLEAN_TEST_DESTROY_CHANCE;
}

export function repairNumbers(
  item: InventoryItem,
  labStations: Partial<Record<LabStationName, number>> = {}
): { cash: number; energy: number } {
  const needsParts = item.condition === "Needs Parts";
  const isBroken = item.condition === "Broken" || conditionFromStatus(item.status) === "Broken";
  const lab = labBonuses(labStations);
  const rawCost = Math.max(0, item.repairCost + (needsParts ? 6 : 0) - lab.repairCostReduction);
  const fair = itemFairValue(item);
  const floorPct = isBroken ? 0.22 : 0.11;
  const floor = Math.max(5, Math.round(fair * floorPct));
  return {
    cash: Math.max(floor, rawCost),
    energy: actionEnergyCost(item.energy + (needsParts ? 1 : 0))
  };
}
