import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { motion } from "motion/react";
import { Bell, Radar, Crosshair, Users, Info, CheckCheck, type LucideIcon } from "lucide-react";
import { useEffect } from "react";
import { useNotificationStore } from "@/store/notificationStore";
import { usePolling } from "@/hooks/usePolling";
import { timeAgo, cn } from "@/lib/utils";
import type { NotificationType } from "@/types";

// `LucideIcon` (not the generic React `ElementType`) — `ElementType` is a
// union that also includes every JSX intrinsic tag name ("div", "svg",
// etc.), and indexing a `Record<K, ElementType>` then rendering the result
// as `<Icon />` makes TypeScript intersect the prop types of every possible
// union member to find what's safe to pass, which collapses to `never` for
// a set this heterogeneous. `LucideIcon` is the exact type lucide-react
// exports for its icon components, so this map only ever contains one
// concrete, renderable component shape.
const ICONS: Record<NotificationType, LucideIcon> = {
  threat: Radar,
  mission: Crosshair,
  personnel: Users,
  system: Info,
};

export function NotificationsPanel() {
  const { items, unreadCount, fetch, markRead, markAllRead } = useNotificationStore();

  useEffect(() => {
    fetch();
  }, [fetch]);

  // Refresh-based live sync — a new assignment, report, leave decision, or
  // emergency alert shows up in the bell without a manual reload. Used on
  // both the Commander topbar and the Soldier topbar (this component is
  // shared by both layouts).
  usePolling(fetch, 20_000);

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button className="relative flex h-9 w-9 items-center justify-center rounded-lg text-[color:var(--color-ink-2)] transition-colors hover:bg-white/5 hover:text-[color:var(--color-ink-0)]" aria-label="Notifications">
          <Bell className="h-[18px] w-[18px]" />
          {unreadCount > 0 && (
            <span className="absolute right-1.5 top-1.5 flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[color:var(--color-amber-500)] opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-[color:var(--color-amber-500)]" />
            </span>
          )}
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={10}
          asChild
        >
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.16 }}
            className="glass-strong z-50 w-96 overflow-hidden rounded-[var(--radius-lg)] shadow-[var(--shadow-float)]"
          >
            <div className="flex items-center justify-between border-b border-[color:var(--color-border)] px-4 py-3.5">
              <p className="text-sm font-semibold text-[color:var(--color-ink-0)]">Notifications</p>
              <button onClick={() => markAllRead()} className="flex items-center gap-1 text-xs text-[color:var(--color-ink-3)] hover:text-[color:var(--color-sentinel-400)]">
                <CheckCheck className="h-3.5 w-3.5" /> Mark all read
              </button>
            </div>
            <div className="max-h-96 overflow-y-auto">
              {items.length === 0 && <p className="px-4 py-8 text-center text-sm text-[color:var(--color-ink-3)]">You're all caught up.</p>}
              {items.map((n) => {
                const Icon = ICONS[n.type];
                return (
                  <button
                    key={n.id}
                    onClick={() => markRead(n.id)}
                    className={cn(
                      "flex w-full items-start gap-3 border-b border-[color:var(--color-border)] px-4 py-3 text-left transition-colors last:border-0 hover:bg-white/[0.03]",
                      !n.read && "bg-[color:var(--color-sentinel-500)]/[0.04]"
                    )}
                  >
                    <div className={cn(
                      "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                      n.severity === "critical" ? "bg-[color:var(--color-danger-500)]/15 text-[color:var(--color-danger-400)]" : "bg-[color:var(--color-surface-3)] text-[color:var(--color-ink-2)]"
                    )}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-medium text-[color:var(--color-ink-0)]">{n.title}</p>
                        {!n.read && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[color:var(--color-sentinel-500)]" />}
                      </div>
                      <p className="mt-0.5 line-clamp-2 text-xs text-[color:var(--color-ink-3)]">{n.message}</p>
                      <p className="mt-1 text-[10px] uppercase tracking-wide text-[color:var(--color-ink-4)]">{timeAgo(n.createdAt)}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </motion.div>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
