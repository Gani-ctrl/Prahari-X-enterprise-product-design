import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { REGIONS } from "@/lib/mockData";
import type { InventoryCategory, InventoryItem } from "@/types";

const schema = z.object({
  name: z.string().min(2, "Item name is required."),
  category: z.enum(["firearm", "ammunition", "tactical_gear", "vehicle", "drone"]),
  spec: z.string().min(2, "Specification is required."),
  quantity: z.coerce.number().min(0, "Must be 0 or more."),
  reorderThreshold: z.coerce.number().min(0, "Must be 0 or more."),
  location: z.string(),
  unitCost: z.coerce.number().min(0, "Must be 0 or more."),
});

export type WeaponFormValues = z.infer<typeof schema>;

interface WeaponFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: WeaponFormValues) => Promise<void>;
  item?: InventoryItem | null;
  defaultCategory?: InventoryCategory;
}

const CATEGORY_OPTIONS = [
  { label: "Firearm", value: "firearm" },
  { label: "Ammunition", value: "ammunition" },
  { label: "Tactical Gear", value: "tactical_gear" },
  { label: "Vehicle", value: "vehicle" },
  { label: "Drone", value: "drone" },
];

function defaults(defaultCategory?: InventoryCategory): WeaponFormValues {
  return {
    name: "",
    category: defaultCategory ?? "firearm",
    spec: "",
    quantity: 0,
    reorderThreshold: 10,
    location: REGIONS[0],
    unitCost: 0,
  };
}

export function WeaponFormModal({ open, onOpenChange, onSubmit, item, defaultCategory }: WeaponFormModalProps) {
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<WeaponFormValues>({
    resolver: zodResolver(schema),
    defaultValues: defaults(defaultCategory),
  });

  useEffect(() => {
    if (open) {
      reset(
        item
          ? {
              name: item.name,
              category: item.category,
              spec: item.spec,
              quantity: item.quantity,
              reorderThreshold: item.reorderThreshold,
              location: item.location,
              unitCost: item.unitCost,
            }
          : defaults(defaultCategory)
      );
    }
  }, [open, item, defaultCategory, reset]);

  async function submit(values: WeaponFormValues) {
    await onSubmit(values);
    onOpenChange(false);
  }

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={item ? "Edit inventory item" : "Add inventory item"}
      footer={
        <>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit(submit)} loading={isSubmitting}>{item ? "Save changes" : "Add item"}</Button>
        </>
      }
    >
      <form className="space-y-4" onSubmit={handleSubmit(submit)}>
        <Input label="Item name" placeholder="Sentinel DMR-9" error={errors.name?.message} {...register("name")} />
        <div className="grid grid-cols-2 gap-4">
          <Controller
            control={control}
            name="category"
            render={({ field }) => (
              <Select label="Category" value={field.value} onValueChange={field.onChange} options={CATEGORY_OPTIONS} />
            )}
          />
          <Input label="Specification" placeholder="7.62x51mm designated marksman rifle" error={errors.spec?.message} {...register("spec")} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Input label="Quantity in stock" type="number" min={0} error={errors.quantity?.message} {...register("quantity")} />
          <Input label="Reorder threshold" type="number" min={0} error={errors.reorderThreshold?.message} {...register("reorderThreshold")} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Controller
            control={control}
            name="location"
            render={({ field }) => (
              <Select label="Storage location" value={field.value} onValueChange={field.onChange} options={REGIONS.map((r) => ({ label: r, value: r }))} />
            )}
          />
          <Input label="Unit cost (USD)" type="number" min={0} step="0.01" error={errors.unitCost?.message} {...register("unitCost")} />
        </div>
      </form>
    </Modal>
  );
}
