import { motion } from "motion/react";
import { cn } from "@/lib/utils";

interface ProgressBarProps {
  value: number;
  tone?: "sentinel" | "amber" | "success" | "danger";
  className?: string;
  showLabel?: boolean;
}

const TONES = {
  sentinel: "bg-[color:var(--color-sentinel-500)]",
  amber: "bg-[color:var(--color-amber-500)]",
  success: "bg-[color:var(--color-success-500)]",
  danger: "bg-[color:var(--color-danger-500)]",
};

export function ProgressBar({ value, tone = "sentinel", className, showLabel }: ProgressBarProps) {
  return (
    <div className={cn("w-full", className)}>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-[color:var(--color-surface-3)]">
        <motion.div
          className={cn("h-full rounded-full", TONES[tone])}
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(100, Math.max(0, value))}%` }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
        />
      </div>
      {showLabel && <p className="mt-1.5 text-xs text-[color:var(--color-ink-3)]">{value}% complete</p>}
    </div>
  );
}
