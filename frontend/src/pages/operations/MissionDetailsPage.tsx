import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "motion/react";
import {
  ArrowLeft, Users, Boxes, CheckCircle2, Circle, Clock, Pencil,
  UserPlus, PackagePlus, MessageSquarePlus, CheckCheck,
} from "lucide-react";
import { Tabs, TabPanel } from "@/components/ui/Tabs";
import { Button } from "@/components/ui/Button";
import { PriorityBadge, StatusBadge } from "@/components/ui/Badge";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";
import { Input } from "@/components/ui/Input";
import { AssignDrawer } from "./AssignDrawer";
import { MissionFormModal, type MissionFormValues } from "./MissionFormModal";
import { CommentsPanel } from "@/components/shared/CommentsPanel";
import { ActivityFeed } from "@/components/shared/ActivityFeed";
import { missionsApi, personnelApi, assetsApi } from "@/services/api";
import { toast } from "@/store/toastStore";
import { formatDate, formatDateTime } from "@/lib/utils";
import type { Asset, Mission, Objective, Personnel } from "@/types";
import { LoadingScreen } from "@/components/ui/LoadingScreen";

const TABS = [
  { value: "overview", label: "Overview" },
  { value: "objectives", label: "Objectives" },
  { value: "timeline", label: "Timeline" },
  { value: "squad", label: "Squad" },
  { value: "equipment", label: "Equipment" },
  { value: "logs", label: "Logs" },
  { value: "comments", label: "Comments" },
  { value: "activity", label: "Activity" },
];

export default function MissionDetailsPage() {
  const { missionId } = useParams();
  const navigate = useNavigate();
  const [mission, setMission] = useState<Mission | null>(null);
  const [personnel, setPersonnel] = useState<Personnel[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [tab, setTab] = useState("overview");
  const [editOpen, setEditOpen] = useState(false);
  const [squadDrawerOpen, setSquadDrawerOpen] = useState(false);
  const [equipmentDrawerOpen, setEquipmentDrawerOpen] = useState(false);
  const [logMessage, setLogMessage] = useState("");

  async function load() {
    if (!missionId) return;
    const [m, p, a] = await Promise.all([missionsApi.get(missionId), personnelApi.list(), assetsApi.list()]);
    setMission(m);
    setPersonnel(p);
    setAssets(a);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [missionId]);

  if (!mission) return <LoadingScreen />;

  const squad = personnel.filter((p) => mission.squadIds.includes(p.id));
  const equipment = assets.filter((a) => mission.equipmentIds.includes(a.id));

  async function handleUpdate(values: MissionFormValues) {
    if (!mission) return;
    const updated = await missionsApi.update(mission.id, values);
    setMission(updated);
    toast.success("Mission updated");
  }

  async function markComplete() {
    if (!mission) return;
    const updated = await missionsApi.update(mission.id, { status: "completed", progress: 100 });
    await missionsApi.addLog(mission.id, "Mission marked as complete.", "info");
    setMission(await missionsApi.get(mission.id));
    toast.success("Mission completed", `${updated.code} has been marked complete.`);
  }

  async function toggleObjective(objId: string) {
    if (!mission) return;
    // A `const` assertion can't be applied to a ternary expression itself
    // (TS1355), and applying it only to one branch lets the other branch
    // widen to plain `string`, which no longer satisfies `Objective["status"]`.
    // Assigning the ternary's result to a variable explicitly typed as
    // `Objective["status"]` gives both branches that contextual type
    // instead, so "in_progress" and "complete" stay literal without any
    // assertion at all.
    const objectives = mission.objectives.map((o) => {
      if (o.id !== objId) return o;
      const nextStatus: Objective["status"] = o.status === "complete" ? "in_progress" : "complete";
      return { ...o, status: nextStatus };
    });
    const updated = await missionsApi.update(mission.id, { objectives });
    setMission(updated);
  }

  async function saveSquad(ids: string[]) {
    if (!mission) return;
    const updated = await missionsApi.update(mission.id, { squadIds: ids });
    await missionsApi.addLog(mission.id, `Squad updated — ${ids.length} personnel assigned.`, "action");
    setMission(await missionsApi.get(mission.id));
    toast.success("Squad updated");
  }

  async function saveEquipment(ids: string[]) {
    if (!mission) return;
    const updated = await missionsApi.update(mission.id, { equipmentIds: ids });
    await missionsApi.addLog(mission.id, `Equipment updated — ${ids.length} assets assigned.`, "action");
    setMission(await missionsApi.get(mission.id));
    toast.success("Equipment updated");
  }

  async function addLogEntry() {
    if (!mission || !logMessage.trim()) return;
    await missionsApi.addLog(mission.id, logMessage.trim(), "info");
    setMission(await missionsApi.get(mission.id));
    setLogMessage("");
  }

  return (
    <div className="space-y-6">
      <button onClick={() => navigate("/app/operations")} className="flex items-center gap-1.5 text-sm text-[color:var(--color-ink-3)] hover:text-[color:var(--color-ink-0)]">
        <ArrowLeft className="h-4 w-4" /> Back to Operations
      </button>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card-elevated p-6">
        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-start">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2.5">
              <p className="mono-tag text-xs text-[color:var(--color-ink-3)]">{mission.code}</p>
              <PriorityBadge priority={mission.priority} />
              <StatusBadge status={mission.status} />
            </div>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-[color:var(--color-ink-0)]">{mission.name}</h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[color:var(--color-ink-3)]">{mission.description}</p>
            <div className="mt-4 flex flex-wrap items-center gap-6 text-xs text-[color:var(--color-ink-3)]">
              <span>Region: <span className="text-[color:var(--color-ink-1)]">{mission.region}</span></span>
              <span>Commander: <span className="text-[color:var(--color-ink-1)]">{mission.commanderName}</span></span>
              <span>Timeline: <span className="text-[color:var(--color-ink-1)]">{formatDate(mission.startDate)} – {formatDate(mission.endDate)}</span></span>
            </div>
          </div>
          <div className="flex shrink-0 flex-col gap-2 sm:flex-row lg:flex-col">
            <Button variant="secondary" icon={<Pencil />} onClick={() => setEditOpen(true)}>Edit mission</Button>
            {mission.status !== "completed" && (
              <Button icon={<CheckCheck />} onClick={markComplete}>Mark Complete</Button>
            )}
          </div>
        </div>
        <div className="mt-6 max-w-md">
          <ProgressBar value={mission.progress} showLabel tone={mission.progress === 100 ? "success" : "sentinel"} />
        </div>
      </motion.div>

      <Tabs tabs={TABS} value={tab} onValueChange={setTab}>
        <TabPanel value="overview" className="pt-6">
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader><CardTitle>Objective Summary</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {mission.objectives.map((o) => (
                  <div key={o.id} className="flex items-center gap-3 rounded-xl border border-[color:var(--color-border)] p-3">
                    {o.status === "complete" ? (
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-[color:var(--color-success-400)]" />
                    ) : (
                      <Circle className="h-4 w-4 shrink-0 text-[color:var(--color-ink-4)]" />
                    )}
                    <p className="flex-1 text-sm text-[color:var(--color-ink-1)]">{o.title}</p>
                    <span className="text-xs text-[color:var(--color-ink-3)]">{formatDate(o.dueDate)}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Quick Stats</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[color:var(--color-ink-3)]">Squad size</span>
                  <span className="font-medium text-[color:var(--color-ink-0)]">{squad.length}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[color:var(--color-ink-3)]">Assets deployed</span>
                  <span className="font-medium text-[color:var(--color-ink-0)]">{equipment.length}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[color:var(--color-ink-3)]">Log entries</span>
                  <span className="font-medium text-[color:var(--color-ink-0)]">{mission.logs.length}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[color:var(--color-ink-3)]">Objectives complete</span>
                  <span className="font-medium text-[color:var(--color-ink-0)]">
                    {mission.objectives.filter((o) => o.status === "complete").length}/{mission.objectives.length}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabPanel>

        <TabPanel value="objectives" className="pt-6">
          <Card>
            <CardContent className="space-y-3 pt-6">
              {mission.objectives.map((o) => (
                <button
                  key={o.id}
                  onClick={() => toggleObjective(o.id)}
                  className="flex w-full items-center gap-3 rounded-xl border border-[color:var(--color-border)] p-4 text-left transition-colors hover:bg-white/[0.03]"
                >
                  {o.status === "complete" ? (
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-[color:var(--color-success-400)]" />
                  ) : (
                    <Circle className="h-5 w-5 shrink-0 text-[color:var(--color-ink-4)]" />
                  )}
                  <div className="flex-1">
                    <p className="text-sm font-medium text-[color:var(--color-ink-0)]">{o.title}</p>
                    <p className="text-xs text-[color:var(--color-ink-3)]">{o.description}</p>
                  </div>
                  <span className="text-xs text-[color:var(--color-ink-3)]">Due {formatDate(o.dueDate)}</span>
                </button>
              ))}
            </CardContent>
          </Card>
        </TabPanel>

        <TabPanel value="timeline" className="pt-6">
          <Card>
            <CardContent className="pt-6">
              <div className="relative space-y-8 border-l border-[color:var(--color-border-strong)] pl-6">
                {[...mission.logs].reverse().map((log, i) => (
                  <motion.div
                    key={log.id}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="relative"
                  >
                    <span className="absolute -left-[31px] top-1 h-3 w-3 rounded-full border-2 border-[color:var(--color-base)] bg-[color:var(--color-sentinel-500)]" />
                    <p className="text-xs text-[color:var(--color-ink-3)]">{formatDateTime(log.timestamp)}</p>
                    <p className="mt-0.5 text-sm text-[color:var(--color-ink-1)]">{log.message}</p>
                    <p className="text-xs text-[color:var(--color-ink-4)]">{log.author}</p>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabPanel>

        <TabPanel value="squad" className="pt-6">
          <div className="mb-4 flex justify-end">
            <Button icon={<UserPlus />} variant="secondary" onClick={() => setSquadDrawerOpen(true)}>Assign Personnel</Button>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {squad.map((p) => (
              <Card key={p.id}>
                <CardContent className="flex items-center gap-3 pt-6">
                  <Avatar seed={p.avatarSeed} name={p.name} size="md" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-[color:var(--color-ink-0)]">{p.rank} {p.name}</p>
                    <p className="truncate text-xs text-[color:var(--color-ink-3)]">{p.roleTitle}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
            {squad.length === 0 && (
              <div className="col-span-full flex flex-col items-center gap-2 rounded-2xl border border-dashed border-[color:var(--color-border-strong)] py-12 text-center">
                <Users className="h-6 w-6 text-[color:var(--color-ink-3)]" />
                <p className="text-sm text-[color:var(--color-ink-3)]">No personnel assigned yet.</p>
              </div>
            )}
          </div>
        </TabPanel>

        <TabPanel value="equipment" className="pt-6">
          <div className="mb-4 flex justify-end">
            <Button icon={<PackagePlus />} variant="secondary" onClick={() => setEquipmentDrawerOpen(true)}>Assign Asset</Button>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {equipment.map((a) => (
              <Card key={a.id}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-[color:var(--color-ink-0)]">{a.name}</p>
                    <StatusBadge status={a.status} />
                  </div>
                  <p className="mt-1 text-xs text-[color:var(--color-ink-3)] capitalize">{a.category} · {a.model}</p>
                </CardContent>
              </Card>
            ))}
            {equipment.length === 0 && (
              <div className="col-span-full flex flex-col items-center gap-2 rounded-2xl border border-dashed border-[color:var(--color-border-strong)] py-12 text-center">
                <Boxes className="h-6 w-6 text-[color:var(--color-ink-3)]" />
                <p className="text-sm text-[color:var(--color-ink-3)]">No equipment assigned yet.</p>
              </div>
            )}
          </div>
        </TabPanel>

        <TabPanel value="logs" className="pt-6">
          <Card>
            <CardHeader><CardTitle>Mission Logs</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-2">
                <Input placeholder="Add a log entry…" value={logMessage} onChange={(e) => setLogMessage(e.target.value)} />
                <Button icon={<MessageSquarePlus />} onClick={addLogEntry}>Add</Button>
              </div>
              <div className="space-y-2 pt-2">
                {mission.logs.map((log) => (
                  <div key={log.id} className="flex items-start gap-3 rounded-xl border border-[color:var(--color-border)] p-3">
                    <Clock className="mt-0.5 h-4 w-4 shrink-0 text-[color:var(--color-ink-3)]" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-[color:var(--color-ink-1)]">{log.message}</p>
                      <p className="mt-0.5 text-xs text-[color:var(--color-ink-4)]">{log.author} · {formatDateTime(log.timestamp)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabPanel>

        <TabPanel value="comments" className="pt-6">
          <Card>
            <CardHeader><CardTitle>Comments</CardTitle></CardHeader>
            <CardContent>
              <CommentsPanel entityType="mission" entityId={mission.id} />
            </CardContent>
          </Card>
        </TabPanel>

        <TabPanel value="activity" className="pt-6">
          <Card>
            <CardHeader><CardTitle>Activity</CardTitle></CardHeader>
            <CardContent>
              <ActivityFeed entityType="mission" entityId={mission.id} />
            </CardContent>
          </Card>
        </TabPanel>
      </Tabs>

      <MissionFormModal open={editOpen} onOpenChange={setEditOpen} onSubmit={handleUpdate} mission={mission} />
      <AssignDrawer
        open={squadDrawerOpen}
        onOpenChange={setSquadDrawerOpen}
        title="Assign personnel"
        options={personnel.map((p) => ({ id: p.id, title: `${p.rank} ${p.name}`, subtitle: p.roleTitle }))}
        initiallySelected={mission.squadIds}
        onConfirm={saveSquad}
      />
      <AssignDrawer
        open={equipmentDrawerOpen}
        onOpenChange={setEquipmentDrawerOpen}
        title="Assign equipment"
        options={assets.map((a) => ({ id: a.id, title: a.name, subtitle: `${a.category} · ${a.model}` }))}
        initiallySelected={mission.equipmentIds}
        onConfirm={saveEquipment}
      />
    </div>
  );
}
