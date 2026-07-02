import { useState } from "react";
import { Search } from "lucide-react";
import { Drawer } from "@/components/ui/Drawer";
import { Input } from "@/components/ui/Input";
import { Checkbox } from "@/components/ui/Checkbox";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";

interface Option {
  id: string;
  title: string;
  subtitle: string;
}

interface AssignDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  options: Option[];
  initiallySelected: string[];
  onConfirm: (ids: string[]) => void;
}

export function AssignDrawer({ open, onOpenChange, title, options, initiallySelected, onConfirm }: AssignDrawerProps) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<string[]>(initiallySelected);

  const filtered = options.filter((o) => `${o.title} ${o.subtitle}`.toLowerCase().includes(query.toLowerCase()));

  function toggle(id: string) {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  return (
    <Drawer
      open={open}
      onOpenChange={(v) => {
        if (v) setSelected(initiallySelected);
        onOpenChange(v);
      }}
      title={title}
      footer={
        <>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            onClick={() => {
              onConfirm(selected);
              onOpenChange(false);
            }}
          >
            Save assignment ({selected.length})
          </Button>
        </>
      }
    >
      <Input icon={<Search />} placeholder="Search…" value={query} onChange={(e) => setQuery(e.target.value)} />
      <div className="mt-4 space-y-1">
        {filtered.map((o) => (
          <label
            key={o.id}
            className="flex cursor-pointer items-center gap-3 rounded-[var(--radius-sm)] px-2 py-2.5 transition-colors hover:bg-white/[0.04]"
          >
            <Checkbox checked={selected.includes(o.id)} onCheckedChange={() => toggle(o.id)} />
            <Avatar seed={o.id} name={o.title} size="sm" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm text-[color:var(--color-ink-0)]">{o.title}</p>
              <p className="truncate text-xs text-[color:var(--color-ink-3)]">{o.subtitle}</p>
            </div>
          </label>
        ))}
        {filtered.length === 0 && <p className="py-8 text-center text-sm text-[color:var(--color-ink-3)]">No results found.</p>}
      </div>
    </Drawer>
  );
}
