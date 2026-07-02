import { useEffect, useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { Plus, MoreVertical, Pencil, Trash2, Link2, Boxes, MessageSquare, FileDown } from "lucide-react";
import { Tabs, TabPanel } from "@/components/ui/Tabs";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/Badge";
import { DataTable } from "@/components/ui/DataTable";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { EmptyState } from "@/components/ui/EmptyState";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { AssetFormModal, type AssetFormValues } from "./AssetFormModal";
import { EntityDetailDrawer } from "@/components/shared/EntityDetailDrawer";
import { assetsApi, missionsApi } from "@/services/api";
import { toast } from "@/store/toastStore";
import { formatDate } from "@/lib/utils";
import { exportToCsv } from "@/lib/exportCsv";
import type { Asset, AssetCategory, Mission } from "@/types";

const CATEGORY_TABS: { value: AssetCategory; label: string }[] = [
  { value: "vehicle", label: "Vehicles" },
  { value: "drone", label: "Drones" },
  { value: "weapon", label: "Weapons" },
  { value: "medical", label: "Medical" },
  { value: "satellite", label: "Satellites" },
];

export default function AssetsPage() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [category, setCategory] = useState<AssetCategory>("vehicle");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Asset | null>(null);
  const [deleting, setDeleting] = useState<Asset | null>(null);
  const [assigning, setAssigning] = useState<Asset | null>(null);
  const [assignMissionId, setAssignMissionId] = useState("");
  const [viewing, setViewing] = useState<Asset | null>(null);

  async function load() {
    setIsLoading(true);
    const [a, m] = await Promise.all([assetsApi.list(), missionsApi.list()]);
    setAssets(a);
    setMissions(m);
    setIsLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => assets.filter((a) => a.category === category), [assets, category]);

  async function handleSubmit(values: AssetFormValues) {
    if (editing) {
      const updated = await assetsApi.update(editing.id, values);
      setAssets((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
      toast.success("Asset updated");
    } else {
      const created = await assetsApi.create(values);
      setAssets((prev) => [created, ...prev]);
      toast.success("Asset added");
    }
  }

  async function handleDelete() {
    if (!deleting) return;
    await assetsApi.remove(deleting.id);
    setAssets((prev) => prev.filter((a) => a.id !== deleting.id));
    setDeleting(null);
    toast.success("Asset removed");
  }

  function handleExport() {
    exportToCsv(`assets-${category}`, filtered, [
      { header: "Name", accessor: (a) => a.name },
      { header: "Category", accessor: (a) => a.category },
      { header: "Model", accessor: (a) => a.model },
      { header: "Status", accessor: (a) => a.status },
      { header: "Location", accessor: (a) => a.location },
      { header: "Condition", accessor: (a) => a.condition },
      { header: "Last Maintenance", accessor: (a) => a.lastMaintenanceDate },
      { header: "Next Maintenance", accessor: (a) => a.nextMaintenanceDate },
    ]);
    toast.success("Export ready", `${filtered.length} assets exported to CSV.`);
  }

  async function handleAssign() {
    if (!assigning || !assignMissionId) return;
    const updated = await assetsApi.update(assigning.id, { assignedMissionId: assignMissionId, status: "deployed" });
    setAssets((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
    const mission = missions.find((m) => m.id === assignMissionId);
    if (mission) {
      await missionsApi.update(mission.id, { equipmentIds: [...new Set([...mission.equipmentIds, assigning.id])] });
    }
    toast.success("Asset assigned", `${assigning.name} deployed to ${mission?.name ?? "mission"}.`);
    setAssigning(null);
    setAssignMissionId("");
  }

  const columns: ColumnDef<Asset, any>[] = [
    {
      accessorKey: "name",
      header: "Asset",
      cell: ({ row }) => (
        <div>
          <p className="font-medium text-[color:var(--color-ink-0)]">{row.original.name}</p>
          <p className="text-xs text-[color:var(--color-ink-3)]">{row.original.model}</p>
        </div>
      ),
    },
    { accessorKey: "location", header: "Location" },
    { accessorKey: "status", header: "Status", cell: ({ row }) => <StatusBadge status={row.original.status} /> },
    {
      accessorKey: "condition",
      header: "Condition",
      cell: ({ row }) => (
        <div className="w-32">
          <ProgressBar value={row.original.condition} tone={row.original.condition > 70 ? "success" : row.original.condition > 40 ? "amber" : "danger"} />
        </div>
      ),
    },
    {
      accessorKey: "nextMaintenanceDate",
      header: "Next Maintenance",
      cell: ({ row }) => <span className="text-xs text-[color:var(--color-ink-3)]">{formatDate(row.original.nextMaintenanceDate)}</span>,
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button className="flex h-8 w-8 items-center justify-center rounded-lg text-[color:var(--color-ink-3)] hover:bg-white/5 hover:text-[color:var(--color-ink-0)]">
              <MoreVertical className="h-4 w-4" />
            </button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Content align="end" className="z-50 w-48 overflow-hidden rounded-[var(--radius-md)] border border-[color:var(--color-border-strong)] bg-[color:var(--color-surface-2)] p-1 shadow-[var(--shadow-float)]">
              <DropdownMenu.Item onClick={() => setViewing(row.original)} className="flex cursor-pointer items-center gap-2.5 rounded-[var(--radius-xs)] px-3 py-2 text-sm text-[color:var(--color-ink-1)] outline-none hover:bg-white/5">
                <MessageSquare className="h-3.5 w-3.5" /> Comments &amp; Activity
              </DropdownMenu.Item>
              <DropdownMenu.Item onClick={() => setAssigning(row.original)} className="flex cursor-pointer items-center gap-2.5 rounded-[var(--radius-xs)] px-3 py-2 text-sm text-[color:var(--color-ink-1)] outline-none hover:bg-white/5">
                <Link2 className="h-3.5 w-3.5" /> Assign to mission
              </DropdownMenu.Item>
              <DropdownMenu.Item onClick={() => { setEditing(row.original); setFormOpen(true); }} className="flex cursor-pointer items-center gap-2.5 rounded-[var(--radius-xs)] px-3 py-2 text-sm text-[color:var(--color-ink-1)] outline-none hover:bg-white/5">
                <Pencil className="h-3.5 w-3.5" /> Edit
              </DropdownMenu.Item>
              <DropdownMenu.Item onClick={() => setDeleting(row.original)} className="flex cursor-pointer items-center gap-2.5 rounded-[var(--radius-xs)] px-3 py-2 text-sm text-[color:var(--color-danger-400)] outline-none hover:bg-[color:var(--color-danger-500)]/10">
                <Trash2 className="h-3.5 w-3.5" /> Delete
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[color:var(--color-ink-0)]">Assets</h1>
          <p className="mt-1 text-sm text-[color:var(--color-ink-3)]">{assets.length} tracked assets across all categories</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" icon={<FileDown />} onClick={handleExport}>Export CSV</Button>
          <Button icon={<Plus />} onClick={() => { setEditing(null); setFormOpen(true); }}>Add Asset</Button>
        </div>
      </div>

      <Tabs tabs={CATEGORY_TABS} value={category} onValueChange={(v) => setCategory(v as AssetCategory)}>
        <TabPanel value={category} className="pt-5">
          <DataTable
            columns={columns}
            data={filtered}
            isLoading={isLoading}
            emptyState={
              <EmptyState
                icon={<Boxes />}
                title="No assets in this category"
                description="Add a new asset to start tracking readiness and maintenance."
                action={<Button icon={<Plus />} onClick={() => setFormOpen(true)}>Add Asset</Button>}
              />
            }
          />
        </TabPanel>
      </Tabs>

      <AssetFormModal open={formOpen} onOpenChange={setFormOpen} onSubmit={handleSubmit} asset={editing} defaultCategory={category} />
      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(v) => !v && setDeleting(null)}
        title="Remove this asset?"
        description={`${deleting?.name ?? "This asset"} will be permanently removed from the registry.`}
        confirmLabel="Remove asset"
        onConfirm={handleDelete}
      />

      <Modal
        open={Boolean(assigning)}
        onOpenChange={(v) => !v && setAssigning(null)}
        title="Assign to mission"
        description={assigning?.name}
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setAssigning(null)}>Cancel</Button>
            <Button onClick={handleAssign} disabled={!assignMissionId}>Assign</Button>
          </>
        }
      >
        <Select
          label="Mission"
          value={assignMissionId}
          onValueChange={setAssignMissionId}
          placeholder="Select a mission"
          options={missions.map((m) => ({ label: `${m.name} (${m.code})`, value: m.id }))}
        />
      </Modal>

      {viewing && (
        <EntityDetailDrawer
          open={Boolean(viewing)}
          onOpenChange={(open) => !open && setViewing(null)}
          title={viewing.name}
          entityType="asset"
          entityId={viewing.id}
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <StatusBadge status={viewing.status} />
              <span className="text-xs capitalize text-[color:var(--color-ink-3)]">{viewing.category}</span>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-xl border border-[color:var(--color-border)] p-3">
                <p className="text-xs text-[color:var(--color-ink-3)]">Model</p>
                <p className="mt-1 font-medium text-[color:var(--color-ink-0)]">{viewing.model}</p>
              </div>
              <div className="rounded-xl border border-[color:var(--color-border)] p-3">
                <p className="text-xs text-[color:var(--color-ink-3)]">Location</p>
                <p className="mt-1 font-medium text-[color:var(--color-ink-0)]">{viewing.location}</p>
              </div>
              <div className="rounded-xl border border-[color:var(--color-border)] p-3">
                <p className="text-xs text-[color:var(--color-ink-3)]">Condition</p>
                <div className="mt-1.5"><ProgressBar value={viewing.condition} tone={viewing.condition > 70 ? "success" : viewing.condition > 40 ? "amber" : "danger"} /></div>
              </div>
              <div className="rounded-xl border border-[color:var(--color-border)] p-3">
                <p className="text-xs text-[color:var(--color-ink-3)]">Next maintenance</p>
                <p className="mt-1 font-medium text-[color:var(--color-ink-0)]">{formatDate(viewing.nextMaintenanceDate)}</p>
              </div>
            </div>
          </div>
        </EntityDetailDrawer>
      )}
    </div>
  );
}
