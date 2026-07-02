import { useEffect, useState } from "react";
import { Mail, Phone, Calendar, MapPin, Award, HeartPulse, TrendingUp, CalendarClock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";
import { StatusBadge, PriorityBadge } from "@/components/ui/Badge";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { CountUp } from "@/components/motion/CountUp";
import { useSoldierContext } from "@/hooks/useSoldierContext";
import { formatDate } from "@/lib/utils";
import { LoadingScreen } from "@/components/ui/LoadingScreen";
import { badgesApi, leaveApi } from "@/services/api";
import type { Badge as BadgeRecord, LeaveRequest } from "@/types";

export default function SoldierProfilePage() {
  const { isLoading, personnel, missions } = useSoldierContext();
  const [badges, setBadges] = useState<BadgeRecord[]>([]);
  const [leaveHistory, setLeaveHistory] = useState<LeaveRequest[]>([]);

  useEffect(() => {
    badgesApi.mine().then(setBadges).catch(() => {});
    leaveApi.mine().then(setLeaveHistory).catch(() => {});
  }, []);

  if (isLoading) return <LoadingScreen />;
  if (!personnel) {
    return (
      <div className="rounded-[var(--radius-card)] border border-dashed border-[color:var(--color-border-strong)] p-10 text-center text-sm text-[color:var(--color-ink-3)]">
        This account isn't linked to a personnel record yet.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="hud-card glass-soldier flex flex-col gap-5 rounded-[var(--radius-card)] p-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Avatar seed={personnel.avatarSeed} name={personnel.name} size="lg" />
          <div>
            <p className="text-lg font-semibold text-[color:var(--color-ink-0)]">{personnel.rank} {personnel.name}</p>
            <p className="text-sm text-[color:var(--color-ink-3)]">{personnel.roleTitle} · {personnel.unit}</p>
            <div className="mt-2"><StatusBadge status={personnel.status} /></div>
          </div>
        </div>
        <div className="flex gap-8">
          <div>
            <CountUp value={personnel.performanceScore} suffix="%" className="mono-tag text-2xl font-semibold text-[color:var(--color-ink-0)]" />
            <p className="text-xs text-[color:var(--color-ink-3)]">Performance</p>
          </div>
          <div>
            <CountUp value={personnel.missionsCompleted} className="mono-tag text-2xl font-semibold text-[color:var(--color-ink-0)]" />
            <p className="text-xs text-[color:var(--color-ink-3)]">Missions</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Contact & Deployment</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex items-center gap-2.5 text-sm text-[color:var(--color-ink-1)]"><Mail className="h-4 w-4 text-[color:var(--color-ink-3)]" /> {personnel.email}</div>
            <div className="flex items-center gap-2.5 text-sm text-[color:var(--color-ink-1)]"><Phone className="h-4 w-4 text-[color:var(--color-ink-3)]" /> {personnel.phone}</div>
            <div className="flex items-center gap-2.5 text-sm text-[color:var(--color-ink-1)]"><MapPin className="h-4 w-4 text-[color:var(--color-ink-3)]" /> {personnel.location}</div>
            <div className="flex items-center gap-2.5 text-sm text-[color:var(--color-ink-1)]"><Calendar className="h-4 w-4 text-[color:var(--color-ink-3)]" /> Joined {formatDate(personnel.joinedAt)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2"><HeartPulse className="h-4 w-4 text-[color:var(--color-danger-400)]" /><CardTitle>Health Score</CardTitle></div>
          </CardHeader>
          <CardContent>
            <ProgressBar value={personnel.healthScore} tone={personnel.healthScore > 70 ? "success" : "amber"} showLabel />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2"><Award className="h-4 w-4 text-[color:var(--color-amber-400)]" /><CardTitle>Certifications</CardTitle></div>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {personnel.certifications.map((c) => (
            <span key={c} className="rounded-full border border-[color:var(--color-amber-500)]/30 bg-[color:var(--color-amber-500)]/10 px-3 py-1.5 text-xs font-medium text-[color:var(--color-amber-400)]">
              {c}
            </span>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2"><TrendingUp className="h-4 w-4 text-[color:var(--color-sentinel-400)]" /><CardTitle>Mission History</CardTitle></div>
        </CardHeader>
        <CardContent className="space-y-2">
          {missions.length === 0 && <p className="text-sm text-[color:var(--color-ink-3)]">No mission assignments on record yet.</p>}
          {missions.map((m) => (
            <div key={m.id} className="flex items-center justify-between gap-3 rounded-xl border border-[color:var(--color-border)] px-3.5 py-2.5">
              <div>
                <p className="text-sm text-[color:var(--color-ink-1)]">{m.name}</p>
                <p className="mono-tag text-xs text-[color:var(--color-ink-4)]">{m.code}</p>
              </div>
              <PriorityBadge priority={m.priority} />
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2"><Award className="h-4 w-4 text-[color:var(--color-amber-400)]" /><CardTitle>Achievement Badges</CardTitle></div>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {badges.length === 0 ? (
              <p className="text-sm text-[color:var(--color-ink-3)]">No badges awarded yet.</p>
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

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2"><CalendarClock className="h-4 w-4 text-[color:var(--color-amber-400)]" /><CardTitle>Leave History</CardTitle></div>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {leaveHistory.length === 0 ? (
              <p className="text-sm text-[color:var(--color-ink-3)]">No leave requests submitted yet.</p>
            ) : (
              leaveHistory.map((r) => (
                <div key={r.id} className="flex items-center justify-between gap-3 rounded-xl border border-[color:var(--color-border)] px-3.5 py-2.5">
                  <div>
                    <p className="text-sm text-[color:var(--color-ink-1)]">{r.reason}</p>
                    <p className="text-xs text-[color:var(--color-ink-4)]">{formatDate(r.startDate)} – {formatDate(r.endDate)}</p>
                  </div>
                  <StatusBadge status={r.status} />
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
