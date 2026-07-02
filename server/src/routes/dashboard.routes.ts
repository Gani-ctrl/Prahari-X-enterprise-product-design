import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";

export const dashboardRouter = Router();
dashboardRouter.use(requireAuth);

// GET /dashboard — every widget is derived live from the source tables so
// CRUD actions elsewhere immediately reflect here (Page 30 requirement).
dashboardRouter.get("/", async (_req, res, next) => {
  try {
    const [activeMissions, totalPersonnel, deployedAssets, activeThreats, unreadNotifications, personnelByStatus] = await Promise.all([
      prisma.mission.count({ where: { status: "active" } }),
      prisma.personnel.count(),
      prisma.asset.count({ where: { status: "deployed" } }),
      prisma.threatReport.count({ where: { status: "active" } }),
      prisma.notification.count({ where: { read: false } }),
      prisma.personnel.groupBy({ by: ["status"], _count: { status: true } }),
    ]);

    // Command & Control roster breakdown (Page: Commander C2 dashboard).
    // The PersonnelStatus enum has 4 values; "active" and "offline" are
    // presented as friendlier umbrella labels over the same data rather than
    // adding new status values that nothing else in the app understands yet.
    const statusCount = (status: string) => personnelByStatus.find((p) => p.status === status)?._count.status ?? 0;
    const available = statusCount("available");
    const deployed = statusCount("deployed");
    const onLeave = statusCount("leave");
    const medical = statusCount("medical");
    const soldierStats = {
      total: totalPersonnel,
      active: available + deployed,
      deployed,
      available,
      injured: medical,
      offline: onLeave,
    };

    const since = new Date(Date.now() - 7 * 86400000);
    const [missionsCreated, threatsDetected] = await Promise.all([
      prisma.mission.findMany({ where: { createdAt: { gte: since } }, select: { createdAt: true } }),
      prisma.threatReport.findMany({ where: { detectedAt: { gte: since } }, select: { detectedAt: true } }),
    ]);

    function bucketByDay(dates: Date[]) {
      const days = Array.from({ length: 7 }).map((_, i) => {
        const d = new Date(Date.now() - (6 - i) * 86400000);
        d.setHours(0, 0, 0, 0);
        return d;
      });
      return days.map((day) => ({
        date: day.toISOString(),
        value: dates.filter((d) => new Date(d).toDateString() === day.toDateString()).length,
      }));
    }

    res.json({
      activeMissions,
      totalPersonnel,
      deployedAssets,
      activeThreats,
      pendingAlerts: unreadNotifications,
      missionTrend: bucketByDay(missionsCreated.map((m) => m.createdAt)),
      threatTrend: bucketByDay(threatsDetected.map((t) => t.detectedAt)),
      soldierStats,
    });
  } catch (err) {
    next(err);
  }
});
