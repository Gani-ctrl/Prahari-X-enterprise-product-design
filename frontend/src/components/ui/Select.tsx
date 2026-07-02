import * as SelectPrimitive from "@radix-ui/react-select";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SelectOption {
  label: string;
  value: string;
}

interface SelectProps {
  value: string;
  onValueChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  label?: string;
  className?: string;
}

export function Select({ value, onValueChange, options, placeholder, label, className }: SelectProps) {
  return (
    <div className={className}>
      {label && <label className="mb-1.5 block text-xs font-medium text-[color:var(--color-ink-2)]">{label}</label>}
      <SelectPrimitive.Root value={value} onValueChange={onValueChange}>
        <SelectPrimitive.Trigger
          className={cn(
            "flex h-10 w-full items-center justify-between gap-2 rounded-[var(--radius-sm)] border border-[color:var(--color-border-strong)] bg-[color:var(--color-surface)] px-3 text-sm text-[color:var(--color-ink-0)]",
            "focus:outline-none focus:ring-2 focus:ring-[color:var(--color-sentinel-500)]/25 data-[placeholder]:text-[color:var(--color-ink-3)]"
          )}
        >
          <SelectPrimitive.Value placeholder={placeholder} />
          <SelectPrimitive.Icon>
            <ChevronDown className="h-4 w-4 text-[color:var(--color-ink-3)]" />
          </SelectPrimitive.Icon>
        </SelectPrimitive.Trigger>
        <SelectPrimitive.Portal>
          <SelectPrimitive.Content
            className="z-50 overflow-hidden rounded-[var(--radius-md)] border border-[color:var(--color-border-strong)] bg-[color:var(--color-surface-2)] shadow-[var(--shadow-float)]"
            position="popper"
            sideOffset={6}
          >
            <SelectPrimitive.Viewport className="p-1">
              {options.map((opt) => (
                <SelectPrimitive.Item
                  key={opt.value}
                  value={opt.value}
                  className="relative flex cursor-pointer select-none items-center rounded-[var(--radius-xs)] py-2 pl-8 pr-3 text-sm text-[color:var(--color-ink-1)] outline-none data-[highlighted]:bg-white/5 data-[highlighted]:text-[color:var(--color-ink-0)] data-[state=checked]:text-[color:var(--color-ink-0)]"
                >
                  <SelectPrimitive.ItemIndicator className="absolute left-2.5 inline-flex items-center">
                    <Check className="h-3.5 w-3.5 text-[color:var(--color-sentinel-400)]" />
                  </SelectPrimitive.ItemIndicator>
                  <SelectPrimitive.ItemText>{opt.label}</SelectPrimitive.ItemText>
                </SelectPrimitive.Item>
              ))}
            </SelectPrimitive.Viewport>
          </SelectPrimitive.Content>
        </SelectPrimitive.Portal>
      </SelectPrimitive.Root>
    </div>
  );
}
