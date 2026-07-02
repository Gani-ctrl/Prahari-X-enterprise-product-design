import { Reveal, RevealStagger, staggerItem } from "@/components/motion/Reveal";
import { motion } from "motion/react";
import { Avatar } from "@/components/ui/Avatar";

const QUOTES = [
  {
    quote: "PRAHARI X collapsed four disconnected tools into one. Our mission-readiness time dropped by nearly half.",
    name: "Col. R. Mehta (fictional)",
    role: "Regional Operations Command",
  },
  {
    quote: "The intelligence fusion view is the first dashboard our analysts actually enjoy using.",
    name: "Maj. S. Okoye (fictional)",
    role: "Signals & Cyber Division",
  },
  {
    quote: "Asset readiness used to be a spreadsheet nightmare. Now it's a five-second glance.",
    name: "Capt. L. Fernandes (fictional)",
    role: "Logistics Corps",
  },
];

export function Testimonials() {
  return (
    <section id="testimonials" className="relative mx-auto max-w-7xl px-6 py-28">
      <Reveal>
        <p className="mono-tag text-xs uppercase tracking-[0.2em] text-[color:var(--color-amber-400)]">Field feedback</p>
        <h2 className="mt-3 max-w-xl text-3xl font-semibold tracking-tight text-[color:var(--color-ink-0)] md:text-4xl">
          Trusted by command teams who can't afford friction.
        </h2>
        <p className="mt-2 text-xs text-[color:var(--color-ink-4)]">Illustrative quotes for demonstration purposes.</p>
      </Reveal>

      <RevealStagger className="mt-14 grid grid-cols-1 gap-5 md:grid-cols-3">
        {QUOTES.map((q) => (
          <motion.div key={q.name} variants={staggerItem} className="card-elevated flex h-full flex-col justify-between p-7">
            <p className="text-[15px] leading-relaxed text-[color:var(--color-ink-1)]">&ldquo;{q.quote}&rdquo;</p>
            <div className="mt-6 flex items-center gap-3">
              <Avatar seed={q.name} name={q.name} size="md" />
              <div>
                <p className="text-sm font-medium text-[color:var(--color-ink-0)]">{q.name}</p>
                <p className="text-xs text-[color:var(--color-ink-3)]">{q.role}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </RevealStagger>
    </section>
  );
}
