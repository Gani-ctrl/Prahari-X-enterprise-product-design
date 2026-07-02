import { useForm, Controller, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useEffect } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { REGIONS } from "@/lib/mockData";
import type { Mission, Squad } from "@/types";

const pointSchema = z.object({
  kind: z.enum(["waypoint", "checkpoint"]),
  label: z.string().min(1, "Required"),
  location: z.string().min(1, "Required"),
});

const schema = z.object({
  name: z.string().min(2, "Route name is required."),
  region: z.string().min(1),
  missionId: z.string().optional(),
  squadId: z.string().optional(),
  points: z.array(pointSchema).min(1, "Add at least one waypoint or checkpoint."),
});

export type PatrolRouteFormValues = z.infer<typeof schema>;

interface PatrolRouteFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: PatrolRouteFormValues) => Promise<void>;
  missions: Mission[];
  squads: Squad[];
}

const DEFAULTS: PatrolRouteFormValues = {
  name: "",
  region: REGIONS[0],
  missionId: "",
  squadId: "",
  points: [{ kind: "waypoint", label: "", location: REGIONS[0] }],
};

export function PatrolRouteFormModal({ open, onOpenChange, onSubmit, missions, squads }: PatrolRouteFormModalProps) {
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PatrolRouteFormValues>({ resolver: zodResolver(schema), defaultValues: DEFAULTS });

  const { fields, append, remove } = useFieldArray({ control, name: "points" });

  useEffect(() => {
    if (open) reset(DEFAULTS);
  }, [open, reset]);

  async function submit(values: PatrolRouteFormValues) {
    await onSubmit(values);
    onOpenChange(false);
  }

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="New patrol route"
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit(submit)} loading={isSubmitting}>Create route</Button>
        </>
      }
    >
      <form className="space-y-4" onSubmit={handleSubmit(submit)}>
        <div className="grid grid-cols-2 gap-4">
          <Input label="Route name" placeholder="Northern Perimeter Sweep" error={errors.name?.message} {...register("name")} />
          <Controller
            control={control}
            name="region"
            render={({ field }) => <Select label="Region" value={field.value} onValueChange={field.onChange} options={REGIONS.map((r) => ({ label: r, value: r }))} />}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Controller
            control={control}
            name="missionId"
            render={({ field }) => (
              <Select
                label="Mission (optional)"
                value={field.value || "none"}
                onValueChange={(v) => field.onChange(v === "none" ? "" : v)}
                options={[{ label: "None", value: "none" }, ...missions.map((m) => ({ label: `${m.code} — ${m.name}`, value: m.id }))]}
              />
            )}
          />
          <Controller
            control={control}
            name="squadId"
            render={({ field }) => (
              <Select
                label="Squad (optional)"
                value={field.value || "none"}
                onValueChange={(v) => field.onChange(v === "none" ? "" : v)}
                options={[{ label: "None", value: "none" }, ...squads.map((s) => ({ label: s.name, value: s.id }))]}
              />
            )}
          />
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <p className="text-xs font-medium text-[color:var(--color-ink-2)]">Waypoints &amp; checkpoints</p>
            <Button type="button" size="sm" variant="ghost" icon={<Plus />} onClick={() => append({ kind: "waypoint", label: "", location: REGIONS[0] })}>Add point</Button>
          </div>
          {errors.points?.message && <p className="mb-2 text-xs text-[color:var(--color-danger-400)]">{errors.points.message}</p>}
          <div className="space-y-2.5">
            {fields.map((field, index) => (
              <div key={field.id} className="grid grid-cols-[100px_1fr_1fr_32px] items-end gap-2 rounded-lg border border-[color:var(--color-border)] p-2.5">
                <Controller
                  control={control}
                  name={`points.${index}.kind`}
                  render={({ field: f }) => (
                    <Select value={f.value} onValueChange={f.onChange} options={[{ label: "Waypoint", value: "waypoint" }, { label: "Checkpoint", value: "checkpoint" }]} />
                  )}
                />
                <Input placeholder="Label" {...register(`points.${index}.label` as const)} />
                <Input placeholder="Location" {...register(`points.${index}.location` as const)} />
                <Button type="button" size="sm" variant="ghost" icon={<Trash2 />} onClick={() => remove(index)} />
              </div>
            ))}
          </div>
        </div>
      </form>
    </Modal>
  );
}
