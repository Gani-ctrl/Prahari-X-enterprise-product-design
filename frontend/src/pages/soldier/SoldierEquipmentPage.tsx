import { motion } from "motion/react";
import { Boxes, Truck, Radar, Crosshair as WeaponIcon, HeartPulse, Satellite, type LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/Badge";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { EmptyState } from "@/components/ui/EmptyState";
import { SkeletonCard } from "@/components/ui/Skeleton";
import { useSoldierContext } from "@/hooks/useSoldierContext";
import { formatDate } from "@/lib/utils";
import type { AssetCategory } from "@/types";

// `LucideIcon`, not the generic React `ElementType` — see NotificationsPanel.tsx
// for why `ElementType` collapses this kind of dynamic icon-map lookup to `never`.
const CATEGORY_ICON: Record<AssetCategory, LucideIcon> = {
  vehicle: Truck,
  drone: Radar,
  weapon: WeaponIcon,
  medical: HeartPulse,
  satellite: Satellite,
};

export default function SoldierEquipmentPage() {
  const { isLoading, assets } = useSoldierContext();

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-[color:var(--color-ink-0)]">My Equipment</h1>
        <p className="mt-1 text-sm text-[color:var(--color-ink-3)]">Assets attached to your current mission assignments.</p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : assets.length === 0 ? (
        <EmptyState icon={<Boxes />} title="No equipment assigned" description="Equipment tied to your active missions will appear here." />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {assets.map((a, i) => {
            const Icon = CATEGORY_ICON[a.category];
            return (
              <motion.div key={a.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <Card className="hud-card h-full">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[color:var(--color-amber-500)]/12 text-[color:var(--color-amber-400)]">
                        <Icon className="h-[18px] w-[18px]" />
                      </div>
                      <StatusBadge status={a.status} />
                    </div>
                    <p className="mt-3 text-sm font-medium text-[color:var(--color-ink-0)]">{a.name}</p>
                    <p className="text-xs text-[color:var(--color-ink-3)] capitalize">{a.category} · {a.model}</p>
                    <div className="mt-4">
                      <ProgressBar value={a.condition} tone={a.condition > 70 ? "success" : a.condition > 40 ? "amber" : "danger"} showLabel />
                    </div>
                    <p className="mt-3 text-xs text-[color:var(--color-ink-4)]">Next service: {formatDate(a.nextMaintenanceDate)}</p>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
