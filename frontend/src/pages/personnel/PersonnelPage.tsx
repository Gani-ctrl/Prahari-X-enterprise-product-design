import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import type { ColumnDef } from "@tanstack/react-table";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { Plus, Search, MoreVertical, Eye, Pencil, Trash2, Users, FileDown } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/Badge";
import { DataTable } from "@/components/ui/DataTable";
import { EmptyState } from "@/components/ui/EmptyState";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Avatar } from "@/components/ui/Avatar";
import { PersonnelFormModal, type PersonnelFormValues } from "./PersonnelFormModal";
import { PersonnelProfileDrawer } from "./PersonnelProfileDrawer";
import { personnelApi, missionsApi, assetsApi } from "@/services/api";
import { toast } from "@/store/toastStore";
import { exportToCsv } from "@/lib/exportCsv";
import type { Asset, Mission, Personnel, PersonnelStatus } from "@/types";

export default function PersonnelPage() {
  const [personnel, setPersonnel] = useState<Personnel[]>([]);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<PersonnelStatus | "all">("all");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Personnel | null>(null);
  const [deleting, setDeleting] = useState<Personnel | null>(null);
  const [viewing, setViewing] = useState<Personnel | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();

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

  useEffect(() => {
    if (searchParams.get("new") === "1") {
      setEditing(null);
      setFormOpen(true);
      searchParams.delete("new");
      setSearchParams(searchParams, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const filtered = useMemo(() => {
    return personnel.filter((p) => {
      if (status !== "all" && p.status !== status) return false;
      if (search && !`${p.name} ${p.rank} ${p.unit}`.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [personnel, search, status]);

  async function handleSubmit(values: PersonnelFormValues) {
    if (editing) {
      const updated = await personnelApi.update(editing.id, values);
      setPersonnel((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      toast.success("Personnel record updated");
    } else {
      const created = await personnelApi.create(values);
      setPersonnel((prev) => [created, ...prev]);
      toast.success("Personnel record added");
    }
  }

  async function handleDelete() {
    if (!deleting) return;
    await personnelApi.remove(deleting.id);
    setPersonnel((prev) => prev.filter((p) => p.id !== deleting.id));
    setDeleting(null);
    toast.success("Personnel record removed");
  }

  function handleExport() {
    exportToCsv("personnel-roster", filtered, [
      { header: "Name", accessor: (p) => p.name },
      { header: "Rank", accessor: (p) => p.rank },
      { header: "Role", accessor: (p) => p.roleTitle },
      { header: "Unit", accessor: (p) => p.unit },
      { header: "Location", accessor: (p) => p.location },
      { header: "Status", accessor: (p) => p.status },
      { header: "Health Score", accessor: (p) => p.healthScore },
      { header: "Performance Score", accessor: (p) => p.performanceScore },
      { header: "Missions Completed", accessor: (p) => p.missionsCompleted },
      { header: "Email", accessor: (p) => p.email },
      { header: "Phone", accessor: (p) => p.phone },
    ]);
    toast.success("Export ready", `${filtered.length} records exported to CSV.`);
  }

  const columns: ColumnDef<Personnel, any>[] = [
    {
      accessorKey: "name",
      header: "Officer",
      cell: ({ row }) => (
        <button onClick={() => setViewing(row.original)} className="flex items-center gap-3 text-left">
          <Avatar seed={row.original.avatarSeed} name={row.original.name} size="sm" />
          <div>
            <p className="font-medium text-[color:var(--color-ink-0)]">{row.original.rank} {row.original.name}</p>
            <p className="text-xs text-[color:var(--color-ink-3)]">{row.original.roleTitle}</p>
          </div>
        </button>
      ),
    },
    { accessorKey: "unit", header: "Unit" },
    { accessorKey: "location", header: "Location" },
    { accessorKey: "status", header: "Status", cell: ({ row }) => <StatusBadge status={row.original.status} /> },
    {
      accessorKey: "healthScore",
      header: "Health",
      cell: ({ row }) => (
        <div className="w-28">
          <ProgressBar value={row.original.healthScore} tone={row.original.healthScore > 70 ? "success" : row.original.healthScore > 40 ? "amber" : "danger"} />
        </div>
      ),
    },
    {
      accessorKey: "performanceScore",
      header: "Performance",
      cell: ({ row }) => (
        <div className="w-28">
          <ProgressBar value={row.original.performanceScore} tone={row.original.performanceScore > 70 ? "success" : "amber"} />
        </div>
      ),
    },
    { accessorKey: "missionsCompleted", header: "Missions" },
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
            <DropdownMenu.Content align="end" className="z-50 w-44 overflow-hidden rounded-[var(--radius-md)] border border-[color:var(--color-border-strong)] bg-[color:var(--color-surface-2)] p-1 shadow-[var(--shadow-float)]">
              <DropdownMenu.Item onClick={() => setViewing(row.original)} className="flex cursor-pointer items-center gap-2.5 rounded-[var(--radius-xs)] px-3 py-2 text-sm text-[color:var(--color-ink-1)] outline-none hover:bg-white/5">
                <Eye className="h-3.5 w-3.5" /> View profile
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
          <h1 className="text-2xl font-semibold tracking-tight text-[color:var(--color-ink-0)]">Personnel</h1>
          <p className="mt-1 text-sm text-[color:var(--color-ink-3)]">{personnel.length} officers on record</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" icon={<FileDown />} onClick={handleExport}>Export CSV</Button>
          <Button icon={<Plus />} onClick={() => { setEditing(null); setFormOpen(true); }}>Add Personnel</Button>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Input icon={<Search />} placeholder="Search by name, rank, or unit…" value={search} onChange={(e) => setSearch(e.target.value)} className="sm:max-w-sm" />
        <Select
          value={status}
          onValueChange={(v) => setStatus(v as any)}
          className="sm:w-44"
          options={[
            { label: "All statuses", value: "all" },
            { label: "Available", value: "available" },
            { label: "Deployed", value: "deployed" },
            { label: "Leave", value: "leave" },
            { label: "Medical", value: "medical" },
          ]}
        />
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        isLoading={isLoading}
        emptyState={
          <EmptyState
            icon={<Users />}
            title="No personnel match your filters"
            description="Adjust filters or add a new personnel record."
            action={<Button icon={<Plus />} onClick={() => setFormOpen(true)}>Add Personnel</Button>}
          />
        }
      />

      <PersonnelFormModal open={formOpen} onOpenChange={setFormOpen} onSubmit={handleSubmit} personnel={editing} />
      <PersonnelProfileDrawer
        open={Boolean(viewing)}
        onOpenChange={(v) => !v && setViewing(null)}
        personnel={viewing}
        missionHistory={missions.filter((m) => viewing && m.squadIds.includes(viewing.id))}
        equipment={assets.filter((a) =>
          viewing ? missions.some((m) => m.squadIds.includes(viewing.id) && m.equipmentIds.includes(a.id)) : false
        )}
      />
      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(v) => !v && setDeleting(null)}
        title="Remove this personnel record?"
        description={`${deleting?.name ?? "This officer"} will be permanently removed from the roster.`}
        confirmLabel="Remove record"
        onConfirm={handleDelete}
      />
    </div>
  );
}
