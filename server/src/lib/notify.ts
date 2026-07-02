import { prisma } from "./prisma.js";
import { COMMAND_ROLES } from "./roles.js";

type NotifyInput = {
  type: "mission" | "threat" | "system" | "personnel";
  title: string;
  message: string;
  severity?: "critical" | "high" | "medium" | "low";
};

/** Creates a single notification row for one user. */
export async function notifyUser(userId: string, input: NotifyInput) {
  return prisma.notification.create({ data: { userId, ...input } });
}

/**
 * Notifies the soldier's own linked User account (if any) — used whenever a
 * Commander assigns/updates something for a specific Personnel record. Not
 * every Personnel row has a linked login (only ones created via Soldier
 * registration, or manually linked), so this is a no-op if there's none.
 */
export async function notifyPersonnel(personnelId: string, input: NotifyInput) {
  const account = await prisma.user.findUnique({ where: { personnelId } });
  if (!account) return null;
  return notifyUser(account.id, input);
}

/**
 * Notifies every command-staff account (Commander and the other
 * COMMAND_ROLES) — used whenever a Soldier submits something that needs
 * Commander review (a field report, leave request, emergency alert, etc).
 */
export async function notifyCommanders(input: NotifyInput) {
  const commanders = await prisma.user.findMany({ where: { role: { in: COMMAND_ROLES } }, select: { id: true } });
  await Promise.all(commanders.map((c) => notifyUser(c.id, input)));
}
