import type {
  LocationName, MainScreen, DistrictName, StorageStatus, ItemType, ServiceNeed,
  HostingProjectStatus, DonationTier, DonationCondition, ItemCondition, ItemQuality,
  RevealedDonationCondition, Difficulty, InfrastructureName, LabStationName,
  OperationsLayout
} from "./types";

export const locations: LocationName[] = [
  "Thrift Store",
  "Recycling Center",
  "Marketplace",
  "Office Liquidator",
  "University Surplus",
  "Business Sales",
  "Bulk Buyers"
];
export const shopLocations: LocationName[] = ["Thrift Store", "Recycling Center", "Marketplace", "Office Liquidator", "University Surplus"];
export const coreMarketLocations: LocationName[] = ["Thrift Store", "Recycling Center", "Marketplace"];
export const mainScreens: MainScreen[] = ["Market", "Operations", "Hosting", "Lab", "Admin", "Map"];

export const districtLocations: Partial<Record<DistrictName, LocationName[]>> = {
  Garage: ["Business Sales", "Bulk Buyers"],
  Neighborhood: ["Thrift Store", "Recycling Center"],
  Downtown: ["Marketplace"],
  "Industrial Park": ["Office Liquidator", "University Surplus"],
};

export const storageStatuses: StorageStatus[] = [
  "Incoming",
  "Needs Cleaning",
  "Cleaned",
  "Tested",
  "Needs Repair",
  "Ready to Donate",
  "Ready to Sell",
  "Reserved",
  "Deployed to Community",
  "Assigned to Lab",
  "Junked",
  "Scrapped",
  "Sold"
];

export const itemTypes: ItemType[] = [
  "Laptop",
  "Desktop",
  "Memory",
  "Storage",
  "Display",
  "Network",
  "Cables",
  "Server",
  "Workstation",
  "Mini PC"
];
export const serviceNeeds: ServiceNeed[] = [
  "Scam-Safety Setup",
  "Website Hosting",
  "Game Server",
  "Pack Tracker Beta",
  "FutureDevs Portal",
  "AI App Pilot"
];
export const hostingProjectStatuses: HostingProjectStatus[] = ["Inactive", "Completed", "Active"];
export const readyStatuses: StorageStatus[] = ["Ready to Donate", "Ready to Sell", "Reserved"];
export const donationTiers: DonationTier[] = ["Tiny", "Small", "Medium", "Large", "Huge", "Legendary"];
export const donationConditions: DonationCondition[] = ["Working", "Broken", "Needs Parts", "Unknown"];
export const itemConditions: ItemCondition[] = ["Refurbished", "Working", "Broken", "Needs Parts", "Unknown"];
export const itemQualities: ItemQuality[] = ["Poor", "Standard", "Good", "Excellent", "Pristine"];
export const revealedDonationConditions: RevealedDonationCondition[] = ["Working", "Broken", "Needs Parts"];
export const difficulties: Difficulty[] = ["Easy", "Normal", "Hard", "Chaos Mode"];
export const intakeBacklogStatuses: StorageStatus[] = ["Incoming", "Needs Cleaning", "Cleaned", "Needs Repair"];
export const infrastructureNames: InfrastructureName[] = [
  "Garage Workspace",
  "Storage Unit",
  "Small Repair Shop",
  "Server Closet",
  "Mini Data Center",
  "Full Data Center",
  "Partner Facility"
];
export const labStationNames: LabStationName[] = [
  "Intake Table",
  "Cleaning Station",
  "Repair Bench",
  "Parts Shelf",
  "Testing Bench",
  "Server Rack",
  "Network Corner",
  "Training Desk",
  "AI Workstation",
  "Community Pickup Shelf",
  "Cooling/Power Upgrade"
];

export const baseStorageCapacity = 12;
export const baseRepairQueue = 3;
export const baseHostingCapacity = 0;
export const baseReliability = 82;
export const CLEAN_TEST_DESTROY_CHANCE = 0.02;
export const HIGH_RISK_DESTROY_CHANCE = 0.05;
export const REQUIRE_MANUAL_UPGRADE_ITEM_SELECTION = true;
export const PROGRESSION_GATE_TOLERANCE = 1;
export const HOSTING_PAYOUT_INTERVAL_DAYS = 7;
export const HOSTING_WEEKLY_PAYOUT_FACTOR = 0.5;
export const saveStorageKey = "caf-tech-hustle-save-slots-v2";
export const dailyAutosaveStorageKey = "caf-tech-hustle-daily-autosave-v1";
export const operationsLayoutStorageKey = "caf-tech-hustle-operations-layout-v1";
export const saveSlotCount = 3;

export const difficultyConfigs: Record<Difficulty, {
  startingCash: number;
  maxEnergy: number;
  donationRate: number;
  marketplacePrice: number;
  otherMarketPrice: number;
  repairChance: number;
  stressGain: number;
  upkeepCost: number;
  deadlineDays: number;
  loanInterest: number;
  reward: number;
  creditScore: number;
}> = {
  Easy: {
    startingCash: 500,
    maxEnergy: 18,
    donationRate: 1.55,
    marketplacePrice: 0.9,
    otherMarketPrice: 0.92,
    repairChance: 0.12,
    stressGain: 0.7,
    upkeepCost: 0.75,
    deadlineDays: 2,
    loanInterest: 0.75,
    reward: 1,
    creditScore: 78
  },
  Normal: {
    startingCash: 350,
    maxEnergy: 16,
    donationRate: 1,
    marketplacePrice: 1,
    otherMarketPrice: 1,
    repairChance: 0,
    stressGain: 1,
    upkeepCost: 1,
    deadlineDays: 0,
    loanInterest: 1,
    reward: 1,
    creditScore: 70
  },
  Hard: {
    startingCash: 200,
    maxEnergy: 13,
    donationRate: 0.65,
    marketplacePrice: 1.2,
    otherMarketPrice: 1.08,
    repairChance: -0.1,
    stressGain: 1.3,
    upkeepCost: 1.25,
    deadlineDays: -1,
    loanInterest: 1.35,
    reward: 1.08,
    creditScore: 62
  },
  "Chaos Mode": {
    startingCash: 90,
    maxEnergy: 15,
    donationRate: 1.25,
    marketplacePrice: 1.15,
    otherMarketPrice: 0.95,
    repairChance: -0.02,
    stressGain: 1.5,
    upkeepCost: 1.35,
    deadlineDays: 0,
    loanInterest: 1.5,
    reward: 1.25,
    creditScore: 58
  }
};

export const labTiers = [
  {
    threshold: 0,
    name: "Garage Lab",
    unlocks: "Basic repair flow, intake diagnostics, Tier 1 refurb work"
  },
  {
    threshold: 30,
    name: "Diagnostics Lab",
    unlocks: "Better diagnostics, Tier 2 repair readiness, basic refurb bundles"
  },
  {
    threshold: 60,
    name: "Refurb Workflow Lab",
    unlocks: "Laptop refurb workflow, better repair success, bulk repair readiness, Tier 3 repairs"
  },
  {
    threshold: 85,
    name: "Advanced Build Lab",
    unlocks: "GPU testing, NAS/server builds, workstation prep, Tier 4 repairs"
  },
  {
    threshold: 100,
    name: "AI/Server Lab",
    unlocks: "Advanced server builds, AI workstation prep, DATA CENTER technical readiness"
  }
];

export const infrastructureTiers = [
  {
    threshold: 0,
    name: "Garage Ops",
    unlocks: "Basic storage, starter upkeep, local operations"
  },
  {
    threshold: 30,
    name: "Starter Hosting Ops",
    unlocks: "Basic website hosting, podcast/media hosting, small recurring revenue"
  },
  {
    threshold: 60,
    name: "Community Hosting Ops",
    unlocks: "Small business hosting, game servers, community apps, stronger recurring revenue"
  },
  {
    threshold: 85,
    name: "Advanced Hosting Ops",
    unlocks: "Managed VPS, nonprofit app hosting, school/youth lab hosting, support capacity"
  },
  {
    threshold: 100,
    name: "Regional Infrastructure Ops",
    unlocks: "AI tool hosting, multi-service hosting, DATA CENTER operational readiness"
  }
];

export const defaultOperationsLayout: OperationsLayout = {
  columns: [34, 33, 33],
  rows: [26, 37, 37]
};
