import { useState } from "react";
import type { ReactNode } from "react";
import { Drawer } from "@/components/ui/Drawer";
import { Tabs, TabPanel } from "@/components/ui/Tabs";
import { CommentsPanel } from "./CommentsPanel";
import { ActivityFeed } from "./ActivityFeed";
import type { CommentEntityType } from "@/types";

interface EntityDetailDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  entityType: CommentEntityType;
  entityId: string;
  /** Details tab content — record-specific fields, rendered by the caller. */
  children: ReactNode;
  /** Which tab to land on when the drawer opens (e.g. "comments" from a quick-action). */
  defaultTab?: "details" | "comments" | "activity";
  width?: "md" | "lg";
}

/**
 * Shared detail drawer used across modules that don't otherwise have a
 * dedicated details page (Weapons, Training, Assets, Intelligence). Adds a
 * consistent Details / Comments / Activity structure on top of whatever
 * record-specific markup the caller passes as children.
 */
export function EntityDetailDrawer({
  open,
  onOpenChange,
  title,
  entityType,
  entityId,
  children,
  defaultTab = "details",
  width = "lg",
}: EntityDetailDrawerProps) {
  const [tab, setTab] = useState(defaultTab);

  return (
    <Drawer open={open} onOpenChange={(next) => { onOpenChange(next); if (next) setTab(defaultTab); }} title={title} width={width}>
      <Tabs
        tabs={[
          { value: "details", label: "Details" },
          { value: "comments", label: "Comments" },
          { value: "activity", label: "Activity" },
        ]}
        value={tab}
        onValueChange={(v) => setTab(v as typeof tab)}
      >
        <TabPanel value="details" className="pt-5">{children}</TabPanel>
        <TabPanel value="comments" className="pt-5">
          <CommentsPanel entityType={entityType} entityId={entityId} />
        </TabPanel>
        <TabPanel value="activity" className="pt-5">
          <ActivityFeed entityType={entityType} entityId={entityId} />
        </TabPanel>
      </Tabs>
    </Drawer>
  );
}
