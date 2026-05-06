import type { GameState, HostingProject, ItemTemplate, ItemCondition, StorageStatus, InventoryItem, Offer, HostingProjectDefinition, GrantId, GrantApplication, DistrictConfig, PricingSnapshot, ItemQuality, InfrastructureDefinition, LabStationName, LabStationDefinition, InfrastructureName, ItemType, LocationName, Difficulty, RevealedDonationCondition, DailyUpdateData, DailyUpdateLine } from "./types";
import { HOSTING_WEEKLY_PAYOUT_FACTOR, shopLocations } from "./constants";
import { itemPool, hostingProjectCatalog, grantCatalog, districtNames, labStationCatalog, infrastructureCatalog } from "./data";
import { infrastructureStats, infrastructureProgress, progressMeets, conditionFromStatus, conditionMultiplier, isInactiveStatus, isReadyStatus, hostingSlotsUsed, labProgress, stableRatio, buyPriceHeat, rollFloat, roll, id, clampStat, pickWeighted, difficultyConfig, capBlockMessage, mapUpgradePhase, labTierInfo } from "./utils";

export function baseResaleValue(item: Pick<ItemTemplate, "name" | "type">, condition: ItemCondition = "Working") {
  if (item.type === "Cables") return 8;
  if (item.type === "Memory") return 18;
  if (item.type === "Storage") return 35;
  if (item.type === "Display") return 45;
  if (item.type === "Network") return 35;
  if (item.type === "Mini PC") return 175;
  if (item.type === "Server") return 90;
  if (item.type === "Workstation") return 210;
  if (item.type === "Laptop") {
    if (condition === "Refurbished") return 152;
    if (condition === "Working") return 140;
    return 45;
  }
  if (item.type === "Desktop") {
    if (condition === "Refurbished") return 130;
    if (condition === "Working") return 120;
    return 75;
  }
  return 30;
}

export function fairMarketValue(item: Pick<ItemTemplate, "name" | "type"> & { condition?: ItemCondition }, status: StorageStatus, condition = item.condition ?? conditionFromStatus(status)) {
  const base = baseResaleValue(item, condition);
  const brokenishBase = item.type === "Laptop" && item.name.toLowerCase().includes("broken") && condition === "Broken";
  const serverPartsBase = item.type === "Server" && condition === "Broken";
  const multiplier = brokenishBase ? 1 : serverPartsBase ? 0.78 : conditionMultiplier(condition, status);
  return Math.max(1, Math.round(base * multiplier));
}

export function expectedResaleValue(item: Pick<ItemTemplate, "name" | "type"> & { condition?: ItemCondition }, status: StorageStatus, condition = item.condition ?? conditionFromStatus(status)) {
  const fair = fairMarketValue(item, status, condition);
  const multiplier =
    status === "Ready to Sell" ? 1.02 :
    status === "Tested" ? 0.96 :
    status === "Ready to Donate" ? 0.94 :
    status === "Needs Repair" ? 0.82 :
    status === "Incoming" || status === "Needs Cleaning" || status === "Cleaned" ? 0.9 :
    status === "Junked" ? 0.08 :
    status === "Scrapped" ? 0.14 :
    0.9;
  return Math.max(1, Math.round(fair * multiplier));
}

export function itemFairValue(item: InventoryItem) {
  return item.pricing?.adjustedFairValue ?? fairMarketValue(item, item.status, item.condition);
}

export function itemResaleEstimate(item: InventoryItem) {
  return item.pricing?.expectedResaleValue ?? expectedResaleValue(item, item.status, item.condition);
}

export function hostingProjectStateFor(state: GameState, projectId: string): HostingProject {
  return state.hostingProjects.find((project) => project.id === projectId) ?? { id: projectId, status: "Inactive" };
}

export function completedHostingDefinitions(state: GameState) {
  return hostingProjectCatalog.filter((definition) => {
    const status = hostingProjectStateFor(state, definition.id).status;
    return status === "Completed" || status === "Active";
  });
}

export function monthlyHostingIncome(state: GameState) {
  return completedHostingDefinitions(state).reduce((total, definition) => total + definition.monthlyIncome, 0);
}

export function weeklyHostingIncome(state: GameState) {
  return completedHostingDefinitions(state).reduce((total, definition) => total + Math.round(definition.monthlyIncome * HOSTING_WEEKLY_PAYOUT_FACTOR), 0);
}

export function hostingSlotUnlockText(state: GameState) {
  const stats = infrastructureStats(state.ownedInfrastructure, state.labStations);
  if (stats.hostingCapacity > 0) return "upgrade Infrastructure facilities such as Server Closet, Mini Data Center, or Full Data Center for more slots";
  const neighborhood = state.unlockedDistricts.includes("Neighborhood");
  const infraReady = progressMeets(infrastructureProgress(state), 30);
  if (!neighborhood || !infraReady) {
    return `first slot unlocks with Neighborhood unlocked (${neighborhood ? "met" : "missing"}) + Infrastructure 30% (${infrastructureProgress(state)}/30%)`;
  }
  return "buy a hosting-capable Infrastructure upgrade to create the first slot";
}

export function usableForHosting(item: InventoryItem) {
  const condition = item.condition ?? conditionFromStatus(item.status);
  return !isInactiveStatus(item.status) &&
    (item.status === "Tested" || isReadyStatus(item.status)) &&
    (condition === "Working" || condition === "Refurbished");
}

export function selectHostingEquipment(state: GameState, project: HostingProjectDefinition): InventoryItem[] {
  const selected: InventoryItem[] = [];
  const selectedIds = new Set<string>();
  for (const requirement of project.requiredEquipment) {
    const matches = state.inventory
      .filter((item) => !selectedIds.has(item.id) && requirement.types.includes(item.type) && usableForHosting(item))
      .sort((a, b) => itemFairValue(a) - itemFairValue(b))
      .slice(0, requirement.count);
    selected.push(...matches);
    matches.forEach((item) => selectedIds.add(item.id));
  }
  return selected;
}

export function hostingProjectAvailability(state: GameState, project: HostingProjectDefinition) {
  const missing: string[] = [];
  const current = hostingProjectStateFor(state, project.id);
  if (current.status === "Completed" || current.status === "Active") {
    return { canComplete: false, missing: "Already completed", equipment: [] as InventoryItem[] };
  }
  if (project.requiredDistrict && !state.unlockedDistricts.includes(project.requiredDistrict)) missing.push(`${project.requiredDistrict} district`);
  if (!progressMeets(labProgress(state), project.requiredLabProgress ?? 0)) missing.push(`Lab ${project.requiredLabProgress}%`);
  if (!progressMeets(infrastructureProgress(state), project.requiredInfrastructureProgress ?? 0)) missing.push(`Infrastructure ${project.requiredInfrastructureProgress}%`);
  if ((project.requiredReputation ?? 0) > state.reputation) missing.push(`Rep ${project.requiredReputation}`);
  if (state.cash < project.setupCost) missing.push(`$${project.setupCost} setup`);
  const stats = infrastructureStats(state.ownedInfrastructure, state.labStations);
  const openSlots = stats.hostingCapacity - hostingSlotsUsed(state.hostedServices);
  if (openSlots < project.hostingSlots) missing.push(`${project.hostingSlots} hosting slots (${hostingSlotUnlockText(state)})`);
  const equipment = selectHostingEquipment(state, project);
  for (const requirement of project.requiredEquipment) {
    const count = equipment.filter((item) => requirement.types.includes(item.type)).length;
    if (count < requirement.count) missing.push(requirement.label);
  }
  return {
    canComplete: missing.length === 0,
    missing: missing.join(" | "),
    equipment
  };
}

export function freshGrants(): GrantApplication[] {
  return grantCatalog.map((grant) => ({
    id: grant.id,
    status: "Available" as const,
    daysRemaining: 0,
    cooldownRemaining: 0
  }));
}

export function grantStateFor(state: GameState, id: GrantId): GrantApplication {
  return state.grants.find((grant) => grant.id === id) ?? freshGrants().find((grant) => grant.id === id)!;
}

export function dataCenterRequirements(state: GameState) {
  const lab = labProgress(state);
  const infra = infrastructureProgress(state);
  const fullMap = districtNames.every((district) => state.unlockedDistricts.includes(district));
  return {
    fullMap,
    labReady: progressMeets(lab, 100),
    infrastructureReady: progressMeets(infra, 100),
    activeHostingReady: completedHostingDefinitions(state).length >= 3,
    lab,
    infra
  };
}

export function districtUnlockHint(district: DistrictConfig, game: GameState, labProg: number): string {
  const req = district.unlockRequirements;
  const parts: string[] = [];
  if (req.communityTrust !== undefined && game.communityTrust < req.communityTrust) parts.push(`Trust ${game.communityTrust}/${req.communityTrust}`);
  if (req.reputation !== undefined && game.reputation < req.reputation) parts.push(`Rep ${game.reputation}/${req.reputation}`);
  if (req.completedRequests !== undefined && game.completedRequests < req.completedRequests) parts.push(`Requests ${game.completedRequests}/${req.completedRequests}`);
  if (req.labProgress !== undefined && labProg < req.labProgress) parts.push(`Total Lab Build ${labProg}%/${req.labProgress}%`);
  return parts.length ? `Needs: ${parts.join(", ")}` : "Requirements met!";
}

export function districtRequirementRows(district: DistrictConfig, game: GameState, labProg: number) {
  const req = district.unlockRequirements;
  const rows: Array<{ label: string; met: boolean }> = [];
  if (req.communityTrust !== undefined) rows.push({ label: `Trust: ${game.communityTrust}/${req.communityTrust}`, met: game.communityTrust >= req.communityTrust });
  if (req.reputation !== undefined) rows.push({ label: `Reputation: ${game.reputation}/${req.reputation}`, met: game.reputation >= req.reputation });
  if (req.completedRequests !== undefined) rows.push({ label: `Complete requests: ${game.completedRequests}/${req.completedRequests}`, met: game.completedRequests >= req.completedRequests });
  if (req.labProgress !== undefined) rows.push({ label: `Lab: ${labProg}/${req.labProgress}%`, met: progressMeets(labProg, req.labProgress) });
  return rows.length ? rows : [{ label: "Open from game start", met: true }];
}

export function dataCenterUnlockedFor(state: GameState) {
  const req = dataCenterRequirements(state);
  return req.fullMap && req.labReady && req.infrastructureReady && req.activeHostingReady;
}

export function donatedDeviceCount(state: GameState): number {
  return state.inventory.filter((item) => item.status === "Deployed to Community").length;
}

export function infrastructureLevelTotal(state: GameState): number {
  return Object.values(state.ownedInfrastructure).reduce((total, level) => total + level, 0);
}

export function baseFairValue(item: Pick<ItemTemplate, "name" | "type">, condition: ItemCondition = "Working") {
  return baseResaleValue(item, condition);
}

export function scrapValue(item: InventoryItem) {
  const fair = item.pricing?.adjustedFairValue ?? fairMarketValue(item, item.status, item.condition);
  const factor = item.status === "Scrapped" ? 0.08 : item.status === "Junked" ? 0.2 : item.condition === "Refurbished" || item.condition === "Working" ? 0.12 : 0.16;
  return Math.max(1, Math.round(fair * factor));
}

export function pricingSnapshot(
  item: Pick<ItemTemplate, "name" | "type"> & { condition?: ItemCondition },
  status: StorageStatus,
  condition: ItemCondition,
  buyPrice: number
): PricingSnapshot {
  const adjustedFairValue = fairMarketValue(item, status, condition);
  const heat = buyPriceHeat(buyPrice, adjustedFairValue);
  return {
    baseFairValue: baseFairValue(item, condition),
    adjustedFairValue,
    buyPrice,
    expectedResaleValue: expectedResaleValue(item, status, condition),
    dealLabel: heat.label,
    dealClassName: heat.className,
    pricedStatus: status,
    pricedCondition: condition
  };
}

export function isHighEndBusinessItem(item: Pick<ItemTemplate, "name" | "type"> & { condition?: ItemCondition }) {
  const name = item.name.toLowerCase();
  return item.type === "Workstation" ||
    item.type === "Mini PC" ||
    item.type === "Server" ||
    (item.type === "Laptop" && (item.condition === "Refurbished" || name.includes("refurbished"))) ||
    (item.type === "Desktop" && (item.condition === "Refurbished" || name.includes("refurbished")));
}

export function deriveItemQuality(item: Pick<InventoryItem, "id" | "name" | "type" | "status" | "condition">): ItemQuality {
  const condition = item.condition ?? conditionFromStatus(item.status);
  if (condition === "Broken" || condition === "Needs Parts" || condition === "Unknown" || item.status === "Needs Repair") return "Poor";
  const rollValue = stableRatio(`${item.id}:${item.name}:quality`);
  const highEnd = isHighEndBusinessItem(item);
  if (condition === "Refurbished") {
    if (highEnd && rollValue < 0.06) return "Pristine";
    if (highEnd && rollValue < 0.32) return "Excellent";
    if (rollValue < 0.72) return "Good";
    return "Standard";
  }
  if (condition === "Working") {
    if (highEnd && rollValue < 0.08) return "Excellent";
    if (highEnd && rollValue < 0.36) return "Good";
    if (!highEnd && rollValue < 0.18) return "Good";
    return "Standard";
  }
  return "Standard";
}

export function refreshPricingForItem<T extends InventoryItem>(item: T, status = item.status, condition = item.condition ?? conditionFromStatus(status)): T {
  const buyPrice = item.pricing?.buyPrice ?? item.buyPrice;
  const nextItem = {
    ...item,
    status,
    condition,
    quality: deriveItemQuality({ ...item, status, condition }),
    pricing: pricingSnapshot(item, status, condition, buyPrice)
  };
  return nextItem;
}

export function processedItemCount(state: Pick<GameState, "inventory" | "labAssignments">): number {
  const inactiveItems = state.inventory.filter((item) => isInactiveStatus(item.status)).length;
  const purchasedLabItems = state.labAssignments.filter((assignment) => assignment.source === "Purchased").length;
  return inactiveItems + purchasedLabItems;
}

export function assignedTypeCount(state: Pick<GameState, "labAssignments">, types: ItemType[]): number {
  return state.labAssignments.filter((assignment) => assignment.itemType && types.includes(assignment.itemType)).length;
}

export function unmetInfrastructureRequirements(state: GameState, requirements: InfrastructureDefinition["requirements"]): string[] {
  const unmet: string[] = [];
  const progress = labProgress(state);
  const stats = infrastructureStats(state.ownedInfrastructure, state.labStations);
  if (requirements.labProgress && !progressMeets(progress, requirements.labProgress)) {
    unmet.push(`Lab progress: ${progress}% / ${requirements.labProgress}%`);
  }
  if (requirements.anyStationOrProcessed) {
    const { station, level, processedItems } = requirements.anyStationOrProcessed;
    const stationLevel = state.labStations[station] ?? 0;
    const processed = processedItemCount(state);
    if (stationLevel < level && processed < processedItems) {
      unmet.push(`${station}: Level ${stationLevel} / Level ${level}  OR  ${processed} / ${processedItems} processed items`);
    }
  }
  if (requirements.stations) {
    Object.entries(requirements.stations).forEach(([station, required]) => {
      const current = state.labStations[station as LabStationName] ?? 0;
      if (current < (required ?? 0)) unmet.push(`${station}: Level ${current} / Level ${required}`);
    });
  }
  if (requirements.processedItems) {
    const processed = processedItemCount(state);
    if (processed < requirements.processedItems) unmet.push(`Processed items: ${processed} / ${requirements.processedItems}`);
  }
  if (requirements.assignedTypes) {
    Object.entries(requirements.assignedTypes).forEach(([type, count]) => {
      const current = assignedTypeCount(state, [type as ItemType]);
      if (current < (count ?? 0)) unmet.push(`${type} assigned: ${current} / ${count}`);
    });
  }
  requirements.assignedAny?.forEach((req) => {
    const current = assignedTypeCount(state, req.types);
    if (current < req.count) unmet.push(`${req.label}: ${current} / ${req.count}`);
  });
  if (requirements.hostingCapacity && stats.hostingCapacity < requirements.hostingCapacity) {
    unmet.push(`Hosting slots: ${stats.hostingCapacity} / ${requirements.hostingCapacity}`);
  }
  if (requirements.deploymentHistory) {
    const processed = processedItemCount(state);
    if (processed < requirements.deploymentHistory) unmet.push(`Deployment history: ${processed} / ${requirements.deploymentHistory}`);
  }
  if (requirements.reputation && state.reputation < requirements.reputation) {
    unmet.push(`Reputation: ${state.reputation} / ${requirements.reputation}`);
  }
  if (requirements.communityTrust && state.communityTrust < requirements.communityTrust) {
    unmet.push(`Trust: ${state.communityTrust} / ${requirements.communityTrust}`);
  }
  if (requirements.completedRequests && state.completedRequests < requirements.completedRequests) {
    unmet.push(`Requests: ${state.completedRequests} / ${requirements.completedRequests}`);
  }
  if (requirements.facility && !(state.ownedInfrastructure[requirements.facility] > 0)) {
    unmet.push(`${requirements.facility}: not yet owned`);
  }
  return unmet;
}

export function calculateOperatingCosts(state: GameState): { label: string; amount: number }[] {
  const costs: { label: string; amount: number }[] = [];
  const week = Math.floor((state.day - 1) / 7) + 1;
  const infra = infrastructureProgress(state);
  const lab = labProgress(state);
  const activeHosting = completedHostingDefinitions(state).length;
  const usedSlots = hostingSlotsUsed(state.hostedServices);

  // Utilities — unlocks after week 4 or rep 100; scales with infrastructure
  if (week > 4 || state.reputation >= 100) {
    const base = 12;
    const infraBonus = Math.floor(infra / 20) * 6;
    costs.push({ label: "Operating Cost: Utilities", amount: base + infraBonus });
  }

  // Internet / Bandwidth — unlocks when any hosting is active; scales with slots used
  if (activeHosting > 0 || usedSlots > 0) {
    const base = 15;
    const slotBonus = usedSlots * 4;
    const projectBonus = activeHosting * 8;
    costs.push({ label: "Operating Cost: Internet / Bandwidth", amount: base + slotBonus + projectBonus });
  }

  // Insurance — unlocks at rep 150 or infra > 25%
  if (state.reputation >= 150 || infra >= 25) {
    const base = 20;
    const infraBonus = Math.floor(infra / 25) * 10;
    costs.push({ label: "Operating Cost: Insurance", amount: base + infraBonus });
  }

  // Tools / Software — unlocks when lab progress > 10%
  if (lab >= 10) {
    const base = 10;
    const labBonus = Math.floor(lab / 20) * 8;
    costs.push({ label: "Operating Cost: Tools / Software", amount: base + labBonus });
  }

  // Transport / Pickup Fuel — unlocks after week 2; scales with reputation as proxy for activity
  if (week > 2) {
    const base = 8;
    const repBonus = Math.floor(state.reputation / 50) * 5;
    costs.push({ label: "Operating Cost: Transport / Pickup Fuel", amount: base + repBonus });
  }

  // Tax / Filing / Compliance — unlocks when grants have been applied or rep > 200
  const hasGrants = state.grants.some((g) => g.status === "Approved" || g.status === "On Cooldown" || g.status === "Rejected");
  if (hasGrants || state.reputation >= 200) {
    const base = 18;
    const repBonus = Math.floor(state.reputation / 100) * 10;
    costs.push({ label: "Operating Cost: Tax / Filing / Compliance", amount: base + repBonus });
  }

  return costs;
}

export function buildDailyUpdate(prev: GameState, next: GameState, unpaidOperatingCosts = 0): DailyUpdateData {
  const lines: DailyUpdateLine[] = [];

  const todayEntry = next.ledger.find((e) => e.day === next.day);
  const transactions = todayEntry?.transactions ?? [];

  for (const tx of transactions) {
    if (tx.amount > 0) {
      lines.push({ label: tx.label, amount: tx.amount, kind: "income" });
    } else if (tx.amount < 0) {
      lines.push({ label: tx.label, amount: tx.amount, kind: "expense" });
    }
  }

  const prevGrantIds = new Set(prev.grants.map((g) => `${g.id}:${g.status}`));
  for (const g of next.grants) {
    const prevG = prev.grants.find((p) => p.id === g.id);
    if (!prevG) continue;
    if (prevG.status === "Pending Review" && g.status === "Approved") {
      lines.push({ label: `Grant approved: ${g.id}`, kind: "good" });
    } else if (prevG.status === "Pending Review" && g.status === "Rejected") {
      lines.push({ label: `Grant rejected: ${g.id}`, kind: "warning" });
    }
  }
  void prevGrantIds;

  if (prev.reputation !== next.reputation) {
    const delta = next.reputation - prev.reputation;
    lines.push({ label: "Reputation", amount: delta, kind: delta > 0 ? "good" : "warning" });
  }
  if (prev.communityTrust !== next.communityTrust) {
    const delta = next.communityTrust - prev.communityTrust;
    lines.push({ label: "Community Trust", amount: delta, kind: delta > 0 ? "good" : "warning" });
  }
  if (prev.stress !== next.stress) {
    const delta = next.stress - prev.stress;
    lines.push({ label: "Stress", amount: delta, kind: delta > 0 ? "warning" : "good" });
  }

  const newDistricts = next.unlockedDistricts.filter((d) => !prev.unlockedDistricts.includes(d));

  const netCash = (todayEntry?.endingCash ?? next.cash) - (todayEntry?.startingCash ?? prev.cash);
  const newWeeklyReport = next.weeklyReport !== null && prev.weeklyReport === null;

  return { day: next.day, netCash, lines, newWeeklyReport, newDistricts, unpaidOperatingCosts: unpaidOperatingCosts > 0 ? unpaidOperatingCosts : undefined };
}

// ─── Shop generation helpers (moved from main.tsx for shared use) ─────────────

export function itemConditionToStatus(_condition: ItemCondition): StorageStatus {
  return "Incoming";
}

export function conditionForLocation(location: LocationName): ItemCondition {
  const chance = Math.random();
  if (location === "Marketplace") {
    if (chance < 0.55) return "Refurbished";
    if (chance < 0.95) return "Working";
    if (chance < 0.98) return "Needs Parts";
    return "Broken";
  }
  if (location === "Office Liquidator") {
    if (chance < 0.46) return "Working";
    if (chance < 0.74) return "Refurbished";
    if (chance < 0.88) return "Unknown";
    if (chance < 0.97) return "Needs Parts";
    return "Broken";
  }
  if (location === "University Surplus") {
    if (chance < 0.28) return "Working";
    if (chance < 0.48) return "Needs Parts";
    if (chance < 0.78) return "Unknown";
    if (chance < 0.94) return "Broken";
    return "Refurbished";
  }
  if (location === "Recycling Center") {
    if (chance < 0.5) return "Broken";
    if (chance < 0.76) return "Needs Parts";
    if (chance < 0.95) return "Unknown";
    return "Working";
  }
  if (chance < 0.24) return "Broken";
  if (chance < 0.48) return "Needs Parts";
  if (chance < 0.72) return "Unknown";
  if (chance < 0.96) return "Working";
  return "Refurbished";
}

export function hiddenConditionForInventory(condition: ItemCondition | undefined, source?: string): RevealedDonationCondition | undefined {
  if (condition !== "Unknown") return undefined;
  const sourceLabel = source?.toLowerCase() ?? "";
  if (sourceLabel.includes("marketplace") || sourceLabel.includes("liquidator")) {
    return pickWeighted<RevealedDonationCondition>([
      { value: "Working", weight: 62 },
      { value: "Needs Parts", weight: 26 },
      { value: "Broken", weight: 12 }
    ]);
  }
  if (sourceLabel.includes("recycling")) {
    return pickWeighted<RevealedDonationCondition>([
      { value: "Working", weight: 16 },
      { value: "Needs Parts", weight: 38 },
      { value: "Broken", weight: 46 }
    ]);
  }
  return pickWeighted<RevealedDonationCondition>([
    { value: "Working", weight: 34 },
    { value: "Needs Parts", weight: 34 },
    { value: "Broken", weight: 32 }
  ]);
}

function priceFactorForLocation(location: LocationName) {
  const chance = Math.random();
  if (location === "Thrift Store") {
    if (chance < 0.1) return rollFloat(0.42, 0.55);
    if (chance < 0.72) return rollFloat(0.55, 0.95);
    if (chance < 0.9) return rollFloat(0.96, 1.1);
    return rollFloat(1.1, 1.25);
  }
  if (location === "Recycling Center") {
    if (chance < 0.12) return rollFloat(0.2, 0.38);
    if (chance < 0.78) return rollFloat(0.56, 0.75);
    if (chance < 0.94) return rollFloat(0.76, 1.05);
    return rollFloat(1.06, 1.22);
  }
  if (location === "Marketplace") {
    if (chance < 0.08) return rollFloat(0.7, 0.85);
    if (chance < 0.78) return rollFloat(0.85, 1.2);
    if (chance < 0.92) return rollFloat(0.95, 1.1);
    return rollFloat(1.25, 1.45);
  }
  if (location === "Office Liquidator") {
    if (chance < 0.07) return rollFloat(0.5, 0.65);
    if (chance < 0.4) return rollFloat(0.66, 0.85);
    if (chance < 0.82) return rollFloat(0.86, 1.12);
    if (chance < 0.96) return rollFloat(1.13, 1.28);
    return rollFloat(1.29, 1.42);
  }
  if (location === "University Surplus") {
    if (chance < 0.1) return rollFloat(0.35, 0.55);
    if (chance < 0.5) return rollFloat(0.56, 0.82);
    if (chance < 0.85) return rollFloat(0.83, 1.1);
    if (chance < 0.97) return rollFloat(1.11, 1.28);
    return rollFloat(1.29, 1.4);
  }
  return 1;
}

function itemPoolForLocation(location: LocationName) {
  if (location === "Office Liquidator") {
    return itemPool.filter((item) => ["Desktop", "Display", "Network", "Workstation", "Mini PC", "Cables"].includes(item.type));
  }
  if (location === "University Surplus") {
    return itemPool.filter((item) => ["Server", "Network", "Desktop", "Display", "Storage", "Memory", "Cables"].includes(item.type));
  }
  return itemPool;
}

export function marketFor(location: LocationName, difficulty: Difficulty = "Normal"): Offer[] {
  if (location === "Business Sales" || location === "Bulk Buyers") return [];
  const count = location === "Marketplace" || location === "Office Liquidator" || location === "University Surplus" ? 5 : 4;
  const pool = itemPoolForLocation(location);
  return Array.from({ length: count }, () => {
    const template = pool[roll(0, pool.length - 1)];
    const config = difficultyConfig(difficulty);
    const condition = conditionForLocation(location);
    const status = itemConditionToStatus(condition);
    const fair = fairMarketValue(template, status, condition);
    const difficultyPrice = location === "Marketplace" ? config.marketplacePrice : config.otherMarketPrice;
    const locationFactor = priceFactorForLocation(location);
    const cappedFactor = location === "Marketplace"
      ? clampStat(locationFactor * difficultyPrice, 0.65, 1.5)
      : location === "Recycling Center"
        ? clampStat(locationFactor * difficultyPrice, 0.18, 1.42)
        : location === "University Surplus"
          ? clampStat(locationFactor * difficultyPrice, 0.3, 1.4)
          : clampStat(locationFactor * difficultyPrice, 0.35, 1.42);
    const price = Math.max(1, Math.round(fair * cappedFactor));
    const pricing = pricingSnapshot(template, status, condition, price);
    return {
      ...template,
      id: id("offer"),
      location,
      price,
      status,
      condition,
      hiddenCondition: hiddenConditionForInventory(condition, location),
      pricing
    };
  });
}

export function createShopInventories(difficulty: Difficulty): Partial<Record<LocationName, Offer[]>> {
  return shopLocations.reduce<Partial<Record<LocationName, Offer[]>>>((shops, location) => {
    shops[location] = marketFor(location, difficulty);
    return shops;
  }, {});
}

export function infrastructureItemTypesNeeded(facility: InfrastructureDefinition): Array<{ label: string; types: ItemType[]; count: number }> {
  const needs: Array<{ label: string; types: ItemType[]; count: number }> = [];
  Object.entries(facility.requirements.assignedTypes ?? {}).forEach(([type, count]) => {
    needs.push({ label: `${count} ${type} staged`, types: [type as ItemType], count: count ?? 0 });
  });
  facility.requirements.assignedAny?.forEach((requirement) => needs.push({
    label: requirement.label,
    types: requirement.types,
    count: requirement.count
  }));
  return needs;
}

export function labStationDefinition(name: LabStationName): LabStationDefinition {
  return labStationCatalog.find((station) => station.name === name) ?? labStationCatalog[0];
}

function labProgressAfterStationChange(state: GameState, stationName: LabStationName, nextLevel: number, addAssignment: boolean) {
  return labProgress({
    ...state,
    labStations: { ...state.labStations, [stationName]: nextLevel },
    labAssignments: addAssignment
      ? [...state.labAssignments, { id: "preview", station: stationName, itemName: "Preview", source: "Purchased" as const }]
      : state.labAssignments
  });
}

function infrastructureProgressAfterUpgrade(state: GameState, facilityName: InfrastructureName, nextLevel: number) {
  return infrastructureProgress({
    ownedInfrastructure: { ...state.ownedInfrastructure, [facilityName]: nextLevel }
  });
}

export function labCapReason(state: GameState, stationName: LabStationName, addAssignment = true) {
  const currentLevel = state.labStations[stationName] ?? 0;
  const station = labStationDefinition(stationName);
  if (currentLevel >= station.maxLevel) return "";
  const phase = mapUpgradePhase(state);
  const projected = labProgressAfterStationChange(state, stationName, currentLevel + 1, addAssignment);
  return projected > phase.cap ? `${capBlockMessage("Lab", phase.cap)} ${phase.next}` : "";
}

export function infrastructureCapReason(state: GameState, facilityName: InfrastructureName) {
  const facility = infrastructureCatalog.find((entry) => entry.name === facilityName);
  if (!facility) return "";
  const currentLevel = state.ownedInfrastructure[facilityName] ?? 0;
  if (currentLevel >= facility.maxLevel) return "";
  const phase = mapUpgradePhase(state);
  const projected = infrastructureProgressAfterUpgrade(state, facilityName, currentLevel + 1);
  return projected > phase.cap ? `${capBlockMessage("Infrastructure", phase.cap)} ${phase.next}` : "";
}

export function usableForLab(item: InventoryItem) {
  const condition = item.condition ?? conditionFromStatus(item.status);
  return (item.status === "Tested" || isReadyStatus(item.status)) && (condition === "Working" || condition === "Refurbished");
}

export function availableLabItems(state: GameState, station: LabStationDefinition) {
  return state.inventory.filter((item) =>
    !isInactiveStatus(item.status) &&
    station.acceptedTypes.includes(item.type) &&
    usableForLab(item)
  );
}

export function matchingStorageForTypes(items: InventoryItem[], types: ItemType[]) {
  return items.filter((item) => types.includes(item.type) && usableForLab(item));
}

export function requirementLabels(requirements: InfrastructureDefinition["requirements"]) {
  const labels: string[] = [];
  if (requirements.labProgress) labels.push(`Lab ${requirements.labProgress}%`);
  if (requirements.anyStationOrProcessed) {
    labels.push(`${requirements.anyStationOrProcessed.station} L${requirements.anyStationOrProcessed.level} or ${requirements.anyStationOrProcessed.processedItems} processed items`);
  }
  if (requirements.stations) {
    Object.entries(requirements.stations).forEach(([station, level]) => labels.push(`${station} L${level}`));
  }
  if (requirements.processedItems) labels.push(`${requirements.processedItems} processed items`);
  if (requirements.assignedTypes) {
    Object.entries(requirements.assignedTypes).forEach(([type, count]) => labels.push(`${count} ${type} assigned`));
  }
  requirements.assignedAny?.forEach((requirement) => labels.push(requirement.label));
  if (requirements.hostingCapacity) labels.push(`Hosting ${requirements.hostingCapacity}`);
  if (requirements.deploymentHistory) labels.push(`${requirements.deploymentHistory} deployments/history`);
  if (requirements.reputation) labels.push(`Rep ${requirements.reputation}`);
  if (requirements.communityTrust) labels.push(`Trust ${requirements.communityTrust}`);
  if (requirements.completedRequests) labels.push(`${requirements.completedRequests} requests`);
  if (requirements.facility) labels.push(`${requirements.facility} owned`);
  return labels;
}

export function infrastructureUnlocked(state: GameState, facility: InfrastructureDefinition) {
  const requirements = facility.requirements;
  const progress = labProgress(state);
  const stats = infrastructureStats(state.ownedInfrastructure, state.labStations);
  const stationRequirementsMet = Object.entries(requirements.stations ?? {}).every(([station, level]) =>
    (state.labStations[station as LabStationName] ?? 0) >= (level ?? 0)
  );
  const typeRequirementsMet = Object.entries(requirements.assignedTypes ?? {}).every(([type, count]) =>
    assignedTypeCount(state, [type as ItemType]) >= (count ?? 0)
  );
  const anyRequirementsMet = requirements.assignedAny?.every((requirement) =>
    assignedTypeCount(state, requirement.types) >= requirement.count
  ) ?? true;
  const stationOrProcessed = !requirements.anyStationOrProcessed ||
    (state.labStations[requirements.anyStationOrProcessed.station] ?? 0) >= requirements.anyStationOrProcessed.level ||
    processedItemCount(state) >= requirements.anyStationOrProcessed.processedItems;
  return (
    progressMeets(progress, requirements.labProgress ?? 0) &&
    stationRequirementsMet &&
    typeRequirementsMet &&
    anyRequirementsMet &&
    stationOrProcessed &&
    (requirements.processedItems ?? 0) <= processedItemCount(state) &&
    (requirements.hostingCapacity ?? 0) <= stats.hostingCapacity &&
    (requirements.deploymentHistory ?? 0) <= processedItemCount(state) &&
    (requirements.reputation ?? 0) <= state.reputation &&
    (requirements.communityTrust ?? 0) <= state.communityTrust &&
    (requirements.completedRequests ?? 0) <= state.completedRequests &&
    (!requirements.facility || state.ownedInfrastructure[requirements.facility] > 0)
  );
}
