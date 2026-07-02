import { useRef, useState } from "react";
import type { MouseEvent } from "react";
import { motion } from "motion/react";
import { Crosshair, Package, ShieldCheck, Truck, Radar } from "lucide-react";
import type { InventoryCategory } from "@/types";

const CATEGORY_VISUAL: Record<InventoryCategory, { icon: typeof Crosshair; from: string; to: string; ring: string }> = {
  firearm: { icon: Crosshair, from: "#3a0d14", to: "#1a0508", ring: "var(--color-danger-500)" },
  ammunition: { icon: Package, from: "#3a2606", to: "#1a1002", ring: "var(--color-amber-500)" },
  tactical_gear: { icon: ShieldCheck, from: "#04321f", to: "#021610", ring: "var(--color-success-500)" },
  vehicle: { icon: Truck, from: "#08213f", to: "#020d1c", ring: "var(--color-sentinel-500)" },
  drone: { icon: Radar, from: "#1c1f26", to: "#0a0c10", ring: "var(--color-steel-400)" },
};

/**
 * Stylized "3D" weapon/equipment medallion — since no licensed weapon
 * photography is available, this renders a tilt-on-hover, glow-ringed icon
 * badge per category instead of a flat static glyph. Tilt tracks the
 * cursor position for a subtle parallax/zoom effect on hover.
 */
export function WeaponVisual({ category, size = 56 }: { category: InventoryCategory; size?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [hovering, setHovering] = useState(false);
  const meta = CATEGORY_VISUAL[category];
  const Icon = meta.icon;

  function handleMouseMove(e: MouseEvent<HTMLDivElement>) {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({ x: py * -18, y: px * 18 });
  }

  return (
    <div style={{ perspective: 400 }}>
      <motion.div
        ref={ref}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setHovering(true)}
        onMouseLeave={() => { setHovering(false); setTilt({ x: 0, y: 0 }); }}
        animate={{ rotateX: tilt.x, rotateY: tilt.y, scale: hovering ? 1.12 : 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
        style={{
          width: size,
          height: size,
          background: `radial-gradient(circle at 35% 30%, ${meta.from}, ${meta.to})`,
          transformStyle: "preserve-3d",
        }}
        className="relative flex shrink-0 items-center justify-center rounded-2xl"
      >
        <span
          className="pointer-events-none absolute inset-0 rounded-2xl border opacity-70"
          style={{ borderColor: meta.ring }}
        />
        {hovering && (
          <motion.span
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 0.5, scale: 1.3 }}
            className="pointer-events-none absolute inset-0 rounded-2xl"
            style={{ boxShadow: `0 0 22px 4px ${meta.ring}` }}
          />
        )}
        <Icon
          className="relative"
          style={{ width: size * 0.42, height: size * 0.42, color: meta.ring, filter: `drop-shadow(0 0 6px ${meta.ring})` }}
        />
      </motion.div>
    </div>
  );
}
