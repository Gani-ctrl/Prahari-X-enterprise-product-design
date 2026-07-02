import { Menu, Sun, Moon } from "lucide-react";
import { useSidebarStore } from "@/store/sidebarStore";
import { useThemeStore } from "@/store/themeStore";
import { NotificationsPanel } from "./NotificationsPanel";
import { ProfileMenu } from "./ProfileMenu";
import type { Crumb } from "@/components/ui/Breadcrumb";
import { Breadcrumb } from "@/components/ui/Breadcrumb";

export function SoldierTopbar({ crumbs }: { crumbs: Crumb[] }) {
  const setMobileOpen = useSidebarStore((s) => s.setMobileOpen);
  const theme = useThemeStore((s) => s.theme);
  const toggleTheme = useThemeStore((s) => s.toggle);

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-[color:var(--color-border)] bg-[color:var(--color-base)]/80 px-5 backdrop-blur-xl">
      <button
        onClick={() => setMobileOpen(true)}
        className="flex h-9 w-9 items-center justify-center rounded-lg text-[color:var(--color-ink-2)] hover:bg-white/5 lg:hidden"
        aria-label="Open menu"
      >
        <Menu className="h-[18px] w-[18px]" />
      </button>

      <Breadcrumb items={crumbs} />

      <div className="ml-auto flex items-center gap-1.5">
        <button
          onClick={toggleTheme}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-[color:var(--color-ink-2)] transition-colors hover:bg-white/5 hover:text-[color:var(--color-ink-0)]"
          aria-label="Toggle theme"
        >
          {theme === "dark" ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
        </button>
        <NotificationsPanel />
        <div className="mx-1 h-6 w-px bg-[color:var(--color-border)]" />
        <ProfileMenu />
      </div>
    </header>
  );
}
