import type { GameState, HostingProject, ItemTemplate, ItemCondition, StorageStatus, InventoryItem, HostingProjectDefinition, GrantId, GrantApplication, DistrictConfig, PricingSnapshot, ItemQuality, InfrastructureDefinition, LabStationName, ItemType, DailyUpdateData, DailyUpdateLine } from "./types";
import { HOSTING_WEEKLY_PAYOUT_FACTOR } from "./constants";
import { hostingProjectCatalog, grantCatalog, districtNames } from "./data";
import { infrastructureStats, infrastructureProgress, progressMeets, conditionFromStatus, conditionMultiplier, isInactiveStatus, isReadyStatus, hostingSlotsUsed, labProgress, stableRatio, buyPriceHeat } from "./utils";

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

export function buildDailyUpdate(prev: GameState, next: GameState): DailyUpdateData {
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

  return { day: next.day, netCash, lines, newWeeklyReport, newDistricts };
}
