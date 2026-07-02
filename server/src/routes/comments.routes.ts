import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { requireAuth, type AuthedRequest } from "../middleware/auth.js";
import { ApiError } from "../middleware/errorHandler.js";

export const commentsRouter = Router();
commentsRouter.use(requireAuth);

const ENTITY_TYPES = ["mission", "inventory", "asset", "threat", "training"] as const;

function toSafeUser(user: { id: string; name: string; avatarSeed: string; role: string }) {
  return { id: user.id, name: user.name, avatarSeed: user.avatarSeed, role: user.role };
}

// GET /comments?entityType=mission&entityId=abc123
commentsRouter.get("/", async (req, res, next) => {
  try {
    const { entityType, entityId } = req.query as { entityType?: string; entityId?: string };
    if (!entityType || !entityId) return res.json([]);
    const comments = await prisma.comment.findMany({
      where: { entityType, entityId },
      orderBy: { createdAt: "asc" },
      include: { user: { select: { id: true, name: true, avatarSeed: true, role: true } } },
    });
    res.json(comments.map((c) => ({ ...c, user: toSafeUser(c.user) })));
  } catch (err) {
    next(err);
  }
});

const createSchema = z.object({
  entityType: z.enum(ENTITY_TYPES),
  entityId: z.string().min(1),
  content: z.string().min(1).max(2000),
});

// POST /comments
commentsRouter.post("/", async (req: AuthedRequest, res, next) => {
  try {
    const values = createSchema.parse(req.body);
    const comment = await prisma.comment.create({
      data: { ...values, userId: req.user!.id },
      include: { user: { select: { id: true, name: true, avatarSeed: true, role: true } } },
    });
    await prisma.auditLog.create({
      data: {
        userId: req.user!.id,
        actor: comment.user.name,
        action: "Commented",
        target: `${values.entityType}:${values.entityId}`,
        entityType: values.entityType,
        entityId: values.entityId,
        ip: req.ip ?? "unknown",
        status: "success",
      },
    });
    res.status(201).json({ ...comment, user: toSafeUser(comment.user) });
  } catch (err) {
    next(err);
  }
});

const updateSchema = z.object({ content: z.string().min(1).max(2000) });

// PUT /comments/:id — author-only
commentsRouter.put("/:id", async (req: AuthedRequest, res, next) => {
  try {
    const { content } = updateSchema.parse(req.body);
    const existing = await prisma.comment.findUnique({ where: { id: req.params.id } });
    if (!existing) throw new ApiError("Comment not found.", 404);
    if (existing.userId !== req.user!.id) throw new ApiError("You can only edit your own comments.", 403);

    const comment = await prisma.comment.update({
      where: { id: req.params.id },
      data: { content, editedAt: new Date() },
      include: { user: { select: { id: true, name: true, avatarSeed: true, role: true } } },
    });
    res.json({ ...comment, user: toSafeUser(comment.user) });
  } catch (err) {
    next(err);
  }
});

// DELETE /comments/:id — author or commander
commentsRouter.delete("/:id", async (req: AuthedRequest, res, next) => {
  try {
    const existing = await prisma.comment.findUnique({ where: { id: req.params.id } });
    if (!existing) throw new ApiError("Comment not found.", 404);
    if (existing.userId !== req.user!.id && req.user!.role !== "commander") {
      throw new ApiError("You don't have permission to delete this comment.", 403);
    }
    await prisma.comment.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});
