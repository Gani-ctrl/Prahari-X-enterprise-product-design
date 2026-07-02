import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  Bot, Send, Plus, Trash2, FileDown, Sparkles, Crosshair, ShieldAlert, Users2, Pencil, Check, X, Search,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { aiApi } from "@/services/api";
import { useAuthStore } from "@/store/authStore";
import { toast } from "@/store/toastStore";
import { cn, formatDateTime } from "@/lib/utils";
import type { ChatConversation } from "@/types";

const SUGGESTIONS = [
  { icon: Crosshair, label: "Draft a mission brief", prompt: "Draft a mission brief for a reconnaissance operation in Western Ghats Corridor." },
  { icon: ShieldAlert, label: "Analyze threat patterns", prompt: "Summarize the last 48 hours of threat activity and flag correlations." },
  { icon: Users2, label: "Check squad readiness", prompt: "What is the current personnel readiness across active missions?" },
  { icon: Sparkles, label: "Suggest optimizations", prompt: "Where can we reallocate assets to improve mission coverage this week?" },
];

export default function AIAssistantPage() {
  const user = useAuthStore((s) => s.user);
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [deleting, setDeleting] = useState<ChatConversation | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameDraft, setRenameDraft] = useState("");
  const [search, setSearch] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  async function load() {
    const convos = await aiApi.listConversations();
    setConversations(convos);
    if (convos.length > 0) setActiveId(convos[0].id);
  }

  useEffect(() => {
    load();
  }, []);

  const active = conversations.find((c) => c.id === activeId) ?? null;

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [active?.messages.length]);

  async function ensureConversation(): Promise<string> {
    if (activeId) return activeId;
    const convo = await aiApi.createConversation("New conversation");
    setConversations((prev) => [convo, ...prev]);
    setActiveId(convo.id);
    return convo.id;
  }

  async function send(prompt?: string) {
    const content = prompt ?? input;
    if (!content.trim()) return;
    setInput("");
    const convoId = await ensureConversation();
    setSending(true);
    setConversations((prev) =>
      prev.map((c) => (c.id === convoId ? { ...c, title: c.messages.length === 0 ? content.slice(0, 40) : c.title, messages: [...c.messages, { id: `tmp-${Date.now()}`, role: "user", content, createdAt: new Date().toISOString() }] } : c))
    );
    await aiApi.sendMessage(convoId, content);
    const refreshed = await aiApi.listConversations();
    setConversations(refreshed);
    setSending(false);
  }

  async function newConversation() {
    const convo = await aiApi.createConversation("New conversation");
    setConversations((prev) => [convo, ...prev]);
    setActiveId(convo.id);
  }

  async function handleDelete() {
    if (!deleting) return;
    await aiApi.deleteConversation(deleting.id);
    setConversations((prev) => prev.filter((c) => c.id !== deleting.id));
    if (activeId === deleting.id) setActiveId(null);
    setDeleting(null);
    toast.success("Conversation deleted");
  }

  function startRename(c: ChatConversation) {
    setRenamingId(c.id);
    setRenameDraft(c.title);
  }

  async function saveRename(id: string) {
    const title = renameDraft.trim();
    if (!title) {
      setRenamingId(null);
      return;
    }
    try {
      const updated = await aiApi.renameConversation(id, title);
      setConversations((prev) => prev.map((c) => (c.id === id ? updated : c)));
    } catch {
      toast.error("Couldn't rename conversation");
    } finally {
      setRenamingId(null);
    }
  }

  const filteredConversations = conversations.filter((c) => c.title.toLowerCase().includes(search.toLowerCase()));

  function exportConversation() {
    if (!active) return;
    const win = window.open("", "_blank", "width=800,height=900");
    if (!win) return;
    const body = active.messages
      .map((m) => `<div style="margin-bottom:16px;"><p style="font-size:11px;color:#888;text-transform:uppercase;letter-spacing:0.05em;">${m.role === "user" ? "Commander" : "PRAHARI AI"} · ${formatDateTime(m.createdAt)}</p><p style="font-size:14px;line-height:1.6;color:#111;margin-top:4px;">${m.content}</p></div>`)
      .join("");
    win.document.write(`
      <html><head><title>${active.title}</title></head>
      <body style="font-family: -apple-system, sans-serif; padding: 40px; max-width: 700px; margin: 0 auto;">
        <h1 style="font-size:20px;">${active.title}</h1>
        <p style="font-size:12px;color:#888;margin-bottom:24px;">Exported from PRAHARI X AI Assistant</p>
        ${body}
      </body></html>
    `);
    win.document.close();
    win.focus();
    win.print();
    toast.success("Export ready", "Use your browser's print dialog to save as PDF.");
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-5">
      <aside className="hidden w-72 shrink-0 flex-col card-elevated md:flex">
        <div className="space-y-2.5 border-b border-[color:var(--color-border)] p-4">
          <Button className="w-full" icon={<Plus />} onClick={newConversation}>New conversation</Button>
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[color:var(--color-ink-3)]" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search conversations…"
              className="h-8 w-full rounded-[var(--radius-sm)] border border-[color:var(--color-border-strong)] bg-[color:var(--color-surface)] pl-8 pr-2 text-xs text-[color:var(--color-ink-0)] placeholder:text-[color:var(--color-ink-3)] focus:border-[color:var(--color-sentinel-500)] focus:outline-none"
            />
          </div>
        </div>
        <div className="flex-1 space-y-1 overflow-y-auto p-2">
          {filteredConversations.map((c) => (
            <div
              key={c.id}
              onClick={() => renamingId !== c.id && setActiveId(c.id)}
              className={cn(
                "group flex w-full cursor-pointer items-start justify-between gap-2 rounded-[var(--radius-sm)] px-3 py-2.5 text-left transition-colors",
                c.id === activeId ? "bg-[color:var(--color-sentinel-500)]/12" : "hover:bg-white/[0.04]"
              )}
            >
              {renamingId === c.id ? (
                <div className="flex w-full items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                  <input
                    autoFocus
                    value={renameDraft}
                    onChange={(e) => setRenameDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") saveRename(c.id);
                      if (e.key === "Escape") setRenamingId(null);
                    }}
                    className="h-7 w-full rounded-md border border-[color:var(--color-sentinel-500)]/50 bg-[color:var(--color-surface)] px-2 text-xs text-[color:var(--color-ink-0)] focus:outline-none"
                  />
                  <button onClick={() => saveRename(c.id)} className="shrink-0 rounded p-1 text-[color:var(--color-success-400)] hover:bg-white/5"><Check className="h-3.5 w-3.5" /></button>
                  <button onClick={() => setRenamingId(null)} className="shrink-0 rounded p-1 text-[color:var(--color-ink-4)] hover:bg-white/5"><X className="h-3.5 w-3.5" /></button>
                </div>
              ) : (
                <>
                  <div className="min-w-0">
                    <p className={cn("truncate text-sm", c.id === activeId ? "text-[color:var(--color-ink-0)]" : "text-[color:var(--color-ink-1)]")}>{c.title}</p>
                    <p className="mt-0.5 text-xs text-[color:var(--color-ink-4)]">{formatDateTime(c.updatedAt)}</p>
                  </div>
                  <div className="flex shrink-0 gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                    <span role="button" onClick={(e) => { e.stopPropagation(); startRename(c); }} className="mt-0.5 rounded p-1 text-[color:var(--color-ink-4)] hover:text-[color:var(--color-ink-0)]">
                      <Pencil className="h-3.5 w-3.5" />
                    </span>
                    <span role="button" onClick={(e) => { e.stopPropagation(); setDeleting(c); }} className="mt-0.5 rounded p-1 text-[color:var(--color-ink-4)] hover:text-[color:var(--color-danger-400)]">
                      <Trash2 className="h-3.5 w-3.5" />
                    </span>
                  </div>
                </>
              )}
            </div>
          ))}
          {filteredConversations.length === 0 && (
            <p className="px-3 py-6 text-center text-xs text-[color:var(--color-ink-3)]">
              {conversations.length === 0 ? "No conversations yet." : "No conversations match your search."}
            </p>
          )}
        </div>
      </aside>

      <div className="flex flex-1 flex-col card-elevated overflow-hidden">
        <div className="flex items-center justify-between border-b border-[color:var(--color-border)] px-5 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[color:var(--color-sentinel-500)]/12 text-[color:var(--color-sentinel-400)]">
              <Bot className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-medium text-[color:var(--color-ink-0)]">{active?.title ?? "PRAHARI AI Assistant"}</p>
              <p className="text-xs text-[color:var(--color-ink-3)]">Trained on your operational data</p>
            </div>
          </div>
          {active && (
            <Button size="sm" variant="secondary" icon={<FileDown />} onClick={exportConversation}>Export PDF</Button>
          )}
        </div>

        <div ref={scrollRef} className="flex-1 space-y-5 overflow-y-auto px-5 py-6">
          {!active || active.messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-6 text-center">
              <EmptyState
                icon={<Sparkles />}
                title="Ask PRAHARI AI anything"
                description="Draft mission briefs, analyze threat correlations, or check readiness — grounded in your live operational data."
              />
              <div className="grid w-full max-w-lg grid-cols-1 gap-2.5 sm:grid-cols-2">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s.label}
                    onClick={() => send(s.prompt)}
                    className="flex items-center gap-2.5 rounded-xl border border-[color:var(--color-border-strong)] px-3.5 py-3 text-left text-sm text-[color:var(--color-ink-1)] transition-colors hover:border-[color:var(--color-sentinel-500)]/40 hover:bg-white/[0.03]"
                  >
                    <s.icon className="h-4 w-4 shrink-0 text-[color:var(--color-sentinel-400)]" />
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <AnimatePresence initial={false}>
              {active.messages.map((m) => (
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn("flex items-start gap-3", m.role === "user" && "flex-row-reverse")}
                >
                  {m.role === "assistant" ? (
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[color:var(--color-sentinel-500)]/12 text-[color:var(--color-sentinel-400)]">
                      <Bot className="h-4 w-4" />
                    </div>
                  ) : (
                    <Avatar seed={user?.avatarSeed ?? "user"} name={user?.name ?? "You"} size="sm" />
                  )}
                  <div className={cn("max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed", m.role === "user" ? "bg-[color:var(--color-sentinel-500)] text-white" : "bg-[color:var(--color-surface-3)] text-[color:var(--color-ink-1)]")}>
                    {m.content}
                  </div>
                </motion.div>
              ))}
              {sending && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-start gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[color:var(--color-sentinel-500)]/12 text-[color:var(--color-sentinel-400)]">
                    <Bot className="h-4 w-4" />
                  </div>
                  <div className="flex items-center gap-1.5 rounded-2xl bg-[color:var(--color-surface-3)] px-4 py-3.5">
                    {[0, 1, 2].map((i) => (
                      <motion.span
                        key={i}
                        className="h-1.5 w-1.5 rounded-full bg-[color:var(--color-ink-3)]"
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{ duration: 1.1, repeat: Infinity, delay: i * 0.15 }}
                      />
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </div>

        <form
          onSubmit={(e) => { e.preventDefault(); send(); }}
          className="flex items-center gap-3 border-t border-[color:var(--color-border)] px-5 py-4"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about missions, threats, or personnel…"
            className="h-11 flex-1 rounded-[var(--radius-sm)] border border-[color:var(--color-border-strong)] bg-[color:var(--color-surface)] px-4 text-sm text-[color:var(--color-ink-0)] placeholder:text-[color:var(--color-ink-3)] focus:border-[color:var(--color-sentinel-500)] focus:outline-none focus:ring-2 focus:ring-[color:var(--color-sentinel-500)]/25"
          />
          <Button type="submit" size="icon" disabled={!input.trim() || sending} icon={<Send />} />
        </form>
      </div>

      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(v) => !v && setDeleting(null)}
        title="Delete this conversation?"
        description="This conversation and all its messages will be permanently removed."
        confirmLabel="Delete conversation"
        onConfirm={handleDelete}
      />
    </div>
  );
}
