export type ItemType =
  | "Laptop"
  | "Desktop"
  | "Memory"
  | "Storage"
  | "Display"
  | "Network"
  | "Cables"
  | "Server"
  | "Workstation"
  | "Mini PC";
export type StorageStatus =
  | "Incoming"
  | "Needs Cleaning"
  | "Cleaned"
  | "Tested"
  | "Needs Repair"
  | "Ready to Donate"
  | "Ready to Sell"
  | "Reserved"
  | "Deployed to Community"
  | "Assigned to Lab"
  | "Junked"
  | "Scrapped"
  | "Sold";
export type LocationName =
  | "Thrift Store"
  | "Recycling Center"
  | "Marketplace"
  | "Office Liquidator"
  | "University Surplus"
  | "Business Sales"
  | "Bulk Buyers";
export type ServiceNeed =
  | "Scam-Safety Setup"
  | "Website Hosting"
  | "Game Server"
  | "Pack Tracker Beta"
  | "FutureDevs Portal"
  | "AI App Pilot";
export type RequestNeed = ItemType | ServiceNeed;
export type DonationTier = "Tiny" | "Small" | "Medium" | "Large" | "Huge" | "Legendary";
export type DonationCondition = "Working" | "Broken" | "Needs Parts" | "Unknown";
export type RevealedDonationCondition = Exclude<DonationCondition, "Unknown">;
export type ItemCondition = DonationCondition | "Refurbished";
export type ItemQuality = "Poor" | "Standard" | "Good" | "Excellent" | "Pristine";
export type Difficulty = "Easy" | "Normal" | "Hard" | "Chaos Mode";
export type OpsTab = "Infrastructure" | "Build the Lab" | "Loans";
export type MainScreen = "Market" | "Operations" | "Hosting" | "Lab" | "Admin" | "Map";
export type LoanType = "Micro Loan" | "Community Credit Line" | "Emergency Infrastructure Loan";
export type LoanCadence = "Weekly" | "Monthly";
export type GrantId = "micro" | "community-tech" | "futuredevs" | "senior-safety" | "infrastructure" | "major-foundation";
export type GrantStatus = "Available" | "Pending Review" | "Approved" | "Rejected" | "On Cooldown";
export type HostingProjectStatus = "Inactive" | "Completed" | "Active";
export type ShopForSection = "Requests" | "Buyers" | "Lab";
export type InfrastructureName =
  | "Garage Workspace"
  | "Storage Unit"
  | "Small Repair Shop"
  | "Server Closet"
  | "Mini Data Center"
  | "Full Data Center"
  | "Partner Facility";
export type LabStationName =
  | "Intake Table"
  | "Cleaning Station"
  | "Repair Bench"
  | "Parts Shelf"
  | "Testing Bench"
  | "Server Rack"
  | "Network Corner"
  | "Training Desk"
  | "AI Workstation"
  | "Community Pickup Shelf"
  | "Cooling/Power Upgrade";

export type ItemTemplate = {
  name: string;
  type: ItemType;
  base: number;
  repairCost: number;
  energy: number;
  rep: number;
  scrap: number;
};

export type PricingSnapshot = {
  baseFairValue: number;
  adjustedFairValue: number;
  buyPrice: number;
  expectedResaleValue: number;
  dealLabel: string;
  dealClassName: string;
  pricedStatus: StorageStatus;
  pricedCondition: ItemCondition;
};

export type InventoryItem = ItemTemplate & {
  id: string;
  status: StorageStatus;
  buyPrice: number;
  source?: string;
  condition?: ItemCondition;
  quality?: ItemQuality;
  hiddenCondition?: RevealedDonationCondition;
  pricing?: PricingSnapshot;
};

export type Offer = ItemTemplate & {
  id: string;
  location: LocationName;
  price: number;
  status: StorageStatus;
  condition: ItemCondition;
  hiddenCondition?: RevealedDonationCondition;
  pricing: PricingSnapshot;
};

export type CommunityRequest = {
  id: string;
  title: string;
  description: string;
  kind: "item" | "service";
  need: RequestNeed;
  deadline: number;
  reputationReward: number;
  trustReward: number;
  cashDonation?: number;
  energyCost?: number;
  cashCost?: number;
  district?: DistrictName;
};

export type HostedService = {
  id: string;
  title: string;
  need: ServiceNeed;
  slots: number;
  uptime: number;
  projectId?: string;
};

export type HostingEquipmentRequirement = {
  label: string;
  types: ItemType[];
  count: number;
};

export type HostingProjectDefinition = {
  id: string;
  name: string;
  description: string;
  requiredEquipment: HostingEquipmentRequirement[];
  requiredDistrict?: DistrictName;
  requiredLabProgress?: number;
  requiredInfrastructureProgress?: number;
  requiredReputation?: number;
  setupCost: number;
  hostingSlots: number;
  serviceNeed: ServiceNeed;
  monthlyIncome: number;
  reputationReward: number;
  riskNote?: string;
};

export type HostingProject = {
  id: string;
  status: HostingProjectStatus;
  startedDay?: number;
  equipmentIds?: string[];
  equipmentNames?: string[];
};

export type Loan = {
  id: string;
  type: LoanType;
  amount: number;
  interestRate: number;
  payment: number;
  cadence: LoanCadence;
  remainingBalance: number;
  nextDueDay: number;
  missedPayments: number;
};

export type GrantDefinition = {
  id: GrantId;
  name: string;
  description: string;
  guidance: string;
  payoutRange: [number, number];
  reviewDays: number;
  cooldownDays: number;
  approvalRange: [number, number];
  minimumRejectionChance: number;
};

export type GrantApplication = {
  id: GrantId;
  status: GrantStatus;
  daysRemaining: number;
  cooldownRemaining: number;
  lastResult?: "Approved" | "Rejected";
  lastMessage?: string;
};

export type ShopForNeed = {
  id: string;
  section: ShopForSection;
  type: ItemType;
  label: string;
  detail: string;
  badge: "Request Need" | "Buyer Wants" | "Lab Need";
  priority: number;
};

export type SurpriseDonationItem = ItemTemplate & {
  id: string;
  condition: DonationCondition;
  hiddenCondition: RevealedDonationCondition;
};

export type SurpriseDonation = {
  id: string;
  donor: string;
  tier: DonationTier;
  flavor: string;
  sorted: boolean;
  items: SurpriseDonationItem[];
};

export type LabAssignment = {
  id: string;
  station: LabStationName;
  itemName: string;
  itemType?: ItemType;
  itemId?: string;
  source: "Storage" | "Purchased";
};

export type WeeklyStats = {
  donated: number;
  requestsFulfilled: number;
  itemsSold: number;
  itemsScrapped: number;
  itemsAssignedToLab: number;
  repairsSucceeded: number;
  repairsFailed: number;
  repairsJunked: number;
  grantsApplied: number;
  grantsApproved: number;
  grantsRejected: number;
  grantIncome: number;
  hostingIncome: number;
  cashEarned: number;
  cashSpent: number;
};

export type WeeklyReport = {
  week: number;
  day: number;
  donated: number;
  requestsFulfilled: number;
  itemsSold: number;
  itemsScrapped: number;
  itemsAssignedToLab: number;
  repairsSucceeded: number;
  repairsFailed: number;
  repairsJunked: number;
  grantsApplied: number;
  grantsApproved: number;
  grantsRejected: number;
  grantIncome: number;
  hostingIncome: number;
  cashEarned: number;
  cashSpent: number;
  reputationGained: number;
  trustGained: number;
  labProgressGained: number;
  hostedServicesActive: number;
  avgUptime: number;
  loansActive: number;
  flavor: string;
};

export type LedgerTransaction = {
  amount: number;
  label: string;
};

export type DailyLedgerEntry = {
  day: number;
  startingCash: number;
  income: number;
  expenses: number;
  endingCash: number;
  transactions?: LedgerTransaction[];
};

export type DistrictName = "Garage" | "Neighborhood" | "Downtown" | "Schools" | "Library" | "Senior Center" | "Industrial Park" | "Partner City";

export type GameState = {
  day: number;
  cash: number;
  reputation: number;
  communityTrust: number;
  energy: number;
  stress: number;
  inventory: InventoryItem[];
  offers: Offer[];
  shopInventories: Partial<Record<LocationName, Offer[]>>;
  shopRefreshes: Partial<Record<LocationName, number>>;
  requests: CommunityRequest[];
  requestWeek: number;
  pendingDonation: SurpriseDonation | null;
  ownedInfrastructure: Record<InfrastructureName, number>;
  labStations: Record<LabStationName, number>;
  labAssignments: LabAssignment[];
  completedRequests: number;
  hostedServices: HostedService[];
  hostingProjects: HostingProject[];
  repairsToday: number;
  difficulty: Difficulty;
  creditScore: number;
  loans: Loan[];
  grants: GrantApplication[];
  location: LocationName;
  log: string[];
  weeklyStats: WeeklyStats;
  weekStart: { cash: number; reputation: number; communityTrust: number; labProgress: number };
  weeklyReport: WeeklyReport | null;
  reportHistory: WeeklyReport[];
  ledger: DailyLedgerEntry[];
  unlockedDistricts: DistrictName[];
  districtProgress: Record<DistrictName, number>;
  dataCenterUnlocked: boolean;
};

export type SaveSlot = {
  id: number;
  name: string;
  savedAt: string | null;
  game: GameState | null;
};

export type DonationDestination =
  | { id: string; label: string; kind: "request"; request: CommunityRequest }
  | { id: string; label: string; kind: "lab"; station: LabStationDefinition }
  | { id: string; label: string; kind: "infrastructure"; facility: InfrastructureDefinition }
  | { id: string; label: string; kind: "hosting"; project: HostingProjectDefinition }
  | { id: string; label: string; kind: "bulk"; lot: BulkLotDefinition };

export type FutureDonationDestination = {
  id: string;
  label: string;
  reason: string;
  category: "Lab" | "Infrastructure" | "Hosting" | "Request";
};

export type RequestTemplate = Omit<CommunityRequest, "id" | "deadline" | "reputationReward" | "trustReward" | "cashDonation"> & {
  deadline: [number, number];
  reputationReward: [number, number];
  trustReward: [number, number];
  cashDonation?: [number, number];
};

export type DonationTierConfig = {
  tier: DonationTier;
  count: [number, number];
  donors: string[];
  flavors: string[];
  itemNames: string[];
  conditionWeights: Array<{ condition: DonationCondition; weight: number }>;
};

export type LabStationDefinition = {
  name: LabStationName;
  description: string;
  equipmentName: string;
  purchaseItemType?: ItemType;
  purchaseCost: number;
  acceptedTypes: ItemType[];
  benefits: string[];
  maxLevel: number;
};

export type InfrastructureDefinition = {
  name: InfrastructureName;
  description: string;
  purchaseCost: number;
  upkeep: number;
  storageBonus: number;
  repairBonus: number;
  hostingBonus: number;
  reliabilityBonus: number;
  requirements: {
    reputation?: number;
    communityTrust?: number;
    completedRequests?: number;
    facility?: InfrastructureName;
    labProgress?: number;
    stations?: Partial<Record<LabStationName, number>>;
    processedItems?: number;
    anyStationOrProcessed?: {
      station: LabStationName;
      level: number;
      processedItems: number;
    };
    assignedTypes?: Partial<Record<ItemType, number>>;
    assignedAny?: Array<{
      label: string;
      types: ItemType[];
      count: number;
    }>;
    hostingCapacity?: number;
    deploymentHistory?: number;
  };
  maxLevel: number;
};

export type LoanDefinition = {
  type: LoanType;
  description: string;
  amount: number;
  baseInterest: number;
  cadence: LoanCadence;
  basePayment: number;
  maxActive: number;
  requirements: {
    reputation?: number;
    communityTrust?: number;
    completedRequests?: number;
    maxLoans?: number;
  };
  missedPenalty: string;
};

export type DistrictConfig = {
  name: DistrictName;
  description: string;
  unlockRequirements: {
    communityTrust?: number;
    reputation?: number;
    completedRequests?: number;
    labProgress?: number;
  };
  startLocked: boolean;
  unlockMessage: string;
};

export type PriceHeat = {
  label: string;
  className: string;
};

export type BusinessOffer = {
  value: number;
  label: "Fair Business Offer" | "Good Business Offer" | "Rare Premium Offer";
  className: string;
  multiplier: number;
  premium: boolean;
};

export type BulkLotDefinition = {
  label: string;
  minItems: number;
  types?: ItemType[];
  partsOnly?: boolean;
};

export type MapUpgradePhase = {
  name: string;
  cap: number;
  next: string;
  reason: string;
};

export type OperationsLayout = {
  columns: [number, number, number];
  rows: [number, number, number];
};
