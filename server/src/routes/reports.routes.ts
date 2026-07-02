import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { requireAuth, requireRole, type AuthedRequest } from "../middleware/auth.js";
import { ApiError } from "../middleware/errorHandler.js";
import { notifyCommanders, notifyPersonnel } from "../lib/notify.js";
import { COMMAND_ROLES } from "../lib/roles.js";

// Field Reports — everything a Soldier submits back to the Commander: daily
// reports, mission progress, equipment/weapon/ammo/vehicle status, medical
// requests, incident reports, emergency alerts, and mission completion.
export const reportsRouter = Router();
reportsRouter.use(requireAuth);

const reportInclude = {
  personnel: { select: { id: true, name: true, rank: true, unit: true, avatarSeed: true } },
  mission: { select: { id: true, code: true, name: true } },
  assignment: { select: { id: true, title: true, type: true } },
  reviewedBy: { select: { id: true, name: true } },
};

const TYPES = [
  "daily",
  "mission_progress",
  "equipment_condition",
  "weapon_status",
  "ammo_consumption",
  "vehicle_status",
  "medical_request",
  "incident",
  "emergency_alert",
  "mission_completion",
] as const;

const TYPE_LABELS: Record<(typeof TYPES)[number], string> = {
  daily: "Daily report",
  mission_progress: "Mission progress update",
  equipment_condition: "Equipment condition report",
  weapon_status: "Weapon status report",
  ammo_consumption: "Ammunition consumption report",
  vehicle_status: "Vehicle status report",
  medical_request: "Medical request",
  incident: "Incident report",
  emergency_alert: "Emergency alert",
  mission_completion: "Mission completion report",
};

async function resolveOwnPersonnelId(userId: string): Promise<string> {
  const account = await prisma.user.findUnique({ where: { id: userId } });
  if (!account?.personnelId) throw new ApiError("This account is not linked to a personnel record.", 404);
  return account.personnelId;
}

// GET /reports — Commander-only, full list for review. Optional filters:
// type, status, personnelId, missionId, severity.
reportsRouter.get("/", requireRole(...COMMAND_ROLES), async (req, res, next) => {
  try {
    const { type, status, personnelId, missionId, severity } = req.query as Record<string, string | undefined>;
    const reports = await prisma.fieldReport.findMany({
      where: {
        ...(type ? { type } : {}),
        ...(status ? { status } : {}),
        ...(personnelId ? { personnelId } : {}),
        ...(missionId ? { missionId } : {}),
        ...(severity ? { severity } : {}),
      },
      include: reportInclude,
      orderBy: { createdAt: "desc" },
    });
    res.json(reports);
  } catch (err) {
    next(err);
  }
});

// GET /reports/me — the signed-in Soldier's own submitted reports.
reportsRouter.get("/me", async (req: AuthedRequest, res, next) => {
  try {
    const personnelId = await resolveOwnPersonnelId(req.user!.id);
    const reports = await prisma.fieldReport.findMany({
      where: { personnelId },
      include: reportInclude,
      orderBy: { createdAt: "desc" },
    });
    res.json(reports);
  } catch (err) {
    next(err);
  }
});

const createSchema = z.object({
  type: z.enum(TYPES),
  title: z.string().min(2),
  content: z.string().min(1),
  severity: z.enum(["critical", "high", "medium", "low"]).optional(),
  attachmentUrl: z.string().optional(),
  missionId: z.string().optional(),
  assignmentId: z.string().optional(),
});

// POST /reports — a Soldier submits a report; every command-staff account is
// notified immediately so it shows up for review without a manual refresh.
reportsRouter.post("/", async (req: AuthedRequest, res, next) => {
  try {
    const values = createSchema.parse(req.body);
    const personnelId = await resolveOwnPersonnelId(req.user!.id);

    const report = await prisma.fieldReport.create({
      data: { ...values, personnelId },
      include: reportInclude,
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user!.id,
        actor: req.user!.name,
        action: `Submitted ${TYPE_LABELS[values.type].toLowerCase()}`,
        target: report.personnel.name,
        entityType: "report",
        entityId: report.id,
        ip: req.ip ?? "unknown",
        status: "success",
      },
    });

    const isUrgent = values.type === "emergency_alert" || values.type === "incident";
    await notifyCommanders({
      type: isUrgent ? "threat" : "personnel",
      title: TYPE_LABELS[values.type],
      message: `${report.personnel.name}: ${values.title}`,
      severity: values.severity ?? (isUrgent ? "high" : undefined),
    });

    res.status(201).json(report);
  } catch (err) {
    next(err);
  }
});

const statusSchema = z.object({ status: z.enum(["submitted", "acknowledged", "resolved"]) });

// PATCH /reports/:id/status — Commander acknowledges/resolves a report.
reportsRouter.patch("/:id/status", requireRole(...COMMAND_ROLES), async (req: AuthedRequest, res, next) => {
  try {
    const { status } = statusSchema.parse(req.body);
    const report = await prisma.fieldReport.update({
      where: { id: req.params.id },
      data: { status, reviewedById: req.user!.id, reviewedAt: new Date() },
      include: reportInclude,
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user!.id,
        actor: req.user!.name,
        action: `Marked report as ${status}`,
        target: report.personnel.name,
        entityType: "report",
        entityId: report.id,
        ip: req.ip ?? "unknown",
        status: "success",
      },
    });

    await notifyPersonnel(report.personnelId, {
      type: "personnel",
      title: "Report reviewed",
      message: `Your ${TYPE_LABELS[report.type as (typeof TYPES)[number]].toLowerCase()} was marked as ${status}.`,
    });

    res.json(report);
  } catch (err) {
    next(err);
  }
});
