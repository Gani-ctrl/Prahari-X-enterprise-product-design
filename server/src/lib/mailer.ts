import nodemailer from "nodemailer";

// ----------------------------------------------------------------------------
// Thin mail abstraction. If SMTP_HOST is configured (via .env), real email is
// sent through nodemailer. Otherwise — the default for local development —
// the message is logged to the server console instead, so the full
// register -> verify -> login and forgot-password -> OTP -> reset flows can
// be exercised end-to-end without any real mail credentials.
//
// To go live: set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM in
// server/.env (see .env.example). No code changes needed — the very next
// sendMail() call will detect the configured host and switch to sending for
// real, with no console fallback.
// ----------------------------------------------------------------------------

interface MailInput {
  to: string;
  subject: string;
  html: string;
  text?: string;
  /**
   * Explicit values worth surfacing directly in the dev console fallback
   * (the raw verification link / OTP code), so they're always immediately
   * visible on their own line rather than something the developer has to
   * dig for inside the rendered email body.
   */
  devMeta?: { verifyUrl?: string; otp?: string };
}

let transporter: ReturnType<typeof nodemailer.createTransport> | null = null;
let cachedHost: string | null = null;

// Treats unset, empty, or whitespace-only SMTP_HOST as "not configured" —
// a bare `SMTP_HOST=` left uncommented in .env should fall back to the
// console logger exactly like a fully commented-out/missing value does.
function smtpConfiguredHost(): string | null {
  const host = process.env.SMTP_HOST?.trim();
  return host ? host : null;
}

/** Exposed so the server can print an unambiguous startup banner stating
 * which mail mode is active — makes it obvious if SMTP_HOST is unexpectedly
 * set (or unexpectedly unset) instead of discovering it only when an email
 * silently does or doesn't get logged. */
export function isSmtpConfigured(): boolean {
  return smtpConfiguredHost() !== null;
}

function getTransporter() {
  const host = smtpConfiguredHost();
  if (!host) return null;
  // Rebuild the transporter if the configured host changed (e.g. .env was
  // edited and the dev server picked up new env vars), instead of holding
  // onto a stale client from an earlier, differently-configured process.
  if (transporter && cachedHost === host) return transporter;
  cachedHost = host;
  transporter = nodemailer.createTransport({
    host,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: process.env.SMTP_SECURE === "true",
    auth: process.env.SMTP_USER
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
      : undefined,
  });
  return transporter;
}

function logToConsole(input: MailInput, reason: string) {
  console.log("\n──────────────────────────────────────────────");
  console.log(`[MAIL] ${reason} — printing instead of sending`);
  console.log(`To:      ${input.to}`);
  console.log(`Subject: ${input.subject}`);
  if (input.devMeta?.verifyUrl) console.log(`Verification link: ${input.devMeta.verifyUrl}`);
  if (input.devMeta?.otp) console.log(`OTP code: ${input.devMeta.otp}`);
  console.log(`Body:\n${input.text ?? input.html.replace(/<[^>]+>/g, " ")}`);
  console.log("──────────────────────────────────────────────\n");
}

export async function sendMail(input: MailInput): Promise<void> {
  const t = getTransporter();

  // No SMTP configured — the expected local-dev path. Always log, no
  // network attempt, no way for this branch to silently do nothing.
  if (!t) {
    logToConsole(input, "SMTP not configured");
    return;
  }

  try {
    await t.sendMail({
      from: process.env.SMTP_FROM ?? "PRAHARI X <no-reply@prahari-x.mil>",
      to: input.to,
      subject: input.subject,
      html: input.html,
      text: input.text,
    });
  } catch (err) {
    // SMTP is configured but the send itself failed (bad credentials, host
    // unreachable, etc). Don't let that fail the request silently or bury
    // the verification link/OTP the user actually needs — fall back to the
    // console so local testing still works, and surface the real error.
    console.error("[MAIL] SMTP send failed, falling back to console:", err instanceof Error ? err.message : err);
    logToConsole(input, "SMTP send failed");
  }
}

export function verificationEmailTemplate(name: string, verifyUrl: string) {
  return {
    subject: "Verify your PRAHARI X account",
    html: `<p>Hi ${name},</p><p>Confirm your email to activate your PRAHARI X command account:</p><p><a href="${verifyUrl}">${verifyUrl}</a></p><p>This link expires in 24 hours.</p>`,
    text: `Hi ${name},\n\nConfirm your email to activate your PRAHARI X command account:\n${verifyUrl}\n\nThis link expires in 24 hours.`,
    devMeta: { verifyUrl },
  };
}

export function otpEmailTemplate(name: string, otp: string) {
  return {
    subject: "Your PRAHARI X password reset code",
    html: `<p>Hi ${name},</p><p>Your one-time password reset code is:</p><p style="font-size:24px;font-weight:700;letter-spacing:4px;">${otp}</p><p>This code expires in 10 minutes. If you didn't request this, you can ignore this email.</p>`,
    text: `Hi ${name},\n\nYour one-time password reset code is: ${otp}\n\nThis code expires in 10 minutes. If you didn't request this, you can ignore this email.`,
    devMeta: { otp },
  };
}
