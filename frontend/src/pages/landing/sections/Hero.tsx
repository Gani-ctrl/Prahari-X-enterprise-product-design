import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { ArrowRight, PlayCircle } from "lucide-react";
import { OrbitHero } from "@/components/graphics/OrbitHero";
import { MagneticButton } from "@/components/motion/MagneticButton";

export function Hero() {
  return (
    <section className="relative overflow-hidden pb-24 pt-40 md:pt-48">
      <div className="bg-radial-fade pointer-events-none absolute inset-x-0 top-0 h-[600px]" />
      <div className="mx-auto grid max-w-7xl items-center gap-12 px-6 lg:grid-cols-2 lg:gap-8">
        <div>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="inline-flex items-center gap-2 rounded-full border border-[color:var(--color-border-strong)] bg-white/[0.03] px-3 py-1.5 text-xs text-[color:var(--color-ink-2)]"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-[color:var(--color-success-500)]" />
            Now orchestrating 240+ simulated operations worldwide
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="mt-6 text-4xl font-semibold leading-[1.08] tracking-tight text-gradient-sentinel md:text-6xl"
          >
            Command every mission with absolute clarity.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="mt-6 max-w-lg text-lg leading-relaxed text-[color:var(--color-ink-2)]"
          >
            PRAHARI X unifies mission planning, intelligence analysis, asset tracking, and personnel
            readiness into a single, AI-assisted command surface — built for decisions that can't wait.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="mt-9 flex flex-wrap items-center gap-4"
          >
            <Link to="/auth/login">
              <MagneticButton className="group flex items-center gap-2 rounded-[var(--radius-sm)] bg-[color:var(--color-sentinel-500)] px-6 py-3.5 text-sm font-medium text-white shadow-[0_12px_32px_-10px_rgba(57,160,110,0.6)] transition-colors hover:bg-[color:var(--color-sentinel-400)]">
                Login to Command Center
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </MagneticButton>
            </Link>
            <a href="#workflow" className="flex items-center gap-2 rounded-[var(--radius-sm)] border border-[color:var(--color-border-strong)] px-6 py-3.5 text-sm font-medium text-[color:var(--color-ink-1)] transition-colors hover:bg-white/5">
              <PlayCircle className="h-4 w-4" />
              See how it works
            </a>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="mt-14 flex items-center gap-8 border-t border-[color:var(--color-border)] pt-8 text-[color:var(--color-ink-3)]"
          >
            <div>
              <p className="mono-tag text-2xl font-semibold text-[color:var(--color-ink-0)]">99.98%</p>
              <p className="text-xs">Platform uptime</p>
            </div>
            <div className="h-8 w-px bg-[color:var(--color-border)]" />
            <div>
              <p className="mono-tag text-2xl font-semibold text-[color:var(--color-ink-0)]">4.2s</p>
              <p className="text-xs">Avg. decision latency</p>
            </div>
            <div className="h-8 w-px bg-[color:var(--color-border)]" />
            <div>
              <p className="mono-tag text-2xl font-semibold text-[color:var(--color-ink-0)]">128</p>
              <p className="text-xs">Command units onboard</p>
            </div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.9, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
        >
          <OrbitHero />
        </motion.div>
      </div>
    </section>
  );
}
