import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { Input, Textarea } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { REGIONS } from "@/lib/mockData";
import type { ThreatReport } from "@/types";

const schema = z.object({
  title: z.string().min(4, "Give the report a clear title."),
  category: z.enum(["cyber", "drone", "satellite", "ground", "signal"]),
  severity: z.enum(["critical", "high", "medium", "low"]),
  region: z.string(),
  description: z.string().min(10, "Add a short description."),
});

export type ThreatFormValues = z.infer<typeof schema>;

interface ThreatFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: ThreatFormValues) => Promise<void>;
  threat?: ThreatReport | null;
}

export function ThreatFormModal({ open, onOpenChange, onSubmit, threat }: ThreatFormModalProps) {
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ThreatFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { title: "", category: "cyber", severity: "medium", region: REGIONS[0], description: "" },
  });

  useEffect(() => {
    if (open) {
      reset(
        threat
          ? { title: threat.title, category: threat.category, severity: threat.severity, region: threat.region, description: threat.description }
          : { title: "", category: "cyber", severity: "medium", region: REGIONS[0], description: "" }
      );
    }
  }, [open, threat, reset]);

  async function submit(values: ThreatFormValues) {
    await onSubmit(values);
    onOpenChange(false);
  }

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={threat ? "Edit threat report" : "Log new threat report"}
      size="md"
      footer={
        <>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit(submit)} loading={isSubmitting}>{threat ? "Save changes" : "Log report"}</Button>
        </>
      }
    >
      <form className="space-y-4" onSubmit={handleSubmit(submit)}>
        <Input label="Title" placeholder="Anomalous intrusion attempt…" error={errors.title?.message} {...register("title")} />
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
                  { label: "Cyber", value: "cyber" },
                  { label: "Drone", value: "drone" },
                  { label: "Satellite", value: "satellite" },
                  { label: "Ground", value: "ground" },
                  { label: "Signal", value: "signal" },
                ]}
              />
            )}
          />
          <Controller
            control={control}
            name="severity"
            render={({ field }) => (
              <Select
                label="Severity"
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
        <Controller
          control={control}
          name="region"
          render={({ field }) => (
            <Select label="Region" value={field.value} onValueChange={field.onChange} options={REGIONS.map((r) => ({ label: r, value: r }))} />
          )}
        />
        <Textarea label="Description" placeholder="Describe the detected signal or activity…" error={errors.description?.message} {...register("description")} />
      </form>
    </Modal>
  );
}
