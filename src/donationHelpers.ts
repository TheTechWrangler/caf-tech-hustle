import type {
  Difficulty, DonationTier, DonationCondition, RevealedDonationCondition,
  StorageStatus, SurpriseDonation
} from "./types";
import { donationTierConfigs } from "./data";
import { itemPool } from "./data";
import { difficultyConfig } from "./utils";
import { pickWeighted, pickOne, roll, id } from "./utils";

function templateByName(name: string) {
  return itemPool.find((item) => item.name === name) ?? itemPool[0];
}

export function rollDonationTier(difficulty: Difficulty): DonationTier | null {
  // 25% base daily trigger. Within that: Tiny 55%, Small 30%, Medium 10%, Large 4%, Huge 0.8%, Legendary 0.2%
  const chance = Math.random() / difficultyConfig(difficulty).donationRate;
  if (chance < 0.0005) return "Legendary";
  if (chance < 0.0025) return "Huge";
  if (chance < 0.0125) return "Large";
  if (chance < 0.0375) return "Medium";
  if (chance < 0.1125) return "Small";
  if (chance < 0.25)   return "Tiny";
  return null;
}

export function hiddenConditionFor(condition: DonationCondition, tier: DonationTier): RevealedDonationCondition {
  if (condition !== "Unknown") return condition;
  const weights = donationTierConfigs[tier].conditionWeights
    .filter((entry) => entry.condition !== "Unknown")
    .map((entry) => ({ value: entry.condition as RevealedDonationCondition, weight: entry.weight }));
  return pickWeighted(weights);
}

export function generateSurpriseDonation(difficulty: Difficulty): SurpriseDonation | null {
  const tier = rollDonationTier(difficulty);
  if (!tier) return null;
  const config = donationTierConfigs[tier];
  const items = Array.from({ length: roll(config.count[0], config.count[1]) }, () => {
    const template = templateByName(pickOne(config.itemNames));
    const condition = pickWeighted(config.conditionWeights.map((entry) => ({ value: entry.condition, weight: entry.weight })));
    return {
      ...template,
      id: id("donation-item"),
      condition,
      hiddenCondition: hiddenConditionFor(condition, tier)
    };
  });

  if (tier === "Legendary" && !items.some((item) => item.type === "Server")) {
    const server = templateByName("Server Parts");
    items[roll(0, items.length - 1)] = {
      ...server,
      id: id("donation-item"),
      condition: "Unknown",
      hiddenCondition: hiddenConditionFor("Unknown", tier)
    };
  }

  return {
    id: id("donation"),
    donor: pickOne(config.donors),
    tier,
    flavor: pickOne(config.flavors),
    sorted: false,
    items
  };
}

export function donationConditionToStatus(condition: DonationCondition): StorageStatus {
  return condition === "Unknown" ? "Incoming" : "Needs Cleaning";
}
