import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, CheckCircle2, XCircle, RotateCcw, Trash2, ClipboardList } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Badge, PriorityBadge, StatusBadge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { EmptyState } from "@/components/ui/EmptyState";
import { SkeletonCard } from "@/components/ui/Skeleton";
import { toast } from "@/store/toastStore";
import { usePolling } from "@/hooks/usePolling";
import { assignmentsApi, personnelApi, missionsApi, assetsApi, inventoryApi, trainingApi } from "@/services/api";
import { AssignmentFormModal, type AssignmentFormValues } from "./AssignmentFormModal";
import type { Asset, Assignment, AssignmentType, InventoryItem, Mission, Personnel, TrainingProgram } from "@/types";

const TYPE_LABELS: Record<AssignmentType, string> = {
  weapon: "Weapon",
  ammunition: "Ammunition",
  equipment: "Equipment",
  vehicle: "Vehicle",
  drone: "Drone",
  comms: "Comm device",
  medical_kit: "Medical kit",
  protective_gear: "Protective gear",
  training: "Training",
  task: "Task",
  emergency: "Emergency",
};

export default function AssignmentCenterPage() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [personnel, setPersonnel] = useState<Personnel[]>([]);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [training, setTraining] = useState<TrainingProgram[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [personnelFilter, setPersonnelFilter] = useState("all");

  const refresh = useCallback(() => {
    assignmentsApi.list().then(setAssignments);
  }, []);

  useEffect(() => {
    Promise.all([
      assignmentsApi.list(),
      personnelApi.list(),
      missionsApi.list(),
      assetsApi.list(),
      inventoryApi.list(),
      trainingApi.list(),
    ]).then(([a, p, m, as, inv, tr]) => {
      setAssignments(a);
      setPersonnel(p);
      setMissions(m);
      setAssets(as);
      setInventory(inv);
      setTraining(tr);
      setLoading(false);
    });
  }, []);

  // Refresh-based live sync — picks up status changes soldiers make from
  // their own portal (e.g. nothing yet, but keeps this in step with any
  // other commander editing the same board) without a manual reload.
  usePolling(refresh, 20_000);

  async function handleCreate(values: AssignmentFormValues) {
    try {
      const isAsset = ["weapon", "vehicle", "drone"].includes(values.type);
      const isInventory = ["ammunition", "equipment", "protective_gear", "medical_kit", "comms"].includes(values.type);
      const isTraining = values.type === "training";

      await assignmentsApi.create({
        type: values.type,
        title: values.title,
        description: values.description || undefined,
        priority: values.priority,
        quantity: values.quantity,
        dueDate: values.dueDate || undefined,
        personnelId: values.personnelId,
        missionId: values.missionId || undefined,
        assetId: isAsset ? values.catalogId || undefined : undefined,
        inventoryItemId: isInventory ? values.catalogId || undefined : undefined,
        trainingProgramId: isTraining ? values.catalogId || undefined : undefined,
      });
      toast.success("Assignment issued", "It now appears in the soldier's portal.");
      refresh();
    } catch (err) {
      toast.error("Could not create assignment", err instanceof Error ? err.message : "Please try again.");
    }
  }

  async function setStatus(id: string, status: "completed" | "cancelled" | "returned") {
    try {
      await assignmentsApi.update(id, { status });
      setAssignments((prev) => prev.map((a) => (a.id === id ? { ...a, status } : a)));
      toast.success("Assignment updated", `Marked as ${status}.`);
    } catch (err) {
      toast.error("Update failed", err instanceof Error ? err.message : "Please try again.");
    }
  }

  async function remove(id: string) {
    try {
      await assignmentsApi.remove(id);
      setAssignments((prev) => prev.filter((a) => a.id !== id));
      toast.success("Assignment removed");
    } catch (err) {
      toast.error("Delete failed", err instanceof Error ? err.message : "Please try again.");
    }
  }

  const filtered = useMemo(
    () =>
      assignments.filter(
        (a) =>
          (typeFilter === "all" || a.type === typeFilter) &&
          (statusFilter === "all" || a.status === statusFilter) &&
          (personnelFilter === "all" || a.personnel.id === personnelFilter)
      ),
    [assignments, typeFilter, statusFilter, personnelFilter]
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[color:var(--color-ink-0)]">Assignment Center</h1>
          <p className="mt-1 text-sm text-[color:var(--color-ink-3)]">
            Issue weapons, equipment, vehicles, training, tasks, and emergency orders directly to soldiers.
          </p>
        </div>
        <Button icon={<Plus />} onClick={() => setModalOpen(true)}>New Assignment</Button>
      </div>

      <Card>
        <CardContent className="flex flex-wrap items-center gap-3 !pt-6">
          <Select
            className="w-48"
            value={typeFilter}
            onValueChange={setTypeFilter}
            options={[{ label: "All types", value: "all" }, ...Object.entries(TYPE_LABELS).map(([value, label]) => ({ label, value }))]}
          />
          <Select
            className="w-44"
            value={statusFilter}
            onValueChange={setStatusFilter}
            options={[
              { label: "All statuses", value: "all" },
              { label: "Active", value: "active" },
              { label: "Completed", value: "completed" },
              { label: "Cancelled", value: "cancelled" },
              { label: "Returned", value: "returned" },
            ]}
          />
          <Select
            className="w-56"
            value={personnelFilter}
            onValueChange={setPersonnelFilter}
            options={[{ label: "All soldiers", value: "all" }, ...personnel.map((p) => ({ label: `${p.rank} ${p.name}`, value: p.id }))]}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{filtered.length} assignment{filtered.length === 1 ? "" : "s"}</CardTitle>
        </CardHeader>
        <CardContent className="!px-0 !pb-0">
          {loading ? (
            <div className="grid gap-3 p-6"> {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)} </div>
          ) : filtered.length === 0 ? (
            <div className="p-6">
              <EmptyState icon={<ClipboardList />} title="No assignments yet" description="Issue your first assignment to a soldier — it'll show up here and in their portal." />
            </div>
          ) : (
            <div className="divide-y divide-[color:var(--color-border)]">
              {filtered.map((a) => (
                <div key={a.id} className="flex flex-col gap-3 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar seed={a.personnel.avatarSeed} name={a.personnel.name} size="sm" />
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-medium text-[color:var(--color-ink-0)]">{a.title}</p>
                        <Badge tone="neutral">{TYPE_LABELS[a.type]}</Badge>
                      </div>
                      <p className="mt-0.5 truncate text-xs text-[color:var(--color-ink-3)]">
                        {a.personnel.rank} {a.personnel.name} · {a.personnel.unit}
                        {a.mission ? ` · ${a.mission.code}` : ""}
                        {a.quantity != null ? ` · ${a.quantity} units` : ""}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <PriorityBadge priority={a.priority} />
                    <StatusBadge status={a.status} />
                    {a.status === "active" && (
                      <>
                        <Button size="sm" variant="ghost" icon={<CheckCircle2 />} onClick={() => setStatus(a.id, "completed")} title="Mark completed" />
                        <Button size="sm" variant="ghost" icon={<RotateCcw />} onClick={() => setStatus(a.id, "returned")} title="Mark returned" />
                        <Button size="sm" variant="ghost" icon={<XCircle />} onClick={() => setStatus(a.id, "cancelled")} title="Cancel" />
                      </>
                    )}
                    <Button size="sm" variant="ghost" icon={<Trash2 />} onClick={() => remove(a.id)} title="Delete" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <AssignmentFormModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onSubmit={handleCreate}
        personnel={personnel}
        missions={missions}
        assets={assets}
        inventory={inventory}
        training={training}
      />
    </div>
  );
}
