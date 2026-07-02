import * as SwitchPrimitive from "@radix-ui/react-switch";
import { cn } from "@/lib/utils";

interface SwitchProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label?: string;
  description?: string;
  disabled?: boolean;
}

export function Switch({ checked, onCheckedChange, label, description, disabled }: SwitchProps) {
  return (
    <div className="flex items-center justify-between gap-4">
      {(label || description) && (
        <div>
          {label && <p className="text-sm font-medium text-[color:var(--color-ink-0)]">{label}</p>}
          {description && <p className="mt-0.5 text-xs text-[color:var(--color-ink-3)]">{description}</p>}
        </div>
      )}
      <SwitchPrimitive.Root
        checked={checked}
        onCheckedChange={onCheckedChange}
        disabled={disabled}
        className={cn(
          "relative h-6 w-11 shrink-0 rounded-full border transition-colors duration-200",
          checked
            ? "border-[color:var(--color-sentinel-500)] bg-[color:var(--color-sentinel-500)]"
            : "border-[color:var(--color-border-strong)] bg-[color:var(--color-surface-3)]",
          "disabled:opacity-40"
        )}
      >
        <SwitchPrimitive.Thumb
          className={cn(
            "block h-[18px] w-[18px] translate-x-0.5 rounded-full bg-white shadow transition-transform duration-200 ease-[var(--ease-spring)]",
            checked && "translate-x-[22px]"
          )}
        />
      </SwitchPrimitive.Root>
    </div>
  );
}
