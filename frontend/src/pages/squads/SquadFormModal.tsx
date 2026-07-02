import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { UNITS } from "@/lib/mockData";
import type { Personnel, Squad } from "@/types";

const schema = z.object({
  name: z.string().min(2, "Squad name is required."),
  unit: z.string().min(2),
  leaderId: z.string().optional(),
  memberIds: z.array(z.string()).default([]),
});

export type SquadFormValues = z.infer<typeof schema>;

interface SquadFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: SquadFormValues) => Promise<void>;
  personnel: Personnel[];
  squad?: Squad | null;
}

function defaults(squad?: Squad | null): SquadFormValues {
  return {
    name: squad?.name ?? "",
    unit: squad?.unit ?? UNITS[0],
    leaderId: squad?.leaderId ?? "",
    memberIds: squad?.members.map((m) => m.personnel.id) ?? [],
  };
}

export function SquadFormModal({ open, onOpenChange, onSubmit, personnel, squad }: SquadFormModalProps) {
  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<SquadFormValues>({ resolver: zodResolver(schema), defaultValues: defaults(squad) });

  const memberIds = watch("memberIds");

  useEffect(() => {
    if (open) reset(defaults(squad));
  }, [open, squad, reset]);

  function toggleMember(id: string) {
    setValue("memberIds", memberIds.includes(id) ? memberIds.filter((m) => m !== id) : [...memberIds, id]);
  }

  async function submit(values: SquadFormValues) {
    await onSubmit(values);
    onOpenChange(false);
  }

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={squad ? "Edit squad" : "New squad"}
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit(submit)} loading={isSubmitting}>{squad ? "Save changes" : "Create squad"}</Button>
        </>
      }
    >
      <form className="space-y-4" onSubmit={handleSubmit(submit)}>
        <div className="grid grid-cols-2 gap-4">
          <Input label="Squad name" placeholder="Alpha Squad" error={errors.name?.message} {...register("name")} />
          <Controller
            control={control}
            name="unit"
            render={({ field }) => <Select label="Parent unit" value={field.value} onValueChange={field.onChange} options={UNITS.map((u) => ({ label: u, value: u }))} />}
          />
        </div>
        <Controller
          control={control}
          name="leaderId"
          render={({ field }) => (
            <Select
              label="Team leader"
              value={field.value || "none"}
              onValueChange={(v) => field.onChange(v === "none" ? "" : v)}
              options={[{ label: "None", value: "none" }, ...personnel.map((p) => ({ label: `${p.rank} ${p.name}`, value: p.id }))]}
            />
          )}
        />
        <div>
          <p className="mb-1.5 text-xs font-medium text-[color:var(--color-ink-2)]">Members</p>
          <div className="max-h-56 space-y-1.5 overflow-y-auto rounded-[var(--radius-sm)] border border-[color:var(--color-border-strong)] p-2">
            {personnel.map((p) => (
              <label key={p.id} className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm hover:bg-white/5">
                <input type="checkbox" checked={memberIds.includes(p.id)} onChange={() => toggleMember(p.id)} className="h-3.5 w-3.5 accent-[color:var(--color-sentinel-500)]" />
                <span className="text-[color:var(--color-ink-1)]">{p.rank} {p.name}</span>
                <span className="ml-auto text-xs text-[color:var(--color-ink-4)]">{p.unit}</span>
              </label>
            ))}
          </div>
        </div>
      </form>
    </Modal>
  );
}
