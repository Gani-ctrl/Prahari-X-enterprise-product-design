import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import {
  Plus,
  MoreVertical,
  Pencil,
  Trash2,
  GraduationCap,
  Crosshair,
  HeartPulse,
  Cpu,
  Award,
  Compass,
  Clock,
  Users2,
  ShieldAlert,
  Layers,
  MessageSquare,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge, StatusBadge } from "@/components/ui/Badge";
import { StatCard } from "@/components/ui/StatCard";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { EmptyState } from "@/components/ui/EmptyState";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Skeleton } from "@/components/ui/Skeleton";
import { TrainingFormModal, type TrainingFormValues } from "./TrainingFormModal";
import { EntityDetailDrawer } from "@/components/shared/EntityDetailDrawer";
import { trainingApi, personnelApi } from "@/services/api";
import { toast } from "@/store/toastStore";
import { cn, formatDate } from "@/lib/utils";
import type { Personnel, TrainingCategory, TrainingProgram } from "@/types";

const CATEGORY_META: Record<TrainingCategory, { label: string; icon: typeof Crosshair; tone: string }> = {
  combat: { label: "Combat", icon: Crosshair, tone: "text-[color:var(--color-danger-400)] bg-[color:var(--color-danger-500)]/12" },
  medical: { label: "Medical", icon: HeartPulse, tone: "text-[color:var(--color-success-400)] bg-[color:var(--color-success-500)]/12" },
  technical: { label: "Technical", icon: Cpu, tone: "text-[color:var(--color-sentinel-400)] bg-[color:var(--color-sentinel-500)]/12" },
  leadership: { label: "Leadership", icon: Award, tone: "text-[color:var(--color-amber-400)] bg-[color:var(--color-amber-500)]/12" },
  survival: { label: "Survival", icon: Compass, tone: "text-[color:var(--color-steel-400)] bg-white/8" },
};

const CATEGORY_TABS: Array<{ value: TrainingCategory | "all"; label: string }> = [
  { value: "all", label: "All" },
  { value: "combat", label: "Combat" },
  { value: "medical", label: "Medical" },
  { value: "technical", label: "Technical" },
  { value: "leadership", label: "Leadership" },
  { value: "survival", label: "Survival" },
];

export default function TrainingPage() {
  const [programs, setPrograms] = useState<TrainingProgram[]>([]);
  const [personnel, setPersonnel] = useState<Personnel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [category, setCategory] = useState<TrainingCategory | "all">("all");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<TrainingProgram | null>(null);
  const [deleting, setDeleting] = useState<TrainingProgram | null>(null);
  const [viewing, setViewing] = useState<TrainingProgram | null>(null);

  async function load() {
    setIsLoading(true);
    const [p, roster] = await Promise.all([trainingApi.list(), personnelApi.list()]);
    setPrograms(p);
    setPersonnel(roster);
    setIsLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => programs.filter((p) => category === "all" || p.category === category), [programs, category]);

  const stats = useMemo(() => {
    const active = programs.filter((p) => p.status === "active").length;
    const mandatory = programs.filter((p) => p.mandatory).length;
    const avgReadiness = programs.length ? Math.round(programs.reduce((s, p) => s + p.completionRate, 0) / programs.length) : 0;
    const totalEnrolled = programs.reduce((s, p) => s + p.enrolledCount, 0);
    return { active, mandatory, avgReadiness, totalEnrolled };
  }, [programs]);

  const unitReadiness = useMemo(() => {
    const byUnit = new Map<string, Personnel[]>();
    personnel.forEach((p) => {
      byUnit.set(p.unit, [...(byUnit.get(p.unit) ?? []), p]);
    });
    return Array.from(byUnit.entries())
      .map(([unit, members]) => ({
        unit,
        count: members.length,
        avgPerformance: Math.round(members.reduce((s, m) => s + m.performanceScore, 0) / members.length),
        certifications: members.reduce((s, m) => s + m.certifications.length, 0),
      }))
      .sort((a, b) => b.avgPerformance - a.avgPerformance);
  }, [personnel]);

  async function handleSubmit(values: TrainingFormValues) {
    if (editing) {
      const updated = await trainingApi.update(editing.id, values);
      setPrograms((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      toast.success("Training program updated");
    } else {
      const created = await trainingApi.create(values);
      setPrograms((prev) => [created, ...prev]);
      toast.success("Training program added");
    }
  }

  async function handleDelete() {
    if (!deleting) return;
    await trainingApi.remove(deleting.id);
    setPrograms((prev) => prev.filter((p) => p.id !== deleting.id));
    setDeleting(null);
    toast.success("Training program removed");
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="flex items-center gap-2.5 text-2xl font-semibold tracking-tight text-[color:var(--color-ink-0)]">
            <GraduationCap className="h-6 w-6 text-[color:var(--color-amber-400)]" />
            Training &amp; Readiness
          </h1>
          <p className="mt-1 text-sm text-[color:var(--color-ink-3)]">{programs.length} programs across the force curriculum</p>
        </div>
        <Button icon={<Plus />} onClick={() => { setEditing(null); setFormOpen(true); }}>Add Program</Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Active Programs" value={stats.active} icon={<Layers />} tone="sentinel" index={0} />
        <StatCard label="Force Readiness" value={stats.avgReadiness} suffix="%" icon={<ShieldAlert />} tone="success" index={1} />
        <StatCard label="Mandatory Programs" value={stats.mandatory} icon={<Award />} tone="amber" index={2} />
        <StatCard label="Total Enrollments" value={stats.totalEnrolled} icon={<Users2 />} tone="danger" index={3} />
      </div>

      <div className="flex flex-wrap items-center gap-2 border-b border-[color:var(--color-border)] pb-1">
        {CATEGORY_TABS.map((tab) => {
          const active = tab.value === category;
          return (
            <button
              key={tab.value}
              onClick={() => setCategory(tab.value)}
              className={cn(
                "relative rounded-t-lg px-3.5 py-2.5 text-sm font-medium transition-colors",
                active ? "text-[color:var(--color-ink-0)]" : "text-[color:var(--color-ink-3)] hover:text-[color:var(--color-ink-1)]"
              )}
            >
              {tab.label}
              {active && (
                <motion.div
                  layoutId="training-tab-indicator"
                  className="absolute inset-x-2 -bottom-px h-[2px] rounded-full bg-[color:var(--color-amber-400)]"
                  transition={{ type: "spring", stiffness: 500, damping: 40 }}
                />
              )}
            </button>
          );
        })}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-56 rounded-[var(--radius-card)]" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<GraduationCap />}
          title="No training programs match this filter"
          description="Adjust the category or add a new training program."
          action={<Button icon={<Plus />} onClick={() => { setEditing(null); setFormOpen(true); }}>Add Program</Button>}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence mode="popLayout">
            {filtered.map((program, index) => {
              const meta = CATEGORY_META[program.category];
              const Icon = meta.icon;
              return (
                <motion.div
                  key={program.id}
                  layout
                  initial={{ opacity: 0, y: 16, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ duration: 0.35, delay: index * 0.03, ease: [0.16, 1, 0.3, 1] }}
                  whileHover={{ y: -3 }}
                  className="hud-card relative overflow-hidden rounded-[var(--radius-card)] border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] p-5"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={cn("flex h-11 w-11 items-center justify-center rounded-xl [&>svg]:h-5 [&>svg]:w-5", meta.tone)}>
                        <Icon />
                      </div>
                      <div>
                        <p className="font-medium leading-tight text-[color:var(--color-ink-0)]">{program.name}</p>
                        <p className="mt-0.5 text-xs text-[color:var(--color-ink-4)]">{meta.label}{program.mandatory && " · Mandatory"}</p>
                      </div>
                    </div>
                    <DropdownMenu.Root>
                      <DropdownMenu.Trigger asChild>
                        <button className="flex h-8 w-8 items-center justify-center rounded-lg text-[color:var(--color-ink-3)] hover:bg-white/5 hover:text-[color:var(--color-ink-0)]">
                          <MoreVertical className="h-4 w-4" />
                        </button>
                      </DropdownMenu.Trigger>
                      <DropdownMenu.Portal>
                        <DropdownMenu.Content align="end" className="z-50 w-44 overflow-hidden rounded-[var(--radius-md)] border border-[color:var(--color-border-strong)] bg-[color:var(--color-surface-2)] p-1 shadow-[var(--shadow-float)]">
                          <DropdownMenu.Item onClick={() => setViewing(program)} className="flex cursor-pointer items-center gap-2.5 rounded-[var(--radius-xs)] px-3 py-2 text-sm text-[color:var(--color-ink-1)] outline-none hover:bg-white/5">
                            <MessageSquare className="h-3.5 w-3.5" /> Comments &amp; Activity
                          </DropdownMenu.Item>
                          <DropdownMenu.Item onClick={() => { setEditing(program); setFormOpen(true); }} className="flex cursor-pointer items-center gap-2.5 rounded-[var(--radius-xs)] px-3 py-2 text-sm text-[color:var(--color-ink-1)] outline-none hover:bg-white/5">
                            <Pencil className="h-3.5 w-3.5" /> Edit
                          </DropdownMenu.Item>
                          <DropdownMenu.Item onClick={() => setDeleting(program)} className="flex cursor-pointer items-center gap-2.5 rounded-[var(--radius-xs)] px-3 py-2 text-sm text-[color:var(--color-danger-400)] outline-none hover:bg-[color:var(--color-danger-500)]/10">
                            <Trash2 className="h-3.5 w-3.5" /> Delete
                          </DropdownMenu.Item>
                        </DropdownMenu.Content>
                      </DropdownMenu.Portal>
                    </DropdownMenu.Root>
                  </div>

                  <p className="mt-3 line-clamp-2 text-xs text-[color:var(--color-ink-3)]">{program.description}</p>

                  <div className="mt-4 flex items-center justify-between">
                    <StatusBadge status={program.status} />
                    {program.mandatory && <Badge tone="warning">Mandatory</Badge>}
                  </div>

                  <div className="mt-3">
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <span className="text-[color:var(--color-ink-3)]">Completion rate</span>
                      <span className="mono-tag font-medium text-[color:var(--color-ink-1)]">{program.completionRate}%</span>
                    </div>
                    <ProgressBar value={program.completionRate} tone={program.completionRate > 70 ? "success" : program.completionRate > 40 ? "amber" : "danger"} />
                  </div>

                  <div className="mt-4 flex items-center justify-between text-xs text-[color:var(--color-ink-4)]">
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {program.durationHours}h</span>
                    <span className="flex items-center gap-1"><Users2 className="h-3 w-3" /> {program.enrolledCount} enrolled</span>
                    <span>Next {formatDate(program.nextSessionDate)}</span>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      <div className="rounded-[var(--radius-card)] border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] p-6">
        <h3 className="text-[15px] font-semibold tracking-tight text-[color:var(--color-ink-0)]">Force Readiness by Unit</h3>
        <p className="mt-1 text-sm text-[color:var(--color-ink-3)]">Average performance score and certification coverage per unit.</p>
        <div className="mt-5 space-y-4">
          {unitReadiness.map((u) => (
            <div key={u.unit} className="flex items-center gap-4">
              <div className="w-48 shrink-0">
                <p className="text-sm font-medium text-[color:var(--color-ink-1)]">{u.unit}</p>
                <p className="text-xs text-[color:var(--color-ink-4)]">{u.count} personnel · {u.certifications} certifications</p>
              </div>
              <div className="flex-1">
                <ProgressBar value={u.avgPerformance} tone={u.avgPerformance > 70 ? "success" : u.avgPerformance > 40 ? "amber" : "danger"} showLabel />
              </div>
            </div>
          ))}
        </div>
      </div>

      <TrainingFormModal open={formOpen} onOpenChange={setFormOpen} onSubmit={handleSubmit} program={editing} />
      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(v) => !v && setDeleting(null)}
        title="Remove this training program?"
        description={`${deleting?.name ?? "This program"} will be permanently removed from the curriculum.`}
        confirmLabel="Remove program"
        onConfirm={handleDelete}
      />

      {viewing && (
        <EntityDetailDrawer
          open={Boolean(viewing)}
          onOpenChange={(open) => !open && setViewing(null)}
          title={viewing.name}
          entityType="training"
          entityId={viewing.id}
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <StatusBadge status={viewing.status} />
              {viewing.mandatory && <Badge tone="warning">Mandatory</Badge>}
            </div>
            <p className="text-sm leading-relaxed text-[color:var(--color-ink-1)]">{viewing.description}</p>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-xl border border-[color:var(--color-border)] p-3">
                <p className="text-xs text-[color:var(--color-ink-3)]">Duration</p>
                <p className="mt-1 font-medium text-[color:var(--color-ink-0)]">{viewing.durationHours}h</p>
              </div>
              <div className="rounded-xl border border-[color:var(--color-border)] p-3">
                <p className="text-xs text-[color:var(--color-ink-3)]">Enrolled</p>
                <p className="mt-1 font-medium text-[color:var(--color-ink-0)]">{viewing.enrolledCount}</p>
              </div>
              <div className="rounded-xl border border-[color:var(--color-border)] p-3">
                <p className="text-xs text-[color:var(--color-ink-3)]">Completion rate</p>
                <p className="mt-1 font-medium text-[color:var(--color-ink-0)]">{viewing.completionRate}%</p>
              </div>
              <div className="rounded-xl border border-[color:var(--color-border)] p-3">
                <p className="text-xs text-[color:var(--color-ink-3)]">Next session</p>
                <p className="mt-1 font-medium text-[color:var(--color-ink-0)]">{formatDate(viewing.nextSessionDate)}</p>
              </div>
            </div>
          </div>
        </EntityDetailDrawer>
      )}
    </div>
  );
}
