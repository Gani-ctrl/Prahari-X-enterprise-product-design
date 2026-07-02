import { Outlet, Link } from "react-router-dom";
import { motion } from "motion/react";
import { ShieldCheck } from "lucide-react";
import { RadarGraphic } from "@/components/graphics/RadarGraphic";

export function AuthLayout() {
  return (
    <div className="grid min-h-screen grid-cols-1 bg-[color:var(--color-base)] lg:grid-cols-2">
      <div className="flex flex-col justify-between px-6 py-8 sm:px-12 lg:px-16 lg:py-12">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[color:var(--color-sentinel-500)]">
            <ShieldCheck className="h-[18px] w-[18px] text-white" />
          </div>
          <span className="text-sm font-semibold tracking-tight text-[color:var(--color-ink-0)]">PRAHARI X</span>
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="mx-auto w-full max-w-sm py-16"
        >
          <Outlet />
        </motion.div>

        <p className="text-center text-xs text-[color:var(--color-ink-4)] lg:text-left">
          © 2026 PRAHARI X. Fictional AI defense operations platform for demonstration purposes.
        </p>
      </div>

      <div className="relative hidden overflow-hidden border-l border-[color:var(--color-border)] bg-[color:var(--color-surface)] lg:block">
        <div className="bg-radial-fade absolute inset-0" />
        <div className="bg-grid absolute inset-0 opacity-60" />
        <div className="relative flex h-full flex-col items-center justify-center gap-10 px-12">
          <RadarGraphic size={340} />
          <div className="max-w-sm text-center">
            <p className="text-lg font-medium leading-snug text-[color:var(--color-ink-0)]">
              Unified command over every mission, asset, and signal.
            </p>
            <p className="mt-2 text-sm text-[color:var(--color-ink-3)]">
              Real-time situational awareness, built for decisive action.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
