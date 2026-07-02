import { http } from "./httpClient";
import {
  mapAsset,
  mapComment,
  mapConversation,
  mapInventoryItem,
  mapMission,
  mapNotification,
  mapPersonnel,
  mapThreat,
  mapTrainingProgram,
  mapUser,
} from "./mappers";
import type {
  Asset,
  Assignment,
  AssignmentType,
  AttendanceRecord,
  AttendanceStatus,
  Badge,
  ChatConversation,
  ChatMessage,
  CommentItem,
  DashboardStats,
  FieldReport,
  FieldReportStatus,
  FieldReportType,
  InventoryItem,
  LeaveRequest,
  LeaveStatus,
  Mission,
  MissionDocument,
  NotificationItem,
  PatrolRoute,
  PatrolRouteStatus,
  Personnel,
  Priority,
  RoutePoint,
  RoutePointStatus,
  ShiftSchedule,
  Squad,
  ThreatReport,
  TrainingProgram,
} from "@/types";

// ----------------------------------------------------------------------------
// Talks to the real Express + Prisma API in /server. Every export here has
// the exact same shape as services/mockApi.ts, so services/api.ts can switch
// between the two without any page needing to change.
// ----------------------------------------------------------------------------

export type Portal = "commander" | "soldier";

export const auth = {
  async login(email: string, password: string, rememberMe: boolean, portal: Portal) {
    const res = await http.post<{ user: any; accessToken: string; refreshToken: string }>(
      "/auth/login",
      { email, password, rememberMe, portal },
      { auth: false }
    );
    return { user: mapUser(res.user), accessToken: res.accessToken, refreshToken: res.refreshToken };
  },
  async register(name: string, email: string, password: string, portal: Portal) {
    return http.post<{ success: boolean; message: string; email: string }>(
      "/auth/register",
      { name, email, password, portal },
      { auth: false }
    );
  },
  async refresh(refreshToken: string) {
    const res = await http.post<{ user: any; accessToken: string; refreshToken: string }>(
      "/auth/refresh",
      { refreshToken },
      { auth: false }
    );
    return { user: mapUser(res.user), accessToken: res.accessToken, refreshToken: res.refreshToken };
  },
  async logout(refreshToken: string | null) {
    return http.post<{ success: boolean }>("/auth/logout", { refreshToken }, { auth: false });
  },
  async me() {
    const res = await http.get<{ user: any }>("/auth/me");
    return mapUser(res.user);
  },
  async updateProfile(patch: Partial<{ name: string; email: string; rank: string; unit: string; phone: string; avatarSeed: string; profileImageUrl: string }>) {
    const res = await http.put<{ user: any }>("/auth/me", patch);
    return mapUser(res.user);
  },
  async sessions() {
    return http.get<Array<{ id: string; userAgent: string | null; ip: string | null; rememberMe: boolean; createdAt: string; expiresAt: string }>>("/auth/sessions");
  },
  async revokeSession(id: string) {
    return http.post<{ success: boolean }>(`/auth/sessions/${id}/revoke`);
  },
  async loginHistory() {
    return http.get<Array<{ id: string; success: boolean; ip: string | null; userAgent: string | null; createdAt: string }>>("/auth/login-history");
  },
};

export const dashboard = {
  async stats(): Promise<DashboardStats> {
    return http.get<DashboardStats>("/dashboard");
  },
};

export const missionsApi = {
  async list(): Promise<Mission[]> {
    const raw = await http.get<any[]>("/missions");
    return raw.map(mapMission);
  },
  async get(id: string): Promise<Mission> {
    const raw = await http.get<any>(`/missions/${id}`);
    return mapMission(raw);
  },
  async create(input: Partial<Mission>): Promise<Mission> {
    const raw = await http.post<any>("/missions", input);
    return mapMission(raw);
  },
  async update(id: string, patch: Partial<Mission>): Promise<Mission> {
    // squadIds/equipmentIds/objectives are relational on the server — route
    // those through their dedicated endpoints instead of the plain PUT,
    // which only accepts scalar Mission columns.
    const { squadIds, equipmentIds, objectives, ...rest } = patch;
    let raw: any;
    if (Object.keys(rest).length > 0) {
      raw = await http.put<any>(`/missions/${id}`, rest);
    }
    if (squadIds || equipmentIds) {
      raw = await http.post<any>(`/missions/${id}/assign`, { personnelIds: squadIds, assetIds: equipmentIds });
    }
    if (objectives) {
      raw = await http.put<any>(`/missions/${id}/objectives`, { objectives });
    }
    return mapMission(raw ?? (await http.get<any>(`/missions/${id}`)));
  },
  async remove(id: string): Promise<void> {
    await http.delete(`/missions/${id}`);
  },
  async addLog(id: string, message: string, type: "info" | "action" | "alert" = "action") {
    await http.post(`/missions/${id}/logs`, { message, type });
    return this.get(id);
  },
};

export const personnelApi = {
  async list(): Promise<Personnel[]> {
    const raw = await http.get<any[]>("/personnel");
    return raw.map(mapPersonnel);
  },
  async create(input: Partial<Personnel>): Promise<Personnel> {
    const raw = await http.post<any>("/personnel", input);
    return mapPersonnel(raw);
  },
  async update(id: string, patch: Partial<Personnel>): Promise<Personnel> {
    const raw = await http.put<any>(`/personnel/${id}`, patch);
    return mapPersonnel(raw);
  },
  async remove(id: string): Promise<void> {
    await http.delete(`/personnel/${id}`);
  },
};

export const assetsApi = {
  async list(): Promise<Asset[]> {
    const raw = await http.get<any[]>("/assets");
    return raw.map(mapAsset);
  },
  async create(input: Partial<Asset>): Promise<Asset> {
    const raw = await http.post<any>("/assets", input);
    return mapAsset(raw);
  },
  async update(id: string, patch: Partial<Asset>): Promise<Asset> {
    if (patch.assignedMissionId) {
      const raw = await http.post<any>(`/assets/${id}/assign`, { missionId: patch.assignedMissionId });
      return mapAsset(raw);
    }
    const raw = await http.put<any>(`/assets/${id}`, patch);
    return mapAsset(raw);
  },
  async remove(id: string): Promise<void> {
    await http.delete(`/assets/${id}`);
  },
};

export const threatsApi = {
  async list(): Promise<ThreatReport[]> {
    const raw = await http.get<any[]>("/threats");
    return raw.map(mapThreat);
  },
  async create(input: Partial<ThreatReport>): Promise<ThreatReport> {
    const raw = await http.post<any>("/threats", input);
    return mapThreat(raw);
  },
  async update(id: string, patch: Partial<ThreatReport>): Promise<ThreatReport> {
    const raw = await http.put<any>(`/threats/${id}`, patch);
    return mapThreat(raw);
  },
  async remove(id: string): Promise<void> {
    await http.delete(`/threats/${id}`);
  },
};

export const notificationsApi = {
  async list(): Promise<NotificationItem[]> {
    const raw = await http.get<any[]>("/notifications");
    return raw.map(mapNotification);
  },
  async markRead(id: string): Promise<void> {
    await http.patch(`/notifications/${id}/read`);
  },
  async markAllRead(): Promise<void> {
    await http.post("/notifications/read-all");
  },
  async create(input: { title: string; message: string; type: NotificationItem["type"]; severity?: NotificationItem["severity"] }): Promise<NotificationItem> {
    const raw = await http.post<any>("/notifications", input);
    return mapNotification(raw);
  },
};

export const aiApi = {
  async listConversations(): Promise<ChatConversation[]> {
    const raw = await http.get<any[]>("/chats");
    return raw.map(mapConversation);
  },
  async createConversation(title: string): Promise<ChatConversation> {
    const raw = await http.post<any>("/chats", { title });
    return mapConversation(raw);
  },
  async renameConversation(id: string, title: string): Promise<ChatConversation> {
    const raw = await http.put<any>(`/chats/${id}`, { title });
    return mapConversation(raw);
  },
  async sendMessage(conversationId: string, content: string): Promise<ChatMessage> {
    const raw = await http.post<any>(`/chats/${conversationId}/messages`, { content });
    return { id: raw.id, role: raw.role, content: raw.content, createdAt: raw.createdAt };
  },
  async deleteConversation(id: string): Promise<void> {
    await http.delete(`/chats/${id}`);
  },
};

export const auditApi = {
  async list() {
    return http.get<any[]>("/audit-logs");
  },
  async activity(entityType: string, entityId: string) {
    return http.get<any[]>(`/audit-logs/activity?entityType=${encodeURIComponent(entityType)}&entityId=${encodeURIComponent(entityId)}`);
  },
};

export const commentsApi = {
  async list(entityType: string, entityId: string): Promise<CommentItem[]> {
    const raw = await http.get<any[]>(`/comments?entityType=${encodeURIComponent(entityType)}&entityId=${encodeURIComponent(entityId)}`);
    return raw.map(mapComment);
  },
  async create(entityType: CommentItem["entityType"], entityId: string, content: string): Promise<CommentItem> {
    const raw = await http.post<any>("/comments", { entityType, entityId, content });
    return mapComment(raw);
  },
  async update(id: string, content: string): Promise<CommentItem> {
    const raw = await http.put<any>(`/comments/${id}`, { content });
    return mapComment(raw);
  },
  async remove(id: string): Promise<void> {
    await http.delete(`/comments/${id}`);
  },
};

export const inventoryApi = {
  async list(): Promise<InventoryItem[]> {
    const raw = await http.get<any[]>("/inventory");
    return raw.map(mapInventoryItem);
  },
  async create(input: Partial<InventoryItem>): Promise<InventoryItem> {
    const raw = await http.post<any>("/inventory", input);
    return mapInventoryItem(raw);
  },
  async update(id: string, patch: Partial<InventoryItem>): Promise<InventoryItem> {
    const raw = await http.put<any>(`/inventory/${id}`, patch);
    return mapInventoryItem(raw);
  },
  async adjustStock(id: string, delta: number): Promise<InventoryItem> {
    const raw = await http.post<any>(`/inventory/${id}/adjust`, { delta });
    return mapInventoryItem(raw);
  },
  async remove(id: string): Promise<void> {
    await http.delete(`/inventory/${id}`);
  },
};

export const trainingApi = {
  async list(): Promise<TrainingProgram[]> {
    const raw = await http.get<any[]>("/training");
    return raw.map(mapTrainingProgram);
  },
  async create(input: Partial<TrainingProgram>): Promise<TrainingProgram> {
    const raw = await http.post<any>("/training", input);
    return mapTrainingProgram(raw);
  },
  async update(id: string, patch: Partial<TrainingProgram>): Promise<TrainingProgram> {
    const raw = await http.put<any>(`/training/${id}`, patch);
    return mapTrainingProgram(raw);
  },
  async remove(id: string): Promise<void> {
    await http.delete(`/training/${id}`);
  },
};

// ----------------------------------------------------------------------------
// Command & Control workflow — Commander-issued assignments, Squad/patrol
// structure, and Soldier-submitted field reports. These endpoints only exist
// against the real Express + Prisma API (see services/api.ts — hardwired,
// same as `auth`, rather than duplicated into mockApi.ts's localStorage
// simulation).
// ----------------------------------------------------------------------------

export const assignmentsApi = {
  async list(filters?: { personnelId?: string; type?: string; status?: string; missionId?: string }): Promise<Assignment[]> {
    const params = new URLSearchParams(filters as Record<string, string>).toString();
    return http.get<Assignment[]>(`/assignments${params ? `?${params}` : ""}`);
  },
  async mine(): Promise<Assignment[]> {
    return http.get<Assignment[]>("/assignments/me");
  },
  async create(input: {
    type: AssignmentType;
    title: string;
    description?: string;
    quantity?: number;
    priority?: Priority;
    dueDate?: string;
    personnelId: string;
    missionId?: string;
    assetId?: string;
    inventoryItemId?: string;
    trainingProgramId?: string;
  }): Promise<Assignment> {
    return http.post<Assignment>("/assignments", input);
  },
  async update(id: string, patch: Partial<Pick<Assignment, "title" | "description" | "quantity" | "priority" | "status" | "dueDate">>): Promise<Assignment> {
    return http.put<Assignment>(`/assignments/${id}`, patch);
  },
  async remove(id: string): Promise<void> {
    await http.delete(`/assignments/${id}`);
  },
};

export const reportsApi = {
  async list(filters?: { type?: string; status?: string; personnelId?: string; missionId?: string; severity?: string }): Promise<FieldReport[]> {
    const params = new URLSearchParams(filters as Record<string, string>).toString();
    return http.get<FieldReport[]>(`/reports${params ? `?${params}` : ""}`);
  },
  async mine(): Promise<FieldReport[]> {
    return http.get<FieldReport[]>("/reports/me");
  },
  async create(input: {
    type: FieldReportType;
    title: string;
    content: string;
    severity?: Priority;
    attachmentUrl?: string;
    missionId?: string;
    assignmentId?: string;
  }): Promise<FieldReport> {
    return http.post<FieldReport>("/reports", input);
  },
  async setStatus(id: string, status: FieldReportStatus): Promise<FieldReport> {
    return http.patch<FieldReport>(`/reports/${id}/status`, { status });
  },
};

export const squadsApi = {
  async list(): Promise<Squad[]> {
    return http.get<Squad[]>("/squads");
  },
  async mine(): Promise<Squad[]> {
    return http.get<Squad[]>("/squads/me");
  },
  async create(input: { name: string; unit: string; leaderId?: string; memberIds?: string[] }): Promise<Squad> {
    return http.post<Squad>("/squads", input);
  },
  async update(id: string, patch: { name?: string; unit?: string; leaderId?: string | null }): Promise<Squad> {
    return http.put<Squad>(`/squads/${id}`, patch);
  },
  async setMembers(id: string, memberIds: string[]): Promise<Squad> {
    return http.post<Squad>(`/squads/${id}/members`, { memberIds });
  },
  async remove(id: string): Promise<void> {
    await http.delete(`/squads/${id}`);
  },
};

export const patrolRoutesApi = {
  async list(filters?: { missionId?: string; squadId?: string }): Promise<PatrolRoute[]> {
    const params = new URLSearchParams(filters as Record<string, string>).toString();
    return http.get<PatrolRoute[]>(`/patrol-routes${params ? `?${params}` : ""}`);
  },
  async create(input: { name: string; region: string; missionId?: string; squadId?: string; points: Omit<RoutePoint, "id" | "status" | "reachedAt">[] }): Promise<PatrolRoute> {
    return http.post<PatrolRoute>("/patrol-routes", input);
  },
  async update(id: string, patch: { name?: string; region?: string; status?: PatrolRouteStatus }): Promise<PatrolRoute> {
    return http.put<PatrolRoute>(`/patrol-routes/${id}`, patch);
  },
  async setPointStatus(pointId: string, status: RoutePointStatus): Promise<RoutePoint> {
    return http.patch<RoutePoint>(`/patrol-routes/points/${pointId}`, { status });
  },
  async remove(id: string): Promise<void> {
    await http.delete(`/patrol-routes/${id}`);
  },
};

export const shiftsApi = {
  async list(personnelId?: string): Promise<ShiftSchedule[]> {
    return http.get<ShiftSchedule[]>(`/shifts${personnelId ? `?personnelId=${personnelId}` : ""}`);
  },
  async mine(): Promise<ShiftSchedule[]> {
    return http.get<ShiftSchedule[]>("/shifts/me");
  },
  async create(input: { personnelId: string; missionId?: string; shiftDate: string; startTime: string; endTime: string; type?: ShiftSchedule["type"] }): Promise<ShiftSchedule> {
    return http.post<ShiftSchedule>("/shifts", input);
  },
  async remove(id: string): Promise<void> {
    await http.delete(`/shifts/${id}`);
  },
};

export const leaveApi = {
  async list(status?: LeaveStatus): Promise<LeaveRequest[]> {
    return http.get<LeaveRequest[]>(`/leave${status ? `?status=${status}` : ""}`);
  },
  async mine(): Promise<LeaveRequest[]> {
    return http.get<LeaveRequest[]>("/leave/me");
  },
  async create(input: { reason: string; startDate: string; endDate: string }): Promise<LeaveRequest> {
    return http.post<LeaveRequest>("/leave", input);
  },
  async decide(id: string, status: "approved" | "rejected"): Promise<LeaveRequest> {
    return http.patch<LeaveRequest>(`/leave/${id}/decision`, { status });
  },
};

export const badgesApi = {
  async list(personnelId?: string): Promise<Badge[]> {
    return http.get<Badge[]>(`/badges${personnelId ? `?personnelId=${personnelId}` : ""}`);
  },
  async mine(): Promise<Badge[]> {
    return http.get<Badge[]>("/badges/me");
  },
  async create(input: { personnelId: string; title: string; description: string; icon?: string }): Promise<Badge> {
    return http.post<Badge>("/badges", input);
  },
  async remove(id: string): Promise<void> {
    await http.delete(`/badges/${id}`);
  },
};

export const attendanceApi = {
  async list(personnelId?: string): Promise<AttendanceRecord[]> {
    return http.get<AttendanceRecord[]>(`/attendance${personnelId ? `?personnelId=${personnelId}` : ""}`);
  },
  async mine(): Promise<AttendanceRecord[]> {
    return http.get<AttendanceRecord[]>("/attendance/me");
  },
  async mark(input: { personnelId: string; date: string; status: AttendanceStatus }): Promise<AttendanceRecord> {
    return http.post<AttendanceRecord>("/attendance", input);
  },
};

export const missionDocumentsApi = {
  async list(missionId: string): Promise<MissionDocument[]> {
    return http.get<MissionDocument[]>(`/missions/${missionId}/documents`);
  },
  async create(missionId: string, input: { type: MissionDocument["type"]; title: string; url: string }): Promise<MissionDocument> {
    return http.post<MissionDocument>(`/missions/${missionId}/documents`, input);
  },
  async remove(missionId: string, docId: string): Promise<void> {
    await http.delete(`/missions/${missionId}/documents/${docId}`);
  },
};
