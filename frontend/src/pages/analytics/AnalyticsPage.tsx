import { useEffect, useMemo, useState } from "react";
import { BarChart3, Target, Users, Boxes, Swords, Package, Truck, GraduationCap, TrendingUp, ShieldAlert, Gauge, Building } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { DonutChart } from "@/components/charts/DonutChart";
import { BarChartPanel } from "@/components/charts/BarChartPanel";
import { TrendAreaChart } from "@/components/charts/TrendAreaChart";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { SkeletonCard } from "@/components/ui/Skeleton";
import { REGIONS } from "@/lib/mockData";
import { missionsApi, personnelApi, assetsApi, inventoryApi, trainingApi, threatsApi } from "@/services/api";
import type { Asset, InventoryItem, Mission, Personnel, ThreatReport, TrainingProgram } from "@/types";

const SEVERITY_RANK: Record<string, number> = { critical: 3, high: 2, medium: 1, low: 0 };

export default function AnalyticsPage() {
  const [missions, setMissions] = useState<Mission[]>([]);
  const [personnel, setPersonnel] = useState<Personnel[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [training, setTraining] = useState<TrainingProgram[]>([]);
  const [threats, setThreats] = useState<ThreatReport[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([missionsApi.list(), personnelApi.list(), assetsApi.list(), inventoryApi.list(), trainingApi.list(), threatsApi.list()]).then(
      ([m, p, a, inv, tr, t]) => {
        setMissions(m);
        setPersonnel(p);
        setAssets(a);
        setInventory(inv);
        setTraining(tr);
        setThreats(t);
        setLoading(false);
      }
    );
  }, []);

  // 1. Mission success rate
  const missionOutcomes = useMemo(() => {
    const completed = missions.filter((m) => m.status === "completed").length;
    const aborted = missions.filter((m) => m.status === "aborted").length;
    const decided = completed + aborted;
    return { completed, aborted, rate: decided > 0 ? Math.round((completed / decided) * 100) : 0 };
  }, [missions]);

  // 2. Deployment statistics
  const deploymentData = useMemo(
    () => [
      { label: "Available", value: personnel.filter((p) => p.status === "available").length, color: "var(--color-success-500)" },
      { label: "Deployed", value: personnel.filter((p) => p.status === "deployed").length, color: "var(--color-sentinel-500)" },
      { label: "Leave", value: personnel.filter((p) => p.status === "leave").length, color: "var(--color-ink-4)" },
      { label: "Medical", value: personnel.filter((p) => p.status === "medical").length, color: "var(--color-amber-500)" },
    ],
    [personnel]
  );

  // 3. Soldier readiness — avg performance/health by unit
  const readinessByUnit = useMemo(() => {
    const units = Array.from(new Set(personnel.map((p) => p.unit)));
    return units.map((unit) => {
      const inUnit = personnel.filter((p) => p.unit === unit);
      const avg = inUnit.reduce((s, p) => s + p.performanceScore, 0) / (inUnit.length || 1);
      return { label: unit, value: Math.round(avg) };
    });
  }, [personnel]);

  // 4. Equipment utilization
  const equipmentUtilization = useMemo(
    () => [
      { label: "Operational", value: assets.filter((a) => a.status === "operational").length, color: "var(--color-success-500)" },
      { label: "Deployed", value: assets.filter((a) => a.status === "deployed").length, color: "var(--color-sentinel-500)" },
      { label: "Maintenance", value: assets.filter((a) => a.status === "maintenance").length, color: "var(--color-amber-500)" },
      { label: "Decommissioned", value: assets.filter((a) => a.status === "decommissioned").length, color: "var(--color-ink-4)" },
    ],
    [assets]
  );

  // 5. Weapon inventory
  const weaponInventory = useMemo(
    () => inventory.filter((i) => i.category === "firearm").map((i) => ({ label: i.name, value: i.quantity })),
    [inventory]
  );

  // 6. Ammunition usage (current stock levels — consumption isn't tracked numerically yet, see FieldReport type=ammo_consumption for narrative reports)
  const ammoStock = useMemo(
    () => inventory.filter((i) => i.category === "ammunition").map((i) => ({ label: i.name, value: i.quantity })),
    [inventory]
  );

  // 7. Vehicle utilization
  const vehicleUtilization = useMemo(() => {
    const vehicles = assets.filter((a) => a.category === "vehicle" || a.category === "drone");
    return [
      { label: "Operational", value: vehicles.filter((v) => v.status === "operational").length, color: "var(--color-success-500)" },
      { label: "Deployed", value: vehicles.filter((v) => v.status === "deployed").length, color: "var(--color-sentinel-500)" },
      { label: "Maintenance", value: vehicles.filter((v) => v.status === "maintenance").length, color: "var(--color-amber-500)" },
    ];
  }, [assets]);

  // 8. Training completion
  const trainingCompletion = useMemo(() => training.map((t) => ({ label: t.name, value: t.completionRate })), [training]);

  // 9. Mission completion trend (last 7 days, by creation date bucketed — proxy for pipeline activity)
  const missionTrend = useMemo(() => {
    const days = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(Date.now() - (6 - i) * 86400000);
      d.setHours(0, 0, 0, 0);
      return d;
    });
    return days.map((day) => ({
      date: day.toISOString(),
      value: missions.filter((m) => new Date(m.createdAt).toDateString() === day.toDateString()).length,
    }));
  }, [missions]);

  // 10. Threat analysis
  const threatByCategory = useMemo(() => {
    const categories = Array.from(new Set(threats.map((t) => t.category)));
    return categories.map((c) => ({ label: c, value: threats.filter((t) => t.category === c).length }));
  }, [threats]);

  // 11. Operational efficiency — composite of mission success, personnel readiness, asset operational rate
  const operationalEfficiency = useMemo(() => {
    const personnelReady = personnel.length > 0 ? (personnel.filter((p) => p.status === "available" || p.status === "deployed").length / personnel.length) * 100 : 0;
    const assetsReady = assets.length > 0 ? (assets.filter((a) => a.status === "operational" || a.status === "deployed").length / assets.length) * 100 : 0;
    const composite = Math.round((missionOutcomes.rate + personnelReady + assetsReady) / 3);
    return { missionRate: missionOutcomes.rate, personnelReady: Math.round(personnelReady), assetsReady: Math.round(assetsReady), composite };
  }, [personnel, assets, missionOutcomes]);

  // 12. Base readiness — by region, worst active threat severity
  const baseReadiness = useMemo(
    () =>
      REGIONS.map((region) => {
        const regionThreats = threats.filter((t) => t.region === region && t.status !== "neutralized");
        const worst = regionThreats.reduce((w, t) => (SEVERITY_RANK[t.severity] > SEVERITY_RANK[w] ? t.severity : w), "low");
        const score = worst === "critical" ? 25 : worst === "high" ? 50 : worst === "medium" ? 75 : 100;
        return { label: region, value: score, color: score === 100 ? "var(--color-success-500)" : score >= 75 ? "var(--color-amber-500)" : score >= 50 ? "#FF8A3D" : "var(--color-danger-500)" };
      }),
    [threats]
  );

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 9 }).map((_, i) => <SkeletonCard key={i} />)}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2.5 text-2xl font-semibold tracking-tight text-[color:var(--color-ink-0)]">
          <BarChart3 className="h-6 w-6 text-[color:var(--color-sentinel-400)]" />
          Analytics
        </h1>
        <p className="mt-1 text-sm text-[color:var(--color-ink-3)]">Force-wide operational analytics — every chart computed live from the database.</p>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
        <Card>
          <CardHeader><div className="flex items-center gap-2"><Target className="h-4 w-4 text-[color:var(--color-sentinel-400)]" /><CardTitle>Mission Success Rate</CardTitle></div></CardHeader>
          <CardContent className="flex flex-col items-center">
            <DonutChart data={[
              { label: "Completed", value: missionOutcomes.completed, color: "var(--color-success-500)" },
              { label: "Aborted", value: missionOutcomes.aborted, color: "var(--color-danger-500)" },
            ]} />
            <p className="mt-3 mono-tag text-lg font-semibold text-[color:var(--color-ink-0)]">{missionOutcomes.rate}% success</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><div className="flex items-center gap-2"><Users className="h-4 w-4 text-[color:var(--color-sentinel-400)]" /><CardTitle>Deployment Statistics</CardTitle></div></CardHeader>
          <CardContent className="flex justify-center"><DonutChart data={deploymentData} /></CardContent>
        </Card>

        <Card>
          <CardHeader><div className="flex items-center gap-2"><Gauge className="h-4 w-4 text-[color:var(--color-sentinel-400)]" /><CardTitle>Soldier Readiness by Unit</CardTitle></div></CardHeader>
          <CardContent><BarChartPanel data={readinessByUnit} color="var(--color-success-500)" /></CardContent>
        </Card>

        <Card>
          <CardHeader><div className="flex items-center gap-2"><Boxes className="h-4 w-4 text-[color:var(--color-amber-400)]" /><CardTitle>Equipment Utilization</CardTitle></div></CardHeader>
          <CardContent className="flex justify-center"><DonutChart data={equipmentUtilization} /></CardContent>
        </Card>

        <Card>
          <CardHeader><div className="flex items-center gap-2"><Swords className="h-4 w-4 text-[color:var(--color-danger-400)]" /><CardTitle>Weapon Inventory</CardTitle></div></CardHeader>
          <CardContent><BarChartPanel data={weaponInventory} color="var(--color-danger-500)" /></CardContent>
        </Card>

        <Card>
          <CardHeader><div className="flex items-center gap-2"><Package className="h-4 w-4 text-[color:var(--color-amber-400)]" /><CardTitle>Ammunition Stock</CardTitle></div></CardHeader>
          <CardContent><BarChartPanel data={ammoStock} color="var(--color-amber-500)" /></CardContent>
        </Card>

        <Card>
          <CardHeader><div className="flex items-center gap-2"><Truck className="h-4 w-4 text-[color:var(--color-sentinel-400)]" /><CardTitle>Vehicle & Drone Utilization</CardTitle></div></CardHeader>
          <CardContent className="flex justify-center"><DonutChart data={vehicleUtilization} /></CardContent>
        </Card>

        <Card>
          <CardHeader><div className="flex items-center gap-2"><GraduationCap className="h-4 w-4 text-[color:var(--color-success-400)]" /><CardTitle>Training Completion</CardTitle></div></CardHeader>
          <CardContent><BarChartPanel data={trainingCompletion} color="var(--color-success-500)" /></CardContent>
        </Card>

        <Card>
          <CardHeader><div className="flex items-center gap-2"><TrendingUp className="h-4 w-4 text-[color:var(--color-sentinel-400)]" /><CardTitle>Mission Activity Trend (7d)</CardTitle></div></CardHeader>
          <CardContent><TrendAreaChart data={missionTrend} color="var(--color-sentinel-500)" /></CardContent>
        </Card>

        <Card>
          <CardHeader><div className="flex items-center gap-2"><ShieldAlert className="h-4 w-4 text-[color:var(--color-danger-400)]" /><CardTitle>Threat Analysis</CardTitle></div></CardHeader>
          <CardContent><BarChartPanel data={threatByCategory} color="var(--color-danger-500)" layout="horizontal" /></CardContent>
        </Card>

        <Card>
          <CardHeader><div className="flex items-center gap-2"><Gauge className="h-4 w-4 text-[color:var(--color-sentinel-400)]" /><CardTitle>Operational Efficiency</CardTitle></div></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="mb-1 text-xs text-[color:var(--color-ink-3)]">Composite score</p>
              <ProgressBar value={operationalEfficiency.composite} showLabel />
            </div>
            <div>
              <p className="mb-1 text-xs text-[color:var(--color-ink-3)]">Mission success</p>
              <ProgressBar value={operationalEfficiency.missionRate} tone="success" showLabel />
            </div>
            <div>
              <p className="mb-1 text-xs text-[color:var(--color-ink-3)]">Personnel readiness</p>
              <ProgressBar value={operationalEfficiency.personnelReady} tone="amber" showLabel />
            </div>
            <div>
              <p className="mb-1 text-xs text-[color:var(--color-ink-3)]">Asset readiness</p>
              <ProgressBar value={operationalEfficiency.assetsReady} showLabel />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><div className="flex items-center gap-2"><Building className="h-4 w-4 text-[color:var(--color-sentinel-400)]" /><CardTitle>Base Readiness</CardTitle></div></CardHeader>
          <CardContent><BarChartPanel data={baseReadiness} layout="horizontal" /></CardContent>
        </Card>
      </div>
    </div>
  );
}
