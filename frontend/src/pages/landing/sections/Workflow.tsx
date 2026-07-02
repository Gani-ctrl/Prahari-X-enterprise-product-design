import { Reveal } from "@/components/motion/Reveal";
import { motion } from "motion/react";

const STEPS = [
  {
    step: "01",
    title: "Brief the mission",
    description: "Define objectives, assign a commander, and set priority — PRAHARI X drafts the operational skeleton instantly.",
  },
  {
    step: "02",
    title: "Fuse intelligence",
    description: "Cyber, drone, and satellite feeds are cross-referenced automatically, surfacing what actually needs your attention.",
  },
  {
    step: "03",
    title: "Deploy squads & assets",
    description: "Assign personnel and equipment with real-time readiness scoring and automatic conflict detection.",
  },
  {
    step: "04",
    title: "Monitor & adapt",
    description: "Track live progress, objectives, and logs — with AI recommending course corrections as conditions change.",
  },
];

export function Workflow() {
  return (
    <section id="workflow" className="relative mx-auto max-w-7xl px-6 py-28">
      <Reveal>
        <p className="mono-tag text-xs uppercase tracking-[0.2em] text-[color:var(--color-amber-400)]">Workflow</p>
        <h2 className="mt-3 max-w-xl text-3xl font-semibold tracking-tight text-[color:var(--color-ink-0)] md:text-4xl">
          From briefing to debrief, in four steps.
        </h2>
      </Reveal>

      <div className="relative mt-16 grid grid-cols-1 gap-8 md:grid-cols-4">
        <div className="absolute left-0 right-0 top-6 hidden h-px bg-[color:var(--color-border-strong)] md:block" />
        {STEPS.map((s, i) => (
          <Reveal key={s.step} delay={i * 0.12}>
            <div className="relative">
              <motion.div
                initial={{ scale: 0.6, opacity: 0 }}
                whileInView={{ scale: 1, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.12 }}
                className="relative z-10 flex h-12 w-12 items-center justify-center rounded-full border border-[color:var(--color-sentinel-500)]/40 bg-[color:var(--color-surface-2)] font-mono text-sm font-semibold text-[color:var(--color-sentinel-400)]"
              >
                {s.step}
              </motion.div>
              <h3 className="mt-5 text-base font-semibold text-[color:var(--color-ink-0)]">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-[color:var(--color-ink-3)]">{s.description}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
