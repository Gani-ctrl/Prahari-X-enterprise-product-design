import { motion } from "motion/react";
import type { ReactNode } from "react";

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="flex flex-col items-center justify-center gap-3 rounded-[var(--radius-card)] border border-dashed border-[color:var(--color-border-strong)] px-6 py-16 text-center"
    >
      <div className="animate-float-slow flex h-14 w-14 items-center justify-center rounded-2xl bg-[color:var(--color-surface-3)] text-[color:var(--color-ink-3)] [&>svg]:h-6 [&>svg]:w-6">
        {icon}
      </div>
      <p className="text-sm font-medium text-[color:var(--color-ink-0)]">{title}</p>
      {description && <p className="max-w-sm text-sm text-[color:var(--color-ink-3)]">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </motion.div>
  );
}
