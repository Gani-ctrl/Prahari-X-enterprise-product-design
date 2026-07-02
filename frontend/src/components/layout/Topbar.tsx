import { Menu, Search, Sun, Moon } from "lucide-react";
import { useSidebarStore } from "@/store/sidebarStore";
import { useThemeStore } from "@/store/themeStore";
import { NotificationsPanel } from "./NotificationsPanel";
import { ProfileMenu } from "./ProfileMenu";
import type { Crumb } from "@/components/ui/Breadcrumb";
import { Breadcrumb } from "@/components/ui/Breadcrumb";

export function Topbar({ crumbs }: { crumbs: Crumb[] }) {
  const setMobileOpen = useSidebarStore((s) => s.setMobileOpen);
  const setCommandPaletteOpen = useSidebarStore((s) => s.setCommandPaletteOpen);
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

      <button
        onClick={() => setCommandPaletteOpen(true)}
        className="ml-4 hidden flex-1 max-w-md items-center gap-2.5 rounded-[var(--radius-sm)] border border-[color:var(--color-border-strong)] bg-[color:var(--color-surface)] px-3.5 py-2 text-sm text-[color:var(--color-ink-3)] transition-colors hover:border-[color:var(--color-ink-4)] md:flex"
      >
        <Search className="h-4 w-4" />
        <span>Search missions, personnel, assets…</span>
        <kbd className="ml-auto rounded border border-[color:var(--color-border-strong)] px-1.5 py-0.5 text-[10px]">⌘K</kbd>
      </button>

      <div className="ml-auto flex items-center gap-1.5">
        <button
          onClick={() => setCommandPaletteOpen(true)}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-[color:var(--color-ink-2)] hover:bg-white/5 md:hidden"
          aria-label="Search"
        >
          <Search className="h-[18px] w-[18px]" />
        </button>
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
