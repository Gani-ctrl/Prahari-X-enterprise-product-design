import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { RadarGraphic } from "@/components/graphics/RadarGraphic";
import { Button } from "@/components/ui/Button";

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-[color:var(--color-base)] bg-grid px-6 text-center">
      <RadarGraphic size={200} />
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <p className="mono-tag text-sm text-[color:var(--color-ink-3)]">ERROR 404</p>
        <h1 className="mt-2 text-2xl font-semibold text-[color:var(--color-ink-0)]">Sector not found</h1>
        <p className="mt-2 max-w-sm text-sm text-[color:var(--color-ink-3)]">
          The coordinates you requested don't map to any known location in the system.
        </p>
        <Link to="/">
          <Button className="mt-6">Return to base</Button>
        </Link>
      </motion.div>
    </div>
  );
}
