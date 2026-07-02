import crypto from "node:crypto";
import bcrypt from "bcryptjs";

/** URL-safe random token for email verification links. */
export function generateVerificationToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

/** 6-digit numeric OTP for password reset. */
export function generateOtp(): string {
  return crypto.randomInt(0, 1_000_000).toString().padStart(6, "0");
}

export async function hashSecret(value: string): Promise<string> {
  return bcrypt.hash(value, 10);
}

export async function compareSecret(value: string, hash: string): Promise<boolean> {
  return bcrypt.compare(value, hash);
}
