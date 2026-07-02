import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { requireAuth, type AuthedRequest } from "../middleware/auth.js";
import { ApiError } from "../middleware/errorHandler.js";

export const personnelRouter = Router();
personnelRouter.use(requireAuth);

// GET /personnel/me — resolves the signed-in soldier's own roster record.
// Must be registered before "/:id" so Express doesn't treat "me" as an id.
personnelRouter.get("/me", async (req: AuthedRequest, res, next) => {
  try {
    const account = await prisma.user.findUnique({ where: { id: req.user!.id } });
    if (!account?.personnelId) throw new ApiError("This account is not linked to a personnel record.", 404);
    const personnel = await prisma.personnel.findUnique({
      where: { id: account.personnelId },
      include: { missions: { include: { mission: true } } },
    });
    res.json(personnel);
  } catch (err) {
    next(err);
  }
});

// GET /personnel
personnelRouter.get("/", async (_req, res, next) => {
  try {
    const personnel = await prisma.personnel.findMany({
      orderBy: { name: "asc" },
      include: { missions: { orderBy: { assignedAt: "desc" }, take: 1 } },
    });
    res.json(personnel);
  } catch (err) {
    next(err);
  }
});

// GET /personnel/:id — includes mission history for the profile drawer
personnelRouter.get("/:id", async (req, res, next) => {
  try {
    const personnel = await prisma.personnel.findUnique({
      where: { id: req.params.id },
      include: { missions: { include: { mission: true } } },
    });
    res.json(personnel);
  } catch (err) {
    next(err);
  }
});

const createSchema = z.object({
  name: z.string().min(2),
  rank: z.string().min(2),
  roleTitle: z.string().min(2),
  unit: z.string().min(2),
  status: z.enum(["available", "deployed", "leave", "medical"]).default("available"),
  email: z.string().email(),
  phone: z.string().min(6),
  location: z.string().optional(),
  performanceScore: z.number().min(0).max(100).optional(),
  certifications: z.array(z.string()).optional(),
});

// Generic over the caller's exact schema shape (rather than fixed to
// `createSchema`) so this compiles correctly for BOTH call sites below:
// the POST handler passes a full `createSchema` result (required fields
// stay required), while the PUT handler passes a `updateSchema` result
// (every field, including these, is optional via `.partial()`). Pinning
// the parameter to `z.infer<typeof createSchema>` made the PUT call site
// pass a type where those same fields are `string | undefined` where
// `string` was required — this generic preserves whatever
// optional/required shape the caller actually has instead.
function toPersonnelData<T extends { certifications?: string[] }>(values: T) {
  const { certifications, ...rest } = values;
  return {
    ...rest,
    ...(certifications ? { certifications: JSON.stringify(certifications) } : {}),
  };
}

// POST /personnel
personnelRouter.post("/", async (req: AuthedRequest, res, next) => {
  try {
    const values = createSchema.parse(req.body);
    const personnel = await prisma.personnel.create({
      data: { ...toPersonnelData(values), avatarSeed: `${values.name}-${Date.now()}` },
    });
    await prisma.auditLog.create({
      data: { userId: req.user!.id, actor: req.user!.name, action: "Created personnel record", target: personnel.name, entityType: "personnel", entityId: personnel.id, ip: req.ip ?? "unknown", status: "success" },
    });
    res.status(201).json(personnel);
  } catch (err) {
    next(err);
  }
});

const updateSchema = createSchema.partial().extend({
  healthScore: z.number().min(0).max(100).optional(),
  missionsCompleted: z.number().min(0).optional(),
});

// PUT /personnel/:id
personnelRouter.put("/:id", async (req: AuthedRequest, res, next) => {
  try {
    const values = updateSchema.parse(req.body);
    const personnel = await prisma.personnel.update({ where: { id: req.params.id }, data: toPersonnelData(values) });
    await prisma.auditLog.create({
      data: { userId: req.user!.id, actor: req.user!.name, action: "Updated personnel record", target: personnel.name, entityType: "personnel", entityId: personnel.id, ip: req.ip ?? "unknown", status: "success" },
    });
    res.json(personnel);
  } catch (err) {
    next(err);
  }
});

// DELETE /personnel/:id
personnelRouter.delete("/:id", async (req: AuthedRequest, res, next) => {
  try {
    const personnel = await prisma.personnel.delete({ where: { id: req.params.id } });
    await prisma.auditLog.create({
      data: { userId: req.user!.id, actor: req.user!.name, action: "Deleted personnel record", target: personnel.name, entityType: "personnel", entityId: personnel.id, ip: req.ip ?? "unknown", status: "success" },
    });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});
