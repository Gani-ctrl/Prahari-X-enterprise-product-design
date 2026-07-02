import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { Input, Textarea } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

const schema = z
  .object({
    reason: z.string().min(2, "Reason is required."),
    startDate: z.string().min(1, "Start date is required."),
    endDate: z.string().min(1, "End date is required."),
  })
  .refine((d) => new Date(d.endDate) >= new Date(d.startDate), { message: "End date must be on or after start date.", path: ["endDate"] });

export type LeaveRequestFormValues = z.infer<typeof schema>;

interface LeaveRequestModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: LeaveRequestFormValues) => Promise<void>;
}

export function LeaveRequestModal({ open, onOpenChange, onSubmit }: LeaveRequestModalProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<LeaveRequestFormValues>({ resolver: zodResolver(schema), defaultValues: { reason: "", startDate: "", endDate: "" } });

  useEffect(() => {
    if (open) reset({ reason: "", startDate: "", endDate: "" });
  }, [open, reset]);

  async function submit(values: LeaveRequestFormValues) {
    await onSubmit(values);
    onOpenChange(false);
  }

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Request leave"
      description="Your Commander will approve or reject this request."
      footer={
        <>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button variant="amber" onClick={handleSubmit(submit)} loading={isSubmitting}>Submit request</Button>
        </>
      }
    >
      <form className="space-y-4" onSubmit={handleSubmit(submit)}>
        <Textarea label="Reason" placeholder="Reason for leave…" error={errors.reason?.message} {...register("reason")} />
        <div className="grid grid-cols-2 gap-4">
          <Input label="Start date" type="date" error={errors.startDate?.message} {...register("startDate")} />
          <Input label="End date" type="date" error={errors.endDate?.message} {...register("endDate")} />
        </div>
      </form>
    </Modal>
  );
}
