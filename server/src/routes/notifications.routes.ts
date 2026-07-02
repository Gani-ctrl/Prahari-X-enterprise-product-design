import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { requireAuth, type AuthedRequest } from "../middleware/auth.js";

export const notificationsRouter = Router();
notificationsRouter.use(requireAuth);

const createSchema = z.object({
  title: z.string().min(1),
  message: z.string().min(1),
  type: z.enum(["mission", "threat", "system", "personnel"]),
  severity: z.enum(["critical", "high", "medium", "low"]).optional(),
});

// POST /notifications — used by the Communication Center to broadcast a
// message; scoped to the signed-in user's own notification feed.
notificationsRouter.post("/", async (req: AuthedRequest, res, next) => {
  try {
    const values = createSchema.parse(req.body);
    const notification = await prisma.notification.create({
      data: { ...values, userId: req.user!.id },
    });
    res.status(201).json(notification);
  } catch (err) {
    next(err);
  }
});

// GET /notifications — scoped to the signed-in user
notificationsRouter.get("/", async (req: AuthedRequest, res, next) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.user!.id },
      orderBy: { createdAt: "desc" },
    });
    res.json(notifications);
  } catch (err) {
    next(err);
  }
});

// PATCH /notifications/:id/read
notificationsRouter.patch("/:id/read", async (req: AuthedRequest, res, next) => {
  try {
    const notification = await prisma.notification.update({
      where: { id: req.params.id },
      data: { read: true },
    });
    res.json(notification);
  } catch (err) {
    next(err);
  }
});

// POST /notifications/read-all
notificationsRouter.post("/read-all", async (req: AuthedRequest, res, next) => {
  try {
    await prisma.notification.updateMany({
      where: { userId: req.user!.id, read: false },
      data: { read: true },
    });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});
