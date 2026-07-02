import bcrypt from "bcryptjs";
import { prisma } from "./lib/prisma.js";

// ============================================================================
// PRAHARI X — production demo database seed.
//
// Populates a realistic, internally-consistent "medium-sized operational
// command" so the platform never looks like an empty new install: multiple
// command-role accounts, a full personnel roster, squads, missions in every
// status, assets/inventory/training catalogs, threats, notifications, audit
// history, and the full Command & Control workflow (assignments, shifts,
// leave, badges, attendance, patrol routes, field reports, documents) spread
// across real relationships and several months of simulated activity.
//
// IDEMPOTENT BY DESIGN: this script only initializes an EMPTY database. It
// checks for the primary Commander account before writing anything, and if
// the database has already been seeded (or has any real usage on top of the
// seed), it does nothing and exits — so re-running `npm run seed` can never
// duplicate records or overwrite anything a Commander/Soldier created by
// hand through the app. There is no destructive step anywhere in this file.
// ============================================================================

const REGIONS = [
  "Himalayan Frontier Post",
  "North-Eastern Hill Sector",
  "Konkan Coastal Command",
  "Western Ghats Corridor",
  "Thar Desert Zone-7",
  "Kutch Basin Sector",
  "Trans-Himalayan Watch Line",
  "Deccan Plateau Command",
];

const UNITS = [
  "1st Sentinel Battalion",
  "Raptor Recon Wing",
  "Cyber Command Cell",
  "Coastal Guard Division",
  "Aegis Logistics Corps",
  "Nightfall Special Unit",
  "Vajra Strike Regiment",
  "Shaurya Airborne Wing",
];

// 24 unique first/last names, zipped 1:1 by index below — guarantees no two
// personnel records collide on name.
const FIRST_NAMES = [
  "Arjun", "Meera", "Vikram", "Ananya", "Rohan", "Priya", "Kabir", "Isha",
  "Dev", "Sana", "Aarav", "Nisha", "Karan", "Divya", "Ishaan", "Riya",
  "Aditya", "Tara", "Rajesh", "Sneha", "Amit", "Pooja", "Vivek", "Kavya",
];
const LAST_NAMES = [
  "Rathore", "Sharma", "Bose", "Kapoor", "Menon", "Chauhan", "Nair", "Verma",
  "Iyer", "Malhotra", "Reddy", "Singh", "Joshi", "Sengupta", "Khanna", "Rao",
  "Bhatt", "Dutta", "Pillai", "Chatterjee", "Gupta", "Yadav", "Mishra", "Pandey",
];

// A realistic rank pyramid: 9 officers, 5 JCOs, 10 other ranks — authentic
// Indian Army rank terminology rather than generic placeholder titles.
const RANKS = [
  "Lieutenant Colonel", "Major", "Major", "Captain", "Captain", "Captain",
  "Lieutenant", "Lieutenant", "Lieutenant",
  "Subedar Major", "Subedar", "Subedar", "Naib Subedar", "Naib Subedar",
  "Havildar", "Havildar", "Havildar", "Naik", "Naik", "Naik",
  "Lance Naik", "Lance Naik", "Sepoy", "Sepoy",
];

const ROLE_TITLES = [
  "Field Operative", "Tactical Analyst", "Squad Lead", "Signals Specialist", "Combat Medic",
  "Combat Engineer", "Sniper", "Reconnaissance Specialist", "Drone Operator", "Cyber Analyst",
  "Logistics Coordinator", "Section Commander",
];

const CERTIFICATIONS = [
  "Advanced Marksmanship", "Combat First Aid", "Airborne Qualified", "Drone Operator Cert.",
  "Cyber Defense L2", "Amphibious Ops", "Sniper Qualified", "Field Leadership",
  "Demolitions Handling", "Signals Intelligence",
];

const STATUS_CYCLE: Array<"available" | "deployed" | "leave" | "medical"> = [
  "available", "deployed", "available", "deployed", "available", "leave", "available", "deployed", "medical", "available",
];

function pick<T>(arr: T[], i: number): T {
  return arr[i % arr.length];
}

function generateCode() {
  const chars = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
  let out = "";
  for (let i = 0; i < 4; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return `MSN-${out}`;
}

function daysAgo(n: number) {
  return new Date(Date.now() - n * 86400000);
}
function daysFromNow(n: number) {
  return new Date(Date.now() + n * 86400000);
}

async function main() {
  // ----------------------------------------------------------------------
  // Idempotency guard — see file header. If the primary Commander account
  // already exists, assume this database is already seeded (or already has
  // real data on top of a prior seed) and do not touch anything.
  // ----------------------------------------------------------------------
  const existingCommander = await prisma.user.findUnique({ where: { email: "commander@prahari-x.mil" } });
  if (existingCommander) {
    console.log("Database already contains seed data — skipping (nothing was modified or deleted).");
    return;
  }

  console.log("Seeding PRAHARI X production demo database…");
  const passwordHash = await bcrypt.hash("sentinel", 12);

  // ------------------------------------------------------------------------
  // 1. Command-role accounts — one per COMMAND_ROLES value (see server/src/
  //    lib/roles.ts), so every portal-gated surface has a real account to
  //    demo, not just the primary Commander.
  // ------------------------------------------------------------------------
  const commander = await prisma.user.create({
    data: {
      name: "Commander Aryan Vashisht",
      email: "commander@prahari-x.mil",
      passwordHash,
      role: "commander",
      rank: "Colonel",
      unit: "1st Sentinel Battalion",
      avatarSeed: "aryan-vashisht",
      twoFactorEnabled: true,
      settings: { create: {} },
    },
  });
  const intelOfficer = await prisma.user.create({
    data: {
      name: "Major Kavita Ramanathan",
      email: "intel.officer@prahari-x.mil",
      passwordHash,
      role: "intelligence_officer",
      rank: "Major",
      unit: "Cyber Command Cell",
      avatarSeed: "kavita-ramanathan",
      settings: { create: {} },
    },
  });
  const missionPlanner = await prisma.user.create({
    data: {
      name: "Lt. Col. Suresh Nair",
      email: "mission.planner@prahari-x.mil",
      passwordHash,
      role: "mission_planner",
      rank: "Lieutenant Colonel",
      unit: "Raptor Recon Wing",
      avatarSeed: "suresh-nair",
      settings: { create: {} },
    },
  });
  const logisticsOfficer = await prisma.user.create({
    data: {
      name: "Major Ritu Chawla",
      email: "logistics.officer@prahari-x.mil",
      passwordHash,
      role: "logistics_officer",
      rank: "Major",
      unit: "Aegis Logistics Corps",
      avatarSeed: "ritu-chawla",
      settings: { create: {} },
    },
  });
  const administrator = await prisma.user.create({
    data: {
      name: "Colonel Neha Bhardwaj",
      email: "administrator@prahari-x.mil",
      passwordHash,
      role: "administrator",
      rank: "Colonel",
      unit: "1st Sentinel Battalion",
      avatarSeed: "neha-bhardwaj",
      settings: { create: {} },
    },
  });
  const commandUsers = [commander, intelOfficer, missionPlanner, logisticsOfficer, administrator];

  // ------------------------------------------------------------------------
  // Squad structure — defined as plain data up front (before Personnel
  // exists) so every personnel record can be assigned a `unit` and
  // `location` that matches the squad it will belong to, rather than being
  // picked independently. This is what keeps a squad's roster internally
  // consistent: everyone in Alpha Squad is actually in the same unit and
  // stationed in the same sector as their squadmates and their leader.
  // Every one of the 24 personnel indices below (0-23) belongs to exactly
  // one squad, so nobody ends up "squad-less" without reason.
  // ------------------------------------------------------------------------
  const squadDefs = [
    { name: "Alpha Squad", unit: UNITS[0], homeRegion: REGIONS[0], leader: 1, members: [0, 1, 2, 3, 4] },
    { name: "Bravo Squad", unit: UNITS[1], homeRegion: REGIONS[1], leader: 6, members: [5, 6, 7, 8] },
    { name: "Charlie Squad", unit: UNITS[6], homeRegion: REGIONS[6], leader: 9, members: [9, 10, 11, 12, 13] },
    { name: "Delta Squad", unit: UNITS[5], homeRegion: REGIONS[5], leader: 14, members: [14, 15, 16, 17] },
    { name: "Echo Squad", unit: UNITS[7], homeRegion: REGIONS[7], leader: 18, members: [18, 19, 20, 21, 22, 23] },
  ];
  const unitByIndex: string[] = new Array(24);
  const regionByIndex: string[] = new Array(24);
  for (const def of squadDefs) {
    for (const idx of def.members) {
      unitByIndex[idx] = def.unit;
      regionByIndex[idx] = def.homeRegion;
    }
  }

  // ------------------------------------------------------------------------
  // 2. Personnel roster — 24 records, realistic Indian names/ranks, each
  //    assigned the unit/location of the squad they'll belong to below.
  // ------------------------------------------------------------------------
  const personnel = [];
  for (let i = 0; i < 24; i++) {
    const name = `${FIRST_NAMES[i]} ${LAST_NAMES[i]}`;
    const status = STATUS_CYCLE[i % STATUS_CYCLE.length];
    const isMedical = status === "medical";
    const joinedAt = new Date(Date.now() - (200 + i * 47) * 86400000); // spread over ~3 years
    personnel.push(
      await prisma.personnel.create({
        data: {
          name,
          rank: RANKS[i],
          roleTitle: pick(ROLE_TITLES, i),
          unit: unitByIndex[i],
          status,
          healthScore: isMedical ? 45 + (i % 20) : 78 + (i % 22),
          missionsCompleted: 2 + ((i * 5) % 38),
          email: `${name.toLowerCase().replace(/\s+/g, ".")}@prahari-x.mil`,
          phone: `+91 9${(10000000 + i * 137931).toString().slice(0, 9)}`,
          joinedAt,
          avatarSeed: `${name}-${i}`,
          location: regionByIndex[i],
          performanceScore: 62 + ((i * 11) % 36),
          certifications: JSON.stringify([pick(CERTIFICATIONS, i), pick(CERTIFICATIONS, i + 4)]),
        },
      })
    );
  }

  // ------------------------------------------------------------------------
  // 3. Soldier login accounts — several, each linked 1:1 to a distinct
  //    Personnel record spanning different ranks/units so the Soldier
  //    portal can be demoed from more than one perspective. No orphans:
  //    every one of these Users has personnelId set, and every linked
  //    Personnel record is the one actually rendered everywhere else.
  // ------------------------------------------------------------------------
  const soldierLinks = [
    { index: 2, email: "soldier@prahari-x.mil" },
    { index: 10, email: "soldier2@prahari-x.mil" },
    { index: 15, email: "soldier3@prahari-x.mil" },
    { index: 20, email: "soldier4@prahari-x.mil" },
  ];
  const soldierUsers = [];
  for (const link of soldierLinks) {
    const p = personnel[link.index];
    soldierUsers.push(
      await prisma.user.create({
        data: {
          name: p.name,
          email: link.email,
          passwordHash,
          role: "soldier",
          rank: p.rank,
          unit: p.unit,
          avatarSeed: p.avatarSeed,
          personnelId: p.id,
          settings: { create: {} },
        },
      })
    );
  }
  const soldierPersonnel = soldierLinks.map((l) => personnel[l.index]);

  // ------------------------------------------------------------------------
  // 4. Squads — created from the squadDefs declared above, so each squad's
  //    unit matches every one of its members' Personnel.unit.
  // ------------------------------------------------------------------------
  const squads = [];
  for (const def of squadDefs) {
    squads.push(
      await prisma.squad.create({
        data: {
          name: def.name,
          unit: def.unit,
          leaderId: personnel[def.leader].id,
          createdById: commander.id,
          members: { create: def.members.map((idx) => ({ personnelId: personnel[idx].id })) },
        },
      })
    );
  }

  // ------------------------------------------------------------------------
  // 5. Assets — expanded catalog across all 5 categories.
  // ------------------------------------------------------------------------
  const assetDefs: Array<[string, string, string]> = [
    ["Kestrel APC-4 #104", "vehicle", "Kestrel APC-4"],
    ["Ridgeback MRAP #107", "vehicle", "Ridgeback MRAP"],
    ["Falcon LSV #110", "vehicle", "Falcon LSV"],
    ["Titan Transporter #112", "vehicle", "Titan Transporter"],
    ["Hawkeye Mk III #201", "drone", "Hawkeye Mk III"],
    ["Nightshade ISR #203", "drone", "Nightshade ISR"],
    ["Corvus Recon #205", "drone", "Corvus Recon"],
    ["Vantage Loiter-6 #207", "drone", "Vantage Loiter-6"],
    ["Sentinel DMR-9 #302", "weapon", "Sentinel DMR-9"],
    ["Aegis Turret L2 #304", "weapon", "Aegis Turret L2"],
    ["Phalanx CIWS-M #306", "weapon", "Phalanx CIWS-M"],
    ["Wraith Carbine #308", "weapon", "Wraith Carbine"],
    ["MedEvac Pod #401", "medical", "MedEvac Pod"],
    ["Field Trauma Kit #403", "medical", "Field Trauma Kit"],
    ["Rapid Response Unit #405", "medical", "Rapid Response Unit"],
    ["Mobile Surgical Cell #407", "medical", "Mobile Surgical Cell"],
    ["Argus-7 ISR Sat #501", "satellite", "Argus-7 ISR Sat"],
    ["Skylink Comm Sat #503", "satellite", "Skylink Comm Sat"],
    ["Watchtower EO/IR #505", "satellite", "Watchtower EO/IR"],
    ["Meridian Relay #507", "satellite", "Meridian Relay"],
  ];
  const statusCycle: Array<"operational" | "deployed" | "maintenance" | "decommissioned"> = [
    "operational", "deployed", "operational", "operational", "maintenance", "deployed", "operational", "decommissioned",
  ];
  const assets = [];
  for (let i = 0; i < assetDefs.length; i++) {
    const [name, category, model] = assetDefs[i];
    assets.push(
      await prisma.asset.create({
        data: {
          name,
          category,
          model,
          status: pick(statusCycle, i),
          location: pick(REGIONS, i + 2),
          condition: 55 + ((i * 9) % 45),
          lastMaintenanceDate: daysAgo(10 + (i * 4) % 60),
          nextMaintenanceDate: daysFromNow(15 + (i * 5) % 60),
        },
      })
    );
  }
  const weaponAssets = assets.filter((a) => a.category === "weapon");
  const vehicleAssets = assets.filter((a) => a.category === "vehicle");
  const droneAssets = assets.filter((a) => a.category === "drone");

  // ------------------------------------------------------------------------
  // 6. Missions — spread across every status/priority, each tied to a real
  //    squad (roster + assignedSquad), commander, objectives, logs, and
  //    equipment.
  // ------------------------------------------------------------------------
  const missionDefs: Array<{
    name: string;
    description: string;
    region: string;
    priority: "critical" | "high" | "medium" | "low";
    status: "planning" | "active" | "paused" | "completed";
    progress: number;
    squadIdx: number;
    startOffset: number;
    endOffset: number;
    equipment: number[];
  }> = [
    { name: "Operation Silent Ridge", description: "Reconnaissance and forward-post establishment along the northern high-altitude approach.", region: REGIONS[0], priority: "high", status: "active", progress: 62, squadIdx: 0, startOffset: -20, endOffset: 15, equipment: [0, 8] },
    { name: "Operation Iron Vigil", description: "Sustained perimeter watch and rapid-response readiness for the eastern hill sector.", region: REGIONS[1], priority: "critical", status: "active", progress: 48, squadIdx: 2, startOffset: -10, endOffset: 25, equipment: [9, 17] },
    { name: "Operation Northern Watch", description: "Pre-deployment planning for an extended coastal surveillance rotation.", region: REGIONS[1], priority: "medium", status: "planning", progress: 8, squadIdx: 1, startOffset: 5, endOffset: 40, equipment: [4] },
    { name: "Operation Copper Falcon", description: "Completed amphibious logistics-corridor security operation.", region: REGIONS[2], priority: "high", status: "completed", progress: 100, squadIdx: 3, startOffset: -90, endOffset: -55, equipment: [1, 12] },
    { name: "Operation Quiet Storm", description: "Ongoing desert-sector patrol and threat-interdiction sweep.", region: REGIONS[4], priority: "medium", status: "active", progress: 71, squadIdx: 4, startOffset: -30, endOffset: 10, equipment: [2, 5] },
    { name: "Operation Steel Horizon", description: "Paused basin-sector fortification project pending fresh supply allocation.", region: REGIONS[5], priority: "low", status: "paused", progress: 44, squadIdx: 0, startOffset: -45, endOffset: 30, equipment: [3] },
    { name: "Operation Amber Shield", description: "Completed plateau-sector training and readiness certification exercise.", region: REGIONS[7], priority: "medium", status: "completed", progress: 100, squadIdx: 1, startOffset: -120, endOffset: -95, equipment: [10] },
    { name: "Operation Ghost Compass", description: "Planning phase for a Western Ghats reconnaissance corridor survey.", region: REGIONS[3], priority: "high", status: "planning", progress: 12, squadIdx: 2, startOffset: 8, endOffset: 50, equipment: [6] },
    { name: "Operation Vantage Point", description: "Active coastal ISR and interdiction operation with drone overwatch.", region: REGIONS[2], priority: "critical", status: "active", progress: 55, squadIdx: 3, startOffset: -15, endOffset: 20, equipment: [7, 11] },
  ];
  const missions = [];
  for (const def of missionDefs) {
    const squad = squads[def.squadIdx];
    const squadDef = squadDefs[def.squadIdx];
    const startDate = def.startOffset < 0 ? daysAgo(-def.startOffset) : daysFromNow(def.startOffset);
    const endDate = def.endOffset < 0 ? daysAgo(-def.endOffset) : daysFromNow(def.endOffset);
    const objectiveStatus1 = def.status === "planning" ? "pending" : "complete";
    const objectiveStatus2 = def.status === "completed" ? "complete" : def.status === "planning" ? "pending" : "in_progress";
    const mission = await prisma.mission.create({
      data: {
        code: generateCode(),
        name: def.name,
        description: def.description,
        region: def.region,
        priority: def.priority,
        status: def.status,
        progress: def.progress,
        startDate,
        endDate,
        commanderId: commander.id,
        assignedSquadId: squad.id,
        objectives: {
          create: [
            { title: "Establish forward observation post", description: "Deploy reconnaissance team and establish the initial observation point.", status: objectiveStatus1, dueDate: startDate },
            { title: "Secure perimeter and supply corridor", description: "Secure the operational perimeter and maintain the logistics corridor.", status: objectiveStatus2, dueDate: endDate },
            { title: "Coordinate extraction / handoff", description: "Plan and execute a controlled handoff or extraction at mission close.", status: def.status === "completed" ? "complete" : "pending", dueDate: endDate },
          ],
        },
        logs: {
          create: [
            { author: commander.name, message: "Mission authorized and briefing completed.", type: "info", timestamp: startDate },
            {
              author: def.status === "completed" ? "Field Ops" : missionPlanner.name,
              message: def.status === "completed" ? "Mission objectives completed; squad stood down." : `${squadDef.name} deployed to ${def.region}.`,
              type: def.status === "completed" ? "action" : "action",
              timestamp: def.startOffset < 0 ? daysAgo(-def.startOffset - 1 > 0 ? -def.startOffset - 1 : 0) : daysFromNow(def.startOffset + 1),
            },
          ],
        },
        squad: { create: squadDef.members.map((idx) => ({ personnelId: personnel[idx].id })) },
        equipment: { create: def.equipment.map((idx) => ({ assetId: assets[idx].id })) },
      },
    });
    missions.push(mission);
  }
  const activeMissions = missions.filter((m) => m.status === "active");

  // ------------------------------------------------------------------------
  // 7. Threat reports.
  // ------------------------------------------------------------------------
  const threatDefs: Array<[string, string, string, string, string]> = [
    ["Anomalous intrusion attempt on comms relay", "cyber", "high", "active", "ISR Network"],
    ["Credential-spray activity on field VPN", "cyber", "medium", "monitoring", "Cyber Watch"],
    ["Unregistered UAV incursion detected", "drone", "critical", "active", "ISR Network"],
    ["Loitering munition signature identified", "drone", "high", "active", "Ground Sensor Grid"],
    ["Unusual orbital pass over sector", "satellite", "medium", "monitoring", "SIGINT Array"],
    ["Signal jamming detected in ISR band", "satellite", "high", "active", "SIGINT Array"],
    ["Unidentified convoy movement", "ground", "medium", "monitoring", "Ground Sensor Grid"],
    ["Perimeter sensor tripped, unconfirmed contact", "ground", "low", "neutralized", "Ground Sensor Grid"],
    ["Encrypted burst transmission intercepted", "signal", "medium", "active", "SIGINT Array"],
  ];
  const threats = [];
  for (let i = 0; i < threatDefs.length; i++) {
    const [title, category, severity, status, source] = threatDefs[i];
    threats.push(
      await prisma.threatReport.create({
        data: {
          title,
          category,
          severity,
          status,
          region: pick(REGIONS, i + 1),
          description: "Automated sensors flagged this event for review. Correlate with adjacent reports before escalation.",
          source,
          aiConfidence: 55 + ((i * 13) % 45),
          recommendation: severity === "critical" || severity === "high" ? "Escalate to on-duty Commander and dispatch nearest patrol for visual confirmation." : "Continue passive monitoring; re-assess if signature repeats within 24 hours.",
          detectedAt: daysAgo(1 + i * 3),
        },
      })
    );
  }

  // ------------------------------------------------------------------------
  // 8. Inventory (Weapons & Ammunition catalog).
  // ------------------------------------------------------------------------
  const inventoryDefs: Array<[string, string, string, number, number, number]> = [
    ["Sentinel DMR-9", "firearm", "7.62x51mm designated marksman rifle", 42, 8, 2400],
    ["Wraith Carbine", "firearm", "5.56x45mm standard-issue carbine", 6, 8, 1350],
    ["Aegis Sidearm P2", "firearm", "9x19mm service pistol", 30, 8, 620],
    ["Phalanx CIWS-M", "firearm", "Vehicle-mounted close-in weapon system", 3, 2, 18500],
    ["5.56x45mm NATO Ball", "ammunition", "Standard carbine ammunition, 30-round belts", 3200, 500, 1],
    ["7.62x51mm Match Grade", "ammunition", "Precision marksman ammunition", 420, 500, 1],
    ["9x19mm Parabellum", "ammunition", "Standard sidearm ammunition", 1800, 500, 1],
    ["40mm Non-Lethal Round", "ammunition", "Crowd-control / breach training round", 0, 500, 7],
    ["Ballistic Helmet H7", "tactical_gear", "Level IIIA rated, integrated comms mount", 24, 8, 480],
    ["Tactical Vest Mk4", "tactical_gear", "Modular plate carrier, level IV inserts", 18, 8, 950],
    ["Night Vision Goggles Gen3", "tactical_gear", "Dual-tube, 40 degree FOV", 10, 8, 4200],
    ["Kestrel APC-4", "vehicle", "Armored personnel carrier, 8-seat", 5, 2, 420000],
    ["Ridgeback MRAP", "vehicle", "Mine-resistant patrol vehicle", 3, 1, 650000],
    ["Hawkeye Mk III", "drone", "ISR reconnaissance drone, 8hr endurance", 8, 3, 72000],
  ];
  const inventory = [];
  for (const [name, category, spec, quantity, reorderThreshold, unitCost] of inventoryDefs) {
    const status = quantity === 0 ? "out_of_stock" : quantity <= reorderThreshold ? "low_stock" : "in_stock";
    inventory.push(
      await prisma.inventoryItem.create({
        data: { name, category, spec, quantity, reorderThreshold, status, unitCost, location: pick(REGIONS, inventory.length + 3), lastRestocked: daysAgo(5 + inventory.length * 9) },
      })
    );
  }
  const rifle = inventory.find((i) => i.name === "Sentinel DMR-9")!;
  const carbine = inventory.find((i) => i.name === "Wraith Carbine")!;
  const helmet = inventory.find((i) => i.name === "Ballistic Helmet H7")!;

  // ------------------------------------------------------------------------
  // 9. Training programs.
  // ------------------------------------------------------------------------
  const trainingDefs: Array<[string, string, string, number, boolean, string, number, number]> = [
    ["Advanced Marksmanship", "combat", "Precision fire under time pressure and adverse conditions.", 40, true, "active", 32, 68],
    ["Close Quarters Tactics", "combat", "Room-clearing, breach coordination, and fire-team movement.", 32, true, "active", 24, 55],
    ["Combat First Aid", "medical", "Trauma stabilization and casualty evacuation under fire.", 24, true, "active", 40, 80],
    ["Field Trauma Surgery", "medical", "Advanced surgical intervention for forward medics.", 60, false, "upcoming", 9, 20],
    ["Signals & Encrypted Comms", "technical", "Secure communications setup, encryption, and EW resilience.", 28, true, "upcoming", 18, 40],
    ["Drone Operations Certification", "technical", "ISR drone piloting, sensor payloads, and airspace deconfliction.", 36, false, "active", 14, 45],
    ["Small Unit Leadership", "leadership", "Decision-making, delegation, and mission command for squad leads.", 45, false, "active", 12, 50],
    ["High-Altitude & Extreme Climate Ops", "survival", "Operating and surviving in extreme cold-weather, high-altitude environments.", 38, false, "completed", 20, 95],
  ];
  const training = [];
  for (const [name, category, description, durationHours, mandatory, status, enrolledCount, completionRate] of trainingDefs) {
    training.push(
      await prisma.trainingProgram.create({
        data: { name, category, description, durationHours, mandatory, status, enrolledCount, completionRate, nextSessionDate: daysFromNow(7 + training.length * 9) },
      })
    );
  }
  const marksmanshipTraining = training.find((t) => t.name === "Advanced Marksmanship")!;
  const firstAidTraining = training.find((t) => t.name === "Combat First Aid")!;

  // ------------------------------------------------------------------------
  // 10. Notifications — tied to real events across command + soldier users.
  // ------------------------------------------------------------------------
  const notificationDefs: Array<{ user: (typeof commandUsers)[number]; type: string; title: string; message: string; severity?: string; read: boolean; daysAgo: number }> = [
    { user: commander, type: "threat", title: "Critical threat detected", message: `New critical-severity ${threats[2].category} intrusion flagged in ${threats[2].region}.`, severity: "critical", read: false, daysAgo: 0 },
    { user: commander, type: "mission", title: "Mission status updated", message: `${missions[1].name} progressing — ${missions[1].progress}% complete.`, read: true, daysAgo: 2 },
    { user: commander, type: "personnel", title: "Leave request submitted", message: `${personnel[10].name} requested leave for review.`, read: false, daysAgo: 1 },
    { user: commander, type: "system", title: "New AI briefing ready", message: "Daily intelligence digest is ready for review.", read: true, daysAgo: 4 },
    { user: intelOfficer, type: "threat", title: "Signal anomaly flagged", message: `${threats[5].title} — recommend correlation review.`, severity: "high", read: false, daysAgo: 1 },
    { user: intelOfficer, type: "system", title: "Weekly threat summary", message: "9 threat reports logged this week across 6 sectors.", read: true, daysAgo: 6 },
    { user: missionPlanner, type: "mission", title: "New mission entering planning", message: `${missions[2].name} awaiting squad confirmation.`, read: false, daysAgo: 3 },
    { user: missionPlanner, type: "mission", title: "Objective completed", message: `Forward observation post established for ${missions[0].name}.`, read: true, daysAgo: 8 },
    { user: logisticsOfficer, type: "system", title: "Low stock alert", message: `${carbine.name} is below reorder threshold.`, severity: "medium", read: false, daysAgo: 2 },
    { user: logisticsOfficer, type: "system", title: "Maintenance due", message: `${vehicleAssets[1].name} is due for scheduled maintenance.`, read: true, daysAgo: 10 },
    { user: administrator, type: "personnel", title: "New account created", message: "4 Soldier accounts are now active on the platform.", read: true, daysAgo: 30 },
  ];
  for (const n of notificationDefs) {
    await prisma.notification.create({
      data: { userId: n.user.id, type: n.type, title: n.title, message: n.message, severity: n.severity, read: n.read, createdAt: daysAgo(n.daysAgo) },
    });
  }
  const soldierNotificationDefs: Array<{ idx: number; title: string; message: string; type: string; daysAgo: number }> = [
    { idx: 0, title: "New assignment issued", message: "You have been issued a primary weapon for active deployment.", type: "personnel", daysAgo: 5 },
    { idx: 0, title: "Leave request approved", message: "Your leave request was approved by Commander Aryan Vashisht.", type: "personnel", daysAgo: 12 },
    { idx: 1, title: "Shift scheduled", message: "A new patrol shift has been scheduled for you.", type: "personnel", daysAgo: 2 },
    { idx: 2, title: "Achievement unlocked", message: "You were awarded a commendation badge.", type: "personnel", daysAgo: 15 },
    { idx: 3, title: "Training reminder", message: "Advanced Marksmanship recertification is due soon.", type: "system", daysAgo: 1 },
  ];
  for (const n of soldierNotificationDefs) {
    await prisma.notification.create({
      data: { userId: soldierUsers[n.idx].id, type: n.type, title: n.title, message: n.message, read: n.daysAgo > 5, createdAt: daysAgo(n.daysAgo) },
    });
  }

  // ------------------------------------------------------------------------
  // 11. Chat conversations (AI Assistant history).
  // ------------------------------------------------------------------------
  await prisma.chat.create({
    data: {
      userId: commander.id,
      title: `Threat pattern correlation — ${threats[0].region}`,
      createdAt: daysAgo(3),
      messages: {
        create: [
          { role: "user", content: `Summarize the last 48 hours of cyber activity in ${threats[0].region}.`, createdAt: daysAgo(3) },
          {
            role: "assistant",
            content:
              "Over the last 48 hours, two cyber-category events were logged, including a credential-spray attempt on the field VPN and an anomalous intrusion attempt on the comms relay. Recommend rotating VPN credentials for exposed nodes and isolating the affected relay segment pending forensic review.",
            createdAt: daysAgo(3),
          },
        ],
      },
    },
  });
  await prisma.chat.create({
    data: {
      userId: commander.id,
      title: `Draft mission brief — ${REGIONS[2]}`,
      createdAt: daysAgo(9),
      messages: {
        create: [
          { role: "user", content: `Draft a mission brief for a reconnaissance operation in ${REGIONS[2]}.`, createdAt: daysAgo(9) },
          {
            role: "assistant",
            content:
              "Draft brief — low-signature reconnaissance of the coastal approach, emphasis on identifying irregular vessel traffic. Recommended squad size: 5. Suggested assets: one ISR drone, one MRAP for extraction standby. Estimated window: 72 hours. Risk level: medium, contingent on weather visibility.",
            createdAt: daysAgo(9),
          },
        ],
      },
    },
  });
  await prisma.chat.create({
    data: {
      userId: intelOfficer.id,
      title: "Weekly threat trend review",
      createdAt: daysAgo(1),
      messages: {
        create: [
          { role: "user", content: "What's the threat trend across all sectors this week?", createdAt: daysAgo(1) },
          {
            role: "assistant",
            content:
              "Threat volume is up slightly week-over-week, driven mainly by drone and signal-category events. Two critical/high items remain active and unresolved — recommend prioritizing the unregistered UAV incursion and the ISR-band jamming report for follow-up.",
            createdAt: daysAgo(1),
          },
        ],
      },
    },
  });

  // ------------------------------------------------------------------------
  // 12. Comments — across missions, threats, assets, inventory, training.
  // ------------------------------------------------------------------------
  const commentDefs: Array<{ user: { id: string }; entityType: string; entityId: string; content: string; daysAgo: number }> = [
    { user: commander, entityType: "mission", entityId: missions[0].id, content: "Squad in position at the forward observation post. Awaiting go signal.", daysAgo: 18 },
    { user: missionPlanner, entityType: "mission", entityId: missions[0].id, content: "Confirmed — hold until first light. Weather window looks favorable.", daysAgo: 17 },
    { user: intelOfficer, entityType: "threat", entityId: threats[2].id, content: "Correlating this with the drone-band jamming report from earlier this week — possible coordinated activity.", daysAgo: 1 },
    { user: logisticsOfficer, entityType: "inventory", entityId: carbine.id, content: "Restock order placed — expect delivery within the week.", daysAgo: 2 },
    { user: commander, entityType: "asset", entityId: vehicleAssets[1].id, content: "Schedule this for maintenance before the next patrol rotation.", daysAgo: 6 },
    { user: administrator, entityType: "training", entityId: marksmanshipTraining.id, content: "Next cohort scheduled — range availability confirmed for the full week.", daysAgo: 4 },
    { user: missionPlanner, entityType: "mission", entityId: missions[1].id, content: "Requesting an additional drone asset for extended overwatch.", daysAgo: 5 },
    { user: commander, entityType: "mission", entityId: missions[1].id, content: "Approved — reallocating Nightshade ISR from reserve.", daysAgo: 5 },
  ];
  for (const c of commentDefs) {
    await prisma.comment.create({
      data: { entityType: c.entityType, entityId: c.entityId, userId: c.user.id, content: c.content, createdAt: daysAgo(c.daysAgo) },
    });
  }

  // ------------------------------------------------------------------------
  // 13. Audit log — historical spread across ~90 days so the platform reads
  //     as actively used rather than freshly created.
  // ------------------------------------------------------------------------
  const auditActors = [commander, intelOfficer, missionPlanner, logisticsOfficer, administrator, ...soldierUsers];
  const auditActions = [
    "Logged in", "Updated mission", "Created personnel record", "Reviewed threat report",
    "Exported AI conversation", "Changed password", "Assigned asset to mission", "Approved leave request",
    "Updated objectives", "Reassigned squad", "Uploaded mission document", "Marked notification read",
  ];
  const auditTargets = [
    `Mission #${missions[0].code}`, `Personnel #${personnel[4].id.slice(-6)}`, `Threat #${threats[1].id.slice(-6)}`,
    `Asset #${assets[3].id.slice(-6)}`, "Own account", `Squad #${squads[0].id.slice(-6)}`,
  ];
  for (let i = 0; i < 40; i++) {
    await prisma.auditLog.create({
      data: {
        userId: pick(auditActors, i).id,
        actor: pick(auditActors, i).name,
        action: pick(auditActions, i),
        target: pick(auditTargets, i),
        ip: `10.${(i * 17) % 255}.${(i * 43) % 255}.${(i * 91) % 255}`,
        status: i % 11 === 0 ? "failed" : "success",
        timestamp: daysAgo((i * 2.2) % 90),
        entityType: i % 3 === 0 ? "mission" : undefined,
        entityId: i % 3 === 0 ? missions[i % missions.length].id : undefined,
      },
    });
  }

  // ------------------------------------------------------------------------
  // 14. Login history — spread across ~60 days per account.
  // ------------------------------------------------------------------------
  const allUsers = [...commandUsers, ...soldierUsers];
  for (let u = 0; u < allUsers.length; u++) {
    const user = allUsers[u];
    for (let n = 0; n < 5; n++) {
      await prisma.loginHistory.create({
        data: {
          userId: user.id,
          success: !(u === 2 && n === 1), // one realistic failed attempt
          ip: `10.${(u * 31 + n) % 255}.${(u * 53 + n) % 255}.${(u * 7 + n) % 255}`,
          userAgent: n % 2 === 0 ? "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/124.0" : "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_5) Safari/605.1",
          createdAt: daysAgo(u * 3 + n * 11),
        },
      });
    }
  }

  // ------------------------------------------------------------------------
  // 15. Command & Control workflow — Assignments across all 4 linked
  //     soldiers (not just one), Shifts, Leave, Badges, Attendance, Patrol
  //     Routes, Field Reports, Mission Documents.
  // ------------------------------------------------------------------------

  // Assignments — weapon, ammunition, training, task, equipment across each
  // soldier, issued by a mix of Commander and Logistics Officer.
  const assignmentDefs: Array<{ soldierIdx: number; type: string; title: string; description: string; quantity?: number; priority: string; status: string; assetId?: string; inventoryItemId?: string; trainingProgramId?: string; missionId?: string; issuedBy: { id: string }; dueDaysFromNow?: number }> = [
    { soldierIdx: 0, type: "weapon", title: weaponAssets[0].name, description: "Primary issued weapon for active deployment.", priority: "high", status: "active", assetId: weaponAssets[0].id, missionId: activeMissions[0]?.id, issuedBy: logisticsOfficer },
    { soldierIdx: 0, type: "ammunition", title: rifle.name, description: "Standard ammunition allocation.", quantity: 120, priority: "medium", status: "active", inventoryItemId: rifle.id, issuedBy: logisticsOfficer },
    { soldierIdx: 0, type: "training", title: marksmanshipTraining.name, description: "Mandatory recertification.", priority: "medium", status: "active", trainingProgramId: marksmanshipTraining.id, issuedBy: commander },
    { soldierIdx: 0, type: "task", title: "Perimeter check — Sector 4", description: "Complete a visual sweep of the northern perimeter before end of shift.", priority: "medium", status: "active", issuedBy: commander, dueDaysFromNow: 1 },
    { soldierIdx: 1, type: "weapon", title: weaponAssets[1].name, description: "Assigned crew-served weapon for patrol duty.", priority: "high", status: "active", assetId: weaponAssets[1].id, issuedBy: logisticsOfficer },
    { soldierIdx: 1, type: "equipment", title: helmet.name, description: "Standard-issue protective gear.", priority: "low", status: "active", inventoryItemId: helmet.id, issuedBy: logisticsOfficer },
    { soldierIdx: 1, type: "vehicle", title: vehicleAssets[2].name, description: "Assigned light strike vehicle for the current rotation.", priority: "medium", status: "active", assetId: vehicleAssets[2].id, missionId: activeMissions[1]?.id, issuedBy: commander },
    { soldierIdx: 2, type: "medical_kit", title: "Field Trauma Kit", description: "Issued for forward medic duties.", priority: "medium", status: "active", issuedBy: logisticsOfficer },
    { soldierIdx: 2, type: "training", title: firstAidTraining.name, description: "Combat medic refresher course.", priority: "high", status: "completed", trainingProgramId: firstAidTraining.id, issuedBy: commander },
    { soldierIdx: 2, type: "task", title: "Casualty drill after-action report", description: "Submit after-action report following this week's casualty evacuation drill.", priority: "medium", status: "completed", issuedBy: commander },
    { soldierIdx: 3, type: "drone", title: droneAssets[0].name, description: "Assigned ISR drone for reconnaissance sweeps.", priority: "high", status: "active", assetId: droneAssets[0].id, missionId: activeMissions[2]?.id, issuedBy: logisticsOfficer },
    { soldierIdx: 3, type: "comms", title: "Encrypted Field Comms Headset", description: "Issued for secure squad-level communications.", priority: "low", status: "active", issuedBy: logisticsOfficer },
    { soldierIdx: 3, type: "task", title: "Sensor calibration check", description: "Calibrate ISR sensor payload ahead of next patrol.", priority: "medium", status: "active", issuedBy: missionPlanner, dueDaysFromNow: 3 },
  ];
  for (const a of assignmentDefs) {
    await prisma.assignment.create({
      data: {
        type: a.type,
        title: a.title,
        description: a.description,
        quantity: a.quantity,
        priority: a.priority,
        status: a.status,
        dueDate: a.dueDaysFromNow ? daysFromNow(a.dueDaysFromNow) : undefined,
        personnelId: soldierPersonnel[a.soldierIdx].id,
        missionId: a.missionId,
        assetId: a.assetId,
        inventoryItemId: a.inventoryItemId,
        trainingProgramId: a.trainingProgramId,
        assignedById: a.issuedBy.id,
      },
    });
  }

  // Shift schedules.
  const shiftTypes: Array<"patrol" | "guard" | "rest" | "admin"> = ["patrol", "guard", "rest", "admin"];
  for (let i = 0; i < 10; i++) {
    const soldierIdx = i % soldierPersonnel.length;
    await prisma.shiftSchedule.create({
      data: {
        personnelId: soldierPersonnel[soldierIdx].id,
        missionId: activeMissions[i % activeMissions.length]?.id,
        shiftDate: daysFromNow(i - 3),
        startTime: i % 2 === 0 ? "06:00" : "18:00",
        endTime: i % 2 === 0 ? "14:00" : "02:00",
        type: pick(shiftTypes, i),
        assignedById: (i % 2 === 0 ? commander : missionPlanner).id,
      },
    });
  }

  // Leave requests.
  const leaveDefs: Array<{ soldierIdx: number; reason: string; status: string; startOffset: number; endOffset: number }> = [
    { soldierIdx: 0, reason: "Family emergency — hometown visit", status: "approved", startOffset: -20, endOffset: -15 },
    { soldierIdx: 1, reason: "Annual leave", status: "approved", startOffset: -60, endOffset: -50 },
    { soldierIdx: 2, reason: "Medical follow-up appointment", status: "pending", startOffset: 5, endOffset: 6 },
    { soldierIdx: 3, reason: "Sibling's wedding", status: "pending", startOffset: 12, endOffset: 16 },
    { soldierIdx: 1, reason: "Short leave — personal", status: "rejected", startOffset: -8, endOffset: -7 },
  ];
  for (const l of leaveDefs) {
    const decided = l.status !== "pending";
    await prisma.leaveRequest.create({
      data: {
        personnelId: soldierPersonnel[l.soldierIdx].id,
        reason: l.reason,
        startDate: daysFromNow(l.startOffset),
        endDate: daysFromNow(l.endOffset),
        status: l.status,
        reviewedById: decided ? commander.id : undefined,
        reviewedAt: decided ? daysAgo(2) : undefined,
        createdAt: daysAgo(Math.abs(l.startOffset) + 3),
      },
    });
  }

  // Badges.
  const badgeDefs: Array<{ soldierIdx: number; title: string; description: string; icon: string; daysAgo: number }> = [
    { soldierIdx: 0, title: "Marksman Ribbon", description: "Awarded for exceptional accuracy during live-fire qualification.", icon: "target", daysAgo: 40 },
    { soldierIdx: 0, title: "Field Leadership Commendation", description: "Recognized for exemplary conduct during a high-pressure extraction.", icon: "award", daysAgo: 20 },
    { soldierIdx: 1, title: "Endurance Badge", description: "Completed the extended high-altitude endurance course.", icon: "shield", daysAgo: 55 },
    { soldierIdx: 2, title: "Combat Medic Star", description: "Awarded for outstanding casualty response under fire.", icon: "star", daysAgo: 30 },
    { soldierIdx: 3, title: "ISR Excellence Award", description: "Recognized for consistently high-quality reconnaissance reporting.", icon: "zap", daysAgo: 10 },
    { soldierIdx: 1, title: "Perfect Attendance", description: "No missed shifts across the last training cycle.", icon: "trophy", daysAgo: 3 },
  ];
  for (const b of badgeDefs) {
    await prisma.badge.create({
      data: { personnelId: soldierPersonnel[b.soldierIdx].id, title: b.title, description: b.description, icon: b.icon, awardedById: commander.id, awardedAt: daysAgo(b.daysAgo) },
    });
  }

  // Attendance — last 45 days for a representative subset of 10 personnel
  // (the 4 linked soldiers plus the 5 squad leaders plus one more), using
  // createMany for efficiency.
  const attendanceSubjects = [
    ...soldierPersonnel,
    ...squadDefs.map((d) => personnel[d.leader]),
    personnel[7],
  ];
  const attendanceRows: Array<{ personnelId: string; date: Date; status: string }> = [];
  const uniqueSubjects = Array.from(new Map(attendanceSubjects.map((p) => [p.id, p])).values());
  for (const subject of uniqueSubjects) {
    for (let d = 0; d < 45; d++) {
      const roll = (d + subject.id.charCodeAt(0)) % 20;
      const status = roll === 0 ? "leave" : roll === 1 ? "late" : roll === 2 ? "absent" : "present";
      attendanceRows.push({ personnelId: subject.id, date: daysAgo(d), status });
    }
  }
  await prisma.attendance.createMany({ data: attendanceRows });

  // Patrol routes with waypoints/checkpoints.
  const patrolDefs: Array<{ name: string; region: string; missionIdx?: number; squadIdx: number; status: string; points: Array<{ kind: "waypoint" | "checkpoint"; label: string; location: string; status: string }> }> = [
    {
      name: "Northern Ridge Patrol Alpha", region: REGIONS[0], missionIdx: 0, squadIdx: 0, status: "active",
      points: [
        { kind: "checkpoint", label: "Forward Base Checkpoint", location: REGIONS[0], status: "reached" },
        { kind: "waypoint", label: "Ridge Overwatch Point", location: REGIONS[6], status: "reached" },
        { kind: "waypoint", label: "Valley Crossing", location: REGIONS[0], status: "pending" },
        { kind: "checkpoint", label: "Return Checkpoint", location: REGIONS[6], status: "pending" },
      ],
    },
    {
      name: "Coastal Sweep Bravo", region: REGIONS[2], missionIdx: 8, squadIdx: 3, status: "active",
      points: [
        { kind: "checkpoint", label: "Harbor Watch Checkpoint", location: REGIONS[2], status: "reached" },
        { kind: "waypoint", label: "Cove Observation Point", location: REGIONS[2], status: "pending" },
        { kind: "waypoint", label: "Coastal Road Junction", location: REGIONS[3], status: "pending" },
      ],
    },
    {
      name: "Desert Belt Recon Charlie", region: REGIONS[4], missionIdx: 4, squadIdx: 4, status: "completed",
      points: [
        { kind: "checkpoint", label: "Basecamp Checkpoint", location: REGIONS[4], status: "reached" },
        { kind: "waypoint", label: "Dune Ridge Overlook", location: REGIONS[5], status: "reached" },
        { kind: "checkpoint", label: "Extraction Checkpoint", location: REGIONS[4], status: "reached" },
      ],
    },
    {
      name: "Hill Sector Standby Delta", region: REGIONS[1], squadIdx: 1, status: "planned",
      points: [
        { kind: "checkpoint", label: "Staging Checkpoint", location: REGIONS[1], status: "pending" },
        { kind: "waypoint", label: "Tree Line Waypoint", location: REGIONS[1], status: "pending" },
        { kind: "waypoint", label: "Plateau Access Point", location: REGIONS[7], status: "pending" },
      ],
    },
  ];
  for (const p of patrolDefs) {
    await prisma.patrolRoute.create({
      data: {
        name: p.name,
        region: p.region,
        status: p.status,
        missionId: p.missionIdx !== undefined ? missions[p.missionIdx].id : undefined,
        squadId: squads[p.squadIdx].id,
        points: {
          create: p.points.map((pt, seq) => ({
            kind: pt.kind,
            sequence: seq,
            label: pt.label,
            location: pt.location,
            status: pt.status,
            reachedAt: pt.status === "reached" ? daysAgo(p.points.length - seq) : undefined,
          })),
        },
      },
    });
  }

  // Field reports — full spread of report types across soldiers.
  const fieldReportDefs: Array<{ soldierIdx: number; type: string; title: string; content: string; severity?: string; status: string; missionIdx?: number; daysAgo: number }> = [
    { soldierIdx: 0, type: "daily", title: "Daily status — all clear", content: "Perimeter secure, equipment operational, no incidents to report.", status: "acknowledged", missionIdx: 0, daysAgo: 1 },
    { soldierIdx: 0, type: "mission_progress", title: "Forward post established", content: "Observation post is fully operational; visibility good, no contact.", status: "acknowledged", missionIdx: 0, daysAgo: 18 },
    { soldierIdx: 0, type: "weapon_status", title: "Weekly weapon function check", content: "Primary weapon function-checked, no issues found.", status: "resolved", daysAgo: 6 },
    { soldierIdx: 1, type: "vehicle_status", title: "LSV pre-patrol inspection", content: "Vehicle inspected, fuel and tires nominal, cleared for patrol.", status: "acknowledged", missionIdx: 1, daysAgo: 3 },
    { soldierIdx: 1, type: "ammo_consumption", title: "Range qualification ammo usage", content: "Consumed 90 rounds during scheduled qualification, restock requested.", status: "submitted", daysAgo: 2 },
    { soldierIdx: 1, type: "incident", title: "Minor equipment malfunction", content: "Comms headset intermittent during patrol — swapped for spare, unit flagged for repair.", severity: "low", status: "resolved", daysAgo: 9 },
    { soldierIdx: 2, type: "medical_request", title: "Follow-up medical supplies needed", content: "Requesting resupply of trauma kit consumables ahead of next rotation.", status: "acknowledged", daysAgo: 4 },
    { soldierIdx: 2, type: "equipment_condition", title: "Medical kit condition report", content: "Field trauma kit inventoried and restocked; all items within expiry.", status: "resolved", daysAgo: 11 },
    { soldierIdx: 2, type: "mission_completion", title: "Casualty drill completed", content: "Squad completed the scheduled casualty evacuation drill with no injuries.", status: "resolved", daysAgo: 7 },
    { soldierIdx: 3, type: "daily", title: "Daily status — ISR sweep complete", content: "Drone sweep completed, no anomalies detected along assigned corridor.", status: "acknowledged", missionIdx: 8, daysAgo: 1 },
    { soldierIdx: 3, type: "incident", title: "Unregistered UAV sighting", content: "Visual contact with an unidentified UAV near the coastal corridor; logged and escalated to Intelligence.", severity: "high", status: "acknowledged", missionIdx: 8, daysAgo: 2 },
    { soldierIdx: 3, type: "emergency_alert", title: "Signal jamming encountered", content: "Brief loss of comms consistent with jamming; restored after repositioning. Recommend investigation.", severity: "critical", status: "submitted", daysAgo: 0 },
  ];
  for (const r of fieldReportDefs) {
    const isDecided = r.status === "acknowledged" || r.status === "resolved";
    await prisma.fieldReport.create({
      data: {
        type: r.type,
        title: r.title,
        content: r.content,
        severity: r.severity,
        status: r.status,
        personnelId: soldierPersonnel[r.soldierIdx].id,
        missionId: r.missionIdx !== undefined ? missions[r.missionIdx].id : undefined,
        reviewedById: isDecided ? commander.id : undefined,
        reviewedAt: isDecided ? daysAgo(Math.max(r.daysAgo - 1, 0)) : undefined,
        createdAt: daysAgo(r.daysAgo),
      },
    });
  }

  // Mission documents — briefings/maps for active + completed missions.
  const documentDefs: Array<{ missionIdx: number; type: string; title: string; url: string; uploadedBy: { id: string } }> = [
    { missionIdx: 0, type: "briefing", title: "Operation Silent Ridge — Mission Briefing", url: "https://prahari-x.mil/docs/msn-silent-ridge-briefing.pdf", uploadedBy: missionPlanner },
    { missionIdx: 0, type: "map", title: "Operation Silent Ridge — Sector Map", url: "https://prahari-x.mil/docs/msn-silent-ridge-map.png", uploadedBy: missionPlanner },
    { missionIdx: 1, type: "briefing", title: "Operation Iron Vigil — Mission Briefing", url: "https://prahari-x.mil/docs/msn-iron-vigil-briefing.pdf", uploadedBy: commander },
    { missionIdx: 3, type: "briefing", title: "Operation Copper Falcon — After-Action Report", url: "https://prahari-x.mil/docs/msn-copper-falcon-aar.pdf", uploadedBy: commander },
    { missionIdx: 3, type: "image", title: "Operation Copper Falcon — Extraction Photo Log", url: "https://prahari-x.mil/docs/msn-copper-falcon-photos.jpg", uploadedBy: missionPlanner },
    { missionIdx: 4, type: "map", title: "Operation Quiet Storm — Patrol Sector Map", url: "https://prahari-x.mil/docs/msn-quiet-storm-map.png", uploadedBy: missionPlanner },
    { missionIdx: 8, type: "briefing", title: "Operation Vantage Point — Mission Briefing", url: "https://prahari-x.mil/docs/msn-vantage-point-briefing.pdf", uploadedBy: commander },
    { missionIdx: 8, type: "map", title: "Operation Vantage Point — ISR Coverage Map", url: "https://prahari-x.mil/docs/msn-vantage-point-isr-map.png", uploadedBy: intelOfficer },
  ];
  for (const d of documentDefs) {
    await prisma.missionDocument.create({
      data: { missionId: missions[d.missionIdx].id, type: d.type, title: d.title, url: d.url, uploadedById: d.uploadedBy.id },
    });
  }

  console.log("Seed complete:");
  console.log("  Commander:          commander@prahari-x.mil / sentinel");
  console.log("  Intelligence Off.:  intel.officer@prahari-x.mil / sentinel");
  console.log("  Mission Planner:    mission.planner@prahari-x.mil / sentinel");
  console.log("  Logistics Officer:  logistics.officer@prahari-x.mil / sentinel");
  console.log("  Administrator:      administrator@prahari-x.mil / sentinel");
  console.log("  Soldiers:           soldier@prahari-x.mil, soldier2@, soldier3@, soldier4@prahari-x.mil / sentinel");
  console.log(`  ${personnel.length} personnel, ${squads.length} squads, ${missions.length} missions, ${assets.length} assets, ${threats.length} threats seeded.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
