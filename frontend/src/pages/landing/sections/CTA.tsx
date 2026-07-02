import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Reveal } from "@/components/motion/Reveal";
import { MagneticButton } from "@/components/motion/MagneticButton";
import { RadarGraphic } from "@/components/graphics/RadarGraphic";

export function CTA() {
  return (
    <section className="relative mx-auto max-w-7xl px-6 py-28">
      <Reveal>
        <div className="card-elevated relative overflow-hidden px-8 py-16 text-center md:px-16">
          <div className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 opacity-20">
            <RadarGraphic size={420} />
          </div>
          <div className="bg-radial-fade pointer-events-none absolute inset-0" />
          <div className="relative">
            <h2 className="mx-auto max-w-2xl text-3xl font-semibold tracking-tight text-[color:var(--color-ink-0)] md:text-4xl">
              Ready to run operations at the speed of decision?
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-[color:var(--color-ink-3)]">
              Step into the command center. See mission planning, intelligence, and asset management
              working as one system.
            </p>
            <div className="mt-9 flex flex-wrap items-center justify-center gap-4">
              <Link to="/auth/login">
                <MagneticButton className="group flex items-center gap-2 rounded-[var(--radius-sm)] bg-[color:var(--color-sentinel-500)] px-7 py-3.5 text-sm font-medium text-white shadow-[0_12px_32px_-10px_rgba(57,160,110,0.6)] transition-colors hover:bg-[color:var(--color-sentinel-400)]">
                  Commander Login
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </MagneticButton>
              </Link>
              <Link
                to="/auth/soldier/login"
                className="rounded-[var(--radius-sm)] border border-[color:var(--color-border-strong)] px-7 py-3.5 text-sm font-medium text-[color:var(--color-ink-1)] transition-colors hover:bg-white/5"
              >
                Soldier Login
              </Link>
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
