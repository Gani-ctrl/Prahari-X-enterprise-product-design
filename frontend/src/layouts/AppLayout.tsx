import { Outlet, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { CommandPalette } from "@/components/ui/CommandPalette";
import { Toaster } from "@/components/ui/Toaster";
import { TooltipProvider } from "@/components/ui/Tooltip";
import { PageTransition } from "@/components/motion/PageTransition";
import { useSidebarStore } from "@/store/sidebarStore";
import { cn } from "@/lib/utils";

const SECTION_LABELS: Record<string, string> = {
  dashboard: "Dashboard",
  assignments: "Assignment Center",
  "operations-map": "Live Operations Map",
  squads: "Squads & Patrols",
  approvals: "Approvals",
  analytics: "Analytics",
  operations: "Operations",
  intelligence: "Intelligence Center",
  assets: "Assets",
  weapons: "Weapons & Ammunition",
  training: "Training & Readiness",
  units: "Unit Management",
  fleet: "Fleet & Logistics",
  "medical-comms": "Medical & Comms",
  "base-emergency": "Base & Emergency",
  "situation-room": "Situation Room",
  personnel: "Personnel",
  "ai-assistant": "AI Assistant",
  settings: "Settings",
};

export function AppLayout() {
  const location = useLocation();
  const collapsed = useSidebarStore((s) => s.collapsed);
  const setMobileOpen = useSidebarStore((s) => s.setMobileOpen);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname, setMobileOpen]);

  const segments = location.pathname.split("/").filter(Boolean);
  const section = segments[1] ?? "dashboard";
  const crumbs = [
    { label: "PRAHARI X", to: "/app/dashboard" },
    { label: SECTION_LABELS[section] ?? "Overview" },
  ];

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-[color:var(--color-base)] bg-grid">
        <Sidebar />
        <div className={cn("transition-[margin] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]", collapsed ? "lg:ml-[76px]" : "lg:ml-[248px]")}>
          <Topbar crumbs={crumbs} />
          <main className="mx-auto max-w-[1600px] px-5 py-6 md:px-8">
            <PageTransition>
              <Outlet />
            </PageTransition>
          </main>
        </div>
        <CommandPalette />
        <Toaster />
      </div>
    </TooltipProvider>
  );
}
