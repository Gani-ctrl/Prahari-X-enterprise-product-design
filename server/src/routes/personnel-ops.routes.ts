import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { requireAuth, requireRole, type AuthedRequest } from "../middleware/auth.js";
import { ApiError } from "../middleware/errorHandler.js";
import { notifyCommanders, notifyPersonnel } from "../lib/notify.js";
import { COMMAND_ROLES } from "../lib/roles.js";

async function resolveOwnPersonnelId(userId: string): Promise<string> {
  const account = await prisma.user.findUnique({ where: { id: userId } });
  if (!account?.personnelId) throw new ApiError("This account is not linked to a personnel record.", 404);
  return account.personnelId;
}

// ----------------------------------------------------------------------------
// Shift Schedules — Commander assigns patrol/guard/rest/admin shifts to
// individual soldiers, optionally tied to a mission.
// ----------------------------------------------------------------------------
export const shiftsRouter = Router();
shiftsRouter.use(requireAuth);

const shiftInclude = {
  personnel: { select: { id: true, name: true, rank: true, avatarSeed: true } },
  mission: { select: { id: true, code: true, name: true } },
  assignedBy: { select: { id: true, name: true } },
};

shiftsRouter.get("/", requireRole(...COMMAND_ROLES), async (req, res, next) => {
  try {
    const { personnelId } = req.query as Record<string, string | undefined>;
    const shifts = await prisma.shiftSchedule.findMany({
      where: personnelId ? { personnelId } : {},
      include: shiftInclude,
      orderBy: { shiftDate: "desc" },
    });
    res.json(shifts);
  } catch (err) {
    next(err);
  }
});

shiftsRouter.get("/me", async (req: AuthedRequest, res, next) => {
  try {
    const personnelId = await resolveOwnPersonnelId(req.user!.id);
    const shifts = await prisma.shiftSchedule.findMany({
      where: { personnelId },
      include: shiftInclude,
      orderBy: { shiftDate: "desc" },
    });
    res.json(shifts);
  } catch (err) {
    next(err);
  }
});

const createShiftSchema = z.object({
  personnelId: z.string(),
  missionId: z.string().optional(),
  shiftDate: z.coerce.date(),
  startTime: z.string().min(1),
  endTime: z.string().min(1),
  type: z.enum(["patrol", "guard", "rest", "admin"]).default("patrol"),
});

shiftsRouter.post("/", requireRole(...COMMAND_ROLES), async (req: AuthedRequest, res, next) => {
  try {
    const values = createShiftSchema.parse(req.body);
    const shift = await prisma.shiftSchedule.create({
      data: { ...values, assignedById: req.user!.id },
      include: shiftInclude,
    });
    await notifyPersonnel(values.personnelId, {
      type: "personnel",
      title: "New shift scheduled",
      message: `${values.type} shift on ${new Date(values.shiftDate).toLocaleDateString()} (${values.startTime}-${values.endTime}).`,
    });
    res.status(201).json(shift);
  } catch (err) {
    next(err);
  }
});

shiftsRouter.delete("/:id", requireRole(...COMMAND_ROLES), async (req, res, next) => {
  try {
    await prisma.shiftSchedule.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

// ----------------------------------------------------------------------------
// Leave Requests — Soldier submits, Commander approves/rejects.
// ----------------------------------------------------------------------------
export const leaveRouter = Router();
leaveRouter.use(requireAuth);

const leaveInclude = {
  personnel: { select: { id: true, name: true, rank: true, avatarSeed: true } },
  reviewedBy: { select: { id: true, name: true } },
};

leaveRouter.get("/", requireRole(...COMMAND_ROLES), async (req, res, next) => {
  try {
    const { status } = req.query as Record<string, string | undefined>;
    const requests = await prisma.leaveRequest.findMany({
      where: status ? { status } : {},
      include: leaveInclude,
      orderBy: { createdAt: "desc" },
    });
    res.json(requests);
  } catch (err) {
    next(err);
  }
});

leaveRouter.get("/me", async (req: AuthedRequest, res, next) => {
  try {
    const personnelId = await resolveOwnPersonnelId(req.user!.id);
    const requests = await prisma.leaveRequest.findMany({
      where: { personnelId },
      include: leaveInclude,
      orderBy: { createdAt: "desc" },
    });
    res.json(requests);
  } catch (err) {
    next(err);
  }
});

const createLeaveSchema = z.object({
  reason: z.string().min(2),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
});

leaveRouter.post("/", async (req: AuthedRequest, res, next) => {
  try {
    const values = createLeaveSchema.parse(req.body);
    const personnelId = await resolveOwnPersonnelId(req.user!.id);
    const request = await prisma.leaveRequest.create({ data: { ...values, personnelId }, include: leaveInclude });
    await notifyCommanders({
      type: "personnel",
      title: "Leave request submitted",
      message: `${request.personnel.name} requested leave: ${values.reason}`,
    });
    res.status(201).json(request);
  } catch (err) {
    next(err);
  }
});

const decisionSchema = z.object({ status: z.enum(["approved", "rejected"]) });

leaveRouter.patch("/:id/decision", requireRole(...COMMAND_ROLES), async (req: AuthedRequest, res, next) => {
  try {
    const { status } = decisionSchema.parse(req.body);
    const request = await prisma.leaveRequest.update({
      where: { id: req.params.id },
      data: { status, reviewedById: req.user!.id, reviewedAt: new Date() },
      include: leaveInclude,
    });
    await notifyPersonnel(request.personnelId, {
      type: "personnel",
      title: `Leave request ${status}`,
      message: `Your leave request (${request.reason}) was ${status} by ${req.user!.name}.`,
    });
    res.json(request);
  } catch (err) {
    next(err);
  }
});

// ----------------------------------------------------------------------------
// Badges — Commander-awarded achievements shown on the Soldier profile.
// ----------------------------------------------------------------------------
export const badgesRouter = Router();
badgesRouter.use(requireAuth);

badgesRouter.get("/", requireRole(...COMMAND_ROLES), async (req, res, next) => {
  try {
    const { personnelId } = req.query as Record<string, string | undefined>;
    const badges = await prisma.badge.findMany({
      where: personnelId ? { personnelId } : {},
      include: { personnel: { select: { id: true, name: true } }, awardedBy: { select: { id: true, name: true } } },
      orderBy: { awardedAt: "desc" },
    });
    res.json(badges);
  } catch (err) {
    next(err);
  }
});

badgesRouter.get("/me", async (req: AuthedRequest, res, next) => {
  try {
    const personnelId = await resolveOwnPersonnelId(req.user!.id);
    const badges = await prisma.badge.findMany({ where: { personnelId }, orderBy: { awardedAt: "desc" } });
    res.json(badges);
  } catch (err) {
    next(err);
  }
});

const createBadgeSchema = z.object({
  personnelId: z.string(),
  title: z.string().min(2),
  description: z.string().min(1),
  icon: z.string().optional(),
});

badgesRouter.post("/", requireRole(...COMMAND_ROLES), async (req: AuthedRequest, res, next) => {
  try {
    const values = createBadgeSchema.parse(req.body);
    const badge = await prisma.badge.create({ data: { ...values, awardedById: req.user!.id } });
    await notifyPersonnel(values.personnelId, {
      type: "personnel",
      title: "Achievement unlocked",
      message: `You were awarded "${values.title}" by ${req.user!.name}.`,
    });
    res.status(201).json(badge);
  } catch (err) {
    next(err);
  }
});

badgesRouter.delete("/:id", requireRole(...COMMAND_ROLES), async (req, res, next) => {
  try {
    await prisma.badge.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

// ----------------------------------------------------------------------------
// Attendance — daily present/absent/leave/late marking per soldier.
// ----------------------------------------------------------------------------
export const attendanceRouter = Router();
attendanceRouter.use(requireAuth);

attendanceRouter.get("/", requireRole(...COMMAND_ROLES), async (req, res, next) => {
  try {
    const { personnelId } = req.query as Record<string, string | undefined>;
    const records = await prisma.attendance.findMany({
      where: personnelId ? { personnelId } : {},
      orderBy: { date: "desc" },
      take: 500,
    });
    res.json(records);
  } catch (err) {
    next(err);
  }
});

attendanceRouter.get("/me", async (req: AuthedRequest, res, next) => {
  try {
    const personnelId = await resolveOwnPersonnelId(req.user!.id);
    const records = await prisma.attendance.findMany({ where: { personnelId }, orderBy: { date: "desc" }, take: 90 });
    res.json(records);
  } catch (err) {
    next(err);
  }
});

const markSchema = z.object({
  personnelId: z.string(),
  date: z.coerce.date(),
  status: z.enum(["present", "absent", "leave", "late"]),
});

attendanceRouter.post("/", requireRole(...COMMAND_ROLES), async (req, res, next) => {
  try {
    const values = markSchema.parse(req.body);
    const record = await prisma.attendance.upsert({
      where: { personnelId_date: { personnelId: values.personnelId, date: values.date } },
      update: { status: values.status },
      create: values,
    });
    res.status(201).json(record);
  } catch (err) {
    next(err);
  }
});
