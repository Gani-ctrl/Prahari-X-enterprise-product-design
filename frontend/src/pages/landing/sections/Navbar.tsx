import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import {
  ShieldCheck,
  Menu,
  X,
  ChevronDown,
  LayoutDashboard,
  Crosshair,
  Radar,
  Swords,
  Boxes,
  Users,
  Bot,
} from "lucide-react";
import { MagneticButton } from "@/components/motion/MagneticButton";
import { useIntroStore } from "@/store/introStore";
import { cn } from "@/lib/utils";

const PLATFORM_MODULES = [
  { icon: LayoutDashboard, title: "Command Dashboard", description: "Live overview of missions, personnel & threats.", tone: "text-[color:var(--color-sentinel-400)] bg-[color:var(--color-sentinel-500)]/12" },
  { icon: Crosshair, title: "Operations", description: "Full mission lifecycle — plan, execute, debrief.", tone: "text-[color:var(--color-danger-400)] bg-[color:var(--color-danger-500)]/12" },
  { icon: Radar, title: "Intelligence Center", description: "Unified feed across cyber, drone & satellite sources.", tone: "text-[color:var(--color-amber-400)] bg-[color:var(--color-amber-500)]/12" },
  { icon: Swords, title: "Weapons & Ammunition", description: "Inventory, stock levels & equipment presentation.", tone: "text-[color:var(--color-danger-400)] bg-[color:var(--color-danger-500)]/12" },
  { icon: Boxes, title: "Assets & Equipment", description: "Vehicles, drones, medical gear & satellites.", tone: "text-[color:var(--color-success-400)] bg-[color:var(--color-success-500)]/12" },
  { icon: Users, title: "Personnel", description: "Rosters, readiness, and deployment history.", tone: "text-[color:var(--color-sentinel-400)] bg-[color:var(--color-sentinel-500)]/12" },
  { icon: Bot, title: "AI Assistant", description: "Natural-language mission and threat analysis.", tone: "text-[color:var(--color-amber-400)] bg-[color:var(--color-amber-500)]/12" },
];

const LINKS = [
  { label: "Features", href: "#features" },
  { label: "Workflow", href: "#workflow" },
  { label: "Testimonials", href: "#testimonials" },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [platformOpen, setPlatformOpen] = useState(false);
  const closeTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Navbar is `position: fixed`, so without this it renders on top of the
  // cinematic intro from frame one regardless of scroll position. The
  // intro flips this off only once the visitor actually starts scrolling
  // past it (see IntroLandingPage.tsx) — not on Skip, since skipping still
  // lands you in the intro's "ready" beat, not the real site.
  const introActive = useIntroStore((s) => s.introActive);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 24);
    }
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Every hook above runs unconditionally, every render, regardless of
  // introActive — Rules of Hooks requires the same hooks in the same
  // order every time. "Hide during intro" is therefore a render-output
  // decision, not a hook-execution decision: bail out of JSX here, after
  // all hooks have already run, instead of returning before them.
  if (introActive) {
    return null;
  }

  function openPlatform() {
    if (closeTimeout.current) clearTimeout(closeTimeout.current);
    setPlatformOpen(true);
  }

  function scheduleClosePlatform() {
    closeTimeout.current = setTimeout(() => setPlatformOpen(false), 150);
  }

  return (
    <motion.header
      initial={{ y: -24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className={cn("fixed inset-x-0 top-0 z-50 transition-all duration-300", scrolled && "glass-strong shadow-[var(--shadow-panel)]")}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[color:var(--color-sentinel-500)]">
            <ShieldCheck className="h-[18px] w-[18px] text-white" />
          </div>
          <span className="text-sm font-semibold tracking-tight text-[color:var(--color-ink-0)]">PRAHARI X</span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          <div className="relative" onMouseEnter={openPlatform} onMouseLeave={scheduleClosePlatform}>
            <button
              onClick={() => setPlatformOpen((v) => !v)}
              className={cn(
                "flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm transition-colors",
                platformOpen ? "text-[color:var(--color-ink-0)]" : "text-[color:var(--color-ink-2)] hover:text-[color:var(--color-ink-0)]"
              )}
            >
              Platform
              <ChevronDown className={cn("h-3.5 w-3.5 transition-transform duration-200", platformOpen && "rotate-180")} />
            </button>

            <AnimatePresence>
              {platformOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.98 }}
                  transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                  className="glass-strong absolute left-1/2 top-full mt-3 w-[640px] -translate-x-1/2 rounded-[var(--radius-card)] border border-[color:var(--color-border-strong)] p-3 shadow-[var(--shadow-float)]"
                >
                  <div className="grid grid-cols-2 gap-1.5">
                    {PLATFORM_MODULES.map((m) => (
                      <a
                        key={m.title}
                        href="#modules"
                        onClick={() => setPlatformOpen(false)}
                        className="flex items-start gap-3 rounded-xl p-3 text-left transition-colors hover:bg-white/5"
                      >
                        <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg [&>svg]:h-4 [&>svg]:w-4", m.tone)}>
                          <m.icon />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-[color:var(--color-ink-0)]">{m.title}</p>
                          <p className="mt-0.5 text-xs leading-snug text-[color:var(--color-ink-3)]">{m.description}</p>
                        </div>
                      </a>
                    ))}
                  </div>
                  <div className="mt-2 flex items-center justify-between rounded-xl border border-[color:var(--color-border)] bg-white/[0.02] px-4 py-3">
                    <p className="text-xs text-[color:var(--color-ink-3)]">See every module in action inside the command console.</p>
                    <Link to="/auth/login" onClick={() => setPlatformOpen(false)} className="text-xs font-medium text-[color:var(--color-sentinel-400)] hover:text-[color:var(--color-sentinel-300)]">
                      Explore platform &rarr;
                    </Link>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {LINKS.map((l) => (
            <a key={l.href} href={l.href} className="rounded-lg px-3 py-2 text-sm text-[color:var(--color-ink-2)] transition-colors hover:text-[color:var(--color-ink-0)]">
              {l.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <Link to="/auth/soldier/login" className="text-sm text-[color:var(--color-ink-1)] transition-colors hover:text-[color:var(--color-ink-0)]">
            Soldier Login
          </Link>
          <Link to="/auth/login" className="text-sm text-[color:var(--color-ink-1)] transition-colors hover:text-[color:var(--color-ink-0)]">
            Commander Login
          </Link>
          <Link to="/auth/soldier/signup">
            <MagneticButton className="rounded-[var(--radius-sm)] bg-[color:var(--color-sentinel-500)] px-4 py-2 text-sm font-medium text-white shadow-[0_8px_24px_-8px_rgba(57,160,110,0.55)] transition-colors hover:bg-[color:var(--color-sentinel-400)]">
              Request Access
            </MagneticButton>
          </Link>
        </div>

        <button className="text-[color:var(--color-ink-1)] md:hidden" onClick={() => setMobileOpen((v) => !v)} aria-label="Toggle menu">
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="glass-strong overflow-hidden border-t border-[color:var(--color-border)] px-6 py-4 md:hidden"
          >
            <div className="flex flex-col gap-4">
              <div>
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-[color:var(--color-ink-4)]">Platform</p>
                <div className="grid grid-cols-1 gap-1">
                  {PLATFORM_MODULES.map((m) => (
                    <a key={m.title} href="#modules" onClick={() => setMobileOpen(false)} className="flex items-center gap-2.5 rounded-lg px-2 py-2 text-sm text-[color:var(--color-ink-1)]">
                      <div className={cn("flex h-7 w-7 shrink-0 items-center justify-center rounded-md [&>svg]:h-3.5 [&>svg]:w-3.5", m.tone)}>
                        <m.icon />
                      </div>
                      {m.title}
                    </a>
                  ))}
                </div>
              </div>
              {LINKS.map((l) => (
                <a key={l.href} href={l.href} onClick={() => setMobileOpen(false)} className="text-sm text-[color:var(--color-ink-1)]">
                  {l.label}
                </a>
              ))}
              <div className="mt-2 flex flex-col gap-2">
                <Link to="/auth/login" className="rounded-[var(--radius-sm)] border border-[color:var(--color-border-strong)] py-2 text-center text-sm text-[color:var(--color-ink-0)]">
                  Commander Login
                </Link>
                <Link to="/auth/soldier/login" className="rounded-[var(--radius-sm)] border border-[color:var(--color-border-strong)] py-2 text-center text-sm text-[color:var(--color-ink-0)]">
                  Soldier Login
                </Link>
                <Link to="/auth/soldier/signup" className="rounded-[var(--radius-sm)] bg-[color:var(--color-sentinel-500)] py-2 text-center text-sm font-medium text-white">
                  Request Access
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
