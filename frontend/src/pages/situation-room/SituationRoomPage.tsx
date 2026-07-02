import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Radar as RadarIcon,
  Crosshair,
  Users,
  Boxes,
  ShieldAlert,
  FileText,
  Sparkles,
  Send,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { StatCard } from "@/components/ui/StatCard";
import { PriorityBadge, StatusBadge } from "@/components/ui/Badge";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Skeleton } from "@/components/ui/Skeleton";
import { missionsApi, threatsApi, personnelApi, assetsApi, notificationsApi } from "@/services/api";
import { toast } from "@/store/toastStore";
import { formatDateTime, timeAgo } from "@/lib/utils";
import { generateBriefing, type CommandBriefing } from "./briefingGenerator";
import type { Asset, Mission, Personnel, ThreatReport } from "@/types";

export default function SituationRoomPage() {
  const [missions, setMissions] = useState<Mission[]>([]);
  const [threats, setThreats] = useState<ThreatReport[]>([]);
  const [personnel, setPersonnel] = useState<Personnel[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [briefing, setBriefing] = useState<CommandBriefing | null>(null);
  const [generating, setGenerating] = useState(false);
  const [broadcasting, setBroadcasting] = useState(false);

  async function load() {
    setIsLoading(true);
    const [m, t, p, a] = await Promise.all([missionsApi.list(), threatsApi.list(), personnelApi.list(), assetsApi.list()]);
    setMissions(m);
    setThreats(t);
    setPersonnel(p);
    setAssets(a);
    setIsLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  const activeMissions = useMemo(() => missions.filter((m) => m.status === "active").sort((a, b) => b.progress - a.progress), [missions]);
  const liveThreats = useMemo(
    () => [...threats].filter((t) => t.status !== "neutralized").sort((a, b) => new Date(b.detectedAt).getTime() - new Date(a.detectedAt).getTime()).slice(0, 8),
    [threats]
  );

  const stats = useMemo(() => ({
    activeMissions: activeMissions.length,
    activeThreats: threats.filter((t) => t.status === "active").length,
    personnelDeployed: personnel.filter((p) => p.status === "deployed").length,
    assetsDeployed: assets.filter((a) => a.status === "deployed").length,
  }), [activeMissions, threats, personnel, assets]);

  async function handleGenerate() {
    setGenerating(true);
    await new Promise((r) => setTimeout(r, 900));
    setBriefing(generateBriefing(missions, threats, personnel, assets));
    setGenerating(false);
  }

  async function handleBroadcast() {
    if (!briefing) return;
    setBroadcasting(true);
    try {
      await notificationsApi.create({
        title: "Daily Command Briefing",
        message: briefing.executiveSummary,
        type: "system",
      });
      toast.success("Briefing broadcast", "Sent to command channel.");
    } finally {
      setBroadcasting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2.5 text-2xl font-semibold tracking-tight text-[color:var(--color-ink-0)]">
          <RadarIcon className="h-6 w-6 text-[color:var(--color-sentinel-400)]" />
          Situation Room
        </h1>
        <p className="mt-1 text-sm text-[color:var(--color-ink-3)]">Live theatre-wide operational picture &amp; command briefings</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Active Missions" value={stats.activeMissions} icon={<Crosshair />} tone="sentinel" index={0} />
        <StatCard label="Active Threats" value={stats.activeThreats} icon={<ShieldAlert />} tone="danger" index={1} />
        <StatCard label="Personnel Deployed" value={stats.personnelDeployed} icon={<Users />} tone="success" index={2} />
        <StatCard label="Assets Deployed" value={stats.assetsDeployed} icon={<Boxes />} tone="amber" index={3} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3 space-y-6">
          <div className="hud-card rounded-[var(--radius-card)] border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)]/80 p-6 backdrop-blur">
            <h3 className="flex items-center gap-2 text-[15px] font-semibold tracking-tight text-[color:var(--color-ink-0)]">
              <Crosshair className="h-4 w-4 text-[color:var(--color-sentinel-400)]" /> Mission Timeline
            </h3>
            {isLoading ? (
              <div className="mt-4 space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>
            ) : activeMissions.length === 0 ? (
              <p className="mt-4 text-sm text-[color:var(--color-ink-3)]">No active missions.</p>
            ) : (
              <div className="mt-4 space-y-3">
                {activeMissions.map((m) => (
                  <div key={m.id} className="rounded-xl border border-[color:var(--color-border)] p-3.5">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-[color:var(--color-ink-1)]">{m.name}</p>
                        <p className="mono-tag text-xs text-[color:var(--color-ink-4)]">{m.code} · {m.region}</p>
                      </div>
                      <PriorityBadge priority={m.priority} />
                    </div>
                    <div className="mt-2.5"><ProgressBar value={m.progress} tone={m.progress > 60 ? "success" : "amber"} showLabel /></div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="hud-card rounded-[var(--radius-card)] border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)]/80 p-6 backdrop-blur">
            <h3 className="flex items-center gap-2 text-[15px] font-semibold tracking-tight text-[color:var(--color-ink-0)]">
              <ShieldAlert className="h-4 w-4 text-[color:var(--color-danger-400)]" /> Live Threat Feed
            </h3>
            {isLoading ? (
              <div className="mt-4 space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-14 rounded-xl" />)}</div>
            ) : liveThreats.length === 0 ? (
              <p className="mt-4 text-sm text-[color:var(--color-ink-3)]">No active threats.</p>
            ) : (
              <div className="mt-4 space-y-2.5">
                <AnimatePresence>
                  {liveThreats.map((t) => (
                    <motion.div
                      key={t.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center justify-between gap-3 rounded-xl border border-[color:var(--color-border)] p-3"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm text-[color:var(--color-ink-1)]">{t.title}</p>
                        <p className="flex items-center gap-1.5 text-xs text-[color:var(--color-ink-4)]">
                          <Clock className="h-3 w-3" /> {timeAgo(t.detectedAt)} · {t.region}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <PriorityBadge priority={t.severity} />
                        <StatusBadge status={t.status} />
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="hud-card sticky top-6 rounded-[var(--radius-card)] border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)]/80 p-6 backdrop-blur">
            <h3 className="flex items-center gap-2 text-[15px] font-semibold tracking-tight text-[color:var(--color-ink-0)]">
              <FileText className="h-4 w-4 text-[color:var(--color-amber-400)]" /> Command Briefing
            </h3>
            <p className="mt-1 text-sm text-[color:var(--color-ink-3)]">Generate a real-time situation report from live theatre data.</p>

            {!briefing && !generating && (
              <Button className="mt-4 w-full" icon={<Sparkles />} onClick={handleGenerate}>Generate Briefing</Button>
            )}

            {generating && (
              <div className="mt-4 space-y-2.5">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-24 w-full" />
              </div>
            )}

            <AnimatePresence>
              {briefing && !generating && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                  className="mt-4 space-y-4"
                >
                  <p className="text-xs text-[color:var(--color-ink-4)]">Generated {formatDateTime(briefing.generatedAt)}</p>

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--color-sentinel-400)]">Executive Summary</p>
                    <p className="mt-1.5 text-sm leading-relaxed text-[color:var(--color-ink-1)]">{briefing.executiveSummary}</p>
                  </div>

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--color-sentinel-400)]">Mission Status</p>
                    <ul className="mt-1.5 space-y-1">
                      {briefing.missionStatus.map((line, i) => (
                        <li key={i} className="text-xs leading-relaxed text-[color:var(--color-ink-2)]">• {line}</li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--color-danger-400)]">Threat Assessment</p>
                    <ul className="mt-1.5 space-y-1">
                      {briefing.threatAssessment.map((line, i) => (
                        <li key={i} className="text-xs leading-relaxed text-[color:var(--color-ink-2)]">• {line}</li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--color-success-400)]">Personnel Readiness</p>
                    <p className="mt-1.5 text-xs leading-relaxed text-[color:var(--color-ink-2)]">{briefing.personnelReadiness}</p>
                  </div>

                  <div className="rounded-xl border border-[color:var(--color-amber-500)]/25 bg-[color:var(--color-amber-500)]/8 p-3.5">
                    <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--color-amber-400)]">Recommendation</p>
                    <p className="mt-1.5 text-xs leading-relaxed text-[color:var(--color-ink-1)]">{briefing.recommendation}</p>
                  </div>

                  <div className="flex gap-2 border-t border-[color:var(--color-border)] pt-4">
                    <Button variant="outline" size="sm" className="flex-1" icon={<Sparkles />} onClick={handleGenerate}>Regenerate</Button>
                    <Button size="sm" className="flex-1" icon={<Send />} loading={broadcasting} onClick={handleBroadcast}>Broadcast</Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
