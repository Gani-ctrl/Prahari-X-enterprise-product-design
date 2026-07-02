import { useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import {
  MapPinned,
  Building,
  Users,
  Boxes,
  Crosshair,
  Siren,
  ShieldAlert,
  HeartPulse,
  Wrench,
  Megaphone,
} from "lucide-react";
import { Tabs, TabPanel } from "@/components/ui/Tabs";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Badge, StatusBadge, PriorityBadge } from "@/components/ui/Badge";
import { StatCard } from "@/components/ui/StatCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { Modal } from "@/components/ui/Modal";
import { Textarea } from "@/components/ui/Input";
import { Skeleton } from "@/components/ui/Skeleton";
import { REGIONS } from "@/lib/mockData";
import { personnelApi, assetsApi, missionsApi, threatsApi, notificationsApi } from "@/services/api";
import { toast } from "@/store/toastStore";
import { BaseTacticalMap, type ReadinessLevel } from "./BaseTacticalMap";
import { LiveScannerBanner } from "./LiveScannerBanner";
import type { Asset, Mission, Personnel, ThreatReport } from "@/types";

const SEVERITY_RANK: Record<string, number> = { critical: 3, high: 2, medium: 1, low: 0 };

export default function BaseEmergencyPage() {
  const [tab, setTab] = useState<"bases" | "emergency">("bases");
  const [personnel, setPersonnel] = useState<Personnel[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [threats, setThreats] = useState<ThreatReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [declaring, setDeclaring] = useState(false);
  const [emergencyRegion, setEmergencyRegion] = useState(REGIONS[0]);
  const [emergencyNote, setEmergencyNote] = useState("");
  const [sending, setSending] = useState(false);

  async function load() {
    setIsLoading(true);
    const [p, a, m, t] = await Promise.all([personnelApi.list(), assetsApi.list(), missionsApi.list(), threatsApi.list()]);
    setPersonnel(p);
    setAssets(a);
    setMissions(m);
    setThreats(t);
    setIsLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  const bases = useMemo(() => {
    return REGIONS.map((region) => {
      const stationed = personnel.filter((p) => p.location === region);
      const regionAssets = assets.filter((a) => a.location === region);
      const regionMissions = missions.filter((m) => m.region === region && m.status === "active");
      const regionThreats = threats.filter((t) => t.region === region && t.status !== "neutralized");
      const worstSeverity = regionThreats.reduce((worst, t) => (SEVERITY_RANK[t.severity] > SEVERITY_RANK[worst] ? t.severity : worst), "low");
      const maintenanceCount = regionAssets.filter((a) => a.status === "maintenance").length;
      const readiness: ReadinessLevel =
        worstSeverity === "critical" ? "red" : worstSeverity === "high" ? "orange" : worstSeverity === "medium" || maintenanceCount > 0 ? "yellow" : "green";
      return { region, stationed, regionAssets, regionMissions, regionThreats, worstSeverity, readiness };
    });
  }, [personnel, assets, missions, threats]);

  const baseStats = useMemo(() => {
    const basesUnderThreat = bases.filter((b) => b.regionThreats.length > 0).length;
    return {
      totalBases: bases.length,
      deployedPersonnel: personnel.filter((p) => p.status === "deployed").length,
      stationedAssets: assets.length,
      basesUnderThreat,
    };
  }, [bases, personnel, assets]);

  const criticalThreats = useMemo(
    () => threats.filter((t) => t.status === "active" && (t.severity === "critical" || t.severity === "high")).sort((a, b) => SEVERITY_RANK[b.severity] - SEVERITY_RANK[a.severity]),
    [threats]
  );
  const medicalFlags = useMemo(() => personnel.filter((p) => p.status === "medical" || p.healthScore < 40), [personnel]);
  const maintenanceAssets = useMemo(() => assets.filter((a) => a.status === "maintenance"), [assets]);

  async function declareEmergency() {
    setSending(true);
    try {
      const created = await notificationsApi.create({
        title: `Emergency declared — ${emergencyRegion}`,
        message: emergencyNote.trim() || `All units in ${emergencyRegion} moving to emergency response posture. Await further instructions.`,
        type: "system",
        severity: "critical",
      });
      toast.success("Emergency declared", `${emergencyRegion} — all command staff notified.`);
      setDeclaring(false);
      setEmergencyNote("");
      void created;
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="flex items-center gap-2.5 text-2xl font-semibold tracking-tight text-[color:var(--color-ink-0)]">
            <MapPinned className="h-6 w-6 text-[color:var(--color-danger-400)]" />
            Base Management &amp; Emergency Response
          </h1>
          <p className="mt-1 text-sm text-[color:var(--color-ink-3)]">Sector-level force posture and crisis escalation</p>
        </div>
        <Button variant="danger" icon={<Siren />} onClick={() => setDeclaring(true)}>Declare Emergency</Button>
      </div>

      <Tabs
        tabs={[
          { value: "bases", label: "Base Management" },
          { value: "emergency", label: "Emergency Response" },
        ]}
        value={tab}
        onValueChange={(v) => setTab(v as any)}
      >
        <TabPanel value="bases" className="pt-6">
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard label="Bases / Sectors" value={baseStats.totalBases} icon={<Building />} tone="sentinel" index={0} />
              <StatCard label="Personnel Deployed" value={baseStats.deployedPersonnel} icon={<Users />} tone="success" index={1} />
              <StatCard label="Assets Stationed" value={baseStats.stationedAssets} icon={<Boxes />} tone="amber" index={2} />
              <StatCard label="Bases Under Threat" value={baseStats.basesUnderThreat} icon={<ShieldAlert />} tone="danger" index={3} />
            </div>

            {!isLoading && (
              <BaseTacticalMap
                bases={bases.map((b) => ({
                  region: b.region,
                  readiness: b.readiness,
                  personnel: b.stationed.length,
                  assets: b.regionAssets.length,
                  missions: b.regionMissions.length,
                }))}
              />
            )}

            {isLoading ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-44 rounded-[var(--radius-card)]" />)}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {bases.map((b, index) => (
                  <motion.div
                    key={b.region}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.04, ease: [0.16, 1, 0.3, 1] }}
                    whileHover={{ y: -3 }}
                    className="hud-card rounded-[var(--radius-card)] border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] p-5"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[color:var(--color-sentinel-500)]/12 text-[color:var(--color-sentinel-400)]">
                          <Building className="h-[18px] w-[18px]" />
                        </div>
                        <p className="font-medium text-[color:var(--color-ink-0)]">{b.region}</p>
                      </div>
                      {b.regionThreats.length > 0 ? (
                        <Badge tone={b.worstSeverity === "critical" ? "danger" : "warning"} dot>{b.regionThreats.length} threat{b.regionThreats.length > 1 ? "s" : ""}</Badge>
                      ) : (
                        <Badge tone="success" dot>Secure</Badge>
                      )}
                    </div>
                    <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                      <div className="rounded-xl border border-[color:var(--color-border)] py-2.5">
                        <p className="mono-tag text-base font-semibold text-[color:var(--color-ink-0)]">{b.stationed.length}</p>
                        <p className="mt-0.5 text-[10px] uppercase tracking-wide text-[color:var(--color-ink-4)]">Personnel</p>
                      </div>
                      <div className="rounded-xl border border-[color:var(--color-border)] py-2.5">
                        <p className="mono-tag text-base font-semibold text-[color:var(--color-ink-0)]">{b.regionAssets.length}</p>
                        <p className="mt-0.5 text-[10px] uppercase tracking-wide text-[color:var(--color-ink-4)]">Assets</p>
                      </div>
                      <div className="rounded-xl border border-[color:var(--color-border)] py-2.5">
                        <p className="mono-tag text-base font-semibold text-[color:var(--color-ink-0)]">{b.regionMissions.length}</p>
                        <p className="mt-0.5 text-[10px] uppercase tracking-wide text-[color:var(--color-ink-4)]">Missions</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </TabPanel>

        <TabPanel value="emergency" className="pt-6">
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard label="Critical / High Threats" value={criticalThreats.length} icon={<Crosshair />} tone="danger" index={0} />
              <StatCard label="Medical Flags" value={medicalFlags.length} icon={<HeartPulse />} tone="amber" index={1} />
              <StatCard label="Assets in Maintenance" value={maintenanceAssets.length} icon={<Wrench />} tone="sentinel" index={2} />
              <StatCard label="Bases Under Threat" value={baseStats.basesUnderThreat} icon={<ShieldAlert />} tone="danger" index={3} />
            </div>

            <LiveScannerBanner activeCount={criticalThreats.length} />

            <div className="rounded-[var(--radius-card)] border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] p-6">
              <h3 className="flex items-center gap-2 text-[15px] font-semibold tracking-tight text-[color:var(--color-ink-0)]">
                <Megaphone className="h-4 w-4 text-[color:var(--color-danger-400)]" /> Active Escalation Watchlist
              </h3>
              <p className="mt-1 text-sm text-[color:var(--color-ink-3)]">Critical and high-severity threats requiring command attention.</p>

              {criticalThreats.length === 0 ? (
                <div className="mt-4"><EmptyState icon={<ShieldAlert />} title="No critical threats active" description="All sectors currently within acceptable risk thresholds." /></div>
              ) : (
                <div className="mt-4 space-y-2.5">
                  {criticalThreats.map((t) => (
                    <div key={t.id} className="flex items-center justify-between gap-4 rounded-xl border border-[color:var(--color-border)] p-3.5">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-[color:var(--color-ink-1)]">{t.title}</p>
                        <p className="text-xs text-[color:var(--color-ink-4)]">{t.region} · {t.category}</p>
                      </div>
                      <div className="flex shrink-0 items-center gap-3">
                        <PriorityBadge priority={t.severity} />
                        <StatusBadge status={t.status} />
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => { setEmergencyRegion(t.region); setEmergencyNote(`Escalation triggered by threat: ${t.title}.`); setDeclaring(true); }}
                        >
                          Escalate
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </TabPanel>
      </Tabs>

      <Modal
        open={declaring}
        onOpenChange={setDeclaring}
        title="Declare emergency"
        description="Broadcasts an immediate, critical-priority alert to command staff."
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setDeclaring(false)}>Cancel</Button>
            <Button variant="danger" loading={sending} onClick={declareEmergency}>Declare Emergency</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Select label="Affected sector" value={emergencyRegion} onValueChange={setEmergencyRegion} options={REGIONS.map((r) => ({ label: r, value: r }))} />
          <Textarea label="Situation note (optional)" placeholder="Brief description of the emergency…" value={emergencyNote} onChange={(e) => setEmergencyNote(e.target.value)} />
        </div>
      </Modal>
    </div>
  );
}
