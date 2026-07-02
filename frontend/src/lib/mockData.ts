import type {
  Asset,
  AssetCategory,
  AuditLogEntry,
  ChatConversation,
  CommentItem,
  InventoryCategory,
  InventoryItem,
  InventoryStatus,
  Mission,
  NotificationItem,
  Personnel,
  ThreatReport,
  TrainingCategory,
  TrainingProgram,
  User,
} from "@/types";
import { generateRef } from "./utils";

// Fictional Indian defence theatre — descriptive sector/command names, not
// real military installations, real order of battle, or classified data.
export const REGIONS = [
  "Himalayan Frontier Post",
  "North-Eastern Hill Sector",
  "Konkan Coastal Command",
  "Western Ghats Corridor",
  "Thar Desert Zone-7",
  "Kutch Basin Sector",
  "Trans-Himalayan Watch Line",
  "Deccan Plateau Command",
];

const RANKS = ["Colonel", "Major", "Captain", "Lieutenant", "Sergeant Major", "Sergeant"];
export const UNITS = [
  "1st Sentinel Battalion",
  "Raptor Recon Wing",
  "Cyber Command Cell",
  "Coastal Guard Division",
  "Aegis Logistics Corps",
  "Nightfall Special Unit",
];
const FIRST_NAMES = [
  "Arjun", "Meera", "Vikram", "Ananya", "Rohan", "Priya", "Kabir", "Isha",
  "Dev", "Sana", "Aarav", "Nisha", "Karan", "Divya", "Ishaan", "Riya",
  "Aditya", "Tara",
];
const LAST_NAMES = [
  "Rathore", "Sharma", "Bose", "Kapoor", "Menon", "Chauhan", "Nair", "Verma",
  "Iyer", "Malhotra", "Reddy", "Singh", "Joshi", "Sengupta", "Khanna", "Rao",
  "Bhatt", "Dutta",
];

function pick<T>(arr: T[], seed: number): T {
  return arr[seed % arr.length];
}

export function seedUser(): User {
  return {
    id: "u-cmd-001",
    name: "Commander Aryan Vashisht",
    email: "aryan.vashisht@prahari-x.mil",
    role: "commander",
    rank: "Colonel",
    unit: "1st Sentinel Battalion",
    avatarSeed: "aryan-vashisht",
    twoFactorEnabled: true,
    createdAt: "2024-02-11T09:00:00.000Z",
    lastActiveAt: new Date().toISOString(),
  };
}

const CERTIFICATIONS = [
  "Advanced Marksmanship", "Combat First Aid", "Airborne Qualified", "Drone Operator Cert.",
  "Cyber Defense L2", "Amphibious Ops", "Sniper Qualified", "Field Leadership",
  "Demolitions Handling", "Signals Intelligence",
];

export function seedPersonnel(): Personnel[] {
  return Array.from({ length: 18 }).map((_, i) => {
    const name = `${pick(FIRST_NAMES, i)} ${pick(LAST_NAMES, i + 3)}`;
    const statusPool: Personnel["status"][] = ["available", "deployed", "available", "leave", "medical", "deployed"];
    return {
      id: `p-${String(i + 1).padStart(3, "0")}`,
      name,
      rank: pick(RANKS, i),
      roleTitle: pick(["Field Operative", "Tactical Analyst", "Squad Lead", "Signals Specialist", "Medic", "Engineer"], i + 1),
      unit: pick(UNITS, i + 2),
      status: pick(statusPool, i),
      healthScore: 72 + ((i * 7) % 28),
      missionsCompleted: 3 + ((i * 5) % 40),
      equipmentIds: [],
      email: `${name.toLowerCase().replace(/\s+/g, ".")}@prahari-x.mil`,
      phone: `+91 90${(1000000 + i * 137).toString().slice(0, 8)}`,
      joinedAt: new Date(2019 + (i % 6), i % 12, (i * 3) % 27 + 1).toISOString(),
      avatarSeed: `${name}-${i}`,
      location: pick(REGIONS, i + 1),
      performanceScore: 68 + ((i * 9) % 32),
      certifications: [CERTIFICATIONS[i % CERTIFICATIONS.length], CERTIFICATIONS[(i + 4) % CERTIFICATIONS.length]],
    };
  });
}

/** The demo "logged-in soldier" persona — a real seeded personnel record,
 * so the Soldier portal reads live off the same roster the Commander sees. */
export function seedSoldierUser(personnel: Personnel[]): User {
  const p = personnel[2];
  return {
    id: "u-sol-001",
    name: p.name,
    email: "soldier@prahari-x.mil",
    role: "soldier",
    rank: p.rank,
    unit: p.unit,
    avatarSeed: p.avatarSeed,
    twoFactorEnabled: false,
    createdAt: p.joinedAt,
    lastActiveAt: new Date().toISOString(),
    personnelId: p.id,
  };
}

const ASSET_MODELS: Record<AssetCategory, string[]> = {
  vehicle: ["Kestrel APC-4", "Ridgeback MRAP", "Falcon LSV", "Titan Transporter"],
  drone: ["Hawkeye Mk III", "Nightshade ISR", "Corvus Recon", "Vantage Loiter-6"],
  weapon: ["Sentinel DMR-9", "Aegis Turret L2", "Phalanx CIWS-M", "Wraith Carbine"],
  medical: ["MedEvac Pod", "Field Trauma Kit", "Rapid Response Unit", "Mobile Surgical Cell"],
  satellite: ["Argus-7 ISR Sat", "Skylink Comm Sat", "Watchtower EO/IR", "Meridian Relay"],
};

export function seedAssets(): Asset[] {
  const categories: AssetCategory[] = ["vehicle", "drone", "weapon", "medical", "satellite"];
  const assets: Asset[] = [];
  let idx = 0;
  categories.forEach((cat) => {
    ASSET_MODELS[cat].forEach((model, i) => {
      idx++;
      const statusPool: Asset["status"][] = ["operational", "deployed", "operational", "maintenance"];
      assets.push({
        id: `a-${String(idx).padStart(3, "0")}`,
        name: `${model} #${100 + i}`,
        category: cat,
        model,
        status: pick(statusPool, idx),
        location: pick(REGIONS, idx),
        condition: 60 + ((idx * 11) % 40),
        lastMaintenanceDate: new Date(2026, 4, (idx * 3) % 27 + 1).toISOString(),
        nextMaintenanceDate: new Date(2026, 7, (idx * 5) % 27 + 1).toISOString(),
      });
    });
  });
  return assets;
}

const INVENTORY_CATALOG: Record<InventoryCategory, Array<{ name: string; spec: string; unitCost: number }>> = {
  firearm: [
    { name: "Sentinel DMR-9", spec: "7.62x51mm designated marksman rifle", unitCost: 2400 },
    { name: "Wraith Carbine", spec: "5.56x45mm standard-issue carbine", unitCost: 1350 },
    { name: "Aegis Sidearm P2", spec: "9x19mm service pistol", unitCost: 620 },
    { name: "Phalanx CIWS-M", spec: "Vehicle-mounted close-in weapon system", unitCost: 18500 },
  ],
  ammunition: [
    { name: "5.56x45mm NATO Ball", spec: "Standard carbine ammunition, 30-round belts", unitCost: 0.45 },
    { name: "7.62x51mm Match Grade", spec: "Precision marksman ammunition", unitCost: 1.2 },
    { name: "9x19mm Parabellum", spec: "Standard sidearm ammunition", unitCost: 0.35 },
    { name: "40mm Non-Lethal Round", spec: "Crowd-control / breach training round", unitCost: 6.5 },
  ],
  tactical_gear: [
    { name: "Ballistic Helmet H7", spec: "Level IIIA rated, integrated comms mount", unitCost: 480 },
    { name: "Tactical Vest Mk4", spec: "Modular plate carrier, level IV inserts", unitCost: 950 },
    { name: "Night Vision Goggles Gen3", spec: "Dual-tube, 40° FOV", unitCost: 4200 },
    { name: "Field Comms Headset", spec: "Noise-cancelling, encrypted channel", unitCost: 310 },
  ],
  vehicle: [
    { name: "Kestrel APC-4", spec: "Armored personnel carrier, 8-seat", unitCost: 420000 },
    { name: "Ridgeback MRAP", spec: "Mine-resistant patrol vehicle", unitCost: 650000 },
    { name: "Falcon LSV", spec: "Light strike vehicle, rapid deployment", unitCost: 95000 },
  ],
  drone: [
    { name: "Hawkeye Mk III", spec: "ISR reconnaissance drone, 8hr endurance", unitCost: 72000 },
    { name: "Nightshade ISR", spec: "Low-signature night surveillance drone", unitCost: 88000 },
    { name: "Corvus Recon", spec: "Compact tactical recon quadcopter", unitCost: 14500 },
  ],
};

export function seedInventory(): InventoryItem[] {
  const categories: InventoryCategory[] = ["firearm", "ammunition", "tactical_gear", "vehicle", "drone"];
  const items: InventoryItem[] = [];
  let idx = 0;
  categories.forEach((cat) => {
    INVENTORY_CATALOG[cat].forEach((entry) => {
      idx++;
      const isBulk = cat === "ammunition";
      const quantity = isBulk ? 400 + ((idx * 733) % 4200) : 4 + ((idx * 7) % 46);
      const reorderThreshold = isBulk ? 500 : 8;
      const status: InventoryStatus = quantity === 0 ? "out_of_stock" : quantity <= reorderThreshold ? "low_stock" : "in_stock";
      items.push({
        id: `inv-${String(idx).padStart(3, "0")}`,
        name: entry.name,
        category: cat,
        spec: entry.spec,
        quantity,
        reorderThreshold,
        status,
        location: pick(REGIONS, idx + 2),
        unitCost: entry.unitCost,
        lastRestocked: new Date(2026, (idx * 2) % 6, (idx * 5) % 27 + 1).toISOString(),
      });
    });
  });
  return items;
}

const TRAINING_CATALOG: Array<{ name: string; category: TrainingCategory; description: string; durationHours: number; mandatory: boolean }> = [
  { name: "Advanced Marksmanship", category: "combat", description: "Precision fire under time pressure and adverse conditions.", durationHours: 40, mandatory: true },
  { name: "Close Quarters Tactics", category: "combat", description: "Room-clearing, breach coordination, and fire-team movement.", durationHours: 32, mandatory: true },
  { name: "Combat First Aid", category: "medical", description: "Trauma stabilization and casualty evacuation under fire.", durationHours: 24, mandatory: true },
  { name: "Field Trauma Surgery", category: "medical", description: "Advanced surgical intervention for forward medics.", durationHours: 60, mandatory: false },
  { name: "Signals & Encrypted Comms", category: "technical", description: "Secure communications setup, encryption, and EW resilience.", durationHours: 28, mandatory: true },
  { name: "Drone Operations Certification", category: "technical", description: "ISR drone piloting, sensor payloads, and airspace deconfliction.", durationHours: 36, mandatory: false },
  { name: "Small Unit Leadership", category: "leadership", description: "Decision-making, delegation, and mission command for squad leads.", durationHours: 45, mandatory: false },
  { name: "Crisis Command Simulation", category: "leadership", description: "High-pressure scenario command exercises with after-action review.", durationHours: 20, mandatory: false },
  { name: "Wilderness Survival", category: "survival", description: "Extended-duration survival, navigation, and self-sufficiency.", durationHours: 50, mandatory: false },
  { name: "Arctic & Extreme Climate Ops", category: "survival", description: "Operating and surviving in extreme cold-weather environments.", durationHours: 38, mandatory: false },
];

export function seedTrainingPrograms(): TrainingProgram[] {
  const statusPool: TrainingProgram["status"][] = ["active", "active", "upcoming", "active", "completed"];
  return TRAINING_CATALOG.map((entry, i) => ({
    id: `trn-${String(i + 1).padStart(3, "0")}`,
    name: entry.name,
    category: entry.category,
    description: entry.description,
    durationHours: entry.durationHours,
    mandatory: entry.mandatory,
    status: pick(statusPool, i),
    enrolledCount: 8 + ((i * 7) % 40),
    completionRate: 35 + ((i * 13) % 60),
    nextSessionDate: new Date(2026, (i + 1) % 12, ((i * 5) % 27) + 1).toISOString(),
  }));
}

const MISSION_NAMES = [
  "Operation Silent Ridge", "Operation Iron Vigil", "Operation Northern Watch",
  "Operation Copper Falcon", "Operation Quiet Storm", "Operation Steel Horizon",
  "Operation Amber Shield", "Operation Ghost Compass", "Operation Vantage Point",
  "Operation Crimson Aegis",
];

export function seedMissions(personnel: Personnel[], assets: Asset[]): Mission[] {
  return MISSION_NAMES.map((name, i) => {
    const statusPool: Mission["status"][] = ["active", "planning", "active", "completed", "paused"];
    const priorityPool: Mission["priority"][] = ["critical", "high", "medium", "high", "low"];
    const squad = personnel.slice((i * 2) % 10, (i * 2) % 10 + 4).map((p) => p.id);
    const equipment = assets.slice((i * 3) % 15, (i * 3) % 15 + 3).map((a) => a.id);
    const start = new Date(2026, i % 6, 3 + i);
    const end = new Date(2026, (i % 6) + 1, 10 + i);
    return {
      id: `m-${String(i + 1).padStart(3, "0")}`,
      code: generateRef("MSN"),
      name,
      description:
        "Multi-phase operation combining reconnaissance, asset positioning, and coordinated field response across the designated sector.",
      commanderId: "u-cmd-001",
      commanderName: "Commander Aryan Vashisht",
      region: pick(REGIONS, i),
      priority: pick(priorityPool, i),
      status: pick(statusPool, i),
      startDate: start.toISOString(),
      endDate: end.toISOString(),
      progress: [20, 45, 68, 100, 55, 80, 30, 92, 15, 60][i] ?? 50,
      objectives: [
        { id: `${i}-o1`, title: "Establish forward observation post", status: "complete", dueDate: start.toISOString() },
        { id: `${i}-o2`, title: "Secure perimeter and supply corridor", status: i % 2 === 0 ? "complete" : "in_progress", dueDate: end.toISOString() },
        { id: `${i}-o3`, title: "Coordinate extraction / handoff", status: "pending", dueDate: end.toISOString() },
      ],
      squadIds: squad,
      equipmentIds: equipment,
      logs: [
        { id: `${i}-l1`, timestamp: start.toISOString(), author: "Commander Aryan Vashisht", message: "Mission authorized and briefing completed.", type: "info" },
        { id: `${i}-l2`, timestamp: new Date(start.getTime() + 86400000).toISOString(), author: "Field Ops", message: "Squad deployed to designated sector.", type: "action" },
      ],
      createdAt: start.toISOString(),
      updatedAt: new Date().toISOString(),
    };
  });
}

const THREAT_TITLES: Record<ThreatReport["category"], string[]> = {
  cyber: ["Anomalous intrusion attempt on comms relay", "Credential-spray activity on field VPN", "Suspicious lateral movement in logistics net"],
  drone: ["Unregistered UAV incursion detected", "Loitering munition signature identified", "Swarm formation observed near perimeter"],
  satellite: ["Unusual orbital pass over sector", "Signal jamming detected in ISR band", "Imagery indicates unlisted structure"],
  ground: ["Unidentified convoy movement", "Perimeter sensor tripped, unconfirmed contact", "Irregular patrol pattern reported"],
  signal: ["Encrypted burst transmission intercepted", "Signal spoofing near comm tower", "Unusual frequency spike detected"],
};

export function seedThreats(): ThreatReport[] {
  const categories: ThreatReport["category"][] = ["cyber", "drone", "satellite", "ground", "signal"];
  const threats: ThreatReport[] = [];
  let idx = 0;
  categories.forEach((cat) => {
    THREAT_TITLES[cat].forEach((title, i) => {
      idx++;
      const severityPool: ThreatReport["severity"][] = ["critical", "high", "medium", "low"];
      const statusPool: ThreatReport["status"][] = ["active", "monitoring", "neutralized"];
      threats.push({
        id: `t-${String(idx).padStart(3, "0")}`,
        title,
        category: cat,
        severity: pick(severityPool, idx + i),
        region: pick(REGIONS, idx),
        description:
          "Automated sensors flagged this event for review. Correlate with adjacent reports before escalation.",
        detectedAt: new Date(2026, 5, 30 - idx, 8 + idx).toISOString(),
        status: pick(statusPool, idx),
        aiConfidence: 55 + ((idx * 13) % 45),
        source: pick(["ISR Network", "SIGINT Array", "Ground Sensor Grid", "Cyber Watch"], idx),
      });
    });
  });
  return threats;
}

export function seedNotifications(): NotificationItem[] {
  const items: Array<[NotificationItem["type"], string, string, NotificationItem["severity"]?]> = [
    ["threat", "Critical threat detected", "New critical-severity cyber intrusion flagged in North-Eastern Hill Sector.", "critical"],
    ["mission", "Mission status updated", "Operation Iron Vigil moved to Active.", undefined],
    ["personnel", "Personnel reassigned", "Capt. Meera Bose assigned to Operation Copper Falcon.", undefined],
    ["system", "Scheduled maintenance", "Satellite uplink maintenance window in 2 hours.", undefined],
    ["threat", "Drone incursion resolved", "Unregistered UAV neutralized near Konkan Coastal Command.", "medium"],
    ["mission", "Objective completed", "Forward observation post established for Operation Silent Ridge.", undefined],
    ["system", "New AI briefing ready", "Daily intelligence digest is ready for review.", undefined],
  ];
  return items.map((item, i) => ({
    id: `n-${i + 1}`,
    type: item[0],
    title: item[1],
    message: item[2],
    severity: item[3],
    read: i > 2,
    createdAt: new Date(Date.now() - i * 3600_000 * 3).toISOString(),
  }));
}

export function seedAuditLogs(): AuditLogEntry[] {
  const actions = [
    "Logged in", "Updated mission", "Created personnel record", "Deleted threat report",
    "Exported AI conversation", "Changed password", "Enabled 2FA", "Assigned asset to mission",
  ];
  return Array.from({ length: 14 }).map((_, i) => ({
    id: `al-${i + 1}`,
    actor: i % 3 === 0 ? "Commander Aryan Vashisht" : pick(["Capt. Meera Bose", "Maj. Vikram Kapoor", "Lt. Ananya Nair"], i),
    action: pick(actions, i),
    target: pick(["Mission #MSN-4X92", "Personnel #p-004", "Threat #t-011", "Asset #a-006"], i),
    timestamp: new Date(Date.now() - i * 3600_000 * 6).toISOString(),
    ip: `10.${(i * 17) % 255}.${(i * 43) % 255}.${(i * 91) % 255}`,
    status: i % 7 === 0 ? "failed" : "success",
  }));
}

const DEMO_COMMENT_AUTHOR = { id: "u-cmd-001", name: "Commander Aryan Vashisht", avatarSeed: "aryan-vashisht", role: "commander" as const };

export function seedComments(): CommentItem[] {
  const seedData: Array<[string, string, string, number]> = [
    ["mission", "m-001", "Squad Bravo is in position at the forward observation post. Awaiting go signal.", 6],
    ["mission", "m-001", "Confirmed — hold until first light. Weather window looks favorable.", 5],
    ["inventory", "inv-001", "Ran a function check on the last batch — two units flagged for rail wear, pulled for inspection.", 3],
    ["training", "trn-001", "Next cohort scheduled — range availability confirmed for the full week.", 2],
  ];
  return seedData.map(([entityType, entityId, content, hoursAgo], i) => ({
    id: `cm-${i + 1}`,
    entityType: entityType as CommentItem["entityType"],
    entityId,
    user: DEMO_COMMENT_AUTHOR,
    content,
    createdAt: new Date(Date.now() - hoursAgo * 3600_000).toISOString(),
    updatedAt: new Date(Date.now() - hoursAgo * 3600_000).toISOString(),
  }));
}

export function seedConversations(): ChatConversation[] {
  const now = Date.now();
  // Seeded conversations belong to the demo Commander account only — the
  // Soldier persona and any newly-registered mock account start with an
  // empty history, per-user, exactly like a real DB-backed chat log would.
  const ownerEmail = "aryan.vashisht@prahari-x.mil";
  return [
    {
      id: "c-1",
      title: "Threat pattern correlation — North-Eastern Hill Sector",
      createdAt: new Date(now - 86400_000 * 2).toISOString(),
      updatedAt: new Date(now - 86400_000).toISOString(),
      ownerEmail,
      messages: [
        { id: "m1", role: "user", content: "Summarize the last 48 hours of cyber activity in North-Eastern Hill Sector.", createdAt: new Date(now - 86400_000 * 2).toISOString() },
        {
          id: "m2",
          role: "assistant",
          content:
            "Over the last 48 hours, 3 cyber-category events were logged in North-Eastern Hill Sector, two of medium severity involving credential-spray attempts on the field VPN, and one high-severity lateral-movement signature within the logistics network. Recommend rotating VPN credentials for exposed nodes and isolating the logistics subnet pending forensic review.",
          createdAt: new Date(now - 86400_000 * 2 + 4000).toISOString(),
        },
      ],
    },
    {
      id: "c-2",
      title: "Draft mission brief — Konkan Coastal Command",
      createdAt: new Date(now - 3600_000 * 20).toISOString(),
      updatedAt: new Date(now - 3600_000 * 19).toISOString(),
      ownerEmail,
      messages: [
        { id: "m3", role: "user", content: "Draft a mission brief for a reconnaissance operation in Konkan Coastal Command.", createdAt: new Date(now - 3600_000 * 20).toISOString() },
        {
          id: "m4",
          role: "assistant",
          content:
            "Draft brief — Operation Vantage Point: Objective is low-signature reconnaissance of the coastal approach with emphasis on identifying irregular vessel traffic. Recommended squad size: 4. Suggested assets: 1x Nightshade ISR drone, 1x Ridgeback MRAP for extraction standby. Estimated window: 72 hours. Risk level: Medium, contingent on weather visibility.",
          createdAt: new Date(now - 3600_000 * 19 + 3000).toISOString(),
        },
      ],
    },
  ];
}
