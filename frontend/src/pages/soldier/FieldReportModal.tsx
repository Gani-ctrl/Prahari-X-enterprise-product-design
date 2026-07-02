import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { Input, Textarea } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import type { FieldReportType } from "@/types";

const TYPE_OPTIONS: { label: string; value: FieldReportType }[] = [
  { label: "Daily report", value: "daily" },
  { label: "Mission progress update", value: "mission_progress" },
  { label: "Equipment condition report", value: "equipment_condition" },
  { label: "Weapon status report", value: "weapon_status" },
  { label: "Ammunition consumption report", value: "ammo_consumption" },
  { label: "Vehicle status report", value: "vehicle_status" },
  { label: "Medical request", value: "medical_request" },
  { label: "Incident report", value: "incident" },
  { label: "Emergency alert", value: "emergency_alert" },
  { label: "Mission completion report", value: "mission_completion" },
];

const schema = z.object({
  type: z.enum(["daily", "mission_progress", "equipment_condition", "weapon_status", "ammo_consumption", "vehicle_status", "medical_request", "incident", "emergency_alert", "mission_completion"]),
  title: z.string().min(2, "Title is required."),
  content: z.string().min(1, "Details are required."),
  severity: z.enum(["critical", "high", "medium", "low"]).optional(),
});

export type FieldReportFormValues = z.infer<typeof schema>;

interface FieldReportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: FieldReportFormValues) => Promise<void>;
  defaultType?: FieldReportType;
}

export function FieldReportModal({ open, onOpenChange, onSubmit, defaultType = "daily" }: FieldReportModalProps) {
  const {
    register,
    handleSubmit,
    control,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FieldReportFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { type: defaultType, title: "", content: "", severity: undefined },
  });

  const type = watch("type");
  const isUrgent = type === "incident" || type === "emergency_alert";

  useEffect(() => {
    if (open) reset({ type: defaultType, title: "", content: "", severity: undefined });
  }, [open, defaultType, reset]);

  async function submit(values: FieldReportFormValues) {
    await onSubmit(values);
    onOpenChange(false);
  }

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Submit report"
      description="Sent straight to your Commander for review — appears in their portal immediately."
      footer={
        <>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button variant="amber" onClick={handleSubmit(submit)} loading={isSubmitting}>Submit</Button>
        </>
      }
    >
      <form className="space-y-4" onSubmit={handleSubmit(submit)}>
        <Controller
          control={control}
          name="type"
          render={({ field }) => <Select label="Report type" value={field.value} onValueChange={field.onChange} options={TYPE_OPTIONS} />}
        />
        <Input label="Title" placeholder="Brief summary" error={errors.title?.message} {...register("title")} />
        <Textarea label="Details" placeholder="What happened, status, or update…" error={errors.content?.message} {...register("content")} />
        {isUrgent && (
          <Controller
            control={control}
            name="severity"
            render={({ field }) => (
              <Select
                label="Severity"
                value={field.value ?? "high"}
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
        )}
      </form>
    </Modal>
  );
}
