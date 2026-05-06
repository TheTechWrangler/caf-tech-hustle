/**
 * gameStatePersistence.ts
 * Save/load, normalization, validation guards, defaulting, and migration helpers
 * for GameState. Contains no UI logic and no gameplay action handlers.
 */

import type {
  StorageStatus, LocationName, ServiceNeed, DonationTier, DonationCondition,
  RevealedDonationCondition, ItemCondition, ItemQuality, Difficulty,
  LoanType, LoanCadence, HostingProjectStatus, InfrastructureName, LabStationName,
  InventoryItem, Offer, CommunityRequest, HostedService, HostingProject,
  Loan, GrantApplication, GrantStatus, LabAssignment, SurpriseDonation,
  WeeklyStats, DailyLedgerEntry, DistrictName, RequestNeed, RequestTemplate,
  GameState, SaveSlot
} from "./types";
import {
  storageStatuses, locations, shopLocations, serviceNeeds, hostingProjectStatuses,
  donationTiers, donationConditions, itemConditions, itemQualities,
  revealedDonationConditions, difficulties, infrastructureNames, labStationNames,
  saveStorageKey, dailyAutosaveStorageKey
} from "./constants";
import {
  itemPool, requestTemplates, hostingProjectCatalog, labStationCatalog, infrastructureCatalog,
  loanCatalog, grantCatalog, donationTierConfigs, districtNames, districtCatalog,
  emptyLabStations, emptyInfrastructure
} from "./data";
import {
  clampStat, roll, id, conditionFromStatus, currentWeekFor, pickWeighted,
  isItemType, shuffle, difficultyConfig, hostingSlotsFor, buyPriceHeat
} from "./utils";
import { isRecord, asNumber, defaultSaveSlots } from "./storage";
import {
  baseFairValue, fairMarketValue, expectedResaleValue, pricingSnapshot,
  refreshPricingForItem, dataCenterUnlockedFor,
  conditionForLocation, hiddenConditionForInventory, marketFor, createShopInventories
} from "./gameHelpers";

// ─── Type guard / validator functions ────────────────────────────────────────

export function isLocation(value: unknown): value is LocationName {
  return typeof value === "string" && locations.includes(value as LocationName);
}

export function isServiceNeed(value: unknown): value is ServiceNeed {
  return typeof value === "string" && serviceNeeds.includes(value as ServiceNeed);
}

export function isHostingProjectStatus(value: unknown): value is HostingProjectStatus {
  return typeof value === "string" && hostingProjectStatuses.includes(value as HostingProjectStatus);
}

export function isDonationTier(value: unknown): value is DonationTier {
  return typeof value === "string" && donationTiers.includes(value as DonationTier);
}

export function isDonationCondition(value: unknown): value is DonationCondition {
  return typeof value === "string" && donationConditions.includes(value as DonationCondition);
}

export function isItemCondition(value: unknown): value is ItemCondition {
  return typeof value === "string" && itemConditions.includes(value as ItemCondition);
}

export function isItemQuality(value: unknown): value is ItemQuality {
  return typeof value === "string" && itemQualities.includes(value as ItemQuality);
}

export function isInfrastructureName(value: unknown): value is InfrastructureName {
  return typeof value === "string" && infrastructureNames.includes(value as InfrastructureName);
}

export function isDifficulty(value: unknown): value is Difficulty {
  return typeof value === "string" && difficulties.includes(value as Difficulty);
}

export function isLoanType(value: unknown): value is LoanType {
  return typeof value === "string" && loanCatalog.some((loan) => loan.type === value);
}

export function isLoanCadence(value: unknown): value is LoanCadence {
  return value === "Weekly" || value === "Monthly";
}

export function isRevealedDonationCondition(value: unknown): value is RevealedDonationCondition {
  return typeof value === "string" && revealedDonationConditions.includes(value as RevealedDonationCondition);
}

export function isStorageStatus(value: unknown): value is StorageStatus {
  return typeof value === "string" && storageStatuses.includes(value as StorageStatus);
}

// ─── Local helpers (not exported) ────────────────────────────────────────────

function hiddenConditionFor(condition: DonationCondition, tier: DonationTier): RevealedDonationCondition {
  if (condition !== "Unknown") return condition;
  const weights = donationTierConfigs[tier].conditionWeights
    .filter((entry) => entry.condition !== "Unknown")
    .map((entry) => ({ value: entry.condition as RevealedDonationCondition, weight: entry.weight }));
  return pickWeighted(weights);
}

// ─── Factory / empty-state helpers ────────────────────────────────────────────

export function emptyWeeklyStats(): WeeklyStats {
  return {
    donated: 0,
    requestsFulfilled: 0,
    itemsSold: 0,
    itemsScrapped: 0,
    itemsAssignedToLab: 0,
    repairsSucceeded: 0,
    repairsFailed: 0,
    repairsJunked: 0,
    grantsApplied: 0,
    grantsApproved: 0,
    grantsRejected: 0,
    grantIncome: 0,
    hostingIncome: 0,
    cashEarned: 0,
    cashSpent: 0
  };
}

export function freshHostingProjects(): HostingProject[] {
  return hostingProjectCatalog.map((project) => ({
    id: project.id,
    status: "Inactive" as const
  }));
}

export function emptyDistrictProgress(): Record<DistrictName, number> {
  return Object.fromEntries(districtNames.map((n) => [n, 0])) as Record<DistrictName, number>;
}

export function startingDistricts(): DistrictName[] {
  return districtCatalog.filter((d) => !d.startLocked).map((d) => d.name);
}

// ─── Request generation (used by normalizeGame and nextDay) ───────────────────

export function generateWeeklyRequests(_week: number, difficulty: Difficulty, unlockedDistricts?: DistrictName[]): CommunityRequest[] {
  const config = difficultyConfig(difficulty);
  const eligible = unlockedDistricts
    ? requestTemplates.filter((t) => !t.district || unlockedDistricts.includes(t.district))
    : requestTemplates;
  return (shuffle(eligible) as RequestTemplate[])
    .slice(0, roll(2, 4))
    .map((template) => {
      const deadlineSwing = difficulty === "Chaos Mode" ? roll(-2, 2) : 0;
      const deadline = roll(template.deadline[0], template.deadline[1]) + config.deadlineDays + deadlineSwing;
      return {
        ...template,
        id: id("req"),
        deadline: Math.max(2, deadline),
        reputationReward: Math.round(roll(template.reputationReward[0], template.reputationReward[1]) * config.reward),
        trustReward: Math.max(1, Math.round(roll(template.trustReward[0], template.trustReward[1]) * config.reward)),
        cashDonation: template.cashDonation && Math.random() > 0.55
          ? Math.round(roll(template.cashDonation[0], template.cashDonation[1]) * config.reward * 0.72)
          : undefined
      };
    });
}

// ─── Normalize functions ──────────────────────────────────────────────────────

export function normalizeStatus(value: unknown): StorageStatus {
  if (isStorageStatus(value)) return value;
  if (value === "Broken" || value === "Needs Parts") return "Needs Repair";
  if (value === "Deployed") return "Deployed to Community";
  if (value === "fixed") return "Ready to Sell";
  return "Incoming";
}

export function normalizeInventory(value: unknown): InventoryItem[] {
  if (!Array.isArray(value)) return [];
  return value.filter(isRecord).map((raw) => {
    const template = itemPool.find((item) => item.name === raw.name) ?? itemPool[0];
    const status = normalizeStatus(raw.status ?? raw.kind);
    const condition = isItemCondition(raw.condition) ? raw.condition : undefined;
    const buyPrice = asNumber(raw.buyPrice, 0);
    const item: InventoryItem = {
      ...template,
      id: typeof raw.id === "string" ? raw.id : id("item"),
      status,
      buyPrice,
      source: typeof raw.source === "string" ? raw.source : undefined,
      condition,
      quality: isItemQuality(raw.quality) ? raw.quality : undefined,
      hiddenCondition: isRevealedDonationCondition(raw.hiddenCondition) ? raw.hiddenCondition : undefined
    };
    return raw.pricing && isRecord(raw.pricing)
      ? {
        ...item,
        pricing: {
          baseFairValue: asNumber(raw.pricing.baseFairValue, baseFairValue(template, condition ?? conditionFromStatus(status))),
          adjustedFairValue: asNumber(raw.pricing.adjustedFairValue, fairMarketValue(template, status, condition)),
          buyPrice: asNumber(raw.pricing.buyPrice, buyPrice),
          expectedResaleValue: asNumber(raw.pricing.expectedResaleValue, expectedResaleValue(template, status, condition)),
          dealLabel: typeof raw.pricing.dealLabel === "string" ? raw.pricing.dealLabel : buyPriceHeat(buyPrice, fairMarketValue(template, status, condition)).label,
          dealClassName: typeof raw.pricing.dealClassName === "string" ? raw.pricing.dealClassName : buyPriceHeat(buyPrice, fairMarketValue(template, status, condition)).className,
          pricedStatus: isStorageStatus(raw.pricing.pricedStatus) ? raw.pricing.pricedStatus : status,
          pricedCondition: isItemCondition(raw.pricing.pricedCondition) ? raw.pricing.pricedCondition : condition ?? conditionFromStatus(status)
        }
      }
      : refreshPricingForItem(item);
  });
}

// Falls back to marketFor() when a location's saved offers are missing/corrupt.
export function normalizeOffers(value: unknown, location: LocationName, difficulty: Difficulty): Offer[] {
  if (!Array.isArray(value)) return marketFor(location, difficulty);
  return value.filter(isRecord).map((raw) => {
    const template = itemPool.find((item) => item.name === raw.name) ?? itemPool[0];
    const condition = isItemCondition(raw.condition) ? raw.condition : conditionForLocation(location);
    const status = normalizeStatus(raw.status);
    const price = Math.max(1, Math.round(asNumber(raw.price, fairMarketValue(template, status, condition))));
    return {
      ...template,
      id: typeof raw.id === "string" ? raw.id : id("offer"),
      location,
      price,
      status,
      condition,
      hiddenCondition: isRevealedDonationCondition(raw.hiddenCondition) ? raw.hiddenCondition : hiddenConditionForInventory(condition, location),
      pricing: raw.pricing && isRecord(raw.pricing)
        ? {
          baseFairValue: asNumber(raw.pricing.baseFairValue, baseFairValue(template, condition)),
          adjustedFairValue: asNumber(raw.pricing.adjustedFairValue, fairMarketValue(template, status, condition)),
          buyPrice: asNumber(raw.pricing.buyPrice, price),
          expectedResaleValue: asNumber(raw.pricing.expectedResaleValue, expectedResaleValue(template, status, condition)),
          dealLabel: typeof raw.pricing.dealLabel === "string" ? raw.pricing.dealLabel : buyPriceHeat(price, fairMarketValue(template, status, condition)).label,
          dealClassName: typeof raw.pricing.dealClassName === "string" ? raw.pricing.dealClassName : buyPriceHeat(price, fairMarketValue(template, status, condition)).className,
          pricedStatus: isStorageStatus(raw.pricing.pricedStatus) ? raw.pricing.pricedStatus : status,
          pricedCondition: isItemCondition(raw.pricing.pricedCondition) ? raw.pricing.pricedCondition : condition
        }
        : pricingSnapshot(template, status, condition, price)
    };
  });
}

// Falls back to createShopInventories() when the whole shopInventories record is missing/corrupt.
export function normalizeShopInventories(value: unknown, difficulty: Difficulty): Partial<Record<LocationName, Offer[]>> {
  if (!isRecord(value)) return createShopInventories(difficulty);
  return shopLocations.reduce<Partial<Record<LocationName, Offer[]>>>((shops, location) => {
    shops[location] = normalizeOffers(value[location], location, difficulty);
    return shops;
  }, {});
}

export function normalizeShopRefreshes(value: unknown): Partial<Record<LocationName, number>> {
  if (!isRecord(value)) return {};
  const result: Partial<Record<LocationName, number>> = {};
  for (const [key, val] of Object.entries(value)) {
    if (isLocation(key) && typeof val === "number") result[key] = val;
  }
  return result;
}

export function normalizeRequests(value: unknown): CommunityRequest[] {
  if (!Array.isArray(value)) return [];
  return value.filter(isRecord).flatMap((raw) => {
    const need = raw.need;
    const kind = raw.kind === "service" || isServiceNeed(need) ? "service" : "item";
    if (kind === "item" && !isItemType(need)) return [];
    if (kind === "service" && !isServiceNeed(need)) return [];
    return [{
      id: typeof raw.id === "string" ? raw.id : id("req"),
      title: typeof raw.title === "string" ? raw.title : "Community Request",
      description: typeof raw.description === "string" ? raw.description : "Someone in the community needs tech help.",
      kind,
      need: need as RequestNeed,
      deadline: asNumber(raw.deadline, 5),
      reputationReward: asNumber(raw.reputationReward, 6),
      trustReward: asNumber(raw.trustReward, 3),
      cashDonation: typeof raw.cashDonation === "number" ? raw.cashDonation : undefined,
      energyCost: typeof raw.energyCost === "number" ? raw.energyCost : undefined,
      cashCost: typeof raw.cashCost === "number" ? raw.cashCost : undefined,
      district: districtNames.includes(raw.district as DistrictName) ? raw.district as DistrictName : undefined
    }];
  });
}

export function normalizePendingDonation(value: unknown): SurpriseDonation | null {
  if (!isRecord(value) || !Array.isArray(value.items)) return null;
  const tier = isDonationTier(value.tier) ? value.tier : "Small";
  const items = value.items.filter(isRecord).map((raw) => {
    const template = itemPool.find((item) => item.name === raw.name) ?? itemPool[0];
    const condition = isDonationCondition(raw.condition) ? raw.condition : "Unknown";
    const resolvedHiddenCondition = isRevealedDonationCondition(raw.hiddenCondition)
      ? raw.hiddenCondition
      : hiddenConditionFor(condition, tier);
    return {
      ...template,
      id: typeof raw.id === "string" ? raw.id : id("donation-item"),
      condition,
      hiddenCondition: resolvedHiddenCondition
    };
  });
  if (!items.length) return null;
  return {
    id: typeof value.id === "string" ? value.id : id("donation"),
    donor: typeof value.donor === "string" ? value.donor : "Mystery donor",
    tier,
    flavor: typeof value.flavor === "string" ? value.flavor : "A surprise donation is waiting to be sorted.",
    sorted: Boolean(value.sorted),
    items
  };
}

export function normalizeInfrastructure(value: unknown): Record<InfrastructureName, number> {
  const owned = emptyInfrastructure();
  if (!isRecord(value)) return owned;
  Object.entries(value).forEach(([name, level]) => {
    if (!isInfrastructureName(name)) return;
    const facility = infrastructureCatalog.find((entry) => entry.name === name);
    if (!facility) return;
    owned[name] = clampStat(Math.floor(asNumber(level, 0)), 0, facility.maxLevel);
  });
  return owned;
}

export function normalizeLabStations(value: unknown): Record<LabStationName, number> {
  const stations = emptyLabStations();
  if (!isRecord(value)) return stations;
  Object.entries(value).forEach(([name, level]) => {
    if (!labStationNames.includes(name as LabStationName)) return;
    const station = labStationCatalog.find((s) => s.name === name) ?? labStationCatalog[0];
    stations[name as LabStationName] = clampStat(Math.floor(asNumber(level, 0)), 0, station.maxLevel);
  });
  return stations;
}

export function normalizeLabAssignments(value: unknown): LabAssignment[] {
  if (!Array.isArray(value)) return [];
  return value.filter(isRecord).flatMap((raw) => {
    if (!labStationNames.includes(raw.station as LabStationName)) return [];
    const source = raw.source === "Storage" || raw.source === "Purchased" ? raw.source : "Purchased";
    return [{
      id: typeof raw.id === "string" ? raw.id : id("lab"),
      station: raw.station as LabStationName,
      itemName: typeof raw.itemName === "string" ? raw.itemName : "Lab equipment",
      itemType: isItemType(raw.itemType) ? raw.itemType : undefined,
      itemId: typeof raw.itemId === "string" ? raw.itemId : undefined,
      source
    }];
  });
}

export function normalizeHostedServices(value: unknown): HostedService[] {
  if (!Array.isArray(value)) return [];
  return value.filter(isRecord).flatMap((raw) => {
    if (!isServiceNeed(raw.need)) return [];
    const slots = Math.max(0, Math.floor(asNumber(raw.slots, hostingSlotsFor(raw.need))));
    if (slots <= 0) return [];
    return [{
      id: typeof raw.id === "string" ? raw.id : id("hosted"),
      title: typeof raw.title === "string" ? raw.title : raw.need,
      need: raw.need,
      slots,
      uptime: clampStat(asNumber(raw.uptime, 99), 55, 100),
      projectId: typeof raw.projectId === "string" ? raw.projectId : undefined
    }];
  });
}

export function normalizeHostingProjects(value: unknown): HostingProject[] {
  const saved = Array.isArray(value) ? value.filter(isRecord) : [];
  return hostingProjectCatalog.map((definition) => {
    const found = saved.find((entry) => entry.id === definition.id);
    return {
      id: definition.id,
      status: isHostingProjectStatus(found?.status) ? found.status : "Inactive",
      startedDay: typeof found?.startedDay === "number" ? Math.max(1, Math.floor(found.startedDay)) : undefined,
      equipmentIds: Array.isArray(found?.equipmentIds) ? found.equipmentIds.filter((entry): entry is string => typeof entry === "string") : undefined,
      equipmentNames: Array.isArray(found?.equipmentNames) ? found.equipmentNames.filter((entry): entry is string => typeof entry === "string") : undefined
    };
  });
}

export function normalizeLoans(value: unknown): Loan[] {
  if (!Array.isArray(value)) return [];
  return value.filter(isRecord).flatMap((raw) => {
    if (!isLoanType(raw.type)) return [];
    return [{
      id: typeof raw.id === "string" ? raw.id : id("loan"),
      type: raw.type as LoanType,
      cadence: isLoanCadence(raw.cadence) ? raw.cadence : "Weekly",
      amount: Math.max(0, Math.round(asNumber(raw.amount, 0))),
      interestRate: Math.max(0, asNumber(raw.interestRate, 0.1)),
      payment: Math.max(1, Math.round(asNumber(raw.payment, 20))),
      label: typeof raw.label === "string" ? raw.label : raw.type,
      remainingBalance: Math.max(0, Math.round(asNumber(raw.remainingBalance, 0))),
      nextDueDay: Math.max(2, Math.round(asNumber(raw.nextDueDay, 7))),
      missedPayments: Math.max(0, Math.round(asNumber(raw.missedPayments, 0)))
    }];
  });
}

export function normalizeLedger(value: unknown, currentDay: number, cash: number): DailyLedgerEntry[] {
  if (!Array.isArray(value)) return [{ day: currentDay, startingCash: cash, income: 0, expenses: 0, endingCash: cash }];
  const entries = value.filter(isRecord).flatMap((raw) => {
    const day = Math.max(1, Math.floor(asNumber(raw.day, 0)));
    if (day < 1) return [];
    const startingCash = Math.max(0, Math.round(asNumber(raw.startingCash, cash)));
    const income = Math.max(0, Math.round(asNumber(raw.income, 0)));
    const expenses = Math.max(0, Math.round(asNumber(raw.expenses, 0)));
    return [{
      day,
      startingCash,
      income,
      expenses,
      endingCash: Math.max(0, Math.round(asNumber(raw.endingCash, startingCash + income - expenses)))
    }];
  });
  if (!entries.some((e) => e.day === currentDay)) {
    entries.push({ day: currentDay, startingCash: cash, income: 0, expenses: 0, endingCash: cash });
  }
  return entries.slice(-60);
}

export function normalizeGrants(value: unknown): GrantApplication[] {
  const saved = Array.isArray(value) ? value.filter(isRecord) : [];
  return grantCatalog.map((grant) => {
    const found = saved.find((entry) => entry.id === grant.id);
    const status = ["Available", "Pending Review", "Approved", "Rejected", "On Cooldown"].includes(String(found?.status))
      ? String(found?.status) as GrantStatus
      : "Available";
    return {
      id: grant.id,
      status,
      daysRemaining: Math.max(0, Math.floor(asNumber(found?.daysRemaining, 0))),
      cooldownRemaining: Math.max(0, Math.floor(asNumber(found?.cooldownRemaining, 0))),
      lastResult: found?.lastResult === "Approved" || found?.lastResult === "Rejected" ? found.lastResult : undefined,
      lastMessage: typeof found?.lastMessage === "string" ? found.lastMessage : undefined
    };
  });
}

// ─── Game state reconciliation / migration ────────────────────────────────────

export function reconcileLabInfraProgress(state: GameState): GameState {
  const reconciledLabStations = { ...state.labStations };
  labStationCatalog.forEach((station) => {
    const inferredLevel = state.labAssignments.filter((assignment) =>
      assignment.station === station.name &&
      !assignment.id.startsWith("infra-") &&
      (assignment.source === "Purchased" || assignment.id.startsWith("lab"))
    ).length;
    reconciledLabStations[station.name] = clampStat(
      Math.max(reconciledLabStations[station.name] ?? 0, inferredLevel),
      0,
      station.maxLevel
    );
  });
  const reconciled: GameState = { ...state, labStations: reconciledLabStations };
  return {
    ...reconciled,
    dataCenterUnlocked: reconciled.dataCenterUnlocked || dataCenterUnlockedFor(reconciled)
  };
}

// ─── Top-level normalizer ─────────────────────────────────────────────────────

export function normalizeGame(data: unknown, newGameFn: (difficulty?: Difficulty) => GameState): GameState {
  if (!isRecord(data)) return newGameFn();
  const difficulty = isDifficulty(data.difficulty) ? data.difficulty : "Normal";
  const fresh = newGameFn(difficulty);
  const day = Math.max(1, asNumber(data.day, fresh.day));
  const location = isLocation(data.location) ? data.location : fresh.location;
  const requests = normalizeRequests(data.requests);
  const ownedInfrastructure = normalizeInfrastructure(data.ownedInfrastructure);
  const labStations = normalizeLabStations(data.labStations);
  const labAssignments = normalizeLabAssignments(data.labAssignments);
  const shopInventories = normalizeShopInventories(data.shopInventories, difficulty);
  const cash = asNumber(data.cash, fresh.cash);
  const normalized: GameState = {
    ...fresh,
    day,
    cash,
    reputation: asNumber(data.reputation, fresh.reputation),
    communityTrust: asNumber(data.communityTrust, 0),
    energy: asNumber(data.energy, fresh.energy),
    stress: asNumber(data.stress, fresh.stress),
    inventory: normalizeInventory(data.inventory),
    offers: shopInventories[location] ?? [],
    shopInventories,
    shopRefreshes: normalizeShopRefreshes(data.shopRefreshes),
    requests: requests.length ? requests : generateWeeklyRequests(currentWeekFor(day), difficulty),
    requestWeek: asNumber(data.requestWeek, currentWeekFor(day)),
    pendingDonation: normalizePendingDonation(data.pendingDonation),
    ownedInfrastructure,
    labStations,
    labAssignments,
    completedRequests: Math.max(0, Math.floor(asNumber(data.completedRequests, 0))),
    hostedServices: normalizeHostedServices(data.hostedServices),
    hostingProjects: normalizeHostingProjects(data.hostingProjects),
    repairsToday: Math.max(0, Math.floor(asNumber(data.repairsToday, 0))),
    extraRepairsPurchasedThisWeek: Math.max(0, Math.floor(asNumber(data.extraRepairsPurchasedThisWeek, 0))),
    difficulty,
    creditScore: clampStat(Math.round(asNumber(data.creditScore, fresh.creditScore)), 0, 100),
    loans: normalizeLoans(data.loans),
    grants: normalizeGrants(data.grants),
    location,
    log: Array.isArray(data.log) ? data.log.filter((entry): entry is string => typeof entry === "string").slice(0, 12) : fresh.log,
    weeklyStats: emptyWeeklyStats(),
    weekStart: (() => {
      const ws: Record<string, unknown> = isRecord(data.weekStart) ? data.weekStart : {};
      return { cash: asNumber(ws.cash, fresh.cash), reputation: asNumber(ws.reputation, 0), communityTrust: asNumber(ws.communityTrust, 0), labProgress: asNumber(ws.labProgress, 0) };
    })(),
    weeklyReport: null,
    reportHistory: Array.isArray(data.reportHistory) ? data.reportHistory.filter(isRecord).slice(0, 10).map((r) => ({
      week: asNumber(r.week, 1), day: asNumber(r.day, 7), donated: asNumber(r.donated, 0), requestsFulfilled: asNumber(r.requestsFulfilled, 0),
      itemsSold: asNumber(r.itemsSold, 0), itemsScrapped: asNumber(r.itemsScrapped, 0), itemsAssignedToLab: asNumber(r.itemsAssignedToLab, 0),
      repairsSucceeded: asNumber(r.repairsSucceeded, 0), repairsFailed: asNumber(r.repairsFailed, 0), repairsJunked: asNumber(r.repairsJunked, 0),
      grantsApplied: asNumber(r.grantsApplied, 0), grantsApproved: asNumber(r.grantsApproved, 0), grantsRejected: asNumber(r.grantsRejected, 0), grantIncome: asNumber(r.grantIncome, 0), hostingIncome: asNumber(r.hostingIncome, 0),
      cashEarned: asNumber(r.cashEarned, 0), cashSpent: asNumber(r.cashSpent, 0), reputationGained: asNumber(r.reputationGained, 0),
      trustGained: asNumber(r.trustGained, 0), labProgressGained: asNumber(r.labProgressGained, 0),
      hostedServicesActive: asNumber(r.hostedServicesActive, 0), avgUptime: asNumber(r.avgUptime, 0), loansActive: asNumber(r.loansActive, 0),
      flavor: typeof r.flavor === "string" ? r.flavor : "A week of tech hustle."
    })) : [],
    ledger: normalizeLedger(data.ledger, day, cash),
    unlockedDistricts: Array.isArray(data.unlockedDistricts)
      ? data.unlockedDistricts.filter((d): d is DistrictName => districtNames.includes(d as DistrictName))
      : startingDistricts(),
    districtProgress: (() => {
      const base = emptyDistrictProgress();
      if (isRecord(data.districtProgress)) {
        districtNames.forEach((n) => {
          const v = (data.districtProgress as Record<string, unknown>)[n];
          if (typeof v === "number") base[n] = Math.max(0, Math.floor(v));
        });
      }
      return base;
    })(),
    dataCenterUnlocked: Boolean(data.dataCenterUnlocked)
  };
  return reconcileLabInfraProgress(normalized);
}

export function normalizeSaveSlots(value: unknown, newGameFn: (difficulty?: Difficulty) => GameState): SaveSlot[] {
  const defaults = defaultSaveSlots();
  if (!Array.isArray(value)) return defaults;
  return defaults.map((fallback) => {
    const raw = value.find((slot) => isRecord(slot) && asNumber(slot.id, 0) === fallback.id);
    if (!isRecord(raw)) return fallback;
    return {
      id: fallback.id,
      name: typeof raw.name === "string" && raw.name.trim() ? raw.name : fallback.name,
      savedAt: typeof raw.savedAt === "string" ? raw.savedAt : null,
      game: raw.game ? normalizeGame(raw.game, newGameFn) : null
    };
  });
}

// ─── Save / load ──────────────────────────────────────────────────────────────

export function readSaveSlots(newGameFn: (difficulty?: Difficulty) => GameState): SaveSlot[] {
  try {
    const raw = window.localStorage.getItem(saveStorageKey);
    return raw ? normalizeSaveSlots(JSON.parse(raw), newGameFn) : defaultSaveSlots();
  } catch {
    return defaultSaveSlots();
  }
}

export function readDailyAutosave(newGameFn: (difficulty?: Difficulty) => GameState): SaveSlot | null {
  try {
    const raw = window.localStorage.getItem(dailyAutosaveStorageKey);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!isRecord(parsed) || !parsed.game) return null;
    return {
      id: 0,
      name: "Daily Autosave",
      savedAt: typeof parsed.savedAt === "string" ? parsed.savedAt : null,
      game: normalizeGame(parsed.game, newGameFn)
    };
  } catch {
    return null;
  }
}
