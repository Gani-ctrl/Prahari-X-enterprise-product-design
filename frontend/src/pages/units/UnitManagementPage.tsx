import { useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import {
  Users,
  Building2,
  ShieldCheck,
  Crosshair,
  ArrowRightLeft,
  MapPin,
  Boxes,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { StatCard } from "@/components/ui/StatCard";
import { StatusBadge } from "@/components/ui/Badge";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Avatar } from "@/components/ui/Avatar";
import { Drawer } from "@/components/ui/Drawer";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { Skeleton } from "@/components/ui/Skeleton";
import { personnelApi, missionsApi, assetsApi } from "@/services/api";
import { toast } from "@/store/toastStore";
import { UNITS } from "@/lib/mockData";
import type { Asset, Mission, Personnel } from "@/types";

interface UnitSummary {
  unit: string;
  members: Personnel[];
  lead: Personnel | null;
  avgPerformance: number;
  avgHealth: number;
  deployedCount: number;
  activeMissions: Mission[];
  equipment: Asset[];
}

export default function UnitManagementPage() {
  const [personnel, setPersonnel] = useState<Personnel[]>([]);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewingUnit, setViewingUnit] = useState<string | null>(null);
  const [reassigning, setReassigning] = useState<Personnel | null>(null);
  const [newUnit, setNewUnit] = useState("");

  async function load() {
    setIsLoading(true);
    const [p, m, a] = await Promise.all([personnelApi.list(), missionsApi.list(), assetsApi.list()]);
    setPersonnel(p);
    setMissions(m);
    setAssets(a);
    setIsLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  const units: UnitSummary[] = useMemo(() => {
    const byUnit = new Map<string, Personnel[]>();
    personnel.forEach((p) => byUnit.set(p.unit, [...(byUnit.get(p.unit) ?? []), p]));

    return Array.from(byUnit.entries()).map(([unit, members]) => {
      const lead = [...members].sort((a, b) => b.performanceScore - a.performanceScore)[0] ?? null;
      const memberIds = new Set(members.map((m) => m.id));
      const activeMissions = missions.filter((m) => m.status === "active" && m.squadIds.some((id) => memberIds.has(id)));
      const equipmentIds = new Set(activeMissions.flatMap((m) => m.equipmentIds));
      return {
        unit,
        members,
        lead,
        avgPerformance: Math.round(members.reduce((s, m) => s + m.performanceScore, 0) / members.length),
        avgHealth: Math.round(members.reduce((s, m) => s + m.healthScore, 0) / members.length),
        deployedCount: members.filter((m) => m.status === "deployed").length,
        activeMissions,
        equipment: assets.filter((a) => equipmentIds.has(a.id)),
      };
    });
  }, [personnel, missions, assets]);

  const stats = useMemo(() => {
    const totalDeployed = units.reduce((s, u) => s + u.deployedCount, 0);
    const avgReadiness = units.length ? Math.round(units.reduce((s, u) => s + u.avgPerformance, 0) / units.length) : 0;
    const unitsWithActiveMissions = units.filter((u) => u.activeMissions.length > 0).length;
    return { totalUnits: units.length, totalPersonnel: personnel.length, avgReadiness, totalDeployed, unitsWithActiveMissions };
  }, [units, personnel]);

  const viewing = units.find((u) => u.unit === viewingUnit) ?? null;

  async function handleReassign() {
    if (!reassigning || !newUnit) return;
    const updated = await personnelApi.update(reassigning.id, { unit: newUnit });
    setPersonnel((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    toast.success("Personnel reassigned", `${reassigning.name} moved to ${newUnit}.`);
    setReassigning(null);
    setNewUnit("");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2.5 text-2xl font-semibold tracking-tight text-[color:var(--color-ink-0)]">
          <Building2 className="h-6 w-6 text-[color:var(--color-sentinel-400)]" />
          Unit Management
        </h1>
        <p className="mt-1 text-sm text-[color:var(--color-ink-3)]">{stats.totalUnits} units · {stats.totalPersonnel} personnel under command</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Active Units" value={stats.totalUnits} icon={<Building2 />} tone="sentinel" index={0} />
        <StatCard label="Avg Unit Readiness" value={stats.avgReadiness} suffix="%" icon={<ShieldCheck />} tone="success" index={1} />
        <StatCard label="Personnel Deployed" value={stats.totalDeployed} icon={<Users />} tone="amber" index={2} />
        <StatCard label="Units on Active Missions" value={stats.unitsWithActiveMissions} icon={<Crosshair />} tone="danger" index={3} />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-48 rounded-[var(--radius-card)]" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {units.map((u, index) => (
            <motion.div
              key={u.unit}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.05, ease: [0.16, 1, 0.3, 1] }}
              whileHover={{ y: -3 }}
              className="hud-card rounded-[var(--radius-card)] border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] p-6"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-base font-semibold text-[color:var(--color-ink-0)]">{u.unit}</p>
                  <p className="mt-0.5 text-xs text-[color:var(--color-ink-3)]">
                    {u.lead ? `Led by ${u.lead.rank} ${u.lead.name}` : "No lead assigned"}
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={() => setViewingUnit(u.unit)}>View Roster</Button>
              </div>

              <div className="mt-4 flex -space-x-2">
                {u.members.slice(0, 8).map((m) => (
                  <Avatar key={m.id} seed={m.avatarSeed} name={m.name} size="sm" ring />
                ))}
                {u.members.length > 8 && (
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[color:var(--color-surface-3)] text-[10px] font-medium text-[color:var(--color-ink-2)] ring-2 ring-[color:var(--color-surface-2)]">
                    +{u.members.length - 8}
                  </div>
                )}
              </div>

              <div className="mt-5 grid grid-cols-2 gap-4">
                <div>
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="text-[color:var(--color-ink-3)]">Readiness</span>
                    <span className="mono-tag font-medium text-[color:var(--color-ink-1)]">{u.avgPerformance}%</span>
                  </div>
                  <ProgressBar value={u.avgPerformance} tone={u.avgPerformance > 70 ? "success" : u.avgPerformance > 40 ? "amber" : "danger"} />
                </div>
                <div>
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="text-[color:var(--color-ink-3)]">Health</span>
                    <span className="mono-tag font-medium text-[color:var(--color-ink-1)]">{u.avgHealth}%</span>
                  </div>
                  <ProgressBar value={u.avgHealth} tone={u.avgHealth > 70 ? "success" : u.avgHealth > 40 ? "amber" : "danger"} />
                </div>
              </div>

              <div className="mt-5 flex items-center gap-5 border-t border-[color:var(--color-border)] pt-4 text-xs text-[color:var(--color-ink-4)]">
                <span className="flex items-center gap-1.5"><Users className="h-3.5 w-3.5" /> {u.members.length} personnel</span>
                <span className="flex items-center gap-1.5"><Crosshair className="h-3.5 w-3.5" /> {u.activeMissions.length} active missions</span>
                <span className="flex items-center gap-1.5"><Boxes className="h-3.5 w-3.5" /> {u.equipment.length} equipment</span>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <Drawer open={Boolean(viewing)} onOpenChange={(v) => !v && setViewingUnit(null)} title={viewing?.unit ?? "Unit"} width="lg">
        {viewing && (
          <div className="space-y-6">
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-2xl border border-[color:var(--color-border)] p-3.5 text-center">
                <p className="mono-tag text-xl font-semibold text-[color:var(--color-ink-0)]">{viewing.members.length}</p>
                <p className="mt-1 text-[10px] uppercase tracking-wide text-[color:var(--color-ink-3)]">Personnel</p>
              </div>
              <div className="rounded-2xl border border-[color:var(--color-border)] p-3.5 text-center">
                <p className="mono-tag text-xl font-semibold text-[color:var(--color-ink-0)]">{viewing.avgPerformance}%</p>
                <p className="mt-1 text-[10px] uppercase tracking-wide text-[color:var(--color-ink-3)]">Readiness</p>
              </div>
              <div className="rounded-2xl border border-[color:var(--color-border)] p-3.5 text-center">
                <p className="mono-tag text-xl font-semibold text-[color:var(--color-ink-0)]">{viewing.activeMissions.length}</p>
                <p className="mt-1 text-[10px] uppercase tracking-wide text-[color:var(--color-ink-3)]">Active Missions</p>
              </div>
            </div>

            <div>
              <p className="mb-2 text-sm font-medium text-[color:var(--color-ink-0)]">Roster</p>
              <div className="space-y-2">
                {viewing.members.map((m) => (
                  <div key={m.id} className="flex items-center justify-between gap-3 rounded-xl border border-[color:var(--color-border)] p-3">
                    <div className="flex items-center gap-3">
                      <Avatar seed={m.avatarSeed} name={m.name} size="sm" />
                      <div>
                        <p className="text-sm text-[color:var(--color-ink-1)]">{m.rank} {m.name}</p>
                        <p className="text-xs text-[color:var(--color-ink-4)]">{m.roleTitle} · <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" />{m.location}</span></p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={m.status} />
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={<ArrowRightLeft />}
                        onClick={() => { setReassigning(m); setNewUnit(viewing.unit); }}
                      >
                        Reassign
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {viewing.activeMissions.length > 0 && (
              <div>
                <p className="mb-2 text-sm font-medium text-[color:var(--color-ink-0)]">Active Missions</p>
                <div className="space-y-2">
                  {viewing.activeMissions.map((m) => (
                    <div key={m.id} className="flex items-center justify-between rounded-xl border border-[color:var(--color-border)] p-3">
                      <div>
                        <p className="text-sm text-[color:var(--color-ink-1)]">{m.name}</p>
                        <p className="mono-tag text-xs text-[color:var(--color-ink-4)]">{m.code}</p>
                      </div>
                      <StatusBadge status={m.status} />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Drawer>

      <Modal
        open={Boolean(reassigning)}
        onOpenChange={(v) => !v && setReassigning(null)}
        title="Reassign personnel"
        description={reassigning?.name}
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setReassigning(null)}>Cancel</Button>
            <Button onClick={handleReassign} disabled={!newUnit || newUnit === reassigning?.unit}>Reassign</Button>
          </>
        }
      >
        <Select label="New unit" value={newUnit} onValueChange={setNewUnit} options={UNITS.map((u) => ({ label: u, value: u }))} />
      </Modal>
    </div>
  );
}
