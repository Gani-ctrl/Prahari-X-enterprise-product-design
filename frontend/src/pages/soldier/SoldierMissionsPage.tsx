import { useState } from "react";
import { motion } from "motion/react";
import { Crosshair, CheckCircle2, Circle, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { PriorityBadge, StatusBadge } from "@/components/ui/Badge";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Drawer } from "@/components/ui/Drawer";
import { EmptyState } from "@/components/ui/EmptyState";
import { SkeletonCard } from "@/components/ui/Skeleton";
import { useSoldierContext } from "@/hooks/useSoldierContext";
import { formatDate, formatDateTime } from "@/lib/utils";
import type { Mission } from "@/types";

export default function SoldierMissionsPage() {
  const { isLoading, missions, personnel } = useSoldierContext();
  const [selected, setSelected] = useState<Mission | null>(null);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-[color:var(--color-ink-0)]">My Missions</h1>
        <p className="mt-1 text-sm text-[color:var(--color-ink-3)]">Operations you're currently assigned to, {personnel?.name.split(" ").slice(-1)}.</p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : missions.length === 0 ? (
        <EmptyState icon={<Crosshair />} title="No mission assignments" description="You'll see your assigned operations here once command briefs you in." />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {missions.map((m, i) => (
            <motion.button
              key={m.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => setSelected(m)}
              className="hud-card glass-soldier rounded-[var(--radius-card)] p-6 text-left transition-transform hover:-translate-y-0.5"
            >
              <div className="flex flex-wrap items-center gap-2">
                <PriorityBadge priority={m.priority} />
                <StatusBadge status={m.status} />
              </div>
              <p className="mt-3 text-base font-semibold text-[color:var(--color-ink-0)]">{m.name}</p>
              <p className="mono-tag mt-0.5 text-xs text-[color:var(--color-ink-3)]">{m.code} · {m.region}</p>
              <div className="mt-4">
                <ProgressBar value={m.progress} tone="amber" showLabel />
              </div>
              <p className="mt-3 text-xs text-[color:var(--color-ink-4)]">{formatDate(m.startDate)} – {formatDate(m.endDate)}</p>
            </motion.button>
          ))}
        </div>
      )}

      <Drawer open={Boolean(selected)} onOpenChange={(v) => !v && setSelected(null)} title={selected?.name ?? ""}>
        {selected && (
          <div className="space-y-6">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <PriorityBadge priority={selected.priority} />
                <StatusBadge status={selected.status} />
                <span className="mono-tag text-xs text-[color:var(--color-ink-3)]">{selected.code}</span>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-[color:var(--color-ink-2)]">{selected.description}</p>
              <p className="mt-2 text-xs text-[color:var(--color-ink-3)]">
                {selected.region} · {formatDate(selected.startDate)} – {formatDate(selected.endDate)}
              </p>
            </div>

            <div>
              <p className="mb-2 text-sm font-medium text-[color:var(--color-ink-0)]">Objectives</p>
              <div className="space-y-2">
                {selected.objectives.map((o) => (
                  <div key={o.id} className="flex items-center gap-2.5 rounded-xl border border-[color:var(--color-border)] px-3.5 py-2.5 text-sm">
                    {o.status === "complete" ? (
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-[color:var(--color-success-400)]" />
                    ) : (
                      <Circle className="h-4 w-4 shrink-0 text-[color:var(--color-ink-4)]" />
                    )}
                    <span className="text-[color:var(--color-ink-1)]">{o.title}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-2 flex items-center gap-2 text-sm font-medium text-[color:var(--color-ink-0)]">
                <Users className="h-4 w-4 text-[color:var(--color-ink-3)]" /> Squad size: {selected.squadIds.length}
              </p>
            </div>

            <div>
              <p className="mb-2 text-sm font-medium text-[color:var(--color-ink-0)]">Recent Logs</p>
              <div className="space-y-2">
                {selected.logs.slice(0, 5).map((log) => (
                  <div key={log.id} className="rounded-xl border border-[color:var(--color-border)] px-3.5 py-2.5">
                    <p className="text-sm text-[color:var(--color-ink-1)]">{log.message}</p>
                    <p className="mt-0.5 text-xs text-[color:var(--color-ink-4)]">{formatDateTime(log.timestamp)}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}
