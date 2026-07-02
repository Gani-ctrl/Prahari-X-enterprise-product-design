import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Crosshair, Users, Truck, ShieldAlert, BellRing, ArrowRight, Plus, UserCheck, Radio, HeartPulse, MoonStar, ClipboardList } from "lucide-react";
import { StatCard } from "@/components/ui/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { TrendAreaChart } from "@/components/charts/TrendAreaChart";
import { DonutChart } from "@/components/charts/DonutChart";
import { Button } from "@/components/ui/Button";
import { PriorityBadge, StatusBadge } from "@/components/ui/Badge";
import { SkeletonCard } from "@/components/ui/Skeleton";
import { Avatar } from "@/components/ui/Avatar";
import { useAuthStore } from "@/store/authStore";
import { usePolling } from "@/hooks/usePolling";
import { TacticalOverviewPanel } from "./TacticalOverviewPanel";
import { dashboard, missionsApi, threatsApi, personnelApi } from "@/services/api";
import type { DashboardStats, Mission, Personnel, ThreatReport } from "@/types";
import { motion } from "motion/react";
import { timeAgo } from "@/lib/utils";

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [threats, setThreats] = useState<ThreatReport[]>([]);
  const [personnel, setPersonnel] = useState<Personnel[]>([]);

  const refresh = useCallback(() => {
    dashboard.stats().then(setStats);
    missionsApi.list().then(setMissions);
    threatsApi.list().then(setThreats);
    personnelApi.list().then(setPersonnel);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Refresh-based live sync: picks up Commander assignments and Soldier
  // field-report submissions without a manual reload.
  usePolling(refresh, 20_000);

  const readinessData = [
    { label: "Available", value: personnel.filter((p) => p.status === "available").length, color: "var(--color-success-500)" },
    { label: "Deployed", value: personnel.filter((p) => p.status === "deployed").length, color: "var(--color-sentinel-500)" },
    { label: "Leave", value: personnel.filter((p) => p.status === "leave").length, color: "var(--color-ink-4)" },
    { label: "Medical", value: personnel.filter((p) => p.status === "medical").length, color: "var(--color-amber-500)" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-sm text-[color:var(--color-ink-3)]">
            {new Intl.DateTimeFormat("en-US", { weekday: "long", month: "long", day: "numeric" }).format(new Date())}
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-[color:var(--color-ink-0)]">
            Welcome back, {user?.name.split(" ").slice(-1)}.
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/app/assignments">
            <Button variant="secondary" icon={<ClipboardList />}>Assignment Center</Button>
          </Link>
          <Link to="/app/operations?new=1">
            <Button icon={<Plus />}>New Mission</Button>
          </Link>
        </div>
      </div>

      <TacticalOverviewPanel missions={missions} threats={threats} />

      <div>
        <p className="mb-3 text-xs font-medium uppercase tracking-wider text-[color:var(--color-ink-4)]">Command &amp; Control — Force Status</p>
        {!stats ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-6">
            {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-6">
            <StatCard index={0} label="Total Soldiers" value={stats.soldierStats.total} icon={<Users />} tone="sentinel" />
            <StatCard index={1} label="Active" value={stats.soldierStats.active} icon={<UserCheck />} tone="success" />
            <StatCard index={2} label="Deployed" value={stats.soldierStats.deployed} icon={<Radio />} tone="sentinel" />
            <StatCard index={3} label="Available" value={stats.soldierStats.available} icon={<Users />} tone="success" />
            <StatCard index={4} label="Injured" value={stats.soldierStats.injured} icon={<HeartPulse />} tone="danger" />
            <StatCard index={5} label="Offline" value={stats.soldierStats.offline} icon={<MoonStar />} tone="amber" />
          </div>
        )}
      </div>

      {!stats ? (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
          <StatCard index={0} label="Active Missions" value={stats.activeMissions} icon={<Crosshair />} tone="sentinel" delta={12} />
          <StatCard index={1} label="Personnel" value={stats.totalPersonnel} icon={<Users />} tone="success" delta={4} />
          <StatCard index={2} label="Deployed Assets" value={stats.deployedAssets} icon={<Truck />} tone="amber" delta={-2} />
          <StatCard index={3} label="Active Threats" value={stats.activeThreats} icon={<ShieldAlert />} tone="danger" delta={8} />
          <StatCard index={4} label="Pending Alerts" value={stats.pendingAlerts} icon={<BellRing />} tone="sentinel" />
        </div>
      )}

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div>
              <CardTitle>Mission Trend</CardTitle>
              <p className="mt-1 text-xs text-[color:var(--color-ink-3)]">Active missions over the last 7 days</p>
            </div>
          </CardHeader>
          <CardContent>{stats && <TrendAreaChart data={stats.missionTrend} color="var(--color-sentinel-500)" />}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Personnel Readiness</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-center">
            <DonutChart data={readinessData} />
          </CardContent>
          <div className="grid grid-cols-2 gap-2 px-6 pb-6">
            {readinessData.map((d) => (
              <div key={d.label} className="flex items-center gap-2 text-xs text-[color:var(--color-ink-2)]">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: d.color }} />
                {d.label} <span className="ml-auto mono-tag text-[color:var(--color-ink-0)]">{d.value}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Threat Trend</CardTitle>
            <Link to="/app/intelligence" className="flex items-center gap-1 text-xs text-[color:var(--color-sentinel-400)] hover:text-[color:var(--color-sentinel-300)]">
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent>{stats && <TrendAreaChart data={stats.threatTrend} color="var(--color-danger-500)" />}</CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Live Threat Feed</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {threats.slice(0, 4).map((t, i) => (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.06 }}
                className="flex items-start gap-3 rounded-xl border border-[color:var(--color-border)] p-3"
              >
                <div className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-[color:var(--color-danger-500)]" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium text-[color:var(--color-ink-0)]">{t.title}</p>
                  <p className="mt-0.5 text-[11px] text-[color:var(--color-ink-3)]">{t.region} · {timeAgo(t.detectedAt)}</p>
                </div>
              </motion.div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Missions</CardTitle>
          <Link to="/app/operations" className="flex items-center gap-1 text-xs text-[color:var(--color-sentinel-400)] hover:text-[color:var(--color-sentinel-300)]">
            View all operations <ArrowRight className="h-3 w-3" />
          </Link>
        </CardHeader>
        <CardContent className="!px-0 !pb-0">
          <div className="divide-y divide-[color:var(--color-border)]">
            {missions.slice(0, 5).map((m) => (
              <Link
                key={m.id}
                to={`/app/operations/${m.id}`}
                className="flex flex-col gap-3 px-6 py-4 transition-colors hover:bg-white/[0.03] sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex items-center gap-3">
                  <Avatar seed={m.commanderName} name={m.commanderName} size="sm" />
                  <div>
                    <p className="text-sm font-medium text-[color:var(--color-ink-0)]">{m.name}</p>
                    <p className="mono-tag text-xs text-[color:var(--color-ink-3)]">{m.code} · {m.region}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <PriorityBadge priority={m.priority} />
                  <StatusBadge status={m.status} />
                </div>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
