import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { Input, Textarea } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import type { Personnel } from "@/types";

const schema = z.object({
  personnelId: z.string().min(1, "Select a soldier."),
  title: z.string().min(2, "Title is required."),
  description: z.string().min(1, "Description is required."),
});

export type BadgeFormValues = z.infer<typeof schema>;

interface BadgeFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: BadgeFormValues) => Promise<void>;
  personnel: Personnel[];
}

export function BadgeFormModal({ open, onOpenChange, onSubmit, personnel }: BadgeFormModalProps) {
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<BadgeFormValues>({ resolver: zodResolver(schema), defaultValues: { personnelId: "", title: "", description: "" } });

  useEffect(() => {
    if (open) reset({ personnelId: "", title: "", description: "" });
  }, [open, reset]);

  async function submit(values: BadgeFormValues) {
    await onSubmit(values);
    onOpenChange(false);
  }

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Award badge"
      description="Recognizes a soldier's achievement — appears on their profile immediately."
      footer={
        <>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit(submit)} loading={isSubmitting}>Award badge</Button>
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
        <Input label="Badge title" placeholder="Marksman Ribbon" error={errors.title?.message} {...register("title")} />
        <Textarea label="Description" placeholder="What was this awarded for?" error={errors.description?.message} {...register("description")} />
      </form>
    </Modal>
  );
}
