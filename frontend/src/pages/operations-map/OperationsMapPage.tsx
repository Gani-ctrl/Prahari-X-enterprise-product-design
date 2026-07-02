import { useCallback, useEffect, useState } from "react";
import { Radar, ShieldAlert, Siren, Truck } from "lucide-react";
import { StatCard } from "@/components/ui/StatCard";
import { SkeletonCard } from "@/components/ui/Skeleton";
import { usePolling } from "@/hooks/usePolling";
import { personnelApi, assetsApi, missionsApi, threatsApi, patrolRoutesApi, reportsApi, squadsApi, assignmentsApi } from "@/services/api";
import { REGIONS } from "@/lib/mockData";
import { LiveOperationsMap } from "./LiveOperationsMap";
import type { Asset, Assignment, FieldReport, Mission, PatrolRoute, Personnel, Squad, ThreatReport } from "@/types";

export default function OperationsMapPage() {
  const [personnel, setPersonnel] = useState<Personnel[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [threats, setThreats] = useState<ThreatReport[]>([]);
  const [patrolRoutes, setPatrolRoutes] = useState<PatrolRoute[]>([]);
  const [reports, setReports] = useState<FieldReport[]>([]);
  const [squads, setSquads] = useState<Squad[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(() => {
    Promise.all([
      personnelApi.list(),
      assetsApi.list(),
      missionsApi.list(),
      threatsApi.list(),
      patrolRoutesApi.list(),
      reportsApi.list(),
      squadsApi.list(),
      assignmentsApi.list(),
    ]).then(([p, a, m, t, pr, r, sq, asg]) => {
      setPersonnel(p);
      setAssets(a);
      setMissions(m);
      setThreats(t);
      setPatrolRoutes(pr);
      setReports(r);
      setSquads(sq);
      setAssignments(asg);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  usePolling(refresh, 20_000);

  // Field reports don't carry a region directly — resolve one via the
  // linked mission when present, otherwise fall back to the first region so
  // an unlinked emergency still surfaces on the map rather than vanishing.
  const incidentsWithRegion = reports
    .filter((r) => (r.type === "incident" || r.type === "emergency_alert") && r.status !== "resolved")
    .map((r) => {
      const mission = r.mission ? missions.find((m) => m.id === r.mission!.id) : undefined;
      return { id: r.id, title: r.title, region: mission?.region ?? REGIONS[0] };
    });

  const activeThreats = threats.filter((t) => t.status !== "neutralized").length;
  const vehiclesTracked = assets.filter((a) => a.category === "vehicle" || a.category === "drone").length;
  const openIncidents = incidentsWithRegion.length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2.5 text-2xl font-semibold tracking-tight text-[color:var(--color-ink-0)]">
          <Radar className="h-6 w-6 text-[color:var(--color-sentinel-400)]" />
          Live Operations Map
        </h1>
        <p className="mt-1 text-sm text-[color:var(--color-ink-3)]">
          Bases, soldiers, squads, vehicles, missions, patrol routes, and threat zones — live from the database.
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <StatCard index={0} label="Bases / Sectors" value={REGIONS.length} icon={<Radar />} tone="sentinel" />
          <StatCard index={1} label="Vehicles & Drones" value={vehiclesTracked} icon={<Truck />} tone="amber" />
          <StatCard index={2} label="Active Threat Zones" value={activeThreats} icon={<ShieldAlert />} tone="danger" />
          <StatCard index={3} label="Open Incidents" value={openIncidents} icon={<Siren />} tone="danger" />
        </div>
      )}

      {!loading && (
        <LiveOperationsMap
          regions={REGIONS}
          personnel={personnel}
          assets={assets}
          missions={missions}
          threats={threats}
          patrolRoutes={patrolRoutes}
          emergencyIncidents={incidentsWithRegion}
        />
      )}
    </div>
  );
}
