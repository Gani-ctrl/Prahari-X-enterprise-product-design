import { Outlet, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { SoldierSidebar } from "@/components/layout/SoldierSidebar";
import { SoldierTopbar } from "@/components/layout/SoldierTopbar";
import { Toaster } from "@/components/ui/Toaster";
import { TooltipProvider } from "@/components/ui/Tooltip";
import { PageTransition } from "@/components/motion/PageTransition";
import { useSidebarStore } from "@/store/sidebarStore";

const SECTION_LABELS: Record<string, string> = {
  dashboard: "Dashboard",
  missions: "My Missions",
  equipment: "My Equipment",
  training: "Training",
  comms: "Comms",
  profile: "My Profile",
};

export function SoldierLayout() {
  const location = useLocation();
  const setMobileOpen = useSidebarStore((s) => s.setMobileOpen);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname, setMobileOpen]);

  const segments = location.pathname.split("/").filter(Boolean);
  const section = segments[1] ?? "dashboard";
  const crumbs = [
    { label: "Soldier Portal", to: "/soldier/dashboard" },
    { label: SECTION_LABELS[section] ?? "Overview" },
  ];

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-tactical-soldier bg-grid">
        <SoldierSidebar />
        <div className="transition-[margin] duration-300 lg:ml-64">
          <SoldierTopbar crumbs={crumbs} />
          <main className="mx-auto max-w-[1400px] px-5 py-6 md:px-8">
            <PageTransition>
              <Outlet />
            </PageTransition>
          </main>
        </div>
        <Toaster />
      </div>
    </TooltipProvider>
  );
}
