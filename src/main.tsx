import React from "react";
import { createRoot } from "react-dom/client";
import {
  BarChart2,
  Building2,
  ClipboardList,
  CreditCard,
  Cpu,
  DollarSign,
  Gift,
  HardDrive,
  HeartHandshake,
  Package,
  Recycle,
  Save,
  ShieldCheck,
  Trash2,
  Wrench,
  Zap
} from "lucide-react";
import "./styles.css";
import type {
  ItemType, StorageStatus, LocationName, ServiceNeed, RequestNeed,
  DonationTier, DonationCondition, RevealedDonationCondition, ItemCondition,
  ItemQuality, Difficulty, OpsTab, MainScreen, LoanType, LoanCadence,
  GrantId, GrantStatus, HostingProjectStatus, ShopForSection,
  InfrastructureName, LabStationName, ItemTemplate, PricingSnapshot,
  InventoryItem, Offer, CommunityRequest, HostedService,
  HostingEquipmentRequirement, HostingProjectDefinition, HostingProject,
  Loan, GrantDefinition, GrantApplication, ShopForNeed,
  SurpriseDonationItem, SurpriseDonation, LabAssignment,
  WeeklyStats, WeeklyReport, DailyLedgerEntry, DistrictName,
  GameState, SaveSlot, DonationDestination, FutureDonationDestination,
  RequestTemplate, DonationTierConfig, LabStationDefinition,
  InfrastructureDefinition, LoanDefinition, DistrictConfig,
  PriceHeat, BusinessOffer, BulkLotDefinition, MapUpgradePhase,
  OperationsLayout, DailyUpdateData
} from "./types";
import {
  locations, shopLocations, coreMarketLocations, mainScreens, districtLocations,
  storageStatuses, itemTypes, serviceNeeds, hostingProjectStatuses, readyStatuses,
  donationTiers, donationConditions, itemConditions, itemQualities,
  revealedDonationConditions, difficulties, intakeBacklogStatuses,
  infrastructureNames, labStationNames,
  baseStorageCapacity, baseRepairQueue, baseHostingCapacity, baseReliability,
  CLEAN_TEST_DESTROY_CHANCE, HIGH_RISK_DESTROY_CHANCE,
  REQUIRE_MANUAL_UPGRADE_ITEM_SELECTION, PROGRESSION_GATE_TOLERANCE,
  HOSTING_PAYOUT_INTERVAL_DAYS, HOSTING_WEEKLY_PAYOUT_FACTOR,
  saveStorageKey, dailyAutosaveStorageKey, operationsLayoutStorageKey, saveSlotCount,
  difficultyConfigs, labTiers, infrastructureTiers, defaultOperationsLayout
} from "./constants";
import {
  itemPool, eventText, requestTemplates, hostingProjectCatalog,
  emptyLabStations, labStationCatalog,
  emptyInfrastructure, infrastructureCatalog,
  loanCatalog, grantCatalog,
  districtNames, districtCatalog,
  mixedBulkLot, bulkLotGroups
} from "./data";
import {
  clampStat, roll, rollFloat, rollFloatSeeded, currentWeekFor,
  stableHash, stableRatio, id,
  shuffle, pickOne, pickWeighted,
  progressMeets, snapProgressMilestone,
  isReadyStatus, isInactiveStatus, isItemType,
  conditionFromStatus, conditionMultiplier,
  buyPriceHeat, sellPriceHeat,
  profitText, priceDifferenceText, sellDifferenceText,
  bulkLotNeedText, capBlockMessage, deploymentLabel, weeklyReportFlavor,
  actionEnergyCost,
  hostingSlotsFor, hostingSlotsUsed, averageUptime,
  hostingWeeklyPayout, nextHostingPayoutDay,
  infrastructureCost, labStationCost,
  difficultyConfig,
  labBonuses, infrastructureStats, labProgress, infrastructureProgress,
  labTierInfo, infrastructureTierInfo, mapUpgradePhase,
  maxEnergyFor, energyStackCapFor, dailyEnergyGainFor, dailyEnergyFor
} from "./utils";
import {
  baseResaleValue, fairMarketValue, expectedResaleValue, itemFairValue, itemResaleEstimate,
  usableForHosting, selectHostingEquipment, hostingProjectAvailability,
  hostingProjectStateFor, completedHostingDefinitions,
  weeklyHostingIncome, hostingSlotUnlockText,
  freshGrants, grantStateFor,
  dataCenterRequirements, districtUnlockHint, districtRequirementRows,
  dataCenterUnlockedFor, donatedDeviceCount, infrastructureLevelTotal,
  baseFairValue, scrapValue, pricingSnapshot,
  isHighEndBusinessItem, deriveItemQuality, refreshPricingForItem,
  processedItemCount, assignedTypeCount, unmetInfrastructureRequirements,
  buildDailyUpdate, calculateOperatingCosts,
  conditionForLocation, hiddenConditionForInventory, marketFor, createShopInventories
} from "./gameHelpers";
import {
  isRecord, asNumber,
  defaultSaveSlots, writeSaveSlots, writeDailyAutosave,
  latestSavedSlot, saveSlotSummary, formatSavedTime,
  normalizeOperationsSizes, normalizeOperationsLayout,
  readOperationsLayout, writeOperationsLayout
} from "./storage";
import {
  isLocation, isServiceNeed, isHostingProjectStatus, isDonationTier,
  isDonationCondition, isItemCondition, isItemQuality, isInfrastructureName,
  isDifficulty, isLoanType, isLoanCadence, isRevealedDonationCondition, isStorageStatus,
  emptyWeeklyStats, freshHostingProjects, emptyDistrictProgress, startingDistricts,
  generateWeeklyRequests,
  normalizeStatus, normalizeInventory, normalizeOffers, normalizeShopInventories,
  normalizeShopRefreshes, normalizeRequests, normalizePendingDonation,
  normalizeInfrastructure, normalizeLabStations, normalizeLabAssignments,
  normalizeHostedServices, normalizeHostingProjects, normalizeLoans,
  normalizeLedger, normalizeGrants,
  reconcileLabInfraProgress, normalizeGame, normalizeSaveSlots,
  readSaveSlots, readDailyAutosave
} from "./gameStatePersistence";
import { ledgerEntryFor, ensureLedgerDay, withCashChange, startLedgerDay } from "./ledgerHelpers";
import { itemQuality, businessOfferForItem, businessSaleValue, repairJunkChance, cleanTestDestroyChance, repairNumbers } from "./repairHelpers";
import { rollDonationTier, hiddenConditionFor, generateSurpriseDonation, donationConditionToStatus } from "./donationHelpers";
import { grantApprovalChance, grantPayout, approvedGrantMessage, rejectedGrantMessage, processGrantDay } from "./grantHelpers";
import { Stat } from "./components/Stat";
import { MilestoneList } from "./components/MilestoneList";
import { ShopForPanel } from "./components/ShopForPanel";
import { PanelTitle } from "./components/PanelTitle";
import { OperationsDemandPanel } from "./components/OperationsDemandPanel";
import { MatchingItemButtons } from "./components/MatchingItemButtons";
import { DonationEventCard } from "./components/DonationEventCard";
import { HostingProjectCard } from "./components/HostingProjectCard";
import { DailyUpdateModal } from "./components/DailyUpdateModal";


function districtMarketStores(district: DistrictName) {
  return (districtLocations[district] ?? []).filter((location) => shopLocations.includes(location));
}

function marketLocationsForDistricts(unlockedDistricts: DistrictName[]) {
  const seen = new Set<LocationName>();
  const unlockedMarketLocations: LocationName[] = [];
  districtCatalog.forEach((district) => {
    if (!unlockedDistricts.includes(district.name)) return;
    districtMarketStores(district.name).forEach((location) => {
      if (seen.has(location)) return;
      seen.add(location);
      unlockedMarketLocations.push(location);
    });
  });
  return unlockedMarketLocations.length ? unlockedMarketLocations : coreMarketLocations.filter((location) => shopLocations.includes(location));
}

function districtForMarketLocation(location: LocationName) {
  const district = districtCatalog.find((entry) => districtMarketStores(entry.name).includes(location));
  return district?.name ?? locationToDistrict(location);
}

function unlockedDistrictsWithoutMarketStores(unlockedDistricts: DistrictName[]) {
  return districtCatalog
    .filter((district) => unlockedDistricts.includes(district.name))
    .filter((district) => district.name !== "Garage" && districtMarketStores(district.name).length === 0)
    .map((district) => district.name);
}

function locationToDistrict(location: LocationName): DistrictName {
  for (const [district, locs] of Object.entries(districtLocations) as [DistrictName, LocationName[]][]) {
    if (locs.includes(location)) return district;
  }
  return "Neighborhood";
}

















function difficultyStress(state: Pick<GameState, "difficulty">, amount: number) {
  return Math.max(0, Math.ceil(amount * difficultyConfig(state.difficulty).stressGain));
}

function chaosSwing(difficulty: Difficulty, low: number, high: number) {
  return difficulty === "Chaos Mode" ? roll(low, high) : 0;
}




function checkDistrictUnlocks(state: GameState, prog: number): { newDistricts: DistrictName[]; messages: string[] } {
  const newDistricts: DistrictName[] = [];
  const messages: string[] = [];
  for (const district of districtCatalog) {
    if (state.unlockedDistricts.includes(district.name)) continue;
    const req = district.unlockRequirements;
    if (req.communityTrust !== undefined && state.communityTrust < req.communityTrust) continue;
    if (req.reputation !== undefined && state.reputation < req.reputation) continue;
    if (req.completedRequests !== undefined && state.completedRequests < req.completedRequests) continue;
    if (req.labProgress !== undefined && !progressMeets(prog, req.labProgress)) continue;
    newDistricts.push(district.name);
    messages.push(`[ DISTRICT UNLOCKED ] ${district.name}: ${district.unlockMessage}`);
  }
  return { newDistricts, messages };
}




function sellOfferValue(item: InventoryItem, state: Pick<GameState, "reputation" | "communityTrust" | "difficulty">) {
  const fair = itemFairValue(item);
  const difficultyBump = state.difficulty === "Easy" ? 0.02 : state.difficulty === "Hard" ? -0.06 : state.difficulty === "Chaos Mode" ? 0 : 0;
  const trustBump = Math.min(0.1, (state.reputation + state.communityTrust) / 620);
  const readyBump = item.status === "Ready to Sell" ? 0.02 : item.status === "Ready to Donate" ? -0.08 : -0.12;
  return Math.max(1, Math.round(fair * clampStat(0.82 + difficultyBump + trustBump + readyBump, 0.75, 0.95)));
}



// Bulk Buyers: lower per-item value than Business Sales, but only for lots.
// Parts lots can absorb needs-repair gear; normal lots want processed, sellable items.
function bulkItemValue(item: InventoryItem): number {
  const fair = itemFairValue(item);
  const factor = item.status === "Ready to Sell" || item.condition === "Refurbished" ? 0.85 : item.status === "Needs Repair" ? 0.65 : 0.74;
  return Math.max(1, Math.round(fair * factor));
}

function businessSaleReason(item: InventoryItem): string {
  if (item.status === "Junked") return "This item is permanently junked. Scrap it for parts.";
  if (isInactiveStatus(item.status)) return `This item is already ${item.status}.`;
  if (item.status !== "Ready to Sell" && item.status !== "Tested") return "Business buyers only want cleaned and tested ready items.";
  const condition = item.condition ?? conditionFromStatus(item.status);
  if (condition === "Broken" || condition === "Needs Parts" || condition === "Unknown") return "Use Bulk Buyers or Scrap for lower-quality items.";
  const quality = itemQuality(item);
  if (quality === "Poor") return "Use Bulk Buyers or Scrap for lower-quality items.";
  return "Ready for Business Sales.";
}

// Items eligible for Business Sales: cleaned, tested, business-ready single items.
function isBusinessSaleEligible(item: InventoryItem): boolean {
  return businessSaleReason(item) === "Ready for Business Sales.";
}

// Items eligible for normal Bulk Buyers lots: processed and sellable.
function isBulkEligible(item: InventoryItem): boolean {
  return item.status === "Tested" || item.status === "Ready to Sell" || item.status === "Ready to Donate";
}

function isPartsLotEligible(item: InventoryItem): boolean {
  return isBulkEligible(item) || item.status === "Needs Repair";
}



function bulkLotEligibleItems(items: InventoryItem[], lot: BulkLotDefinition): InventoryItem[] {
  return items.filter((item) => {
    if (isInactiveStatus(item.status)) return false;
    if (lot.types && !lot.types.includes(item.type)) return false;
    return lot.partsOnly ? isPartsLotEligible(item) : isBulkEligible(item);
  });
}


function activeItemCount(inventory: InventoryItem[]) {
  return inventory.filter((item) => !isInactiveStatus(item.status)).length;
}

function intakeBacklogCount(inventory: InventoryItem[]) {
  return inventory.filter((item) => intakeBacklogStatuses.includes(item.status)).length;
}


function labStationDefinition(name: LabStationName) {
  return labStationCatalog.find((station) => station.name === name) ?? labStationCatalog[0];
}



function labMilestone(progress: number) {
  return labTierInfo(progress).current.name;
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

function labCapReason(state: GameState, stationName: LabStationName, addAssignment = true) {
  const currentLevel = state.labStations[stationName] ?? 0;
  const station = labStationDefinition(stationName);
  if (currentLevel >= station.maxLevel) return "";
  const phase = mapUpgradePhase(state);
  const projected = labProgressAfterStationChange(state, stationName, currentLevel + 1, addAssignment);
  return projected > phase.cap ? `${capBlockMessage("Lab", phase.cap)} ${phase.next}` : "";
}

function infrastructureCapReason(state: GameState, facilityName: InfrastructureName) {
  const facility = infrastructureCatalog.find((entry) => entry.name === facilityName);
  if (!facility) return "";
  const currentLevel = state.ownedInfrastructure[facilityName] ?? 0;
  if (currentLevel >= facility.maxLevel) return "";
  const phase = mapUpgradePhase(state);
  const projected = infrastructureProgressAfterUpgrade(state, facilityName, currentLevel + 1);
  return projected > phase.cap ? `${capBlockMessage("Infrastructure", phase.cap)} ${phase.next}` : "";
}

function usableForLab(item: InventoryItem) {
  const condition = item.condition ?? conditionFromStatus(item.status);
  return (item.status === "Tested" || isReadyStatus(item.status)) && (condition === "Working" || condition === "Refurbished");
}

function availableLabItems(state: GameState, station: LabStationDefinition) {
  return state.inventory.filter((item) =>
    !isInactiveStatus(item.status) &&
    station.acceptedTypes.includes(item.type) &&
    usableForLab(item)
  );
}

function infrastructureStagingStationFor(type: ItemType): LabStationName {
  if (type === "Network" || type === "Cables") return "Network Corner";
  if (type === "Server" || type === "Workstation" || type === "Mini PC" || type === "Storage") return "Server Rack";
  return "Testing Bench";
}

function infrastructureItemTypesNeeded(facility: InfrastructureDefinition): Array<{ label: string; types: ItemType[]; count: number }> {
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

function matchingStorageForTypes(items: InventoryItem[], types: ItemType[]) {
  return items.filter((item) => types.includes(item.type) && usableForLab(item));
}

function uniqueShopForNeeds(needs: ShopForNeed[]) {
  const seen = new Set<string>();
  return needs.filter((need) => {
    const key = `${need.section}:${need.type}:${need.label}:${need.detail}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function shopForNeeds(state: GameState): ShopForNeed[] {
  const requestNeeds: ShopForNeed[] = state.requests
    .filter((request) => request.kind === "item" && isItemType(request.need) && !requestAvailability(state, request).canFulfill)
    .sort((a, b) => a.deadline - b.deadline)
    .map((request) => ({
      id: `request-${request.id}`,
      section: "Requests" as const,
      type: request.need as ItemType,
      label: `${request.need} needed`,
      detail: request.title,
      badge: "Request Need" as const,
      priority: 100 - request.deadline
    }));

  const labNeeds: ShopForNeed[] = labStationCatalog
    .filter((station) => (state.labStations[station.name] ?? 0) < station.maxLevel && availableLabItems(state, station).length === 0)
    .map((station) => ({
      id: `lab-${station.name}`,
      section: "Lab" as const,
      type: station.purchaseItemType ?? station.acceptedTypes[0],
      label: `${station.purchaseItemType ?? station.acceptedTypes[0]} for ${station.name}`,
      detail: station.benefits.slice(0, 2).join(" + "),
      badge: "Lab Need" as const,
      priority: 50 - (state.labStations[station.name] ?? 0)
    }));

  const buyerTypes: Array<{ type: ItemType; label: string; detail: string }> = [
    { type: "Laptop", label: "Refurbished Laptop", detail: "selective Business Sales" },
    { type: "Workstation", label: "Business Workstation", detail: "premium buyer candidate" },
    { type: "Mini PC", label: "Mini PC", detail: "compact business-ready gear" },
    { type: "Server", label: "Server Parts", detail: "high-end buyer interest" }
  ];
  const buyerNeeds: ShopForNeed[] = buyerTypes.map((need, index) => ({
    id: `buyer-${need.type}`,
    section: "Buyers" as const,
    type: need.type,
    label: need.label,
    detail: need.detail,
    badge: "Buyer Wants" as const,
    priority: 20 - index
  }));

  return uniqueShopForNeeds([...requestNeeds, ...labNeeds, ...buyerNeeds])
    .sort((a, b) => b.priority - a.priority)
    .slice(0, 8);
}

function shopForBadgesForOffer(offer: Offer, needs: ShopForNeed[]) {
  const badges: ShopForNeed["badge"][] = [];
  if (needs.some((need) => need.section === "Requests" && need.type === offer.type)) badges.push("Request Need");
  if (needs.some((need) => need.section === "Lab" && need.type === offer.type)) badges.push("Lab Need");
  if (needs.some((need) => need.section === "Buyers" && need.type === offer.type && isHighEndBusinessItem(offer))) badges.push("Buyer Wants");
  return badges;
}

function requirementLabels(requirements: InfrastructureDefinition["requirements"]) {
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

function infrastructureUnlocked(state: GameState, facility: InfrastructureDefinition) {
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

function serviceUptimeChange(services: HostedService[], amount: number) {
  return services.map((service) => ({
    ...service,
    uptime: clampStat(service.uptime + amount, 55, 100)
  }));
}

function loanRequirementLabels(requirements: LoanDefinition["requirements"]) {
  const labels: string[] = [];
  if (requirements.reputation) labels.push(`Rep ${requirements.reputation}`);
  if (requirements.communityTrust) labels.push(`Trust ${requirements.communityTrust}`);
  if (requirements.completedRequests) labels.push(`${requirements.completedRequests} requests`);
  if (requirements.maxLoans) labels.push(`Max ${requirements.maxLoans} active loans`);
  return labels;
}

function activeLoanCountByType(state: GameState, type: LoanType) {
  return state.loans.filter((loan) => loan.type === type).length;
}

function loanUnlocked(state: GameState, definition: LoanDefinition) {
  const requirements = definition.requirements;
  return (
    (requirements.reputation ?? 0) <= state.reputation &&
    (requirements.communityTrust ?? 0) <= state.communityTrust &&
    (requirements.completedRequests ?? 0) <= state.completedRequests &&
    (requirements.maxLoans ?? 99) > state.loans.length &&
    activeLoanCountByType(state, definition.type) < definition.maxActive
  );
}

function effectiveLoanInterest(state: GameState, definition: LoanDefinition) {
  const config = difficultyConfig(state.difficulty);
  const loanStack = state.loans.length * 0.025;
  const creditPenalty = Math.max(0, 70 - state.creditScore) / 200;
  const chaos = state.difficulty === "Chaos Mode" ? roll(-2, 5) / 100 : 0;
  return Math.max(0.04, definition.baseInterest * config.loanInterest + loanStack + creditPenalty + chaos);
}

function nextLoanDueDay(day: number, cadence: LoanCadence) {
  return day + (cadence === "Weekly" ? 7 : 28);
}

function createLoan(state: GameState, definition: LoanDefinition): Loan {
  const interestRate = effectiveLoanInterest(state, definition);
  const remainingBalance = Math.round(definition.amount * (1 + interestRate));
  const payment = Math.max(10, Math.round(definition.basePayment * difficultyConfig(state.difficulty).loanInterest));
  return {
    id: id("loan"),
    type: definition.type,
    amount: definition.amount,
    interestRate,
    payment,
    cadence: definition.cadence,
    remainingBalance,
    nextDueDay: nextLoanDueDay(state.day, definition.cadence),
    missedPayments: 0
  };
}



function offersForLocation(state: Pick<GameState, "location" | "shopInventories">, location = state.location) {
  return state.shopInventories[location] ?? [];
}

function newGame(difficulty: Difficulty = "Normal"): GameState {
  const location = "Thrift Store";
  const day = 1;
  const config = difficultyConfig(difficulty);
  const ownedInfrastructure = emptyInfrastructure();
  const labStations = emptyLabStations();
  const energy = maxEnergyFor({ difficulty, ownedInfrastructure, labStations });
  const shopInventories = createShopInventories(difficulty);
  return {
    day,
    cash: config.startingCash,
    reputation: 0,
    communityTrust: 0,
    energy,
    stress: 0,
    inventory: [],
    offers: shopInventories[location] ?? [],
    shopInventories,
    shopRefreshes: {},
    requests: generateWeeklyRequests(currentWeekFor(day), difficulty, startingDistricts()),
    requestWeek: currentWeekFor(day),
    pendingDonation: null,
    ownedInfrastructure,
    labStations,
    labAssignments: [],
    completedRequests: 0,
    hostedServices: [],
    hostingProjects: freshHostingProjects(),
    repairsToday: 0,
    extraRepairsPurchasedThisWeek: 0,
    difficulty,
    creditScore: config.creditScore,
    loans: [],
    grants: freshGrants(),
    location,
    log: [`Day 1: CAF Tech Hustle begins on ${difficulty}. Find bargains, fix gear, help people.`],
    weeklyStats: emptyWeeklyStats(),
    weekStart: { cash: config.startingCash, reputation: 0, communityTrust: 0, labProgress: 0 },
    weeklyReport: null,
    reportHistory: [],
    ledger: [ledgerEntryFor(day, config.startingCash)],
    unlockedDistricts: startingDistricts(),
    districtProgress: emptyDistrictProgress(),
    dataCenterUnlocked: false
  };
}

function statusClass(status: StorageStatus) {
  return status.toLowerCase().replace(/\s+/g, "-");
}



function eligibleStatusOptions(item: InventoryItem): StorageStatus[] {
  if (item.status === "Tested") return ["Tested", "Ready to Donate", "Ready to Sell", "Reserved"];
  if (isReadyStatus(item.status)) return ["Ready to Donate", "Ready to Sell", "Reserved"];
  return [item.status];
}

function matchingItems(state: GameState, request: CommunityRequest) {
  if (request.kind !== "item" || !isItemType(request.need)) return [];
  return state.inventory
    .filter((item) => item.type === request.need && isReadyStatus(item.status))
    .sort((a, b) => readyStatuses.indexOf(a.status) - readyStatuses.indexOf(b.status));
}

function requestAvailability(state: GameState, request: CommunityRequest) {
  if (request.kind === "item") {
    const matches = matchingItems(state, request);
    return {
      canFulfill: matches.length > 0,
      missing: matches.length > 0 ? "" : `${request.need} item marked Ready or Reserved`
    };
  }

  const missing: string[] = [];
  const energyCost = actionEnergyCost(request.energyCost ?? 0);
  if ((request.energyCost ?? 0) > 0 && energyCost > state.energy) missing.push(`${energyCost} energy`);
  if ((request.cashCost ?? 0) > state.cash) missing.push(`$${request.cashCost}`);
  const slotsNeeded = hostingSlotsFor(request.need as ServiceNeed);
  if (slotsNeeded > 0) {
    const stats = infrastructureStats(state.ownedInfrastructure, state.labStations);
    const slotsOpen = stats.hostingCapacity - hostingSlotsUsed(state.hostedServices);
    if (slotsOpen < slotsNeeded) missing.push(`${slotsNeeded} hosting slots`);
  }
  return {
    canFulfill: missing.length === 0,
    missing: missing.length ? missing.join(" and ") : ""
  };
}

function cleanButtonReason(item: InventoryItem, state: GameState) {
  if (item.status === "Deployed to Community") return "This item is already deployed.";
  if (item.status === "Assigned to Lab") return "This item is assigned to the lab.";
  if (item.status === "Scrapped") return "Scrapped items cannot be cleaned.";
  if (item.status !== "Incoming" && item.status !== "Needs Cleaning") return "Item is already cleaned.";
  if (state.energy < 1) return "Not enough energy.";
  return "Clean intake item. Uses 1 energy.";
}

function testButtonReason(item: InventoryItem, state: GameState) {
  if (item.status === "Deployed to Community") return "This item is already deployed.";
  if (item.status === "Assigned to Lab") return "This item is assigned to the lab.";
  if (item.status === "Scrapped") return "Scrapped items cannot be tested.";
  if (item.status === "Incoming" || item.status === "Needs Cleaning") return "Clean before testing.";
  if (item.status !== "Cleaned") return "Item already tested.";
  if (state.energy < 1) return "Not enough energy.";
  return "Test cleaned item. Uses 1 energy.";
}

function repairButtonReason(item: InventoryItem, state: GameState, stats: ReturnType<typeof infrastructureStats>) {
  if (item.status === "Deployed to Community") return "Already deployed.";
  if (item.status === "Assigned to Lab") return "Assigned to lab.";
  if (item.status === "Junked") return "This item is permanently junked. Scrap it for parts.";
  if (item.status === "Scrapped") return "Already scrapped.";
  if (item.status === "Incoming" || item.status === "Needs Cleaning" || item.status === "Cleaned") return "Clean and test before repairing.";
  if (item.status !== "Needs Repair") return "Item already repaired.";
  if (state.repairsToday >= stats.repairQueue) return "No repair capacity left today.";
  const cost = repairNumbers(item, state.labStations);
  if (state.energy < cost.energy) return "Not enough energy.";
  if (state.cash < cost.cash) return "Missing parts budget.";
  return "Repairs use 1 repair slot and energy.";
}

function donateButtonReason(item: InventoryItem) {
  if (item.status === "Deployed to Community") return "Already deployed.";
  if (item.status === "Assigned to Lab") return "Assigned to lab.";
  if (item.status === "Junked") return "This item is permanently junked. Scrap it for parts.";
  if (item.status === "Scrapped") return "Already scrapped.";
  if (item.status === "Reserved") return "Already assigned.";
  if (item.status === "Incoming" || item.status === "Needs Cleaning" || item.status === "Cleaned") return "Clean and test first.";
  if (item.status === "Needs Repair") return "Repair before donating.";
  if (item.status === "Tested" || isReadyStatus(item.status)) return "Donate to community.";
  return "Repair before donating.";
}

function canDonateItem(item: InventoryItem) {
  return item.status === "Tested" || item.status === "Ready to Donate" || item.status === "Ready to Sell";
}

function donationDestinationsForItem(state: GameState, item: InventoryItem): DonationDestination[] {
  if (!canDonateItem(item) || isInactiveStatus(item.status)) return [];
  const requestDestinations: DonationDestination[] = state.requests
    .filter((request) => request.kind === "item" && request.need === item.type && isReadyStatus(item.status))
    .map((request) => ({
      id: `request:${request.id}`,
      label: `Donate to ${request.district ?? "Community"} Request: ${request.title}`,
      kind: "request" as const,
      request
    }));
  const labDestinations: DonationDestination[] = labStationCatalog
    .filter((station) => (state.labStations[station.name] ?? 0) < station.maxLevel && station.acceptedTypes.includes(item.type) && usableForLab(item) && !labCapReason(state, station.name))
    .map((station) => ({
      id: `lab:${station.name}`,
      label: `Donate to Lab: ${station.name}`,
      kind: "lab" as const,
      station
    }));
  const infrastructureDestinations: DonationDestination[] = infrastructureCatalog
    .filter((facility) =>
      (state.ownedInfrastructure[facility.name] ?? 0) < facility.maxLevel &&
      infrastructureUnlocked(state, facility) &&
      !infrastructureCapReason(state, facility.name) &&
      infrastructureItemTypesNeeded(facility).some((need) => need.types.includes(item.type)) &&
      usableForLab(item)
    )
    .map((facility) => ({
      id: `infra:${facility.name}`,
      label: `Donate to Infrastructure: ${facility.name}`,
      kind: "infrastructure" as const,
      facility
    }));
  const hostingDestinations: DonationDestination[] = hostingProjectCatalog
    .filter((project) => {
      const availability = hostingProjectAvailability(state, project);
      return hostingProjectStateFor(state, project.id).status === "Inactive" &&
        availability.canComplete &&
        availability.equipment.some((equipment) => equipment.id === item.id);
    })
    .map((project) => ({
      id: `hosting:${project.id}`,
      label: `Donate to Hosting: ${project.name}`,
      kind: "hosting" as const,
      project
    }));
  const bulkDestination: DonationDestination[] = [...bulkLotGroups, mixedBulkLot]
    .filter((lot) => bulkLotEligibleItems([item], { ...lot, minItems: 1 }).length > 0)
    .map((lot) => ({
      id: `bulk:${lot.label}`,
      label: `Add to Bulk Buy: ${lot.label}`,
      kind: "bulk" as const,
      lot
    }));
  return [...requestDestinations, ...labDestinations, ...infrastructureDestinations, ...hostingDestinations, ...bulkDestination];
}

function futureDonationDestinationsForItem(state: GameState, item: InventoryItem): FutureDonationDestination[] {
  if (!canDonateItem(item) || isInactiveStatus(item.status)) return [];
  const active = donationDestinationsForItem(state, item);
  const activeKeys = new Set(active.map((destination) => destination.id));
  const future: FutureDonationDestination[] = [];
  labStationCatalog.forEach((station) => {
    if (!station.acceptedTypes.includes(item.type) || !usableForLab(item) || activeKeys.has(`lab:${station.name}`)) return;
    const level = state.labStations[station.name] ?? 0;
    if (level >= station.maxLevel) return;
    future.push({
      id: `future-lab:${station.name}`,
      label: `Future Need: Lab - ${station.name}`,
      category: "Lab",
      reason: labCapReason(state, station.name) || "Lab need is not active yet."
    });
  });
  infrastructureCatalog.forEach((facility) => {
    if (!infrastructureItemTypesNeeded(facility).some((need) => need.types.includes(item.type)) || !usableForLab(item) || activeKeys.has(`infra:${facility.name}`)) return;
    const level = state.ownedInfrastructure[facility.name] ?? 0;
    if (level >= facility.maxLevel) return;
    const capReason = infrastructureCapReason(state, facility.name);
    const reqs = requirementLabels(facility.requirements).join(" | ");
    future.push({
      id: `future-infra:${facility.name}`,
      label: `Future Need: Infrastructure - ${facility.name}`,
      category: "Infrastructure",
      reason: capReason || (!infrastructureUnlocked(state, facility) ? `Locked: ${reqs || "meet Infrastructure requirements first"}` : "Infrastructure need is not active yet.")
    });
  });
  hostingProjectCatalog.forEach((project) => {
    if (!project.requiredEquipment.some((need) => need.types.includes(item.type)) || !usableForHosting(item) || activeKeys.has(`hosting:${project.id}`)) return;
    const status = hostingProjectStateFor(state, project.id).status;
    if (status === "Active" || status === "Completed") return;
    const availability = hostingProjectAvailability(state, project);
    future.push({
      id: `future-hosting:${project.id}`,
      label: `Future Need: Hosting - ${project.name}`,
      category: "Hosting",
      reason: availability.missing || hostingSlotUnlockText(state)
    });
  });
  const activeRequestForType = active.some((destination) => destination.kind === "request");
  if (!activeRequestForType && requestTemplates.some((request) => request.kind === "item" && request.need === item.type)) {
    future.push({
      id: `future-request:${item.type}`,
      label: `Future Need: Request - ${item.type}`,
      category: "Request",
      reason: "No active named request currently accepts this item."
    });
  }
  return future.filter((entry, index, entries) => entries.findIndex((candidate) => candidate.id === entry.id) === index);
}

function isReservedStorageItem(item: InventoryItem) {
  return item.status === "Reserved" || item.status === "Assigned to Lab" || item.source?.startsWith("Bulk Buy:");
}

function stableStorageItemsForDisplay(items: InventoryItem[]) {
  return [
    ...items.filter((item) => !isReservedStorageItem(item)),
    ...items.filter(isReservedStorageItem)
  ];
}

function sellButtonReason(item: InventoryItem) {
  if (item.status === "Deployed to Community") return "Already deployed.";
  if (item.status === "Assigned to Lab") return "Assigned to lab.";
  if (item.status === "Junked") return "This item is permanently junked. Scrap it for parts.";
  if (item.status === "Scrapped") return "Already scrapped.";
  if (item.status === "Incoming" || item.status === "Needs Cleaning" || item.status === "Cleaned") return "Clean and test first.";
  if (item.status === "Needs Repair") return "Repair before selling.";
  if (item.status === "Tested") return "Sell now (mark Ready to Sell first for better price).";
  if (item.status === "Ready to Sell") return "Sell this item.";
  if (item.status === "Ready to Donate" || item.status === "Reserved") return "Mark Ready to Sell first.";
  return "Test before selling.";
}

function scrapButtonReason(item: InventoryItem) {
  if (item.status === "Deployed to Community") return "Already deployed.";
  if (item.status === "Assigned to Lab") return "Assigned to lab.";
  if (item.status === "Scrapped") return "Already scrapped.";
  if (item.status === "Junked") return "This item is permanently junked. Scrap it for parts.";
  return "Scrap for parts cash.";
}

function App() {
  const [game, setGame] = React.useState<GameState>(() => newGame());
  const [saveSlots, setSaveSlots] = React.useState<SaveSlot[]>(() => readSaveSlots(newGame));
  const [dailyAutosave, setDailyAutosave] = React.useState<SaveSlot | null>(() => readDailyAutosave(newGame));
  const [saved, setSaved] = React.useState("Manual saves ready");
  const [donationItemId, setDonationItemId] = React.useState<string | null>(null);
  const [opsTab, setOpsTab] = React.useState<OpsTab>("Infrastructure");
  const [mainScreen, setMainScreen] = React.useState<MainScreen>("Market");
  const [savesOpen, setSavesOpen] = React.useState(false);
  const [showHistory, setShowHistory] = React.useState(false);
  const [showReportHistory, setShowReportHistory] = React.useState(false);
  const [showLedger, setShowLedger] = React.useState(false);
  const [dailyUpdate, setDailyUpdate] = React.useState<DailyUpdateData | null>(null);
  const [newGameDifficulty, setNewGameDifficulty] = React.useState<Difficulty>("Normal");
  const [selectedOpsItemId, setSelectedOpsItemId] = React.useState<string | null>(null);
  const [selectedOpsDemand, setSelectedOpsDemand] = React.useState<string | null>(null);
  const lastAutosavedDayRef = React.useRef(game.day);

  const dismissWeeklyReport = () => setGame((state) => ({ ...state, weeklyReport: null }));

  React.useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (dailyUpdate) { setDailyUpdate(null); return; }
      if (game.weeklyReport) { dismissWeeklyReport(); return; }
      if (donationItemId) { setDonationItemId(null); return; }
      if (savesOpen) { setSavesOpen(false); return; }
      if (showLedger) { setShowLedger(false); return; }
      if (showReportHistory) { setShowReportHistory(false); return; }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [dailyUpdate, game.weeklyReport, donationItemId, savesOpen, showLedger, showReportHistory]);

  const [selectedDistrict, setSelectedDistrict] = React.useState<DistrictName>(() => locationToDistrict(newGame().location));

  React.useEffect(() => {
    setSelectedDistrict(locationToDistrict(game.location));
  }, [game.location]);

  React.useEffect(() => {
    const latest = latestSavedSlot(dailyAutosave ? [dailyAutosave, ...saveSlots] : saveSlots);
    if (latest?.game) {
      setGame(latest.game);
      lastAutosavedDayRef.current = latest.game.day;
      setSaved(`Loaded ${latest.name}`);
      return;
    }
    window.cafSave?.load().then((data) => {
      if (data && typeof data === "object" && "cash" in data) {
        const migrated = normalizeGame(data, newGame);
        setGame(migrated);
        lastAutosavedDayRef.current = migrated.day;
        setSaved("Migrated old autosave");
      }
    });
    // This intentionally runs once so loading a slot later is fully player-driven.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  React.useEffect(() => {
    writeSaveSlots(saveSlots);
  }, [saveSlots]);

  React.useEffect(() => {
    if (game.day <= lastAutosavedDayRef.current) return;
    const autosave = writeDailyAutosave(game);
    if (autosave) {
      setDailyAutosave(autosave);
      lastAutosavedDayRef.current = game.day;
      setSaved(`Day ${game.day} saved.`);
    } else {
      setSaved("Autosave failed.");
    }
  }, [game]);

  const pushLogs = (state: GameState, entries: string[]): GameState => ({
    ...state,
    log: [...entries, ...state.log].slice(0, 12)
  });

  const pushLog = (state: GameState, entry: string): GameState => pushLogs(state, [entry]);

  const storageSummary = React.useMemo(() => {
    const counts = new Map<ItemType, Partial<Record<StorageStatus, number>>>();
    game.inventory.filter((item) => !isInactiveStatus(item.status)).forEach((item) => {
      const byStatus = counts.get(item.type) ?? {};
      byStatus[item.status] = (byStatus[item.status] ?? 0) + 1;
      counts.set(item.type, byStatus);
    });
    return itemTypes
      .map((type) => [type, counts.get(type)] as const)
      .filter(([, byStatus]) => byStatus);
  }, [game.inventory]);

  const infraStats = infrastructureStats(game.ownedInfrastructure, game.labStations);
  const currentStorageCount = activeItemCount(game.inventory);
  const hostingUsed = hostingSlotsUsed(game.hostedServices);
  const avgUptime = averageUptime(game.hostedServices);
  const hostingWeeklyIncome = weeklyHostingIncome(game);
  const hostingPayoutDay = nextHostingPayoutDay(game.day);
  const labProgressValue = labProgress(game);
  const infrastructureProgressValue = infrastructureProgress(game);
  const labTier = labTierInfo(labProgressValue);
  const infrastructureTier = infrastructureTierInfo(infrastructureProgressValue);
  const upgradePhase = mapUpgradePhase(game);
  const dailyEnergyGain = dailyEnergyGainFor(game);
  const energyCap = energyStackCapFor(game);
  const intakeBacklog = intakeBacklogCount(game.inventory);
  const marketShopForNeeds = React.useMemo(() => shopForNeeds(game), [game]);
  const availableMarketLocations = React.useMemo(
    () => marketLocationsForDistricts(game.unlockedDistricts),
    [game.unlockedDistricts]
  );
  const lockedMarketLocations = shopLocations.filter((location) => !availableMarketLocations.includes(location));
  const marketDistrictsWithoutStores = React.useMemo(
    () => unlockedDistrictsWithoutMarketStores(game.unlockedDistricts),
    [game.unlockedDistricts]
  );
  const currentStoreOfferCount = shopLocations.includes(game.location) ? offersForLocation(game).length : 0;
  const scoutEnergyCost = actionEnergyCost(1);
  const scoutBlockReason = currentStoreOfferCount < 2
    ? "Need at least 2 items left in this store to scout for more deals."
    : (game.shopRefreshes[game.location] ?? 0) === game.day
      ? "Already scouted today."
      : game.energy < scoutEnergyCost || game.cash < 5
        ? `Need ${scoutEnergyCost} energy and $5 to scout for more deals.`
        : "";
  const canScoutCurrentStore = shopLocations.includes(game.location) && !scoutBlockReason;

  const visit = (location: LocationName) => {
    setGame((state) =>
      pushLog(
        { ...state, location, offers: offersForLocation(state, location) },
        location === "Business Sales" || location === "Bulk Buyers"
          ? `Visited ${location}.`
          : `Visited ${location}. Today's inventory is still on the table.`
      )
    );
  };

  const handleSelectDistrict = (district: DistrictName) => {
    setSelectedDistrict(district);
    const locs = districtMarketStores(district);
    if (locs && game.unlockedDistricts.includes(district) && !locs.includes(game.location)) {
      visit(locs[0]);
    }
  };

  React.useEffect(() => {
    if (mainScreen === "Market" && !availableMarketLocations.includes(game.location)) {
      visit(availableMarketLocations[0] ?? "Thrift Store");
    }
    // Keep the visible module paired with the station it owns.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mainScreen, game.location, availableMarketLocations]);

  const buy = (offer: Offer) => {
    setGame((state) => {
      if (state.cash < offer.price) return pushLog(state, `Not enough cash for ${offer.name}.`);
      const stats = infrastructureStats(state.ownedInfrastructure, state.labStations);
      if (activeItemCount(state.inventory) >= stats.storageCapacity) {
        return pushLog(state, `Storage is full (${stats.storageCapacity}). Buy infrastructure, scrap, sell, or deploy gear first.`);
      }
      const item: InventoryItem = {
        ...offer,
        status: "Incoming",
        buyPrice: offer.price,
        source: offer.location,
        hiddenCondition: offer.hiddenCondition ?? hiddenConditionForInventory(offer.condition, offer.location),
        pricing: offer.pricing
      };
      const nextShopOffers = (state.shopInventories[offer.location] ?? []).filter((listed) => listed.id !== offer.id);
      return pushLog(
        {
          ...state,
          ...withCashChange(state, -offer.price, `Purchase: ${offer.name}`),
          weeklyStats: { ...state.weeklyStats, cashSpent: state.weeklyStats.cashSpent + offer.price },
          inventory: [...state.inventory, item],
          shopInventories: {
            ...state.shopInventories,
            [offer.location]: nextShopOffers
          },
          offers: offer.location === state.location ? nextShopOffers : state.offers.filter((listed) => listed.id !== offer.id)
        },
        `Bought ${offer.name} for $${offer.price}. Sent to intake as ${offer.condition}.`
      );
    });
  };

  const scoutForDeals = () => {
    setGame((state) => {
      const location = state.location;
      if (!shopLocations.includes(location)) return pushLog(state, "This location does not have shop inventory to scout.");
      if (offersForLocation(state, location).length < 2) {
        return pushLog(state, "Need at least 2 items left in this store to scout for more deals.");
      }
      if ((state.shopRefreshes[location] ?? 0) === state.day) return pushLog(state, `${location} has already been scouted today.`);
      const scoutEnergy = actionEnergyCost(1);
      if (state.energy < scoutEnergy || state.cash < 5) return pushLog(state, `Need ${scoutEnergy} energy and $5 to scout for more deals.`);
      const refreshedOffers = marketFor(location, state.difficulty);
      return pushLog(
        {
          ...state,
          ...withCashChange(state, -5, "Scout Fee"),
          energy: state.energy - scoutEnergy,
          weeklyStats: { ...state.weeklyStats, cashSpent: state.weeklyStats.cashSpent + 5 },
          shopInventories: {
            ...state.shopInventories,
            [location]: refreshedOffers
          },
          shopRefreshes: {
            ...state.shopRefreshes,
            [location]: state.day
          },
          offers: refreshedOffers
        },
        `Scouted ${location} for more deals. New leads cost ${scoutEnergy} energy and $5.`
      );
    });
  };

  const changeStatus = (item: InventoryItem, status: StorageStatus) => {
    setGame((state) => {
      if (!eligibleStatusOptions(item).includes(status)) {
        return pushLog(state, `${item.name} cannot be marked ${status} right now.`);
      }
      return pushLog(
        {
          ...state,
          inventory: state.inventory.map((stored) => stored.id === item.id ? refreshPricingForItem({ ...stored, status, condition: conditionFromStatus(status) }, status, conditionFromStatus(status)) : stored)
        },
        `${item.name} marked ${status}.`
      );
    });
  };

  const cleanItem = (item: InventoryItem) => {
    setGame((state) => {
      const reason = cleanButtonReason(item, state);
      if (reason !== "Clean intake item. Uses 1 energy.") return pushLog(state, reason);
      const cleanEnergy = actionEnergyCost(1);
      const revealed = item.condition === "Unknown"
        ? item.hiddenCondition ?? hiddenConditionForInventory(item.condition, item.source)
        : undefined;
      return pushLog(
        {
          ...state,
          energy: state.energy - cleanEnergy,
          inventory: state.inventory.map((stored) =>
            stored.id === item.id
              ? refreshPricingForItem({
                ...stored,
                status: "Cleaned",
                condition: revealed ?? stored.condition,
                hiddenCondition: undefined
              }, "Cleaned", revealed ?? stored.condition ?? conditionFromStatus("Cleaned"))
              : stored
          )
        },
        revealed
          ? `Cleaned ${item.name}; unknown condition revealed as ${revealed}.`
          : `Cleaned ${item.name}. Ready for testing.`
      );
    });
  };

  const testItem = (item: InventoryItem) => {
    setGame((state) => {
      const reason = testButtonReason(item, state);
      if (reason !== "Test cleaned item. Uses 1 energy.") return pushLog(state, reason);
      const testEnergy = actionEnergyCost(1);
      const revealed = item.condition === "Unknown"
        ? item.hiddenCondition ?? hiddenConditionForInventory(item.condition, item.source) ?? "Needs Parts"
        : item.condition ?? "Unknown";
      const destroyChance = cleanTestDestroyChance(item, revealed);
      const shouldScrap = destroyChance > 0 && Math.random() < destroyChance;
      const nextStatus: StorageStatus = shouldScrap
        ? "Scrapped"
        : revealed === "Working" || revealed === "Refurbished"
          ? "Tested"
          : "Needs Repair";
      const nextCondition: ItemCondition = shouldScrap ? "Broken" : revealed;
      return pushLog(
        {
          ...state,
          ...(shouldScrap ? withCashChange(state, scrapValue(refreshPricingForItem({ ...item, status: "Scrapped", condition: "Broken" }, "Scrapped", "Broken")), `Scrap: ${item.name}`) : state),
          energy: state.energy - testEnergy,
          inventory: state.inventory.map((stored) =>
            stored.id === item.id
              ? refreshPricingForItem({
                ...stored,
                status: nextStatus,
                condition: nextCondition,
                hiddenCondition: undefined
              }, nextStatus, nextCondition)
              : stored
          )
        },
        shouldScrap
          ? `Tested ${item.name}. It was beyond reuse and got scrapped for $${scrapValue(refreshPricingForItem({ ...item, status: "Scrapped", condition: "Broken" }, "Scrapped", "Broken"))}.`
          : nextStatus === "Tested"
            ? `Tested ${item.name}. It works and can be marked for donation, sale, or lab use.`
            : `Tested ${item.name}. It needs repair before mission use.`
      );
    });
  };

  const repair = (item: InventoryItem) => {
    setGame((state) => {
      if (item.status !== "Needs Repair") {
        return pushLog(state, `${item.name} is not in the repair queue.`);
      }
      const stats = infrastructureStats(state.ownedInfrastructure, state.labStations);
      if (state.repairsToday >= stats.repairQueue) {
        return pushLog(state, `Repair queue full today (${state.repairsToday}/${stats.repairQueue}). Upgrade infrastructure or try tomorrow.`);
      }
      const cost = repairNumbers(item, state.labStations);
      if (state.energy < cost.energy || state.cash < cost.cash) {
        return pushLog(state, `Need $${cost.cash} and ${cost.energy} energy to repair ${item.name}.`);
      }
      const lab = labBonuses(state.labStations);
      const repairBoost = stats.repairQueue * 0.006;
      const chance = clampStat(
        0.7 +
          difficultyConfig(state.difficulty).repairChance +
          lab.repairChance +
          repairBoost +
          state.reputation * 0.004 +
          state.communityTrust * 0.003 -
          state.stress * 0.02 -
          (item.condition === "Needs Parts" ? 0.05 : 0),
        0.25,
        0.94
      );
      const junkChance = repairJunkChance(item);
      const outcomeRoll = Math.random();
      const junked = outcomeRoll < junkChance;
      const success = !junked && outcomeRoll < junkChance + chance;
      // Troubleshooting save: on plain failure, roll to preserve the repair slot at cost of 1 energy
      const q = itemQuality(item);
      const saveChance = (item.condition === "Broken" || conditionFromStatus(item.status) === "Broken") ? 0.30
        : q === "Pristine" || q === "Excellent" ? 0.70
        : q === "Good" ? 0.60
        : q === "Standard" ? 0.50
        : 0.40;
      const troubleshootSave = !success && !junked && state.energy >= 1 && Math.random() < saveChance;
      const slotConsumed = success || junked || !troubleshootSave;
      const energyUsed = troubleshootSave ? 1 : cost.energy;
      const inventory = state.inventory.map((stored) =>
        stored.id === item.id
          ? refreshPricingForItem({
            ...stored,
            status: junked ? "Junked" as StorageStatus : success ? "Ready to Sell" as StorageStatus : "Needs Repair" as StorageStatus,
            condition: success ? "Refurbished" as ItemCondition : junked ? "Broken" as ItemCondition : "Needs Parts" as ItemCondition
          }, junked ? "Junked" : success ? "Ready to Sell" : "Needs Repair", success ? "Refurbished" : junked ? "Broken" : "Needs Parts")
          : stored
      );
      return pushLog(
        {
          ...state,
          ...withCashChange(state, -cost.cash, `Repair: ${item.name}`),
          energy: state.energy - energyUsed,
          repairsToday: state.repairsToday + (slotConsumed ? 1 : 0),
          stress: clampStat(state.stress + (success ? 0 : difficultyStress(state, junked ? 2 : 1)), 0, 20),
          weeklyStats: {
            ...state.weeklyStats,
            cashSpent: state.weeklyStats.cashSpent + cost.cash,
            repairsSucceeded: state.weeklyStats.repairsSucceeded + (success ? 1 : 0),
            repairsFailed: state.weeklyStats.repairsFailed + (!success && !junked ? 1 : 0),
            repairsJunked: state.weeklyStats.repairsJunked + (junked ? 1 : 0)
          },
          inventory
        },
        success
          ? `${item.name} repair succeeded. It is tested and ready to route.`
          : junked
            ? `Repair failed badly. ${item.name} is now junked.`
            : troubleshootSave
              ? `Repair failed, but you caught the issue early. Lost 1 energy; repair capacity preserved.`
              : `${item.name} still needs repair. Repair slot consumed. Stress +1.`
      );
    });
  };

  const EXTRA_REPAIR_COSTS = [25, 45, 75] as const;

  const buyExtraRepair = () => {
    setGame((state) => {
      const purchased = state.extraRepairsPurchasedThisWeek ?? 0;
      if (purchased >= 3) {
        return pushLog(state, "Contract repair help maxed this week (3/3). Resets next week.");
      }
      const cost = EXTRA_REPAIR_COSTS[purchased];
      if (state.cash < cost) {
        return pushLog(state, `Need $${cost} to hire contract repair help (${purchased + 1}/3 this week).`);
      }
      return pushLog(
        {
          ...withCashChange(state, -cost, "Contract repair help"),
          extraRepairsPurchasedThisWeek: purchased + 1,
          repairsToday: Math.max(0, state.repairsToday - 1)
        },
        `Contract repair help hired ($${cost}). +1 repair slot freed up today. (${purchased + 1}/3 this week)`
      );
    });
  };

  const sell = (item: InventoryItem) => {
    setGame((state) => {
      if (item.status !== "Ready to Sell" && item.status !== "Tested") {
        if (item.status === "Junked") return pushLog(state, `${item.name} is permanently junked. Scrap it for parts.`);
        if (item.status === "Needs Repair") return pushLog(state, `Repair ${item.name} before selling.`);
        if (isInactiveStatus(item.status)) return pushLog(state, `${item.name} is already ${item.status}.`);
        return pushLog(state, `Clean and test ${item.name} before selling.`);
      }
      const value = sellOfferValue(item, state);
      return pushLog(
        {
          ...state,
          ...withCashChange(state, Math.max(1, value), `Sale: ${item.name}`),
          weeklyStats: { ...state.weeklyStats, itemsSold: state.weeklyStats.itemsSold + 1, cashEarned: state.weeklyStats.cashEarned + Math.max(1, value) },
          inventory: state.inventory.map((stored) => stored.id === item.id ? { ...stored, status: "Sold" as StorageStatus } : stored)
        },
        `Sold ${item.name} for $${Math.max(1, value)}.`
      );
    });
  };

  const sellToBusiness = (item: InventoryItem) => {
    setGame((state) => {
      const reason = businessSaleReason(item);
      if (reason !== "Ready for Business Sales.") return pushLog(state, `${item.name}: ${reason}`);
      const offer = businessOfferForItem(item, state, labProgress(state));
      const value = offer.value;
      return pushLog(
        {
          ...state,
          ...withCashChange(state, value, `Business Sale: ${item.name}`),
          weeklyStats: { ...state.weeklyStats, itemsSold: state.weeklyStats.itemsSold + 1, cashEarned: state.weeklyStats.cashEarned + value },
          inventory: state.inventory.map((stored) => stored.id === item.id ? { ...stored, status: "Sold" as StorageStatus } : stored)
        },
        `${offer.label}: sold ${item.name} to Business Sales for $${value}.`
      );
    });
  };

  const confirmBusinessSale = (item: InventoryItem) => {
    sellToBusiness(item);
  };

  const sellBulkLot = (lot: BulkLotDefinition, lotItems: InventoryItem[]) => {
    setGame((state) => {
      const selectedIds = new Set(lotItems.map((item) => item.id));
      const eligible = bulkLotEligibleItems(state.inventory, lot).filter((item) => selectedIds.has(item.id));
      if (eligible.length === 0) return pushLog(state, "No eligible items in that lot.");
      if (eligible.length < lot.minItems) {
        return pushLog(state, `${lot.label} needs ${lot.minItems} eligible items. You have ${eligible.length}.`);
      }
      const total = eligible.reduce((sum, item) => sum + bulkItemValue(item), 0);
      const ids = new Set(eligible.map((i) => i.id));
      return pushLog(
        {
          ...state,
          ...withCashChange(state, total, `Bulk Lot: ${lot.label}`),
          weeklyStats: {
            ...state.weeklyStats,
            itemsSold: state.weeklyStats.itemsSold + eligible.length,
            cashEarned: state.weeklyStats.cashEarned + total
          },
          inventory: state.inventory.map((stored) => ids.has(stored.id) ? { ...stored, status: "Sold" as StorageStatus } : stored)
        },
        `Sold ${eligible.length}-item ${lot.label.toLowerCase()} to Bulk Buyer for $${total}.`
      );
    });
  };

  const confirmBulkLot = (lot: BulkLotDefinition, lotItems: InventoryItem[]) => {
    const total = lotItems.reduce((sum, item) => sum + bulkItemValue(item), 0);
    if (!window.confirm(`Sell ${lotItems.length} item(s) for ${lot.label} at $${total}? These items will leave storage.`)) return;
    sellBulkLot(lot, lotItems);
  };

  const addItemToBulkBuy = (item: InventoryItem) => {
    setGame((state) => {
      const current = state.inventory.find((stored) => stored.id === item.id);
      if (!current) return pushLog(state, "That storage item is no longer available.");
      const lot = bulkLotForItem(current);
      if (!lot) return pushLog(state, `${current.name} does not match an active Bulk Buy lot.`);
      const committed = state.inventory.filter((stored) => stored.status === "Reserved" && stored.source === `Bulk Buy: ${lot.label}`);
      const lotItems = [...committed, current];
      if (lotItems.length >= lot.minItems) {
        const ids = new Set(lotItems.map((stored) => stored.id));
        const total = lotItems.reduce((sum, stored) => sum + bulkItemValue(stored), 0);
        setSaved(`Bundle complete: ${lot.label} cashed out for $${total}.`);
        return pushLog(
          {
            ...state,
            ...withCashChange(state, total, `Bundle Cashout: ${lot.label}`),
            weeklyStats: {
              ...state.weeklyStats,
              itemsSold: state.weeklyStats.itemsSold + lotItems.length,
              cashEarned: state.weeklyStats.cashEarned + total
            },
            inventory: state.inventory.map((stored) => ids.has(stored.id) ? { ...stored, status: "Sold" as StorageStatus } : stored)
          },
          `Bundle complete: ${lot.label} cashed out for $${total}.`
        );
      }
      setSaved(`Added ${current.name} to ${lot.label}: ${lotItems.length}/${lot.minItems}.`);
      return pushLog(
        {
          ...state,
          inventory: state.inventory.map((stored) =>
            stored.id === current.id ? { ...stored, status: "Reserved" as StorageStatus, source: `Bulk Buy: ${lot.label}` } : stored
          )
        },
        `Added ${current.name} to ${lot.label}. Progress ${lotItems.length}/${lot.minItems}; ${lot.minItems - lotItems.length} more needed.`
      );
    });
  };

  const stageItemForInfrastructure = (facility: InfrastructureDefinition, item: InventoryItem) => {
    if (!window.confirm(`Use ${item.name} for ${facility.name} Infrastructure need? It will be removed from storage.`)) return;
    setGame((state) => {
      const current = state.inventory.find((stored) => stored.id === item.id);
      if (!current || !usableForLab(current)) return pushLog(state, `${item.name} is no longer available for infrastructure staging.`);
      const station = infrastructureStagingStationFor(current.type);
      return pushLog(
        {
          ...state,
          labAssignments: [
            ...state.labAssignments,
            {
              id: id("infra-stage"),
              station,
              itemId: current.id,
              itemName: current.name,
              itemType: current.type,
              source: "Storage" as const
            }
          ],
          weeklyStats: { ...state.weeklyStats, itemsAssignedToLab: state.weeklyStats.itemsAssignedToLab + 1 },
          inventory: state.inventory.map((stored) =>
            stored.id === current.id ? { ...stored, status: "Assigned to Lab" as StorageStatus } : stored
          )
        },
        `Staged ${current.name} for ${facility.name}. Infrastructure requirement progress updated.`
      );
    });
  };

  const donate = (item: InventoryItem, destinationId = "general") => {
    setGame((state) => {
      const current = state.inventory.find((stored) => stored.id === item.id);
      if (!current) return pushLog(state, "That item is no longer in storage.");
      if (!canDonateItem(current)) {
        if (current.status === "Junked") return pushLog(state, `${current.name} is permanently junked. Scrap it for parts.`);
        if (current.status === "Needs Repair") return pushLog(state, `Repair ${current.name} before donating.`);
        if (isInactiveStatus(current.status)) return pushLog(state, `${current.name} is already ${current.status}.`);
        return pushLog(state, `Clean and test ${current.name} before donating.`);
      }
      const freshDestination = destinationId !== "general"
        ? donationDestinationsForItem(state, current).find((candidate) => candidate.id === destinationId) ?? null
        : null;
      if (destinationId !== "general" && !freshDestination) return pushLog(state, `${current.name} no longer matches that donation destination.`);
      if (freshDestination?.kind === "request") {
        const request = freshDestination.request;
        return pushLogs(
          {
            ...state,
            ...withCashChange(state, request.cashDonation ?? 0, `Request Stipend: ${request.title}`),
            reputation: state.reputation + request.reputationReward,
            communityTrust: state.communityTrust + request.trustReward,
            completedRequests: state.completedRequests + 1,
            stress: clampStat(state.stress - 1, 0, 20),
            weeklyStats: { ...state.weeklyStats, requestsFulfilled: state.weeklyStats.requestsFulfilled + 1, donated: state.weeklyStats.donated + 1, cashEarned: state.weeklyStats.cashEarned + (request.cashDonation ?? 0) },
            inventory: state.inventory.map((stored) => stored.id === current.id ? { ...stored, status: "Deployed to Community" as StorageStatus } : stored),
            requests: state.requests.filter((active) => active.id !== request.id)
          },
          [
            `Donated ${current.name} to ${request.title}.`,
            `Specific donation completed. Rep +${request.reputationReward}, trust +${request.trustReward}.`
          ]
        );
      }
      if (freshDestination?.kind === "lab") {
        const station = freshDestination.station;
        const nextLevel = (state.labStations[station.name] ?? 0) + 1;
        return pushLog(
          {
            ...state,
            reputation: state.reputation + 2,
            communityTrust: state.communityTrust + 2,
            labStations: { ...state.labStations, [station.name]: nextLevel },
            labAssignments: [...state.labAssignments, { id: id("lab-donation"), station: station.name, itemId: current.id, itemName: current.name, itemType: current.type, source: "Storage" as const }],
            weeklyStats: { ...state.weeklyStats, donated: state.weeklyStats.donated + 1, itemsAssignedToLab: state.weeklyStats.itemsAssignedToLab + 1 },
            inventory: state.inventory.map((stored) => stored.id === current.id ? { ...stored, status: "Assigned to Lab" as StorageStatus } : stored)
          },
          `Donated ${current.name} to ${station.name}. Trust +2, Rep +2.`
        );
      }
      if (freshDestination?.kind === "infrastructure") {
        const facility = freshDestination.facility;
        const station = infrastructureStagingStationFor(current.type);
        return pushLog(
          {
            ...state,
            reputation: state.reputation + 2,
            communityTrust: state.communityTrust + 2,
            labAssignments: [...state.labAssignments, { id: id("infra-donation"), station, itemId: current.id, itemName: current.name, itemType: current.type, source: "Storage" as const }],
            weeklyStats: { ...state.weeklyStats, donated: state.weeklyStats.donated + 1, itemsAssignedToLab: state.weeklyStats.itemsAssignedToLab + 1 },
            inventory: state.inventory.map((stored) => stored.id === current.id ? { ...stored, status: "Assigned to Lab" as StorageStatus } : stored)
          },
          `Donated ${current.name} to ${facility.name}. Trust +2, Rep +2.`
        );
      }
      if (freshDestination?.kind === "hosting") {
        const project = freshDestination.project;
        const availability = hostingProjectAvailability(state, project);
        if (!availability.canComplete || !availability.equipment.some((equipment) => equipment.id === current.id)) {
          return pushLog(state, `${current.name} no longer completes ${project.name}.`);
        }
        const equipmentIds = new Set(availability.equipment.map((equipment) => equipment.id));
        const service: HostedService = {
          id: id("hosted"),
          title: project.name,
          need: project.serviceNeed,
          slots: project.hostingSlots,
          uptime: 99,
          projectId: project.id
        };
        return pushLog(
          {
            ...withCashChange(state, -project.setupCost, `Hosting Setup: ${project.name}`),
            reputation: state.reputation + project.reputationReward + 2,
            communityTrust: state.communityTrust + 2,
            hostedServices: [...state.hostedServices, service],
            hostingProjects: state.hostingProjects.map((existing) => existing.id === project.id
              ? {
                ...existing,
                status: "Active" as HostingProjectStatus,
                startedDay: state.day,
                equipmentIds: availability.equipment.map((equipment) => equipment.id),
                equipmentNames: availability.equipment.map((equipment) => equipment.name)
              }
              : existing),
            weeklyStats: { ...state.weeklyStats, donated: state.weeklyStats.donated + 1 },
            inventory: state.inventory.map((stored) => equipmentIds.has(stored.id) ? { ...stored, status: "Assigned to Lab" as StorageStatus } : stored)
          },
          `Donated ${availability.equipment.map((equipment) => equipment.name).join(", ")} to ${project.name}. Hosting active at $${hostingWeeklyPayout(project)}/wk. Trust +2, Rep +${project.reputationReward + 2}.`
        );
      }
      if (freshDestination?.kind === "bulk") {
        const lot = freshDestination.lot;
        if (current.status === "Reserved" && current.source === `Bulk Buy: ${lot.label}`) {
          return pushLog(state, `${current.name} is already committed to ${lot.label}.`);
        }
        const committed = state.inventory.filter((stored) => stored.status === "Reserved" && stored.source === `Bulk Buy: ${lot.label}`);
        const lotItems = [...committed, current];
        if (lotItems.length >= lot.minItems) {
          const ids = new Set(lotItems.map((stored) => stored.id));
          const total = lotItems.reduce((sum, stored) => sum + bulkItemValue(stored), 0);
          setSaved(`Bundle complete: ${lot.label} cashed out for $${total}.`);
          return pushLog(
            {
              ...state,
              ...withCashChange(state, total, `Bundle Cashout: ${lot.label}`),
              weeklyStats: {
                ...state.weeklyStats,
                itemsSold: state.weeklyStats.itemsSold + lotItems.length,
                cashEarned: state.weeklyStats.cashEarned + total
              },
              inventory: state.inventory.map((stored) => ids.has(stored.id) ? { ...stored, status: "Sold" as StorageStatus } : stored)
            },
            `Bundle complete: ${lot.label} cashed out for $${total}.`
          );
        }
        setSaved(`Added ${current.name} to ${lot.label}: ${lotItems.length}/${lot.minItems}.`);
        return pushLog(
          {
            ...state,
            inventory: state.inventory.map((stored) =>
              stored.id === current.id ? { ...stored, status: "Reserved" as StorageStatus, source: `Bulk Buy: ${lot.label}` } : stored
            )
          },
          `Added ${current.name} to ${lot.label}. Progress ${lotItems.length}/${lot.minItems}; ${lot.minItems - lotItems.length} more needed.`
        );
      }
      const generalRep = Math.max(1, Math.ceil(current.rep / 2));
      return pushLog(
        {
          ...state,
          reputation: state.reputation + generalRep,
          communityTrust: state.communityTrust + 1,
          stress: clampStat(state.stress - 1, 0, 20),
          weeklyStats: { ...state.weeklyStats, donated: state.weeklyStats.donated + 1 },
          inventory: state.inventory.map((stored) => stored.id === current.id ? { ...stored, status: "Deployed to Community" as StorageStatus } : stored)
        },
        `General donation completed. Donated ${current.name}. Rep +${generalRep}, trust +1.`
      );
    });
  };

  const scrap = (item: InventoryItem) => {
    setGame((state) => {
      if (isInactiveStatus(item.status)) return pushLog(state, `${item.name} is already ${item.status}.`);
      const value = scrapValue(refreshPricingForItem({ ...item, status: "Scrapped", condition: item.condition ?? conditionFromStatus(item.status) }, "Scrapped", item.condition ?? conditionFromStatus(item.status)));
      return pushLog(
        {
          ...state,
          ...withCashChange(state, value, `Scrap: ${item.name}`),
          weeklyStats: { ...state.weeklyStats, itemsScrapped: state.weeklyStats.itemsScrapped + 1, cashEarned: state.weeklyStats.cashEarned + value },
          inventory: state.inventory.map((stored) => stored.id === item.id ? refreshPricingForItem({ ...stored, status: "Scrapped" }, "Scrapped", stored.condition ?? conditionFromStatus(stored.status)) : stored)
        },
        `Scrapped ${item.name} for $${value} in parts.`
      );
    });
  };

  const rebuildLabInfraProgress = () => {
    setGame((state) => {
      const rebuilt = reconcileLabInfraProgress(state);
      const beforeLab = labProgress(state);
      const beforeInfra = infrastructureProgress(state);
      const afterLab = labProgress(rebuilt);
      const afterInfra = infrastructureProgress(rebuilt);
      return pushLog(
        rebuilt,
        `Rebuilt Lab/Infrastructure progress from purchased upgrades. Lab ${beforeLab}% -> ${afterLab}%, Infrastructure ${beforeInfra}% -> ${afterInfra}%.`
      );
    });
    setSaved("Lab/Infra progress rebuilt.");
  };

  const fulfillRequest = (request: CommunityRequest) => {
    setGame((state) => {
      const availability = requestAvailability(state, request);
      if (!availability.canFulfill) return pushLog(state, `Missing for ${request.title}: ${availability.missing}.`);

      if (request.kind === "item") {
        const deployed = matchingItems(state, request)[0];
        return pushLogs(
          {
            ...state,
            ...withCashChange(state, request.cashDonation ?? 0, `Request Stipend: ${request.title}`),
            reputation: state.reputation + request.reputationReward,
            communityTrust: state.communityTrust + request.trustReward,
            completedRequests: state.completedRequests + 1,
            stress: clampStat(state.stress - 1, 0, 20),
            weeklyStats: { ...state.weeklyStats, requestsFulfilled: state.weeklyStats.requestsFulfilled + 1, donated: state.weeklyStats.donated + 1, cashEarned: state.weeklyStats.cashEarned + (request.cashDonation ?? 0) },
            inventory: state.inventory.map((item) => item.id === deployed.id ? { ...item, status: "Deployed to Community" } : item),
            requests: state.requests.filter((active) => active.id !== request.id)
          },
          [
            `Deployed 1 ${deploymentLabel(deployed)} to ${request.title}.`,
            `Fulfilled ${request.title} with ${deployed.name}. Rep +${request.reputationReward}, trust +${request.trustReward}.`
          ]
        );
      }

      const slots = hostingSlotsFor(request.need as ServiceNeed);
      let cashState = state;
      const requestEnergyCost = actionEnergyCost(request.energyCost ?? 0);
      if (request.cashCost) cashState = withCashChange(cashState, -request.cashCost, `Service Cost: ${request.title}`);
      if (request.cashDonation) cashState = withCashChange(cashState, request.cashDonation, `Request Stipend: ${request.title}`);
      const hostedService: HostedService | null = slots > 0
        ? {
          id: id("hosted"),
          title: request.title,
          need: request.need as ServiceNeed,
          slots,
          uptime: 99
        }
        : null;
      return pushLog(
        {
          ...cashState,
          energy: state.energy - requestEnergyCost,
          reputation: state.reputation + request.reputationReward,
          communityTrust: state.communityTrust + request.trustReward,
          completedRequests: state.completedRequests + 1,
          weeklyStats: { ...state.weeklyStats, requestsFulfilled: state.weeklyStats.requestsFulfilled + 1, cashEarned: state.weeklyStats.cashEarned + (request.cashDonation ?? 0), cashSpent: state.weeklyStats.cashSpent + (request.cashCost ?? 0) },
          hostedServices: hostedService ? [...state.hostedServices, hostedService] : state.hostedServices,
          requests: state.requests.filter((active) => active.id !== request.id)
        },
        `Completed ${request.title}. Rep +${request.reputationReward}, trust +${request.trustReward}.`
      );
    });
  };

  const sortDonation = () => {
    setGame((state) => {
      const donation = state.pendingDonation;
      if (!donation) return state;
      const unknownCount = donation.items.filter((item) => item.condition === "Unknown").length;
      if (!unknownCount) return pushLog(state, "The donation is already sorted.");
      const sortEnergy = actionEnergyCost(2);
      if (state.energy < sortEnergy) return pushLog(state, `Need ${sortEnergy} energy to sort the surprise donation first.`);
      return pushLog(
        {
          ...state,
          energy: state.energy - sortEnergy,
          pendingDonation: {
            ...donation,
            sorted: true,
            items: donation.items.map((item) =>
              item.condition === "Unknown" ? { ...item, condition: item.hiddenCondition } : item
            )
          }
        },
        `Sorted ${unknownCount} unknown donation item${unknownCount > 1 ? "s" : ""}. Energy -${sortEnergy}.`
      );
    });
  };

  const acceptDonation = () => {
    setGame((state) => {
      const donation = state.pendingDonation;
      if (!donation) return state;
      const stats = infrastructureStats(state.ownedInfrastructure, state.labStations);
      const openSlots = stats.storageCapacity - activeItemCount(state.inventory);
      if (openSlots < donation.items.length) {
        return pushLog(
          state,
          `Need ${donation.items.length} open storage slots for this donation. Open now: ${Math.max(0, openSlots)}.`
        );
      }
      const acceptedItems: InventoryItem[] = donation.items.map((item) => ({
        ...item,
        id: id("donated"),
        status: donationConditionToStatus(item.condition),
        buyPrice: 0,
        source: donation.donor,
        hiddenCondition: item.condition === "Unknown" ? item.hiddenCondition : undefined,
        pricing: pricingSnapshot(item, donationConditionToStatus(item.condition), item.condition === "Unknown" ? "Unknown" : item.condition, 0)
      }));
      const unknownCount = donation.items.filter((item) => item.condition === "Unknown").length;
      const entries = [
        `Accepted ${donation.tier} donation from ${donation.donor}: ${donation.items.length} item${donation.items.length > 1 ? "s" : ""} entered intake.`
      ];
      if (unknownCount) {
        entries.push(`${unknownCount} unknown item${unknownCount > 1 ? "s" : ""} need cleaning/testing to reveal condition.`);
      }
      return pushLogs(
        {
          ...state,
          inventory: [...state.inventory, ...acceptedItems],
          pendingDonation: null
        },
        entries
      );
    });
  };

  const declineDonation = () => {
    setGame((state) => {
      if (!state.pendingDonation) return state;
      return pushLog({ ...state, pendingDonation: null }, `Declined ${state.pendingDonation.tier} donation from ${state.pendingDonation.donor}.`);
    });
  };

  const buyOrUpgradeInfrastructure = (facility: InfrastructureDefinition) => {
    setGame((state) => {
      const currentLevel = state.ownedInfrastructure[facility.name] ?? 0;
      if (currentLevel >= facility.maxLevel) return pushLog(state, `${facility.name} is already maxed out.`);
      const capReason = infrastructureCapReason(state, facility.name);
      if (capReason) return pushLog(state, capReason);
      if (!infrastructureUnlocked(state, facility)) {
        return pushLog(state, `${facility.name} is still locked. Build lab progress and meet the listed requirements.`);
      }
      const nextLevel = currentLevel + 1;
      const upgraded = {
          ...state,
          ownedInfrastructure: {
            ...state.ownedInfrastructure,
            [facility.name]: nextLevel
          }
        };
      const unlockedDataCenter = !upgraded.dataCenterUnlocked && dataCenterUnlockedFor(upgraded);
      return pushLogs(
        { ...upgraded, dataCenterUnlocked: upgraded.dataCenterUnlocked || unlockedDataCenter },
        [
          `${currentLevel ? "Upgraded" : "Built"} ${facility.name} to level ${nextLevel}. Infrastructure progress is now ${infrastructureProgress(upgraded)}%.`,
          ...(unlockedDataCenter ? ["DATA CENTER unlocked. CAF can now take on regional-scale hosting, AI, and infrastructure projects."] : [])
        ]
      );
    });
  };

  const useStorageForLab = (stationName: LabStationName, itemId: string) => {
    const selected = game.inventory.find((stored) => stored.id === itemId);
    if (REQUIRE_MANUAL_UPGRADE_ITEM_SELECTION && selected) {
      const confirmed = window.confirm(`Use ${selected.name} for ${stationName} Lab upgrade? It will be removed from storage.`);
      if (!confirmed) return;
    }
    setGame((state) => {
      const station = labStationDefinition(stationName);
      const currentLevel = state.labStations[stationName] ?? 0;
      if (currentLevel >= station.maxLevel) return pushLog(state, `${stationName} is already maxed out.`);
      const capReason = labCapReason(state, stationName);
      if (capReason) return pushLog(state, capReason);
      const item = state.inventory.find((stored) => stored.id === itemId);
      if (!item) return pushLog(state, "That storage item is no longer available.");
      if (!station.acceptedTypes.includes(item.type) || !usableForLab(item)) {
        return pushLog(state, `${item.name} must be cleaned, tested, and compatible before it can build ${stationName}.`);
      }
      const nextLevel = currentLevel + 1;
      const upgraded = {
          ...state,
          labStations: {
            ...state.labStations,
            [stationName]: nextLevel
          },
          labAssignments: [
            ...state.labAssignments,
            {
              id: id("lab"),
              station: stationName,
              itemId: item.id,
              itemName: item.name,
              itemType: item.type,
              source: "Storage" as const
            }
          ],
          weeklyStats: { ...state.weeklyStats, itemsAssignedToLab: state.weeklyStats.itemsAssignedToLab + 1 },
          inventory: state.inventory.map((stored) =>
            stored.id === item.id ? { ...stored, status: "Assigned to Lab" as StorageStatus } : stored
          )
        };
      const unlockedDataCenter = !upgraded.dataCenterUnlocked && dataCenterUnlockedFor(upgraded);
      return pushLogs(
        { ...upgraded, dataCenterUnlocked: upgraded.dataCenterUnlocked || unlockedDataCenter },
        [
          `Assigned ${item.name} to ${stationName}. Lab progress is now ${labProgress(upgraded)}%.`,
          ...(unlockedDataCenter ? ["DATA CENTER unlocked. CAF can now take on regional-scale hosting, AI, and infrastructure projects."] : [])
        ]
      );
    });
  };

  const buyLabEquipment = (stationName: LabStationName) => {
    setGame((state) => {
      const station = labStationDefinition(stationName);
      const currentLevel = state.labStations[stationName] ?? 0;
      if (currentLevel >= station.maxLevel) return pushLog(state, `${stationName} is already maxed out.`);
      const capReason = labCapReason(state, stationName);
      if (capReason) return pushLog(state, capReason);
      const cost = labStationCost(station, currentLevel);
      if (state.cash < cost) return pushLog(state, `Need $${cost} to buy ${station.equipmentName}.`);
      const nextLevel = currentLevel + 1;
      const upgraded = {
          ...state,
          ...withCashChange(state, -cost, `Lab Upgrade: ${stationName}`),
          labStations: {
            ...state.labStations,
            [stationName]: nextLevel
          },
          labAssignments: [
            ...state.labAssignments,
            {
              id: id("lab"),
              station: stationName,
              itemName: station.equipmentName,
              itemType: station.purchaseItemType,
              source: "Purchased" as const
            }
          ]
        };
      const unlockedDataCenter = !upgraded.dataCenterUnlocked && dataCenterUnlockedFor(upgraded);
      return pushLogs(
        { ...upgraded, dataCenterUnlocked: upgraded.dataCenterUnlocked || unlockedDataCenter },
        [
          `Bought ${station.equipmentName} for ${stationName}. Lab progress is now ${labProgress(upgraded)}%.`,
          ...(unlockedDataCenter ? ["DATA CENTER unlocked. CAF can now take on regional-scale hosting, AI, and infrastructure projects."] : [])
        ]
      );
    });
  };

  const takeLoan = (definition: LoanDefinition) => {
    setGame((state) => {
      if (!loanUnlocked(state, definition)) return pushLog(state, `${definition.type} is not available right now.`);
      const loan = createLoan(state, definition);
      return pushLog(
        {
          ...state,
          ...withCashChange(state, loan.amount, `Loan Received: ${definition.type}`),
          creditScore: clampStat(state.creditScore - 2, 0, 100),
          loans: [...state.loans, loan]
        },
        `Took ${definition.type}: +$${loan.amount}, balance $${loan.remainingBalance}.`
      );
    });
  };

  const applyForGrant = (definition: GrantDefinition) => {
    setGame((state) => {
      const current = grantStateFor(state, definition.id);
      if (current.status === "Pending Review") return pushLog(state, `${definition.name} is already pending review.`);
      if (current.cooldownRemaining > 0) return pushLog(state, `${definition.name} is cooling down for ${current.cooldownRemaining} more day${current.cooldownRemaining === 1 ? "" : "s"}.`);
      return pushLog(
        {
          ...state,
          weeklyStats: { ...state.weeklyStats, grantsApplied: state.weeklyStats.grantsApplied + 1 },
          grants: state.grants.map((grant) => grant.id === definition.id
            ? { ...grant, status: "Pending Review", daysRemaining: definition.reviewDays, cooldownRemaining: 0, lastMessage: undefined }
            : grant)
        },
        `Submitted ${definition.name}. Review takes about ${definition.reviewDays} days.`
      );
    });
  };

  const completeHostingProject = (project: HostingProjectDefinition) => {
    const preview = hostingProjectAvailability(game, project);
    if (REQUIRE_MANUAL_UPGRADE_ITEM_SELECTION && preview.canComplete && preview.equipment.length) {
      const list = preview.equipment.map((item) => item.name).join(", ");
      const confirmed = window.confirm(`Use ${list} for ${project.name}? These item(s) will be removed from storage.`);
      if (!confirmed) return;
    }
    setGame((state) => {
      const availability = hostingProjectAvailability(state, project);
      if (!availability.canComplete) return pushLog(state, `${project.name} is not ready: ${availability.missing}.`);
      const equipmentIds = availability.equipment.map((item) => item.id);
      const equipmentNames = availability.equipment.map((item) => item.name);
      const next = withCashChange(state, -project.setupCost, `Hosting Setup: ${project.name}`);
      const completed = {
          ...next,
          reputation: next.reputation + project.reputationReward,
          weeklyStats: {
            ...next.weeklyStats,
            cashSpent: next.weeklyStats.cashSpent + project.setupCost
          },
          inventory: next.inventory.map((item) =>
            equipmentIds.includes(item.id) ? { ...item, status: "Assigned to Lab" as StorageStatus } : item
          ),
          hostedServices: [
            ...next.hostedServices,
            {
              id: id("hosted"),
              title: project.name,
              need: project.serviceNeed,
              slots: project.hostingSlots,
              uptime: 99,
              projectId: project.id
            }
          ],
          hostingProjects: next.hostingProjects.map((saved) =>
            saved.id === project.id
              ? { ...saved, status: "Completed" as HostingProjectStatus, startedDay: next.day, equipmentIds, equipmentNames }
              : saved
          )
        };
      const unlockedDataCenter = !completed.dataCenterUnlocked && dataCenterUnlockedFor(completed);
      return pushLogs(
        { ...completed, dataCenterUnlocked: completed.dataCenterUnlocked || unlockedDataCenter },
        [
          `Completed ${project.name}. Hosting payout +$${hostingWeeklyPayout(project)}/wk; rep +${project.reputationReward}.`,
          ...(unlockedDataCenter ? ["DATA CENTER unlocked. CAF can now take on regional-scale hosting, AI, and infrastructure projects."] : [])
        ]
      );
    });
  };

  const saveToSlot = (slotId: number) => {
    const savedAt = new Date().toISOString();
    setSaveSlots((slots) => slots.map((slot) =>
      slot.id === slotId
        ? {
          ...slot,
          name: slot.name || `CAF Run ${slotId}`,
          savedAt,
          game
        }
        : slot
    ));
    setSaved(`Saved slot ${slotId}`);
  };

  const loadFromSlot = (slot: SaveSlot) => {
    if (!slot.game) {
      setSaved(`${slot.name} is empty`);
      return;
    }
    lastAutosavedDayRef.current = slot.game.day;
    setGame(slot.game);
    setSaved(`Loaded ${slot.name}`);
  };

  const deleteSlot = (slotId: number) => {
    setSaveSlots((slots) => slots.map((slot) =>
      slot.id === slotId ? { ...slot, savedAt: null, game: null } : slot
    ));
    setSaved(`Deleted slot ${slotId}`);
  };

  const startNewGame = (difficulty: Difficulty) => {
    const fresh = newGame(difficulty);
    lastAutosavedDayRef.current = fresh.day;
    setGame(fresh);
    setNewGameDifficulty(difficulty);
    setSaved(`New ${difficulty} run`);
  };

  const nextDay = () => {
    const prevSnapshot = game;
    const computeNextDay = (state: GameState): [GameState, number] => {
      const day = state.day + 1;
      const advancedRequests = state.requests.map((request) => ({ ...request, deadline: request.deadline - 1 }));
      const expired = advancedRequests.filter((request) => request.deadline <= 0);
      const activeRequests = advancedRequests.filter((request) => request.deadline > 0);
      const week = currentWeekFor(day);
      const newRequests = week > state.requestWeek ? generateWeeklyRequests(week, state.difficulty, state.unlockedDistricts) : [];
      const shopInventories = createShopInventories(state.difficulty);

      let next: GameState = startLedgerDay({
        ...state,
        energy: dailyEnergyFor(state),
        stress: clampStat(state.stress - 1, 0, 20),
        shopInventories,
        shopRefreshes: {},
        offers: shopInventories[state.location] ?? [],
        requests: [...activeRequests, ...newRequests],
        requestWeek: Math.max(state.requestWeek, week),
        repairsToday: 0
      }, day);
      const grantResults = processGrantDay(next);
      next = grantResults.state;

      const event = roll(0, eventText.length - 1);
      if (event === 0) next = { ...next, reputation: next.reputation + 3 };
      if (event === 1) next = withCashChange(next, -12, "Random Event: Utility Bill");
      if (event === 2) next = { ...next, energy: clampStat(next.energy + 2, 0, energyStackCapFor(next)), stress: clampStat(next.stress - 1, 0, 20) };
      if (event === 3) {
        const cable = itemPool.find((item) => item.name === "Cable Bundle")!;
        const stats = infrastructureStats(next.ownedInfrastructure, next.labStations);
        if (activeItemCount(next.inventory) < stats.storageCapacity) {
          next = {
            ...next,
            inventory: [...next.inventory, {
              ...cable,
              id: id("gift"),
              status: "Incoming",
              condition: "Working",
              buyPrice: 0,
              source: "Shipping mix-up",
              pricing: pricingSnapshot(cable, "Incoming", "Working", 0)
            }]
          };
        }
      }
      if (event === 4) next = { ...next, stress: clampStat(next.stress + difficultyStress(next, 2), 0, 20) };
      if (event === 5) next = { ...withCashChange(next, Math.round(14 * difficultyConfig(next.difficulty).reward), "Random Event: Sponsor Day"), reputation: next.reputation + 2 };

      const entries = [`Day ${next.day}: ${eventText[event]}`, ...grantResults.messages];
      const stats = infrastructureStats(next.ownedInfrastructure, next.labStations);
      const overCapacity = Math.max(0, activeItemCount(next.inventory) - stats.storageCapacity);
      if (overCapacity > 0) {
        next = { ...next, stress: clampStat(next.stress + difficultyStress(next, Math.min(4, overCapacity)), 0, 20) };
        entries.push(`Storage is ${overCapacity} over capacity. Stress rises.`);
      }
      const backlog = intakeBacklogCount(next.inventory);
      const backlogLimit = 4 + (next.labStations["Intake Table"] ?? 0) * 2 + (next.labStations["Cleaning Station"] ?? 0);
      if (backlog > backlogLimit) {
        next = { ...next, stress: clampStat(next.stress + difficultyStress(next, Math.min(3, backlog - backlogLimit)), 0, 20) };
        entries.push(`Intake backlog is ${backlog}/${backlogLimit}. Tech needs to move out or build the lab.`);
      }
      const upkeepDue = Math.round(stats.upkeep * difficultyConfig(next.difficulty).upkeepCost);
      if (day % 7 === 0 && upkeepDue > 0) {
        if (next.cash >= upkeepDue) {
          next = withCashChange(next, -upkeepDue, "Infrastructure Upkeep");
          entries.push(`Paid infrastructure upkeep: $${upkeepDue}.`);
        } else {
          next = {
            ...next,
            stress: clampStat(next.stress + difficultyStress(next, 2), 0, 20),
            communityTrust: Math.max(0, next.communityTrust - 1),
            hostedServices: serviceUptimeChange(next.hostedServices, -3)
          };
          entries.push(`Could not pay $${upkeepDue} upkeep. Stress and trust took a hit.`);
        }
      }
      let unpaidOperatingCosts = 0;
      if (day % 7 === 0) {
        const opCosts = calculateOperatingCosts(next);
        const totalOpCost = opCosts.reduce((s, c) => s + c.amount, 0);
        const cashAvailable = next.cash;
        for (const cost of opCosts) {
          next = withCashChange(next, -cost.amount, cost.label);
          entries.push(`${cost.label.replace("Operating Cost: ", "")}: $${cost.amount}.`);
        }
        if (totalOpCost > cashAvailable) {
          unpaidOperatingCosts = totalOpCost - cashAvailable;
          const stressPenalty = unpaidOperatingCosts >= 100 ? 2 : 1;
          next = { ...next, stress: clampStat(next.stress + difficultyStress(next, stressPenalty), 0, 20) };
          if (unpaidOperatingCosts >= 100) {
            next = { ...next, communityTrust: Math.max(0, next.communityTrust - 1) };
          }
          entries.push(`Could not fully cover operating costs. Unpaid: $${unpaidOperatingCosts}. Stress increased.`);
        }
      }
      if (next.loans.length) {
        const processedLoans: Loan[] = [];
        next.loans.forEach((loan) => {
          if (day < loan.nextDueDay) {
            processedLoans.push(loan);
            return;
          }
          const payment = Math.min(loan.payment, loan.remainingBalance);
          if (next.cash >= payment) {
            next = { ...withCashChange(next, -payment, `Loan Payment: ${loan.type}`), creditScore: clampStat(next.creditScore + 1, 0, 100) };
            const remainingBalance = loan.remainingBalance - payment;
            if (remainingBalance > 0) {
              processedLoans.push({ ...loan, remainingBalance, nextDueDay: nextLoanDueDay(day, loan.cadence) });
            }
            entries.push(`Loan payment made: ${loan.type} $${payment}.`);
          } else {
            next = {
              ...next,
              stress: clampStat(next.stress + difficultyStress(next, loan.type === "Emergency Infrastructure Loan" ? 3 : loan.type === "Community Credit Line" ? 2 : 1), 0, 20),
              communityTrust: Math.max(0, next.communityTrust - (loan.type === "Micro Loan" ? 0 : loan.type === "Community Credit Line" ? 1 : 2)),
              creditScore: clampStat(next.creditScore - (loan.type === "Micro Loan" ? 5 : loan.type === "Community Credit Line" ? 8 : 12), 0, 100)
            };
            processedLoans.push({
              ...loan,
              missedPayments: loan.missedPayments + 1,
              remainingBalance: Math.round(loan.remainingBalance * 1.03),
              nextDueDay: nextLoanDueDay(day, loan.cadence)
            });
            entries.push(`Missed ${loan.type} payment. Stress rose and credit dropped.`);
          }
        });
        next = { ...next, loans: processedLoans };
      }
      if (next.hostedServices.length) {
        const usedSlots = hostingSlotsUsed(next.hostedServices);
        const overloaded = Math.max(0, usedSlots - stats.hostingCapacity);
        const chaosRisk = next.difficulty === "Chaos Mode" ? 0.08 : 0;
        const outageChance = clampStat(0.2 - stats.reliability / 500 + overloaded * 0.08 + chaosRisk, 0.02, 0.45);
        if (Math.random() < outageChance) {
          next = {
            ...next,
            stress: clampStat(next.stress + difficultyStress(next, 1), 0, 20),
            communityTrust: Math.max(0, next.communityTrust - 1),
            hostedServices: serviceUptimeChange(next.hostedServices, -roll(3, 8))
          };
          entries.push("A hosted service hiccuped overnight. Uptime and trust dipped.");
        } else {
          next = {
            ...next,
            hostedServices: serviceUptimeChange(next.hostedServices, 0.4 + stats.reliability / 250)
          };
        }
      }
      if (day % HOSTING_PAYOUT_INTERVAL_DAYS === 0) {
        const payout = weeklyHostingIncome(next);
        const activeProjects = completedHostingDefinitions(next).length;
        if (payout > 0) {
          next = {
            ...withCashChange(next, payout, `Hosting Payout: ${activeProjects} project${activeProjects === 1 ? "" : "s"}`),
            weeklyStats: {
              ...next.weeklyStats,
              cashEarned: next.weeklyStats.cashEarned + payout,
              hostingIncome: next.weeklyStats.hostingIncome + payout
            }
          };
          entries.push(`Weekly hosting payout: ${activeProjects} project${activeProjects === 1 ? "" : "s"} paid $${payout}.`);
        } else {
          entries.push("Weekly hosting payout: no active hosting projects yet.");
        }
      }
      if (day % 7 === 0) {
        const prog = labProgress(next);
        const reportData: Omit<WeeklyReport, "flavor"> = {
          week: currentWeekFor(day),
          day,
          donated: next.weeklyStats.donated,
          requestsFulfilled: next.weeklyStats.requestsFulfilled,
          itemsSold: next.weeklyStats.itemsSold,
          itemsScrapped: next.weeklyStats.itemsScrapped,
          itemsAssignedToLab: next.weeklyStats.itemsAssignedToLab,
          repairsSucceeded: next.weeklyStats.repairsSucceeded,
          repairsFailed: next.weeklyStats.repairsFailed,
          repairsJunked: next.weeklyStats.repairsJunked,
          grantsApplied: next.weeklyStats.grantsApplied,
          grantsApproved: next.weeklyStats.grantsApproved,
          grantsRejected: next.weeklyStats.grantsRejected,
          grantIncome: next.weeklyStats.grantIncome,
          hostingIncome: next.weeklyStats.hostingIncome,
          cashEarned: next.weeklyStats.cashEarned,
          cashSpent: next.weeklyStats.cashSpent,
          reputationGained: Math.max(0, next.reputation - next.weekStart.reputation),
          trustGained: Math.max(0, next.communityTrust - next.weekStart.communityTrust),
          labProgressGained: Math.max(0, prog - next.weekStart.labProgress),
          hostedServicesActive: next.hostedServices.length,
          avgUptime: next.hostedServices.length > 0 ? Math.round(next.hostedServices.reduce((s, sv) => s + sv.uptime, 0) / next.hostedServices.length) : 0,
          loansActive: next.loans.length
        };
        const report: WeeklyReport = { ...reportData, flavor: weeklyReportFlavor(reportData) };
        next = {
          ...next,
          weeklyReport: report,
          reportHistory: [report, ...next.reportHistory].slice(0, 10),
          weeklyStats: emptyWeeklyStats(),
          weekStart: { cash: next.cash, reputation: next.reputation, communityTrust: next.communityTrust, labProgress: prog },
          extraRepairsPurchasedThisWeek: 0
        };
      }
      const { newDistricts, messages: districtMessages } = checkDistrictUnlocks(next, labProgress(next));
      if (newDistricts.length > 0) {
        next = { ...next, unlockedDistricts: [...next.unlockedDistricts, ...newDistricts] };
        entries.push(...districtMessages);
      }
      const unlockedDataCenter = !next.dataCenterUnlocked && dataCenterUnlockedFor(next);
      if (unlockedDataCenter) {
        next = { ...next, dataCenterUnlocked: true };
        entries.push("DATA CENTER unlocked. CAF can now take on regional-scale hosting, AI, and infrastructure projects.");
      }
      if (expired.length) entries.push(`${expired.length} community request${expired.length > 1 ? "s" : ""} expired from the board.`);
      if (newRequests.length) entries.push(`Week ${week}: ${newRequests.length} new community requests posted.`);
      if (!state.pendingDonation) {
        const donationPressure = backlog > backlogLimit + 2 || activeItemCount(next.inventory) >= stats.storageCapacity;
        if (donationPressure && Math.random() < 0.65) {
          entries.push("A potential donor delayed drop-off because intake/storage is backed up.");
          return [pushLogs(next, entries), unpaidOperatingCosts];
        }
        const surpriseDonation = generateSurpriseDonation(state.difficulty);
        if (surpriseDonation) {
          next = { ...next, pendingDonation: surpriseDonation };
          entries.push(`${surpriseDonation.tier} surprise donation appeared from ${surpriseDonation.donor}.`);
        }
      }
      return [pushLogs(next, entries), unpaidOperatingCosts];
    };
    const [nextState, unpaid] = computeNextDay(prevSnapshot);
    setGame(nextState);
    setDailyUpdate(buildDailyUpdate(prevSnapshot, nextState, unpaid));
  };

  const reset = () => startNewGame(newGameDifficulty);
  const selectMainScreen = (screen: MainScreen) => {
    setMainScreen(screen);
    if (screen === "Market" && !availableMarketLocations.includes(game.location)) {
      visit(availableMarketLocations[0] ?? "Thrift Store");
    }
    if (screen === "Lab" && opsTab === "Loans") setOpsTab("Build the Lab");
    if (screen === "Admin") setOpsTab("Loans");
  };

  const activeItems = game.inventory.filter((item) => !isInactiveStatus(item.status));
  const displayedActiveItems = stableStorageItemsForDisplay(activeItems);
  const historyItems = game.inventory.filter((item) => isInactiveStatus(item.status));
  const donationItem = activeItems.find((item) => item.id === donationItemId) ?? null;
  const readyCount = game.inventory.filter((item) => isReadyStatus(item.status)).length;
  const inventoryValue = activeItems.reduce((total, item) => {
    return total + itemFairValue(item);
  }, 0);

  return (
    <main className="shell">
      <section className="topbar">
        <div>
          <p className="eyebrow">Community Arcade Foundation presents</p>
          <h1>CAF: Tech Hustle</h1>
          <span className="versionLabel">v5 - Map-Gated Lab/Infra Progression</span>
        </div>
        <div className="actions">
          <span className="saveToast">{saved}</span>
          <button onClick={nextDay} className="primary"><Zap size={18} /> Next Day</button>
        </div>
      </section>

      <section className="stats">
        <Stat icon={<Cpu />} label="Day" value={game.day.toString()} />
        <Stat icon={<DollarSign />} label="Cash" value={`$${game.cash}`} />
        <Stat icon={<HeartHandshake />} label="Rep" value={game.reputation.toString()} />
        <Stat icon={<ShieldCheck />} label="Trust" value={game.communityTrust.toString()} />
        <Stat icon={<Zap />} label="Energy" value={`${game.energy} (+${dailyEnergyGain}/cap ${energyCap})`} />
        <Stat icon={<Recycle />} label="Stress" value={game.stress.toString()} />
        <Stat icon={<Package />} label="Storage" value={`${currentStorageCount}/${infraStats.storageCapacity}`} />
        <Stat icon={<Wrench />} label="Repairs" value={`${game.repairsToday}/${infraStats.repairQueue}`} />
        <Stat icon={<HardDrive />} label="Hosting" value={`${hostingUsed}/${infraStats.hostingCapacity}`} />
        <Stat icon={<Building2 />} label="Next Lab" value={`${labTier.progressToNext}%`} />
      </section>

      <section className="screenNav" aria-label="Main screens">
        {mainScreens.map((screen) => (
          <button
            key={screen}
            className={mainScreen === screen ? "active" : ""}
            onClick={() => selectMainScreen(screen)}
          >
            {screen}
          </button>
        ))}
      </section>

      <section className="contextStrip">
        {mainScreen === "Market" ? (
          <div className="locationSubRow">
            {availableMarketLocations.map((place) => (
              <button
                key={place}
                className={`locationBtn${place === game.location ? " active" : ""}`}
                onClick={() => visit(place)}
              >
                {place}
              </button>
            ))}
            {lockedMarketLocations.map((place) => {
              const district = districtForMarketLocation(place);
              return (
                <button
                  key={place}
                  className="locationBtn locked"
                  disabled
                  title={`Unlock ${district} to access ${place}.`}
                >
                  {place}
                </button>
              );
            })}
            {currentStorageCount >= infraStats.storageCapacity ? (
              <span className="subRowHint danger">Storage full: clear space before buying.</span>
            ) : null}
            {marketDistrictsWithoutStores.length ? (
              <span className="subRowHint">No Market stores linked to {marketDistrictsWithoutStores.join(", ")} yet.</span>
            ) : null}
          </div>
        ) : null}
        {mainScreen === "Operations" ? (
          <div className="locationSubRow">
            <span className="subRowHint">Supply vs demand command center: storage, bulk lots, business sales, lab, hosting, and infrastructure.</span>
          </div>
        ) : null}
        {mainScreen === "Map" ? (
          <div className="districtHelp">
            <strong>{selectedDistrict}</strong>
            <span>{districtCatalog.find((entry) => entry.name === selectedDistrict)?.description ?? "Select a district to see what it does."}</span>
          </div>
        ) : null}
        {mainScreen === "Hosting" ? (
          <div className="districtHelp">
            <strong>Hosting Economy</strong>
            <span>Complete projects with repaired gear, open districts, hosting capacity, and setup cash. Payouts arrive every 7 days.</span>
          </div>
        ) : null}
        <div className="navStatusRow">
          <span>{game.difficulty}</span>
          <span>Ready {readyCount}</span>
          <span>Intake {intakeBacklog}</span>
          <span>Lab Tier: {labTier.current.name}</span>
          <span>Next Lab: {labTier.next ? `${labTier.progressToNext}% to ${labTier.next.name}` : "Maxed"}</span>
          <span>Infra {infrastructureProgressValue}%/{upgradePhase.cap}%</span>
          <span>{game.dataCenterUnlocked ? "DATA CENTER Open" : "DATA CENTER Locked"}</span>
          <span>Credit {game.creditScore}</span>
          <span>Value ${inventoryValue}</span>
          <span>Hosting ${hostingWeeklyIncome}/wk</span>
          <span>Next Hosting Payout Day {hostingPayoutDay}</span>
        </div>
      </section>
      <section className={`board screen-${mainScreen.toLowerCase()}`}>
        <section className={`panel market ${mainScreen === "Market" ? "" : "screenHidden"}`}>
          <PanelTitle heading={game.location} sub={
              game.location === "Business Sales" ? "Sell gear" :
               game.location === "Bulk Buyers" ? "Clear storage" :
               game.pendingDonation ? "Surprise" :
               game.offers.length ? "Buy low" : "Give back"
            } />
          <div className="marketBody">
            {game.location === "Business Sales" ? (() => {
              const businessItems = activeItems.filter(isBusinessSaleEligible);
              const ineligibleBusinessItems = activeItems
                .filter((item) => !isBusinessSaleEligible(item))
                .slice(0, 4)
                .map((item) => ({ item, reason: businessSaleReason(item) }));
              if (businessItems.length === 0) {
                return (
                  <div className="emptyZone">
                    <p>No business-ready single items. Business buyers only want cleaned, tested, Ready to Sell gear.</p>
                    <p>Premium buyers only want excellent/pristine high-end gear. Use Bulk Buyers or Scrap for lower-quality items.</p>
                    {ineligibleBusinessItems.length ? (
                      <div className="businessReasons">
                        {ineligibleBusinessItems.map(({ item, reason }) => (
                          <span key={item.id}>{item.name}: {reason}</span>
                        ))}
                      </div>
                    ) : null}
                  </div>
                );
              }
              return (
                <div className="sellList">
                  <div className="businessIntro">
                    <span>Selective single-item buyers. Most offers are fair or good; rare premium offers only hit excellent/pristine high-end gear.</span>
                  </div>
                  {businessItems.map((item) => {
                    const fair = itemFairValue(item);
                    const resale = itemResaleEstimate(item);
                    const offer = businessOfferForItem(item, game, labProgressValue);
                    const heat = sellPriceHeat(offer.value, resale);
                    const profit = item.buyPrice ? offer.value - item.buyPrice : null;
                    const quality = itemQuality(item);
                    return (
                      <article className="sellCard" key={item.id}>
                        <div className="sellCardMain">
                          <strong>{item.name}</strong>
                          <span className="sellCardCond">{item.condition ?? conditionFromStatus(item.status)} / {quality}</span>
                          <span className={`priceHeat ${offer.className}`}>{offer.label}</span>
                          <span className={`priceHeat ${heat.className}`}>{heat.label}</span>
                        </div>
                        <div className="sellCardMeta">
                          <span className="sellCardPrice">${offer.value}</span>
                          {profit !== null && (
                            <span className={`sellProfit ${profit >= 0 ? "pos" : "neg"}`}>
                              {profit >= 0 ? "+" : "-"}${Math.abs(profit)}
                            </span>
                          )}
                          <span className="sellCardFair">Fair ${fair}</span>
                          <span className="sellCardFair">Resale ${resale}</span>
                          <span className="sellCardFair">{Math.round(offer.multiplier * 100)}% resale</span>
                          <span className="sellCardStatus">{item.status}</span>
                        </div>
                        <button className="sellBtn" onClick={() => sellToBusiness(item)}>Sell ${offer.value}</button>
                      </article>
                    );
                  })}
                  {ineligibleBusinessItems.length ? (
                    <div className="businessReasons">
                      {ineligibleBusinessItems.map(({ item, reason }) => (
                        <span key={item.id}>{item.name}: {reason}</span>
                      ))}
                    </div>
                  ) : null}
                </div>
              );
            })() : game.location === "Bulk Buyers" ? (() => {
              const mixedItems = bulkLotEligibleItems(activeItems, mixedBulkLot);
              const partsItems = bulkLotEligibleItems(activeItems, { label: "Parts Preview", minItems: 1, partsOnly: true });
              if (mixedItems.length === 0 && partsItems.length === 0) {
                return (
                  <div className="emptyZone">
                    No processed items to sell in bulk. Test or repair items first.
                  </div>
                );
              }
              const lots = bulkLotGroups
                .map((group) => ({ ...group, items: bulkLotEligibleItems(activeItems, group) }))
                .filter((lot) => lot.items.length > 0);
              const mixedTotal = mixedItems.reduce((sum, item) => sum + bulkItemValue(item), 0);
              const mixedReady = mixedItems.length >= mixedBulkLot.minItems;
              return (
                <div className="bulkPanel">
                  <div className="bulkIntro">
                    <span>Bulk buyers only buy lots. Business Sales still handles individual gear for better margins.</span>
                    <span className="bulkHeat">~65-85% of adjusted fair after condition risk</span>
                  </div>
                  <div className="bulkLotList">
                    {lots.map((lot) => {
                      const total = lot.items.reduce((sum, item) => sum + bulkItemValue(item), 0);
                      const ready = lot.items.length >= lot.minItems;
                      const brokenCount = lot.items.filter((i) => {
                        const c = i.condition ?? conditionFromStatus(i.status);
                        return c === "Broken" || c === "Needs Parts" || i.status === "Needs Repair";
                      }).length;
                      return (
                        <article className="bulkLotCard" key={lot.label}>
                          <div className="bulkLotHeader">
                            <strong>{lot.label}</strong>
                            <span className="bulkLotCount">{lot.items.length}/{lot.minItems} eligible</span>
                          </div>
                          <span className={`bulkMinimum ${ready ? "met" : ""}`}>{bulkLotNeedText(lot.items.length, lot.minItems)}</span>
                          {brokenCount > 0 && (
                            <span className="bulkPartsNote">{lot.partsOnly ? `${brokenCount} needs-repair/parts item${brokenCount > 1 ? "s" : ""} included` : `${brokenCount} rough item${brokenCount > 1 ? "s" : ""}`}</span>
                          )}
                          <div className="bulkLotFoot">
                            <span className="bulkLotTotal">${total} total</span>
                            <button
                              className="bulkSellBtn"
                              onClick={() => sellBulkLot(lot, lot.items)}
                              disabled={!ready}
                              title={ready ? `Sell ${lot.items.length}-item ${lot.label}.` : bulkLotNeedText(lot.items.length, lot.minItems)}
                            >
                              Sell Lot
                            </button>
                          </div>
                        </article>
                      );
                    })}
                    <article className="bulkLotCard bulkMixed">
                      <div className="bulkLotHeader">
                        <strong>Mixed Tech Lot</strong>
                        <span className="bulkLotCount">{mixedItems.length}/{mixedBulkLot.minItems} eligible</span>
                      </div>
                      <span className={`bulkMinimum ${mixedReady ? "met" : ""}`}>{bulkLotNeedText(mixedItems.length, mixedBulkLot.minItems)}</span>
                      <div className="bulkLotFoot">
                        <span className="bulkLotTotal">${mixedTotal} total</span>
                        <button
                          className="bulkSellBtn"
                          onClick={() => sellBulkLot(mixedBulkLot, mixedItems)}
                          disabled={!mixedReady}
                          title={mixedReady ? `Sell ${mixedItems.length}-item mixed tech lot.` : bulkLotNeedText(mixedItems.length, mixedBulkLot.minItems)}
                        >
                          Sell All
                        </button>
                      </div>
                    </article>
                  </div>
                </div>
              );
            })() : game.pendingDonation ? (
              <DonationEventCard
                donation={game.pendingDonation}
                energy={game.energy}
                onAccept={acceptDonation}
                onSort={sortDonation}
                onDecline={declineDonation}
              />
            ) : game.offers.length ? (
              <div className="marketShopLayout">
                <div className="marketInventoryColumn">
                <div className="shopNote">
                  <span>New inventory each day. Restocks tomorrow.</span>
                  {shopLocations.includes(game.location) ? (
                    <button
                      onClick={scoutForDeals}
                      disabled={!canScoutCurrentStore}
                      title={scoutBlockReason || `Costs ${scoutEnergyCost} energy and $5. Refreshes this shop once today.`}
                    >
                      Scout for more deals
                    </button>
                  ) : null}
                </div>
                <div className="offerGrid">
                  {game.offers.map((offer) => {
                    const fair = offer.pricing.adjustedFairValue;
                    const resale = offer.pricing.expectedResaleValue;
                    const profit = resale - offer.price;
                    const heat = { label: offer.pricing.dealLabel, className: offer.pricing.dealClassName };
                    const shopForBadges = shopForBadgesForOffer(offer, marketShopForNeeds);
                    return (
                      <article className="itemCard" key={offer.id}>
                        <div className="shopItemHeader">
                          <strong>{offer.name}</strong>
                          {shopForBadges.length ? (
                            <div className="shopItemBadges">
                              {shopForBadges.map((badge) => (
                                <span className={`shopNeedBadge ${badge === "Request Need" ? "request" : badge === "Lab Need" ? "lab" : "buyer"}`} key={badge}>
                                  {badge}
                                </span>
                              ))}
                            </div>
                          ) : null}
                        </div>
                        <span>{offer.condition}</span>
                        <p>Buy ${offer.price}</p>
                        <div className="itemEconomics shopEconomics">
                          <span>Fair: ${fair}</span>
                          <span>Resale Estimate: ${resale}</span>
                          <span>Potential Profit: {profit >= 0 ? "+" : "-"}${Math.abs(profit)}</span>
                        </div>
                        <span className={`priceHeat ${heat.className}`}>
                          {`${heat.label} | Buy: $${offer.price} | Fair: $${fair} | ${priceDifferenceText(offer.price, fair)}`}
                        </span>
                        <button onClick={() => buy(offer)}>Buy</button>
                      </article>
                    );
                  })}
                </div>
                </div>
                {mainScreen === "Market" && shopLocations.includes(game.location) ? (
                  <ShopForPanel needs={marketShopForNeeds} />
                ) : null}
              </div>
            ) : (
              mainScreen === "Market" && shopLocations.includes(game.location) ? (
                <div className="marketShopLayout">
                  <div className="marketInventoryColumn">
                    <div className="shopNote">
                      <span>New inventory each day. Restocks tomorrow.</span>
                      <button
                        onClick={scoutForDeals}
                        disabled={!canScoutCurrentStore}
                        title={scoutBlockReason || `Costs ${scoutEnergyCost} energy and $5. Refreshes this shop once today.`}
                      >
                        Scout for more deals
                      </button>
                    </div>
                    <div className="emptyZone">Sold out for today. Restocks tomorrow.</div>
                  </div>
                  <ShopForPanel needs={marketShopForNeeds} />
                </div>
              ) : (
                <div className="emptyZone">{`Bring ready tech here to donate. Ready items: ${readyCount}.`}</div>
              )
            )}
          </div>
        </section>

        <section className={`panel operationsDashboard ${mainScreen === "Operations" ? "" : "screenHidden"}`}>
          <OperationsDashboard
            game={game}
            activeItems={activeItems}
            selectedItemId={selectedOpsItemId}
            selectedDemand={selectedOpsDemand}
            onSelectItem={setSelectedOpsItemId}
            onSelectDemand={setSelectedOpsDemand}
            onClean={cleanItem}
            onTest={testItem}
            onRepair={repair}
            onDonate={(item) => setDonationItemId(item.id)}
            onSell={sell}
            onScrap={scrap}
            onBusinessSale={confirmBusinessSale}
            onAddToBulkBuy={addItemToBulkBuy}
            onUseStorageForLab={useStorageForLab}
            onBuyLabEquipment={buyLabEquipment}
            onBuyInfrastructure={buyOrUpgradeInfrastructure}
            onStageInfrastructureItem={stageItemForInfrastructure}
            onCompleteHosting={completeHostingProject}
          />
        </section>

        <section className="panel requests screenHidden">
          <PanelTitle heading={<><ClipboardList size={19} /> Requests Board</>} sub={`Week ${game.requestWeek}`} />
          <div className="requestList">
            {game.requests.length === 0 ? (
              <div className="emptyZone">No active requests. New posts arrive next week.</div>
            ) : (
              game.requests.map((request) => {
                const availability = requestAvailability(game, request);
                return (
                  <article className="requestCard" key={request.id}>
                    <div>
                      <strong>{request.title}</strong>
                      <p>{request.description}</p>
                    </div>
                    <div className="requestMeta">
                      {request.district ? <span className="districtBadge">[{request.district}]</span> : null}
                      <span>Need: {request.need}</span>
                      <span>Due: {request.deadline}d</span>
                      <span>Rep +{request.reputationReward}</span>
                      <span>Trust +{request.trustReward}</span>
                      {request.cashDonation ? <span>${request.cashDonation} gift</span> : null}
                    </div>
                    {availability.canFulfill ? (
                      <button onClick={() => fulfillRequest(request)}>Fulfill</button>
                    ) : (
                      <small>Missing: {availability.missing}</small>
                    )}
                  </article>
                );
              })
            )}
          </div>
        </section>

        <section className="panel storageRoom screenHidden">
          <PanelTitle heading="Storage Room" sub={`${activeItems.length} active | ${historyItems.length} history`} />

          <div className="storageSummary">
            {storageSummary.length === 0 ? (
              <span className="summaryEmpty">No gear tracked yet.</span>
            ) : (
              storageSummary.map(([type, byStatus]) => (
                <div className="summaryRow" key={type}>
                  <strong>{type}</strong>
                  <div>
                    {storageStatuses.map((status) =>
                      byStatus?.[status] ? (
                        <span className={`statusChip ${statusClass(status)}`} key={status}>
                          {status}: {byStatus[status]}
                        </span>
                      ) : null
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="inventoryList">
            {activeItems.length === 0 ? (
              <div className="emptyZone">Storage is empty. Go hunt for tech bargains.</div>
            ) : (
              displayedActiveItems.map((item) => {
                const fair = itemFairValue(item);
                const resale = itemResaleEstimate(item);
                const sellOffer = sellOfferValue(item, game);
                const heat = sellPriceHeat(sellOffer, resale);
                const cleanReason = cleanButtonReason(item, game);
                const testReason = testButtonReason(item, game);
                const repairReason = repairButtonReason(item, game, infraStats);
                const donateReason = donateButtonReason(item);
                const sellReason = sellButtonReason(item);
                const scrapReason = scrapButtonReason(item);
                const repairCost = repairNumbers(item, game.labStations);
                const canClean = item.status === "Incoming" || item.status === "Needs Cleaning";
                const canTest = item.status === "Cleaned";
                const canRepair = item.status === "Needs Repair";
                const scrapEstimate = scrapValue(item);
                return (
                  <article className={`inventoryRow ${statusClass(item.status)}`} key={item.id}>
                    <div className="itemHeader">
                      <div>
                        <strong>{item.name}</strong>
                        <span>{item.condition ?? conditionFromStatus(item.status)} / {itemQuality(item)} / {item.status} | repair {repairCost.energy} energy / ${repairCost.cash}</span>
                      </div>
                      <span className={`statusPill ${statusClass(item.status)}`}>{item.status}</span>
                    </div>
                    <div className="itemEconomics">
                      <span>{`Quick Sell: $${sellOffer}`}</span>
                      <span>{`Fair: $${fair}`}</span>
                      <span>{`Resale Estimate: $${resale}`}</span>
                      <span>{`Scrap: $${scrapEstimate}`}</span>
                      <span>Source: {item.source ?? "Unknown"}</span>
                      <span>Bought: {item.buyPrice ? `$${item.buyPrice}` : "Donation"}</span>
                      <span>Profit: {profitText(sellOffer, item.buyPrice)}</span>
                      {item.pricing?.dealLabel ? <span>Original Deal: {item.pricing.dealLabel}</span> : null}
                      <span className={`priceHeat ${heat.className}`}>{`${heat.label} | Offer: $${sellOffer} | Value: $${resale} | ${sellDifferenceText(sellOffer, resale)}`}</span>
                    </div>
                    <small className="repairHint">
                      {item.status === "Incoming" || item.status === "Needs Cleaning" ? cleanReason
                        : item.status === "Cleaned" ? testReason
                        : item.status === "Tested" ? "Ready. Donate, sell, assign to lab, or scrap."
                        : item.status === "Needs Repair" ? repairReason
                        : item.status === "Junked" ? "This item is permanently junked. Scrap it for parts."
                        : null}
                    </small>
                    <div className="rowActions">
                      <button onClick={() => cleanItem(item)} disabled={!canClean || cleanReason !== "Clean intake item. Uses 1 energy."} title={cleanReason}>Clean</button>
                      <button onClick={() => testItem(item)} disabled={!canTest || testReason !== "Test cleaned item. Uses 1 energy."} title={testReason}>Test</button>
                      <button onClick={() => repair(item)} disabled={!canRepair || repairReason !== "Repairs use 1 repair slot and energy."} title={repairReason}>Repair</button>
                      <button onClick={() => setDonationItemId(item.id)} title={donateReason}>Donate</button>
                      <button onClick={() => sell(item)} disabled={item.status !== "Ready to Sell" && item.status !== "Tested"} title={sellReason}>{`Sell $${sellOffer}`}</button>
                      <button onClick={() => scrap(item)} disabled={isInactiveStatus(item.status)} title={scrapReason}>Scrap</button>
                    </div>
                  </article>
                );
              })
            )}
          </div>
          {historyItems.length ? (
            <div className={`historyBox ${showHistory || activeItems.length === 0 ? "open" : "collapsed"}`}>
              <button onClick={() => setShowHistory((value) => !value)}>
                {showHistory || activeItems.length === 0 ? "Hide History" : `Show History (${historyItems.length})`}
              </button>
              {(showHistory || activeItems.length === 0) ? (
                <>
                  <strong>Deployed / Sold / Lab / History</strong>
                  {historyItems.slice(0, 8).map((item) => (
                    <span key={item.id}>{item.status}: {item.name} from {item.source ?? "Unknown"}</span>
                  ))}
                </>
              ) : null}
            </div>
          ) : null}
        </section>

        <section className={`panel hostingPanel ${mainScreen === "Hosting" ? "" : "screenHidden"}`}>
          <HostingProjectsPanel
            game={game}
            stats={infraStats}
            nextPayoutDay={hostingPayoutDay}
            onComplete={completeHostingProject}
          />
        </section>

        <section className={`panel infrastructure ${mainScreen === "Lab" ? "" : "screenHidden"}`}>
          <OpsPanel
            activeTab={opsTab}
            onTabChange={setOpsTab}
            availableTabs={["Infrastructure", "Build the Lab"]}
            game={game}
            stats={infraStats}
            hostingUsed={hostingUsed}
            avgUptime={avgUptime}
            onBuyUpgrade={buyOrUpgradeInfrastructure}
            onTakeLoan={takeLoan}
            onUseStorageForLab={useStorageForLab}
            onBuyLabEquipment={buyLabEquipment}
            onStageInfrastructureItem={stageItemForInfrastructure}
            onBuyExtraRepair={buyExtraRepair}
          />
        </section>

        <section className={`panel loansAdminPanel ${mainScreen === "Admin" ? "" : "screenHidden"}`}>
          <LoansPanel game={game} onTakeLoan={takeLoan} />
        </section>

        <section className={`panel adminPanel ${mainScreen === "Admin" ? "" : "screenHidden"}`}>
          <PanelTitle heading={<><BarChart2 size={19} /> Admin</>} sub="Reports / Ledger / Saves" />
          <div className="adminActions">
            <button onClick={() => setShowReportHistory(true)}><BarChart2 size={17} /> Impact Reports</button>
            <button onClick={() => setShowLedger(true)}><DollarSign size={17} /> Accounting Ledger</button>
            <button onClick={() => setSavesOpen(true)}><Save size={17} /> Saves Modal</button>
            <button onClick={rebuildLabInfraProgress}>Rebuild Lab/Infra Progress From Purchased Upgrades</button>
          </div>
          <GrantsPanel game={game} onApply={applyForGrant} />
        </section>

        <section className={`panel mapPanel ${mainScreen === "Map" ? "" : "screenHidden"}`}>
          <DistrictsPanel
            unlockedDistricts={game.unlockedDistricts}
            districtProgress={game.districtProgress}
            labProgressValue={labProgressValue}
            game={game}
            selectedDistrict={selectedDistrict}
            onSelectDistrict={handleSelectDistrict}
          />
        </section>

        <section className="panel log screenHidden">
          <h2>Daily Feed</h2>
          {game.log.map((entry, index) => (
            <p key={`${entry}-${index}`}>{entry}</p>
          ))}
        </section>
      </section>
      {savesOpen ? (
        <div className="modalOverlay" role="dialog" aria-modal="true" aria-label="Save slots">
          <section className="modalPanel">
            <button className="modalClose" onClick={() => setSavesOpen(false)}>Close</button>
            <SavesPanel
              game={game}
              saveSlots={dailyAutosave ? [dailyAutosave, ...saveSlots] : saveSlots}
              newGameDifficulty={newGameDifficulty}
              onSaveSlot={saveToSlot}
              onLoadSlot={(slot) => {
                loadFromSlot(slot);
                if (slot.game) setSavesOpen(false);
              }}
              onDeleteSlot={deleteSlot}
              onNewDifficultyChange={setNewGameDifficulty}
              onNewGame={() => {
                reset();
                setSavesOpen(false);
              }}
            />
          </section>
        </div>
      ) : null}
      {donationItem ? (
        <DonationChoiceModal
          game={game}
          item={donationItem}
          onClose={() => setDonationItemId(null)}
          onChoose={(destinationId) => {
            donate(donationItem, destinationId);
            setDonationItemId(null);
          }}
        />
      ) : null}
      {dailyUpdate && !game.weeklyReport ? (
        <DailyUpdateModal data={dailyUpdate} onClose={() => setDailyUpdate(null)} />
      ) : null}
      {game.weeklyReport ? (
        <WeeklyReportModal report={game.weeklyReport} onClose={dismissWeeklyReport} />
      ) : null}
      {showReportHistory ? (
        <ReportHistoryModal reports={game.reportHistory} onClose={() => setShowReportHistory(false)} />
      ) : null}
      {showLedger ? (
        <LedgerModal ledger={game.ledger} currentCash={game.cash} onClose={() => setShowLedger(false)} />
      ) : null}
    </main>
  );
}

function DonationChoiceModal({
  game,
  item,
  onClose,
  onChoose
}: {
  game: GameState;
  item: InventoryItem;
  onClose: () => void;
  onChoose: (destinationId: string) => void;
}) {
  const destinations = donationDestinationsForItem(game, item);
  const futureDestinations = futureDonationDestinationsForItem(game, item);
  const generalRep = Math.max(1, Math.ceil(item.rep / 2));
  const generalDisabled = !canDonateItem(item);
  const generalReason = generalDisabled ? donateButtonReason(item) : `General donation completed. Trust +1, Rep +${generalRep}.`;
  return (
    <div className="modalOverlay" role="dialog" aria-modal="true" aria-label="Donation destination">
      <section className="modalPanel donationChoiceModal">
        <button className="modalClose" onClick={onClose}>Close</button>
        <PanelTitle heading="Donate / Use Item" sub={item.name} />
        <div className="donationItemSummary">
          <strong>{item.name}</strong>
          <span>{item.type} | {item.condition ?? conditionFromStatus(item.status)} | {item.status}</span>
          <span>Fair ${itemFairValue(item)} | Resale ${itemResaleEstimate(item)} | Scrap ${scrapValue(item)}</span>
        </div>
        <div className="donationOptions">
          <button className="donationOption" onClick={() => onChoose("general")} disabled={generalDisabled} title={generalReason}>
            <strong>General Donate</strong>
            <span>{generalReason}</span>
          </button>
          {destinations.length ? destinations.map((destination) => (
            <button className="donationOption" key={destination.id} onClick={() => onChoose(destination.id)}>
              <strong>{destination.label}</strong>
              <span>{donationDestinationDetail(destination, game, item)}</span>
            </button>
          )) : null}
          {futureDestinations.map((destination) => (
            <button className="donationOption future" key={destination.id} disabled title={destination.reason}>
              <strong>{destination.label}</strong>
              <span>Locked: {destination.reason}</span>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}

function donationDestinationDetail(destination: DonationDestination, game: GameState, item: InventoryItem) {
  if (destination.kind === "request") {
    const request = destination.request;
    return `Specific request. Trust +${request.trustReward}, Rep +${request.reputationReward}${request.cashDonation ? `, $${request.cashDonation} gift` : ""}.`;
  }
  if (destination.kind === "lab") {
    const level = destination.station.maxLevel;
    return `Accepted types: ${destination.station.acceptedTypes.join(", ")}. Trust +2, Rep +2. Max level ${level}.`;
  }
  if (destination.kind === "infrastructure") {
    const needs = infrastructureItemTypesNeeded(destination.facility).map((need) => need.label).join(" | ");
    return `${needs || "Progresses infrastructure readiness"}. Trust +2, Rep +2.`;
  }
  if (destination.kind === "hosting") return `Completes hosting if setup cash/slots are ready. Pays $${hostingWeeklyPayout(destination.project)}/wk.`;
  const committed = game.inventory.filter((stored) => stored.status === "Reserved" && stored.source === `Bulk Buy: ${destination.lot.label}`);
  const progressAfter = committed.some((stored) => stored.id === item.id) ? committed.length : committed.length + 1;
  if (progressAfter >= destination.lot.minItems) {
    const payoutItems = committed.some((stored) => stored.id === item.id) ? committed : [...committed, item];
    const payout = payoutItems.reduce((sum, stored) => sum + bulkItemValue(stored), 0);
    return `Final item: completes ${destination.lot.label} and pays $${payout}.`;
  }
  return `Progress ${progressAfter}/${destination.lot.minItems}. ${destination.lot.minItems - progressAfter} more needed.`;
}

function itemOperationTags(item: InventoryItem, game: GameState) {
  const tags: string[] = [];
  const donationDestinations = donationDestinationsForItem(game, item);
  const futureDestinations = futureDonationDestinationsForItem(game, item);
  const reservedBulk = item.status === "Reserved" && item.source?.startsWith("Bulk Buy:");
  const hasActiveLab = donationDestinations.some((destination) => destination.kind === "lab");
  const hasActiveInfrastructure = donationDestinations.some((destination) => destination.kind === "infrastructure");
  const hasActiveHosting = donationDestinations.some((destination) => destination.kind === "hosting");
  const hasActiveBulk = donationDestinations.some((destination) => destination.kind === "bulk");
  const hasSpecificDonation = donationDestinations.some((destination) => destination.kind === "request");
  if (canDonateItem(item)) tags.push(hasSpecificDonation ? "Specific Donation" : "General Donate");
  if (hasSpecificDonation && donationDestinations.some((destination) => destination.kind === "request" && destination.request.district === "Schools")) tags.push("School Donation");
  if (hasActiveLab) tags.push("Lab");
  if (hasActiveInfrastructure) tags.push("Infrastructure");
  if (hasActiveHosting) tags.push("Hosting");
  if (reservedBulk) tags.push("Committed to Bulk Buy");
  if (isBusinessSaleEligible(item)) tags.push("Business Sale");
  if (hasActiveBulk) tags.push("Bulk Buy");
  if (item.status === "Reserved") tags.push("Reserved");
  if (item.status === "Assigned to Lab") tags.push("Assigned");
  if (futureDestinations.length) tags.push("Future Need");
  if (futureDestinations.length && !donationDestinations.length) tags.push("Locked Need");
  return [...new Set(tags)];
}

function bulkLotForItem(item: InventoryItem) {
  return [...bulkLotGroups, mixedBulkLot].find((lot) => bulkLotEligibleItems([item], { ...lot, minItems: 1 }).length > 0) ?? null;
}

function storageOperationPriority(item: InventoryItem, game: GameState) {
  if (isReservedStorageItem(item)) return 90;
  if (isBusinessSaleEligible(item)) return 0;
  if (bulkLotForItem(item)) return 2;
  if (
    labStationCatalog.some((station) => availableLabItems(game, station).some((candidate) => candidate.id === item.id) && !labCapReason(game, station.name)) ||
    infrastructureCatalog.some((facility) => infrastructureUnlocked(game, facility) && !infrastructureCapReason(game, facility.name) && infrastructureItemTypesNeeded(facility).some((need) => need.types.includes(item.type)) && usableForLab(item)) ||
    hostingProjectCatalog.some((project) => hostingProjectAvailability(game, project).canComplete && project.requiredEquipment.some((need) => need.types.includes(item.type)) && usableForHosting(item))
  ) return 3;
  if (itemOperationTags(item, game).some((tag) => ["Lab", "Infrastructure", "Hosting", "Future Need"].includes(tag))) return 4;
  if (item.status === "Junked" || item.status === "Scrapped") return 99;
  return 5;
}

function demandMatchesItem(item: InventoryItem, demand: string | null, game: GameState) {
  if (!demand) return false;
  if (demand === "business") return isBusinessSaleEligible(item);
  if (demand.startsWith("bulk:")) {
    const label = demand.slice(5);
    const lot = [...bulkLotGroups, mixedBulkLot].find((entry) => entry.label === label);
    return lot ? bulkLotEligibleItems([item], { ...lot, minItems: 1 }).length > 0 : false;
  }
  if (demand.startsWith("lab:")) {
    const station = labStationDefinition(demand.slice(4) as LabStationName);
    return availableLabItems(game, station).some((candidate) => candidate.id === item.id);
  }
  if (demand.startsWith("infra:")) {
    const facility = infrastructureCatalog.find((entry) => entry.name === demand.slice(6));
    return Boolean(facility && infrastructureItemTypesNeeded(facility).some((need) => need.types.includes(item.type)) && usableForLab(item));
  }
  if (demand.startsWith("hosting:")) {
    const project = hostingProjectCatalog.find((entry) => entry.id === demand.slice(8));
    return Boolean(project && project.requiredEquipment.some((need) => need.types.includes(item.type)) && usableForHosting(item));
  }
  return false;
}


function resizeLayoutPair(values: [number, number, number], leftIndex: number, rightIndex: number, delta: number, min: number): [number, number, number] {
  const next: [number, number, number] = [...values];
  const safeDelta = clampStat(delta, min - next[leftIndex], next[rightIndex] - min);
  next[leftIndex] = Math.round((next[leftIndex] + safeDelta) * 10) / 10;
  next[rightIndex] = Math.round((next[rightIndex] - safeDelta) * 10) / 10;
  return next;
}

function OperationsDashboard({
  game,
  activeItems,
  selectedItemId,
  selectedDemand,
  onSelectItem,
  onSelectDemand,
  onClean,
  onTest,
  onRepair,
  onDonate,
  onSell,
  onScrap,
  onBusinessSale,
  onAddToBulkBuy,
  onUseStorageForLab,
  onBuyLabEquipment,
  onBuyInfrastructure,
  onStageInfrastructureItem,
  onCompleteHosting
}: {
  game: GameState;
  activeItems: InventoryItem[];
  selectedItemId: string | null;
  selectedDemand: string | null;
  onSelectItem: (id: string | null) => void;
  onSelectDemand: (id: string | null) => void;
  onClean: (item: InventoryItem) => void;
  onTest: (item: InventoryItem) => void;
  onRepair: (item: InventoryItem) => void;
  onDonate: (item: InventoryItem) => void;
  onSell: (item: InventoryItem) => void;
  onScrap: (item: InventoryItem) => void;
  onBusinessSale: (item: InventoryItem) => void;
  onAddToBulkBuy: (item: InventoryItem) => void;
  onUseStorageForLab: (station: LabStationName, itemId: string) => void;
  onBuyLabEquipment: (station: LabStationName) => void;
  onBuyInfrastructure: (facility: InfrastructureDefinition) => void;
  onStageInfrastructureItem: (facility: InfrastructureDefinition, item: InventoryItem) => void;
  onCompleteHosting: (project: HostingProjectDefinition) => void;
}) {
  const selectedItem = activeItems.find((item) => item.id === selectedItemId) ?? null;
  const businessItems = activeItems.filter(isBusinessSaleEligible);
  const storageItems = stableStorageItemsForDisplay(activeItems);
  const labNeeds = labStationCatalog.filter((station) => (game.labStations[station.name] ?? 0) < station.maxLevel);
  const infraNeeds = infrastructureCatalog.filter((facility) => (game.ownedInfrastructure[facility.name] ?? 0) < facility.maxLevel);
  const hostingNeeds = hostingProjectCatalog.filter((project) => hostingProjectStateFor(game, project.id).status === "Inactive");
  const unifiedNeeds = [
    ...labNeeds.map((station) => {
      const matches = availableLabItems(game, station);
      const capReason = labCapReason(game, station.name);
      const level = game.labStations[station.name] ?? 0;
      return {
        key: `lab:${station.name}`,
        category: "Lab",
        title: station.name,
        status: capReason ? "Locked" : matches.length ? "Ready" : "Partial",
        sort: capReason ? 2 : matches.length ? 0 : 1,
        progress: `L${level}/${station.maxLevel}`,
        requirement: station.acceptedTypes.join(", "),
        benefit: station.benefits.join(" + "),
        locked: capReason,
        matches,
        action: (item: InventoryItem) => onUseStorageForLab(station.name, item.id),
        actionLabel: "Use for Lab"
      };
    }),
    ...infraNeeds.map((facility) => {
      const needs = infrastructureItemTypesNeeded(facility);
      const matches = needs.flatMap((need) => matchingStorageForTypes(activeItems, need.types));
      const capReason = infrastructureCapReason(game, facility.name);
      const unlocked = infrastructureUnlocked(game, facility);
      const level = game.ownedInfrastructure[facility.name] ?? 0;
      const reqText = requirementLabels(facility.requirements).join(" | ");
      const locked = capReason || (!unlocked ? `Locked: ${reqText || "meet Infrastructure requirements first"}` : "");
      return {
        key: `infra:${facility.name}`,
        category: "Infrastructure",
        title: facility.name,
        status: locked ? "Locked" : matches.length ? "Ready" : "Partial",
        sort: locked ? 2 : matches.length ? 0 : 1,
        progress: `L${level}/${facility.maxLevel}`,
        requirement: needs.length ? needs.map((need) => need.label).join(" | ") : (reqText || "cash/map gate"),
        benefit: facility.description,
        locked,
        matches,
        action: (item: InventoryItem) => onStageInfrastructureItem(facility, item),
        actionLabel: "Use for Infrastructure"
      };
    }),
    ...hostingNeeds.map((project) => {
      const availability = hostingProjectAvailability(game, project);
      const matches = project.requiredEquipment.flatMap((need) => matchingStorageForTypes(activeItems, need.types));
      return {
        key: `hosting:${project.id}`,
        category: "Hosting",
        title: project.name,
        status: availability.canComplete ? "Ready" : matches.length ? "Partial" : "Locked",
        sort: availability.canComplete ? 0 : matches.length ? 1 : 2,
        progress: `$${hostingWeeklyPayout(project)}/wk`,
        requirement: project.requiredEquipment.map((need) => need.label).join(" | "),
        benefit: project.riskNote ?? "Recurring weekly hosting revenue.",
        locked: availability.canComplete ? "" : `Locked: ${availability.missing || hostingSlotUnlockText(game)}`,
        matches,
        action: () => onCompleteHosting(project),
        actionLabel: "Complete Hosting"
      };
    })
  ].sort((a, b) => a.sort - b.sort || a.category.localeCompare(b.category));

  return (
    <div className="opsDashboardGrid">
      <aside className="opsStoragePanel">
        <PanelTitle heading="Storage Supply" sub={`${activeItems.length} active`} />
        {selectedItem ? (
          <div className="opsSelectedUse">
            <strong>{selectedItem.name}</strong>
            <span>{itemOperationTags(selectedItem, game).join(" | ") || "No current demand matches"}</span>
          </div>
        ) : null}
        <div className="opsStorageList">
          {storageItems.length ? storageItems.map((item) => {
            const selected = item.id === selectedItemId;
            const highlighted = demandMatchesItem(item, selectedDemand, game);
            const cleanReason = cleanButtonReason(item, game);
            const testReason = testButtonReason(item, game);
            const repairReason = repairButtonReason(item, game, infrastructureStats(game.ownedInfrastructure, game.labStations));
            const bulkLot = bulkLotForItem(item);
            const reservedBulk = item.status === "Reserved" && item.source?.startsWith("Bulk Buy:");
            const donateReason = donateButtonReason(item);
            const sellReason = sellButtonReason(item);
            const scrapReason = scrapButtonReason(item);
            const donationReason = canDonateItem(item)
              ? "Open donation/use options: General Donate, requests, Lab, Infrastructure, Hosting, or Bulk Buy when valid."
              : donateReason;
            return (
              <article className={`opsStorageItem ${selected ? "selected" : ""} ${highlighted ? "highlighted" : ""}`} key={item.id} onClick={() => onSelectItem(selected ? null : item.id)}>
                <div>
                  <strong>{item.name}</strong>
                  <span>{item.type} | {item.condition ?? conditionFromStatus(item.status)} | {item.status}</span>
                </div>
                <div className="requestMeta">
                  <span>Fair ${itemFairValue(item)}</span>
                  <span>Resale ${itemResaleEstimate(item)}</span>
                  <span>Scrap ${scrapValue(item)}</span>
                </div>
                <div className="opsTags">
                  {itemOperationTags(item, game).map((tag) => <span key={tag}>{tag}</span>)}
                </div>
                {reservedBulk ? <small className="capWarning">{item.source}</small> : null}
                <div className="rowActions">
                  <button title={cleanReason} onClick={(event) => { event.stopPropagation(); onClean(item); }} disabled={cleanReason !== "Clean intake item. Uses 1 energy."}>Clean</button>
                  <button title={testReason} onClick={(event) => { event.stopPropagation(); onTest(item); }} disabled={testReason !== "Test cleaned item. Uses 1 energy."}>Test</button>
                  <button title={repairReason} onClick={(event) => { event.stopPropagation(); onRepair(item); }} disabled={repairReason !== "Repairs use 1 repair slot and energy."}>Repair</button>
                  <button title={donationReason} onClick={(event) => { event.stopPropagation(); onDonate(item); }}>Donate</button>
                  <button title={sellReason} onClick={(event) => { event.stopPropagation(); onSell(item); }} disabled={item.status !== "Ready to Sell" && item.status !== "Tested"}>Sell</button>
                  <button title={scrapReason} onClick={(event) => { event.stopPropagation(); onScrap(item); }} disabled={isInactiveStatus(item.status)}>Scrap</button>
                </div>
              </article>
            );
          }) : <div className="emptyZone">Storage is empty. Source tech from Market or donations.</div>}
        </div>
      </aside>
      <section className="opsUnifiedNeedsPanel">
        <PanelTitle heading="Unified Needs" sub="Lab | Infrastructure | Hosting" />
        <div className="opsDemandBody">
          {unifiedNeeds.map((need) => (
            <article className={`opsDemandCard ${need.status.toLowerCase()}`} key={need.key} onMouseEnter={() => onSelectDemand(need.key)}>
              <div><strong>{need.title}</strong><span>{need.category} | {need.status}</span></div>
              <p>{need.requirement}</p>
              <small>{need.progress} | {need.benefit}</small>
              {need.locked ? <small className="capWarning">{need.locked}</small> : null}
              {need.category === "Hosting" && need.status === "Ready" ? (
                <button onClick={() => need.action(need.matches[0])}>{need.actionLabel}</button>
              ) : need.locked ? (
                <small>Matching storage is useful later, but this destination is not unlocked yet.</small>
              ) : (
                <MatchingItemButtons items={need.matches} empty="No matching storage items yet." onUse={need.action} action={need.actionLabel} />
              )}
            </article>
          ))}
        </div>
      </section>
      <section className="opsBusinessPanel">
        <PanelTitle heading="Business Sale Requests" sub={`${businessItems.length} ready`} />
        <div className="opsDemandBody">
          {businessItems.length ? businessItems.map((item) => {
            const offer = businessOfferForItem(item, game, labProgress(game));
            return (
              <article className="opsDemandCard" key={item.id} onMouseEnter={() => onSelectDemand("business")}>
                <div><strong>{item.name}</strong><span>${offer.value}</span></div>
                <p>{offer.label}. Requires cleaned/tested business-ready gear.</p>
                <button onClick={() => onBusinessSale(item)}>Fulfill Business Sale Request</button>
              </article>
            );
          }) : <div className="emptyZone compact">No business-ready storage items.</div>}
        </div>
      </section>
    </div>
  );
}


function HostingProjectsPanel({
  game,
  stats,
  nextPayoutDay,
  onComplete
}: {
  game: GameState;
  stats: ReturnType<typeof infrastructureStats>;
  nextPayoutDay: number;
  onComplete: (project: HostingProjectDefinition) => void;
}) {
  const usedSlots = hostingSlotsUsed(game.hostedServices);
  const activeProjects = hostingProjectCatalog.filter((project) => {
    const status = hostingProjectStateFor(game, project.id).status;
    return status === "Completed" || status === "Active";
  });
  const availableProjects = hostingProjectCatalog.filter((project) => hostingProjectAvailability(game, project).canComplete);
  const lockedProjects = hostingProjectCatalog.filter((project) => {
    const current = hostingProjectStateFor(game, project.id);
    return current.status === "Inactive" && !hostingProjectAvailability(game, project).canComplete;
  });

  return (
    <>
      <PanelTitle heading={<><HardDrive size={19} /> Hosting Projects</>} sub={`$${weeklyHostingIncome(game)}/wk | payout day ${nextPayoutDay}`} />
      <div className="hostingSummary">
        <span>Active projects {activeProjects.length}</span>
        <span>Weekly payout ${weeklyHostingIncome(game)}</span>
        <span>Next Hosting Payout Day {nextPayoutDay}</span>
        <span>Hosting slots {usedSlots}/{stats.hostingCapacity}</span>
        <span>{hostingSlotUnlockText(game)}</span>
        <span>Average uptime {averageUptime(game.hostedServices)}%</span>
      </div>
      <div className="hostingColumns">
        <section className="hostingColumn">
          <h3>Available</h3>
          {availableProjects.length ? availableProjects.map((project) => (
            <HostingProjectCard
              key={project.id}
              project={project}
              mode="available"
              state={hostingProjectStateFor(game, project.id)}
              availabilityMissing={hostingProjectAvailability(game, project).missing}
              onComplete={onComplete}
            />
          )) : <div className="emptyZone compact">No projects ready. Repair gear, unlock map zones, or build hosting capacity.</div>}
        </section>
        <section className="hostingColumn">
          <h3>Active</h3>
          {activeProjects.length ? activeProjects.map((project) => (
            <HostingProjectCard
              key={project.id}
              project={project}
              mode="active"
              state={hostingProjectStateFor(game, project.id)}
              availabilityMissing={hostingProjectAvailability(game, project).missing}
              onComplete={onComplete}
            />
          )) : <div className="emptyZone compact">No recurring hosting income yet.</div>}
        </section>
        <section className="hostingColumn">
          <h3>Locked</h3>
          {lockedProjects.map((project) => (
            <HostingProjectCard
              key={project.id}
              project={project}
              mode="locked"
              state={hostingProjectStateFor(game, project.id)}
              availabilityMissing={hostingProjectAvailability(game, project).missing}
              onComplete={onComplete}
            />
          ))}
        </section>
      </div>
    </>
  );
}

function OpsPanel({
  activeTab,
  onTabChange,
  availableTabs = ["Infrastructure", "Build the Lab", "Loans"],
  game,
  stats,
  hostingUsed,
  avgUptime,
  onBuyUpgrade,
  onTakeLoan,
  onUseStorageForLab,
  onBuyLabEquipment,
  onStageInfrastructureItem,
  onBuyExtraRepair
}: {
  activeTab: OpsTab;
  onTabChange: (tab: OpsTab) => void;
  availableTabs?: OpsTab[];
  game: GameState;
  stats: ReturnType<typeof infrastructureStats>;
  hostingUsed: number;
  avgUptime: number;
  onBuyUpgrade: (facility: InfrastructureDefinition) => void;
  onTakeLoan: (loan: LoanDefinition) => void;
  onUseStorageForLab: (station: LabStationName, itemId: string) => void;
  onBuyLabEquipment: (station: LabStationName) => void;
  onStageInfrastructureItem: (facility: InfrastructureDefinition, item: InventoryItem) => void;
  onBuyExtraRepair: () => void;
}) {
  return (
    <>
      <div className="opsTabs">
        {availableTabs.map((tab) => (
          <button key={tab} className={activeTab === tab ? "selected" : ""} onClick={() => onTabChange(tab)}>
            {tab}
          </button>
        ))}
      </div>
      {activeTab === "Infrastructure" ? (
        <InfrastructurePanel
          game={game}
          stats={stats}
          hostingUsed={hostingUsed}
          avgUptime={avgUptime}
          onBuyUpgrade={onBuyUpgrade}
          onStageItem={onStageInfrastructureItem}
        />
      ) : null}
      {activeTab === "Build the Lab" ? (
        <BuildLabPanel
          game={game}
          stats={stats}
          onUseStorageForLab={onUseStorageForLab}
          onBuyLabEquipment={onBuyLabEquipment}
          onBuyExtraRepair={onBuyExtraRepair}
        />
      ) : null}
      {activeTab === "Loans" ? (
        <LoansPanel game={game} onTakeLoan={onTakeLoan} />
      ) : null}
    </>
  );
}


function BuildLabPanel({
  game,
  stats,
  onUseStorageForLab,
  onBuyLabEquipment,
  onBuyExtraRepair
}: {
  game: GameState;
  stats: ReturnType<typeof infrastructureStats>;
  onUseStorageForLab: (station: LabStationName, itemId: string) => void;
  onBuyLabEquipment: (station: LabStationName) => void;
  onBuyExtraRepair: () => void;
}) {
  const progress = labProgress(game);
  const tier = labTierInfo(progress);
  const phase = mapUpgradePhase(game);
  const capReached = progress >= phase.cap && phase.cap < 100;
  const stationLevels = labStationCatalog.reduce((total, station) => total + (game.labStations[station.name] ?? 0), 0);

  return (
    <>
      <PanelTitle heading={<><Building2 size={19} /> Build the Lab</>} sub={`Lab ${progress}% / Cap ${phase.cap}%`} />
      <p className="missionLine">Tech comes in so it can go back out or build the lab.</p>
      <div className="labProgressBox">
        <div>
          <strong>Lab Tier: {tier.current.name}</strong>
          <span>Total build {progress}% | Map cap {phase.cap}%</span>
        </div>
        <div className="labProgressTrack" aria-label={`Progress to next lab tier ${tier.progressToNext}%`}>
          <span style={{ width: `${tier.progressToNext}%` }} />
        </div>
        <div className="labTierDetails">
          <span>Progress to Next Tier: {tier.progressToNext}%</span>
          <span>Next Tier: {tier.next?.name ?? "Complete"}</span>
          <span>Unlocks: {tier.next?.unlocks ?? tier.current.unlocks}</span>
          <span>Map Gate: {phase.reason}</span>
          {capReached ? <span className="capWarning">{capBlockMessage("Lab", phase.cap)} {phase.next}</span> : <span>Next Cap: {phase.next}</span>}
        </div>
      </div>
      <MilestoneList title="Lab Milestones" tiers={labTiers} progress={progress} cap={phase.cap} />
      <div className="infraMeter">
        <span>{stationLevels}/{labStationCatalog.reduce((total, station) => total + station.maxLevel, 0)} station levels</span>
        <span>Repairs {game.repairsToday}/{stats.repairQueue}</span>
        <span>Storage {activeItemCount(game.inventory)}/{stats.storageCapacity}</span>
        <span>Hosting {stats.hostingCapacity}</span>
        <span>Processed {processedItemCount(game)}</span>
      </div>
      {(() => {
        const purchased = game.extraRepairsPurchasedThisWeek ?? 0;
        const COSTS = [25, 45, 75];
        const nextCost = purchased < 3 ? COSTS[purchased] : null;
        return (
          <div className="extraRepairRow">
            <span>Contract repair help: {purchased}/3 used this week</span>
            {nextCost !== null ? (
              <button onClick={onBuyExtraRepair} disabled={game.cash < nextCost}>
                Hire help (${nextCost}) — frees 1 repair slot today
              </button>
            ) : (
              <span className="capWarning">Maxed for this week. Resets next week.</span>
            )}
          </div>
        );
      })()}
      <div className="stationGrid">
        {labStationCatalog.map((station) => {
          const level = game.labStations[station.name] ?? 0;
          const maxed = level >= station.maxLevel;
          const usableItems = availableLabItems(game, station);
          const assignments = game.labAssignments.filter((assignment) => assignment.station === station.name);
          const capReason = labCapReason(game, station.name);
          return (
            <article className={`stationCard ${capReason ? "locked" : maxed ? "maxed" : level ? "upgraded" : "empty"}`} key={station.name}>
              <div>
                <strong>{station.name}</strong>
                <span>{maxed ? "Maxed" : level ? `Level ${level}` : "Empty"}</span>
              </div>
              <p>{station.description}</p>
              <div className="infraBonuses">
                {station.benefits.map((benefit) => <span key={benefit}>{benefit}</span>)}
              </div>
              <small>
                Assigned: {assignments.length ? assignments.map((assignment) => assignment.itemName).join(", ") : "none"}
              </small>
              {capReason ? <small className="capWarning">{capReason}</small> : null}
              <div className="labActions">
                <div className="labStorageChoices">
                  {usableItems.length ? usableItems.slice(0, 4).map((usableItem) => (
                    <button
                      key={usableItem.id}
                      onClick={() => onUseStorageForLab(station.name, usableItem.id)}
                      disabled={Boolean(capReason) || maxed}
                      title={capReason || `Confirm using ${usableItem.name} from Storage for ${station.name}.`}
                    >
                      Use {usableItem.name}
                    </button>
                  )) : (
                    <button disabled title="Need a cleaned/tested compatible item in Storage.">Use From Storage</button>
                  )}
                  {usableItems.length > 4 ? <small>+{usableItems.length - 4} more compatible item{usableItems.length - 4 === 1 ? "" : "s"} in storage.</small> : null}
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </>
  );
}

function InfrastructurePanel({
  game,
  stats,
  hostingUsed,
  avgUptime,
  onBuyUpgrade,
  onStageItem
}: {
  game: GameState;
  stats: ReturnType<typeof infrastructureStats>;
  hostingUsed: number;
  avgUptime: number;
  onBuyUpgrade: (facility: InfrastructureDefinition) => void;
  onStageItem: (facility: InfrastructureDefinition, item: InventoryItem) => void;
}) {
  const progress = infrastructureProgress(game);
  const tier = infrastructureTierInfo(progress);
  const phase = mapUpgradePhase(game);
  const capReached = progress >= phase.cap && phase.cap < 100;
  return (
    <>
      <PanelTitle heading={<><Building2 size={19} /> Infrastructure</>} sub={`Infra ${progress}% / Cap ${phase.cap}%`} />
      <div className="labProgressBox">
        <div>
          <strong>Infrastructure Tier: {tier.current.name}</strong>
          <span>Upkeep ${stats.upkeep}/wk | Map cap {phase.cap}%</span>
        </div>
        <div className="labProgressTrack" aria-label={`Progress to next infrastructure tier ${tier.progressToNext}%`}>
          <span style={{ width: `${tier.progressToNext}%` }} />
        </div>
        <div className="labTierDetails">
          <span>Progress to Next Tier: {tier.progressToNext}%</span>
          <span>Next Tier: {tier.next?.name ?? "Complete"}</span>
          <span>Unlocks: {tier.next?.unlocks ?? tier.current.unlocks}</span>
          <span>Map Gate: {phase.reason}</span>
          {capReached ? <span className="capWarning">{capBlockMessage("Infrastructure", phase.cap)} {phase.next}</span> : <span>Next Cap: {phase.next}</span>}
        </div>
      </div>
      <MilestoneList title="Infrastructure Milestones" tiers={infrastructureTiers} progress={progress} cap={phase.cap} />
      <div className="infraMeter">
        <span>Total Lab Build {labProgress(game)}%</span>
        <span>Infrastructure {progress}%</span>
        <span>Lab Tier {labMilestone(labProgress(game))}</span>
        <span>Storage {activeItemCount(game.inventory)}/{stats.storageCapacity}</span>
        <span>Repair {game.repairsToday}/{stats.repairQueue}</span>
        <span>Hosting {hostingUsed}/{stats.hostingCapacity}</span>
        <span>Uptime {avgUptime}%</span>
      </div>
      {game.hostedServices.length ? (
        <div className="hostedStrip">
          {game.hostedServices.map((service) => (
            <span key={service.id}>{service.title}: {Math.round(service.uptime)}%</span>
          ))}
        </div>
      ) : null}
      <div className="infraList">
        {infrastructureCatalog.map((facility) => {
          const level = game.ownedInfrastructure[facility.name] ?? 0;
          const unlocked = infrastructureUnlocked(game, facility);
          const maxed = level >= facility.maxLevel;
          const reqs = requirementLabels(facility.requirements);
          const capReason = infrastructureCapReason(game, facility.name);
          return (
            <article className={`infraCard ${capReason ? "locked" : level ? "owned" : unlocked ? "available" : "locked"}`} key={facility.name}>
              <div>
                <strong>{facility.name}</strong>
                <span>{level ? `Level ${level}/${facility.maxLevel}` : unlocked ? "Available" : "Locked"}</span>
              </div>
              <p>{facility.description}</p>
              <div className="infraBonuses">
                <span>Upkeep ${facility.upkeep}</span>
                <span>Store +{facility.storageBonus}</span>
                <span>Repair +{facility.repairBonus}</span>
                <span>Host +{facility.hostingBonus}</span>
                <span>Reliability +{facility.reliabilityBonus}</span>
              </div>
              {!unlocked ? (
                <div className="unmetReqs">
                  <small className="unmetReqsLabel">Still needed:</small>
                  {unmetInfrastructureRequirements(game, facility.requirements).map((row, i) => (
                    <small key={i} className="unmetReqRow">– {row}</small>
                  ))}
                </div>
              ) : (
                reqs.length ? <small>Req: {reqs.join(" | ")}</small> : <small>Req: none</small>
              )}
              {capReason ? <small className="capWarning">{capReason}</small> : null}
              {infrastructureItemTypesNeeded(facility).map((need) => {
                const matches = matchingStorageForTypes(game.inventory, need.types).slice(0, 3);
                if (!matches.length) return null;
                return (
                  <div key={need.label} className="labStorageChoices">
                    {matches.map((item) => (
                      <button key={item.id} onClick={() => onStageItem(facility, item)} title={`Use ${item.name} for ${facility.name}`}>
                        Use {item.name} from Storage
                      </button>
                    ))}
                  </div>
                );
              })}
              <button
                onClick={() => onBuyUpgrade(facility)}
                disabled={Boolean(capReason) || !unlocked || maxed}
                title={capReason || (unlocked ? `${level ? "Upgrade" : "Build"} ${facility.name}.` : "Meet listed requirements first.")}
              >
                {maxed ? "Max" : level ? "Upgrade" : "Build"}
              </button>
            </article>
          );
        })}
      </div>
    </>
  );
}

function LoansPanel({
  game,
  onTakeLoan
}: {
  game: GameState;
  onTakeLoan: (loan: LoanDefinition) => void;
}) {
  const weeklyDue = game.loans
    .filter((loan) => loan.cadence === "Weekly")
    .reduce((total, loan) => total + Math.min(loan.payment, loan.remainingBalance), 0);
  const monthlyDue = game.loans
    .filter((loan) => loan.cadence === "Monthly")
    .reduce((total, loan) => total + Math.min(loan.payment, loan.remainingBalance), 0);

  return (
    <>
      <PanelTitle heading={<><CreditCard size={19} /> Loans</>} sub={`Credit ${game.creditScore}`} />
      <div className="infraMeter">
        <span>Active {game.loans.length}</span>
        <span>Weekly due ${weeklyDue}</span>
        <span>Monthly due ${monthlyDue}</span>
      </div>
      <div className="infraList">
        {game.loans.length ? (
          game.loans.map((loan) => (
            <article className="loanCard owned" key={loan.id}>
              <div>
                <strong>{loan.type}</strong>
                <span>{loan.cadence} | due day {loan.nextDueDay}</span>
              </div>
              <p>Balance ${loan.remainingBalance}. Payment ${Math.min(loan.payment, loan.remainingBalance)}. Interest {Math.round(loan.interestRate * 100)}%.</p>
              <small>Missed payments: {loan.missedPayments}</small>
            </article>
          ))
        ) : (
          <div className="emptyZone compact">No active loans.</div>
        )}
        {loanCatalog.map((loan) => {
          const unlocked = loanUnlocked(game, loan);
          const rate = effectiveLoanInterest(game, loan);
          const reqs = loanRequirementLabels(loan.requirements);
          return (
            <article className={`loanCard ${unlocked ? "available" : "locked"}`} key={loan.type}>
              <div>
                <strong>{loan.type}</strong>
                <span>${loan.amount} | {Math.round(rate * 100)}%</span>
              </div>
              <p>{loan.description}</p>
              <div className="infraBonuses">
                <span>{loan.cadence}</span>
                <span>Pay ${Math.round(loan.basePayment * difficultyConfig(game.difficulty).loanInterest)}</span>
                <span>{loan.missedPenalty}</span>
              </div>
              {reqs.length ? <small>Req: {reqs.join(" | ")}</small> : <small>Req: none</small>}
              <button onClick={() => onTakeLoan(loan)} disabled={!unlocked}>Take Loan</button>
            </article>
          );
        })}
      </div>
    </>
  );
}

function GrantsPanel({
  game,
  onApply
}: {
  game: GameState;
  onApply: (grant: GrantDefinition) => void;
}) {
  return (
    <section className="grantsPanel">
      <PanelTitle heading={<><HeartHandshake size={19} /> Grants</>} sub="Funding applications" />
      <div className="grantList">
        {grantCatalog.map((grant) => {
          const state = grantStateFor(game, grant.id);
          const pending = state.status === "Pending Review";
          const cooling = state.cooldownRemaining > 0 && !pending;
          const available = !pending && !cooling;
          return (
            <article className={`grantCard ${statusClass(state.status as StorageStatus)}`} key={grant.id}>
              <div>
                <strong>{grant.name}</strong>
                <span>{state.status}{pending ? ` (${state.daysRemaining}d)` : cooling ? ` (${state.cooldownRemaining}d)` : ""}</span>
              </div>
              <p>{grant.description}</p>
              <div className="requestMeta">
                <span>${grant.payoutRange[0]}-${grant.payoutRange[1]}</span>
                <span>Review {grant.reviewDays}d</span>
                <span>Cooldown {grant.cooldownDays}d</span>
              </div>
              <small>{grant.guidance}</small>
              {state.lastMessage ? <small className={state.lastResult === "Approved" ? "grantGood" : "grantBad"}>{state.lastMessage}</small> : null}
              <button onClick={() => onApply(grant)} disabled={!available}>
                {pending ? "Pending" : cooling ? "Cooling Down" : "Apply"}
              </button>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function SavesPanel({
  game,
  saveSlots,
  newGameDifficulty,
  onSaveSlot,
  onLoadSlot,
  onDeleteSlot,
  onNewDifficultyChange,
  onNewGame
}: {
  game: GameState;
  saveSlots: SaveSlot[];
  newGameDifficulty: Difficulty;
  onSaveSlot: (slotId: number) => void;
  onLoadSlot: (slot: SaveSlot) => void;
  onDeleteSlot: (slotId: number) => void;
  onNewDifficultyChange: (difficulty: Difficulty) => void;
  onNewGame: () => void;
}) {
  return (
    <>
      <PanelTitle heading={<><Save size={19} /> Saves</>} sub={game.difficulty} />
      <div className="newGameBox">
        <select value={newGameDifficulty} onChange={(event) => onNewDifficultyChange(event.target.value as Difficulty)}>
          {difficulties.map((difficulty) => (
            <option key={difficulty} value={difficulty}>{difficulty}</option>
          ))}
        </select>
        <button onClick={onNewGame}>New Game</button>
      </div>
      <div className="saveList">
        {saveSlots.map((slot) => (
          <article className="saveCard" key={slot.id}>
            <div>
              <strong>{slot.name}</strong>
              <span>{formatSavedTime(slot.savedAt)}</span>
            </div>
            <p>{saveSlotSummary(slot)}</p>
            {slot.game ? (
              <div className="requestMeta">
                <span>{slot.game.difficulty}</span>
                <span>Cash ${slot.game.cash}</span>
                <span>Rep {slot.game.reputation}</span>
                <span>Trust {slot.game.communityTrust}</span>
              </div>
            ) : null}
            <div className="saveActions">
              <button onClick={() => onSaveSlot(slot.id)} disabled={slot.id === 0}>Save</button>
              <button onClick={() => onLoadSlot(slot)} disabled={!slot.game}>Load</button>
              <button onClick={() => onDeleteSlot(slot.id)} disabled={!slot.game || slot.id === 0}><Trash2 size={14} /> Delete</button>
            </div>
          </article>
        ))}
      </div>
    </>
  );
}

function WeeklyReportModal({ report, onClose }: { report: WeeklyReport; onClose: () => void }) {
  const net = report.cashEarned - report.cashSpent;
  return (
    <div className="modalOverlay" role="dialog" aria-modal="true" aria-label="Weekly Impact Report">
      <section className="modalPanel weeklyReport">
        <div className="reportHeader">
          <h2>[ WEEK {report.week} IMPACT REPORT ]</h2>
          <span>Day {report.day}</span>
        </div>
        <p className="reportFlavor">"{report.flavor}"</p>
        <div className="reportGrid">
          <div className="reportSection">
            <strong>OUTGOING</strong>
            <span>Donated: {report.donated}</span>
            <span>Requests fulfilled: {report.requestsFulfilled}</span>
            <span>Items sold: {report.itemsSold}</span>
            <span>Scrapped / recycled: {report.itemsScrapped}</span>
            <span>Assigned to lab: {report.itemsAssignedToLab}</span>
          </div>
          <div className="reportSection">
            <strong>FINANCIALS</strong>
            <span>Cash earned: ${report.cashEarned}</span>
            <span>Cash spent: ${report.cashSpent}</span>
            <span>Hosting income: ${report.hostingIncome}</span>
            <span>Net: {net >= 0 ? "+" : ""}{net}</span>
          </div>
          <div className="reportSection">
            <strong>FUNDING</strong>
            <span>Grants applied: {report.grantsApplied}</span>
            <span>Grants approved: {report.grantsApproved}</span>
            <span>Grants rejected: {report.grantsRejected}</span>
            <span>Grant income: ${report.grantIncome}</span>
          </div>
          <div className="reportSection">
            <strong>REPAIRS</strong>
            <span>Successful repairs: {report.repairsSucceeded}</span>
            <span>Failed repairs: {report.repairsFailed}</span>
            <span>Junked repairs: {report.repairsJunked}</span>
          </div>
          <div className="reportSection">
            <strong>GROWTH</strong>
            <span>Rep gained: +{report.reputationGained}</span>
            <span>Trust gained: +{report.trustGained}</span>
            <span>Lab progress: +{report.labProgressGained}%</span>
          </div>
          {(report.hostedServicesActive > 0 || report.loansActive > 0) ? (
            <div className="reportSection">
              <strong>OPERATIONS</strong>
              {report.hostedServicesActive > 0 ? <span>Hosted services: {report.hostedServicesActive} ({report.avgUptime}% uptime)</span> : null}
              {report.loansActive > 0 ? <span>Active loans: {report.loansActive}</span> : null}
            </div>
          ) : null}
        </div>
        <button className="primary" onClick={onClose}>[ Continue ]</button>
      </section>
    </div>
  );
}

function exportImpactHistoryTxt(reports: WeeklyReport[]) {
  const lines: string[] = [
    "CAF Tech Hustle — Impact History",
    "=================================",
    ""
  ];
  for (const r of reports) {
    const net = r.cashEarned - r.cashSpent;
    lines.push(`Week ${r.week} — Day ${r.day}`);
    lines.push(`  "${r.flavor}"`);
    lines.push(`  Donated       : ${r.donated}`);
    lines.push(`  Requests      : ${r.requestsFulfilled}`);
    lines.push(`  Sold          : ${r.itemsSold}`);
    lines.push(`  Scrapped      : ${r.itemsScrapped}`);
    lines.push(`  Repairs       : ${r.repairsSucceeded} succeeded / ${r.repairsFailed} failed / ${r.repairsJunked} junked`);
    lines.push(`  Grants        : $${r.grantIncome}`);
    lines.push(`  Hosting       : $${r.hostingIncome}`);
    lines.push(`  Net Cash      : ${net >= 0 ? "+" : "-"}$${Math.abs(net)}`);
    lines.push("");
  }
  const blob = new Blob([lines.join("\n")], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "caf-impact-history.txt";
  a.click();
  URL.revokeObjectURL(url);
}

function ReportHistoryModal({ reports, onClose }: { reports: WeeklyReport[]; onClose: () => void }) {
  return (
    <div className="modalOverlay" role="dialog" aria-modal="true" aria-label="Impact Report History">
      <section className="modalPanel reportHistory">
        <button className="modalClose" onClick={onClose}>Close</button>
        <button className="modalClose modalCloseSecondary" onClick={() => exportImpactHistoryTxt(reports)}>Export TXT</button>
        <div className="modalHeader">
          <h2>[ IMPACT HISTORY ]</h2>
        </div>
        <div className="modalBody">
          {reports.length === 0 ? (
            <p className="emptyZone">No reports yet. Complete a full week first.</p>
          ) : (
            reports.map((r) => (
              <article key={`${r.week}-${r.day}`} className="historyReportCard">
                <strong>Week {r.week} — Day {r.day}</strong>
                <p>"{r.flavor}"</p>
                <span>Donated {r.donated} | Requests {r.requestsFulfilled} | Sold {r.itemsSold} | Scrapped {r.itemsScrapped} | Repairs {r.repairsSucceeded}/{r.repairsFailed}/{r.repairsJunked} | Grants ${r.grantIncome} | Hosting ${r.hostingIncome} | Net ${r.cashEarned - r.cashSpent}</span>
              </article>
            ))
          )}
        </div>
      </section>
    </div>
  );
}

function exportLedgerTxt(rows: (DailyLedgerEntry & { endingCash: number })[]) {
  const sorted = [...rows].sort((a, b) => a.day - b.day);
  const lines: string[] = [
    "CAF Tech Hustle — Accounting Journal",
    "=====================================",
    ""
  ];
  for (const entry of sorted) {
    const net = entry.income - entry.expenses;
    lines.push(`Day ${entry.day}`);
    lines.push(`  Starting Cash : $${entry.startingCash}`);
    if (entry.transactions && entry.transactions.length > 0) {
      lines.push("");
      lines.push("  Transactions:");
      for (const tx of entry.transactions) {
        const sign = tx.amount >= 0 ? "+" : "-";
        lines.push(`    ${sign}$${Math.abs(tx.amount).toString().padEnd(8)} ${tx.label}`);
      }
      lines.push("");
    }
    lines.push(`  Income        : +$${entry.income}`);
    lines.push(`  Expenses      : -$${entry.expenses}`);
    lines.push(`  Net           : ${net >= 0 ? "+" : "-"}$${Math.abs(net)}`);
    lines.push(`  Ending Cash   : $${entry.endingCash}`);
    lines.push("");
  }
  const blob = new Blob([lines.join("\n")], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "caf-accounting-journal.txt";
  a.click();
  URL.revokeObjectURL(url);
}

function LedgerModal({ ledger, currentCash, onClose }: { ledger: DailyLedgerEntry[]; currentCash: number; onClose: () => void }) {
  const rows = [...ledger]
    .map((entry, index, entries) => index === entries.length - 1 ? { ...entry, endingCash: currentCash } : entry)
    .sort((a, b) => b.day - a.day);
  return (
    <div className="modalOverlay" role="dialog" aria-modal="true" aria-label="Accounting Journal">
      <section className="modalPanel ledgerPanel">
        <button className="modalClose" onClick={onClose}>Close</button>
        <button className="modalClose modalCloseSecondary" onClick={() => exportLedgerTxt(rows)}>Export TXT</button>
        <div className="modalHeader">
          <h2>[ ACCOUNTING JOURNAL ]</h2>
          <p className="ledgerIntro">Daily money movement totals. Individual transactions stay in the daily feed.</p>
        </div>
        <div className="modalBody">
          {rows.length === 0 ? (
            <p className="emptyZone">No ledger entries yet.</p>
          ) : (
            <div className="ledgerList">
              {rows.map((entry) => {
                const net = entry.income - entry.expenses;
                return (
                  <article className="ledgerCard" key={entry.day}>
                    <div className="ledgerHeader">
                      <strong>Day {entry.day}</strong>
                      <span className={net >= 0 ? "ledgerPositive" : "ledgerNegative"}>{net >= 0 ? "+" : "-"}${Math.abs(net)}</span>
                    </div>
                    <div className="ledgerGrid">
                      <span>Starting Cash: ${entry.startingCash}</span>
                      <span className="ledgerPositive">Income: +${entry.income}</span>
                      <span className="ledgerNegative">Expenses: -${entry.expenses}</span>
                      <span>Net: {net >= 0 ? "+" : "-"}${Math.abs(net)}</span>
                      <span>Ending Cash: ${entry.endingCash}</span>
                    </div>
                    {entry.transactions && entry.transactions.length > 0 && (
                      <div className="ledgerTransactions">
                        {entry.transactions.map((tx, i) => (
                          <span key={i} className={tx.amount >= 0 ? "ledgerPositive" : "ledgerNegative"}>
                            {tx.amount >= 0 ? "+" : "-"}${Math.abs(tx.amount)} {tx.label}
                          </span>
                        ))}
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function DistrictsPanel({ unlockedDistricts, districtProgress: _districtProgress, labProgressValue, game, selectedDistrict, onSelectDistrict }: {
  unlockedDistricts: DistrictName[];
  districtProgress: Record<DistrictName, number>;
  labProgressValue: number;
  game: GameState;
  selectedDistrict: DistrictName;
  onSelectDistrict: (district: DistrictName) => void;
}) {
  const infraProgress = infrastructureProgress(game);
  const phase = mapUpgradePhase(game);
  const dataCenter = dataCenterRequirements(game);
  return (
    <section className="panel districts">
      <PanelTitle heading="[ Community Map ]" sub={`${unlockedDistricts.length}/${districtCatalog.length} districts`} subClassName="districtCount" />
      <div className="mapProgressSummary">
        <span>{phase.name}</span>
        <span>Lab cap {phase.cap}%</span>
        <span>Infrastructure cap {phase.cap}%</span>
        <span>Lab {labProgressValue}%</span>
        <span>Infrastructure {infraProgress}%</span>
      </div>
      <div className="districtMapGrid">
        {districtCatalog.map((district) => {
          const unlocked = unlockedDistricts.includes(district.name);
          const isSelected = district.name === selectedDistrict;
          const locs = districtLocations[district.name];
          const requirements = districtRequirementRows(district, game, labProgressValue);
          return (
            <button
              key={district.name}
              className={`districtMapCard${unlocked ? " unlocked" : " locked"}${isSelected ? " selected" : ""}`}
              onClick={() => onSelectDistrict(district.name)}
              title={unlocked ? (locs ? locs.join(", ") : district.description) : districtUnlockHint(district, game, labProgressValue)}
            >
              <span className="districtMapName">{district.name}</span>
              <span className={`districtMapStatus${unlocked ? "" : " locked"}`}>{unlocked ? "OPEN" : "LOCKED"}</span>
              <span className="districtMapDescription">{district.description}</span>
              {!unlocked ? (
                <span className="districtRequirements">
                  <span className="districtReqLabel">Still needed:</span>
                  {requirements.filter((req) => !req.met).map((req) => (
                    <span key={req.label}>– {req.label}</span>
                  ))}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
      <section className={`dataCenterBox ${game.dataCenterUnlocked ? "unlocked" : "locked"}`}>
        <div>
          <strong>DATA CENTER</strong>
          <span>{game.dataCenterUnlocked ? "UNLOCKED" : "LOCKED"}</span>
        </div>
        <p>
          {game.dataCenterUnlocked
            ? "CAF can now take on regional-scale hosting, AI, and infrastructure projects."
            : "Final-stage hook for rack server builds, GPU cluster projects, multi-tenant hosting, major contracts, security, backups, and outage systems."}
        </p>
        <div className="requestMeta">
          <span className={dataCenter.fullMap ? "met" : ""}>Full map {dataCenter.fullMap ? "met" : `${unlockedDistricts.length}/${districtCatalog.length}`}</span>
          <span className={dataCenter.labReady ? "met" : ""}>Lab {dataCenter.lab}/100%</span>
          <span className={dataCenter.infrastructureReady ? "met" : ""}>Infrastructure {dataCenter.infra}/100%</span>
          <span className={dataCenter.activeHostingReady ? "met" : ""}>Hosting contracts {completedHostingDefinitions(game).length}/3</span>
        </div>
      </section>
    </section>
  );
}


const rootElement = document.getElementById("root") as HTMLElement;
const cafGlobal = globalThis as typeof globalThis & {
  cafTechRoot?: ReturnType<typeof createRoot>;
  cafTechRootElement?: HTMLElement;
};
if (!cafGlobal.cafTechRoot || cafGlobal.cafTechRootElement !== rootElement) {
  cafGlobal.cafTechRoot = createRoot(rootElement);
  cafGlobal.cafTechRootElement = rootElement;
}
cafGlobal.cafTechRoot.render(<App />);
