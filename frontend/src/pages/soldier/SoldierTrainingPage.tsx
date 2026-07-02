import { motion } from "motion/react";
import { GraduationCap, CheckCircle2, Clock, Target } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Badge } from "@/components/ui/Badge";
import { useSoldierContext } from "@/hooks/useSoldierContext";

const UPCOMING = [
  { title: "Advanced Combat Tactics — Module 3", due: "In 5 days", progress: 60 },
  { title: "Annual Marksmanship Requalification", due: "In 12 days", progress: 30 },
  { title: "Field Communications Refresher", due: "In 3 weeks", progress: 10 },
];

export default function SoldierTrainingPage() {
  const { personnel } = useSoldierContext();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-[color:var(--color-ink-0)]">Training & Readiness</h1>
        <p className="mt-1 text-sm text-[color:var(--color-ink-3)]">Your qualifications and upcoming requirements.</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-[color:var(--color-success-400)]" />
            <CardTitle>Held Certifications</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {(personnel?.certifications ?? []).map((c) => (
            <Badge key={c} tone="success" dot>{c}</Badge>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <GraduationCap className="h-4 w-4 text-[color:var(--color-amber-400)]" />
            <CardTitle>Upcoming Requirements</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {UPCOMING.map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.08 }}
              className="rounded-xl border border-[color:var(--color-border)] p-4"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium text-[color:var(--color-ink-0)]">{item.title}</p>
                <span className="flex items-center gap-1 text-xs text-[color:var(--color-ink-3)]"><Clock className="h-3 w-3" /> {item.due}</span>
              </div>
              <div className="mt-3">
                <ProgressBar value={item.progress} tone="amber" showLabel />
              </div>
            </motion.div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-[color:var(--color-sentinel-400)]" />
            <CardTitle>Readiness Target</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-[color:var(--color-ink-3)]">
            Unit readiness standard requires 3 active certifications and a performance rating above 70%.
            You currently hold {(personnel?.certifications ?? []).length} certification(s) at a {personnel?.performanceScore ?? 0}% rating.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
