import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import {
  User, ShieldCheck, Palette, Bell, Laptop2, ScrollText, LogOut, Mail,
  KeyRound, Smartphone, Monitor, CheckCircle2, XCircle, Shuffle, Phone, Shield, Users,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Switch } from "@/components/ui/Switch";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { SkeletonTableRow } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { useAuthStore } from "@/store/authStore";
import { useThemeStore } from "@/store/themeStore";
import { useUserStore } from "@/store/userStore";
import { auditApi, auth } from "@/services/api";
import { toast } from "@/store/toastStore";
import { cn, formatDateTime, timeAgo } from "@/lib/utils";
import type { AuditLogEntry } from "@/types";

const SECTIONS = [
  { id: "profile", label: "Profile", icon: User },
  { id: "security", label: "Security & 2FA", icon: ShieldCheck },
  { id: "appearance", label: "Appearance", icon: Palette },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "devices", label: "Devices", icon: Laptop2 },
  { id: "audit", label: "Audit Logs", icon: ScrollText },
] as const;

export default function SettingsPage() {
  const [section, setSection] = useState<(typeof SECTIONS)[number]["id"]>("profile");
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[240px_1fr]">
      <nav className="space-y-1">
        {SECTIONS.map((s) => (
          <button
            key={s.id}
            onClick={() => setSection(s.id)}
            className={cn(
              "flex w-full items-center gap-3 rounded-[var(--radius-sm)] px-3 py-2.5 text-sm font-medium transition-colors",
              section === s.id ? "bg-[color:var(--color-sentinel-500)]/12 text-[color:var(--color-ink-0)]" : "text-[color:var(--color-ink-3)] hover:bg-white/[0.04] hover:text-[color:var(--color-ink-1)]"
            )}
          >
            <s.icon className="h-[18px] w-[18px]" /> {s.label}
          </button>
        ))}
        <div className="pt-2">
          <button
            onClick={async () => { await logout(); navigate("/auth/login", { replace: true }); }}
            className="flex w-full items-center gap-3 rounded-[var(--radius-sm)] px-3 py-2.5 text-sm font-medium text-[color:var(--color-danger-400)] transition-colors hover:bg-[color:var(--color-danger-500)]/10"
          >
            <LogOut className="h-[18px] w-[18px]" /> Sign out
          </button>
        </div>
      </nav>

      <motion.div key={section} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
        {section === "profile" && <ProfileSection />}
        {section === "security" && <SecuritySection />}
        {section === "appearance" && <AppearanceSection />}
        {section === "notifications" && <NotificationsSection />}
        {section === "devices" && <DevicesSection />}
        {section === "audit" && <AuditSection />}
      </motion.div>
    </div>
  );
}

function ProfileSection() {
  const user = useAuthStore((s) => s.user);
  const updateProfile = useAuthStore((s) => s.updateProfile);
  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [rank, setRank] = useState(user?.rank ?? "");
  const [unit, setUnit] = useState(user?.unit ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [avatarSeed, setAvatarSeed] = useState(user?.avatarSeed ?? "");
  const [saving, setSaving] = useState(false);

  // Re-sync local field state whenever the store's user changes underneath
  // us — e.g. after a successful save, or if another tab updates the profile.
  useEffect(() => {
    if (!user) return;
    setName(user.name);
    setEmail(user.email);
    setRank(user.rank ?? "");
    setUnit(user.unit ?? "");
    setPhone(user.phone ?? "");
    setAvatarSeed(user.avatarSeed);
  }, [user]);

  if (!user) return null;

  const isDirty =
    name !== user.name || email !== user.email || rank !== (user.rank ?? "") || unit !== (user.unit ?? "") || phone !== (user.phone ?? "") || avatarSeed !== user.avatarSeed;

  async function handleSave() {
    setSaving(true);
    try {
      await updateProfile({
        name: name !== user!.name ? name : undefined,
        email: email !== user!.email ? email : undefined,
        rank: rank !== (user!.rank ?? "") ? rank : undefined,
        unit: unit !== (user!.unit ?? "") ? unit : undefined,
        phone: user!.personnelId && phone !== (user!.phone ?? "") ? phone : undefined,
        avatarSeed: avatarSeed !== user!.avatarSeed ? avatarSeed : undefined,
      });
      toast.success("Profile updated — reflected across the platform.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not update profile.");
    } finally {
      setSaving(false);
    }
  }

  function shuffleAvatar() {
    setAvatarSeed(`${user!.name}-${Math.random().toString(36).slice(2, 8)}`);
  }

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Your identity across the command platform — changes here sync to every page that references you.</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center gap-4">
          <Avatar seed={avatarSeed} name={name} size="lg" />
          <div className="flex-1">
            <p className="text-sm font-medium text-[color:var(--color-ink-0)]">{rank || "Unranked"} · {unit || "Unassigned"}</p>
            <p className="text-xs text-[color:var(--color-ink-3)]">Member since {formatDateTime(user.createdAt)}</p>
          </div>
          <Button variant="secondary" size="sm" onClick={shuffleAvatar}>
            <Shuffle className="h-3.5 w-3.5" /> Shuffle avatar
          </Button>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input label="Full name" value={name} onChange={(e) => setName(e.target.value)} />
          <Input label="Email" icon={<Mail />} value={email} onChange={(e) => setEmail(e.target.value)} />
          <Input label="Rank" icon={<Shield />} value={rank} onChange={(e) => setRank(e.target.value)} />
          <Input label="Unit" icon={<Users />} value={unit} onChange={(e) => setUnit(e.target.value)} />
          {user.personnelId && (
            <Input label="Phone" icon={<Phone />} value={phone} onChange={(e) => setPhone(e.target.value)} />
          )}
        </div>
        <Button onClick={handleSave} disabled={!isDirty || saving}>
          {saving ? "Saving…" : "Save changes"}
        </Button>
      </CardContent>
    </Card>
  );
}

function SecuritySection() {
  const user = useAuthStore((s) => s.user);
  const [twoFA, setTwoFA] = useState(user?.twoFactorEnabled ?? false);

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader>
          <div>
            <CardTitle>Password</CardTitle>
            <CardDescription>Update your account password regularly.</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input label="Current password" type="password" icon={<KeyRound />} placeholder="••••••••" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input label="New password" type="password" placeholder="••••••••" />
            <Input label="Confirm new password" type="password" placeholder="••••••••" />
          </div>
          <Button onClick={() => toast.success("Password changed")}>Update password</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Two-Factor Authentication</CardTitle>
            <CardDescription>Add an extra layer of security to your account.</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <Switch
            checked={twoFA}
            onCheckedChange={(v) => { setTwoFA(v); toast.success(v ? "2FA enabled" : "2FA disabled"); }}
            label="Authenticator app 2FA"
            description="Require a verification code in addition to your password."
          />
          {twoFA && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="mt-5 flex items-center gap-4 rounded-2xl border border-[color:var(--color-border)] p-4">
              <div className="grid h-20 w-20 shrink-0 grid-cols-4 gap-0.5 rounded-lg bg-white p-2">
                {Array.from({ length: 16 }).map((_, i) => (
                  <div key={i} className={cn("rounded-[1px]", Math.random() > 0.5 ? "bg-black" : "bg-white")} />
                ))}
              </div>
              <div>
                <p className="text-sm font-medium text-[color:var(--color-ink-0)]">Scan with your authenticator app</p>
                <p className="mt-1 text-xs text-[color:var(--color-ink-3)]">Then enter the 6-digit code to confirm setup.</p>
              </div>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function AppearanceSection() {
  const theme = useThemeStore((s) => s.theme);
  const setTheme = useThemeStore((s) => s.setTheme);
  const { density, accent, setDensity, setAccent } = useUserStore();

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader><CardTitle>Theme</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            {(["dark", "light"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTheme(t)}
                className={cn(
                  "rounded-2xl border p-4 text-left transition-colors",
                  theme === t ? "border-[color:var(--color-sentinel-500)]/50 bg-[color:var(--color-sentinel-500)]/[0.06]" : "border-[color:var(--color-border-strong)]"
                )}
              >
                <div className={cn("h-16 w-full rounded-lg", t === "dark" ? "bg-[#05070a] border border-[#232937]" : "bg-[#f4f6fb] border border-[#dde1ea]")} />
                <p className="mt-3 text-sm font-medium capitalize text-[color:var(--color-ink-0)]">{t} mode</p>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Density</CardTitle></CardHeader>
        <CardContent className="flex gap-3">
          {(["comfortable", "compact"] as const).map((d) => (
            <button
              key={d}
              onClick={() => setDensity(d)}
              className={cn(
                "rounded-xl border px-4 py-2 text-sm font-medium capitalize transition-colors",
                density === d ? "border-[color:var(--color-sentinel-500)]/50 bg-[color:var(--color-sentinel-500)]/12 text-[color:var(--color-ink-0)]" : "border-[color:var(--color-border-strong)] text-[color:var(--color-ink-3)]"
              )}
            >
              {d}
            </button>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Accent Color</CardTitle></CardHeader>
        <CardContent className="flex gap-3">
          {(["sentinel", "amber"] as const).map((a) => (
            <button
              key={a}
              onClick={() => setAccent(a)}
              className={cn(
                "flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-medium capitalize transition-colors",
                accent === a ? "border-[color:var(--color-ink-4)] bg-white/5 text-[color:var(--color-ink-0)]" : "border-[color:var(--color-border-strong)] text-[color:var(--color-ink-3)]"
              )}
            >
              <span className={cn("h-3 w-3 rounded-full", a === "sentinel" ? "bg-[color:var(--color-sentinel-500)]" : "bg-[color:var(--color-amber-500)]")} />
              {a}
            </button>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function NotificationsSection() {
  const { notificationPrefs, toggleNotificationPref } = useUserStore();
  const items: { key: keyof typeof notificationPrefs; label: string; description: string }[] = [
    { key: "missionUpdates", label: "Mission updates", description: "Status changes, objective completions, and log entries." },
    { key: "threatAlerts", label: "Threat alerts", description: "New or escalating threat reports from the intelligence feed." },
    { key: "personnelChanges", label: "Personnel changes", description: "Assignments, status changes, and roster updates." },
    { key: "systemDigest", label: "System digest", description: "Daily summary of platform activity." },
  ];
  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Notification Preferences</CardTitle>
          <CardDescription>Choose what you want to be notified about.</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        {items.map((item) => (
          <Switch key={item.key} checked={notificationPrefs[item.key]} onCheckedChange={() => toggleNotificationPref(item.key)} label={item.label} description={item.description} />
        ))}
      </CardContent>
    </Card>
  );
}

interface SessionRow {
  id: string;
  userAgent: string | null;
  ip: string | null;
  rememberMe: boolean;
  createdAt: string;
  expiresAt: string;
}

interface LoginHistoryRow {
  id: string;
  success: boolean;
  ip: string | null;
  userAgent: string | null;
  createdAt: string;
}

function parseDeviceLabel(userAgent: string | null): { label: string; isMobile: boolean } {
  if (!userAgent) return { label: "Unknown device", isMobile: false };
  const isMobile = /Mobile|Android|iPhone/i.test(userAgent);
  if (/Chrome/i.test(userAgent)) return { label: "Chrome", isMobile };
  if (/Firefox/i.test(userAgent)) return { label: "Firefox", isMobile };
  if (/Safari/i.test(userAgent)) return { label: "Safari", isMobile };
  return { label: "Browser session", isMobile };
}

function DevicesSection() {
  const [sessions, setSessions] = useState<SessionRow[] | null>(null);
  const [history, setHistory] = useState<LoginHistoryRow[] | null>(null);
  const [revokingId, setRevokingId] = useState<string | null>(null);

  async function load() {
    const [s, h] = await Promise.all([auth.sessions(), auth.loginHistory()]);
    setSessions(s);
    setHistory(h);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleRevoke(id: string) {
    setRevokingId(id);
    try {
      await auth.revokeSession(id);
      setSessions((prev) => prev?.filter((s) => s.id !== id) ?? null);
      toast.success("Session revoked");
    } finally {
      setRevokingId(null);
    }
  }

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader>
          <div>
            <CardTitle>Active Sessions</CardTitle>
            <CardDescription>Every device currently signed in with a live refresh token.</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {!sessions ? (
            Array.from({ length: 2 }).map((_, i) => <SkeletonTableRow key={i} cols={3} />)
          ) : sessions.length === 0 ? (
            <EmptyState icon={<Monitor />} title="No active sessions" description="Sign in again to start a new session." />
          ) : (
            sessions.map((s, i) => {
              const device = parseDeviceLabel(s.userAgent);
              return (
                <div key={s.id} className="flex items-center justify-between gap-4 rounded-xl border border-[color:var(--color-border)] p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[color:var(--color-surface-3)] text-[color:var(--color-ink-2)]">
                      {device.isMobile ? <Smartphone className="h-4 w-4" /> : <Monitor className="h-4 w-4" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-[color:var(--color-ink-0)]">{device.label}</p>
                        {i === 0 && <Badge tone="success">Most recent</Badge>}
                        {s.rememberMe && <Badge tone="sentinel">Remembered</Badge>}
                      </div>
                      <p className="text-xs text-[color:var(--color-ink-3)]">{s.ip ?? "Unknown IP"} · Signed in {timeAgo(s.createdAt)}</p>
                    </div>
                  </div>
                  <Button size="sm" variant="ghost" className="text-[color:var(--color-danger-400)]" loading={revokingId === s.id} onClick={() => handleRevoke(s.id)}>
                    Revoke
                  </Button>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Recent Sign-in Activity</CardTitle>
            <CardDescription>The last 25 login attempts on your account, successful or not.</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="!px-0 !pb-0">
          {!history ? (
            Array.from({ length: 3 }).map((_, i) => <SkeletonTableRow key={i} cols={3} />)
          ) : (
            <div className="divide-y divide-[color:var(--color-border)]">
              {history.map((h) => (
                <div key={h.id} className="flex items-center gap-4 px-6 py-3.5">
                  {h.success ? (
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-[color:var(--color-success-400)]" />
                  ) : (
                    <XCircle className="h-4 w-4 shrink-0 text-[color:var(--color-danger-400)]" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-[color:var(--color-ink-1)]">{h.success ? "Successful sign-in" : "Failed sign-in attempt"}</p>
                    <p className="mono-tag text-xs text-[color:var(--color-ink-4)]">{h.ip ?? "Unknown IP"}</p>
                  </div>
                  <span className="shrink-0 text-xs text-[color:var(--color-ink-3)]">{timeAgo(h.createdAt)}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function AuditSection() {
  const [logs, setLogs] = useState<AuditLogEntry[] | null>(null);

  useEffect(() => {
    auditApi.list().then(setLogs);
  }, []);

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Audit Logs</CardTitle>
          <CardDescription>A complete record of security-relevant actions on your account.</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="!px-0 !pb-0">
        {!logs ? (
          Array.from({ length: 5 }).map((_, i) => <SkeletonTableRow key={i} cols={4} />)
        ) : (
          <div className="divide-y divide-[color:var(--color-border)]">
            {logs.map((log) => (
              <div key={log.id} className="flex items-center gap-4 px-6 py-3.5">
                {log.status === "success" ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-[color:var(--color-success-400)]" />
                ) : (
                  <XCircle className="h-4 w-4 shrink-0 text-[color:var(--color-danger-400)]" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-[color:var(--color-ink-1)]">
                    <span className="font-medium text-[color:var(--color-ink-0)]">{log.actor}</span> {log.action.toLowerCase()} — {log.target}
                  </p>
                  <p className="mono-tag text-xs text-[color:var(--color-ink-4)]">{log.ip}</p>
                </div>
                <span className="shrink-0 text-xs text-[color:var(--color-ink-3)]">{timeAgo(log.timestamp)}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
