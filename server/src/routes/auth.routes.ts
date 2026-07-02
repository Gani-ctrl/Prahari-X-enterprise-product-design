import { Router } from "express";
import rateLimit from "express-rate-limit";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  hashToken,
  refreshTtlMs,
} from "../lib/jwt.js";
import { ApiError } from "../middleware/errorHandler.js";
import { requireAuth, type AuthedRequest } from "../middleware/auth.js";

export const authRouter = Router();

// Credential-guessing throttle for the three unauthenticated, security-
// sensitive endpoints (register/login/refresh). Keyed by client IP — this
// relies on `app.set("trust proxy", 1)` in index.ts to see the real
// client address behind Render's reverse proxy rather than one shared
// proxy IP for every user. 20 attempts / 15 minutes is generous enough
// that no legitimate user (including one who mistypes a password a few
// times) is ever affected, while still shutting down brute-force attempts.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many attempts. Please try again in a few minutes." },
});

// /refresh is called silently and automatically (httpClient.ts refreshes
// the access token in the background, and can do so from multiple open
// tabs), so it legitimately fires far more often per user than a login
// attempt — a much higher ceiling than authLimiter avoids ever throttling
// real usage while still bounding raw request volume against this
// unauthenticated endpoint.
const refreshLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many session refresh attempts. Please sign in again." },
});

// ----------------------------------------------------------------------------
// Simplified, submission-ready auth flow (email verification + OTP/forgot-
// password removed for now — see git history / EXPLAINER for the fuller
// production version to reintroduce later). Every account is created
// immediately usable; login is strictly split by portal so a Commander
// account can never authenticate on the Soldier portal and vice versa.
// ----------------------------------------------------------------------------

// Strips every sensitive/internal auth field before a User row is ever sent
// to the client. (Email verification and password-reset OTP fields were
// removed from the schema entirely — there is nothing else to strip.)
function toSafeUser<T extends { passwordHash: string; twoFactorSecret: string | null }>(user: T) {
  const { passwordHash: _pw, twoFactorSecret: _2fa, ...safe } = user;
  return safe;
}

// A Soldier account's "profile" is really two rows — the User (login) and
// its linked Personnel (roster) record. Every surface that reads a phone
// number reads it off Personnel, not User (there's no phone column on User),
// so every response that hands the client a user object folds the linked
// Personnel's phone/location on as extra, non-persisted fields. Commander
// accounts have no linked Personnel, so these are simply omitted for them.
async function withPersonnelFields(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { personnel: { select: { phone: true, location: true } } },
  });
  if (!user) return null;
  const { personnel, ...rest } = user;
  return { ...toSafeUser(rest), phone: personnel?.phone, location: personnel?.location };
}

async function issueSession(user: { id: string; role: string; name: string }, rememberMe: boolean, req: AuthedRequest) {
  const accessToken = signAccessToken({ sub: user.id, role: user.role, name: user.name });
  const { token: refreshToken } = signRefreshToken({ sub: user.id, role: user.role }, rememberMe);
  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      tokenHash: hashToken(refreshToken),
      rememberMe,
      userAgent: req.headers["user-agent"] ?? undefined,
      ip: req.ip ?? undefined,
      expiresAt: new Date(Date.now() + refreshTtlMs(rememberMe)),
    },
  });
  return { accessToken, refreshToken };
}

async function logAttempt(userId: string | null, success: boolean, req: AuthedRequest) {
  if (!userId) return;
  await prisma.loginHistory.create({
    data: { userId, success, ip: req.ip ?? undefined, userAgent: req.headers["user-agent"] ?? undefined },
  });
}

// ----------------------------------------------------------------------------
// POST /auth/register — self-registration for BOTH portals, disambiguated by
// the same `portal` field the login endpoint uses. The account is created
// fully active (no email verification step) and can sign in immediately.
//   - portal "soldier": also creates a linked Personnel roster record in the
//     same transaction, so the Soldier dashboard/profile has real data to
//     show immediately.
//   - portal "commander": creates a command-staff account directly (role
//     "commander"), with no Personnel link — commanders aren't roster
//     entries, they run the roster.
// ----------------------------------------------------------------------------
const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  portal: z.enum(["commander", "soldier"]),
});

authRouter.post("/register", authLimiter, async (req, res, next) => {
  try {
    const { name, email, password, portal } = registerSchema.parse(req.body);
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) throw new ApiError("An account with this email already exists.", 409, "ACCOUNT_EXISTS");

    const passwordHash = await bcrypt.hash(password, 12);

    const user =
      portal === "commander"
        ? await prisma.user.create({
            data: {
              name,
              email,
              passwordHash,
              role: "commander",
              avatarSeed: `${name}-${Date.now()}`,
              settings: { create: {} },
            },
          })
        : await prisma.$transaction(async (tx) => {
            const personnel = await tx.personnel.create({
              data: {
                name,
                rank: "Private",
                roleTitle: "Field Operative",
                unit: "Unassigned",
                email,
                phone: "",
                avatarSeed: `${name}-${Date.now()}`,
              },
            });
            return tx.user.create({
              data: {
                name,
                email,
                passwordHash,
                role: "soldier",
                rank: personnel.rank,
                unit: personnel.unit,
                avatarSeed: personnel.avatarSeed,
                personnelId: personnel.id,
                settings: { create: {} },
              },
            });
          });

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        actor: user.name,
        action: "Account created",
        target: portal === "commander" ? "Commander account" : "Soldier account",
        ip: req.ip ?? "unknown",
        status: "success",
      },
    });

    res.status(201).json({ success: true, message: "Account created successfully. You can now sign in.", email: user.email });
  } catch (err) {
    next(err);
  }
});

// ----------------------------------------------------------------------------
// POST /auth/login — strictly portal-scoped. `portal` must match the
// account's role family or the login is rejected even with a correct
// password, so a Soldier account can never authenticate on the Commander
// portal and a Commander account can never authenticate on the Soldier
// portal.
// ----------------------------------------------------------------------------
const COMMAND_ROLES = ["commander", "intelligence_officer", "mission_planner", "logistics_officer", "administrator"];

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  rememberMe: z.boolean().optional().default(false),
  portal: z.enum(["commander", "soldier"]),
});

authRouter.post("/login", authLimiter, async (req: AuthedRequest, res, next) => {
  try {
    const { email, password, rememberMe, portal } = loginSchema.parse(req.body);
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      throw new ApiError("Account not found.", 404, "ACCOUNT_NOT_FOUND");
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      await logAttempt(user.id, false, req);
      throw new ApiError("Invalid email or password.", 401, "INVALID_CREDENTIALS");
    }

    const isCommandAccount = COMMAND_ROLES.includes(user.role);
    if (portal === "soldier" && isCommandAccount) {
      await logAttempt(user.id, false, req);
      throw new ApiError("This is a Commander account. Please sign in through the Commander portal.", 403, "WRONG_PORTAL");
    }
    if (portal === "commander" && !isCommandAccount) {
      await logAttempt(user.id, false, req);
      throw new ApiError("This is a Soldier account. Please sign in through the Soldier portal.", 403, "WRONG_PORTAL");
    }

    await prisma.user.update({ where: { id: user.id }, data: { lastActiveAt: new Date() } });
    await logAttempt(user.id, true, req);
    await prisma.auditLog.create({
      data: { userId: user.id, actor: user.name, action: "Logged in", target: "Session", ip: req.ip ?? "unknown", status: "success" },
    });

    const { accessToken, refreshToken } = await issueSession(user, rememberMe, req);
    res.json({ user: await withPersonnelFields(user.id), accessToken, refreshToken });
  } catch (err) {
    next(err);
  }
});

// ----------------------------------------------------------------------------
// POST /auth/refresh — rotates the refresh token and mints a new access token.
// ----------------------------------------------------------------------------
const refreshSchema = z.object({ refreshToken: z.string().min(10) });

authRouter.post("/refresh", refreshLimiter, async (req: AuthedRequest, res, next) => {
  try {
    const { refreshToken } = refreshSchema.parse(req.body);

    let payload;
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch {
      throw new ApiError("Session expired. Please sign in again.", 401, "SESSION_EXPIRED");
    }

    const tokenHash = hashToken(refreshToken);
    const stored = await prisma.refreshToken.findUnique({ where: { tokenHash } });
    if (!stored || stored.revoked || stored.expiresAt < new Date()) {
      throw new ApiError("Session expired. Please sign in again.", 401, "SESSION_EXPIRED");
    }

    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user) throw new ApiError("Account no longer exists.", 401, "SESSION_EXPIRED");

    // Rotate: revoke the used token, issue a fresh pair.
    await prisma.refreshToken.update({ where: { id: stored.id }, data: { revoked: true } });
    const { accessToken, refreshToken: newRefreshToken } = await issueSession(user, stored.rememberMe, req);

    res.json({ user: await withPersonnelFields(user.id), accessToken, refreshToken: newRefreshToken });
  } catch (err) {
    next(err);
  }
});

// ----------------------------------------------------------------------------
// POST /auth/logout — revokes the refresh token so it can never be replayed.
// ----------------------------------------------------------------------------
const logoutSchema = z.object({ refreshToken: z.string().optional() });

authRouter.post("/logout", async (req, res, next) => {
  try {
    const { refreshToken } = logoutSchema.parse(req.body);
    if (refreshToken) {
      const tokenHash = hashToken(refreshToken);
      await prisma.refreshToken.updateMany({ where: { tokenHash }, data: { revoked: true } });
    }
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

// ----------------------------------------------------------------------------
// GET /auth/me — validates the access token and returns the fresh profile.
// Used by the client on boot to restore/verify a session before trusting it.
// ----------------------------------------------------------------------------
authRouter.get("/me", requireAuth, async (req: AuthedRequest, res, next) => {
  try {
    const user = await withPersonnelFields(req.user!.id);
    if (!user) throw new ApiError("Account no longer exists.", 401, "SESSION_EXPIRED");
    res.json({ user });
  } catch (err) {
    next(err);
  }
});

// ----------------------------------------------------------------------------
// PUT /auth/me — self-service profile edit, for both portals. Updates the
// User row and, when this account is linked to a Personnel roster record
// (every Soldier account), mirrors the overlapping fields (name, rank, unit,
// phone) onto Personnel in the same transaction. That mirroring is what
// makes a profile edit show up everywhere Personnel is read from — Personnel
// Management, Squad rosters, the Operations Map, Mission assignment lists —
// not just in the editing user's own navbar/session.
// ----------------------------------------------------------------------------
const updateProfileSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  rank: z.string().min(1).optional(),
  unit: z.string().min(1).optional(),
  phone: z.string().min(1).optional(),
  avatarSeed: z.string().min(1).optional(),
  profileImageUrl: z.string().url().optional().or(z.literal("")),
});

authRouter.put("/me", requireAuth, async (req: AuthedRequest, res, next) => {
  try {
    const values = updateProfileSchema.parse(req.body);
    const { phone, ...userFields } = values;

    if (userFields.email) {
      const existing = await prisma.user.findUnique({ where: { email: userFields.email } });
      if (existing && existing.id !== req.user!.id) {
        throw new ApiError("An account with this email already exists.", 409, "ACCOUNT_EXISTS");
      }
    }

    const current = await prisma.user.findUnique({ where: { id: req.user!.id } });
    if (!current) throw new ApiError("Account no longer exists.", 401, "SESSION_EXPIRED");

    await prisma.$transaction(async (tx) => {
      if (Object.keys(userFields).length > 0) {
        await tx.user.update({ where: { id: req.user!.id }, data: userFields });
      }
      // Mirror onto the linked Personnel roster record, if any, so every
      // page that reads Personnel (not User) sees the same update.
      if (current.personnelId) {
        const personnelPatch: Record<string, string> = {};
        if (userFields.name) personnelPatch.name = userFields.name;
        if (userFields.rank) personnelPatch.rank = userFields.rank;
        if (userFields.unit) personnelPatch.unit = userFields.unit;
        if (userFields.avatarSeed) personnelPatch.avatarSeed = userFields.avatarSeed;
        if (phone) personnelPatch.phone = phone;
        if (Object.keys(personnelPatch).length > 0) {
          await tx.personnel.update({ where: { id: current.personnelId }, data: personnelPatch });
        }
      }
    });

    await prisma.auditLog.create({
      data: { userId: req.user!.id, actor: current.name, action: "Updated profile", target: "Own account", ip: req.ip ?? "unknown", status: "success" },
    });

    res.json({ user: await withPersonnelFields(req.user!.id) });
  } catch (err) {
    next(err);
  }
});

// ----------------------------------------------------------------------------
// Session management — active sessions + login history (Settings > Security)
// ----------------------------------------------------------------------------
authRouter.get("/sessions", requireAuth, async (req: AuthedRequest, res, next) => {
  try {
    const sessions = await prisma.refreshToken.findMany({
      where: { userId: req.user!.id, revoked: false, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: "desc" },
      select: { id: true, userAgent: true, ip: true, rememberMe: true, createdAt: true, expiresAt: true },
    });
    res.json(sessions);
  } catch (err) {
    next(err);
  }
});

authRouter.post("/sessions/:id/revoke", requireAuth, async (req: AuthedRequest, res, next) => {
  try {
    await prisma.refreshToken.updateMany({
      where: { id: req.params.id, userId: req.user!.id },
      data: { revoked: true },
    });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

authRouter.get("/login-history", requireAuth, async (req: AuthedRequest, res, next) => {
  try {
    const history = await prisma.loginHistory.findMany({
      where: { userId: req.user!.id },
      orderBy: { createdAt: "desc" },
      take: 25,
    });
    res.json(history);
  } catch (err) {
    next(err);
  }
});
