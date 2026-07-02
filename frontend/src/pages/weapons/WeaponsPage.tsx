import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import {
  Plus,
  Search,
  MoreVertical,
  Pencil,
  Trash2,
  Crosshair,
  Package,
  ShieldCheck,
  Truck,
  Radar,
  Swords,
  MapPin,
  AlertTriangle,
  Layers,
  Wallet,
  PackagePlus,
  PackageMinus,
  MessageSquare,
  FileDown,
} from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/Badge";
import { StatCard } from "@/components/ui/StatCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Skeleton } from "@/components/ui/Skeleton";
import { WeaponFormModal, type WeaponFormValues } from "./WeaponFormModal";
import { EntityDetailDrawer } from "@/components/shared/EntityDetailDrawer";
import { WeaponVisual } from "./WeaponVisual";
import { inventoryApi } from "@/services/api";
import { toast } from "@/store/toastStore";
import { exportToCsv } from "@/lib/exportCsv";
import { cn, formatCurrency, formatDate, formatNumber } from "@/lib/utils";
import type { InventoryCategory, InventoryItem } from "@/types";

const CATEGORY_META: Record<InventoryCategory, { label: string; icon: typeof Crosshair; tone: string }> = {
  firearm: { label: "Firearms", icon: Crosshair, tone: "text-[color:var(--color-danger-400)] bg-[color:var(--color-danger-500)]/12" },
  ammunition: { label: "Ammunition", icon: Package, tone: "text-[color:var(--color-amber-400)] bg-[color:var(--color-amber-500)]/12" },
  tactical_gear: { label: "Tactical Gear", icon: ShieldCheck, tone: "text-[color:var(--color-success-400)] bg-[color:var(--color-success-500)]/12" },
  vehicle: { label: "Vehicles", icon: Truck, tone: "text-[color:var(--color-sentinel-400)] bg-[color:var(--color-sentinel-500)]/12" },
  drone: { label: "Drones", icon: Radar, tone: "text-[color:var(--color-steel-400)] bg-white/8" },
};

const CATEGORY_TABS: Array<{ value: InventoryCategory | "all"; label: string }> = [
  { value: "all", label: "All" },
  { value: "firearm", label: "Firearms" },
  { value: "ammunition", label: "Ammunition" },
  { value: "tactical_gear", label: "Tactical Gear" },
  { value: "vehicle", label: "Vehicles" },
  { value: "drone", label: "Drones" },
];

export default function WeaponsPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [category, setCategory] = useState<InventoryCategory | "all">("all");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "in_stock" | "low_stock" | "out_of_stock">("all");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<InventoryItem | null>(null);
  const [deleting, setDeleting] = useState<InventoryItem | null>(null);
  const [adjustingId, setAdjustingId] = useState<string | null>(null);
  const [viewing, setViewing] = useState<InventoryItem | null>(null);

  async function load() {
    setIsLoading(true);
    const data = await inventoryApi.list();
    setItems(data);
    setIsLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    return items.filter((item) => {
      if (category !== "all" && item.category !== category) return false;
      if (statusFilter !== "all" && item.status !== statusFilter) return false;
      if (search && !`${item.name} ${item.spec} ${item.location}`.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [items, category, statusFilter, search]);

  const stats = useMemo(() => {
    const totalUnits = items.reduce((sum, i) => sum + i.quantity, 0);
    const totalValue = items.reduce((sum, i) => sum + i.quantity * i.unitCost, 0);
    const lowStock = items.filter((i) => i.status === "low_stock" || i.status === "out_of_stock").length;
    const categories = new Set(items.map((i) => i.category)).size;
    return { totalUnits, totalValue, lowStock, categories };
  }, [items]);

  async function handleSubmit(values: WeaponFormValues) {
    if (editing) {
      const updated = await inventoryApi.update(editing.id, values);
      setItems((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
      toast.success("Inventory item updated");
    } else {
      const created = await inventoryApi.create(values);
      setItems((prev) => [created, ...prev]);
      toast.success("Inventory item added");
    }
  }

  async function handleDelete() {
    if (!deleting) return;
    await inventoryApi.remove(deleting.id);
    setItems((prev) => prev.filter((i) => i.id !== deleting.id));
    setDeleting(null);
    toast.success("Inventory item removed");
  }

  function handleExport() {
    exportToCsv("weapons-ammunition-inventory", filtered, [
      { header: "Name", accessor: (i) => i.name },
      { header: "Category", accessor: (i) => i.category },
      { header: "Spec", accessor: (i) => i.spec },
      { header: "Quantity", accessor: (i) => i.quantity },
      { header: "Reorder Threshold", accessor: (i) => i.reorderThreshold },
      { header: "Status", accessor: (i) => i.status },
      { header: "Location", accessor: (i) => i.location },
      { header: "Unit Cost", accessor: (i) => i.unitCost },
      { header: "Last Restocked", accessor: (i) => i.lastRestocked },
    ]);
    toast.success("Export ready", `${filtered.length} items exported to CSV.`);
  }

  async function handleAdjust(item: InventoryItem, delta: number) {
    setAdjustingId(item.id);
    try {
      const updated = await inventoryApi.adjustStock(item.id, delta);
      setItems((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
      if (delta > 0) toast.success("Stock restocked", `${item.name} +${delta} units`);
    } finally {
      setAdjustingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="flex items-center gap-2.5 text-2xl font-semibold tracking-tight text-[color:var(--color-ink-0)]">
            <Swords className="h-6 w-6 text-[color:var(--color-danger-400)]" />
            Weapons &amp; Ammunition
          </h1>
          <p className="mt-1 text-sm text-[color:var(--color-ink-3)]">
            Inventory and equipment presentation — {items.length} catalog entries across {stats.categories} categories
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" icon={<FileDown />} onClick={handleExport}>Export CSV</Button>
          <Button icon={<Plus />} onClick={() => { setEditing(null); setFormOpen(true); }}>Add Item</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Units in Stock" value={stats.totalUnits} icon={<Layers />} tone="sentinel" index={0} />
        <StatCard label="Total Inventory Value" value={Math.round(stats.totalValue)} icon={<Wallet />} tone="success" suffix="" index={1} />
        <StatCard label="Low / Out of Stock" value={stats.lowStock} icon={<AlertTriangle />} tone="danger" index={2} />
        <StatCard label="Catalog Categories" value={stats.categories} icon={<Package />} tone="amber" index={3} />
      </div>

      <div className="flex flex-wrap items-center gap-2 border-b border-[color:var(--color-border)] pb-1">
        {CATEGORY_TABS.map((tab) => {
          const active = tab.value === category;
          return (
            <button
              key={tab.value}
              onClick={() => setCategory(tab.value)}
              className={cn(
                "relative rounded-t-lg px-3.5 py-2.5 text-sm font-medium transition-colors",
                active ? "text-[color:var(--color-ink-0)]" : "text-[color:var(--color-ink-3)] hover:text-[color:var(--color-ink-1)]"
              )}
            >
              {tab.label}
              {active && (
                <motion.div
                  layoutId="weapons-tab-indicator"
                  className="absolute inset-x-2 -bottom-px h-[2px] rounded-full bg-[color:var(--color-danger-400)]"
                  transition={{ type: "spring", stiffness: 500, damping: 40 }}
                />
              )}
            </button>
          );
        })}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Input icon={<Search />} placeholder="Search by name, spec, or location…" value={search} onChange={(e) => setSearch(e.target.value)} className="sm:max-w-sm" />
        <Select
          value={statusFilter}
          onValueChange={(v) => setStatusFilter(v as any)}
          className="sm:w-44"
          options={[
            { label: "All stock levels", value: "all" },
            { label: "In stock", value: "in_stock" },
            { label: "Low stock", value: "low_stock" },
            { label: "Out of stock", value: "out_of_stock" },
          ]}
        />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-52 rounded-[var(--radius-card)]" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<Swords />}
          title="No inventory items match your filters"
          description="Adjust filters or add a new item to the catalog."
          action={<Button icon={<Plus />} onClick={() => { setEditing(null); setFormOpen(true); }}>Add Item</Button>}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence mode="popLayout">
            {filtered.map((item, index) => {
              const meta = CATEGORY_META[item.category];
              const stockPct = Math.min(100, Math.round((item.quantity / Math.max(item.reorderThreshold * 3, 1)) * 100));
              return (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, y: 16, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ duration: 0.35, delay: index * 0.03, ease: [0.16, 1, 0.3, 1] }}
                  whileHover={{ y: -3 }}
                  className="hud-card group relative overflow-hidden rounded-[var(--radius-card)] border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] p-5"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <WeaponVisual category={item.category} size={52} />
                      <div>
                        <p className="font-medium leading-tight text-[color:var(--color-ink-0)]">{item.name}</p>
                        <p className="mt-0.5 text-xs capitalize text-[color:var(--color-ink-4)]">{meta.label}</p>
                      </div>
                    </div>
                    <DropdownMenu.Root>
                      <DropdownMenu.Trigger asChild>
                        <button className="flex h-8 w-8 items-center justify-center rounded-lg text-[color:var(--color-ink-3)] hover:bg-white/5 hover:text-[color:var(--color-ink-0)]">
                          <MoreVertical className="h-4 w-4" />
                        </button>
                      </DropdownMenu.Trigger>
                      <DropdownMenu.Portal>
                        <DropdownMenu.Content align="end" className="z-50 w-44 overflow-hidden rounded-[var(--radius-md)] border border-[color:var(--color-border-strong)] bg-[color:var(--color-surface-2)] p-1 shadow-[var(--shadow-float)]">
                          <DropdownMenu.Item onClick={() => setViewing(item)} className="flex cursor-pointer items-center gap-2.5 rounded-[var(--radius-xs)] px-3 py-2 text-sm text-[color:var(--color-ink-1)] outline-none hover:bg-white/5">
                            <MessageSquare className="h-3.5 w-3.5" /> Comments &amp; Activity
                          </DropdownMenu.Item>
                          <DropdownMenu.Item onClick={() => { setEditing(item); setFormOpen(true); }} className="flex cursor-pointer items-center gap-2.5 rounded-[var(--radius-xs)] px-3 py-2 text-sm text-[color:var(--color-ink-1)] outline-none hover:bg-white/5">
                            <Pencil className="h-3.5 w-3.5" /> Edit
                          </DropdownMenu.Item>
                          <DropdownMenu.Item onClick={() => setDeleting(item)} className="flex cursor-pointer items-center gap-2.5 rounded-[var(--radius-xs)] px-3 py-2 text-sm text-[color:var(--color-danger-400)] outline-none hover:bg-[color:var(--color-danger-500)]/10">
                            <Trash2 className="h-3.5 w-3.5" /> Delete
                          </DropdownMenu.Item>
                        </DropdownMenu.Content>
                      </DropdownMenu.Portal>
                    </DropdownMenu.Root>
                  </div>

                  <p className="mt-3 line-clamp-2 text-xs text-[color:var(--color-ink-3)]">{item.spec}</p>

                  <div className="mt-4 flex items-center justify-between">
                    <StatusBadge status={item.status} />
                    <span className="mono-tag text-xs text-[color:var(--color-ink-3)]">{formatCurrency(item.unitCost)} / unit</span>
                  </div>

                  <div className="mt-3">
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <span className="text-[color:var(--color-ink-3)]">Stock level</span>
                      <span className="mono-tag font-medium text-[color:var(--color-ink-1)]">{formatNumber(item.quantity)} units</span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/5">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${stockPct}%` }}
                        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                        className={cn(
                          "h-full rounded-full",
                          item.status === "out_of_stock" ? "bg-[color:var(--color-danger-500)]" : item.status === "low_stock" ? "bg-[color:var(--color-amber-500)]" : "bg-[color:var(--color-success-500)]"
                        )}
                      />
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between text-xs text-[color:var(--color-ink-4)]">
                    <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {item.location}</span>
                    <span>Restocked {formatDate(item.lastRestocked)}</span>
                  </div>

                  <div className="mt-4 flex items-center gap-2 border-t border-[color:var(--color-border)] pt-3.5">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      disabled={adjustingId === item.id || item.quantity === 0}
                      icon={<PackageMinus />}
                      onClick={() => handleAdjust(item, -1)}
                    >
                      Issue 1
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      className="flex-1"
                      disabled={adjustingId === item.id}
                      icon={<PackagePlus />}
                      onClick={() => handleAdjust(item, item.category === "ammunition" ? 500 : 10)}
                    >
                      Restock
                    </Button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      <WeaponFormModal open={formOpen} onOpenChange={setFormOpen} onSubmit={handleSubmit} item={editing} defaultCategory={category === "all" ? undefined : category} />
      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(v) => !v && setDeleting(null)}
        title="Remove this inventory item?"
        description={`${deleting?.name ?? "This item"} will be permanently removed from the catalog.`}
        confirmLabel="Remove item"
        onConfirm={handleDelete}
      />

      {viewing && (
        <EntityDetailDrawer
          open={Boolean(viewing)}
          onOpenChange={(open) => !open && setViewing(null)}
          title={viewing.name}
          entityType="inventory"
          entityId={viewing.id}
        >
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <WeaponVisual category={viewing.category} size={72} />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <StatusBadge status={viewing.status} />
                  <span className="mono-tag text-xs text-[color:var(--color-ink-3)]">{formatCurrency(viewing.unitCost)} / unit</span>
                </div>
              </div>
            </div>
            <p className="text-sm leading-relaxed text-[color:var(--color-ink-1)]">{viewing.spec}</p>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-xl border border-[color:var(--color-border)] p-3">
                <p className="text-xs text-[color:var(--color-ink-3)]">Stock</p>
                <p className="mt-1 font-medium text-[color:var(--color-ink-0)]">{formatNumber(viewing.quantity)} units</p>
              </div>
              <div className="rounded-xl border border-[color:var(--color-border)] p-3">
                <p className="text-xs text-[color:var(--color-ink-3)]">Reorder threshold</p>
                <p className="mt-1 font-medium text-[color:var(--color-ink-0)]">{formatNumber(viewing.reorderThreshold)} units</p>
              </div>
              <div className="rounded-xl border border-[color:var(--color-border)] p-3">
                <p className="text-xs text-[color:var(--color-ink-3)]">Location</p>
                <p className="mt-1 font-medium text-[color:var(--color-ink-0)]">{viewing.location}</p>
              </div>
              <div className="rounded-xl border border-[color:var(--color-border)] p-3">
                <p className="text-xs text-[color:var(--color-ink-3)]">Last restocked</p>
                <p className="mt-1 font-medium text-[color:var(--color-ink-0)]">{formatDate(viewing.lastRestocked)}</p>
              </div>
            </div>
          </div>
        </EntityDetailDrawer>
      )}
    </div>
  );
}
