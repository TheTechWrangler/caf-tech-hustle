import type {
  ItemTemplate, HostingProjectDefinition, LabStationDefinition, LabStationName,
  InfrastructureDefinition, InfrastructureName, LoanDefinition, GrantDefinition,
  DonationTierConfig, DistrictConfig, DistrictName, BulkLotDefinition,
  RequestTemplate
} from "./types";

// ---------------------------------------------------------------------------
// Item pool
// ---------------------------------------------------------------------------

export const itemPool: ItemTemplate[] = [
  { name: "Broken Laptop", type: "Laptop", base: 72, repairCost: 24, energy: 3, rep: 8, scrap: 18 },
  { name: "Office Desktop", type: "Desktop", base: 58, repairCost: 18, energy: 2, rep: 6, scrap: 15 },
  { name: "RAM Kit", type: "Memory", base: 28, repairCost: 8, energy: 1, rep: 3, scrap: 8 },
  { name: "SSD", type: "Storage", base: 36, repairCost: 10, energy: 1, rep: 4, scrap: 10 },
  { name: "Monitor", type: "Display", base: 44, repairCost: 12, energy: 2, rep: 5, scrap: 11 },
  { name: "Router", type: "Network", base: 32, repairCost: 9, energy: 1, rep: 4, scrap: 9 },
  { name: "Cable Bundle", type: "Cables", base: 14, repairCost: 3, energy: 1, rep: 2, scrap: 4 },
  { name: "Server Parts", type: "Server", base: 96, repairCost: 34, energy: 4, rep: 9, scrap: 30 },
  { name: "Old Business Workstation", type: "Workstation", base: 84, repairCost: 26, energy: 3, rep: 7, scrap: 22 },
  { name: "Donated Mini PC", type: "Mini PC", base: 52, repairCost: 15, energy: 2, rep: 6, scrap: 13 }
];

export const eventText = [
  "A school lab called about donated gear. Reputation +3.",
  "A surprise utility bill hit the workshop. Cash -12.",
  "A volunteer brought snacks and sorted screws. Energy +2, stress -1.",
  "A shipping mix-up delivered extra cables.",
  "A tricky repair queue raised stress by 2.",
  "A local business sponsored a repair day. Cash +20, reputation +2."
];

// ---------------------------------------------------------------------------
// Community request templates
// ---------------------------------------------------------------------------

export const requestTemplates: RequestTemplate[] = [
  // Neighborhood — always available
  { title: "Community Center Desktops", description: "The lab needs another desktop for job applications and digital forms.", kind: "item", need: "Desktop", district: "Neighborhood", deadline: [5, 9], reputationReward: [7, 10], trustReward: [3, 5], cashDonation: [8, 18] },
  { title: "Youth Group Game Server", description: "Set up a small game server for a supervised weekend tournament.", kind: "service", need: "Game Server", district: "Neighborhood", deadline: [4, 8], reputationReward: [8, 12], trustReward: [2, 4], cashDonation: [12, 25], energyCost: 3, cashCost: 10 },
  { title: "After-School Monitor", description: "A tutoring room needs a spare display for shared coding lessons.", kind: "item", need: "Display", district: "Neighborhood", deadline: [3, 6], reputationReward: [4, 7], trustReward: [2, 4] },
  { title: "Clinic Router Refresh", description: "A small clinic needs a stable router for the waiting-room kiosk.", kind: "item", need: "Network", district: "Neighborhood", deadline: [4, 8], reputationReward: [5, 8], trustReward: [3, 5], cashDonation: [6, 14] },
  // Downtown — unlocks at Trust 10, Requests 5
  { title: "Student Needs Laptop", description: "A high school senior needs a reliable machine for applications and homework.", kind: "item", need: "Laptop", district: "Downtown", deadline: [4, 7], reputationReward: [8, 12], trustReward: [3, 5] },
  { title: "Small Nonprofit Hosting", description: "Help a tiny nonprofit get a basic website hosting setup stabilized.", kind: "service", need: "Website Hosting", district: "Downtown", deadline: [5, 8], reputationReward: [7, 11], trustReward: [3, 5], cashDonation: [10, 22], energyCost: 2, cashCost: 8 },
  { title: "Website for Local Nonprofit", description: "A small nonprofit needs stable website hosting for their community directory.", kind: "service", need: "Website Hosting", district: "Downtown", deadline: [5, 8], reputationReward: [8, 12], trustReward: [3, 5], cashDonation: [15, 28], energyCost: 2, cashCost: 10 },
  { title: "Business Help Desk Setup", description: "A downtown shop needs a basic tech support setup for their front desk.", kind: "service", need: "Scam-Safety Setup", district: "Downtown", deadline: [4, 7], reputationReward: [6, 9], trustReward: [2, 4], cashDonation: [10, 20], energyCost: 2 },
  // Schools — unlocks at Trust 20, Lab 10%, Requests 3
  { title: "Classroom Desktop Request", description: "A school lab needs a working desktop for a student workstation.", kind: "item", need: "Desktop", district: "Schools", deadline: [5, 9], reputationReward: [9, 13], trustReward: [4, 6] },
  { title: "Student Laptop Drive", description: "Students in the district need laptops for finals week.", kind: "item", need: "Laptop", district: "Schools", deadline: [4, 7], reputationReward: [10, 15], trustReward: [5, 8] },
  { title: "FutureDevs Portal", description: "Keep an after-school coding cohort portal online for signups and lesson links.", kind: "service", need: "FutureDevs Portal", district: "Schools", deadline: [6, 10], reputationReward: [10, 15], trustReward: [5, 8], cashDonation: [18, 34], energyCost: 3, cashCost: 15 },
  // Library — unlocks at Rep 25, Lab 20%, Requests 8
  { title: "Public Computer Lab Refresh", description: "The library needs a working desktop for their public access terminal.", kind: "item", need: "Desktop", district: "Library", deadline: [6, 10], reputationReward: [8, 11], trustReward: [4, 6], cashDonation: [12, 22] },
  { title: "Digital Literacy Workshop", description: "Host a basic computer skills class at the branch library.", kind: "service", need: "Scam-Safety Setup", district: "Library", deadline: [5, 8], reputationReward: [7, 11], trustReward: [5, 8], energyCost: 3, cashDonation: [8, 16] },
  { title: "Pack Tracker Beta", description: "Host a small beta for a local food pantry pickup and delivery tracker.", kind: "service", need: "Pack Tracker Beta", district: "Library", deadline: [5, 8], reputationReward: [9, 13], trustReward: [4, 7], cashDonation: [12, 28], energyCost: 2, cashCost: 12 },
  // Senior Center — unlocks at Trust 30, Lab 25%
  { title: "Senior Scam-Safety Setup", description: "Run a friendly security check, browser cleanup, and password coaching session.", kind: "service", need: "Scam-Safety Setup", district: "Senior Center", deadline: [3, 6], reputationReward: [5, 8], trustReward: [4, 6], cashDonation: [5, 12], energyCost: 2 },
  { title: "Senior Tablet Setup", description: "An 80-year-old just got a tablet. She needs help getting started and securing it.", kind: "service", need: "Scam-Safety Setup", district: "Senior Center", deadline: [4, 7], reputationReward: [6, 9], trustReward: [5, 9], cashDonation: [5, 12], energyCost: 2 },
  { title: "Senior Center Desktop", description: "The center needs a reliable desktop for their shared resource room.", kind: "item", need: "Desktop", district: "Senior Center", deadline: [5, 9], reputationReward: [7, 10], trustReward: [4, 7] },
  // Industrial Park — unlocks at Rep 40, Lab 35%, Requests 15
  { title: "Business Workstation Request", description: "A nonprofit warehouse needs a workstation for their shipping coordinator.", kind: "item", need: "Workstation", district: "Industrial Park", deadline: [5, 9], reputationReward: [10, 14], trustReward: [3, 5], cashDonation: [20, 40] },
  { title: "AI App Pilot", description: "Stand up a small pilot for a partner testing intake forms and volunteer routing.", kind: "service", need: "AI App Pilot", district: "Industrial Park", deadline: [6, 11], reputationReward: [12, 18], trustReward: [5, 9], cashDonation: [20, 45], energyCost: 4, cashCost: 22 },
  // Partner City — unlocks at Rep 75, Lab 70%, Requests 30
  { title: "Partner Org Laptop Fleet", description: "A partner nonprofit in the region needs laptops for their intake coordinators.", kind: "item", need: "Laptop", district: "Partner City", deadline: [6, 10], reputationReward: [15, 22], trustReward: [6, 9], cashDonation: [30, 55] },
  { title: "Regional Hosting Support", description: "A partner city org needs shared hosting infrastructure support.", kind: "service", need: "Website Hosting", district: "Partner City", deadline: [7, 12], reputationReward: [14, 20], trustReward: [5, 8], cashDonation: [25, 50], energyCost: 3, cashCost: 20 }
];

// ---------------------------------------------------------------------------
// Hosting project catalog
// ---------------------------------------------------------------------------

export const hostingProjectCatalog: HostingProjectDefinition[] = [
  {
    id: "basic-website",
    name: "Basic Website Hosting",
    description: "Keep a small brochure site online for a community group or tiny nonprofit.",
    requiredEquipment: [{ label: "1 mini PC, router, or basic server", types: ["Mini PC", "Network", "Server"], count: 1 }],
    requiredDistrict: "Neighborhood",
    setupCost: 18,
    hostingSlots: 1,
    serviceNeed: "Website Hosting",
    monthlyIncome: 32,
    reputationReward: 3,
    riskNote: "Low risk. Benefits from stable network gear."
  },
  {
    id: "podcast-media",
    name: "Podcast / Media Hosting",
    description: "Host uploads and a small media site for a local education or arts project.",
    requiredEquipment: [{ label: "1 mini PC, SSD, or server part", types: ["Mini PC", "Storage", "Server"], count: 1 }],
    requiredDistrict: "Neighborhood",
    setupCost: 24,
    hostingSlots: 1,
    serviceNeed: "Website Hosting",
    monthlyIncome: 44,
    reputationReward: 4,
    riskNote: "Media storage grows over time; storage gear helps justify keeping SSDs."
  },
  {
    id: "small-business-site",
    name: "Small Business Website Hosting",
    description: "A downtown shop pays CAF for managed hosting, updates, and basic backups.",
    requiredEquipment: [
      { label: "1 mini PC, workstation, or server", types: ["Mini PC", "Workstation", "Server"], count: 1 },
      { label: "1 router or network kit", types: ["Network"], count: 1 }
    ],
    requiredDistrict: "Downtown",
    requiredReputation: 8,
    setupCost: 55,
    hostingSlots: 2,
    serviceNeed: "Website Hosting",
    monthlyIncome: 86,
    reputationReward: 6,
    riskNote: "Business clients notice downtime faster."
  },
  {
    id: "game-server",
    name: "Game Server Hosting",
    description: "Run a moderated server for youth events, clubs, and weekend tournaments.",
    requiredEquipment: [{ label: "1 gaming-capable PC, workstation, or server", types: ["Workstation", "Desktop", "Server"], count: 1 }],
    requiredDistrict: "Schools",
    requiredLabProgress: 20,
    requiredInfrastructureProgress: 30,
    setupCost: 70,
    hostingSlots: 2,
    serviceNeed: "Game Server",
    monthlyIncome: 96,
    reputationReward: 6,
    riskNote: "Traffic spikes can cause hiccups without enough hosting capacity."
  },
  {
    id: "community-app",
    name: "Community App Hosting",
    description: "Host a small civic app for signups, pantry tracking, rides, or volunteer routing.",
    requiredEquipment: [
      { label: "1 server, workstation, or mini PC", types: ["Server", "Workstation", "Mini PC"], count: 1 },
      { label: "1 SSD or network kit", types: ["Storage", "Network"], count: 1 }
    ],
    requiredDistrict: "Library",
    requiredLabProgress: 35,
    requiredInfrastructureProgress: 60,
    setupCost: 95,
    hostingSlots: 2,
    serviceNeed: "Pack Tracker Beta",
    monthlyIncome: 135,
    reputationReward: 8,
    riskNote: "A reliable server closet makes this much safer."
  },
  {
    id: "nonprofit-resource-site",
    name: "Nonprofit Resource Site",
    description: "Maintain a searchable resource directory for housing, food, jobs, and tech help.",
    requiredEquipment: [{ label: "2 repaired mini PCs, desktops, or servers", types: ["Mini PC", "Desktop", "Server"], count: 2 }],
    requiredDistrict: "Library",
    requiredLabProgress: 40,
    requiredInfrastructureProgress: 60,
    requiredReputation: 20,
    setupCost: 110,
    hostingSlots: 3,
    serviceNeed: "Website Hosting",
    monthlyIncome: 165,
    reputationReward: 10,
    riskNote: "Public-facing resource sites want better uptime and backups."
  },
  {
    id: "managed-vps",
    name: "Managed VPS Hosting",
    description: "Offer small virtual servers for trusted partner organizations.",
    requiredEquipment: [
      { label: "2 server, NAS, or workstation-class machines", types: ["Server", "Workstation", "Storage"], count: 2 },
      { label: "1 network kit", types: ["Network"], count: 1 }
    ],
    requiredDistrict: "Industrial Park",
    requiredLabProgress: 60,
    requiredInfrastructureProgress: 85,
    requiredReputation: 35,
    setupCost: 230,
    hostingSlots: 4,
    serviceNeed: "Website Hosting",
    monthlyIncome: 310,
    reputationReward: 13,
    riskNote: "Higher upkeep expectations. Data-center infrastructure pays off here."
  },
  {
    id: "ai-tool",
    name: "AI Tool Hosting",
    description: "Host a small AI-assisted intake or volunteer support tool for a partner program.",
    requiredEquipment: [
      { label: "1 GPU workstation or server", types: ["Workstation", "Server"], count: 1 },
      { label: "1 SSD, RAM kit, or server part", types: ["Storage", "Memory", "Server"], count: 1 }
    ],
    requiredDistrict: "Industrial Park",
    requiredLabProgress: 75,
    requiredInfrastructureProgress: 85,
    requiredReputation: 50,
    setupCost: 360,
    hostingSlots: 4,
    serviceNeed: "AI App Pilot",
    monthlyIncome: 430,
    reputationReward: 16,
    riskNote: "Power and cooling matter. Outages hurt trust."
  },
  {
    id: "school-youth-lab",
    name: "School / Youth Lab Hosting",
    description: "Run class portals, project storage, and lab management tools for youth programs.",
    requiredEquipment: [
      { label: "4 repaired laptops, desktops, mini PCs, or workstations", types: ["Laptop", "Desktop", "Mini PC", "Workstation"], count: 4 },
      { label: "1 server or network kit", types: ["Server", "Network"], count: 1 }
    ],
    requiredDistrict: "Schools",
    requiredLabProgress: 70,
    requiredInfrastructureProgress: 85,
    requiredReputation: 45,
    setupCost: 280,
    hostingSlots: 5,
    serviceNeed: "FutureDevs Portal",
    monthlyIncome: 365,
    reputationReward: 18,
    riskNote: "Requires a real equipment bench, not just one lucky server."
  },
  {
    id: "local-business-care",
    name: "Local Business Tech Care Plan",
    description: "A monthly support and hosting care plan for several nearby mission-friendly businesses.",
    requiredEquipment: [
      { label: "2 business workstations, mini PCs, or servers", types: ["Workstation", "Mini PC", "Server"], count: 2 },
      { label: "2 network, storage, or desktop kits", types: ["Network", "Storage", "Desktop"], count: 2 }
    ],
    requiredDistrict: "Partner City",
    requiredLabProgress: 85,
    requiredInfrastructureProgress: 100,
    requiredReputation: 70,
    setupCost: 420,
    hostingSlots: 5,
    serviceNeed: "Website Hosting",
    monthlyIncome: 520,
    reputationReward: 20,
    riskNote: "Powerful income, but it ties up serious repaired equipment."
  }
];

// ---------------------------------------------------------------------------
// Lab station catalog
// ---------------------------------------------------------------------------

export const emptyLabStations = (): Record<LabStationName, number> => ({
  "Intake Table": 0,
  "Cleaning Station": 0,
  "Repair Bench": 0,
  "Parts Shelf": 0,
  "Testing Bench": 0,
  "Server Rack": 0,
  "Network Corner": 0,
  "Training Desk": 0,
  "AI Workstation": 0,
  "Community Pickup Shelf": 0,
  "Cooling/Power Upgrade": 0
});

export const labStationCatalog: LabStationDefinition[] = [
  {
    name: "Intake Table",
    description: "A real intake spot for triage, labels, and deciding where each donated item goes.",
    equipmentName: "Folding Intake Table",
    purchaseItemType: "Cables",
    purchaseCost: 35,
    acceptedTypes: ["Cables", "Display"],
    benefits: ["Backlog tolerance", "Storage +2"],
    maxLevel: 3
  },
  {
    name: "Cleaning Station",
    description: "Safe wipe-downs, dust removal, and first-pass prep before anything reaches a neighbor.",
    equipmentName: "Cleaning Kit",
    purchaseItemType: "Cables",
    purchaseCost: 45,
    acceptedTypes: ["Cables", "Display"],
    benefits: ["Faster cleaning", "Lower daily stress"],
    maxLevel: 3
  },
  {
    name: "Repair Bench",
    description: "Tools and bench space that turn broken gear into mission-ready gear.",
    equipmentName: "Tool Kit",
    purchaseItemType: "Storage",
    purchaseCost: 65,
    acceptedTypes: ["Memory", "Storage", "Cables", "Desktop"],
    benefits: ["Daily repairs +1", "Repair success"],
    maxLevel: 3
  },
  {
    name: "Parts Shelf",
    description: "Organized RAM, SSDs, cables, and known-good spares that make repairs less expensive.",
    equipmentName: "Parts Organizer",
    purchaseItemType: "Memory",
    purchaseCost: 55,
    acceptedTypes: ["Memory", "Storage", "Cables"],
    benefits: ["Repair cost down", "Repair success"],
    maxLevel: 3
  },
  {
    name: "Testing Bench",
    description: "A diagnostic bench for proving what works before it goes to a family or station.",
    equipmentName: "Diagnostic USB Kit",
    purchaseItemType: "Display",
    purchaseCost: 75,
    acceptedTypes: ["Display", "Desktop", "Laptop", "Mini PC"],
    benefits: ["Test flow", "Repair success"],
    maxLevel: 3
  },
  {
    name: "Server Rack",
    description: "A compact rack for hosting community services and learning infrastructure safely.",
    equipmentName: "Used Server",
    purchaseItemType: "Server",
    purchaseCost: 180,
    acceptedTypes: ["Server", "Mini PC", "Workstation"],
    benefits: ["Hosting capacity", "Uptime"],
    maxLevel: 3
  },
  {
    name: "Network Corner",
    description: "Routers, switches, and cable discipline for reliable in-house and hosted services.",
    equipmentName: "Network Switch",
    purchaseItemType: "Network",
    purchaseCost: 95,
    acceptedTypes: ["Network", "Cables"],
    benefits: ["Hosting capacity", "Reliability"],
    maxLevel: 3
  },
  {
    name: "Training Desk",
    description: "A learning station for FutureDevs sessions, coaching, and community classes.",
    equipmentName: "Test Monitor",
    purchaseItemType: "Display",
    purchaseCost: 85,
    acceptedTypes: ["Laptop", "Desktop", "Display", "Mini PC"],
    benefits: ["Training unlocks", "Trust"],
    maxLevel: 3
  },
  {
    name: "AI Workstation",
    description: "A strong workstation for later AI pilots, data cleanup, and volunteer tooling.",
    equipmentName: "GPU Workstation",
    purchaseItemType: "Workstation",
    purchaseCost: 260,
    acceptedTypes: ["Workstation", "Mini PC", "Storage", "Memory"],
    benefits: ["AI pilots", "Hosting capacity"],
    maxLevel: 3
  },
  {
    name: "Community Pickup Shelf",
    description: "A clean handoff area so fulfilled requests move out quickly and visibly.",
    equipmentName: "Pickup Shelf",
    purchaseItemType: "Cables",
    purchaseCost: 50,
    acceptedTypes: ["Cables", "Display", "Desktop"],
    benefits: ["Trust", "Stress relief"],
    maxLevel: 3
  },
  {
    name: "Cooling/Power Upgrade",
    description: "UPS backup, airflow, and power discipline for anything that needs uptime.",
    equipmentName: "UPS Battery Backup",
    purchaseItemType: "Network",
    purchaseCost: 140,
    acceptedTypes: ["Server", "Network", "Cables"],
    benefits: ["Uptime", "Data center unlocks"],
    maxLevel: 3
  }
];

// ---------------------------------------------------------------------------
// Infrastructure catalog
// ---------------------------------------------------------------------------

export const emptyInfrastructure = (): Record<InfrastructureName, number> => ({
  "Garage Workspace": 1,
  "Storage Unit": 0,
  "Small Repair Shop": 0,
  "Server Closet": 0,
  "Mini Data Center": 0,
  "Full Data Center": 0,
  "Partner Facility": 0
});

export const infrastructureCatalog: InfrastructureDefinition[] = [
  {
    name: "Garage Workspace",
    description: "A basic bench, shelves, and enough outlets to stop tripping over extension cords.",
    purchaseCost: 70,
    upkeep: 5,
    storageBonus: 6,
    repairBonus: 2,
    hostingBonus: 0,
    reliabilityBonus: 1,
    requirements: { labProgress: 0 },
    maxLevel: 3
  },
  {
    name: "Storage Unit",
    description: "Dedicated off-site storage for monitors, desktops, and mystery boxes with labels.",
    purchaseCost: 140,
    upkeep: 10,
    storageBonus: 18,
    repairBonus: 0,
    hostingBonus: 0,
    reliabilityBonus: 0,
    requirements: {
      labProgress: 10,
      anyStationOrProcessed: { station: "Intake Table", level: 1, processedItems: 5 }
    },
    maxLevel: 3
  },
  {
    name: "Small Repair Shop",
    description: "A public-facing repair room with benches, intake shelves, and a proper parts wall.",
    purchaseCost: 260,
    upkeep: 18,
    storageBonus: 10,
    repairBonus: 4,
    hostingBonus: 0,
    reliabilityBonus: 2,
    requirements: {
      labProgress: 25,
      stations: {
        "Cleaning Station": 1,
        "Repair Bench": 1,
        "Testing Bench": 1
      },
      reputation: 8,
      communityTrust: 4
    },
    maxLevel: 3
  },
  {
    name: "Server Closet",
    description: "A tidy closet with ventilation, battery backup, and room for small community services.",
    purchaseCost: 350,
    upkeep: 25,
    storageBonus: 4,
    repairBonus: 0,
    hostingBonus: 3,
    reliabilityBonus: 5,
    requirements: {
      labProgress: 40,
      stations: {
        "Network Corner": 1,
        "Server Rack": 1
      },
      assignedTypes: { Network: 1 },
      assignedAny: [{ label: "1 mini PC/server part", types: ["Mini PC", "Server"], count: 1 }],
      reputation: 12,
      communityTrust: 6
    },
    maxLevel: 3
  },
  {
    name: "Mini Data Center",
    description: "Racks, cooling, monitoring, and the first real home for bigger civic-tech pilots.",
    purchaseCost: 700,
    upkeep: 60,
    storageBonus: 6,
    repairBonus: 1,
    hostingBonus: 8,
    reliabilityBonus: 10,
    requirements: {
      labProgress: 60,
      stations: {
        "Server Rack": 2,
        "Network Corner": 2,
        "Cooling/Power Upgrade": 1
      },
      hostingCapacity: 5,
      reputation: 28,
      communityTrust: 16,
      facility: "Server Closet"
    },
    maxLevel: 3
  },
  {
    name: "Full Data Center",
    description: "A serious hosting footprint for portals, beta apps, and regional partner services.",
    purchaseCost: 1500,
    upkeep: 140,
    storageBonus: 10,
    repairBonus: 1,
    hostingBonus: 20,
    reliabilityBonus: 18,
    requirements: {
      labProgress: 80,
      stations: {
        "Server Rack": 3,
        "Cooling/Power Upgrade": 2,
        "AI Workstation": 2
      },
      reputation: 70,
      communityTrust: 40,
      completedRequests: 12,
      facility: "Mini Data Center"
    },
    maxLevel: 2
  },
  {
    name: "Partner Facility",
    description: "Shared space with a mission-aligned partner that adds flexible overflow capacity.",
    purchaseCost: 900,
    upkeep: 45,
    storageBonus: 30,
    repairBonus: 3,
    hostingBonus: 5,
    reliabilityBonus: 8,
    requirements: {
      labProgress: 100,
      deploymentHistory: 12,
      communityTrust: 55,
      completedRequests: 15
    },
    maxLevel: 3
  }
];

// ---------------------------------------------------------------------------
// Loan catalog
// ---------------------------------------------------------------------------

export const loanCatalog: LoanDefinition[] = [
  {
    type: "Micro Loan",
    description: "A small bridge loan for parts, gas, and one more chance at the bench.",
    amount: 120,
    baseInterest: 0.08,
    cadence: "Weekly",
    basePayment: 24,
    maxActive: 2,
    requirements: { maxLoans: 3 },
    missedPenalty: "Stress +1, credit -5"
  },
  {
    type: "Community Credit Line",
    description: "A flexible community-backed line for request crunches and reliable gear buys.",
    amount: 350,
    baseInterest: 0.12,
    cadence: "Weekly",
    basePayment: 58,
    maxActive: 1,
    requirements: { reputation: 8, communityTrust: 5, maxLoans: 3 },
    missedPenalty: "Stress +2, trust -1, credit -8"
  },
  {
    type: "Emergency Infrastructure Loan",
    description: "A big rescue loan for facilities, storage pressure, or data-center dreams.",
    amount: 850,
    baseInterest: 0.17,
    cadence: "Monthly",
    basePayment: 145,
    maxActive: 1,
    requirements: { completedRequests: 2, maxLoans: 3 },
    missedPenalty: "Stress +3, trust -2, credit -12"
  }
];

// ---------------------------------------------------------------------------
// Grant catalog
// ---------------------------------------------------------------------------

export const grantCatalog: GrantDefinition[] = [
  {
    id: "micro",
    name: "Micro Grant",
    description: "A small early-game grant for basic community tech access work.",
    guidance: "Best for early community impact.",
    payoutRange: [75, 160],
    reviewDays: 7,
    cooldownDays: 14,
    approvalRange: [0.5, 0.9],
    minimumRejectionChance: 0.05
  },
  {
    id: "community-tech",
    name: "Community Tech Grant",
    description: "Funds device reuse, repair, and neighborhood deployments.",
    guidance: "Stronger applications usually include completed requests and donated devices.",
    payoutRange: [220, 520],
    reviewDays: 14,
    cooldownDays: 28,
    approvalRange: [0.35, 0.8],
    minimumRejectionChance: 0.1
  },
  {
    id: "futuredevs",
    name: "Youth / FutureDevs Grant",
    description: "Supports student access, training systems, and youth tech programs.",
    guidance: "Reviewers like school progress, lab growth, and visible youth impact.",
    payoutRange: [300, 700],
    reviewDays: 18,
    cooldownDays: 35,
    approvalRange: [0.3, 0.75],
    minimumRejectionChance: 0.1
  },
  {
    id: "senior-safety",
    name: "Senior Safety Grant",
    description: "Supports scam-safety setup, trusted help, and senior tech confidence.",
    guidance: "Trust, senior center progress, and setup requests strengthen the application.",
    payoutRange: [260, 620],
    reviewDays: 18,
    cooldownDays: 35,
    approvalRange: [0.3, 0.75],
    minimumRejectionChance: 0.1
  },
  {
    id: "infrastructure",
    name: "Infrastructure Grant",
    description: "Funds lab capacity, hosting readiness, and reliable community infrastructure.",
    guidance: "Large infrastructure requests are stronger after the lab has matured.",
    payoutRange: [650, 1400],
    reviewDays: 28,
    cooldownDays: 56,
    approvalRange: [0.2, 0.65],
    minimumRejectionChance: 0.15
  },
  {
    id: "major-foundation",
    name: "Major Foundation Grant",
    description: "A large competitive award for proven, sustainable community impact.",
    guidance: "Reviewers tend to favor stable operations and clear impact history.",
    payoutRange: [1500, 3500],
    reviewDays: 45,
    cooldownDays: 90,
    approvalRange: [0.1, 0.45],
    minimumRejectionChance: 0.2
  }
];

// ---------------------------------------------------------------------------
// Donation tier configs
// ---------------------------------------------------------------------------

export const donationTierConfigs: Record<string, DonationTierConfig> = {
  Tiny: {
    tier: "Tiny",
    count: [1, 1],
    donors: ["Anonymous porch drop-off", "Neighbor with a spare", "Walk-in from the block", "Someone who saw the sign"],
    flavors: [
      "Someone left a single item by the door with a sticky note.",
      "A quick knock at the door and one piece of gear changes hands.",
      "A neighbor heard you take donations and dropped off what they had."
    ],
    itemNames: ["Cable Bundle", "RAM Kit", "Router"],
    conditionWeights: [
      { condition: "Working", weight: 28 },
      { condition: "Broken", weight: 38 },
      { condition: "Needs Parts", weight: 20 },
      { condition: "Unknown", weight: 14 }
    ]
  },
  Small: {
    tier: "Small",
    count: [1, 2],
    donors: ["Porch drop-off", "Neighbor text", "Church closet cleanout", "Weekend repair regular"],
    flavors: [
      "A small box of gear showed up with a handwritten thank-you note.",
      "Someone heard CAF can give old tech another shot.",
      "A quick drop-off lands by the front desk before lunch."
    ],
    itemNames: ["Cable Bundle", "RAM Kit", "Monitor", "Broken Laptop"],
    conditionWeights: [
      { condition: "Working", weight: 24 },
      { condition: "Broken", weight: 42 },
      { condition: "Needs Parts", weight: 22 },
      { condition: "Unknown", weight: 12 }
    ]
  },
  Medium: {
    tier: "Medium",
    count: [3, 5],
    donors: ["Local family garage haul", "Small office donation", "Neighborhood swap meet", "Library back-room find"],
    flavors: [
      "A hatchback unloads a practical little pile of tech.",
      "A donor brings enough gear to make the sorting table interesting.",
      "The workshop gets a useful batch with a few mystery machines."
    ],
    itemNames: ["Office Desktop", "Broken Laptop", "Router", "SSD", "Donated Mini PC"],
    conditionWeights: [
      { condition: "Working", weight: 19 },
      { condition: "Broken", weight: 45 },
      { condition: "Needs Parts", weight: 25 },
      { condition: "Unknown", weight: 11 }
    ]
  },
  Large: {
    tier: "Large",
    count: [6, 10],
    donors: ["Community center storage clearout", "Clinic equipment closet", "After-school program refresh", "Neighborhood tech drive"],
    flavors: [
      "A chunky donation rolls in and the bench lights start blinking.",
      "This one needs sorting carts, cable ties, and a little optimism.",
      "A full table of mixed PCs, monitors, and network bits appears."
    ],
    itemNames: ["Office Desktop", "Broken Laptop", "Monitor", "Router", "Cable Bundle", "Old Business Workstation"],
    conditionWeights: [
      { condition: "Working", weight: 12 },
      { condition: "Broken", weight: 47 },
      { condition: "Needs Parts", weight: 28 },
      { condition: "Unknown", weight: 13 }
    ]
  },
  Huge: {
    tier: "Huge",
    count: [12, 20],
    donors: ["Local business office clearout", "County admin surplus run", "Call-center desk refresh", "Coworking space move-out"],
    flavors: [
      "A local business cleared out an office. It is a glorious mess.",
      "Boxes stack up fast, and every label says some version of maybe useful.",
      "The storage shelves are about to learn what ambition feels like."
    ],
    itemNames: ["Office Desktop", "Old Business Workstation", "Donated Mini PC", "Monitor", "Router", "SSD", "Cable Bundle"],
    conditionWeights: [
      { condition: "Working", weight: 8 },
      { condition: "Broken", weight: 47 },
      { condition: "Needs Parts", weight: 30 },
      { condition: "Unknown", weight: 15 }
    ]
  },
  Legendary: {
    tier: "Legendary",
    count: [25, 32],
    donors: ["School district refresh leftovers", "Regional datacenter closet rescue", "University surplus miracle", "Municipal IT warehouse sweep"],
    flavors: [
      "School district refresh leftovers hit the dock. The room goes quiet for one second.",
      "A rare surplus haul arrives with server gear and just enough mystery.",
      "This is the kind of donation people talk about for months."
    ],
    itemNames: ["Server Parts", "Router", "Old Business Workstation", "Office Desktop", "SSD", "Broken Laptop", "Monitor", "Cable Bundle"],
    conditionWeights: [
      { condition: "Working", weight: 6 },
      { condition: "Broken", weight: 44 },
      { condition: "Needs Parts", weight: 32 },
      { condition: "Unknown", weight: 18 }
    ]
  }
};

// ---------------------------------------------------------------------------
// District catalog
// ---------------------------------------------------------------------------

export const districtNames: DistrictName[] = ["Garage", "Neighborhood", "Downtown", "Schools", "Library", "Senior Center", "Industrial Park", "Partner City"];

export const districtCatalog: DistrictConfig[] = [
  { name: "Garage", description: "CAF home base. Manage storage, intake, cleaning, testing, repairs, Build the Lab, infrastructure, reports, saves, and loans. Incoming tech gets processed here.", unlockRequirements: {}, startLocked: false, unlockMessage: "Home base is always open." },
  { name: "Neighborhood", description: "First community area. Find small donations, thrift finds, recycling finds, basic requests, free starter gear, and early community trust.", unlockRequirements: {}, startLocked: false, unlockMessage: "The neighborhood knows you are here." },
  { name: "Downtown", description: "Small businesses, nonprofits, and digital services.", unlockRequirements: { communityTrust: 10, completedRequests: 5 }, startLocked: true, unlockMessage: "Downtown heard about CAF. New requests are coming in." },
  { name: "Schools", description: "Student laptops, classroom desktops, FutureDevs opportunities.", unlockRequirements: { communityTrust: 20, labProgress: 10, completedRequests: 3 }, startLocked: true, unlockMessage: "Schools are on board. Student device requests start now." },
  { name: "Library", description: "Public access computers, digital literacy workshops, community programs.", unlockRequirements: { reputation: 25, labProgress: 20, completedRequests: 8 }, startLocked: true, unlockMessage: "The library is partnering with CAF. New training requests available." },
  { name: "Senior Center", description: "Scam-safety help, device setup, trust-building with seniors.", unlockRequirements: { communityTrust: 30, labProgress: 25 }, startLocked: true, unlockMessage: "Senior Center reached out. High-trust requests incoming." },
  { name: "Industrial Park", description: "Business cleanouts, bulk workstations, server gear, high logistics.", unlockRequirements: { reputation: 40, labProgress: 35, completedRequests: 15 }, startLocked: true, unlockMessage: "Industrial Park contacts opened up. Expect big donations and bulk requests." },
  { name: "Partner City", description: "Regional expansion. Partner orgs, shared infrastructure, major grants.", unlockRequirements: { reputation: 75, labProgress: 70, completedRequests: 30 }, startLocked: true, unlockMessage: "CAF is expanding beyond the city. Partner City requests are live." }
];

// ---------------------------------------------------------------------------
// Bulk lot definitions
// ---------------------------------------------------------------------------

export const mixedBulkLot: BulkLotDefinition = { label: "Mixed Tech Lot", minItems: 10 };

export const bulkLotGroups: BulkLotDefinition[] = [
  { label: "Laptop Lot", types: ["Laptop"], minItems: 3 },
  { label: "Desktop Lot", types: ["Desktop"], minItems: 5 },
  { label: "Monitors Lot", types: ["Display"], minItems: 5 },
  { label: "Network Gear Lot", types: ["Network", "Cables"], minItems: 5 },
  { label: "Parts Lot", types: ["Memory", "Storage", "Cables", "Server"], minItems: 10, partsOnly: true },
];

