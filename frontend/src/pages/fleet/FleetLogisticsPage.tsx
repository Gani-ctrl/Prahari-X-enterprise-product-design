import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Truck,
  Radar as DroneIcon,
  Wrench,
  Gauge,
  PackageSearch,
  TrendingDown,
  Wallet,
  Package,
  MapPin,
  Calendar,
} from "lucide-react";
import { Tabs, TabPanel } from "@/components/ui/Tabs";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/Badge";
import { StatCard } from "@/components/ui/StatCard";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { toast } from "@/store/toastStore";
import { assetsApi, inventoryApi } from "@/services/api";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import type { Asset, InventoryItem } from "@/types";

export default function FleetLogisticsPage() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [tab, setTab] = useState<"fleet" | "logistics">("fleet");
  const [busyId, setBusyId] = useState<string | null>(null);

  async function load() {
    setIsLoading(true);
    const [a, i] = await Promise.all([assetsApi.list(), inventoryApi.list()]);
    setAssets(a);
    setInventory(i);
    setIsLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  const fleet = useMemo(() => assets.filter((a) => a.category === "vehicle" || a.category === "drone"), [assets]);

  const fleetStats = useMemo(() => {
    const operational = fleet.filter((a) => a.status === "operational").length;
    const maintenance = fleet.filter((a) => a.status === "maintenance").length;
    const avgCondition = fleet.length ? Math.round(fleet.reduce((s, a) => s + a.condition, 0) / fleet.length) : 0;
    return { total: fleet.length, operational, maintenance, avgCondition };
  }, [fleet]);

  const reorderQueue = useMemo(
    () => inventory.filter((i) => i.status === "low_stock" || i.status === "out_of_stock").sort((a, b) => a.quantity - b.quantity),
    [inventory]
  );

  const logisticsStats = useMemo(() => {
    const totalValue = inventory.reduce((s, i) => s + i.quantity * i.unitCost, 0);
    const pendingReorders = reorderQueue.length;
    const outOfStock = inventory.filter((i) => i.status === "out_of_stock").length;
    return { totalValue: Math.round(totalValue), pendingReorders, outOfStock, catalogSize: inventory.length };
  }, [inventory, reorderQueue]);

  async function scheduleMaintenance(asset: Asset) {
    setBusyId(asset.id);
    try {
      const updated = await assetsApi.update(asset.id, { status: "maintenance" });
      setAssets((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
      toast.success("Maintenance scheduled", `${asset.name} flagged for service.`);
    } finally {
      setBusyId(null);
    }
  }

  async function markOperational(asset: Asset) {
    setBusyId(asset.id);
    try {
      const updated = await assetsApi.update(asset.id, { status: "operational", condition: 100 });
      setAssets((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
      toast.success("Returned to service", `${asset.name} marked operational.`);
    } finally {
      setBusyId(null);
    }
  }

  async function reorder(item: InventoryItem) {
    setBusyId(item.id);
    try {
      const delta = item.category === "ammunition" ? 500 : 10;
      const updated = await inventoryApi.adjustStock(item.id, delta);
      setInventory((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
      toast.success("Reorder placed", `${item.name} +${delta} units incoming.`);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2.5 text-2xl font-semibold tracking-tight text-[color:var(--color-ink-0)]">
          <Truck className="h-6 w-6 text-[color:var(--color-sentinel-400)]" />
          Fleet &amp; Logistics
        </h1>
        <p className="mt-1 text-sm text-[color:var(--color-ink-3)]">Vehicle &amp; drone fleet readiness, plus supply chain reorder pipeline</p>
      </div>

      <Tabs
        tabs={[
          { value: "fleet", label: "Fleet Management" },
          { value: "logistics", label: "Supply Chain" },
        ]}
        value={tab}
        onValueChange={(v) => setTab(v as any)}
      >
        <TabPanel value="fleet" className="pt-6">
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard label="Total Fleet Size" value={fleetStats.total} icon={<Truck />} tone="sentinel" index={0} />
              <StatCard label="Operational" value={fleetStats.operational} icon={<Gauge />} tone="success" index={1} />
              <StatCard label="In Maintenance" value={fleetStats.maintenance} icon={<Wrench />} tone="amber" index={2} />
              <StatCard label="Avg Condition" value={fleetStats.avgCondition} suffix="%" icon={<TrendingDown />} tone="danger" index={3} />
            </div>

            {isLoading ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-48 rounded-[var(--radius-card)]" />)}
              </div>
            ) : fleet.length === 0 ? (
              <EmptyState icon={<Truck />} title="No vehicles or drones on record" description="Add fleet assets from the Assets page." />
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <AnimatePresence mode="popLayout">
                  {fleet.map((asset, index) => (
                    <motion.div
                      key={asset.id}
                      layout
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.96 }}
                      transition={{ duration: 0.35, delay: index * 0.03, ease: [0.16, 1, 0.3, 1] }}
                      whileHover={{ y: -3 }}
                      className="hud-card rounded-[var(--radius-card)] border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] p-5"
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "flex h-11 w-11 items-center justify-center rounded-xl [&>svg]:h-5 [&>svg]:w-5",
                          asset.category === "vehicle" ? "bg-[color:var(--color-sentinel-500)]/12 text-[color:var(--color-sentinel-400)]" : "bg-white/8 text-[color:var(--color-steel-400)]"
                        )}>
                          {asset.category === "vehicle" ? <Truck /> : <DroneIcon />}
                        </div>
                        <div>
                          <p className="font-medium leading-tight text-[color:var(--color-ink-0)]">{asset.name}</p>
                          <p className="mt-0.5 text-xs text-[color:var(--color-ink-4)]">{asset.model}</p>
                        </div>
                      </div>

                      <div className="mt-4 flex items-center justify-between">
                        <StatusBadge status={asset.status} />
                        <span className="flex items-center gap-1 text-xs text-[color:var(--color-ink-4)]"><MapPin className="h-3 w-3" /> {asset.location}</span>
                      </div>

                      <div className="mt-3">
                        <div className="mb-1 flex items-center justify-between text-xs">
                          <span className="text-[color:var(--color-ink-3)]">Condition</span>
                          <span className="mono-tag font-medium text-[color:var(--color-ink-1)]">{asset.condition}%</span>
                        </div>
                        <ProgressBar value={asset.condition} tone={asset.condition > 70 ? "success" : asset.condition > 40 ? "amber" : "danger"} />
                      </div>

                      <div className="mt-4 flex items-center gap-1.5 text-xs text-[color:var(--color-ink-4)]">
                        <Calendar className="h-3 w-3" /> Next service {formatDate(asset.nextMaintenanceDate)}
                      </div>

                      <div className="mt-4 border-t border-[color:var(--color-border)] pt-3.5">
                        {asset.status === "maintenance" ? (
                          <Button variant="secondary" size="sm" className="w-full" disabled={busyId === asset.id} onClick={() => markOperational(asset)}>
                            Return to Service
                          </Button>
                        ) : (
                          <Button variant="outline" size="sm" className="w-full" icon={<Wrench />} disabled={busyId === asset.id} onClick={() => scheduleMaintenance(asset)}>
                            Schedule Maintenance
                          </Button>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>
        </TabPanel>

        <TabPanel value="logistics" className="pt-6">
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard label="Catalog Value" value={logisticsStats.totalValue} icon={<Wallet />} tone="sentinel" index={0} />
              <StatCard label="Pending Reorders" value={logisticsStats.pendingReorders} icon={<PackageSearch />} tone="amber" index={1} />
              <StatCard label="Out of Stock" value={logisticsStats.outOfStock} icon={<TrendingDown />} tone="danger" index={2} />
              <StatCard label="Catalog Items" value={logisticsStats.catalogSize} icon={<Package />} tone="success" index={3} />
            </div>

            <div className="rounded-[var(--radius-card)] border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] p-6">
              <h3 className="text-[15px] font-semibold tracking-tight text-[color:var(--color-ink-0)]">Reorder Pipeline</h3>
              <p className="mt-1 text-sm text-[color:var(--color-ink-3)]">Items at or below their reorder threshold, ranked by urgency.</p>

              {isLoading ? (
                <div className="mt-4 space-y-3">
                  {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}
                </div>
              ) : reorderQueue.length === 0 ? (
                <div className="mt-4">
                  <EmptyState icon={<Package />} title="Supply chain is healthy" description="No items are currently below their reorder threshold." />
                </div>
              ) : (
                <div className="mt-4 space-y-2.5">
                  {reorderQueue.map((item) => (
                    <div key={item.id} className="flex items-center justify-between gap-4 rounded-xl border border-[color:var(--color-border)] p-3.5">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-[color:var(--color-ink-1)]">{item.name}</p>
                        <p className="text-xs text-[color:var(--color-ink-4)]">{item.location} · {formatCurrency(item.unitCost)}/unit</p>
                      </div>
                      <div className="flex shrink-0 items-center gap-4">
                        <div className="text-right">
                          <p className="mono-tag text-sm font-medium text-[color:var(--color-ink-1)]">{item.quantity} units</p>
                          <StatusBadge status={item.status} />
                        </div>
                        <Button variant="secondary" size="sm" disabled={busyId === item.id} onClick={() => reorder(item)}>
                          Reorder
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
    </div>
  );
}
