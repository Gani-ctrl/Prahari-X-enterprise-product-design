// ============================================================================
// PRAHARI X — Domain Types
// Mirrors Page 16 (Database) & Page 17 (Relationships) of the master PRD.
// ============================================================================

export type Role =
  | "commander"
  | "intelligence_officer"
  | "mission_planner"
  | "logistics_officer"
  | "administrator"
  | "soldier";

/** Roles with full command-console access (the "/app" portal). */
export const COMMAND_ROLES: Role[] = [
  "commander",
  "intelligence_officer",
  "mission_planner",
  "logistics_officer",
  "administrator",
];

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  rank?: string;
  unit?: string;
  avatarSeed: string;
  twoFactorEnabled: boolean;
  createdAt: string;
  lastActiveAt: string;
  /** Present only for role "soldier" — links this account to its own Personnel roster record. */
  personnelId?: string;
  /** Sourced from the linked Personnel record (Soldier accounts only) — there is no phone/location column on User itself. */
  phone?: string;
  location?: string;
  profileImageUrl?: string;
}

export type Priority = "critical" | "high" | "medium" | "low";
export type MissionStatus = "planning" | "active" | "paused" | "completed" | "aborted";

export interface Objective {
  id: string;
  title: string;
  description: string;
  status: "pending" | "in_progress" | "complete";
  dueDate: string;
}

export interface MissionLogEntry {
  id: string;
  timestamp: string;
  author: string;
  message: string;
  type: "info" | "action" | "alert";
}

export interface Mission {
  id: string;
  code: string;
  name: string;
  description: string;
  commanderId: string;
  commanderName: string;
  region: string;
  priority: Priority;
  status: MissionStatus;
  startDate: string;
  endDate: string;
  progress: number;
  objectives: Objective[];
  squadIds: string[];
  equipmentIds: string[];
  logs: MissionLogEntry[];
  createdAt: string;
  updatedAt: string;
}

export type PersonnelStatus = "available" | "deployed" | "leave" | "medical";

export interface Personnel {
  id: string;
  name: string;
  rank: string;
  roleTitle: string;
  unit: string;
  status: PersonnelStatus;
  healthScore: number;
  missionsCompleted: number;
  currentMissionId?: string;
  equipmentIds: string[];
  email: string;
  phone: string;
  joinedAt: string;
  avatarSeed: string;
  /** Current whereabouts — a region/sector name, not literal coordinates. */
  location: string;
  /** Commander-facing performance rating, 0-100. */
  performanceScore: number;
  /** Certifications / qualifications held, shown on the profile and in Training & Readiness. */
  certifications: string[];
}

export type AssetCategory = "vehicle" | "drone" | "weapon" | "medical" | "satellite";
export type AssetStatus = "operational" | "maintenance" | "deployed" | "decommissioned";

export interface Asset {
  id: string;
  name: string;
  category: AssetCategory;
  model: string;
  status: AssetStatus;
  assignedMissionId?: string;
  location: string;
  condition: number;
  lastMaintenanceDate: string;
  nextMaintenanceDate: string;
}

export type InventoryCategory = "firearm" | "ammunition" | "tactical_gear" | "vehicle" | "drone";
export type InventoryStatus = "in_stock" | "low_stock" | "out_of_stock";

/**
 * Weapons & Ammunition catalog — an inventory/presentation surface distinct
 * from Assets (which tracks individually-serialized, mission-assignable
 * equipment). This models bulk stock: quantities, reorder thresholds, unit
 * cost, not maintenance schedules or mission assignment.
 */
export interface InventoryItem {
  id: string;
  name: string;
  category: InventoryCategory;
  spec: string;
  quantity: number;
  reorderThreshold: number;
  status: InventoryStatus;
  location: string;
  unitCost: number;
  lastRestocked: string;
}

export type TrainingCategory = "combat" | "medical" | "technical" | "leadership" | "survival";
export type TrainingStatus = "upcoming" | "active" | "completed" | "archived";

/**
 * Training & Readiness catalog — scheduled programs the force cycles
 * through, tracked at the aggregate (not per-soldier) level here; individual
 * certifications already live on Personnel.certifications.
 */
export interface TrainingProgram {
  id: string;
  name: string;
  category: TrainingCategory;
  description: string;
  durationHours: number;
  mandatory: boolean;
  status: TrainingStatus;
  enrolledCount: number;
  /** Percentage of enrolled personnel who have completed this program, 0-100. */
  completionRate: number;
  nextSessionDate: string;
}

export type ThreatCategory = "cyber" | "drone" | "satellite" | "ground" | "signal";
export type ThreatSeverity = "critical" | "high" | "medium" | "low";
export type ThreatStatus = "active" | "monitoring" | "neutralized";

export interface ThreatReport {
  id: string;
  title: string;
  category: ThreatCategory;
  severity: ThreatSeverity;
  region: string;
  description: string;
  detectedAt: string;
  status: ThreatStatus;
  aiConfidence: number;
  source: string;
  recommendation?: string;
}

export type NotificationType = "mission" | "threat" | "system" | "personnel";

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  severity?: ThreatSeverity;
  read: boolean;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
}

export interface ChatConversation {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages: ChatMessage[];
  /**
   * Mock-mode only — identifies which local account owns this conversation
   * so services/mockApi.ts can scope listConversations() per signed-in user.
   * The real API never sends this; ownership there is enforced server-side
   * via the JWT's userId on every /chats query.
   */
  ownerEmail?: string;
}

export interface AuditLogEntry {
  id: string;
  actor: string;
  action: string;
  target: string;
  timestamp: string;
  ip: string;
  status: "success" | "failed";
  /** Present when this entry is also part of a specific record's Activity tab. */
  entityType?: string;
  entityId?: string;
}

/** Modules that support a comment thread + per-record activity feed. */
export type CommentEntityType = "mission" | "inventory" | "asset" | "threat" | "training";

export interface CommentAuthor {
  id: string;
  name: string;
  avatarSeed: string;
  role: Role;
}

export interface CommentItem {
  id: string;
  entityType: CommentEntityType;
  entityId: string;
  user: CommentAuthor;
  content: string;
  createdAt: string;
  updatedAt: string;
  editedAt?: string | null;
}

export interface DashboardTrendPoint {
  date: string;
  value: number;
}

export interface SoldierStats {
  total: number;
  active: number;
  deployed: number;
  available: number;
  injured: number;
  offline: number;
}

export interface DashboardStats {
  activeMissions: number;
  totalPersonnel: number;
  deployedAssets: number;
  activeThreats: number;
  pendingAlerts: number;
  missionTrend: DashboardTrendPoint[];
  threatTrend: DashboardTrendPoint[];
  soldierStats: SoldierStats;
}

// ============================================================================
// Command & Control workflow — Commander-issued assignments, Squad/patrol
// structure, and Soldier-submitted field reports.
// ============================================================================

export interface SquadRef {
  id: string;
  name: string;
}

export interface SquadMemberEntry {
  id: string;
  personnel: Personnel;
}

export interface Squad {
  id: string;
  name: string;
  unit: string;
  leaderId?: string;
  leader?: { id: string; name: string; rank: string; avatarSeed: string } | null;
  createdBy: { id: string; name: string };
  createdAt: string;
  members: SquadMemberEntry[];
}

export type RoutePointKind = "waypoint" | "checkpoint";
export type RoutePointStatus = "pending" | "reached" | "skipped";

export interface RoutePoint {
  id: string;
  kind: RoutePointKind;
  sequence: number;
  label: string;
  location: string;
  status: RoutePointStatus;
  reachedAt?: string | null;
}

export type PatrolRouteStatus = "planned" | "active" | "completed";

export interface PatrolRoute {
  id: string;
  name: string;
  region: string;
  status: PatrolRouteStatus;
  createdAt: string;
  mission?: { id: string; code: string; name: string } | null;
  squad?: SquadRef | null;
  points: RoutePoint[];
}

export type AssignmentType =
  | "weapon"
  | "ammunition"
  | "equipment"
  | "vehicle"
  | "drone"
  | "comms"
  | "medical_kit"
  | "protective_gear"
  | "training"
  | "task"
  | "emergency";

export type AssignmentStatus = "active" | "completed" | "cancelled" | "returned";

export interface Assignment {
  id: string;
  type: AssignmentType;
  title: string;
  description?: string | null;
  quantity?: number | null;
  priority: Priority;
  status: AssignmentStatus;
  dueDate?: string | null;
  createdAt: string;
  updatedAt: string;
  personnel: { id: string; name: string; rank: string; unit: string; avatarSeed: string };
  mission?: { id: string; code: string; name: string } | null;
  asset?: { id: string; name: string; category: string; model: string } | null;
  inventoryItem?: { id: string; name: string; category: string; spec: string } | null;
  trainingProgram?: { id: string; name: string; category: string } | null;
  assignedBy: { id: string; name: string };
}

export interface ShiftSchedule {
  id: string;
  shiftDate: string;
  startTime: string;
  endTime: string;
  type: "patrol" | "guard" | "rest" | "admin";
  createdAt: string;
  personnel: { id: string; name: string; rank: string; avatarSeed: string };
  mission?: { id: string; code: string; name: string } | null;
  assignedBy: { id: string; name: string };
}

export type LeaveStatus = "pending" | "approved" | "rejected";

export interface LeaveRequest {
  id: string;
  reason: string;
  startDate: string;
  endDate: string;
  status: LeaveStatus;
  reviewedBy?: { id: string; name: string } | null;
  reviewedAt?: string | null;
  createdAt: string;
  personnel: { id: string; name: string; rank: string; avatarSeed: string };
}

export type FieldReportType =
  | "daily"
  | "mission_progress"
  | "equipment_condition"
  | "weapon_status"
  | "ammo_consumption"
  | "vehicle_status"
  | "medical_request"
  | "incident"
  | "emergency_alert"
  | "mission_completion";

export type FieldReportStatus = "submitted" | "acknowledged" | "resolved";

export interface FieldReport {
  id: string;
  type: FieldReportType;
  title: string;
  content: string;
  severity?: Priority | null;
  status: FieldReportStatus;
  attachmentUrl?: string | null;
  createdAt: string;
  personnel: { id: string; name: string; rank: string; unit: string; avatarSeed: string };
  mission?: { id: string; code: string; name: string } | null;
  assignment?: { id: string; title: string; type: AssignmentType } | null;
  reviewedBy?: { id: string; name: string } | null;
}

export interface MissionDocument {
  id: string;
  type: "image" | "pdf" | "map" | "briefing";
  title: string;
  url: string;
  createdAt: string;
  uploadedBy: { id: string; name: string };
}

export interface Badge {
  id: string;
  title: string;
  description: string;
  icon: string;
  awardedAt: string;
  personnel?: { id: string; name: string };
  awardedBy?: { id: string; name: string };
}

export type AttendanceStatus = "present" | "absent" | "leave" | "late";

export interface AttendanceRecord {
  id: string;
  date: string;
  status: AttendanceStatus;
}

export interface Device {
  id: string;
  name: string;
  location: string;
  lastActive: string;
  current: boolean;
  os: string;
}
