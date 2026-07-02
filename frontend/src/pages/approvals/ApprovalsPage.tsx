import { useCallback, useEffect, useState } from "react";
import { CheckSquare, CalendarClock, Award, Check, X, Plus, Trash2 } from "lucide-react";
import { Tabs, TabPanel } from "@/components/ui/Tabs";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { EmptyState } from "@/components/ui/EmptyState";
import { SkeletonCard } from "@/components/ui/Skeleton";
import { toast } from "@/store/toastStore";
import { usePolling } from "@/hooks/usePolling";
import { leaveApi, badgesApi, personnelApi } from "@/services/api";
import { BadgeFormModal, type BadgeFormValues } from "./BadgeFormModal";
import type { Badge as BadgeRecord, LeaveRequest, Personnel } from "@/types";
import { formatDate } from "@/lib/utils";

export default function ApprovalsPage() {
  const [tab, setTab] = useState<"leave" | "badges">("leave");
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [badges, setBadges] = useState<BadgeRecord[]>([]);
  const [personnel, setPersonnel] = useState<Personnel[]>([]);
  const [loading, setLoading] = useState(true);
  const [badgeModalOpen, setBadgeModalOpen] = useState(false);

  const refresh = useCallback(() => {
    leaveApi.list().then(setLeaveRequests);
    badgesApi.list().then(setBadges);
  }, []);

  useEffect(() => {
    Promise.all([leaveApi.list(), badgesApi.list(), personnelApi.list()]).then(([lv, bd, p]) => {
      setLeaveRequests(lv);
      setBadges(bd);
      setPersonnel(p);
      setLoading(false);
    });
  }, []);

  usePolling(refresh, 20_000);

  async function decide(id: string, status: "approved" | "rejected") {
    try {
      await leaveApi.decide(id, status);
      setLeaveRequests((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
      toast.success(`Leave request ${status}`);
    } catch (err) {
      toast.error("Could not update request", err instanceof Error ? err.message : "Please try again.");
    }
  }

  async function awardBadge(values: BadgeFormValues) {
    try {
      await badgesApi.create(values);
      toast.success("Badge awarded");
      refresh();
    } catch (err) {
      toast.error("Could not award badge", err instanceof Error ? err.message : "Please try again.");
    }
  }

  async function revokeBadge(id: string) {
    try {
      await badgesApi.remove(id);
      setBadges((prev) => prev.filter((b) => b.id !== id));
      toast.success("Badge removed");
    } catch (err) {
      toast.error("Could not remove badge", err instanceof Error ? err.message : "Please try again.");
    }
  }

  const pendingLeave = leaveRequests.filter((r) => r.status === "pending");
  const decidedLeave = leaveRequests.filter((r) => r.status !== "pending");

  if (loading) {
    return <div className="grid grid-cols-1 gap-4 md:grid-cols-3">{Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2.5 text-2xl font-semibold tracking-tight text-[color:var(--color-ink-0)]">
          <CheckSquare className="h-6 w-6 text-[color:var(--color-sentinel-400)]" />
          Approvals &amp; Recognition
        </h1>
        <p className="mt-1 text-sm text-[color:var(--color-ink-3)]">Review leave requests and award achievement badges.</p>
      </div>

      <Tabs
        tabs={[
          { value: "leave", label: `Leave Requests${pendingLeave.length ? ` (${pendingLeave.length})` : ""}`, icon: <CalendarClock className="h-3.5 w-3.5" /> },
          { value: "badges", label: "Badges", icon: <Award className="h-3.5 w-3.5" /> },
        ]}
        value={tab}
        onValueChange={(v) => setTab(v as any)}
      >
        <TabPanel value="leave" className="pt-6 space-y-6">
          <div>
            <p className="mb-3 text-xs font-medium uppercase tracking-wider text-[color:var(--color-ink-4)]">Pending</p>
            {pendingLeave.length === 0 ? (
              <EmptyState icon={<CalendarClock />} title="No pending leave requests" description="Requests submitted by soldiers will appear here for approval." />
            ) : (
              <div className="space-y-3">
                {pendingLeave.map((r) => (
                  <Card key={r.id}>
                    <CardContent className="flex flex-col gap-3 !pt-6 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar seed={r.personnel.avatarSeed} name={r.personnel.name} size="sm" />
                        <div>
                          <p className="text-sm font-medium text-[color:var(--color-ink-0)]">{r.personnel.rank} {r.personnel.name}</p>
                          <p className="text-xs text-[color:var(--color-ink-3)]">{r.reason} · {formatDate(r.startDate)} – {formatDate(r.endDate)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="secondary" icon={<Check />} onClick={() => decide(r.id, "approved")}>Approve</Button>
                        <Button size="sm" variant="danger" icon={<X />} onClick={() => decide(r.id, "rejected")}>Reject</Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {decidedLeave.length > 0 && (
            <div>
              <p className="mb-3 text-xs font-medium uppercase tracking-wider text-[color:var(--color-ink-4)]">History</p>
              <Card>
                <CardContent className="!px-0 !pb-0">
                  <div className="divide-y divide-[color:var(--color-border)]">
                    {decidedLeave.map((r) => (
                      <div key={r.id} className="flex items-center justify-between px-6 py-3.5">
                        <div>
                          <p className="text-sm text-[color:var(--color-ink-1)]">{r.personnel.rank} {r.personnel.name} — {r.reason}</p>
                          <p className="text-xs text-[color:var(--color-ink-4)]">{formatDate(r.startDate)} – {formatDate(r.endDate)}</p>
                        </div>
                        <StatusBadge status={r.status} />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabPanel>

        <TabPanel value="badges" className="pt-6">
          <div className="mb-4 flex justify-end">
            <Button icon={<Plus />} onClick={() => setBadgeModalOpen(true)}>Award Badge</Button>
          </div>
          {badges.length === 0 ? (
            <EmptyState icon={<Award />} title="No badges awarded yet" description="Recognize outstanding soldiers with an achievement badge." />
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {badges.map((b) => (
                <Card key={b.id}>
                  <CardContent className="!pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[color:var(--color-amber-500)]/12 text-[color:var(--color-amber-400)]">
                        <Award className="h-5 w-5" />
                      </div>
                      <Button size="sm" variant="ghost" icon={<Trash2 />} onClick={() => revokeBadge(b.id)} />
                    </div>
                    <p className="mt-3 text-sm font-medium text-[color:var(--color-ink-0)]">{b.title}</p>
                    <p className="mt-0.5 text-xs text-[color:var(--color-ink-3)]">{b.description}</p>
                    {b.personnel && <p className="mt-2 text-xs text-[color:var(--color-ink-4)]">Awarded to {b.personnel.name}</p>}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabPanel>
      </Tabs>

      <BadgeFormModal open={badgeModalOpen} onOpenChange={setBadgeModalOpen} onSubmit={awardBadge} personnel={personnel} />
    </div>
  );
}
