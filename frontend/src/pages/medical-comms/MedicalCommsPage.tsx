import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  HeartPulse,
  Stethoscope,
  AlertTriangle,
  Ambulance,
  Radio,
  Send,
  MessageSquareText,
  Lock,
  Users2,
} from "lucide-react";
import { Tabs, TabPanel } from "@/components/ui/Tabs";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { StatusBadge, Badge } from "@/components/ui/Badge";
import { StatCard } from "@/components/ui/StatCard";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Avatar } from "@/components/ui/Avatar";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { timeAgo } from "@/lib/utils";
import { UNITS } from "@/lib/mockData";
import { personnelApi, assetsApi, notificationsApi } from "@/services/api";
import { toast } from "@/store/toastStore";
import type { Asset, NotificationItem, Personnel } from "@/types";

export default function MedicalCommsPage() {
  const [tab, setTab] = useState<"medical" | "comms">("medical");
  const [personnel, setPersonnel] = useState<Personnel[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const [broadcastTitle, setBroadcastTitle] = useState("");
  const [broadcastMessage, setBroadcastMessage] = useState("");
  const [broadcastUnit, setBroadcastUnit] = useState("all");
  const [sending, setSending] = useState(false);

  async function load() {
    setIsLoading(true);
    const [p, a, n] = await Promise.all([personnelApi.list(), assetsApi.list(), notificationsApi.list()]);
    setPersonnel(p);
    setAssets(a);
    setNotifications(n);
    setIsLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  const medicalAssets = useMemo(() => assets.filter((a) => a.category === "medical"), [assets]);
  const needsAttention = useMemo(
    () => [...personnel].filter((p) => p.healthScore < 70 || p.status === "medical").sort((a, b) => a.healthScore - b.healthScore),
    [personnel]
  );

  const medicalStats = useMemo(() => {
    const onLeave = personnel.filter((p) => p.status === "medical").length;
    const avgHealth = personnel.length ? Math.round(personnel.reduce((s, p) => s + p.healthScore, 0) / personnel.length) : 0;
    const critical = personnel.filter((p) => p.healthScore < 40).length;
    const assetsReady = medicalAssets.filter((a) => a.status === "operational").length;
    return { onLeave, avgHealth, critical, assetsReady };
  }, [personnel, medicalAssets]);

  const channels = useMemo(() => {
    return UNITS.map((unit, i) => ({
      unit,
      members: personnel.filter((p) => p.unit === unit).length,
      lastActivity: new Date(Date.now() - (i + 1) * 3600_000 * (3 + i)).toISOString(),
      encrypted: true,
    }));
  }, [personnel]);

  const broadcasts = useMemo(
    () => notifications.filter((n) => n.type === "system" || n.type === "personnel").slice(0, 12),
    [notifications]
  );

  async function markFit(person: Personnel) {
    setBusyId(person.id);
    try {
      const updated = await personnelApi.update(person.id, { status: "available", healthScore: 100 });
      setPersonnel((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      toast.success("Cleared for duty", `${person.name} marked fit for deployment.`);
    } finally {
      setBusyId(null);
    }
  }

  async function flagMedical(person: Personnel) {
    setBusyId(person.id);
    try {
      const updated = await personnelApi.update(person.id, { status: "medical" });
      setPersonnel((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      toast.success("Flagged for medical review", person.name);
    } finally {
      setBusyId(null);
    }
  }

  async function sendBroadcast() {
    if (!broadcastTitle.trim() || !broadcastMessage.trim()) return;
    setSending(true);
    try {
      const scope = broadcastUnit === "all" ? "All Units" : broadcastUnit;
      const created = await notificationsApi.create({
        title: broadcastTitle,
        message: `[${scope}] ${broadcastMessage}`,
        type: "system",
      });
      setNotifications((prev) => [created, ...prev]);
      toast.success("Broadcast sent", `Delivered to ${scope}.`);
      setBroadcastTitle("");
      setBroadcastMessage("");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2.5 text-2xl font-semibold tracking-tight text-[color:var(--color-ink-0)]">
          <Stethoscope className="h-6 w-6 text-[color:var(--color-success-400)]" />
          Medical Support &amp; Communications
        </h1>
        <p className="mt-1 text-sm text-[color:var(--color-ink-3)]">Force health readiness and secure command broadcasts</p>
      </div>

      <Tabs
        tabs={[
          { value: "medical", label: "Medical Support" },
          { value: "comms", label: "Communication Center" },
        ]}
        value={tab}
        onValueChange={(v) => setTab(v as any)}
      >
        <TabPanel value="medical" className="pt-6">
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard label="Avg Health Score" value={medicalStats.avgHealth} suffix="%" icon={<HeartPulse />} tone="success" index={0} />
              <StatCard label="On Medical Leave" value={medicalStats.onLeave} icon={<Ambulance />} tone="amber" index={1} />
              <StatCard label="Critical Alerts" value={medicalStats.critical} icon={<AlertTriangle />} tone="danger" index={2} />
              <StatCard label="Medical Assets Ready" value={medicalStats.assetsReady} icon={<Stethoscope />} tone="sentinel" index={3} />
            </div>

            <div className="rounded-[var(--radius-card)] border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] p-6">
              <h3 className="text-[15px] font-semibold tracking-tight text-[color:var(--color-ink-0)]">Personnel Needing Attention</h3>
              <p className="mt-1 text-sm text-[color:var(--color-ink-3)]">Health score below 70, or currently flagged medical.</p>

              {isLoading ? (
                <div className="mt-4 space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>
              ) : needsAttention.length === 0 ? (
                <div className="mt-4"><EmptyState icon={<HeartPulse />} title="Force is at full health" description="No personnel currently require medical attention." /></div>
              ) : (
                <div className="mt-4 space-y-2.5">
                  <AnimatePresence>
                    {needsAttention.map((p) => (
                      <motion.div
                        key={p.id}
                        layout
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="flex items-center justify-between gap-4 rounded-xl border border-[color:var(--color-border)] p-3.5"
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <Avatar seed={p.avatarSeed} name={p.name} size="sm" />
                          <div className="min-w-0">
                            <p className="truncate text-sm text-[color:var(--color-ink-1)]">{p.rank} {p.name}</p>
                            <p className="text-xs text-[color:var(--color-ink-4)]">{p.unit}</p>
                          </div>
                        </div>
                        <div className="w-32 shrink-0">
                          <ProgressBar value={p.healthScore} tone={p.healthScore > 70 ? "success" : p.healthScore > 40 ? "amber" : "danger"} showLabel />
                        </div>
                        <StatusBadge status={p.status} />
                        <div className="flex shrink-0 gap-2">
                          {p.status !== "medical" && (
                            <Button variant="outline" size="sm" disabled={busyId === p.id} onClick={() => flagMedical(p)}>Flag Medical</Button>
                          )}
                          <Button variant="secondary" size="sm" disabled={busyId === p.id} onClick={() => markFit(p)}>Clear for Duty</Button>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>

            <div className="rounded-[var(--radius-card)] border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] p-6">
              <h3 className="text-[15px] font-semibold tracking-tight text-[color:var(--color-ink-0)]">Medical Assets</h3>
              {medicalAssets.length === 0 ? (
                <p className="mt-3 text-sm text-[color:var(--color-ink-3)]">No medical assets on record.</p>
              ) : (
                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {medicalAssets.map((a) => (
                    <div key={a.id} className="rounded-xl border border-[color:var(--color-border)] p-3.5">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-[color:var(--color-ink-1)]">{a.name}</p>
                        <StatusBadge status={a.status} />
                      </div>
                      <p className="mt-1 text-xs text-[color:var(--color-ink-4)]">{a.location}</p>
                      <div className="mt-2.5"><ProgressBar value={a.condition} tone={a.condition > 70 ? "success" : "amber"} /></div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </TabPanel>

        <TabPanel value="comms" className="pt-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
            <div className="lg:col-span-3 space-y-6">
              <div className="rounded-[var(--radius-card)] border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] p-6">
                <h3 className="flex items-center gap-2 text-[15px] font-semibold tracking-tight text-[color:var(--color-ink-0)]">
                  <Send className="h-4 w-4 text-[color:var(--color-sentinel-400)]" /> Compose Broadcast
                </h3>
                <div className="mt-4 space-y-3.5">
                  <Input label="Subject" placeholder="Perimeter status update" value={broadcastTitle} onChange={(e) => setBroadcastTitle(e.target.value)} />
                  <Textarea label="Message" placeholder="Broadcast content…" value={broadcastMessage} onChange={(e) => setBroadcastMessage(e.target.value)} />
                  <Select
                    label="Recipients"
                    value={broadcastUnit}
                    onValueChange={setBroadcastUnit}
                    options={[{ label: "All Units", value: "all" }, ...UNITS.map((u) => ({ label: u, value: u }))]}
                  />
                  <Button icon={<Send />} loading={sending} disabled={!broadcastTitle.trim() || !broadcastMessage.trim()} onClick={sendBroadcast} className="w-full">
                    Send Secure Broadcast
                  </Button>
                </div>
              </div>

              <div className="rounded-[var(--radius-card)] border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] p-6">
                <h3 className="flex items-center gap-2 text-[15px] font-semibold tracking-tight text-[color:var(--color-ink-0)]">
                  <MessageSquareText className="h-4 w-4 text-[color:var(--color-amber-400)]" /> Recent Broadcasts
                </h3>
                {broadcasts.length === 0 ? (
                  <p className="mt-3 text-sm text-[color:var(--color-ink-3)]">No broadcasts sent yet.</p>
                ) : (
                  <div className="mt-4 space-y-2.5">
                    {broadcasts.map((n) => (
                      <div key={n.id} className="rounded-xl border border-[color:var(--color-border)] p-3.5">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-[color:var(--color-ink-1)]">{n.title}</p>
                          <span className="text-xs text-[color:var(--color-ink-4)]">{timeAgo(n.createdAt)}</span>
                        </div>
                        <p className="mt-1 text-xs leading-relaxed text-[color:var(--color-ink-3)]">{n.message}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="lg:col-span-2">
              <div className="rounded-[var(--radius-card)] border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] p-6">
                <h3 className="flex items-center gap-2 text-[15px] font-semibold tracking-tight text-[color:var(--color-ink-0)]">
                  <Radio className="h-4 w-4 text-[color:var(--color-success-400)]" /> Active Channels
                </h3>
                <div className="mt-4 space-y-2.5">
                  {channels.map((c) => (
                    <div key={c.unit} className="rounded-xl border border-[color:var(--color-border)] p-3.5">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-[color:var(--color-ink-1)]">{c.unit}</p>
                        <Badge tone="success" dot>Encrypted</Badge>
                      </div>
                      <div className="mt-2 flex items-center justify-between text-xs text-[color:var(--color-ink-4)]">
                        <span className="flex items-center gap-1"><Users2 className="h-3 w-3" /> {c.members} members</span>
                        <span className="flex items-center gap-1"><Lock className="h-3 w-3" /> {timeAgo(c.lastActivity)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </TabPanel>
      </Tabs>
    </div>
  );
}
