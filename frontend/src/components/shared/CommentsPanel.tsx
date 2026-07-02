import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { MessageSquare, Pencil, Trash2, X, Check, Send } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Input";
import { EmptyState } from "@/components/ui/EmptyState";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Skeleton } from "@/components/ui/Skeleton";
import { commentsApi } from "@/services/api";
import { useAuthStore } from "@/store/authStore";
import { toast } from "@/store/toastStore";
import { timeAgo } from "@/lib/utils";
import type { CommentEntityType, CommentItem } from "@/types";

interface CommentsPanelProps {
  entityType: CommentEntityType;
  entityId: string;
}

/**
 * Reusable comment thread for any commentable module (missions, inventory,
 * assets, threats, training). Every write immediately persists via
 * services/api.ts (mock or real, depending on VITE_USE_MOCK_API) and the
 * matching AuditLog row shows up in <ActivityFeed> for the same entity.
 */
export function CommentsPanel({ entityType, entityId }: CommentsPanelProps) {
  const currentUser = useAuthStore((s) => s.user);
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState("");
  const [posting, setPosting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState("");
  const [savingEditId, setSavingEditId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CommentItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const rows = await commentsApi.list(entityType, entityId);
      setComments(rows);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entityType, entityId]);

  async function handlePost() {
    const content = draft.trim();
    if (!content) return;
    setPosting(true);
    try {
      const created = await commentsApi.create(entityType, entityId, content);
      setComments((prev) => [...prev, created]);
      setDraft("");
    } catch {
      toast.error("Couldn't post comment", "Please try again.");
    } finally {
      setPosting(false);
    }
  }

  function startEdit(comment: CommentItem) {
    setEditingId(comment.id);
    setEditDraft(comment.content);
  }

  async function saveEdit(id: string) {
    const content = editDraft.trim();
    if (!content) return;
    setSavingEditId(id);
    try {
      const updated = await commentsApi.update(id, content);
      setComments((prev) => prev.map((c) => (c.id === id ? updated : c)));
      setEditingId(null);
    } catch {
      toast.error("Couldn't save changes");
    } finally {
      setSavingEditId(null);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await commentsApi.remove(deleteTarget.id);
      setComments((prev) => prev.filter((c) => c.id !== deleteTarget.id));
      setDeleteTarget(null);
      toast.success("Comment deleted");
    } catch {
      toast.error("Couldn't delete comment");
    } finally {
      setDeleting(false);
    }
  }

  const canManage = (comment: CommentItem) =>
    currentUser && (currentUser.id === comment.user.id || currentUser.role === "commander");

  const canEdit = (comment: CommentItem) => currentUser && currentUser.id === comment.user.id;

  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <Avatar seed={currentUser?.avatarSeed ?? "you"} name={currentUser?.name ?? "You"} size="md" />
        <div className="flex-1 space-y-2">
          <Textarea
            placeholder="Add a comment…"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={2}
          />
          <div className="flex justify-end">
            <Button size="sm" icon={<Send />} loading={posting} disabled={!draft.trim()} onClick={handlePost}>
              Comment
            </Button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      ) : comments.length === 0 ? (
        <EmptyState icon={<MessageSquare />} title="No comments yet" description="Be the first to leave a note on this record." />
      ) : (
        <div className="space-y-3">
          <AnimatePresence initial={false}>
            {comments.map((c) => (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, height: 0 }}
                className="flex gap-3 rounded-xl border border-[color:var(--color-border)] p-3"
              >
                <Avatar seed={c.user.avatarSeed} name={c.user.name} size="sm" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex flex-wrap items-baseline gap-2">
                      <p className="text-sm font-medium text-[color:var(--color-ink-0)]">{c.user.name}</p>
                      <p className="text-xs text-[color:var(--color-ink-4)]">
                        {timeAgo(c.createdAt)}
                        {c.editedAt && " · edited"}
                      </p>
                    </div>
                    {canManage(c) && editingId !== c.id && (
                      <div className="flex shrink-0 gap-1">
                        {canEdit(c) && (
                          <button
                            onClick={() => startEdit(c)}
                            className="rounded-md p-1 text-[color:var(--color-ink-3)] hover:bg-white/5 hover:text-[color:var(--color-ink-0)]"
                            aria-label="Edit comment"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => setDeleteTarget(c)}
                          className="rounded-md p-1 text-[color:var(--color-ink-3)] hover:bg-white/5 hover:text-[color:var(--color-danger-400)]"
                          aria-label="Delete comment"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                  {editingId === c.id ? (
                    <div className="mt-2 space-y-2">
                      <Textarea value={editDraft} onChange={(e) => setEditDraft(e.target.value)} rows={2} />
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="sm" icon={<X />} onClick={() => setEditingId(null)}>
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          icon={<Check />}
                          loading={savingEditId === c.id}
                          disabled={!editDraft.trim()}
                          onClick={() => saveEdit(c.id)}
                        >
                          Save
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-[color:var(--color-ink-1)]">{c.content}</p>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete comment?"
        description="This comment will be permanently removed. This action cannot be undone."
        confirmLabel="Delete"
        loading={deleting}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
