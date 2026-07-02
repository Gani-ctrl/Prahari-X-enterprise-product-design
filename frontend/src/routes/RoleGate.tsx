import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import type { Role } from "@/types";
import { COMMAND_ROLES } from "@/types";

/**
 * Splits the authenticated app into two portals that never bleed into each
 * other: command staff (Commander and the other COMMAND_ROLES) land in
 * "/app", soldiers land in "/soldier". Visiting the wrong portal redirects
 * to your own — a soldier can't browse into "/app" by typing the URL, and
 * a commander landing on "/soldier" bounces back to their own dashboard.
 */
export function RoleGate({ allow }: { allow: Role[] }) {
  const user = useAuthStore((s) => s.user);
  if (!user) return <Navigate to="/auth/login" replace />;

  if (!allow.includes(user.role)) {
    const home = COMMAND_ROLES.includes(user.role) ? "/app/dashboard" : "/soldier/dashboard";
    return <Navigate to={home} replace />;
  }

  return <Outlet />;
}
