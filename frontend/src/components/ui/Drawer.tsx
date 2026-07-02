import * as DialogPrimitive from "@radix-ui/react-dialog";
import { AnimatePresence, motion } from "motion/react";
import { X } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface DrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  width?: "md" | "lg";
}

export function Drawer({ open, onOpenChange, title, children, footer, width = "md" }: DrawerProps) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open && (
          <DialogPrimitive.Portal forceMount>
            <DialogPrimitive.Overlay asChild forceMount>
              <motion.div
                className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18 }}
              />
            </DialogPrimitive.Overlay>
            <DialogPrimitive.Content asChild forceMount>
              <motion.div
                className={cn(
                  "fixed right-0 top-0 z-50 flex h-full w-full flex-col border-l border-[color:var(--color-border)] bg-[color:var(--color-surface)] shadow-[var(--shadow-float)]",
                  width === "md" ? "max-w-md" : "max-w-xl"
                )}
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ type: "spring", stiffness: 340, damping: 36 }}
              >
                <div className="flex items-center justify-between border-b border-[color:var(--color-border)] px-6 py-5">
                  <DialogPrimitive.Title className="text-base font-semibold text-[color:var(--color-ink-0)]">
                    {title}
                  </DialogPrimitive.Title>
                  <DialogPrimitive.Close className="rounded-lg p-1.5 text-[color:var(--color-ink-3)] transition-colors hover:bg-white/5 hover:text-[color:var(--color-ink-0)]">
                    <X className="h-4 w-4" />
                  </DialogPrimitive.Close>
                </div>
                <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
                {footer && <div className="flex items-center justify-end gap-3 border-t border-[color:var(--color-border)] px-6 py-4">{footer}</div>}
              </motion.div>
            </DialogPrimitive.Content>
          </DialogPrimitive.Portal>
        )}
      </AnimatePresence>
    </DialogPrimitive.Root>
  );
}
