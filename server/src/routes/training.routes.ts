import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { requireAuth, type AuthedRequest } from "../middleware/auth.js";

export const trainingRouter = Router();
trainingRouter.use(requireAuth);

// GET /training
trainingRouter.get("/", async (_req, res, next) => {
  try {
    const programs = await prisma.trainingProgram.findMany({ orderBy: { name: "asc" } });
    res.json(programs);
  } catch (err) {
    next(err);
  }
});

const createSchema = z.object({
  name: z.string().min(2),
  category: z.enum(["combat", "medical", "technical", "leadership", "survival"]),
  description: z.string().min(1),
  durationHours: z.coerce.number().min(1).default(8),
  mandatory: z.boolean().default(false),
  status: z.enum(["upcoming", "active", "completed", "archived"]).default("upcoming"),
  enrolledCount: z.coerce.number().min(0).default(0),
  completionRate: z.coerce.number().min(0).max(100).default(0),
  nextSessionDate: z.coerce.date().optional(),
});

// POST /training
trainingRouter.post("/", async (req: AuthedRequest, res, next) => {
  try {
    const values = createSchema.parse(req.body);
    const program = await prisma.trainingProgram.create({
      data: { ...values, nextSessionDate: values.nextSessionDate ?? new Date() },
    });
    await prisma.auditLog.create({
      data: { userId: req.user!.id, actor: req.user!.name, action: "Created training program", target: program.name, entityType: "training", entityId: program.id, ip: req.ip ?? "unknown", status: "success" },
    });
    res.status(201).json(program);
  } catch (err) {
    next(err);
  }
});

const updateSchema = createSchema.partial();

// PUT /training/:id
trainingRouter.put("/:id", async (req: AuthedRequest, res, next) => {
  try {
    const values = updateSchema.parse(req.body);
    const program = await prisma.trainingProgram.update({ where: { id: req.params.id }, data: values });
    await prisma.auditLog.create({
      data: { userId: req.user!.id, actor: req.user!.name, action: "Updated training program", target: program.name, entityType: "training", entityId: program.id, ip: req.ip ?? "unknown", status: "success" },
    });
    res.json(program);
  } catch (err) {
    next(err);
  }
});

// DELETE /training/:id
trainingRouter.delete("/:id", async (req: AuthedRequest, res, next) => {
  try {
    const program = await prisma.trainingProgram.delete({ where: { id: req.params.id } });
    await prisma.auditLog.create({
      data: { userId: req.user!.id, actor: req.user!.name, action: "Deleted training program", target: program.name, entityType: "training", entityId: program.id, ip: req.ip ?? "unknown", status: "success" },
    });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});
