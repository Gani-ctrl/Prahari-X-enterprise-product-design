// ----------------------------------------------------------------------------
// Translates the Express + Prisma API's response shapes (which follow the
// relational schema in server/prisma/schema.prisma) into the flat frontend
// types in src/types/index.ts that every page/store already expects. This is
// the only place that needs to change if the backend's response shape ever
// changes — no page or component depends on the raw server shape directly.
// ----------------------------------------------------------------------------
import type { Asset, ChatConversation, CommentItem, InventoryItem, Mission, NotificationItem, Personnel, ThreatReport, TrainingProgram, User } from "@/types";

export function mapUser(raw: any): User {
  return {
    id: raw.id,
    name: raw.name,
    email: raw.email,
    role: raw.role,
    rank: raw.rank ?? undefined,
    unit: raw.unit ?? undefined,
    avatarSeed: raw.avatarSeed,
    twoFactorEnabled: raw.twoFactorEnabled,
    createdAt: raw.createdAt,
    lastActiveAt: raw.lastActiveAt,
    personnelId: raw.personnelId ?? undefined,
    phone: raw.phone ?? undefined,
    location: raw.location ?? undefined,
    profileImageUrl: raw.profileImageUrl ?? undefined,
  };
}

export function mapMission(raw: any): Mission {
  return {
    id: raw.id,
    code: raw.code,
    name: raw.name,
    description: raw.description,
    commanderId: raw.commanderId,
    commanderName: raw.commander?.name ?? "Unassigned",
    region: raw.region,
    priority: raw.priority,
    status: raw.status,
    startDate: raw.startDate,
    endDate: raw.endDate,
    progress: raw.progress,
    objectives: (raw.objectives ?? []).map((o: any) => ({
      id: o.id,
      title: o.title,
      description: o.description,
      status: o.status,
      dueDate: o.dueDate,
    })),
    squadIds: (raw.squad ?? []).map((s: any) => s.personnelId),
    equipmentIds: (raw.equipment ?? []).map((e: any) => e.assetId),
    logs: (raw.logs ?? []).map((l: any) => ({
      id: l.id,
      timestamp: l.timestamp,
      author: l.author,
      message: l.message,
      type: l.type,
    })),
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  };
}

export function mapPersonnel(raw: any): Personnel {
  return {
    id: raw.id,
    name: raw.name,
    rank: raw.rank,
    roleTitle: raw.roleTitle,
    unit: raw.unit,
    status: raw.status,
    healthScore: raw.healthScore,
    missionsCompleted: raw.missionsCompleted,
    currentMissionId: raw.missions?.[0]?.missionId,
    equipmentIds: [],
    email: raw.email,
    phone: raw.phone,
    joinedAt: raw.joinedAt,
    avatarSeed: raw.avatarSeed,
    location: raw.location ?? "Unknown",
    performanceScore: raw.performanceScore ?? 70,
    certifications: raw.certifications ? JSON.parse(raw.certifications) : [],
  };
}

export function mapAsset(raw: any): Asset {
  return {
    id: raw.id,
    name: raw.name,
    category: raw.category,
    model: raw.model,
    status: raw.status,
    assignedMissionId: raw.missions?.[0]?.missionId,
    location: raw.location,
    condition: raw.condition,
    lastMaintenanceDate: raw.lastMaintenanceDate,
    nextMaintenanceDate: raw.nextMaintenanceDate,
  };
}

export function mapInventoryItem(raw: any): InventoryItem {
  return {
    id: raw.id,
    name: raw.name,
    category: raw.category,
    spec: raw.spec,
    quantity: raw.quantity,
    reorderThreshold: raw.reorderThreshold,
    status: raw.status,
    location: raw.location,
    unitCost: raw.unitCost,
    lastRestocked: raw.lastRestocked,
  };
}

export function mapTrainingProgram(raw: any): TrainingProgram {
  return {
    id: raw.id,
    name: raw.name,
    category: raw.category,
    description: raw.description,
    durationHours: raw.durationHours,
    mandatory: raw.mandatory,
    status: raw.status,
    enrolledCount: raw.enrolledCount,
    completionRate: raw.completionRate,
    nextSessionDate: raw.nextSessionDate,
  };
}

export function mapThreat(raw: any): ThreatReport {
  return {
    id: raw.id,
    title: raw.title,
    category: raw.category,
    severity: raw.severity,
    region: raw.region,
    description: raw.description,
    detectedAt: raw.detectedAt,
    status: raw.status,
    aiConfidence: raw.aiConfidence,
    source: raw.source,
    recommendation: raw.recommendation ?? undefined,
  };
}

export function mapNotification(raw: any): NotificationItem {
  return {
    id: raw.id,
    title: raw.title,
    message: raw.message,
    type: raw.type,
    severity: raw.severity ?? undefined,
    read: raw.read,
    createdAt: raw.createdAt,
  };
}

export function mapComment(raw: any): CommentItem {
  return {
    id: raw.id,
    entityType: raw.entityType,
    entityId: raw.entityId,
    user: {
      id: raw.user?.id ?? raw.userId,
      name: raw.user?.name ?? "Unknown",
      avatarSeed: raw.user?.avatarSeed ?? "unknown",
      role: raw.user?.role ?? "soldier",
    },
    content: raw.content,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
    editedAt: raw.editedAt ?? undefined,
  };
}

export function mapConversation(raw: any): ChatConversation {
  return {
    id: raw.id,
    title: raw.title,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
    messages: (raw.messages ?? []).map((m: any) => ({
      id: m.id,
      role: m.role,
      content: m.content,
      createdAt: m.createdAt,
    })),
  };
}
