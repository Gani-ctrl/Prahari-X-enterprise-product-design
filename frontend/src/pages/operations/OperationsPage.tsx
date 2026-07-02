import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import type { ColumnDef } from "@tanstack/react-table";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { motion } from "motion/react";
import { Plus, Search, MoreVertical, Eye, Pencil, Trash2, Crosshair } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { PriorityBadge, StatusBadge } from "@/components/ui/Badge";
import { DataTable } from "@/components/ui/DataTable";
import { Pagination } from "@/components/ui/Pagination";
import { EmptyState } from "@/components/ui/EmptyState";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { MissionFormModal, type MissionFormValues } from "./MissionFormModal";
import { useFilterStore } from "@/store/filterStore";
import { missionsApi } from "@/services/api";
import { toast } from "@/store/toastStore";
import { formatDate } from "@/lib/utils";
import type { Mission } from "@/types";

const PAGE_SIZE = 8;

export default function OperationsPage() {
  const [missions, setMissions] = useState<Mission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [editingMission, setEditingMission] = useState<Mission | null>(null);
  const [deletingMission, setDeletingMission] = useState<Mission | null>(null);
  const [deleting, setDeleting] = useState(false);

  const { operations: filters, setOperationsFilter } = useFilterStore();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  async function load() {
    setIsLoading(true);
    const data = await missionsApi.list();
    setMissions(data);
    setIsLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (searchParams.get("new") === "1") {
      setEditingMission(null);
      setFormOpen(true);
      searchParams.delete("new");
      setSearchParams(searchParams, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const filtered = useMemo(() => {
    return missions.filter((m) => {
      if (filters.status !== "all" && m.status !== filters.status) return false;
      if (filters.priority !== "all" && m.priority !== filters.priority) return false;
      if (filters.search && !`${m.name} ${m.code} ${m.region}`.toLowerCase().includes(filters.search.toLowerCase())) return false;
      return true;
    });
  }, [missions, filters]);

  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  async function handleCreateOrUpdate(values: MissionFormValues) {
    if (editingMission) {
      const updated = await missionsApi.update(editingMission.id, values);
      setMissions((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
      toast.success("Mission updated", `${updated.code} was saved successfully.`);
    } else {
      const created = await missionsApi.create(values);
      setMissions((prev) => [created, ...prev]);
      toast.success("Mission created", `${created.code} is now in the operations queue.`);
    }
  }

  async function handleDelete() {
    if (!deletingMission) return;
    setDeleting(true);
    await missionsApi.remove(deletingMission.id);
    setMissions((prev) => prev.filter((m) => m.id !== deletingMission.id));
    setDeleting(false);
    setDeletingMission(null);
    toast.success("Mission deleted", `${deletingMission.code} has been removed.`);
  }

  const columns: ColumnDef<Mission, any>[] = [
    {
      accessorKey: "name",
      header: "Mission",
      cell: ({ row }) => (
        <div>
          <p className="font-medium text-[color:var(--color-ink-0)]">{row.original.name}</p>
          <p className="mono-tag text-xs text-[color:var(--color-ink-3)]">{row.original.code}</p>
        </div>
      ),
    },
    { accessorKey: "commanderName", header: "Commander" },
    { accessorKey: "region", header: "Region" },
    {
      accessorKey: "priority",
      header: "Priority",
      cell: ({ row }) => <PriorityBadge priority={row.original.priority} />,
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      accessorKey: "startDate",
      header: "Timeline",
      cell: ({ row }) => (
        <span className="text-xs text-[color:var(--color-ink-3)]">
          {formatDate(row.original.startDate)} – {formatDate(row.original.endDate)}
        </span>
      ),
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild onClick={(e) => e.stopPropagation()}>
            <button className="flex h-8 w-8 items-center justify-center rounded-lg text-[color:var(--color-ink-3)] hover:bg-white/5 hover:text-[color:var(--color-ink-0)]">
              <MoreVertical className="h-4 w-4" />
            </button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Content
              align="end"
              onClick={(e) => e.stopPropagation()}
              className="z-50 w-44 overflow-hidden rounded-[var(--radius-md)] border border-[color:var(--color-border-strong)] bg-[color:var(--color-surface-2)] p-1 shadow-[var(--shadow-float)]"
            >
              <DropdownMenu.Item
                onClick={() => navigate(`/app/operations/${row.original.id}`)}
                className="flex cursor-pointer items-center gap-2.5 rounded-[var(--radius-xs)] px-3 py-2 text-sm text-[color:var(--color-ink-1)] outline-none hover:bg-white/5"
              >
                <Eye className="h-3.5 w-3.5" /> View details
              </DropdownMenu.Item>
              <DropdownMenu.Item
                onClick={() => { setEditingMission(row.original); setFormOpen(true); }}
                className="flex cursor-pointer items-center gap-2.5 rounded-[var(--radius-xs)] px-3 py-2 text-sm text-[color:var(--color-ink-1)] outline-none hover:bg-white/5"
              >
                <Pencil className="h-3.5 w-3.5" /> Edit
              </DropdownMenu.Item>
              <DropdownMenu.Item
                onClick={() => setDeletingMission(row.original)}
                className="flex cursor-pointer items-center gap-2.5 rounded-[var(--radius-xs)] px-3 py-2 text-sm text-[color:var(--color-danger-400)] outline-none hover:bg-[color:var(--color-danger-500)]/10"
              >
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
          <h1 className="text-2xl font-semibold tracking-tight text-[color:var(--color-ink-0)]">Operations</h1>
          <p className="mt-1 text-sm text-[color:var(--color-ink-3)]">{filtered.length} missions in the current queue</p>
        </div>
        <Button icon={<Plus />} onClick={() => { setEditingMission(null); setFormOpen(true); }}>New Mission</Button>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-3 sm:flex-row sm:items-center"
      >
        <Input
          icon={<Search />}
          placeholder="Search by mission, code, or region…"
          value={filters.search}
          onChange={(e) => { setOperationsFilter("search", e.target.value); setPage(1); }}
          className="sm:max-w-sm"
        />
        <Select
          value={filters.status}
          onValueChange={(v) => { setOperationsFilter("status", v as any); setPage(1); }}
          className="sm:w-44"
          options={[
            { label: "All statuses", value: "all" },
            { label: "Planning", value: "planning" },
            { label: "Active", value: "active" },
            { label: "Paused", value: "paused" },
            { label: "Completed", value: "completed" },
            { label: "Aborted", value: "aborted" },
          ]}
        />
        <Select
          value={filters.priority}
          onValueChange={(v) => { setOperationsFilter("priority", v as any); setPage(1); }}
          className="sm:w-40"
          options={[
            { label: "All priorities", value: "all" },
            { label: "Critical", value: "critical" },
            { label: "High", value: "high" },
            { label: "Medium", value: "medium" },
            { label: "Low", value: "low" },
          ]}
        />
      </motion.div>

      <DataTable
        columns={columns}
        data={paged}
        isLoading={isLoading}
        onRowClick={(m) => navigate(`/app/operations/${m.id}`)}
        emptyState={
          <EmptyState
            icon={<Crosshair />}
            title="No missions match your filters"
            description="Try adjusting your search or filters, or create a new mission to get started."
            action={<Button icon={<Plus />} onClick={() => setFormOpen(true)}>New Mission</Button>}
          />
        }
      />

      <Pagination page={page} totalPages={Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))} onPageChange={setPage} totalItems={filtered.length} pageSize={PAGE_SIZE} />

      <MissionFormModal open={formOpen} onOpenChange={setFormOpen} onSubmit={handleCreateOrUpdate} mission={editingMission} />
      <ConfirmDialog
        open={Boolean(deletingMission)}
        onOpenChange={(v) => !v && setDeletingMission(null)}
        title="Delete this mission?"
        description={`This will permanently remove ${deletingMission?.code ?? "this mission"} and its logs. This action cannot be undone.`}
        confirmLabel="Delete mission"
        loading={deleting}
        onConfirm={handleDelete}
      />
    </div>
  );
}
