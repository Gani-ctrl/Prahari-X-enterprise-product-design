// Single source of truth for which User.role values are "command staff"
// (full console access) vs "soldier" (scoped to their own data). Shared by
// auth.routes.ts (portal-gated login/register) and every Command & Control
// route that needs to know "is this user a Commander?".
export const COMMAND_ROLES = [
  "commander",
  "intelligence_officer",
  "mission_planner",
  "logistics_officer",
  "administrator",
];

export function isCommandRole(role: string): boolean {
  return COMMAND_ROLES.includes(role);
}
