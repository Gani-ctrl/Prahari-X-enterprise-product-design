import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { requireAuth, requireRole, type AuthedRequest } from "../middleware/auth.js";
import { ApiError } from "../middleware/errorHandler.js";
import { COMMAND_ROLES } from "../lib/roles.js";

// ----------------------------------------------------------------------------
// Squads — standing units a Commander organizes personnel into, each with an
// optional designated team leader. Distinct from the ad-hoc per-mission
// PersonnelOnMission roster (kept for backward compatibility); a Squad can
// be assigned to a mission, patrol route, or shift as a single group.
// ----------------------------------------------------------------------------
export const squadsRouter = Router();
squadsRouter.use(requireAuth);

const squadInclude = {
  leader: { select: { id: true, name: true, rank: true, avatarSeed: true } },
  createdBy: { select: { id: true, name: true } },
  members: { include: { personnel: { select: { id: true, name: true, rank: true, unit: true, avatarSeed: true, status: true } } } },
};

squadsRouter.get("/", async (_req, res, next) => {
  try {
    const squads = await prisma.squad.findMany({ include: squadInclude, orderBy: { createdAt: "desc" } });
    res.json(squads);
  } catch (err) {
    next(err);
  }
});

// GET /squads/me — the signed-in Soldier's own squad(s).
squadsRouter.get("/me", async (req: AuthedRequest, res, next) => {
  try {
    const account = await prisma.user.findUnique({ where: { id: req.user!.id } });
    if (!account?.personnelId) throw new ApiError("This account is not linked to a personnel record.", 404);
    const squads = await prisma.squad.findMany({
      where: { members: { some: { personnelId: account.personnelId } } },
      include: squadInclude,
    });
    res.json(squads);
  } catch (err) {
    next(err);
  }
});

const createSchema = z.object({
  name: z.string().min(2),
  unit: z.string().min(2),
  leaderId: z.string().optional(),
  memberIds: z.array(z.string()).optional(),
});

squadsRouter.post("/", requireRole(...COMMAND_ROLES), async (req: AuthedRequest, res, next) => {
  try {
    const { memberIds, ...values } = createSchema.parse(req.body);
    const squad = await prisma.squad.create({
      data: {
        ...values,
        createdById: req.user!.id,
        members: memberIds ? { create: memberIds.map((personnelId) => ({ personnelId })) } : undefined,
      },
      include: squadInclude,
    });
    await prisma.auditLog.create({
      data: { userId: req.user!.id, actor: req.user!.name, action: "Created squad", target: squad.name, entityType: "squad", entityId: squad.id, ip: req.ip ?? "unknown", status: "success" },
    });
    res.status(201).json(squad);
  } catch (err) {
    next(err);
  }
});

const updateSchema = z.object({
  name: z.string().min(2).optional(),
  unit: z.string().min(2).optional(),
  leaderId: z.string().nullable().optional(),
});

squadsRouter.put("/:id", requireRole(...COMMAND_ROLES), async (req: AuthedRequest, res, next) => {
  try {
    const values = updateSchema.parse(req.body);
    const squad = await prisma.squad.update({ where: { id: req.params.id }, data: values, include: squadInclude });
    await prisma.auditLog.create({
      data: { userId: req.user!.id, actor: req.user!.name, action: "Updated squad", target: squad.name, entityType: "squad", entityId: squad.id, ip: req.ip ?? "unknown", status: "success" },
    });
    res.json(squad);
  } catch (err) {
    next(err);
  }
});

const membersSchema = z.object({ memberIds: z.array(z.string()) });

// POST /squads/:id/members — bulk-replace squad membership.
squadsRouter.post("/:id/members", requireRole(...COMMAND_ROLES), async (req: AuthedRequest, res, next) => {
  try {
    const { memberIds } = membersSchema.parse(req.body);
    const squadId = req.params.id;
    await prisma.squadMember.deleteMany({ where: { squadId } });
    await prisma.squadMember.createMany({ data: memberIds.map((personnelId) => ({ squadId, personnelId })) });
    const squad = await prisma.squad.findUnique({ where: { id: squadId }, include: squadInclude });
    await prisma.auditLog.create({
      data: { userId: req.user!.id, actor: req.user!.name, action: "Updated squad members", target: squad?.name ?? squadId, entityType: "squad", entityId: squadId, ip: req.ip ?? "unknown", status: "success" },
    });
    res.json(squad);
  } catch (err) {
    next(err);
  }
});

squadsRouter.delete("/:id", requireRole(...COMMAND_ROLES), async (req: AuthedRequest, res, next) => {
  try {
    const squad = await prisma.squad.delete({ where: { id: req.params.id } });
    await prisma.auditLog.create({
      data: { userId: req.user!.id, actor: req.user!.name, action: "Deleted squad", target: squad.name, entityType: "squad", entityId: squad.id, ip: req.ip ?? "unknown", status: "success" },
    });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

// ----------------------------------------------------------------------------
// Patrol Routes — an ordered list of waypoints/checkpoints (RoutePoint,
// discriminated by `kind`) for a mission and/or squad.
// ----------------------------------------------------------------------------
export const patrolRoutesRouter = Router();
patrolRoutesRouter.use(requireAuth);

const patrolRouteInclude = {
  points: { orderBy: { sequence: "asc" as const } },
  mission: { select: { id: true, code: true, name: true } },
  squad: { select: { id: true, name: true } },
};

patrolRoutesRouter.get("/", async (req, res, next) => {
  try {
    const { missionId, squadId } = req.query as Record<string, string | undefined>;
    const routes = await prisma.patrolRoute.findMany({
      where: { ...(missionId ? { missionId } : {}), ...(squadId ? { squadId } : {}) },
      include: patrolRouteInclude,
      orderBy: { createdAt: "desc" },
    });
    res.json(routes);
  } catch (err) {
    next(err);
  }
});

const pointSchema = z.object({
  kind: z.enum(["waypoint", "checkpoint"]),
  sequence: z.number().int().min(0),
  label: z.string().min(1),
  location: z.string().min(1),
});

const createRouteSchema = z.object({
  name: z.string().min(2),
  region: z.string().min(1),
  missionId: z.string().optional(),
  squadId: z.string().optional(),
  points: z.array(pointSchema).default([]),
});

patrolRoutesRouter.post("/", requireRole(...COMMAND_ROLES), async (req: AuthedRequest, res, next) => {
  try {
    const { points, ...values } = createRouteSchema.parse(req.body);
    const route = await prisma.patrolRoute.create({
      data: { ...values, points: { create: points } },
      include: patrolRouteInclude,
    });
    await prisma.auditLog.create({
      data: { userId: req.user!.id, actor: req.user!.name, action: "Created patrol route", target: route.name, entityType: "patrol_route", entityId: route.id, ip: req.ip ?? "unknown", status: "success" },
    });
    res.status(201).json(route);
  } catch (err) {
    next(err);
  }
});

const updateRouteSchema = z.object({
  name: z.string().min(2).optional(),
  region: z.string().min(1).optional(),
  status: z.enum(["planned", "active", "completed"]).optional(),
});

patrolRoutesRouter.put("/:id", requireRole(...COMMAND_ROLES), async (req: AuthedRequest, res, next) => {
  try {
    const values = updateRouteSchema.parse(req.body);
    const route = await prisma.patrolRoute.update({ where: { id: req.params.id }, data: values, include: patrolRouteInclude });
    res.json(route);
  } catch (err) {
    next(err);
  }
});

const pointStatusSchema = z.object({ status: z.enum(["pending", "reached", "skipped"]) });

// PATCH /patrol-routes/points/:pointId — soldiers in the field can mark a
// waypoint/checkpoint as reached; visible immediately on the Commander's map.
patrolRoutesRouter.patch("/points/:pointId", async (req: AuthedRequest, res, next) => {
  try {
    const { status } = pointStatusSchema.parse(req.body);
    const point = await prisma.routePoint.update({
      where: { id: req.params.pointId },
      data: { status, reachedAt: status === "reached" ? new Date() : null },
    });
    res.json(point);
  } catch (err) {
    next(err);
  }
});

patrolRoutesRouter.delete("/:id", requireRole(...COMMAND_ROLES), async (req: AuthedRequest, res, next) => {
  try {
    await prisma.patrolRoute.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});
