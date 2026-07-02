import { useCallback, useEffect, useState } from "react";
import { Users, Plus, Trash2, MapPinned, CalendarClock, Trash } from "lucide-react";
import { Tabs, TabPanel } from "@/components/ui/Tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge, StatusBadge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { EmptyState } from "@/components/ui/EmptyState";
import { SkeletonCard } from "@/components/ui/Skeleton";
import { toast } from "@/store/toastStore";
import { usePolling } from "@/hooks/usePolling";
import { squadsApi, patrolRoutesApi, shiftsApi, personnelApi, missionsApi } from "@/services/api";
import { SquadFormModal, type SquadFormValues } from "./SquadFormModal";
import { PatrolRouteFormModal, type PatrolRouteFormValues } from "./PatrolRouteFormModal";
import { ShiftFormModal, type ShiftFormValues } from "./ShiftFormModal";
import type { Mission, PatrolRoute, Personnel, ShiftSchedule, Squad } from "@/types";

export default function SquadsPage() {
  const [tab, setTab] = useState<"squads" | "patrols" | "shifts">("squads");
  const [squads, setSquads] = useState<Squad[]>([]);
  const [patrolRoutes, setPatrolRoutes] = useState<PatrolRoute[]>([]);
  const [shifts, setShifts] = useState<ShiftSchedule[]>([]);
  const [personnel, setPersonnel] = useState<Personnel[]>([]);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [loading, setLoading] = useState(true);

  const [squadModalOpen, setSquadModalOpen] = useState(false);
  const [editingSquad, setEditingSquad] = useState<Squad | null>(null);
  const [routeModalOpen, setRouteModalOpen] = useState(false);
  const [shiftModalOpen, setShiftModalOpen] = useState(false);

  const refresh = useCallback(() => {
    squadsApi.list().then(setSquads);
    patrolRoutesApi.list().then(setPatrolRoutes);
    shiftsApi.list().then(setShifts);
  }, []);

  useEffect(() => {
    Promise.all([squadsApi.list(), patrolRoutesApi.list(), shiftsApi.list(), personnelApi.list(), missionsApi.list()]).then(
      ([sq, pr, sh, p, m]) => {
        setSquads(sq);
        setPatrolRoutes(pr);
        setShifts(sh);
        setPersonnel(p);
        setMissions(m);
        setLoading(false);
      }
    );
  }, []);

  usePolling(refresh, 20_000);

  async function saveSquad(values: SquadFormValues) {
    try {
      if (editingSquad) {
        await squadsApi.update(editingSquad.id, { name: values.name, unit: values.unit, leaderId: values.leaderId || null });
        await squadsApi.setMembers(editingSquad.id, values.memberIds);
      } else {
        await squadsApi.create(values);
      }
      toast.success(editingSquad ? "Squad updated" : "Squad created");
      refresh();
    } catch (err) {
      toast.error("Could not save squad", err instanceof Error ? err.message : "Please try again.");
    }
  }

  async function removeSquad(id: string) {
    try {
      await squadsApi.remove(id);
      setSquads((prev) => prev.filter((s) => s.id !== id));
      toast.success("Squad disbanded");
    } catch (err) {
      toast.error("Could not remove squad", err instanceof Error ? err.message : "Please try again.");
    }
  }

  async function createRoute(values: PatrolRouteFormValues) {
    try {
      await patrolRoutesApi.create({
        name: values.name,
        region: values.region,
        missionId: values.missionId || undefined,
        squadId: values.squadId || undefined,
        points: values.points.map((p, i) => ({ kind: p.kind, sequence: i, label: p.label, location: p.location })),
      });
      toast.success("Patrol route created");
      refresh();
    } catch (err) {
      toast.error("Could not create route", err instanceof Error ? err.message : "Please try again.");
    }
  }

  async function removeRoute(id: string) {
    try {
      await patrolRoutesApi.remove(id);
      setPatrolRoutes((prev) => prev.filter((r) => r.id !== id));
      toast.success("Patrol route removed");
    } catch (err) {
      toast.error("Could not remove route", err instanceof Error ? err.message : "Please try again.");
    }
  }

  async function createShift(values: ShiftFormValues) {
    try {
      await shiftsApi.create({ ...values, missionId: values.missionId || undefined });
      toast.success("Shift scheduled", "The soldier has been notified.");
      refresh();
    } catch (err) {
      toast.error("Could not schedule shift", err instanceof Error ? err.message : "Please try again.");
    }
  }

  async function removeShift(id: string) {
    try {
      await shiftsApi.remove(id);
      setShifts((prev) => prev.filter((s) => s.id !== id));
      toast.success("Shift removed");
    } catch (err) {
      toast.error("Could not remove shift", err instanceof Error ? err.message : "Please try again.");
    }
  }

  if (loading) {
    return <div className="grid grid-cols-1 gap-4 md:grid-cols-3">{Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2.5 text-2xl font-semibold tracking-tight text-[color:var(--color-ink-0)]">
          <Users className="h-6 w-6 text-[color:var(--color-sentinel-400)]" />
          Squads &amp; Patrol Operations
        </h1>
        <p className="mt-1 text-sm text-[color:var(--color-ink-3)]">Organize tactical teams, plan patrols, and schedule shifts.</p>
      </div>

      <Tabs
        tabs={[
          { value: "squads", label: "Squads", icon: <Users className="h-3.5 w-3.5" /> },
          { value: "patrols", label: "Patrol Routes", icon: <MapPinned className="h-3.5 w-3.5" /> },
          { value: "shifts", label: "Shift Schedule", icon: <CalendarClock className="h-3.5 w-3.5" /> },
        ]}
        value={tab}
        onValueChange={(v) => setTab(v as any)}
      >
        <TabPanel value="squads" className="pt-6">
          <div className="mb-4 flex justify-end">
            <Button icon={<Plus />} onClick={() => { setEditingSquad(null); setSquadModalOpen(true); }}>New Squad</Button>
          </div>
          {squads.length === 0 ? (
            <EmptyState icon={<Users />} title="No squads yet" description="Create a squad to organize soldiers into a standing tactical team." />
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {squads.map((s) => (
                <Card key={s.id} className="cursor-pointer" onClick={() => { setEditingSquad(s); setSquadModalOpen(true); }}>
                  <CardHeader>
                    <CardTitle>{s.name}</CardTitle>
                    <Button size="sm" variant="ghost" icon={<Trash2 />} onClick={(e) => { e.stopPropagation(); removeSquad(s.id); }} />
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-[color:var(--color-ink-3)]">{s.unit}</p>
                    {s.leader && (
                      <div className="mt-3 flex items-center gap-2">
                        <Avatar seed={s.leader.avatarSeed} name={s.leader.name} size="sm" />
                        <div>
                          <p className="text-xs font-medium text-[color:var(--color-ink-0)]">{s.leader.rank} {s.leader.name}</p>
                          <p className="text-[10px] uppercase tracking-wide text-[color:var(--color-ink-4)]">Team Leader</p>
                        </div>
                      </div>
                    )}
                    <div className="mt-3 flex -space-x-2">
                      {s.members.slice(0, 6).map((m) => (
                        <Avatar key={m.id} seed={m.personnel.avatarSeed} name={m.personnel.name} size="sm" ring />
                      ))}
                    </div>
                    <p className="mt-2 text-xs text-[color:var(--color-ink-3)]">{s.members.length} member{s.members.length === 1 ? "" : "s"}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabPanel>

        <TabPanel value="patrols" className="pt-6">
          <div className="mb-4 flex justify-end">
            <Button icon={<Plus />} onClick={() => setRouteModalOpen(true)}>New Patrol Route</Button>
          </div>
          {patrolRoutes.length === 0 ? (
            <EmptyState icon={<MapPinned />} title="No patrol routes yet" description="Plan a route with waypoints and checkpoints for a mission or squad." />
          ) : (
            <div className="space-y-3">
              {patrolRoutes.map((r) => (
                <Card key={r.id}>
                  <CardContent className="flex flex-col gap-3 !pt-6 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-[color:var(--color-ink-0)]">{r.name}</p>
                        <StatusBadge status={r.status} />
                      </div>
                      <p className="mt-0.5 text-xs text-[color:var(--color-ink-3)]">
                        {r.region}{r.mission ? ` · ${r.mission.code}` : ""}{r.squad ? ` · ${r.squad.name}` : ""} · {r.points.length} points
                      </p>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {r.points.map((p) => (
                          <Badge key={p.id} tone={p.status === "reached" ? "success" : "neutral"}>{p.label}</Badge>
                        ))}
                      </div>
                    </div>
                    <Button size="sm" variant="ghost" icon={<Trash />} onClick={() => removeRoute(r.id)} />
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabPanel>

        <TabPanel value="shifts" className="pt-6">
          <div className="mb-4 flex justify-end">
            <Button icon={<Plus />} onClick={() => setShiftModalOpen(true)}>Schedule Shift</Button>
          </div>
          {shifts.length === 0 ? (
            <EmptyState icon={<CalendarClock />} title="No shifts scheduled" description="Assign patrol, guard, rest, or admin shifts to soldiers." />
          ) : (
            <Card>
              <CardContent className="!px-0 !pb-0">
                <div className="divide-y divide-[color:var(--color-border)]">
                  {shifts.map((s) => (
                    <div key={s.id} className="flex flex-col gap-2 px-6 py-3.5 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar seed={s.personnel.avatarSeed} name={s.personnel.name} size="sm" />
                        <div>
                          <p className="text-sm font-medium text-[color:var(--color-ink-0)]">{s.personnel.rank} {s.personnel.name}</p>
                          <p className="text-xs text-[color:var(--color-ink-3)]">
                            {new Date(s.shiftDate).toLocaleDateString()} · {s.startTime}–{s.endTime}{s.mission ? ` · ${s.mission.code}` : ""}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge tone="neutral">{s.type}</Badge>
                        <Button size="sm" variant="ghost" icon={<Trash2 />} onClick={() => removeShift(s.id)} />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabPanel>
      </Tabs>

      <SquadFormModal open={squadModalOpen} onOpenChange={setSquadModalOpen} onSubmit={saveSquad} personnel={personnel} squad={editingSquad} />
      <PatrolRouteFormModal open={routeModalOpen} onOpenChange={setRouteModalOpen} onSubmit={createRoute} missions={missions} squads={squads} />
      <ShiftFormModal open={shiftModalOpen} onOpenChange={setShiftModalOpen} onSubmit={createShift} personnel={personnel} missions={missions} />
    </div>
  );
}
