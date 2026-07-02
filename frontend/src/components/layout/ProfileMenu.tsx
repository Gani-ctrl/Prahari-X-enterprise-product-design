import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { motion } from "motion/react";
import { useNavigate } from "react-router-dom";
import { LogOut, Settings, User as UserIcon, ChevronDown } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { Avatar } from "@/components/ui/Avatar";
import { COMMAND_ROLES } from "@/types";

export function ProfileMenu() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();

  if (!user) return null;

  // Shared between the Commander topbar and the Soldier topbar — route each
  // account to its own settings/profile page and its own sign-in page, so
  // a soldier is never bounced into a Commander-only route.
  const isCommand = COMMAND_ROLES.includes(user.role);
  const settingsPath = isCommand ? "/app/settings" : "/soldier/profile";
  const loginPath = isCommand ? "/auth/login" : "/auth/soldier/login";

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button className="flex items-center gap-2 rounded-lg py-1 pl-1 pr-2 transition-colors hover:bg-white/5">
          <Avatar seed={user.avatarSeed} name={user.name} size="sm" />
          <div className="hidden text-left leading-tight md:block">
            <p className="text-xs font-medium text-[color:var(--color-ink-0)]">{user.name.split(" ").slice(-1)}</p>
            <p className="text-[10px] text-[color:var(--color-ink-3)]">{user.rank}</p>
          </div>
          <ChevronDown className="h-3.5 w-3.5 text-[color:var(--color-ink-3)]" />
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content align="end" sideOffset={10} asChild>
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.16 }}
            className="glass-strong z-50 w-64 overflow-hidden rounded-[var(--radius-lg)] p-1.5 shadow-[var(--shadow-float)]"
          >
            <div className="flex items-center gap-3 px-3 py-3">
              <Avatar seed={user.avatarSeed} name={user.name} size="md" />
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-[color:var(--color-ink-0)]">{user.name}</p>
                <p className="truncate text-xs text-[color:var(--color-ink-3)]">{user.email}</p>
              </div>
            </div>
            <div className="divider-fade my-1" />
            <DropdownMenu.Item
              onClick={() => navigate(settingsPath)}
              className="flex cursor-pointer items-center gap-2.5 rounded-[var(--radius-xs)] px-3 py-2.5 text-sm text-[color:var(--color-ink-1)] outline-none transition-colors hover:bg-white/5"
            >
              <UserIcon className="h-4 w-4" /> Profile settings
            </DropdownMenu.Item>
            {isCommand && (
              <DropdownMenu.Item
                onClick={() => navigate(settingsPath)}
                className="flex cursor-pointer items-center gap-2.5 rounded-[var(--radius-xs)] px-3 py-2.5 text-sm text-[color:var(--color-ink-1)] outline-none transition-colors hover:bg-white/5"
              >
                <Settings className="h-4 w-4" /> Preferences
              </DropdownMenu.Item>
            )}
            <div className="divider-fade my-1" />
            <DropdownMenu.Item
              onClick={async () => {
                await logout();
                navigate(loginPath, { replace: true });
              }}
              className="flex cursor-pointer items-center gap-2.5 rounded-[var(--radius-xs)] px-3 py-2.5 text-sm text-[color:var(--color-danger-400)] outline-none transition-colors hover:bg-[color:var(--color-danger-500)]/10"
            >
              <LogOut className="h-4 w-4" /> Sign out
            </DropdownMenu.Item>
          </motion.div>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
