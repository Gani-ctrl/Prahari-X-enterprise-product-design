import { useState } from "react";
import { motion } from "motion/react";
import { Hash, ShieldAlert, Send, Radio } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/authStore";

interface ChannelMessage {
  id: string;
  author: string;
  content: string;
  time: string;
  self?: boolean;
}

const CHANNELS = [
  { id: "unit", label: "Unit Channel", icon: Hash, seed: [
    { id: "1", author: "Sgt. Maj. Rao", content: "Morning formation moved to 0600 tomorrow.", time: "07:12" },
    { id: "2", author: "Capt. Iyer", content: "Copy. Passing to the squad.", time: "07:14" },
  ]},
  { id: "command", label: "Command Channel", icon: Radio, seed: [
    { id: "1", author: "Commander Vashisht", content: "Briefing at 1800 for all active mission leads.", time: "14:02" },
  ]},
  { id: "emergency", label: "Emergency Channel", icon: ShieldAlert, seed: [] as ChannelMessage[] },
];

export default function SoldierCommsPage() {
  const user = useAuthStore((s) => s.user);
  const [activeChannel, setActiveChannel] = useState(CHANNELS[0].id);
  const [messagesByChannel, setMessagesByChannel] = useState<Record<string, ChannelMessage[]>>(
    Object.fromEntries(CHANNELS.map((c) => [c.id, c.seed]))
  );
  const [draft, setDraft] = useState("");

  const channel = CHANNELS.find((c) => c.id === activeChannel)!;
  const messages = messagesByChannel[activeChannel] ?? [];

  function send() {
    if (!draft.trim()) return;
    const msg: ChannelMessage = {
      id: `m-${Date.now()}`,
      author: user?.name ?? "You",
      content: draft.trim(),
      time: new Intl.DateTimeFormat("en-US", { hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date()),
      self: true,
    };
    setMessagesByChannel((prev) => ({ ...prev, [activeChannel]: [...(prev[activeChannel] ?? []), msg] }));
    setDraft("");
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-5">
      <aside className="hidden w-64 shrink-0 flex-col card-elevated md:flex">
        <div className="border-b border-[color:var(--color-border)] px-4 py-4">
          <p className="text-sm font-semibold text-[color:var(--color-ink-0)]">Comms</p>
          <p className="text-xs text-[color:var(--color-ink-3)]">Unit &amp; command channels</p>
        </div>
        <div className="space-y-1 p-2">
          {CHANNELS.map((c) => (
            <button
              key={c.id}
              onClick={() => setActiveChannel(c.id)}
              className={cn(
                "flex w-full items-center gap-2.5 rounded-[var(--radius-sm)] px-3 py-2.5 text-left text-sm transition-colors",
                c.id === activeChannel ? "bg-[color:var(--color-amber-500)]/12 text-[color:var(--color-ink-0)]" : "text-[color:var(--color-ink-2)] hover:bg-white/[0.04]"
              )}
            >
              <c.icon className="h-4 w-4" /> {c.label}
            </button>
          ))}
        </div>
      </aside>

      <div className="flex flex-1 flex-col card-elevated overflow-hidden">
        <div className="flex items-center gap-2.5 border-b border-[color:var(--color-border)] px-5 py-4">
          <channel.icon className="h-4 w-4 text-[color:var(--color-amber-400)]" />
          <p className="text-sm font-medium text-[color:var(--color-ink-0)]">{channel.label}</p>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-6">
          {messages.length === 0 && (
            <p className="py-10 text-center text-sm text-[color:var(--color-ink-3)]">No messages in this channel yet.</p>
          )}
          {messages.map((m) => (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn("flex items-start gap-3", m.self && "flex-row-reverse")}
            >
              <Avatar seed={m.author} name={m.author} size="sm" />
              <div className={cn("max-w-[70%] rounded-2xl px-4 py-2.5 text-sm", m.self ? "bg-[color:var(--color-amber-500)] text-[#1a1002]" : "bg-[color:var(--color-surface-3)] text-[color:var(--color-ink-1)]")}>
                {!m.self && <p className="mb-0.5 text-xs font-medium text-[color:var(--color-ink-3)]">{m.author}</p>}
                {m.content}
                <span className={cn("ml-2 text-[10px] opacity-60")}>{m.time}</span>
              </div>
            </motion.div>
          ))}
        </div>

        <form onSubmit={(e) => { e.preventDefault(); send(); }} className="flex items-center gap-3 border-t border-[color:var(--color-border)] px-5 py-4">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={`Message ${channel.label}…`}
            className="h-11 flex-1 rounded-[var(--radius-sm)] border border-[color:var(--color-border-strong)] bg-[color:var(--color-surface)] px-4 text-sm text-[color:var(--color-ink-0)] placeholder:text-[color:var(--color-ink-3)] focus:border-[color:var(--color-amber-500)] focus:outline-none focus:ring-2 focus:ring-[color:var(--color-amber-500)]/25"
          />
          <button
            type="submit"
            disabled={!draft.trim()}
            className="flex h-11 w-11 items-center justify-center rounded-[var(--radius-sm)] bg-[color:var(--color-amber-500)] text-[#1a1002] transition-colors hover:bg-[color:var(--color-amber-400)] disabled:opacity-40"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
