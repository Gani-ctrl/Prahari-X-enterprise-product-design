import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "motion/react";
import {
  Crosshair, HeartPulse, GraduationCap, Boxes, ArrowRight, MapPin, CheckCircle2, Circle,
  ClipboardList, Award, FileWarning, Siren, CalendarClock, Send,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Badge, PriorityBadge, StatusBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { CountUp } from "@/components/motion/CountUp";
import { EmptyState } from "@/components/ui/EmptyState";
import { useSoldierContext } from "@/hooks/useSoldierContext";
import { usePolling } from "@/hooks/usePolling";
import { useAuthStore } from "@/store/authStore";
import { toast } from "@/store/toastStore";
import { assignmentsApi, badgesApi, leaveApi, reportsApi } from "@/services/api";
import type { Assignment, Badge as BadgeRecord } from "@/types";
import { formatDate } from "@/lib/utils";
import { FieldReportModal, type FieldReportFormValues } from "./FieldReportModal";
import { LeaveRequestModal, type LeaveRequestFormValues } from "./LeaveRequestModal";

const ASSIGNMENT_TYPE_LABELS: Record<string, string> = {
  weapon: "Weapon",
  ammunition: "Ammunition",
  equipment: "Equipment",
  vehicle: "Vehicle",
  drone: "Drone",
  comms: "Comm device",
  medical_kit: "Medical kit",
  protective_gear: "Protective gear",
  training: "Training",
  task: "Task",
  emergency: "Emergency",
};

export default function SoldierDashboardPage() {
  const user = useAuthStore((s) => s.user);
  const { isLoading, personnel, missions, assets } = useSoldierContext();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [badges, setBadges] = useState<BadgeRecord[]>([]);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportDefaultType, setReportDefaultType] = useState<FieldReportFormValues["type"]>("daily");
  const [leaveModalOpen, setLeaveModalOpen] = useState(false);

  const refresh = useCallback(() => {
    assignmentsApi.mine().then(setAssignments).catch(() => {});
    badgesApi.mine().then(setBadges).catch(() => {});
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Refresh-based live sync — a new Commander assignment shows up here
  // without the soldier needing to reload the page.
  usePolling(refresh, 20_000);

  function openReport(type: FieldReportFormValues["type"]) {
    setReportDefaultType(type);
    setReportModalOpen(true);
  }

  async function submitReport(values: FieldReportFormValues) {
    try {
      await reportsApi.create(values);
      toast.success("Report submitted", "Your Commander has been notified.");
    } catch (err) {
      toast.error("Could not submit report", err instanceof Error ? err.message : "Please try again.");
    }
  }

  async function submitLeave(values: LeaveRequestFormValues) {
    try {
      await leaveApi.create(values);
      toast.success("Leave request submitted", "Awaiting Commander approval.");
    } catch (err) {
      toast.error("Could not submit request", err instanceof Error ? err.message : "Please try again.");
    }
  }

  const activeMission = missions.find((m) => m.status === "active") ?? missions[0];

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-[color:var(--color-ink-3)]">
          {new Intl.DateTimeFormat("en-US", { weekday: "long", month: "long", day: "numeric" }).format(new Date())}
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-[color:var(--color-ink-0)]">
          Welcome, {user?.rank} {user?.name.split(" ").slice(-1)}.
        </h1>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="hud-card glass-soldier rounded-[var(--radius-card)] p-6 lg:col-span-2"
        >
          <p className="text-xs font-medium uppercase tracking-wider text-[color:var(--color-amber-400)]">Personal Readiness</p>
          <div className="mt-4 grid grid-cols-3 gap-6">
            <div>
              <CountUp value={personnel?.healthScore ?? 0} suffix="%" className="mono-tag text-3xl font-semibold text-[color:var(--color-ink-0)]" />
              <p className="mt-1 text-xs text-[color:var(--color-ink-3)]">Health score</p>
            </div>
            <div>
              <CountUp value={personnel?.performanceScore ?? 0} suffix="%" className="mono-tag text-3xl font-semibold text-[color:var(--color-ink-0)]" />
              <p className="mt-1 text-xs text-[color:var(--color-ink-3)]">Performance rating</p>
            </div>
            <div>
              <CountUp value={personnel?.missionsCompleted ?? 0} className="mono-tag text-3xl font-semibold text-[color:var(--color-ink-0)]" />
              <p className="mt-1 text-xs text-[color:var(--color-ink-3)]">Missions completed</p>
            </div>
          </div>
          <div className="mt-5 flex items-center gap-2 text-xs text-[color:var(--color-ink-3)]">
            <MapPin className="h-3.5 w-3.5" /> Currently at {personnel?.location ?? "—"}
          </div>
        </motion.div>

        <Card>
          <CardHeader><CardTitle>Equipment Assigned</CardTitle></CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[color:var(--color-amber-500)]/12 text-[color:var(--color-amber-400)]">
                <Boxes className="h-5 w-5" />
              </div>
              <div>
                <p className="mono-tag text-2xl font-semibold text-[color:var(--color-ink-0)]">{assets.length}</p>
                <p className="text-xs text-[color:var(--color-ink-3)]">Items via active missions</p>
              </div>
            </div>
            <Link to="/soldier/equipment" className="mt-4 flex items-center gap-1 text-xs font-medium text-[color:var(--color-amber-400)] hover:text-[color:var(--color-amber-300)]">
              View equipment <ArrowRight className="h-3 w-3" />
            </Link>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Current Assignment</CardTitle>
          <Link to="/soldier/missions" className="flex items-center gap-1 text-xs text-[color:var(--color-amber-400)] hover:text-[color:var(--color-amber-300)]">
            All missions <ArrowRight className="h-3 w-3" />
          </Link>
        </CardHeader>
        <CardContent>
          {!isLoading && !activeMission && (
            <EmptyState icon={<Crosshair />} title="No active assignment" description="You're not currently assigned to a mission. Check back after your next briefing." />
          )}
          {activeMission && (
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <PriorityBadge priority={activeMission.priority} />
                <StatusBadge status={activeMission.status} />
                <span className="mono-tag text-xs text-[color:var(--color-ink-3)]">{activeMission.code}</span>
              </div>
              <p className="mt-2 text-base font-semibold text-[color:var(--color-ink-0)]">{activeMission.name}</p>
              <p className="mt-1 text-sm text-[color:var(--color-ink-3)]">{activeMission.region} · {formatDate(activeMission.startDate)} – {formatDate(activeMission.endDate)}</p>
              <div className="mt-4 max-w-sm">
                <ProgressBar value={activeMission.progress} tone="amber" showLabel />
              </div>
              <div className="mt-5 space-y-2">
                {activeMission.objectives.slice(0, 3).map((o) => (
                  <div key={o.id} className="flex items-center gap-2.5 text-sm">
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
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <GraduationCap className="h-4 w-4 text-[color:var(--color-amber-400)]" />
              <CardTitle>Training Progress</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {(personnel?.certifications ?? []).map((c) => (
              <div key={c} className="flex items-center justify-between rounded-xl border border-[color:var(--color-border)] px-3.5 py-2.5 text-sm">
                <span className="text-[color:var(--color-ink-1)]">{c}</span>
                <span className="text-xs text-[color:var(--color-success-400)]">Certified</span>
              </div>
            ))}
            <Link to="/soldier/training" className="flex items-center gap-1 pt-1 text-xs font-medium text-[color:var(--color-amber-400)] hover:text-[color:var(--color-amber-300)]">
              View training plan <ArrowRight className="h-3 w-3" />
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <HeartPulse className="h-4 w-4 text-[color:var(--color-danger-400)]" />
              <CardTitle>Medical Status</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <ProgressBar value={personnel?.healthScore ?? 0} tone={((personnel?.healthScore ?? 0) > 70 ? "success" : "amber")} showLabel />
            <p className="mt-3 text-xs text-[color:var(--color-ink-3)]">
              {(personnel?.healthScore ?? 0) > 85
                ? "Fit for full deployment. No restrictions on record."
                : "Monitor recommended. Schedule a check-in with medical support if symptoms persist."}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center gap-2">
              <ClipboardList className="h-4 w-4 text-[color:var(--color-amber-400)]" />
              <CardTitle>My Assignments</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="!px-0 !pb-0">
            {assignments.length === 0 ? (
              <div className="px-6 pb-6">
                <EmptyState icon={<ClipboardList />} title="Nothing assigned yet" description="Weapons, equipment, training, and tasks issued by your Commander will appear here." />
              </div>
            ) : (
              <div className="divide-y divide-[color:var(--color-border)]">
                {assignments.map((a) => (
                  <div key={a.id} className="flex flex-col gap-2 px-6 py-3.5 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-medium text-[color:var(--color-ink-0)]">{a.title}</p>
                        <Badge tone="neutral">{ASSIGNMENT_TYPE_LABELS[a.type] ?? a.type}</Badge>
                      </div>
                      {a.description && <p className="mt-0.5 truncate text-xs text-[color:var(--color-ink-3)]">{a.description}</p>}
                    </div>
                    <div className="flex items-center gap-2">
                      <PriorityBadge priority={a.priority} />
                      <StatusBadge status={a.status} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Award className="h-4 w-4 text-[color:var(--color-amber-400)]" />
              <CardTitle>Achievements</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {badges.length === 0 ? (
              <p className="text-xs text-[color:var(--color-ink-3)]">No badges awarded yet.</p>
            ) : (
              badges.map((b) => (
                <div key={b.id} className="rounded-xl border border-[color:var(--color-border)] px-3.5 py-2.5">
                  <p className="text-sm font-medium text-[color:var(--color-ink-0)]">{b.title}</p>
                  <p className="mt-0.5 text-xs text-[color:var(--color-ink-3)]">{b.description}</p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Send className="h-4 w-4 text-[color:var(--color-amber-400)]" />
            <CardTitle>Submit a Report</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2.5">
          <Button variant="amber" size="sm" icon={<ClipboardList />} onClick={() => openReport("daily")}>Daily Report</Button>
          <Button variant="secondary" size="sm" icon={<FileWarning />} onClick={() => openReport("incident")}>Incident Report</Button>
          <Button variant="danger" size="sm" icon={<Siren />} onClick={() => openReport("emergency_alert")}>Emergency Alert</Button>
          <Button variant="secondary" size="sm" icon={<HeartPulse />} onClick={() => openReport("medical_request")}>Medical Request</Button>
          <Button variant="secondary" size="sm" icon={<CalendarClock />} onClick={() => setLeaveModalOpen(true)}>Request Leave</Button>
        </CardContent>
      </Card>

      <FieldReportModal open={reportModalOpen} onOpenChange={setReportModalOpen} onSubmit={submitReport} defaultType={reportDefaultType} />
      <LeaveRequestModal open={leaveModalOpen} onOpenChange={setLeaveModalOpen} onSubmit={submitLeave} />
    </div>
  );
}
