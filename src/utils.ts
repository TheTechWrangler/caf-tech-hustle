import type {
  StorageStatus, ItemCondition, ItemType, ServiceNeed, HostedService,
  InventoryItem, WeeklyReport, PriceHeat, InfrastructureDefinition,
  LabStationDefinition, HostingProjectDefinition,
  GameState, InfrastructureName, LabStationName, MapUpgradePhase, Difficulty
} from "./types";
import {
  PROGRESSION_GATE_TOLERANCE, HOSTING_PAYOUT_INTERVAL_DAYS, HOSTING_WEEKLY_PAYOUT_FACTOR,
  readyStatuses, itemTypes,
  difficultyConfigs,
  baseStorageCapacity, baseRepairQueue, baseHostingCapacity, baseReliability,
  labTiers, infrastructureTiers
} from "./constants";
import { infrastructureCatalog, labStationCatalog, districtNames } from "./data";

// ---------------------------------------------------------------------------
// Math primitives
// ---------------------------------------------------------------------------

export function clampStat(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

export function roll(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function rollFloat(min: number, max: number) {
  return min + Math.random() * (max - min);
}

export function rollFloatSeeded(min: number, max: number, ratio: number) {
  return min + clampStat(ratio, 0, 1) * (max - min);
}

export function currentWeekFor(day: number) {
  return Math.floor((Math.max(1, day) - 1) / 7) + 1;
}

export function stableHash(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function stableRatio(value: string) {
  return stableHash(value) / 0xffffffff;
}

export function id(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

// ---------------------------------------------------------------------------
// Array helpers
// ---------------------------------------------------------------------------

export function shuffle<T>(items: T[]) {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swap = roll(0, index);
    [copy[index], copy[swap]] = [copy[swap], copy[index]];
  }
  return copy;
}

export function pickOne<T>(items: T[]) {
  return items[roll(0, items.length - 1)];
}

export function pickWeighted<T extends string>(items: Array<{ value: T; weight: number }>) {
  const total = items.reduce((sum, item) => sum + item.weight, 0);
  let cursor = Math.random() * total;
  for (const item of items) {
    cursor -= item.weight;
    if (cursor <= 0) return item.value;
  }
  return items[items.length - 1].value;
}

// ---------------------------------------------------------------------------
// Progress helpers
// ---------------------------------------------------------------------------

export function progressMeets(current: number, required: number) {
  return current + PROGRESSION_GATE_TOLERANCE >= required;
}

export function snapProgressMilestone(value: number) {
  const milestone = [30, 60, 85, 100].find((threshold) => Math.abs(threshold - value) <= PROGRESSION_GATE_TOLERANCE);
  return milestone ? milestone : value;
}

// ---------------------------------------------------------------------------
// Status / condition mapping
// ---------------------------------------------------------------------------

export function isReadyStatus(status: StorageStatus) {
  return readyStatuses.includes(status);
}

export function isInactiveStatus(status: StorageStatus) {
  return status === "Deployed to Community" || status === "Assigned to Lab" || status === "Scrapped" || status === "Sold";
}

export function isItemType(value: unknown): value is ItemType {
  return typeof value === "string" && itemTypes.includes(value as ItemType);
}

export function conditionFromStatus(status: StorageStatus): ItemCondition {
  if (status === "Tested") return "Working";
  if (status === "Ready to Sell") return "Refurbished";
  if (status === "Ready to Donate" || status === "Reserved" || status === "Deployed to Community" || status === "Assigned to Lab") return "Working";
  if (status === "Needs Repair") return "Needs Parts";
  if (status === "Incoming" || status === "Needs Cleaning" || status === "Cleaned") return "Unknown";
  if (status === "Junked" || status === "Scrapped") return "Broken";
  if (status === "Sold") return "Working";
  return "Unknown";
}

export function conditionMultiplier(condition: ItemCondition, status?: StorageStatus) {
  if (status === "Scrapped") return 0.1;
  if (status === "Junked") return 0.16;
  if (condition === "Refurbished") return 1.15;
  if (condition === "Working") return 1;
  if (condition === "Unknown") return 0.75;
  if (condition === "Needs Parts") return 0.55;
  return 0.4;
}

// ---------------------------------------------------------------------------
// Price heat
// ---------------------------------------------------------------------------

export function buyPriceHeat(price: number, fair: number): PriceHeat {
  const ratio = price / Math.max(1, fair);
  if (ratio <= 0.55) return { label: "Great Deal", className: "great" };
  if (ratio <= 0.8) return { label: "Good Deal", className: "good" };
  if (ratio <= 1.1) return { label: "Fair Price", className: "fair" };
  if (ratio <= 1.3) return { label: "Overpriced", className: "warning" };
  return { label: "Bad Deal", className: "bad" };
}

export function sellPriceHeat(offer: number, fair: number): PriceHeat {
  const ratio = offer / Math.max(1, fair);
  if (ratio >= 1.2) return { label: "Great Deal", className: "great" };
  if (ratio >= 0.95) return { label: "Good Deal", className: "good" };
  if (ratio >= 0.75) return { label: "Fair Price", className: "fair" };
  if (ratio >= 0.55) return { label: "Low Offer", className: "warning" };
  return { label: "Bad Deal", className: "bad" };
}

// ---------------------------------------------------------------------------
// Text / formatting
// ---------------------------------------------------------------------------

export function profitText(value: number, buyPrice: number) {
  if (!buyPrice) return "n/a";
  const profit = value - buyPrice;
  return `${profit >= 0 ? "+" : "-"}$${Math.abs(profit)}`;
}

export function priceDifferenceText(price: number, fair: number) {
  const delta = price - fair;
  if (delta === 0) return "at fair";
  return `${delta > 0 ? "+" : "-"}$${Math.abs(delta)} ${delta > 0 ? "over" : "under"} fair`;
}

export function sellDifferenceText(offer: number, fair: number) {
  const delta = offer - fair;
  if (delta === 0) return "at value";
  return `${delta > 0 ? "+" : "-"}$${Math.abs(delta)} ${delta > 0 ? "profit" : "under value"}`;
}

export function bulkLotNeedText(count: number, minItems: number) {
  return count >= minItems ? `Minimum met: ${count}/${minItems} eligible.` : `Need ${minItems} eligible items. You have ${count}.`;
}

export function capBlockMessage(kind: "Lab" | "Infrastructure", cap: number) {
  return `Unlock more of the map to expand ${kind} capacity beyond ${cap}%.`;
}

export function deploymentLabel(item: InventoryItem) {
  if (item.type === "Display") return "monitor";
  if (item.type === "Network") return "router";
  if (item.type === "Memory") return "RAM kit";
  if (item.type === "Storage") return "SSD";
  if (item.type === "Cables") return "cable bundle";
  if (item.type === "Mini PC") return "mini PC";
  if (item.type === "Workstation") return "business workstation";
  if (item.type === "Server") return "server gear";
  return item.type.toLowerCase();
}

export function weeklyReportFlavor(r: Omit<WeeklyReport, "flavor">): string {
  const totalOut = r.donated + r.requestsFulfilled + r.itemsSold;
  if (r.donated >= 4 || r.requestsFulfilled >= 3) return "CAF is becoming a known community tech resource.";
  if (totalOut >= 5 && r.cashEarned > 80) return "Strong week. The lab is growing one repaired machine at a time.";
  if (r.itemsScrapped >= 4 && r.donated === 0) return "Lots of recycling this week. Time to find some good finds.";
  if (r.cashSpent > r.cashEarned + 40) return "Spending outpaced earnings this week. Watch the budget.";
  if (totalOut >= 2) return "Steady progress. Every piece of gear that leaves helps someone.";
  return "Backlog is building, but the mission is still alive.";
}

// ---------------------------------------------------------------------------
// Action helpers
// ---------------------------------------------------------------------------

export function actionEnergyCost(base: number) {
  if (base <= 0) return 0;
  return Math.max(1, Math.floor(base * 0.9));
}

// ---------------------------------------------------------------------------
// Hosting helpers
// ---------------------------------------------------------------------------

export function hostingSlotsFor(need: ServiceNeed) {
  if (need === "Website Hosting") return 1;
  if (need === "Game Server") return 2;
  if (need === "Pack Tracker Beta") return 2;
  if (need === "FutureDevs Portal") return 3;
  if (need === "AI App Pilot") return 3;
  return 0;
}

export function hostingSlotsUsed(services: HostedService[]) {
  return services.reduce((total, service) => total + service.slots, 0);
}

export function averageUptime(services: HostedService[]) {
  if (!services.length) return 100;
  return Math.round(services.reduce((total, service) => total + service.uptime, 0) / services.length);
}

export function hostingWeeklyPayout(definition: HostingProjectDefinition) {
  return Math.round(definition.monthlyIncome * HOSTING_WEEKLY_PAYOUT_FACTOR);
}

export function nextHostingPayoutDay(day: number) {
  return Math.floor(day / HOSTING_PAYOUT_INTERVAL_DAYS) * HOSTING_PAYOUT_INTERVAL_DAYS + HOSTING_PAYOUT_INTERVAL_DAYS;
}

// ---------------------------------------------------------------------------
// Cost helpers
// ---------------------------------------------------------------------------

export function infrastructureCost(facility: InfrastructureDefinition, level: number) {
  if (level <= 0) return facility.purchaseCost;
  return Math.round(facility.purchaseCost * (level + 1) * 0.75);
}

export function labStationCost(station: LabStationDefinition, level: number) {
  return Math.round(station.purchaseCost * (level + 1) * (level ? 0.82 : 1));
}

// ---------------------------------------------------------------------------
// Difficulty helpers
// ---------------------------------------------------------------------------

export function difficultyConfig(difficulty: Difficulty) {
  return difficultyConfigs[difficulty] ?? difficultyConfigs.Normal;
}

// ---------------------------------------------------------------------------
// Lab / infrastructure calculation cluster
// ---------------------------------------------------------------------------

export function labBonuses(stations: Partial<Record<LabStationName, number>> = {}) {
  const level = (name: LabStationName) => stations[name] ?? 0;
  return {
    storageCapacity: level("Intake Table") * 2 + level("Community Pickup Shelf") * 2 + level("Parts Shelf"),
    repairQueue: level("Repair Bench") + Math.floor(level("Testing Bench") / 2),
    hostingCapacity: level("Server Rack") * 2 + level("Network Corner") + level("AI Workstation"),
    reliability: level("Network Corner") * 3 + level("Server Rack") * 2 + level("Cooling/Power Upgrade") * 6,
    repairChance: level("Parts Shelf") * 0.025 + level("Testing Bench") * 0.015,
    repairCostReduction: level("Parts Shelf") * 2,
    stressRelief: Math.min(3, level("Cleaning Station") + level("Community Pickup Shelf"))
  };
}

export function infrastructureStats(owned: Record<InfrastructureName, number>, labStations: Partial<Record<LabStationName, number>> = {}) {
  const lab = labBonuses(labStations);
  const infrastructure = infrastructureCatalog.reduce(
    (stats, facility) => {
      const level = owned[facility.name] ?? 0;
      return {
        storageCapacity: stats.storageCapacity + facility.storageBonus * level,
        repairQueue: stats.repairQueue + facility.repairBonus * level,
        hostingCapacity: stats.hostingCapacity + facility.hostingBonus * level,
        reliability: stats.reliability + facility.reliabilityBonus * level,
        upkeep: stats.upkeep + facility.upkeep * level
      };
    },
    {
      storageCapacity: baseStorageCapacity,
      repairQueue: baseRepairQueue,
      hostingCapacity: baseHostingCapacity,
      reliability: baseReliability,
      upkeep: 0
    }
  );
  return {
    storageCapacity: infrastructure.storageCapacity + lab.storageCapacity,
    repairQueue: infrastructure.repairQueue + lab.repairQueue,
    hostingCapacity: infrastructure.hostingCapacity + lab.hostingCapacity,
    reliability: infrastructure.reliability + lab.reliability,
    upkeep: infrastructure.upkeep
  };
}

export function labProgress(state: Pick<GameState, "labStations" | "labAssignments" | "ownedInfrastructure">) {
  const maxStationLevels = labStationCatalog.reduce((total, station) => total + station.maxLevel, 0);
  const stationLevels = labStationCatalog.reduce((total, station) => total + (state.labStations[station.name] ?? 0), 0);
  const stationScore = maxStationLevels ? (stationLevels / maxStationLevels) * 86 : 0;
  const assignmentScore = Math.min(14, state.labAssignments.length * 1.5);
  return clampStat(snapProgressMilestone(Math.round(stationScore + assignmentScore)), 0, 100);
}

export function infrastructureProgress(state: Pick<GameState, "ownedInfrastructure">) {
  const maxLevels = infrastructureCatalog.reduce((total, facility) => total + facility.maxLevel, 0);
  const ownedLevels = infrastructureCatalog.reduce((total, facility) => total + (state.ownedInfrastructure[facility.name] ?? 0), 0);
  return maxLevels ? clampStat(snapProgressMilestone(Math.round((ownedLevels / maxLevels) * 100)), 0, 100) : 0;
}

export function labTierInfo(progress: number) {
  const currentIndex = labTiers.reduce((best, tier, index) => progress >= tier.threshold ? index : best, 0);
  const current = labTiers[currentIndex];
  const next = labTiers[currentIndex + 1] ?? null;
  const progressToNext = next
    ? clampStat(Math.round(((progress - current.threshold) / (next.threshold - current.threshold)) * 100), 0, 100)
    : 100;
  return { current, next, progressToNext };
}

export function infrastructureTierInfo(progress: number) {
  const currentIndex = infrastructureTiers.reduce((best, tier, index) => progress >= tier.threshold ? index : best, 0);
  const current = infrastructureTiers[currentIndex];
  const next = infrastructureTiers[currentIndex + 1] ?? null;
  const progressToNext = next
    ? clampStat(Math.round(((progress - current.threshold) / (next.threshold - current.threshold)) * 100), 0, 100)
    : 100;
  return { current, next, progressToNext };
}

export function mapUpgradePhase(state: Pick<GameState, "unlockedDistricts">): MapUpgradePhase {
  const unlocked = state.unlockedDistricts;
  if (districtNames.every((district) => unlocked.includes(district))) {
    return {
      name: "Phase 4 / Full Map Complete",
      cap: 100,
      next: "All map districts are open.",
      reason: "Full map completion allows Lab and Infrastructure to reach 100%."
    };
  }
  if (unlocked.includes("Industrial Park")) {
    return {
      name: "Phase 3 / Advanced Map",
      cap: 85,
      next: "Unlock Partner City to raise the cap to 100%.",
      reason: "Advanced map access supports high-tier builds and hosting, capped at 85% until regional expansion."
    };
  }
  if (unlocked.some((district) => ["Downtown", "Schools", "Library", "Senior Center"].includes(district))) {
    return {
      name: "Phase 2 / Community Map",
      cap: 60,
      next: "Unlock Industrial Park to raise the cap to 85%.",
      reason: "Community map access supports mid-game operations, capped at 60% until advanced sourcing opens."
    };
  }
  return {
    name: "Phase 1 / Starter Map",
    cap: 30,
    next: "Unlock Downtown, Schools, Library, or Senior Center to raise the cap to 60%.",
    reason: "Starter zones support basic repairs and starter hosting, capped at 30%."
  };
}

// ---------------------------------------------------------------------------
// Energy calculation cluster
// ---------------------------------------------------------------------------

export function maxEnergyFor(state: Pick<GameState, "difficulty" | "ownedInfrastructure"> & { labStations?: Record<LabStationName, number> }) {
  const owned = state.ownedInfrastructure;
  const lab = labBonuses(state.labStations);
  const baseMax = difficultyConfig(state.difficulty).maxEnergy +
    (owned["Garage Workspace"] ?? 0) +
    (owned["Small Repair Shop"] ?? 0) * 2 +
    (owned["Partner Facility"] ?? 0) +
    Math.floor(lab.stressRelief / 2);
  return Math.ceil(baseMax * 1.15);
}

export function energyStackCapFor(state: Pick<GameState, "difficulty" | "ownedInfrastructure"> & { labStations?: Record<LabStationName, number> }) {
  const maxEnergy = maxEnergyFor(state);
  return maxEnergy * 3;
}

export function dailyEnergyGainFor(state: Pick<GameState, "difficulty" | "ownedInfrastructure" | "stress"> & { labStations?: Record<LabStationName, number> }) {
  const maxEnergy = maxEnergyFor(state);
  const lab = labBonuses(state.labStations);
  return clampStat(maxEnergy - Math.max(0, Math.floor((state.stress - lab.stressRelief) / 5)), 6, maxEnergy);
}

export function dailyEnergyFor(state: Pick<GameState, "difficulty" | "ownedInfrastructure" | "stress" | "energy"> & { labStations?: Record<LabStationName, number> }) {
  return clampStat(state.energy + dailyEnergyGainFor(state), 0, energyStackCapFor(state));
}

export function statusClass(status: StorageStatus): string {
  return status.toLowerCase().replace(/\s+/g, "-");
}
