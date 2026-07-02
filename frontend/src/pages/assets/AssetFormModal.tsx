import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { REGIONS } from "@/lib/mockData";
import type { Asset, AssetCategory } from "@/types";

const schema = z.object({
  name: z.string().min(2, "Asset name is required."),
  category: z.enum(["vehicle", "drone", "weapon", "medical", "satellite"]),
  model: z.string().min(2, "Model is required."),
  status: z.enum(["operational", "maintenance", "deployed", "decommissioned"]),
  location: z.string(),
});

export type AssetFormValues = z.infer<typeof schema>;

interface AssetFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: AssetFormValues) => Promise<void>;
  asset?: Asset | null;
  defaultCategory?: AssetCategory;
}

export function AssetFormModal({ open, onOpenChange, onSubmit, asset, defaultCategory }: AssetFormModalProps) {
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AssetFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", category: defaultCategory ?? "vehicle", model: "", status: "operational", location: REGIONS[0] },
  });

  useEffect(() => {
    if (open) {
      reset(
        asset
          ? { name: asset.name, category: asset.category, model: asset.model, status: asset.status, location: asset.location }
          : { name: "", category: defaultCategory ?? "vehicle", model: "", status: "operational", location: REGIONS[0] }
      );
    }
  }, [open, asset, defaultCategory, reset]);

  async function submit(values: AssetFormValues) {
    await onSubmit(values);
    onOpenChange(false);
  }

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={asset ? "Edit asset" : "Add new asset"}
      footer={
        <>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit(submit)} loading={isSubmitting}>{asset ? "Save changes" : "Add asset"}</Button>
        </>
      }
    >
      <form className="space-y-4" onSubmit={handleSubmit(submit)}>
        <Input label="Asset name" placeholder="Kestrel APC-4 #104" error={errors.name?.message} {...register("name")} />
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
                  { label: "Vehicle", value: "vehicle" },
                  { label: "Drone", value: "drone" },
                  { label: "Weapon", value: "weapon" },
                  { label: "Medical", value: "medical" },
                  { label: "Satellite", value: "satellite" },
                ]}
              />
            )}
          />
          <Input label="Model" placeholder="Kestrel APC-4" error={errors.model?.message} {...register("model")} />
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
                  { label: "Operational", value: "operational" },
                  { label: "Deployed", value: "deployed" },
                  { label: "Maintenance", value: "maintenance" },
                  { label: "Decommissioned", value: "decommissioned" },
                ]}
              />
            )}
          />
          <Controller
            control={control}
            name="location"
            render={({ field }) => (
              <Select label="Location" value={field.value} onValueChange={field.onChange} options={REGIONS.map((r) => ({ label: r, value: r }))} />
            )}
          />
        </div>
      </form>
    </Modal>
  );
}
