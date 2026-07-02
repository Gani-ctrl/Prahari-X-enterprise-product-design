import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { REGIONS } from "@/lib/mockData";
import type { Personnel } from "@/types";

const schema = z.object({
  name: z.string().min(2, "Name is required."),
  rank: z.string().min(2, "Rank is required."),
  roleTitle: z.string().min(2, "Role is required."),
  unit: z.string().min(2, "Unit is required."),
  status: z.enum(["available", "deployed", "leave", "medical"]),
  email: z.string().email("Enter a valid email."),
  phone: z.string().min(6, "Enter a valid phone number."),
  location: z.string(),
  performanceScore: z.coerce.number().min(0, "0-100").max(100, "0-100"),
});

export type PersonnelFormValues = z.infer<typeof schema>;

interface PersonnelFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: PersonnelFormValues) => Promise<void>;
  personnel?: Personnel | null;
}

const DEFAULTS: PersonnelFormValues = {
  name: "",
  rank: "Lieutenant",
  roleTitle: "Field Operative",
  unit: "1st Sentinel Battalion",
  status: "available",
  email: "",
  phone: "",
  location: REGIONS[0],
  performanceScore: 75,
};

export function PersonnelFormModal({ open, onOpenChange, onSubmit, personnel }: PersonnelFormModalProps) {
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PersonnelFormValues>({
    resolver: zodResolver(schema),
    defaultValues: DEFAULTS,
  });

  useEffect(() => {
    if (open) {
      reset(
        personnel
          ? {
              name: personnel.name,
              rank: personnel.rank,
              roleTitle: personnel.roleTitle,
              unit: personnel.unit,
              status: personnel.status,
              email: personnel.email,
              phone: personnel.phone,
              location: personnel.location,
              performanceScore: personnel.performanceScore,
            }
          : DEFAULTS
      );
    }
  }, [open, personnel, reset]);

  async function submit(values: PersonnelFormValues) {
    await onSubmit(values);
    onOpenChange(false);
  }

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={personnel ? "Edit personnel record" : "Add personnel record"}
      footer={
        <>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit(submit)} loading={isSubmitting}>{personnel ? "Save changes" : "Add officer"}</Button>
        </>
      }
    >
      <form className="space-y-4" onSubmit={handleSubmit(submit)}>
        <Input label="Full name" placeholder="Arjun Rathore" error={errors.name?.message} {...register("name")} />
        <div className="grid grid-cols-2 gap-4">
          <Input label="Rank" placeholder="Captain" error={errors.rank?.message} {...register("rank")} />
          <Input label="Role" placeholder="Field Operative" error={errors.roleTitle?.message} {...register("roleTitle")} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Input label="Unit" placeholder="1st Sentinel Battalion" error={errors.unit?.message} {...register("unit")} />
          <Controller
            control={control}
            name="status"
            render={({ field }) => (
              <Select
                label="Status"
                value={field.value}
                onValueChange={field.onChange}
                options={[
                  { label: "Available", value: "available" },
                  { label: "Deployed", value: "deployed" },
                  { label: "Leave", value: "leave" },
                  { label: "Medical", value: "medical" },
                ]}
              />
            )}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Controller
            control={control}
            name="location"
            render={({ field }) => (
              <Select label="Current location" value={field.value} onValueChange={field.onChange} options={REGIONS.map((r) => ({ label: r, value: r }))} />
            )}
          />
          <Input label="Performance score" type="number" min={0} max={100} error={errors.performanceScore?.message} {...register("performanceScore")} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Input label="Email" type="email" placeholder="officer@prahari-x.mil" error={errors.email?.message} {...register("email")} />
          <Input label="Phone" placeholder="+91 9012345678" error={errors.phone?.message} {...register("phone")} />
        </div>
      </form>
    </Modal>
  );
}
