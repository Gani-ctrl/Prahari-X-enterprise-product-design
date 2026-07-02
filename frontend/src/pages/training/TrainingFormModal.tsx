import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { Input, Textarea } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Switch } from "@/components/ui/Switch";
import { Button } from "@/components/ui/Button";
import type { TrainingProgram } from "@/types";

const schema = z.object({
  name: z.string().min(2, "Program name is required."),
  category: z.enum(["combat", "medical", "technical", "leadership", "survival"]),
  description: z.string().min(2, "Description is required."),
  durationHours: z.coerce.number().min(1, "Must be at least 1 hour."),
  mandatory: z.boolean(),
  status: z.enum(["upcoming", "active", "completed", "archived"]),
});

export type TrainingFormValues = z.infer<typeof schema>;

interface TrainingFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: TrainingFormValues) => Promise<void>;
  program?: TrainingProgram | null;
}

const DEFAULTS: TrainingFormValues = {
  name: "",
  category: "combat",
  description: "",
  durationHours: 8,
  mandatory: false,
  status: "upcoming",
};

export function TrainingFormModal({ open, onOpenChange, onSubmit, program }: TrainingFormModalProps) {
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<TrainingFormValues>({
    resolver: zodResolver(schema),
    defaultValues: DEFAULTS,
  });

  useEffect(() => {
    if (open) {
      reset(
        program
          ? {
              name: program.name,
              category: program.category,
              description: program.description,
              durationHours: program.durationHours,
              mandatory: program.mandatory,
              status: program.status,
            }
          : DEFAULTS
      );
    }
  }, [open, program, reset]);

  async function submit(values: TrainingFormValues) {
    await onSubmit(values);
    onOpenChange(false);
  }

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={program ? "Edit training program" : "Add training program"}
      footer={
        <>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit(submit)} loading={isSubmitting}>{program ? "Save changes" : "Add program"}</Button>
        </>
      }
    >
      <form className="space-y-4" onSubmit={handleSubmit(submit)}>
        <Input label="Program name" placeholder="Advanced Marksmanship" error={errors.name?.message} {...register("name")} />
        <Textarea label="Description" placeholder="What this program covers…" error={errors.description?.message} {...register("description")} />
        <div className="grid grid-cols-2 gap-4">
          <Controller
            control={control}
            name="category"
            render={({ field }) => (
              <Select
                label="Category"
                value={field.value}
                onValueChange={field.onChange}
                options={[
                  { label: "Combat", value: "combat" },
                  { label: "Medical", value: "medical" },
                  { label: "Technical", value: "technical" },
                  { label: "Leadership", value: "leadership" },
                  { label: "Survival", value: "survival" },
                ]}
              />
            )}
          />
          <Input label="Duration (hours)" type="number" min={1} error={errors.durationHours?.message} {...register("durationHours")} />
        </div>
        <Controller
          control={control}
          name="status"
          render={({ field }) => (
            <Select
              label="Status"
              value={field.value}
              onValueChange={field.onChange}
              options={[
                { label: "Upcoming", value: "upcoming" },
                { label: "Active", value: "active" },
                { label: "Completed", value: "completed" },
                { label: "Archived", value: "archived" },
              ]}
            />
          )}
        />
        <Controller
          control={control}
          name="mandatory"
          render={({ field }) => (
            <div className="flex items-center justify-between rounded-xl border border-[color:var(--color-border)] px-4 py-3">
              <div>
                <p className="text-sm font-medium text-[color:var(--color-ink-0)]">Mandatory for all personnel</p>
                <p className="text-xs text-[color:var(--color-ink-3)]">Required for continued deployment eligibility.</p>
              </div>
              <Switch checked={field.value} onCheckedChange={field.onChange} />
            </div>
          )}
        />
      </form>
    </Modal>
  );
}
