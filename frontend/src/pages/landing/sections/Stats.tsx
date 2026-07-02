import { CountUp } from "@/components/motion/CountUp";
import { Reveal } from "@/components/motion/Reveal";

const STATS = [
  { value: 1840, suffix: "+", label: "Missions coordinated" },
  { value: 96, suffix: "%", label: "Threat detection accuracy" },
  { value: 52, suffix: "k", label: "Personnel records managed" },
  { value: 12, suffix: "min", label: "Avg. time to mission-ready" },
];

export function Stats() {
  return (
    <section className="relative border-y border-[color:var(--color-border)] bg-[color:var(--color-surface)]/60 py-20">
      <div className="bg-grid pointer-events-none absolute inset-0 opacity-40" />
      <div className="relative mx-auto grid max-w-7xl grid-cols-2 gap-10 px-6 md:grid-cols-4">
        {STATS.map((s, i) => (
          <Reveal key={s.label} delay={i * 0.08} className="text-center md:text-left">
            <CountUp value={s.value} suffix={s.suffix} className="mono-tag text-4xl font-semibold text-[color:var(--color-ink-0)] md:text-5xl" />
            <p className="mt-2 text-sm text-[color:var(--color-ink-3)]">{s.label}</p>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
