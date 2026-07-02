import { sleep, generateRef } from "@/lib/utils";
import { getDB, saveSlice } from "./db";
import { ApiError } from "./apiError";
import type {
  Asset,
  ChatConversation,
  ChatMessage,
  CommentAuthor,
  CommentItem,
  DashboardStats,
  InventoryItem,
  Mission,
  NotificationItem,
  Personnel,
  ThreatReport,
  TrainingProgram,
  User,
} from "@/types";

// ----------------------------------------------------------------------------
// Simulated network layer — the default data source for this app. Mirrors the
// REST surface in Page 18 of the PRD, persists every mutation to
// localStorage, and adds realistic latency. See services/realApi.ts for the
// implementation that talks to the actual Express + Prisma backend, and
// services/api.ts for the switch between the two.
// ----------------------------------------------------------------------------

const LATENCY = 380;

// ----------------------------------------------------------------------------
// Mock authentication has been removed. Authentication always talks to the
// real Express + Prisma backend (see services/api.ts, which hard-wires
// `auth` to services/realApi.ts regardless of VITE_USE_MOCK_API) — there is
// no client-side/localStorage login, register, or session simulation left.
// ----------------------------------------------------------------------------

export const dashboard = {
  async stats(): Promise<DashboardStats> {
    await sleep(LATENCY);
    const db = getDB();
    const activeMissions = db.missions.filter((m) => m.status === "active").length;
    const deployedAssets = db.assets.filter((a) => a.status === "deployed").length;
    const activeThreats = db.threats.filter((t) => t.status === "active").length;
    const pendingAlerts = db.notifications.filter((n) => !n.read).length;

    const missionTrend = Array.from({ length: 7 }).map((_, i) => ({
      date: new Date(Date.now() - (6 - i) * 86400000).toISOString(),
      value: 3 + ((i * 5 + activeMissions) % 9),
    }));
    const threatTrend = Array.from({ length: 7 }).map((_, i) => ({
      date: new Date(Date.now() - (6 - i) * 86400000).toISOString(),
      value: 2 + ((i * 3 + activeThreats) % 7),
    }));

    const available = db.personnel.filter((p) => p.status === "available").length;
    const deployed = db.personnel.filter((p) => p.status === "deployed").length;
    const onLeave = db.personnel.filter((p) => p.status === "leave").length;
    const medical = db.personnel.filter((p) => p.status === "medical").length;

    return {
      activeMissions,
      totalPersonnel: db.personnel.length,
      deployedAssets,
      activeThreats,
      pendingAlerts,
      missionTrend,
      threatTrend,
      soldierStats: {
        total: db.personnel.length,
        active: available + deployed,
        deployed,
        available,
        injured: medical,
        offline: onLeave,
      },
    };
  },
};

export const missionsApi = {
  async list(): Promise<Mission[]> {
    await sleep(LATENCY);
    return [...getDB().missions].sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  },
  async get(id: string): Promise<Mission> {
    await sleep(LATENCY / 2);
    const m = getDB().missions.find((x) => x.id === id);
    if (!m) throw new ApiError("Mission not found", 404);
    return m;
  },
  async create(input: Partial<Mission>): Promise<Mission> {
    await sleep(LATENCY);
    const db = getDB();
    const now = new Date().toISOString();
    const mission: Mission = {
      id: `m-${Math.random().toString(36).slice(2, 8)}`,
      code: generateRef("MSN"),
      name: input.name ?? "Untitled Operation",
      description: input.description ?? "",
      commanderId: db.user.id,
      commanderName: db.user.name,
      region: input.region ?? "Himalayan Frontier Post",
      priority: input.priority ?? "medium",
      status: input.status ?? "planning",
      startDate: input.startDate ?? now,
      endDate: input.endDate ?? now,
      progress: 0,
      objectives: input.objectives ?? [],
      squadIds: input.squadIds ?? [],
      equipmentIds: input.equipmentIds ?? [],
      logs: [{ id: `l-${Date.now()}`, timestamp: now, author: db.user.name, message: "Mission created.", type: "info" }],
      createdAt: now,
      updatedAt: now,
    };
    saveSlice("missions", [mission, ...db.missions]);
    return mission;
  },
  async update(id: string, patch: Partial<Mission>): Promise<Mission> {
    await sleep(LATENCY);
    const db = getDB();
    const idx = db.missions.findIndex((m) => m.id === id);
    if (idx === -1) throw new ApiError("Mission not found", 404);
    const updated: Mission = { ...db.missions[idx], ...patch, updatedAt: new Date().toISOString() };
    const next = [...db.missions];
    next[idx] = updated;
    saveSlice("missions", next);
    return updated;
  },
  async remove(id: string): Promise<void> {
    await sleep(LATENCY);
    const db = getDB();
    saveSlice("missions", db.missions.filter((m) => m.id !== id));
  },
  async addLog(id: string, message: string, type: "info" | "action" | "alert" = "action") {
    await sleep(LATENCY / 2);
    const db = getDB();
    const idx = db.missions.findIndex((m) => m.id === id);
    if (idx === -1) throw new ApiError("Mission not found", 404);
    const entry = { id: `l-${Date.now()}`, timestamp: new Date().toISOString(), author: db.user.name, message, type };
    const next = [...db.missions];
    next[idx] = { ...next[idx], logs: [entry, ...next[idx].logs], updatedAt: new Date().toISOString() };
    saveSlice("missions", next);
    return next[idx];
  },
};

export const personnelApi = {
  async list(): Promise<Personnel[]> {
    await sleep(LATENCY);
    return getDB().personnel;
  },
  async create(input: Partial<Personnel>): Promise<Personnel> {
    await sleep(LATENCY);
    const db = getDB();
    const p: Personnel = {
      id: `p-${Math.random().toString(36).slice(2, 8)}`,
      name: input.name ?? "New Officer",
      rank: input.rank ?? "Lieutenant",
      roleTitle: input.roleTitle ?? "Field Operative",
      unit: input.unit ?? "1st Sentinel Battalion",
      status: input.status ?? "available",
      healthScore: 100,
      missionsCompleted: 0,
      equipmentIds: [],
      email: input.email ?? "",
      phone: input.phone ?? "",
      joinedAt: new Date().toISOString(),
      avatarSeed: `${input.name ?? "new"}-${Date.now()}`,
      location: input.location ?? "Himalayan Frontier Post",
      performanceScore: input.performanceScore ?? 75,
      certifications: input.certifications ?? [],
    };
    saveSlice("personnel", [p, ...db.personnel]);
    return p;
  },
  async update(id: string, patch: Partial<Personnel>): Promise<Personnel> {
    await sleep(LATENCY);
    const db = getDB();
    const idx = db.personnel.findIndex((p) => p.id === id);
    if (idx === -1) throw new ApiError("Personnel not found", 404);
    const updated = { ...db.personnel[idx], ...patch };
    const next = [...db.personnel];
    next[idx] = updated;
    saveSlice("personnel", next);
    return updated;
  },
  async remove(id: string): Promise<void> {
    await sleep(LATENCY);
    const db = getDB();
    saveSlice("personnel", db.personnel.filter((p) => p.id !== id));
  },
};

export const assetsApi = {
  async list(): Promise<Asset[]> {
    await sleep(LATENCY);
    return getDB().assets;
  },
  async create(input: Partial<Asset>): Promise<Asset> {
    await sleep(LATENCY);
    const db = getDB();
    const a: Asset = {
      id: `a-${Math.random().toString(36).slice(2, 8)}`,
      name: input.name ?? "New Asset",
      category: input.category ?? "vehicle",
      model: input.model ?? "Unspecified",
      status: input.status ?? "operational",
      location: input.location ?? "Himalayan Frontier Post",
      condition: 100,
      lastMaintenanceDate: new Date().toISOString(),
      nextMaintenanceDate: new Date(Date.now() + 90 * 86400000).toISOString(),
    };
    saveSlice("assets", [a, ...db.assets]);
    return a;
  },
  async update(id: string, patch: Partial<Asset>): Promise<Asset> {
    await sleep(LATENCY);
    const db = getDB();
    const idx = db.assets.findIndex((a) => a.id === id);
    if (idx === -1) throw new ApiError("Asset not found", 404);
    const updated = { ...db.assets[idx], ...patch };
    const next = [...db.assets];
    next[idx] = updated;
    saveSlice("assets", next);
    return updated;
  },
  async remove(id: string): Promise<void> {
    await sleep(LATENCY);
    const db = getDB();
    saveSlice("assets", db.assets.filter((a) => a.id !== id));
  },
};

export const threatsApi = {
  async list(): Promise<ThreatReport[]> {
    await sleep(LATENCY);
    return [...getDB().threats].sort((a, b) => new Date(b.detectedAt).getTime() - new Date(a.detectedAt).getTime());
  },
  async create(input: Partial<ThreatReport>): Promise<ThreatReport> {
    await sleep(LATENCY);
    const db = getDB();
    const t: ThreatReport = {
      id: `t-${Math.random().toString(36).slice(2, 8)}`,
      title: input.title ?? "Untitled report",
      category: input.category ?? "cyber",
      severity: input.severity ?? "medium",
      region: input.region ?? "Himalayan Frontier Post",
      description: input.description ?? "",
      detectedAt: new Date().toISOString(),
      status: input.status ?? "active",
      aiConfidence: input.aiConfidence ?? 70,
      source: input.source ?? "Manual Entry",
      recommendation: input.recommendation,
    };
    saveSlice("threats", [t, ...db.threats]);
    return t;
  },
  async update(id: string, patch: Partial<ThreatReport>): Promise<ThreatReport> {
    await sleep(LATENCY);
    const db = getDB();
    const idx = db.threats.findIndex((t) => t.id === id);
    if (idx === -1) throw new ApiError("Threat report not found", 404);
    const updated = { ...db.threats[idx], ...patch };
    const next = [...db.threats];
    next[idx] = updated;
    saveSlice("threats", next);
    return updated;
  },
  async remove(id: string): Promise<void> {
    await sleep(LATENCY);
    const db = getDB();
    saveSlice("threats", db.threats.filter((t) => t.id !== id));
  },
};

export const notificationsApi = {
  async list(): Promise<NotificationItem[]> {
    await sleep(200);
    return [...getDB().notifications].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },
  async markRead(id: string): Promise<void> {
    const db = getDB();
    saveSlice("notifications", db.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)));
  },
  async markAllRead(): Promise<void> {
    const db = getDB();
    saveSlice("notifications", db.notifications.map((n) => ({ ...n, read: true })));
  },
  async create(input: { title: string; message: string; type: NotificationItem["type"]; severity?: NotificationItem["severity"] }): Promise<NotificationItem> {
    await sleep(200);
    const db = getDB();
    const notification: NotificationItem = {
      id: `n-${Math.random().toString(36).slice(2, 8)}`,
      title: input.title,
      message: input.message,
      type: input.type,
      severity: input.severity,
      read: false,
      createdAt: new Date().toISOString(),
    };
    saveSlice("notifications", [notification, ...db.notifications]);
    return notification;
  },
};

const AI_RESPONSES = [
  "Based on current sensor fusion, activity in the specified sector has remained within expected baselines over the past 24 hours, with one flagged anomaly under monitoring.",
  "Recommend prioritizing reconnaissance assets toward the northern approach — historical patterns show a 34% higher incidence of unregistered contact reports in that corridor during this period.",
  "Squad readiness across active missions is at 91%. Two personnel are flagged for rotation due to extended deployment windows.",
  "Threat correlation suggests the recent signal anomalies and drone incursion are linked. Recommend cross-referencing SIGINT timestamps with the Nightshade ISR flight log.",
  "Mission timeline analysis indicates Operation Iron Vigil is trending 2 days ahead of schedule. Consider reallocating freed logistics capacity to Operation Copper Falcon.",
];

/**
 * Resolves the email of whichever mock account is "signed in" right now, so
 * every AI Assistant read/write below can be scoped to that one account —
 * mirroring the real backend, where /chats is always filtered by the JWT's
 * userId and one user's conversations can never leak into another's list.
 */
function currentAccountEmail(): string {
  const db = getDB();
  return (db.currentSessionEmail ?? db.user.email).toLowerCase();
}

function assertOwnsConversation(convo: ChatConversation | undefined, email: string): asserts convo is ChatConversation {
  if (!convo || (convo.ownerEmail ?? "").toLowerCase() !== email) {
    throw new ApiError("Conversation not found", 404);
  }
}

export const aiApi = {
  async listConversations(): Promise<ChatConversation[]> {
    await sleep(300);
    const email = currentAccountEmail();
    return [...getDB().conversations]
      .filter((c) => (c.ownerEmail ?? "").toLowerCase() === email)
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  },
  async createConversation(title: string): Promise<ChatConversation> {
    const db = getDB();
    const convo: ChatConversation = {
      id: `c-${Math.random().toString(36).slice(2, 8)}`,
      title,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messages: [],
      ownerEmail: currentAccountEmail(),
    };
    saveSlice("conversations", [convo, ...db.conversations]);
    return convo;
  },
  async renameConversation(id: string, title: string): Promise<ChatConversation> {
    await sleep(200);
    const db = getDB();
    const email = currentAccountEmail();
    const idx = db.conversations.findIndex((c) => c.id === id);
    assertOwnsConversation(db.conversations[idx], email);
    const next = [...db.conversations];
    next[idx] = { ...next[idx], title, updatedAt: new Date().toISOString() };
    saveSlice("conversations", next);
    return next[idx];
  },
  async sendMessage(conversationId: string, content: string): Promise<ChatMessage> {
    const db = getDB();
    const email = currentAccountEmail();
    const idx = db.conversations.findIndex((c) => c.id === conversationId);
    assertOwnsConversation(db.conversations[idx], email);
    const userMsg: ChatMessage = { id: `m-${Date.now()}`, role: "user", content, createdAt: new Date().toISOString() };
    const next = [...db.conversations];
    next[idx] = { ...next[idx], messages: [...next[idx].messages, userMsg], updatedAt: new Date().toISOString() };
    saveSlice("conversations", next);

    await sleep(900 + Math.random() * 600);

    const reply: ChatMessage = {
      id: `m-${Date.now() + 1}`,
      role: "assistant",
      content: AI_RESPONSES[Math.floor(Math.random() * AI_RESPONSES.length)],
      createdAt: new Date().toISOString(),
    };
    const db2 = getDB();
    const idx2 = db2.conversations.findIndex((c) => c.id === conversationId);
    const next2 = [...db2.conversations];
    next2[idx2] = { ...next2[idx2], messages: [...next2[idx2].messages, reply], updatedAt: new Date().toISOString() };
    saveSlice("conversations", next2);
    return reply;
  },
  async deleteConversation(id: string): Promise<void> {
    await sleep(200);
    const db = getDB();
    const email = currentAccountEmail();
    const target = db.conversations.find((c) => c.id === id);
    assertOwnsConversation(target, email);
    saveSlice("conversations", db.conversations.filter((c) => c.id !== id));
  },
};

export const auditApi = {
  async list() {
    await sleep(LATENCY);
    return [...getDB().auditLogs].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  },
  async activity(entityType: string, entityId: string) {
    await sleep(200);
    return getDB()
      .auditLogs.filter((l) => l.entityType === entityType && l.entityId === entityId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  },
};

function toCommentAuthor(u: User): CommentAuthor {
  return { id: u.id, name: u.name, avatarSeed: u.avatarSeed, role: u.role };
}

function currentCommentAuthor(): CommentAuthor {
  const db = getDB();
  const account = db.currentSessionEmail
    ? [db.user, db.soldierUser, ...db.registeredUsers].find((u) => u.email.toLowerCase() === db.currentSessionEmail!.toLowerCase())
    : db.user;
  return toCommentAuthor(account ?? db.user);
}

export const commentsApi = {
  async list(entityType: string, entityId: string): Promise<CommentItem[]> {
    await sleep(250);
    return getDB()
      .comments.filter((c) => c.entityType === entityType && c.entityId === entityId)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  },
  async create(entityType: CommentItem["entityType"], entityId: string, content: string): Promise<CommentItem> {
    await sleep(300);
    const db = getDB();
    const comment: CommentItem = {
      id: `cm-${Math.random().toString(36).slice(2, 9)}`,
      entityType,
      entityId,
      user: currentCommentAuthor(),
      content,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    saveSlice("comments", [...db.comments, comment]);
    saveSlice("auditLogs", [
      {
        id: `al-${Math.random().toString(36).slice(2, 9)}`,
        actor: comment.user.name,
        action: "Commented",
        target: `${entityType}:${entityId}`,
        entityType,
        entityId,
        timestamp: comment.createdAt,
        ip: "local",
        status: "success",
      },
      ...db.auditLogs,
    ]);
    return comment;
  },
  async update(id: string, content: string): Promise<CommentItem> {
    await sleep(250);
    const db = getDB();
    const idx = db.comments.findIndex((c) => c.id === id);
    if (idx === -1) throw new ApiError("Comment not found.", 404);
    const updated = { ...db.comments[idx], content, updatedAt: new Date().toISOString(), editedAt: new Date().toISOString() };
    const next = [...db.comments];
    next[idx] = updated;
    saveSlice("comments", next);
    return updated;
  },
  async remove(id: string): Promise<void> {
    await sleep(200);
    const db = getDB();
    saveSlice("comments", db.comments.filter((c) => c.id !== id));
  },
};

function withComputedStatus(item: InventoryItem): InventoryItem {
  const status = item.quantity === 0 ? "out_of_stock" : item.quantity <= item.reorderThreshold ? "low_stock" : "in_stock";
  return { ...item, status };
}

export const inventoryApi = {
  async list(): Promise<InventoryItem[]> {
    await sleep(LATENCY);
    return [...getDB().inventory].sort((a, b) => a.name.localeCompare(b.name));
  },
  async create(input: Partial<InventoryItem>): Promise<InventoryItem> {
    await sleep(LATENCY);
    const db = getDB();
    const item = withComputedStatus({
      id: `inv-${Math.random().toString(36).slice(2, 8)}`,
      name: input.name ?? "New Item",
      category: input.category ?? "tactical_gear",
      spec: input.spec ?? "",
      quantity: input.quantity ?? 0,
      reorderThreshold: input.reorderThreshold ?? 10,
      status: "in_stock",
      location: input.location ?? "Himalayan Frontier Post",
      unitCost: input.unitCost ?? 0,
      lastRestocked: new Date().toISOString(),
    });
    saveSlice("inventory", [item, ...db.inventory]);
    return item;
  },
  async update(id: string, patch: Partial<InventoryItem>): Promise<InventoryItem> {
    await sleep(LATENCY);
    const db = getDB();
    const idx = db.inventory.findIndex((i) => i.id === id);
    if (idx === -1) throw new ApiError("Inventory item not found", 404);
    const updated = withComputedStatus({ ...db.inventory[idx], ...patch });
    const next = [...db.inventory];
    next[idx] = updated;
    saveSlice("inventory", next);
    return updated;
  },
  async adjustStock(id: string, delta: number): Promise<InventoryItem> {
    await sleep(200);
    const db = getDB();
    const idx = db.inventory.findIndex((i) => i.id === id);
    if (idx === -1) throw new ApiError("Inventory item not found", 404);
    const quantity = Math.max(0, db.inventory[idx].quantity + delta);
    const updated = withComputedStatus({
      ...db.inventory[idx],
      quantity,
      lastRestocked: delta > 0 ? new Date().toISOString() : db.inventory[idx].lastRestocked,
    });
    const next = [...db.inventory];
    next[idx] = updated;
    saveSlice("inventory", next);
    return updated;
  },
  async remove(id: string): Promise<void> {
    await sleep(LATENCY);
    const db = getDB();
    saveSlice("inventory", db.inventory.filter((i) => i.id !== id));
  },
};

export const trainingApi = {
  async list(): Promise<TrainingProgram[]> {
    await sleep(LATENCY);
    return [...getDB().trainingPrograms].sort((a, b) => a.name.localeCompare(b.name));
  },
  async create(input: Partial<TrainingProgram>): Promise<TrainingProgram> {
    await sleep(LATENCY);
    const db = getDB();
    const program: TrainingProgram = {
      id: `trn-${Math.random().toString(36).slice(2, 8)}`,
      name: input.name ?? "New Program",
      category: input.category ?? "combat",
      description: input.description ?? "",
      durationHours: input.durationHours ?? 8,
      mandatory: input.mandatory ?? false,
      status: input.status ?? "upcoming",
      enrolledCount: input.enrolledCount ?? 0,
      completionRate: input.completionRate ?? 0,
      nextSessionDate: input.nextSessionDate ?? new Date().toISOString(),
    };
    saveSlice("trainingPrograms", [program, ...db.trainingPrograms]);
    return program;
  },
  async update(id: string, patch: Partial<TrainingProgram>): Promise<TrainingProgram> {
    await sleep(LATENCY);
    const db = getDB();
    const idx = db.trainingPrograms.findIndex((t) => t.id === id);
    if (idx === -1) throw new ApiError("Training program not found", 404);
    const updated = { ...db.trainingPrograms[idx], ...patch };
    const next = [...db.trainingPrograms];
    next[idx] = updated;
    saveSlice("trainingPrograms", next);
    return updated;
  },
  async remove(id: string): Promise<void> {
    await sleep(LATENCY);
    const db = getDB();
    saveSlice("trainingPrograms", db.trainingPrograms.filter((t) => t.id !== id));
  },
};
