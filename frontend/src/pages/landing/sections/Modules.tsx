import { LayoutDashboard, Crosshair, Radar, Swords, Boxes, Users, Bot } from "lucide-react";
import { Reveal } from "@/components/motion/Reveal";
import { motion } from "motion/react";
import { TrendAreaChart } from "@/components/charts/TrendAreaChart";

const trendSample = Array.from({ length: 7 }).map((_, i) => ({
  date: new Date(Date.now() - (6 - i) * 86400000).toISOString(),
  value: [4, 7, 5, 9, 6, 11, 8][i],
}));

const MODULES = [
  { icon: LayoutDashboard, title: "Dashboard", description: "Live overview of missions, personnel, and threats." },
  { icon: Crosshair, title: "Operations", description: "Full mission lifecycle — plan, execute, debrief." },
  { icon: Radar, title: "Intelligence", description: "Unified feed across cyber, drone, and satellite sources." },
  { icon: Swords, title: "Weapons & Ammunition", description: "Inventory, stock levels, and equipment presentation." },
  { icon: Boxes, title: "Assets", description: "Vehicles, drones, medical gear & satellites." },
  { icon: Users, title: "Personnel", description: "Rosters, readiness, and deployment history." },
  { icon: Bot, title: "AI Assistant", description: "Natural-language mission and threat analysis." },
];

export function Modules() {
  return (
    <section id="modules" className="relative mx-auto max-w-7xl px-6 py-28">
      <Reveal>
        <p className="mono-tag text-xs uppercase tracking-[0.2em] text-[color:var(--color-sentinel-400)]">Modules</p>
        <h2 className="mt-3 max-w-xl text-3xl font-semibold tracking-tight text-[color:var(--color-ink-0)] md:text-4xl">
          One command surface. Every operational layer.
        </h2>
      </Reveal>

      <div className="mt-14 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Reveal className="lg:col-span-2">
          <div className="card-elevated flex h-full flex-col justify-between overflow-hidden p-7">
            <div>
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[color:var(--color-sentinel-500)]/12 text-[color:var(--color-sentinel-400)]">
                <LayoutDashboard className="h-5 w-5" />
              </div>
              <h3 className="mt-5 text-lg font-semibold text-[color:var(--color-ink-0)]">Command Dashboard</h3>
              <p className="mt-2 max-w-md text-sm leading-relaxed text-[color:var(--color-ink-3)]">
                A single, glanceable view of active missions, personnel readiness, deployed assets, and
                emerging threats — with trend lines that update the moment anything changes.
              </p>
            </div>
            <div className="mt-6 rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-4">
              <div className="flex items-center justify-between text-xs text-[color:var(--color-ink-3)]">
                <span>Mission Trend</span>
                <span className="text-[color:var(--color-success-400)]">+18% this week</span>
              </div>
              <TrendAreaChart data={trendSample} height={140} />
            </div>
          </div>
        </Reveal>

        <Reveal delay={0.1}>
          <div className="grid h-full grid-cols-1 gap-4">
            {MODULES.slice(1, 3).map((m) => (
              <motion.div key={m.title} whileHover={{ y: -3 }} className="card-elevated p-6">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[color:var(--color-amber-500)]/12 text-[color:var(--color-amber-400)]">
                  <m.icon className="h-4 w-4" />
                </div>
                <h4 className="mt-4 text-sm font-semibold text-[color:var(--color-ink-0)]">{m.title}</h4>
                <p className="mt-1.5 text-xs leading-relaxed text-[color:var(--color-ink-3)]">{m.description}</p>
              </motion.div>
            ))}
          </div>
        </Reveal>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {MODULES.slice(3).map((m, i) => (
          <Reveal key={m.title} delay={i * 0.08}>
            <motion.div whileHover={{ y: -3 }} className="card-elevated h-full p-6">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[color:var(--color-success-500)]/12 text-[color:var(--color-success-400)]">
                <m.icon className="h-4 w-4" />
              </div>
              <h4 className="mt-4 text-sm font-semibold text-[color:var(--color-ink-0)]">{m.title}</h4>
              <p className="mt-1.5 text-xs leading-relaxed text-[color:var(--color-ink-3)]">{m.description}</p>
            </motion.div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
