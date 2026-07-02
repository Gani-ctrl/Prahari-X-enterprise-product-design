import type { HTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium leading-none tracking-wide",
  {
    variants: {
      tone: {
        neutral: "bg-white/5 border-[color:var(--color-border-strong)] text-[color:var(--color-ink-2)]",
        sentinel: "bg-[color:var(--color-sentinel-500)]/12 border-[color:var(--color-sentinel-500)]/30 text-[color:var(--color-sentinel-400)]",
        success: "bg-[color:var(--color-success-500)]/12 border-[color:var(--color-success-500)]/30 text-[color:var(--color-success-400)]",
        danger: "bg-[color:var(--color-danger-500)]/12 border-[color:var(--color-danger-500)]/30 text-[color:var(--color-danger-400)]",
        warning: "bg-[color:var(--color-amber-500)]/12 border-[color:var(--color-amber-500)]/30 text-[color:var(--color-amber-400)]",
      },
    },
    defaultVariants: { tone: "neutral" },
  }
);

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {
  dot?: boolean;
}

export function Badge({ className, tone, dot, children, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ tone }), className)} {...props}>
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
}

const PRIORITY_TONE: Record<string, BadgeProps["tone"]> = {
  critical: "danger",
  high: "warning",
  medium: "sentinel",
  low: "neutral",
};

export function PriorityBadge({ priority }: { priority: string }) {
  return (
    <Badge tone={PRIORITY_TONE[priority] ?? "neutral"} dot>
      {priority[0].toUpperCase() + priority.slice(1)}
    </Badge>
  );
}

const STATUS_TONE: Record<string, BadgeProps["tone"]> = {
  active: "success",
  deployed: "sentinel",
  planning: "neutral",
  paused: "warning",
  completed: "success",
  aborted: "danger",
  operational: "success",
  maintenance: "warning",
  decommissioned: "neutral",
  available: "success",
  leave: "neutral",
  medical: "warning",
  monitoring: "sentinel",
  neutralized: "success",
  in_stock: "success",
  low_stock: "warning",
  out_of_stock: "danger",
  upcoming: "sentinel",
  archived: "neutral",
  // Command & Control workflow statuses (Assignment / FieldReport /
  // LeaveRequest / PatrolRoute / RoutePoint) — additive, shares this same
  // dictionary since none of the values collide.
  cancelled: "danger",
  returned: "neutral",
  submitted: "sentinel",
  acknowledged: "warning",
  resolved: "success",
  pending: "warning",
  approved: "success",
  rejected: "danger",
  reached: "success",
  skipped: "neutral",
  planned: "neutral",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <Badge tone={STATUS_TONE[status] ?? "neutral"} dot>
      {status.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase())}
    </Badge>
  );
}
