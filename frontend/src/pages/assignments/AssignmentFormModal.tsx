import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { Input, Textarea } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import type { Asset, AssignmentType, InventoryItem, Mission, Personnel, TrainingProgram } from "@/types";

const TYPE_OPTIONS: { label: string; value: AssignmentType }[] = [
  { label: "Weapon", value: "weapon" },
  { label: "Ammunition", value: "ammunition" },
  { label: "Equipment", value: "equipment" },
  { label: "Vehicle", value: "vehicle" },
  { label: "Drone", value: "drone" },
  { label: "Communication device", value: "comms" },
  { label: "Medical kit", value: "medical_kit" },
  { label: "Protective gear", value: "protective_gear" },
  { label: "Training program", value: "training" },
  { label: "Daily task", value: "task" },
  { label: "Emergency assignment", value: "emergency" },
];

const ASSET_TYPES: AssignmentType[] = ["weapon", "vehicle", "drone"];
const INVENTORY_TYPES: AssignmentType[] = ["ammunition", "equipment", "protective_gear", "medical_kit", "comms"];

const schema = z.object({
  type: z.enum(["weapon", "ammunition", "equipment", "vehicle", "drone", "comms", "medical_kit", "protective_gear", "training", "task", "emergency"]),
  title: z.string().min(2, "Title is required."),
  description: z.string().optional(),
  personnelId: z.string().min(1, "Select a soldier."),
  missionId: z.string().optional(),
  priority: z.enum(["critical", "high", "medium", "low"]),
  quantity: z.coerce.number().min(0).optional(),
  dueDate: z.string().optional(),
  catalogId: z.string().optional(),
});

export type AssignmentFormValues = z.infer<typeof schema>;

interface AssignmentFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: AssignmentFormValues) => Promise<void>;
  personnel: Personnel[];
  missions: Mission[];
  assets: Asset[];
  inventory: InventoryItem[];
  training: TrainingProgram[];
  defaultPersonnelId?: string;
}

const DEFAULTS: AssignmentFormValues = {
  type: "task",
  title: "",
  description: "",
  personnelId: "",
  missionId: "",
  priority: "medium",
  quantity: undefined,
  dueDate: "",
  catalogId: "",
};

export function AssignmentFormModal({ open, onOpenChange, onSubmit, personnel, missions, assets, inventory, training, defaultPersonnelId }: AssignmentFormModalProps) {
  const {
    register,
    handleSubmit,
    control,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AssignmentFormValues>({ resolver: zodResolver(schema), defaultValues: DEFAULTS });

  const type = watch("type");

  useEffect(() => {
    if (open) reset({ ...DEFAULTS, personnelId: defaultPersonnelId ?? "" });
  }, [open, defaultPersonnelId, reset]);

  async function submit(values: AssignmentFormValues) {
    await onSubmit(values);
    onOpenChange(false);
  }

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="New assignment"
      description="Issue equipment, a task, or an order directly to a soldier — it appears in their portal immediately."
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit(submit)} loading={isSubmitting}>Assign</Button>
        </>
      }
    >
      <form className="space-y-4" onSubmit={handleSubmit(submit)}>
        <div className="grid grid-cols-2 gap-4">
          <Controller
            control={control}
            name="type"
            render={({ field }) => <Select label="Assignment type" value={field.value} onValueChange={field.onChange} options={TYPE_OPTIONS} />}
          />
          <Controller
            control={control}
            name="personnelId"
            render={({ field }) => (
              <Select
                label="Assign to"
                value={field.value}
                onValueChange={field.onChange}
                placeholder="Select a soldier"
                options={personnel.map((p) => ({ label: `${p.rank} ${p.name}`, value: p.id }))}
              />
            )}
          />
        </div>

        <Input label="Title" placeholder="Sentinel DMR-9, Perimeter check, etc." error={errors.title?.message} {...register("title")} />
        <Textarea label="Description" placeholder="Details, instructions, or context…" {...register("description")} />

        <div className="grid grid-cols-2 gap-4">
          <Controller
            control={control}
            name="priority"
            render={({ field }) => (
              <Select
                label="Priority"
                value={field.value}
                onValueChange={field.onChange}
                options={[
                  { label: "Critical", value: "critical" },
                  { label: "High", value: "high" },
                  { label: "Medium", value: "medium" },
                  { label: "Low", value: "low" },
                ]}
              />
            )}
          />
          <Input label="Due date" type="date" {...register("dueDate")} />
        </div>

        <Controller
          control={control}
          name="missionId"
          render={({ field }) => (
            <Select
              label="Related mission (optional)"
              value={field.value || "none"}
              onValueChange={(v) => field.onChange(v === "none" ? "" : v)}
              options={[{ label: "None", value: "none" }, ...missions.map((m) => ({ label: `${m.code} — ${m.name}`, value: m.id }))]}
            />
          )}
        />

        {ASSET_TYPES.includes(type) && (
          <Controller
            control={control}
            name="catalogId"
            render={({ field }) => (
              <Select
                label="Link to catalog asset (optional)"
                value={field.value || "none"}
                onValueChange={(v) => field.onChange(v === "none" ? "" : v)}
                options={[{ label: "None", value: "none" }, ...assets.filter((a) => a.category === type).map((a) => ({ label: a.name, value: a.id }))]}
              />
            )}
          />
        )}

        {INVENTORY_TYPES.includes(type) && (
          <div className="grid grid-cols-2 gap-4">
            <Controller
              control={control}
              name="catalogId"
              render={({ field }) => (
                <Select
                  label="Link to inventory item (optional)"
                  value={field.value || "none"}
                  onValueChange={(v) => field.onChange(v === "none" ? "" : v)}
                  options={[{ label: "None", value: "none" }, ...inventory.map((i) => ({ label: i.name, value: i.id }))]}
                />
              )}
            />
            {type === "ammunition" && <Input label="Quantity (rounds)" type="number" min={0} {...register("quantity")} />}
          </div>
        )}

        {type === "training" && (
          <Controller
            control={control}
            name="catalogId"
            render={({ field }) => (
              <Select
                label="Link to training program (optional)"
                value={field.value || "none"}
                onValueChange={(v) => field.onChange(v === "none" ? "" : v)}
                options={[{ label: "None", value: "none" }, ...training.map((t) => ({ label: t.name, value: t.id }))]}
              />
            )}
          />
        )}
      </form>
    </Modal>
  );
}
