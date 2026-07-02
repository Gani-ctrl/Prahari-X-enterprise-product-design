import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { requireAuth, type AuthedRequest } from "../middleware/auth.js";
import { ApiError } from "../middleware/errorHandler.js";

export const assetsRouter = Router();
assetsRouter.use(requireAuth);

// GET /assets
assetsRouter.get("/", async (_req, res, next) => {
  try {
    const assets = await prisma.asset.findMany({
      orderBy: { name: "asc" },
      include: { missions: { orderBy: { assignedAt: "desc" }, take: 1 } },
    });
    res.json(assets);
  } catch (err) {
    next(err);
  }
});

const createSchema = z.object({
  name: z.string().min(2),
  category: z.enum(["vehicle", "drone", "weapon", "medical", "satellite"]),
  model: z.string().min(1),
  status: z.enum(["operational", "maintenance", "deployed", "decommissioned"]).default("operational"),
  location: z.string(),
  nextMaintenanceDate: z.coerce.date().optional(),
});

// POST /assets
assetsRouter.post("/", async (req: AuthedRequest, res, next) => {
  try {
    const values = createSchema.parse(req.body);
    const asset = await prisma.asset.create({
      data: {
        ...values,
        nextMaintenanceDate: values.nextMaintenanceDate ?? new Date(Date.now() + 90 * 86400000),
      },
    });
    await prisma.auditLog.create({
      data: { userId: req.user!.id, actor: req.user!.name, action: "Created asset", target: asset.name, entityType: "asset", entityId: asset.id, ip: req.ip ?? "unknown", status: "success" },
    });
    res.status(201).json(asset);
  } catch (err) {
    next(err);
  }
});

const updateSchema = createSchema.partial().extend({
  condition: z.number().min(0).max(100).optional(),
});

// PUT /assets/:id
assetsRouter.put("/:id", async (req: AuthedRequest, res, next) => {
  try {
    const values = updateSchema.parse(req.body);
    const asset = await prisma.asset.update({ where: { id: req.params.id }, data: values });
    await prisma.auditLog.create({
      data: { userId: req.user!.id, actor: req.user!.name, action: "Updated asset", target: asset.name, entityType: "asset", entityId: asset.id, ip: req.ip ?? "unknown", status: "success" },
    });
    res.json(asset);
  } catch (err) {
    next(err);
  }
});

// DELETE /assets/:id
assetsRouter.delete("/:id", async (req: AuthedRequest, res, next) => {
  try {
    const asset = await prisma.asset.delete({ where: { id: req.params.id } });
    await prisma.auditLog.create({
      data: { userId: req.user!.id, actor: req.user!.name, action: "Deleted asset", target: asset.name, entityType: "asset", entityId: asset.id, ip: req.ip ?? "unknown", status: "success" },
    });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

const assignSchema = z.object({ missionId: z.string() });

// POST /assets/:id/assign
assetsRouter.post("/:id/assign", async (req: AuthedRequest, res, next) => {
  try {
    const { missionId } = assignSchema.parse(req.body);
    const asset = await prisma.asset.findUnique({ where: { id: req.params.id } });
    if (!asset) throw new ApiError("Asset not found.", 404);

    await prisma.assetAssignment.upsert({
      where: { missionId_assetId: { missionId, assetId: asset.id } },
      create: { missionId, assetId: asset.id },
      update: {},
    });
    const updated = await prisma.asset.update({
      where: { id: asset.id },
      data: { status: "deployed" },
      include: { missions: { orderBy: { assignedAt: "desc" }, take: 1 } },
    });
    await prisma.auditLog.create({
      data: { userId: req.user!.id, actor: req.user!.name, action: "Assigned to mission", target: asset.name, entityType: "asset", entityId: asset.id, ip: req.ip ?? "unknown", status: "success" },
    });
    res.json(updated);
  } catch (err) {
    next(err);
  }
});
