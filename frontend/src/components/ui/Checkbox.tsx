import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface CheckboxProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label?: string;
  id?: string;
}

export function Checkbox({ checked, onCheckedChange, label, id }: CheckboxProps) {
  return (
    <label htmlFor={id} className="inline-flex cursor-pointer items-center gap-2.5">
      <CheckboxPrimitive.Root
        id={id}
        checked={checked}
        onCheckedChange={(v) => onCheckedChange(Boolean(v))}
        className={cn(
          "flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-[5px] border transition-colors",
          checked
            ? "border-[color:var(--color-sentinel-500)] bg-[color:var(--color-sentinel-500)]"
            : "border-[color:var(--color-border-strong)] bg-[color:var(--color-surface)]"
        )}
      >
        <CheckboxPrimitive.Indicator>
          <Check className="h-3 w-3 text-white" />
        </CheckboxPrimitive.Indicator>
      </CheckboxPrimitive.Root>
      {label && <span className="text-sm text-[color:var(--color-ink-1)]">{label}</span>}
    </label>
  );
}
