import { motion, AnimatePresence } from "motion/react";
import { X, Building, User, Truck, Crosshair, Users, ShieldAlert, Siren, MapPin } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { PriorityBadge, StatusBadge, Badge } from "@/components/ui/Badge";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { formatDate } from "@/lib/utils";
import { READINESS_META, type ReadinessLevel } from "./mapGeo";
import type { Asset, Assignment, Mission, Personnel, RoutePoint, Squad, ThreatReport } from "@/types";

export type SelectedEntity =
  | { kind: "base"; region: string; readiness: ReadinessLevel; personnelCount: number; commander: string | null; activeMissions: Mission[]; assetCount: number }
  | { kind: "soldier"; personnel: Personnel; weapon: Assignment | null; mission: Mission | null }
  | { kind: "vehicle"; asset: Asset; mission: Mission | null }
  | { kind: "mission"; mission: Mission; squad: Squad | null }
  | { kind: "squad"; squad: Squad }
  | { kind: "threat"; threat: ThreatReport }
  | { kind: "incident"; incident: { id: string; title: string; region: string } }
  | { kind: "waypoint"; point: RoutePoint; routeName: string };

const ICONS: Record<SelectedEntity["kind"], typeof Building> = {
  base: Building,
  soldier: User,
  vehicle: Truck,
  mission: Crosshair,
  squad: Users,
  threat: ShieldAlert,
  incident: Siren,
  waypoint: MapPin,
};

const TITLES: Record<SelectedEntity["kind"], string> = {
  base: "Base / Sector",
  soldier: "Soldier",
  vehicle: "Vehicle / Drone",
  mission: "Mission",
  squad: "Squad",
  threat: "Threat Report",
  incident: "Emergency Incident",
  waypoint: "Patrol Point",
};

/**
 * Professional HUD-style detail panel for whatever marker is currently
 * selected on the Live Operations Map. One component, one discriminated
 * union — adding a new marker type later means adding one case here.
 */
export function MapEntityPanel({ entity, onClose }: { entity: SelectedEntity | null; onClose: () => void }) {
  return (
    <AnimatePresence>
      {entity && (
        <motion.div
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 24 }}
          transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          className="glass-strong absolute right-3 top-3 z-20 w-[300px] max-w-[calc(100%-1.5rem)] overflow-hidden rounded-[var(--radius-card)] border border-[color:var(--color-sentinel-500)]/30 shadow-[var(--shadow-float)]"
        >
          <div className="flex items-center justify-between gap-2 border-b border-[color:var(--color-border)] bg-[color:var(--color-surface)]/80 px-4 py-3">
            <div className="flex items-center gap-2 text-[color:var(--color-sentinel-400)]">
              {(() => {
                const Icon = ICONS[entity.kind];
                return <Icon className="h-4 w-4" />;
              })()}
              <span className="text-xs font-medium uppercase tracking-wider">{TITLES[entity.kind]}</span>
            </div>
            <button onClick={onClose} className="rounded-md p-1 text-[color:var(--color-ink-3)] transition-colors hover:bg-white/5 hover:text-[color:var(--color-ink-0)]" aria-label="Close">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="max-h-[420px] overflow-y-auto p-4">
            {entity.kind === "base" && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-[color:var(--color-ink-0)]">{entity.region}</p>
                  <Badge tone={entity.readiness === "green" ? "success" : entity.readiness === "yellow" ? "warning" : "danger"} dot>
                    {READINESS_META[entity.readiness].label}
                  </Badge>
                </div>
                <Row label="Commander" value={entity.commander ?? "Unassigned"} />
                <Row label="Personnel stationed" value={String(entity.personnelCount)} />
                <Row label="Assets stationed" value={String(entity.assetCount)} />
                <Row label="Active missions" value={String(entity.activeMissions.length)} />
                {entity.activeMissions.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    {entity.activeMissions.slice(0, 3).map((m) => (
                      <div key={m.id} className="flex items-center justify-between rounded-lg border border-[color:var(--color-border)] px-2.5 py-1.5 text-xs">
                        <span className="truncate text-[color:var(--color-ink-1)]">{m.name}</span>
                        <PriorityBadge priority={m.priority} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {entity.kind === "soldier" && (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Avatar seed={entity.personnel.avatarSeed} name={entity.personnel.name} size="md" />
                  <div>
                    <p className="text-sm font-semibold text-[color:var(--color-ink-0)]">{entity.personnel.rank} {entity.personnel.name}</p>
                    <p className="text-xs text-[color:var(--color-ink-3)]">{entity.personnel.roleTitle}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2"><StatusBadge status={entity.personnel.status} /></div>
                <Row label="Unit" value={entity.personnel.unit} />
                <Row label="Location" value={entity.personnel.location} />
                <Row label="Assigned mission" value={entity.mission?.name ?? "None"} />
                <Row label="Assigned weapon" value={entity.weapon?.title ?? "None issued"} />
                <div>
                  <p className="mb-1 text-[10px] uppercase tracking-wide text-[color:var(--color-ink-4)]">Performance</p>
                  <ProgressBar value={entity.personnel.performanceScore} tone="success" showLabel />
                </div>
              </div>
            )}

            {entity.kind === "vehicle" && (
              <div className="space-y-3">
                <p className="text-sm font-semibold text-[color:var(--color-ink-0)]">{entity.asset.name}</p>
                <Row label="Model" value={entity.asset.model} />
                <Row label="Category" value={entity.asset.category} />
                <div className="flex items-center gap-2"><StatusBadge status={entity.asset.status} /></div>
                <Row label="Location" value={entity.asset.location} />
                <Row label="Assigned mission" value={entity.mission?.name ?? "Unassigned"} />
                <div>
                  <p className="mb-1 text-[10px] uppercase tracking-wide text-[color:var(--color-ink-4)]">Condition</p>
                  <ProgressBar value={entity.asset.condition} tone={entity.asset.condition > 70 ? "success" : "amber"} showLabel />
                </div>
              </div>
            )}

            {entity.kind === "mission" && (
              <div className="space-y-3">
                <p className="text-sm font-semibold text-[color:var(--color-ink-0)]">{entity.mission.name}</p>
                <p className="mono-tag text-xs text-[color:var(--color-ink-3)]">{entity.mission.code}</p>
                <div className="flex items-center gap-2"><PriorityBadge priority={entity.mission.priority} /><StatusBadge status={entity.mission.status} /></div>
                <Row label="Commander" value={entity.mission.commanderName} />
                <Row label="Region" value={entity.mission.region} />
                <Row label="Squad" value={entity.squad?.name ?? `${entity.mission.squadIds.length} personnel (unnamed)`} />
                <Row label="Timeline" value={`${formatDate(entity.mission.startDate)} – ${formatDate(entity.mission.endDate)}`} />
                <div>
                  <p className="mb-1 text-[10px] uppercase tracking-wide text-[color:var(--color-ink-4)]">Progress</p>
                  <ProgressBar value={entity.mission.progress} showLabel />
                </div>
              </div>
            )}

            {entity.kind === "squad" && (
              <div className="space-y-3">
                <p className="text-sm font-semibold text-[color:var(--color-ink-0)]">{entity.squad.name}</p>
                <Row label="Unit" value={entity.squad.unit} />
                <Row label="Team leader" value={entity.squad.leader ? `${entity.squad.leader.rank} ${entity.squad.leader.name}` : "Unassigned"} />
                <Row label="Members" value={String(entity.squad.members.length)} />
                <div className="flex -space-x-2 pt-1">
                  {entity.squad.members.slice(0, 8).map((m) => (
                    <Avatar key={m.id} seed={m.personnel.avatarSeed} name={m.personnel.name} size="sm" ring />
                  ))}
                </div>
              </div>
            )}

            {entity.kind === "threat" && (
              <div className="space-y-3">
                <p className="text-sm font-semibold text-[color:var(--color-ink-0)]">{entity.threat.title}</p>
                <div className="flex items-center gap-2"><PriorityBadge priority={entity.threat.severity} /><StatusBadge status={entity.threat.status} /></div>
                <Row label="Category" value={entity.threat.category} />
                <Row label="Region" value={entity.threat.region} />
                <Row label="Source" value={entity.threat.source} />
                <Row label="AI confidence" value={`${entity.threat.aiConfidence}%`} />
                {entity.threat.recommendation && (
                  <div className="rounded-lg border border-[color:var(--color-border)] bg-white/[0.02] p-2.5 text-xs text-[color:var(--color-ink-2)]">
                    {entity.threat.recommendation}
                  </div>
                )}
              </div>
            )}

            {entity.kind === "incident" && (
              <div className="space-y-3">
                <p className="text-sm font-semibold text-[color:var(--color-danger-400)]">{entity.incident.title}</p>
                <Row label="Region" value={entity.incident.region} />
                <p className="text-xs text-[color:var(--color-ink-3)]">Full details are in the Approvals / Field Reports queue.</p>
              </div>
            )}

            {entity.kind === "waypoint" && (
              <div className="space-y-3">
                <p className="text-sm font-semibold text-[color:var(--color-ink-0)]">{entity.point.label}</p>
                <Row label="Route" value={entity.routeName} />
                <Row label="Type" value={entity.point.kind} />
                <Row label="Location" value={entity.point.location} />
                <div className="flex items-center gap-2"><StatusBadge status={entity.point.status} /></div>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 text-xs">
      <span className="text-[color:var(--color-ink-4)]">{label}</span>
      <span className="truncate text-right font-medium text-[color:var(--color-ink-1)]">{value}</span>
    </div>
  );
}
