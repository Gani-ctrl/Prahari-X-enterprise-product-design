import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { requireAuth, type AuthedRequest } from "../middleware/auth.js";

// Threat report CRUD + AI recommendations (Page 11 of the PRD). Not part of
// the minimal endpoint list in Page 18 but required by the Intelligence
// Center feature spec, so it's added here following the same conventions.
export const threatsRouter = Router();
threatsRouter.use(requireAuth);

threatsRouter.get("/", async (_req, res, next) => {
  try {
    res.json(await prisma.threatReport.findMany({ orderBy: { detectedAt: "desc" } }));
  } catch (err) {
    next(err);
  }
});

const createSchema = z.object({
  title: z.string().min(4),
  category: z.enum(["cyber", "drone", "satellite", "ground", "signal"]),
  severity: z.enum(["critical", "high", "medium", "low"]),
  region: z.string(),
  description: z.string().min(1),
  source: z.string().default("Manual Entry"),
});

threatsRouter.post("/", async (req: AuthedRequest, res, next) => {
  try {
    const values = createSchema.parse(req.body);
    const threat = await prisma.threatReport.create({
      data: { ...values, aiConfidence: 55 + Math.round(Math.random() * 40) },
    });
    await prisma.auditLog.create({
      data: { userId: req.user!.id, actor: req.user!.name, action: "Logged threat report", target: threat.title, entityType: "threat", entityId: threat.id, ip: req.ip ?? "unknown", status: "success" },
    });
    res.status(201).json(threat);
  } catch (err) {
    next(err);
  }
});

const updateSchema = createSchema.partial().extend({
  status: z.enum(["active", "monitoring", "neutralized"]).optional(),
  recommendation: z.string().optional(),
});

threatsRouter.put("/:id", async (req: AuthedRequest, res, next) => {
  try {
    const values = updateSchema.parse(req.body);
    const threat = await prisma.threatReport.update({ where: { id: req.params.id }, data: values });
    await prisma.auditLog.create({
      data: {
        userId: req.user!.id,
        actor: req.user!.name,
        action: values.status === "neutralized" ? "Neutralized threat" : "Updated threat report",
        target: threat.title,
        entityType: "threat",
        entityId: threat.id,
        ip: req.ip ?? "unknown",
        status: "success",
      },
    });
    res.json(threat);
  } catch (err) {
    next(err);
  }
});

threatsRouter.delete("/:id", async (req: AuthedRequest, res, next) => {
  try {
    const threat = await prisma.threatReport.delete({ where: { id: req.params.id } });
    await prisma.auditLog.create({
      data: { userId: req.user!.id, actor: req.user!.name, action: "Deleted threat report", target: threat.title, entityType: "threat", entityId: threat.id, ip: req.ip ?? "unknown", status: "success" },
    });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});
