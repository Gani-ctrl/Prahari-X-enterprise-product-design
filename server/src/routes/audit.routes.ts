import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";

export const auditRouter = Router();
auditRouter.use(requireAuth);

// GET /audit-logs (Page 15 — Settings > Audit Logs)
auditRouter.get("/", async (_req, res, next) => {
  try {
    const logs = await prisma.auditLog.findMany({ orderBy: { timestamp: "desc" }, take: 200 });
    res.json(logs);
  } catch (err) {
    next(err);
  }
});

// GET /audit-logs/activity?entityType=mission&entityId=abc123
// Per-record activity feed — the same table, filtered down to one entity, for
// the "Activity" tab on Missions, Weapons, Assets, Threats, and Training.
auditRouter.get("/activity", async (req, res, next) => {
  try {
    const { entityType, entityId } = req.query as { entityType?: string; entityId?: string };
    if (!entityType || !entityId) return res.json([]);
    const logs = await prisma.auditLog.findMany({
      where: { entityType, entityId },
      orderBy: { timestamp: "desc" },
      take: 100,
    });
    res.json(logs);
  } catch (err) {
    next(err);
  }
});
