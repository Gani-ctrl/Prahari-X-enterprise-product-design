import { Crosshair, Radar, Boxes, Users, Bot, ShieldAlert } from "lucide-react";
import { Reveal, RevealStagger, staggerItem } from "@/components/motion/Reveal";
import { motion } from "motion/react";

const FEATURES = [
  {
    icon: Crosshair,
    title: "Mission Command",
    description: "Plan, launch, and track multi-phase operations with live objective tracking and squad coordination.",
  },
  {
    icon: Radar,
    title: "Intelligence Fusion",
    description: "Correlate cyber, drone, satellite, and ground-sensor signals into a single prioritized threat feed.",
  },
  {
    icon: Boxes,
    title: "Asset Readiness",
    description: "Track vehicles, drones, weapons, medical units, and satellites with predictive maintenance windows.",
  },
  {
    icon: Users,
    title: "Personnel Operations",
    description: "Manage rosters, deployments, and health readiness with a complete mission history per officer.",
  },
  {
    icon: Bot,
    title: "AI Command Assistant",
    description: "Draft mission briefs, analyze threat patterns, and surface recommendations in natural language.",
  },
  {
    icon: ShieldAlert,
    title: "Enterprise-Grade Security",
    description: "JWT-based auth, role permissions, full audit trails, and 2FA — built for classified operating environments.",
  },
];

export function Features() {
  return (
    <section id="features" className="relative mx-auto max-w-7xl px-6 py-28">
      <Reveal>
        <p className="mono-tag text-xs uppercase tracking-[0.2em] text-[color:var(--color-sentinel-400)]">Capabilities</p>
        <h2 className="mt-3 max-w-xl text-3xl font-semibold tracking-tight text-[color:var(--color-ink-0)] md:text-4xl">
          Every command function, one connected system.
        </h2>
      </Reveal>

      <RevealStagger className="mt-14 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((f) => (
          <motion.div
            key={f.title}
            variants={staggerItem}
            whileHover={{ y: -4 }}
            className="card-elevated group relative overflow-hidden p-7 transition-shadow hover:shadow-[var(--shadow-float)]"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[color:var(--color-sentinel-500)]/12 text-[color:var(--color-sentinel-400)]">
              <f.icon className="h-5 w-5" />
            </div>
            <h3 className="mt-5 text-base font-semibold text-[color:var(--color-ink-0)]">{f.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-[color:var(--color-ink-3)]">{f.description}</p>
            <div className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-[color:var(--color-sentinel-500)]/[0.05] blur-2xl opacity-0 transition-opacity group-hover:opacity-100" />
          </motion.div>
        ))}
      </RevealStagger>
    </section>
  );
}
