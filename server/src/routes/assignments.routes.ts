import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { requireAuth, requireRole, type AuthedRequest } from "../middleware/auth.js";
import { ApiError } from "../middleware/errorHandler.js";
import { notifyPersonnel } from "../lib/notify.js";
import { COMMAND_ROLES } from "../lib/roles.js";

export const assignmentsRouter = Router();
assignmentsRouter.use(requireAuth);

const assignmentInclude = {
  personnel: { select: { id: true, name: true, rank: true, unit: true, avatarSeed: true } },
  mission: { select: { id: true, code: true, name: true } },
  asset: { select: { id: true, name: true, category: true, model: true } },
  inventoryItem: { select: { id: true, name: true, category: true, spec: true } },
  trainingProgram: { select: { id: true, name: true, category: true } },
  assignedBy: { select: { id: true, name: true } },
};

const TYPES = [
  "weapon",
  "ammunition",
  "equipment",
  "vehicle",
  "drone",
  "comms",
  "medical_kit",
  "protective_gear",
  "training",
  "task",
  "emergency",
] as const;

// GET /assignments — Commander-only, full list (Assignment Center).
// Optional filters: personnelId, type, status, missionId.
assignmentsRouter.get("/", requireRole(...COMMAND_ROLES), async (req, res, next) => {
  try {
    const { personnelId, type, status, missionId } = req.query as Record<string, string | undefined>;
    const assignments = await prisma.assignment.findMany({
      where: {
        ...(personnelId ? { personnelId } : {}),
        ...(type ? { type } : {}),
        ...(status ? { status } : {}),
        ...(missionId ? { missionId } : {}),
      },
      include: assignmentInclude,
      orderBy: { createdAt: "desc" },
    });
    res.json(assignments);
  } catch (err) {
    next(err);
  }
});

// GET /assignments/me — the signed-in Soldier's own assignments. Must be
// registered before "/:id" so Express doesn't treat "me" as an id.
assignmentsRouter.get("/me", async (req: AuthedRequest, res, next) => {
  try {
    const account = await prisma.user.findUnique({ where: { id: req.user!.id } });
    if (!account?.personnelId) throw new ApiError("This account is not linked to a personnel record.", 404);
    const assignments = await prisma.assignment.findMany({
      where: { personnelId: account.personnelId },
      include: assignmentInclude,
      orderBy: { createdAt: "desc" },
    });
    res.json(assignments);
  } catch (err) {
    next(err);
  }
});

const createSchema = z.object({
  type: z.enum(TYPES),
  title: z.string().min(2),
  description: z.string().optional(),
  quantity: z.number().int().min(0).optional(),
  priority: z.enum(["critical", "high", "medium", "low"]).default("medium"),
  dueDate: z.coerce.date().optional(),
  personnelId: z.string(),
  missionId: z.string().optional(),
  assetId: z.string().optional(),
  inventoryItemId: z.string().optional(),
  trainingProgramId: z.string().optional(),
});

// POST /assignments — Commander issues a new assignment to a Soldier.
// Immediately notifies that soldier's account (if they have one).
assignmentsRouter.post("/", requireRole(...COMMAND_ROLES), async (req: AuthedRequest, res, next) => {
  try {
    const values = createSchema.parse(req.body);
    const assignment = await prisma.assignment.create({
      data: { ...values, assignedById: req.user!.id },
      include: assignmentInclude,
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user!.id,
        actor: req.user!.name,
        action: `Assigned ${values.type.replace(/_/g, " ")}`,
        target: assignment.personnel.name,
        entityType: "assignment",
        entityId: assignment.id,
        ip: req.ip ?? "unknown",
        status: "success",
      },
    });

    await notifyPersonnel(values.personnelId, {
      type: "personnel",
      title: "New assignment",
      message: `${assignment.title} has been assigned to you by ${req.user!.name}.`,
    });

    res.status(201).json(assignment);
  } catch (err) {
    next(err);
  }
});

const updateSchema = z.object({
  title: z.string().min(2).optional(),
  description: z.string().optional(),
  quantity: z.number().int().min(0).optional(),
  priority: z.enum(["critical", "high", "medium", "low"]).optional(),
  status: z.enum(["active", "completed", "cancelled", "returned"]).optional(),
  dueDate: z.coerce.date().optional(),
});

// PUT /assignments/:id — edit, reassign status (complete/cancel/return).
assignmentsRouter.put("/:id", requireRole(...COMMAND_ROLES), async (req: AuthedRequest, res, next) => {
  try {
    const values = updateSchema.parse(req.body);
    const assignment = await prisma.assignment.update({
      where: { id: req.params.id },
      data: values,
      include: assignmentInclude,
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user!.id,
        actor: req.user!.name,
        action: values.status ? `Marked assignment as ${values.status}` : "Updated assignment",
        target: assignment.personnel.name,
        entityType: "assignment",
        entityId: assignment.id,
        ip: req.ip ?? "unknown",
        status: "success",
      },
    });

    if (values.status) {
      await notifyPersonnel(assignment.personnelId, {
        type: "personnel",
        title: "Assignment updated",
        message: `${assignment.title} was marked as ${values.status}.`,
      });
    }

    res.json(assignment);
  } catch (err) {
    next(err);
  }
});

// DELETE /assignments/:id — cancel/remove an assignment entirely.
assignmentsRouter.delete("/:id", requireRole(...COMMAND_ROLES), async (req: AuthedRequest, res, next) => {
  try {
    const assignment = await prisma.assignment.delete({ where: { id: req.params.id } });
    await prisma.auditLog.create({
      data: {
        userId: req.user!.id,
        actor: req.user!.name,
        action: "Deleted assignment",
        target: assignment.title,
        entityType: "assignment",
        entityId: assignment.id,
        ip: req.ip ?? "unknown",
        status: "success",
      },
    });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});
