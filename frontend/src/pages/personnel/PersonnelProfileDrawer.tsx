import { Link } from "react-router-dom";
import { Mail, Phone, Calendar, HeartPulse, Crosshair, MapPin, TrendingUp, Award, Boxes } from "lucide-react";
import { Drawer } from "@/components/ui/Drawer";
import { Avatar } from "@/components/ui/Avatar";
import { StatusBadge, PriorityBadge } from "@/components/ui/Badge";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { CountUp } from "@/components/motion/CountUp";
import { formatDate } from "@/lib/utils";
import type { Asset, Mission, Personnel } from "@/types";

interface PersonnelProfileDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  personnel: Personnel | null;
  missionHistory: Mission[];
  equipment: Asset[];
}

export function PersonnelProfileDrawer({ open, onOpenChange, personnel, missionHistory, equipment }: PersonnelProfileDrawerProps) {
  if (!personnel) return null;

  return (
    <Drawer open={open} onOpenChange={onOpenChange} title="Personnel Profile">
      <div className="flex items-center gap-4">
        <Avatar seed={personnel.avatarSeed} name={personnel.name} size="lg" />
        <div>
          <p className="text-base font-semibold text-[color:var(--color-ink-0)]">{personnel.rank} {personnel.name}</p>
          <p className="text-sm text-[color:var(--color-ink-3)]">{personnel.roleTitle} · {personnel.unit}</p>
          <div className="mt-2 flex items-center gap-2"><StatusBadge status={personnel.status} /></div>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-[color:var(--color-border)] p-3.5 text-center">
          <CountUp value={personnel.performanceScore} suffix="%" className="mono-tag text-xl font-semibold text-[color:var(--color-ink-0)]" />
          <p className="mt-1 flex items-center justify-center gap-1 text-[10px] uppercase tracking-wide text-[color:var(--color-ink-3)]">
            <TrendingUp className="h-3 w-3" /> Performance
          </p>
        </div>
        <div className="rounded-2xl border border-[color:var(--color-border)] p-3.5 text-center">
          <CountUp value={personnel.missionsCompleted} className="mono-tag text-xl font-semibold text-[color:var(--color-ink-0)]" />
          <p className="mt-1 flex items-center justify-center gap-1 text-[10px] uppercase tracking-wide text-[color:var(--color-ink-3)]">
            <Crosshair className="h-3 w-3" /> Missions
          </p>
        </div>
      </div>

      <div className="mt-4 space-y-3 rounded-2xl border border-[color:var(--color-border)] p-4">
        <div className="flex items-center gap-2.5 text-sm text-[color:var(--color-ink-1)]">
          <Mail className="h-4 w-4 text-[color:var(--color-ink-3)]" /> {personnel.email}
        </div>
        <div className="flex items-center gap-2.5 text-sm text-[color:var(--color-ink-1)]">
          <Phone className="h-4 w-4 text-[color:var(--color-ink-3)]" /> {personnel.phone}
        </div>
        <div className="flex items-center gap-2.5 text-sm text-[color:var(--color-ink-1)]">
          <MapPin className="h-4 w-4 text-[color:var(--color-ink-3)]" /> Currently at {personnel.location}
        </div>
        <div className="flex items-center gap-2.5 text-sm text-[color:var(--color-ink-1)]">
          <Calendar className="h-4 w-4 text-[color:var(--color-ink-3)]" /> Joined {formatDate(personnel.joinedAt)}
        </div>
      </div>

      <div className="mt-6">
        <div className="mb-2 flex items-center gap-2 text-sm font-medium text-[color:var(--color-ink-0)]">
          <HeartPulse className="h-4 w-4 text-[color:var(--color-danger-400)]" /> Health Readiness
        </div>
        <ProgressBar value={personnel.healthScore} tone={personnel.healthScore > 70 ? "success" : personnel.healthScore > 40 ? "amber" : "danger"} showLabel />
      </div>

      <div className="mt-6">
        <div className="mb-2 flex items-center gap-2 text-sm font-medium text-[color:var(--color-ink-0)]">
          <Award className="h-4 w-4 text-[color:var(--color-amber-400)]" /> Certifications
        </div>
        <div className="flex flex-wrap gap-2">
          {personnel.certifications.length === 0 && <p className="text-sm text-[color:var(--color-ink-3)]">No certifications on record.</p>}
          {personnel.certifications.map((c) => (
            <span key={c} className="rounded-full border border-[color:var(--color-border-strong)] bg-white/[0.03] px-2.5 py-1 text-xs text-[color:var(--color-ink-2)]">
              {c}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-6">
        <div className="mb-2 flex items-center gap-2 text-sm font-medium text-[color:var(--color-ink-0)]">
          <Boxes className="h-4 w-4 text-[color:var(--color-sentinel-400)]" /> Equipment in Use
        </div>
        <div className="space-y-2">
          {equipment.length === 0 && <p className="text-sm text-[color:var(--color-ink-3)]">No equipment currently assigned.</p>}
          {equipment.map((a) => (
            <div key={a.id} className="flex items-center justify-between rounded-xl border border-[color:var(--color-border)] px-3.5 py-2.5">
              <div>
                <p className="text-sm text-[color:var(--color-ink-1)]">{a.name}</p>
                <p className="text-xs capitalize text-[color:var(--color-ink-4)]">{a.category}</p>
              </div>
              <StatusBadge status={a.status} />
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-medium text-[color:var(--color-ink-0)]">Mission History</p>
          <span className="mono-tag text-xs text-[color:var(--color-ink-3)]">{personnel.missionsCompleted} completed</span>
        </div>
        <div className="space-y-2">
          {missionHistory.length === 0 && <p className="text-sm text-[color:var(--color-ink-3)]">No mission assignments yet.</p>}
          {missionHistory.map((m) => (
            <Link
              key={m.id}
              to={`/app/operations/${m.id}`}
              onClick={() => onOpenChange(false)}
              className="flex items-center justify-between gap-3 rounded-xl border border-[color:var(--color-border)] p-3 transition-colors hover:bg-white/[0.03]"
            >
              <div className="flex items-center gap-2.5">
                <Crosshair className="h-4 w-4 text-[color:var(--color-ink-3)]" />
                <div>
                  <p className="text-sm text-[color:var(--color-ink-1)]">{m.name}</p>
                  <p className="mono-tag text-xs text-[color:var(--color-ink-4)]">{m.code}</p>
                </div>
              </div>
              <PriorityBadge priority={m.priority} />
            </Link>
          ))}
        </div>
      </div>
    </Drawer>
  );
}
