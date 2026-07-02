import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { Activity, CheckCircle2, XCircle } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { auditApi } from "@/services/api";
import { formatDateTime } from "@/lib/utils";
import type { AuditLogEntry } from "@/types";

interface ActivityFeedProps {
  entityType: string;
  entityId: string;
}

/**
 * Read-only, chronological activity trail for a single record — backed by
 * the same AuditLog table that powers Settings > Audit Logs, filtered down
 * to this entityType/entityId. Every CRUD action, assignment, and comment
 * across the app writes here, so this is always a live, DB-driven history.
 */
export function ActivityFeed({ entityType, entityId }: ActivityFeedProps) {
  const [entries, setEntries] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    auditApi
      .activity(entityType, entityId)
      .then((rows) => !cancelled && setEntries(rows as AuditLogEntry[]))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [entityType, entityId]);

  if (loading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    );
  }

  if (entries.length === 0) {
    return <EmptyState icon={<Activity />} title="No activity yet" description="Actions taken on this record will appear here." />;
  }

  return (
    <div className="relative space-y-6 border-l border-[color:var(--color-border-strong)] pl-6">
      {entries.map((entry, i) => (
        <motion.div
          key={entry.id}
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: Math.min(i * 0.04, 0.4) }}
          className="relative"
        >
          <span
            className="absolute -left-[31px] top-1 flex h-3 w-3 items-center justify-center rounded-full border-2 border-[color:var(--color-base)]"
            style={{
              backgroundColor:
                entry.status === "failed" ? "var(--color-danger-500)" : "var(--color-sentinel-500)",
            }}
          />
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm text-[color:var(--color-ink-1)]">
              <span className="font-medium text-[color:var(--color-ink-0)]">{entry.actor}</span>{" "}
              {entry.action.toLowerCase()}
              {entry.target && <span className="text-[color:var(--color-ink-3)]"> — {entry.target}</span>}
            </p>
            {entry.status === "failed" ? (
              <XCircle className="h-4 w-4 shrink-0 text-[color:var(--color-danger-400)]" />
            ) : (
              <CheckCircle2 className="h-4 w-4 shrink-0 text-[color:var(--color-success-400)]" />
            )}
          </div>
          <p className="mt-0.5 text-xs text-[color:var(--color-ink-4)]">{formatDateTime(entry.timestamp)}</p>
        </motion.div>
      ))}
    </div>
  );
}
