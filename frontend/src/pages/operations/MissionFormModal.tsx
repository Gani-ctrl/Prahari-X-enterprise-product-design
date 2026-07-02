import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { Input, Textarea } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { REGIONS } from "@/lib/mockData";
import type { Mission } from "@/types";

const schema = z.object({
  name: z.string().min(3, "Mission name is required."),
  description: z.string().min(10, "Add a short mission description."),
  region: z.string(),
  priority: z.enum(["critical", "high", "medium", "low"]),
  status: z.enum(["planning", "active", "paused", "completed", "aborted"]),
  startDate: z.string(),
  endDate: z.string(),
});

export type MissionFormValues = z.infer<typeof schema>;

interface MissionFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: MissionFormValues) => Promise<void>;
  mission?: Mission | null;
}

function toDateInput(iso: string) {
  return iso ? new Date(iso).toISOString().slice(0, 10) : "";
}

export function MissionFormModal({ open, onOpenChange, onSubmit, mission }: MissionFormModalProps) {
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<MissionFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      description: "",
      region: REGIONS[0],
      priority: "medium",
      status: "planning",
      startDate: new Date().toISOString().slice(0, 10),
      endDate: new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10),
    },
  });

  useEffect(() => {
    if (open) {
      reset(
        mission
          ? {
              name: mission.name,
              description: mission.description,
              region: mission.region,
              priority: mission.priority,
              status: mission.status,
              startDate: toDateInput(mission.startDate),
              endDate: toDateInput(mission.endDate),
            }
          : {
              name: "",
              description: "",
              region: REGIONS[0],
              priority: "medium",
              status: "planning",
              startDate: new Date().toISOString().slice(0, 10),
              endDate: new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10),
            }
      );
    }
  }, [open, mission, reset]);

  async function submit(values: MissionFormValues) {
    await onSubmit(values);
    onOpenChange(false);
  }

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={mission ? "Edit mission" : "Create new mission"}
      description={mission ? `Updating ${mission.code}` : "Define the operational parameters."}
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit(submit)} loading={isSubmitting}>{mission ? "Save changes" : "Create mission"}</Button>
        </>
      }
    >
      <form className="space-y-4" onSubmit={handleSubmit(submit)}>
        <Input label="Mission name" placeholder="Operation Silent Ridge" error={errors.name?.message} {...register("name")} />
        <Textarea label="Description" placeholder="Describe the mission objective and scope…" error={errors.description?.message} {...register("description")} />
        <div className="grid grid-cols-2 gap-4">
          <Controller
            control={control}
            name="region"
            render={({ field }) => (
              <Select label="Region" value={field.value} onValueChange={field.onChange} options={REGIONS.map((r) => ({ label: r, value: r }))} />
            )}
          />
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
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Controller
            control={control}
            name="status"
            render={({ field }) => (
              <Select
                label="Status"
                value={field.value}
                onValueChange={field.onChange}
                options={[
                  { label: "Planning", value: "planning" },
                  { label: "Active", value: "active" },
                  { label: "Paused", value: "paused" },
                  { label: "Completed", value: "completed" },
                  { label: "Aborted", value: "aborted" },
                ]}
              />
            )}
          />
          <div />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Input label="Start date" type="date" error={errors.startDate?.message} {...register("startDate")} />
          <Input label="End date" type="date" error={errors.endDate?.message} {...register("endDate")} />
        </div>
      </form>
    </Modal>
  );
}
