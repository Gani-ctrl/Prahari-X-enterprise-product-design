import * as TabsPrimitive from "@radix-ui/react-tabs";
import { motion } from "motion/react";
import { useId, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface TabItem {
  value: string;
  label: string;
  icon?: ReactNode;
}

interface TabsProps {
  tabs: TabItem[];
  value: string;
  onValueChange: (value: string) => void;
  children?: ReactNode;
  className?: string;
}

export function Tabs({ tabs, value, onValueChange, children, className }: TabsProps) {
  const layoutId = useId();

  return (
    <TabsPrimitive.Root value={value} onValueChange={onValueChange} className={className}>
      <TabsPrimitive.List className="relative flex items-center gap-1 border-b border-[color:var(--color-border)]">
        {tabs.map((tab) => {
          const active = tab.value === value;
          return (
            <TabsPrimitive.Trigger
              key={tab.value}
              value={tab.value}
              className={cn(
                "relative flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors",
                active ? "text-[color:var(--color-ink-0)]" : "text-[color:var(--color-ink-3)] hover:text-[color:var(--color-ink-1)]"
              )}
            >
              {tab.icon}
              {tab.label}
              {active && (
                <motion.div
                  layoutId={`tab-indicator-${layoutId}`}
                  className="absolute inset-x-3 -bottom-px h-[2px] rounded-full bg-[color:var(--color-sentinel-500)]"
                  transition={{ type: "spring", stiffness: 500, damping: 40 }}
                />
              )}
            </TabsPrimitive.Trigger>
          );
        })}
      </TabsPrimitive.List>
      {children}
    </TabsPrimitive.Root>
  );
}

export const TabPanel = TabsPrimitive.Content;
