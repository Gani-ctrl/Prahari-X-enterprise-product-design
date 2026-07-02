import { motion } from "motion/react";
import type { ReactNode } from "react";
import { CountUp } from "@/components/motion/CountUp";
import { cn } from "@/lib/utils";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";

interface StatCardProps {
  label: string;
  value: number;
  icon: ReactNode;
  delta?: number;
  suffix?: string;
  tone?: "sentinel" | "amber" | "success" | "danger";
  index?: number;
}

const TONE_BG = {
  sentinel: "bg-[color:var(--color-sentinel-500)]/12 text-[color:var(--color-sentinel-400)]",
  amber: "bg-[color:var(--color-amber-500)]/12 text-[color:var(--color-amber-400)]",
  success: "bg-[color:var(--color-success-500)]/12 text-[color:var(--color-success-400)]",
  danger: "bg-[color:var(--color-danger-500)]/12 text-[color:var(--color-danger-400)]",
};

export function StatCard({ label, value, icon, delta, suffix, tone = "sentinel", index = 0 }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.06, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -3 }}
      className="card-elevated group relative overflow-hidden p-6"
    >
      <div className="flex items-start justify-between">
        <p className="text-xs font-medium uppercase tracking-wider text-[color:var(--color-ink-3)]">{label}</p>
        <div className={cn("flex h-9 w-9 items-center justify-center rounded-xl [&>svg]:h-[18px] [&>svg]:w-[18px]", TONE_BG[tone])}>
          {icon}
        </div>
      </div>
      <div className="mt-4 flex items-baseline gap-2">
        <CountUp value={value} suffix={suffix} className="mono-tag text-3xl font-semibold text-[color:var(--color-ink-0)]" />
        {delta !== undefined && (
          <span
            className={cn(
              "flex items-center gap-0.5 text-xs font-medium",
              delta >= 0 ? "text-[color:var(--color-success-400)]" : "text-[color:var(--color-danger-400)]"
            )}
          >
            {delta >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
            {Math.abs(delta)}%
          </span>
        )}
      </div>
      <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-[color:var(--color-sentinel-500)]/[0.06] blur-2xl transition-opacity group-hover:opacity-100" />
    </motion.div>
  );
}
