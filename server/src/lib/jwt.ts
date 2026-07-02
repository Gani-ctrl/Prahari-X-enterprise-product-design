import jwt from "jsonwebtoken";
import crypto from "node:crypto";

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET ?? "dev-access-secret";
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET ?? "dev-refresh-secret";
const ACCESS_TTL = process.env.JWT_ACCESS_TTL ?? "15m";
// "Remember me" -> long-lived refresh session; otherwise a short one that
// expires when the browser session would typically end.
const REFRESH_TTL_REMEMBER = process.env.JWT_REFRESH_TTL ?? "30d";
const REFRESH_TTL_SESSION = process.env.JWT_REFRESH_TTL_SHORT ?? "1d";

export interface AccessTokenPayload {
  sub: string;
  role: string;
  name: string;
}

export interface RefreshTokenPayload {
  sub: string;
  role: string;
  jti: string;
}

/** Short-lived token sent to the client and attached to every request. */
export function signAccessToken(payload: AccessTokenPayload) {
  return jwt.sign(payload, ACCESS_SECRET, { expiresIn: ACCESS_TTL });
}

/**
 * Long-lived token used only to mint new access tokens. Each one carries a
 * unique `jti` so the corresponding RefreshToken DB row can be looked up,
 * checked for revocation, and rotated on use.
 */
export function signRefreshToken(payload: { sub: string; role: string }, rememberMe: boolean) {
  const jti = crypto.randomUUID();
  const token = jwt.sign({ ...payload, jti }, REFRESH_SECRET, {
    expiresIn: rememberMe ? REFRESH_TTL_REMEMBER : REFRESH_TTL_SESSION,
  });
  return { token, jti };
}

export function refreshTtlMs(rememberMe: boolean): number {
  const ttl = rememberMe ? REFRESH_TTL_REMEMBER : REFRESH_TTL_SESSION;
  const match = /^(\d+)([smhd])$/.exec(ttl);
  if (!match) return 7 * 86400_000;
  const value = Number(match[1]);
  const unit = match[2];
  const multiplier = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 }[unit] ?? 86_400_000;
  return value * multiplier;
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  return jwt.verify(token, ACCESS_SECRET) as AccessTokenPayload;
}

export function verifyRefreshToken(token: string): RefreshTokenPayload {
  return jwt.verify(token, REFRESH_SECRET) as RefreshTokenPayload;
}

/** Hash a refresh token for storage — the raw token is never persisted. */
export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}
