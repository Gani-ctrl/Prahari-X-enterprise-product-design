import { AnimatePresence, motion } from "motion/react";
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from "lucide-react";
import type { ElementType } from "react";
import { useToastStore, type ToastVariant } from "@/store/toastStore";
import { cn } from "@/lib/utils";

const ICONS: Record<ToastVariant, ElementType> = {
  success: CheckCircle2,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
};

const ACCENTS: Record<ToastVariant, string> = {
  success: "text-[color:var(--color-success-500)]",
  error: "text-[color:var(--color-danger-500)]",
  warning: "text-[color:var(--color-amber-500)]",
  info: "text-[color:var(--color-sentinel-400)]",
};

export function Toaster() {
  const toasts = useToastStore((s) => s.toasts);
  const dismiss = useToastStore((s) => s.dismiss);

  return (
    <div className="fixed bottom-5 right-5 z-[100] flex w-full max-w-sm flex-col gap-2.5" aria-live="polite">
      <AnimatePresence initial={false}>
        {toasts.map((t) => {
          const Icon = ICONS[t.variant];
          return (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, y: 16, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: 60, transition: { duration: 0.2 } }}
              transition={{ type: "spring", stiffness: 400, damping: 32 }}
              className="glass-strong flex items-start gap-3 rounded-2xl p-4 shadow-[var(--shadow-float)]"
              role="status"
            >
              <Icon className={cn("mt-0.5 h-5 w-5 shrink-0", ACCENTS[t.variant])} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-[color:var(--color-ink-0)]">{t.title}</p>
                {t.description && (
                  <p className="mt-0.5 text-xs leading-relaxed text-[color:var(--color-ink-2)]">{t.description}</p>
                )}
              </div>
              <button
                onClick={() => dismiss(t.id)}
                className="rounded-md p-1 text-[color:var(--color-ink-3)] transition-colors hover:bg-white/5 hover:text-[color:var(--color-ink-0)]"
                aria-label="Dismiss notification"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
