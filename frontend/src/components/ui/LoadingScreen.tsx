import { motion } from "motion/react";
import { ShieldCheck } from "lucide-react";

export function LoadingScreen() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-5 bg-[color:var(--color-base)]">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-[color:var(--color-sentinel-500)]"
      >
        <ShieldCheck className="h-7 w-7 text-white" />
        <motion.span
          className="absolute inset-0 rounded-2xl border border-[color:var(--color-sentinel-400)]"
          animate={{ scale: [1, 1.5, 1.8], opacity: [0.6, 0.2, 0] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeOut" }}
        />
      </motion.div>
      <div className="h-1 w-40 overflow-hidden rounded-full bg-[color:var(--color-surface-3)]">
        <motion.div
          className="h-full w-1/3 rounded-full bg-[color:var(--color-sentinel-500)]"
          animate={{ x: ["-100%", "220%"] }}
          transition={{ duration: 1.1, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>
      <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--color-ink-3)]">Establishing secure link</p>
    </div>
  );
}
