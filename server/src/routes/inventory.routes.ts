import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { requireAuth, type AuthedRequest } from "../middleware/auth.js";
import { ApiError } from "../middleware/errorHandler.js";

export const inventoryRouter = Router();
inventoryRouter.use(requireAuth);

function computeStatus(quantity: number, reorderThreshold: number): string {
  if (quantity === 0) return "out_of_stock";
  if (quantity <= reorderThreshold) return "low_stock";
  return "in_stock";
}

// GET /inventory
inventoryRouter.get("/", async (_req, res, next) => {
  try {
    const items = await prisma.inventoryItem.findMany({ orderBy: { name: "asc" } });
    res.json(items);
  } catch (err) {
    next(err);
  }
});

const createSchema = z.object({
  name: z.string().min(2),
  category: z.enum(["firearm", "ammunition", "tactical_gear", "vehicle", "drone"]),
  spec: z.string().min(1),
  quantity: z.coerce.number().min(0).default(0),
  reorderThreshold: z.coerce.number().min(0).default(10),
  location: z.string(),
  unitCost: z.coerce.number().min(0).default(0),
});

// POST /inventory
inventoryRouter.post("/", async (req: AuthedRequest, res, next) => {
  try {
    const values = createSchema.parse(req.body);
    const item = await prisma.inventoryItem.create({
      data: { ...values, status: computeStatus(values.quantity, values.reorderThreshold) },
    });
    await prisma.auditLog.create({
      data: { userId: req.user!.id, actor: req.user!.name, action: "Created inventory item", target: item.name, entityType: "inventory", entityId: item.id, ip: req.ip ?? "unknown", status: "success" },
    });
    res.status(201).json(item);
  } catch (err) {
    next(err);
  }
});

const updateSchema = createSchema.partial();

// PUT /inventory/:id
inventoryRouter.put("/:id", async (req: AuthedRequest, res, next) => {
  try {
    const values = updateSchema.parse(req.body);
    const existing = await prisma.inventoryItem.findUnique({ where: { id: req.params.id } });
    if (!existing) throw new ApiError("Inventory item not found.", 404);
    const quantity = values.quantity ?? existing.quantity;
    const reorderThreshold = values.reorderThreshold ?? existing.reorderThreshold;
    const item = await prisma.inventoryItem.update({
      where: { id: req.params.id },
      data: { ...values, status: computeStatus(quantity, reorderThreshold) },
    });
    await prisma.auditLog.create({
      data: { userId: req.user!.id, actor: req.user!.name, action: "Updated inventory item", target: item.name, entityType: "inventory", entityId: item.id, ip: req.ip ?? "unknown", status: "success" },
    });
    res.json(item);
  } catch (err) {
    next(err);
  }
});

const adjustSchema = z.object({ delta: z.coerce.number() });

// POST /inventory/:id/adjust
inventoryRouter.post("/:id/adjust", async (req: AuthedRequest, res, next) => {
  try {
    const { delta } = adjustSchema.parse(req.body);
    const existing = await prisma.inventoryItem.findUnique({ where: { id: req.params.id } });
    if (!existing) throw new ApiError("Inventory item not found.", 404);
    const quantity = Math.max(0, existing.quantity + delta);
    const item = await prisma.inventoryItem.update({
      where: { id: req.params.id },
      data: {
        quantity,
        status: computeStatus(quantity, existing.reorderThreshold),
        lastRestocked: delta > 0 ? new Date() : existing.lastRestocked,
      },
    });
    await prisma.auditLog.create({
      data: {
        userId: req.user!.id,
        actor: req.user!.name,
        action: delta > 0 ? `Restocked +${delta}` : `Issued ${Math.abs(delta)}`,
        target: item.name,
        entityType: "inventory",
        entityId: item.id,
        ip: req.ip ?? "unknown",
        status: "success",
      },
    });
    res.json(item);
  } catch (err) {
    next(err);
  }
});

// DELETE /inventory/:id
inventoryRouter.delete("/:id", async (req: AuthedRequest, res, next) => {
  try {
    const item = await prisma.inventoryItem.delete({ where: { id: req.params.id } });
    await prisma.auditLog.create({
      data: { userId: req.user!.id, actor: req.user!.name, action: "Deleted inventory item", target: item.name, entityType: "inventory", entityId: item.id, ip: req.ip ?? "unknown", status: "success" },
    });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});
