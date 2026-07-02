import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { requireAuth, type AuthedRequest } from "../middleware/auth.js";
import { ApiError } from "../middleware/errorHandler.js";

export const missionsRouter = Router();
missionsRouter.use(requireAuth);

function generateCode() {
  const chars = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
  let out = "";
  for (let i = 0; i < 4; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return `MSN-${out}`;
}

const missionInclude = {
  commander: { select: { id: true, name: true } },
  objectives: true,
  logs: { orderBy: { timestamp: "desc" as const } },
  squad: { include: { personnel: true } },
  equipment: { include: { asset: true } },
  assignedSquad: { include: { leader: { select: { id: true, name: true } }, members: { include: { personnel: true } } } },
};

// GET /missions
missionsRouter.get("/", async (_req, res, next) => {
  try {
    const missions = await prisma.mission.findMany({ include: missionInclude, orderBy: { updatedAt: "desc" } });
    res.json(missions);
  } catch (err) {
    next(err);
  }
});

// GET /missions/:id
missionsRouter.get("/:id", async (req, res, next) => {
  try {
    const mission = await prisma.mission.findUnique({ where: { id: req.params.id }, include: missionInclude });
    if (!mission) throw new ApiError("Mission not found.", 404);
    res.json(mission);
  } catch (err) {
    next(err);
  }
});

const createSchema = z.object({
  name: z.string().min(3),
  description: z.string().min(1),
  region: z.string(),
  priority: z.enum(["critical", "high", "medium", "low"]).default("medium"),
  status: z.enum(["planning", "active", "paused", "completed", "aborted"]).default("planning"),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
});

// POST /missions
missionsRouter.post("/", async (req: AuthedRequest, res, next) => {
  try {
    const values = createSchema.parse(req.body);
    const mission = await prisma.mission.create({
      data: {
        ...values,
        code: generateCode(),
        commanderId: req.user!.id,
        logs: { create: { author: "System", message: "Mission created.", type: "info" } },
      },
      include: missionInclude,
    });

    // Every CRUD action should update related dashboard data (Page 30) —
    // dashboard stats are derived live from these tables, so no denormalized
    // counters need to be touched here.
    await prisma.auditLog.create({
      data: { userId: req.user!.id, actor: req.user!.name, action: "Created mission", target: mission.code, entityType: "mission", entityId: mission.id, ip: req.ip ?? "unknown", status: "success" },
    });

    res.status(201).json(mission);
  } catch (err) {
    next(err);
  }
});

const updateSchema = createSchema.partial().extend({
  progress: z.number().min(0).max(100).optional(),
});

// PUT /missions/:id
missionsRouter.put("/:id", async (req: AuthedRequest, res, next) => {
  try {
    const values = updateSchema.parse(req.body);
    const mission = await prisma.mission.update({
      where: { id: req.params.id },
      data: values,
      include: missionInclude,
    });
    await prisma.auditLog.create({
      data: { userId: req.user!.id, actor: req.user!.name, action: "Updated mission", target: mission.code, entityType: "mission", entityId: mission.id, ip: req.ip ?? "unknown", status: "success" },
    });
    res.json(mission);
  } catch (err) {
    next(err);
  }
});

// DELETE /missions/:id
missionsRouter.delete("/:id", async (req: AuthedRequest, res, next) => {
  try {
    const mission = await prisma.mission.delete({ where: { id: req.params.id } });
    await prisma.auditLog.create({
      data: { userId: req.user!.id, actor: req.user!.name, action: "Deleted mission", target: mission.code, entityType: "mission", entityId: mission.id, ip: req.ip ?? "unknown", status: "success" },
    });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

const logSchema = z.object({ message: z.string().min(1), type: z.enum(["info", "action", "alert"]).default("info") });

// POST /missions/:id/logs
missionsRouter.post("/:id/logs", async (req: AuthedRequest, res, next) => {
  try {
    const { message, type } = logSchema.parse(req.body);
    const log = await prisma.missionLog.create({
      data: { missionId: req.params.id, author: req.user!.id, message, type },
    });
    await prisma.mission.update({ where: { id: req.params.id }, data: { updatedAt: new Date() } });
    res.status(201).json(log);
  } catch (err) {
    next(err);
  }
});

const assignSchema = z.object({
  personnelIds: z.array(z.string()).optional(),
  assetIds: z.array(z.string()).optional(),
  squadId: z.string().nullable().optional(),
});

// POST /missions/:id/assign — bulk-set squad/equipment for a mission
missionsRouter.post("/:id/assign", async (req: AuthedRequest, res, next) => {
  try {
    const { personnelIds, assetIds, squadId } = assignSchema.parse(req.body);
    const missionId = req.params.id;

    if (personnelIds) {
      await prisma.personnelOnMission.deleteMany({ where: { missionId } });
      await prisma.personnelOnMission.createMany({
        data: personnelIds.map((personnelId) => ({ missionId, personnelId })),
      });
    }
    if (assetIds) {
      await prisma.assetAssignment.deleteMany({ where: { missionId } });
      await prisma.assetAssignment.createMany({
        data: assetIds.map((assetId) => ({ missionId, assetId })),
      });
    }
    if (squadId !== undefined) {
      await prisma.mission.update({ where: { id: missionId }, data: { assignedSquadId: squadId } });
    }

    const mission = await prisma.mission.findUnique({ where: { id: missionId }, include: missionInclude });
    await prisma.auditLog.create({
      data: { userId: req.user!.id, actor: req.user!.name, action: "Reassigned squad/equipment", target: mission?.code ?? missionId, entityType: "mission", entityId: missionId, ip: req.ip ?? "unknown", status: "success" },
    });
    res.json(mission);
  } catch (err) {
    next(err);
  }
});

// ----------------------------------------------------------------------------
// Mission documents — images, maps, PDF briefings (metadata + URL; see
// MissionDocument model comment for why there's no binary upload pipeline).
// ----------------------------------------------------------------------------
const documentSchema = z.object({
  type: z.enum(["image", "pdf", "map", "briefing"]),
  title: z.string().min(1),
  url: z.string().min(1),
});

missionsRouter.get("/:id/documents", async (req, res, next) => {
  try {
    const documents = await prisma.missionDocument.findMany({
      where: { missionId: req.params.id },
      include: { uploadedBy: { select: { id: true, name: true } } },
      orderBy: { createdAt: "desc" },
    });
    res.json(documents);
  } catch (err) {
    next(err);
  }
});

missionsRouter.post("/:id/documents", async (req: AuthedRequest, res, next) => {
  try {
    const values = documentSchema.parse(req.body);
    const document = await prisma.missionDocument.create({
      data: { ...values, missionId: req.params.id, uploadedById: req.user!.id },
      include: { uploadedBy: { select: { id: true, name: true } } },
    });
    await prisma.auditLog.create({
      data: { userId: req.user!.id, actor: req.user!.name, action: `Uploaded ${values.type}`, target: values.title, entityType: "mission", entityId: req.params.id, ip: req.ip ?? "unknown", status: "success" },
    });
    res.status(201).json(document);
  } catch (err) {
    next(err);
  }
});

missionsRouter.delete("/:id/documents/:docId", async (req: AuthedRequest, res, next) => {
  try {
    await prisma.missionDocument.delete({ where: { id: req.params.docId } });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

const objectivesSchema = z.object({
  objectives: z.array(
    z.object({
      id: z.string().optional(),
      title: z.string().min(1),
      description: z.string().default(""),
      status: z.enum(["pending", "in_progress", "complete"]),
      dueDate: z.coerce.date(),
    })
  ),
});

// PUT /missions/:id/objectives — replaces the full objective list for a
// mission (matches the "toggle complete" interaction in Mission Details).
missionsRouter.put("/:id/objectives", async (req: AuthedRequest, res, next) => {
  try {
    const { objectives } = objectivesSchema.parse(req.body);
    const missionId = req.params.id;

    await prisma.objective.deleteMany({ where: { missionId } });
    await prisma.objective.createMany({
      data: objectives.map((o) => ({
        missionId,
        title: o.title,
        description: o.description,
        status: o.status,
        dueDate: o.dueDate,
      })),
    });

    const mission = await prisma.mission.findUnique({ where: { id: missionId }, include: missionInclude });
    await prisma.auditLog.create({
      data: { userId: req.user!.id, actor: req.user!.name, action: "Updated objectives", target: mission?.code ?? missionId, entityType: "mission", entityId: missionId, ip: req.ip ?? "unknown", status: "success" },
    });
    res.json(mission);
  } catch (err) {
    next(err);
  }
});
