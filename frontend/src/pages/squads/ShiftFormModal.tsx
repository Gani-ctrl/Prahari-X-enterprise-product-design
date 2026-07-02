import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import type { Mission, Personnel } from "@/types";

const schema = z.object({
  personnelId: z.string().min(1, "Select a soldier."),
  missionId: z.string().optional(),
  shiftDate: z.string().min(1, "Date is required."),
  startTime: z.string().min(1, "Required."),
  endTime: z.string().min(1, "Required."),
  type: z.enum(["patrol", "guard", "rest", "admin"]),
});

export type ShiftFormValues = z.infer<typeof schema>;

interface ShiftFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: ShiftFormValues) => Promise<void>;
  personnel: Personnel[];
  missions: Mission[];
}

const DEFAULTS: ShiftFormValues = { personnelId: "", missionId: "", shiftDate: "", startTime: "06:00", endTime: "14:00", type: "patrol" };

export function ShiftFormModal({ open, onOpenChange, onSubmit, personnel, missions }: ShiftFormModalProps) {
  const {
    handleSubmit,
    control,
    register,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ShiftFormValues>({ resolver: zodResolver(schema), defaultValues: DEFAULTS });

  useEffect(() => {
    if (open) reset(DEFAULTS);
  }, [open, reset]);

  async function submit(values: ShiftFormValues) {
    await onSubmit(values);
    onOpenChange(false);
  }

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Schedule shift"
      footer={
        <>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit(submit)} loading={isSubmitting}>Schedule</Button>
        </>
      }
    >
      <form className="space-y-4" onSubmit={handleSubmit(submit)}>
        <Controller
          control={control}
          name="personnelId"
          render={({ field }) => (
            <Select label="Soldier" value={field.value} onValueChange={field.onChange} placeholder="Select a soldier" options={personnel.map((p) => ({ label: `${p.rank} ${p.name}`, value: p.id }))} />
          )}
        />
        {errors.personnelId?.message && <p className="-mt-2 text-xs text-[color:var(--color-danger-400)]">{errors.personnelId.message}</p>}
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
        <div className="grid grid-cols-3 gap-4">
          <Input label="Date" type="date" error={errors.shiftDate?.message} {...register("shiftDate")} />
          <Input label="Start" type="time" error={errors.startTime?.message} {...register("startTime")} />
          <Input label="End" type="time" error={errors.endTime?.message} {...register("endTime")} />
        </div>
        <Controller
          control={control}
          name="type"
          render={({ field }) => (
            <Select
              label="Shift type"
              value={field.value}
              onValueChange={field.onChange}
              options={[
                { label: "Patrol", value: "patrol" },
                { label: "Guard", value: "guard" },
                { label: "Rest", value: "rest" },
                { label: "Admin", value: "admin" },
              ]}
            />
          )}
        />
      </form>
    </Modal>
  );
}
