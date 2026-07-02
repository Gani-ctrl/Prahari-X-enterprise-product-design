import type {
  Asset,
  AuditLogEntry,
  ChatConversation,
  CommentItem,
  InventoryItem,
  Mission,
  NotificationItem,
  Personnel,
  ThreatReport,
  TrainingProgram,
  User,
} from "@/types";
import {
  seedAssets,
  seedAuditLogs,
  seedComments,
  seedConversations,
  seedInventory,
  seedMissions,
  seedNotifications,
  seedPersonnel,
  seedSoldierUser,
  seedThreats,
  seedTrainingPrograms,
  seedUser,
} from "@/lib/mockData";

// ----------------------------------------------------------------------------
// A tiny local "database" persisted to localStorage. This stands in for the
// Prisma/PostgreSQL-backed Express API described in the PRD (see /server for
// the real API surface + schema). Swapping this module for real `fetch`
// calls against /api/* is a drop-in change — see services/api.ts.
// ----------------------------------------------------------------------------

// Bumped whenever the seed data shape changes, so stale localStorage from an
// earlier version of the app doesn't surface fields that no longer exist.
const NS = "prahari-x:v5:";

interface DBShape {
  user: User;
  soldierUser: User;
  personnel: Personnel[];
  assets: Asset[];
  inventory: InventoryItem[];
  trainingPrograms: TrainingProgram[];
  missions: Mission[];
  threats: ThreatReport[];
  notifications: NotificationItem[];
  auditLogs: AuditLogEntry[];
  conversations: ChatConversation[];
  comments: CommentItem[];
  // --- Auth simulation (mock-mode only — see mockApi.ts `auth`) ---
  /** Accounts created via the mock register flow (seeded commander/soldier personas live separately above). */
  registeredUsers: User[];
  /** email (lowercased) -> password, for accounts created via mock register. */
  mockCredentials: Record<string, string>;
  /** emails that have registered but not yet clicked/entered their verification token. */
  unverifiedEmails: string[];
  /** token -> email, for the mock email-verification flow. */
  verificationTokens: Record<string, string>;
  /** email -> { code, expiresAt }, for the mock forgot-password OTP flow. */
  otps: Record<string, { code: string; expiresAt: number }>;
  /** email of the account the mock "session" currently belongs to — lets auth.me()/auth.refresh() resolve identity without a real Authorization header. */
  currentSessionEmail: string | null;
}

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(NS + key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function write<T>(key: string, value: T) {
  try {
    localStorage.setItem(NS + key, JSON.stringify(value));
  } catch {
    /* storage unavailable — degrade silently */
  }
}

let cache: DBShape | null = null;

function seedAll(): DBShape {
  const personnel = seedPersonnel();
  const assets = seedAssets();
  return {
    user: seedUser(),
    soldierUser: seedSoldierUser(personnel),
    personnel,
    assets,
    inventory: seedInventory(),
    trainingPrograms: seedTrainingPrograms(),
    missions: seedMissions(personnel, assets),
    threats: seedThreats(),
    notifications: seedNotifications(),
    auditLogs: seedAuditLogs(),
    conversations: seedConversations(),
    comments: seedComments(),
    registeredUsers: [],
    mockCredentials: {},
    unverifiedEmails: [],
    verificationTokens: {},
    otps: {},
    currentSessionEmail: null,
  };
}

export function getDB(): DBShape {
  if (cache) return cache;
  const seeded = seedAll();
  cache = {
    user: read("user", seeded.user),
    soldierUser: read("soldierUser", seeded.soldierUser),
    personnel: read("personnel", seeded.personnel),
    assets: read("assets", seeded.assets),
    inventory: read("inventory", seeded.inventory),
    trainingPrograms: read("trainingPrograms", seeded.trainingPrograms),
    missions: read("missions", seeded.missions),
    threats: read("threats", seeded.threats),
    notifications: read("notifications", seeded.notifications),
    auditLogs: read("auditLogs", seeded.auditLogs),
    conversations: read("conversations", seeded.conversations),
    comments: read("comments", seeded.comments),
    registeredUsers: read("registeredUsers", seeded.registeredUsers),
    mockCredentials: read("mockCredentials", seeded.mockCredentials),
    unverifiedEmails: read("unverifiedEmails", seeded.unverifiedEmails),
    verificationTokens: read("verificationTokens", seeded.verificationTokens),
    otps: read("otps", seeded.otps),
    currentSessionEmail: read("currentSessionEmail", seeded.currentSessionEmail),
  };
  return cache;
}

export function saveSlice<K extends keyof DBShape>(key: K, value: DBShape[K]) {
  const db = getDB();
  db[key] = value;
  write(key as string, value);
}

export function resetDB() {
  Object.keys(localStorage)
    .filter((k) => k.startsWith(NS))
    .forEach((k) => localStorage.removeItem(k));
  cache = null;
}
