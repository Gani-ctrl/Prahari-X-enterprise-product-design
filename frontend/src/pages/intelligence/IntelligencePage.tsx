import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { motion } from "motion/react";
import {
  Plus, Radar, Cpu, Signal as SignalIcon, Satellite, MapPin, Bot, Pencil, Trash2, ShieldCheck, Sparkles, MessageSquare,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { SkeletonCard } from "@/components/ui/Skeleton";
import { SectorHeatmap } from "./SectorHeatmap";
import { ThreatFormModal, type ThreatFormValues } from "./ThreatFormModal";
import { EntityDetailDrawer } from "@/components/shared/EntityDetailDrawer";
import { threatsApi } from "@/services/api";
import { toast } from "@/store/toastStore";
import { timeAgo, cn } from "@/lib/utils";
import type { ThreatCategory, ThreatReport } from "@/types";

// `LucideIcon`, not the generic React `ElementType` — see NotificationsPanel.tsx
// for why `ElementType` collapses this kind of dynamic icon-map lookup to `never`.
const CATEGORY_ICON: Record<ThreatCategory, LucideIcon> = {
  cyber: Cpu,
  drone: Radar,
  satellite: Satellite,
  ground: MapPin,
  signal: SignalIcon,
};

const CATEGORY_TABS: { value: ThreatCategory | "all"; label: string }[] = [
  { value: "all", label: "All Signals" },
  { value: "cyber", label: "Cyber" },
  { value: "drone", label: "Drone" },
  { value: "satellite", label: "Satellite" },
  { value: "ground", label: "Ground" },
  { value: "signal", label: "Signal" },
];

const SEVERITY_TONE: Record<ThreatReport["severity"], "danger" | "warning" | "sentinel" | "neutral"> = {
  critical: "danger",
  high: "warning",
  medium: "sentinel",
  low: "neutral",
};

export default function IntelligencePage() {
  const [threats, setThreats] = useState<ThreatReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [category, setCategory] = useState<ThreatCategory | "all">("all");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<ThreatReport | null>(null);
  const [deleting, setDeleting] = useState<ThreatReport | null>(null);
  const [viewing, setViewing] = useState<ThreatReport | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();

  async function load() {
    setIsLoading(true);
    setThreats(await threatsApi.list());
    setIsLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (searchParams.get("new") === "1") {
      setEditing(null);
      setFormOpen(true);
      searchParams.delete("new");
      setSearchParams(searchParams, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const filtered = useMemo(() => (category === "all" ? threats : threats.filter((t) => t.category === category)), [threats, category]);

  const topThreats = useMemo(
    () => [...threats].filter((t) => t.status === "active").sort((a, b) => b.aiConfidence - a.aiConfidence).slice(0, 3),
    [threats]
  );

  async function handleSubmit(values: ThreatFormValues) {
    if (editing) {
      const updated = await threatsApi.update(editing.id, values);
      setThreats((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
      toast.success("Threat report updated");
    } else {
      const created = await threatsApi.create({ ...values, aiConfidence: 60 + Math.round(Math.random() * 35), source: "Manual Entry" });
      setThreats((prev) => [created, ...prev]);
      toast.success("Threat report logged");
    }
  }

  async function handleResolve(t: ThreatReport) {
    const updated = await threatsApi.update(t.id, { status: "neutralized" });
    setThreats((prev) => prev.map((x) => (x.id === updated.id ? updated : x)));
    toast.success("Threat neutralized", `${t.title} marked as resolved.`);
  }

  async function handleDelete() {
    if (!deleting) return;
    await threatsApi.remove(deleting.id);
    setThreats((prev) => prev.filter((t) => t.id !== deleting.id));
    setDeleting(null);
    toast.success("Report deleted");
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[color:var(--color-ink-0)]">Intelligence Center</h1>
          <p className="mt-1 text-sm text-[color:var(--color-ink-3)]">Fused signal intelligence across every sector</p>
        </div>
        <Button icon={<Plus />} onClick={() => { setEditing(null); setFormOpen(true); }}>Log Threat Report</Button>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Sector Threat Density</CardTitle>
          </CardHeader>
          <CardContent>
            <SectorHeatmap threats={threats} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-[color:var(--color-amber-400)]" />
              <CardTitle>AI Recommendations</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {topThreats.length === 0 && <p className="text-sm text-[color:var(--color-ink-3)]">No high-confidence threats to review.</p>}
            {topThreats.map((t) => (
              <div key={t.id} className="rounded-xl border border-[color:var(--color-border)] p-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-[color:var(--color-ink-0)]">{t.title}</p>
                  <span className="mono-tag text-[10px] text-[color:var(--color-amber-400)]">{t.aiConfidence}%</span>
                </div>
                <p className="mt-1.5 text-xs leading-relaxed text-[color:var(--color-ink-3)]">
                  Recommend prioritizing correlation with {t.source} data and escalating to sector command if activity persists beyond 6 hours.
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap gap-2">
        {CATEGORY_TABS.map((t) => (
          <button
            key={t.value}
            onClick={() => setCategory(t.value)}
            className={cn(
              "rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors",
              category === t.value
                ? "border-[color:var(--color-sentinel-500)]/40 bg-[color:var(--color-sentinel-500)]/12 text-[color:var(--color-sentinel-400)]"
                : "border-[color:var(--color-border-strong)] text-[color:var(--color-ink-3)] hover:text-[color:var(--color-ink-1)]"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={<Radar />} title="No signals in this category" description="Adjust the filter or log a new threat report." />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {filtered.map((t, i) => {
            const Icon = CATEGORY_ICON[t.category];
            return (
              <motion.div key={t.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                <Card className="h-full">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[color:var(--color-surface-3)] text-[color:var(--color-ink-2)]">
                          <Icon className="h-[18px] w-[18px]" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-[color:var(--color-ink-0)]">{t.title}</p>
                          <p className="text-xs text-[color:var(--color-ink-3)]">{t.region} · {timeAgo(t.detectedAt)}</p>
                        </div>
                      </div>
                      <Badge tone={SEVERITY_TONE[t.severity]} dot>{t.severity}</Badge>
                    </div>
                    <p className="mt-3 text-sm leading-relaxed text-[color:var(--color-ink-3)]">{t.description}</p>
                    <div className="mt-4 flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs text-[color:var(--color-ink-3)]">
                        <Bot className="h-3.5 w-3.5" /> AI confidence <span className="mono-tag text-[color:var(--color-ink-0)]">{t.aiConfidence}%</span>
                      </div>
                      <Badge tone={t.status === "neutralized" ? "success" : t.status === "monitoring" ? "sentinel" : "danger"}>{t.status}</Badge>
                    </div>
                    <div className="mt-4 flex items-center gap-2 border-t border-[color:var(--color-border)] pt-3">
                      {t.status !== "neutralized" && (
                        <Button size="sm" variant="secondary" icon={<ShieldCheck />} onClick={() => handleResolve(t)}>Neutralize</Button>
                      )}
                      <Button size="sm" variant="ghost" icon={<MessageSquare />} onClick={() => setViewing(t)}>Discuss</Button>
                      <Button size="sm" variant="ghost" icon={<Pencil />} onClick={() => { setEditing(t); setFormOpen(true); }}>Edit</Button>
                      <Button size="sm" variant="ghost" icon={<Trash2 />} onClick={() => setDeleting(t)} className="ml-auto text-[color:var(--color-danger-400)]">Delete</Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      <ThreatFormModal open={formOpen} onOpenChange={setFormOpen} onSubmit={handleSubmit} threat={editing} />
      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(v) => !v && setDeleting(null)}
        title="Delete this threat report?"
        description="This report will be permanently removed from the intelligence feed."
        confirmLabel="Delete report"
        onConfirm={handleDelete}
      />

      {viewing && (
        <EntityDetailDrawer
          open={Boolean(viewing)}
          onOpenChange={(open) => !open && setViewing(null)}
          title={viewing.title}
          entityType="threat"
          entityId={viewing.id}
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Badge tone={SEVERITY_TONE[viewing.severity]} dot>{viewing.severity}</Badge>
              <Badge tone={viewing.status === "neutralized" ? "success" : viewing.status === "monitoring" ? "sentinel" : "danger"}>{viewing.status}</Badge>
            </div>
            <p className="text-sm leading-relaxed text-[color:var(--color-ink-1)]">{viewing.description}</p>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-xl border border-[color:var(--color-border)] p-3">
                <p className="text-xs text-[color:var(--color-ink-3)]">Region</p>
                <p className="mt-1 font-medium text-[color:var(--color-ink-0)]">{viewing.region}</p>
              </div>
              <div className="rounded-xl border border-[color:var(--color-border)] p-3">
                <p className="text-xs text-[color:var(--color-ink-3)]">AI confidence</p>
                <p className="mt-1 font-medium text-[color:var(--color-ink-0)]">{viewing.aiConfidence}%</p>
              </div>
              <div className="rounded-xl border border-[color:var(--color-border)] p-3">
                <p className="text-xs text-[color:var(--color-ink-3)]">Source</p>
                <p className="mt-1 font-medium text-[color:var(--color-ink-0)]">{viewing.source}</p>
              </div>
              <div className="rounded-xl border border-[color:var(--color-border)] p-3">
                <p className="text-xs text-[color:var(--color-ink-3)]">Detected</p>
                <p className="mt-1 font-medium text-[color:var(--color-ink-0)]">{timeAgo(viewing.detectedAt)}</p>
              </div>
            </div>
          </div>
        </EntityDetailDrawer>
      )}
    </div>
  );
}
