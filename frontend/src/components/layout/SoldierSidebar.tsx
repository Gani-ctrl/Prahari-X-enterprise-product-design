import { NavLink } from "react-router-dom";
import { motion } from "motion/react";
import { LayoutDashboard, Crosshair, Boxes, UserCircle2, GraduationCap, Radio, ShieldHalf } from "lucide-react";
import { useSidebarStore } from "@/store/sidebarStore";
import { useAuthStore } from "@/store/authStore";
import { Avatar } from "@/components/ui/Avatar";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/soldier/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/soldier/missions", label: "My Missions", icon: Crosshair },
  { to: "/soldier/equipment", label: "My Equipment", icon: Boxes },
  { to: "/soldier/training", label: "Training", icon: GraduationCap },
  { to: "/soldier/comms", label: "Comms", icon: Radio },
];

export function SoldierSidebar() {
  const mobileOpen = useSidebarStore((s) => s.mobileOpen);
  const setMobileOpen = useSidebarStore((s) => s.setMobileOpen);
  const user = useAuthStore((s) => s.user);

  return (
    <>
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden" onClick={() => setMobileOpen(false)} />
      )}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-[color:var(--color-border)] bg-[color:var(--color-surface)]",
          "transition-transform duration-300 lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="flex h-16 items-center gap-2.5 border-b border-[color:var(--color-border)] px-5">
          <div className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[color:var(--color-amber-500)]">
            <ShieldHalf className="h-[18px] w-[18px] text-[#1a1002]" />
          </div>
          <div>
            <p className="text-sm font-semibold tracking-tight text-[color:var(--color-ink-0)]">PRAHARI X</p>
            <p className="text-[10px] uppercase tracking-wider text-[color:var(--color-amber-400)]">Soldier Portal</p>
          </div>
        </div>

        {user && (
          <div className="flex items-center gap-3 border-b border-[color:var(--color-border)] px-5 py-4">
            <Avatar seed={user.avatarSeed} name={user.name} size="md" />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-[color:var(--color-ink-0)]">{user.name}</p>
              <p className="truncate text-xs text-[color:var(--color-ink-3)]">{user.rank} · {user.unit}</p>
            </div>
          </div>
        )}

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                cn(
                  "group relative flex items-center gap-3 rounded-[var(--radius-sm)] px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive ? "text-[color:var(--color-ink-0)]" : "text-[color:var(--color-ink-3)] hover:bg-white/[0.04] hover:text-[color:var(--color-ink-1)]"
                )
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <motion.div
                      layoutId="soldier-sidebar-active"
                      className="absolute inset-0 rounded-[var(--radius-sm)] bg-[color:var(--color-amber-500)]/12 ring-1 ring-inset ring-[color:var(--color-amber-500)]/25"
                      transition={{ type: "spring", stiffness: 420, damping: 38 }}
                    />
                  )}
                  <item.icon className={cn("relative z-10 h-[18px] w-[18px] shrink-0", isActive && "text-[color:var(--color-amber-400)]")} />
                  <span className="relative z-10">{item.label}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-[color:var(--color-border)] px-3 py-4">
          <NavLink
            to="/soldier/profile"
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-[var(--radius-sm)] px-3 py-2.5 text-sm font-medium transition-colors",
                isActive ? "bg-white/[0.04] text-[color:var(--color-ink-0)]" : "text-[color:var(--color-ink-3)] hover:bg-white/[0.04] hover:text-[color:var(--color-ink-1)]"
              )
            }
          >
            <UserCircle2 className="h-[18px] w-[18px] shrink-0" />
            My Profile
          </NavLink>
        </div>
      </aside>
    </>
  );
}
