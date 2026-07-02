import { NavLink } from "react-router-dom";
import { motion } from "motion/react";
import {
  LayoutDashboard, Crosshair, Radar, Boxes, Users, Bot, Settings,
  ChevronsLeft, ShieldCheck, Swords, GraduationCap, Building2, Truck, Stethoscope, MapPinned, Command, ClipboardList,
  BarChart3, CheckSquare, Map,
} from "lucide-react";
import { useSidebarStore } from "@/store/sidebarStore";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/app/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/app/situation-room", label: "Situation Room", icon: Command },
  { to: "/app/operations-map", label: "Live Operations Map", icon: Map },
  { to: "/app/assignments", label: "Assignment Center", icon: ClipboardList },
  { to: "/app/squads", label: "Squads & Patrols", icon: Users },
  { to: "/app/approvals", label: "Approvals", icon: CheckSquare },
  { to: "/app/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/app/operations", label: "Operations", icon: Crosshair },
  { to: "/app/intelligence", label: "Intelligence", icon: Radar },
  { to: "/app/assets", label: "Assets", icon: Boxes },
  { to: "/app/weapons", label: "Weapons & Ammo", icon: Swords },
  { to: "/app/training", label: "Training & Readiness", icon: GraduationCap },
  { to: "/app/units", label: "Unit Management", icon: Building2 },
  { to: "/app/fleet", label: "Fleet & Logistics", icon: Truck },
  { to: "/app/medical-comms", label: "Medical & Comms", icon: Stethoscope },
  { to: "/app/base-emergency", label: "Base & Emergency", icon: MapPinned },
  { to: "/app/personnel", label: "Personnel", icon: Users },
  { to: "/app/ai-assistant", label: "AI Assistant", icon: Bot },
];

export function Sidebar() {
  const collapsed = useSidebarStore((s) => s.collapsed);
  const toggleCollapsed = useSidebarStore((s) => s.toggleCollapsed);
  const mobileOpen = useSidebarStore((s) => s.mobileOpen);
  const setMobileOpen = useSidebarStore((s) => s.setMobileOpen);

  return (
    <>
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden" onClick={() => setMobileOpen(false)} />
      )}
      <motion.aside
        animate={{ width: collapsed ? 76 : 248 }}
        transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex flex-col border-r border-[color:var(--color-border)] bg-[color:var(--color-surface)]",
          "lg:translate-x-0 transition-transform duration-300",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="flex h-16 items-center gap-2.5 border-b border-[color:var(--color-border)] px-5">
          <div className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[color:var(--color-sentinel-500)]">
            <ShieldCheck className="h-[18px] w-[18px] text-white" />
            <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-[color:var(--color-success-500)] ring-2 ring-[color:var(--color-surface)]" />
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <p className="whitespace-nowrap text-sm font-semibold tracking-tight text-[color:var(--color-ink-0)]">PRAHARI X</p>
              <p className="whitespace-nowrap text-[10px] uppercase tracking-wider text-[color:var(--color-ink-3)]">Command Platform</p>
            </div>
          )}
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                cn(
                  "group relative flex items-center gap-3 rounded-[var(--radius-sm)] px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "text-[color:var(--color-ink-0)]"
                    : "text-[color:var(--color-ink-3)] hover:bg-white/[0.04] hover:text-[color:var(--color-ink-1)]"
                )
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <motion.div
                      layoutId="sidebar-active"
                      className="absolute inset-0 rounded-[var(--radius-sm)] bg-[color:var(--color-sentinel-500)]/12 ring-1 ring-inset ring-[color:var(--color-sentinel-500)]/25"
                      transition={{ type: "spring", stiffness: 420, damping: 38 }}
                    />
                  )}
                  <item.icon className={cn("relative z-10 h-[18px] w-[18px] shrink-0", isActive && "text-[color:var(--color-sentinel-400)]")} />
                  {!collapsed && <span className="relative z-10 whitespace-nowrap">{item.label}</span>}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="space-y-1 border-t border-[color:var(--color-border)] px-3 py-4">
          <NavLink
            to="/app/settings"
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-[var(--radius-sm)] px-3 py-2.5 text-sm font-medium transition-colors",
                isActive ? "bg-white/[0.04] text-[color:var(--color-ink-0)]" : "text-[color:var(--color-ink-3)] hover:bg-white/[0.04] hover:text-[color:var(--color-ink-1)]"
              )
            }
          >
            <Settings className="h-[18px] w-[18px] shrink-0" />
            {!collapsed && <span>Settings</span>}
          </NavLink>
          <button
            onClick={toggleCollapsed}
            className="hidden w-full items-center gap-3 rounded-[var(--radius-sm)] px-3 py-2.5 text-sm font-medium text-[color:var(--color-ink-3)] transition-colors hover:bg-white/[0.04] hover:text-[color:var(--color-ink-1)] lg:flex"
          >
            <ChevronsLeft className={cn("h-[18px] w-[18px] shrink-0 transition-transform duration-300", collapsed && "rotate-180")} />
            {!collapsed && <span>Collapse</span>}
          </button>
        </div>
      </motion.aside>
    </>
  );
}
