import * as DialogPrimitive from "@radix-ui/react-dialog";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Crosshair, Radar, Boxes, Users, Bot, Settings, Search, CornerDownLeft, Swords, GraduationCap, Building2, Truck, Stethoscope, MapPinned, Command,
  type LucideIcon,
} from "lucide-react";
import { useSidebarStore } from "@/store/sidebarStore";
import { missionsApi, personnelApi, assetsApi, threatsApi, inventoryApi } from "@/services/api";

interface CommandItem {
  id: string;
  label: string;
  group: string;
  // `LucideIcon`, not the generic React `ElementType` — `ElementType` also
  // covers every JSX intrinsic tag ("div", "svg", ...), so rendering a
  // dynamically-picked `ElementType` value as `<Icon />` forces TypeScript
  // to intersect the prop types of every union member, which collapses to
  // `never`. `LucideIcon` is lucide-react's own exact type for these
  // components, so it stays a single concrete, renderable shape.
  icon: LucideIcon;
  action: () => void;
  keywords?: string;
}

export function CommandPalette() {
  const open = useSidebarStore((s) => s.commandPaletteOpen);
  const setOpen = useSidebarStore((s) => s.setCommandPaletteOpen);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const [searchItems, setSearchItems] = useState<CommandItem[]>([]);
  const [loadedSearch, setLoadedSearch] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen(!open);
      }
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, setOpen]);

  useEffect(() => {
    if (!open) {
      setQuery("");
      setActiveIndex(0);
      return;
    }
    // Lazily hydrate a global search index the first time the palette is
    // opened, so ⌘K genuinely searches live missions/personnel/assets/
    // threats/inventory (DB-backed via services/api.ts) instead of only the
    // static navigation commands below.
    if (loadedSearch) return;
    setLoadedSearch(true);
    Promise.all([missionsApi.list(), personnelApi.list(), assetsApi.list(), threatsApi.list(), inventoryApi.list()])
      .then(([missions, personnel, assets, threats, inventory]) => {
        const results: CommandItem[] = [
          ...missions.map((m) => ({
            id: `mission-${m.id}`,
            label: `${m.name} (${m.code})`,
            group: "Missions",
            icon: Crosshair,
            action: () => navigate(`/app/operations/${m.id}`),
            keywords: `${m.region} ${m.status}`,
          })),
          ...personnel.map((p) => ({
            id: `personnel-${p.id}`,
            label: `${p.rank} ${p.name}`,
            group: "Personnel",
            icon: Users,
            action: () => navigate("/app/personnel"),
            keywords: `${p.unit} ${p.roleTitle}`,
          })),
          ...assets.map((a) => ({
            id: `asset-${a.id}`,
            label: a.name,
            group: "Assets",
            icon: Boxes,
            action: () => navigate("/app/assets"),
            keywords: `${a.category} ${a.model}`,
          })),
          ...threats.map((t) => ({
            id: `threat-${t.id}`,
            label: t.title,
            group: "Intelligence",
            icon: Radar,
            action: () => navigate("/app/intelligence"),
            keywords: `${t.region} ${t.category} ${t.severity}`,
          })),
          ...inventory.map((i) => ({
            id: `inventory-${i.id}`,
            label: i.name,
            group: "Weapons & Ammunition",
            icon: Swords,
            action: () => navigate("/app/weapons"),
            keywords: `${i.category} ${i.spec}`,
          })),
        ];
        setSearchItems(results);
      })
      .catch(() => setSearchItems([]));
  }, [open, loadedSearch, navigate]);

  const items: CommandItem[] = useMemo(
    () => [
      { id: "dashboard", label: "Go to Dashboard", group: "Navigate", icon: LayoutDashboard, action: () => navigate("/app/dashboard") },
      { id: "situation-room", label: "Go to Situation Room", group: "Navigate", icon: Command, action: () => navigate("/app/situation-room") },
      { id: "operations", label: "Go to Operations", group: "Navigate", icon: Crosshair, action: () => navigate("/app/operations") },
      { id: "intelligence", label: "Go to Intelligence Center", group: "Navigate", icon: Radar, action: () => navigate("/app/intelligence") },
      { id: "assets", label: "Go to Assets", group: "Navigate", icon: Boxes, action: () => navigate("/app/assets") },
      { id: "weapons", label: "Go to Weapons & Ammunition", group: "Navigate", icon: Swords, action: () => navigate("/app/weapons") },
      { id: "training", label: "Go to Training & Readiness", group: "Navigate", icon: GraduationCap, action: () => navigate("/app/training") },
      { id: "units", label: "Go to Unit Management", group: "Navigate", icon: Building2, action: () => navigate("/app/units") },
      { id: "fleet", label: "Go to Fleet & Logistics", group: "Navigate", icon: Truck, action: () => navigate("/app/fleet") },
      { id: "medical-comms", label: "Go to Medical & Comms", group: "Navigate", icon: Stethoscope, action: () => navigate("/app/medical-comms") },
      { id: "base-emergency", label: "Go to Base & Emergency", group: "Navigate", icon: MapPinned, action: () => navigate("/app/base-emergency") },
      { id: "personnel", label: "Go to Personnel", group: "Navigate", icon: Users, action: () => navigate("/app/personnel") },
      { id: "ai", label: "Go to AI Assistant", group: "Navigate", icon: Bot, action: () => navigate("/app/ai-assistant") },
      { id: "settings", label: "Go to Settings", group: "Navigate", icon: Settings, action: () => navigate("/app/settings") },
      { id: "new-mission", label: "Create new mission", group: "Actions", icon: Crosshair, action: () => navigate("/app/operations?new=1"), keywords: "operation add" },
      { id: "new-threat", label: "Log new threat report", group: "Actions", icon: Radar, action: () => navigate("/app/intelligence?new=1") },
      { id: "new-personnel", label: "Add personnel record", group: "Actions", icon: Users, action: () => navigate("/app/personnel?new=1") },
    ],
    [navigate]
  );

  const matches = (item: CommandItem) => `${item.label} ${item.keywords ?? ""}`.toLowerCase().includes(query.toLowerCase());

  // Static nav/action commands always apply; live search results only join
  // in once the user has actually typed something, so opening the palette
  // doesn't dump every mission/asset/threat in the org into the list at once.
  const filtered = query.trim()
    ? [...items.filter(matches), ...searchItems.filter(matches)].slice(0, 40)
    : items;

  function run(item: CommandItem) {
    item.action();
    setOpen(false);
  }

  return (
    <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
      <AnimatePresence>
        {open && (
          <DialogPrimitive.Portal forceMount>
            <DialogPrimitive.Overlay asChild forceMount>
              <motion.div
                className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              />
            </DialogPrimitive.Overlay>
            <DialogPrimitive.Content asChild forceMount>
              <motion.div
                className="fixed left-1/2 top-[16%] z-[60] w-[calc(100%-2rem)] max-w-xl -translate-x-1/2 overflow-hidden rounded-[var(--radius-card)] border border-[color:var(--color-border-strong)] bg-[color:var(--color-surface-2)] shadow-[var(--shadow-float)]"
                initial={{ opacity: 0, scale: 0.95, y: -8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.97, y: -6 }}
                transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
              >
                <DialogPrimitive.Title className="sr-only">Command palette</DialogPrimitive.Title>
                <div className="flex items-center gap-3 border-b border-[color:var(--color-border)] px-4 py-3.5">
                  <Search className="h-4 w-4 text-[color:var(--color-ink-3)]" />
                  <input
                    autoFocus
                    value={query}
                    onChange={(e) => {
                      setQuery(e.target.value);
                      setActiveIndex(0);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "ArrowDown") { e.preventDefault(); setActiveIndex((i) => Math.min(i + 1, filtered.length - 1)); }
                      if (e.key === "ArrowUp") { e.preventDefault(); setActiveIndex((i) => Math.max(i - 1, 0)); }
                      if (e.key === "Enter" && filtered[activeIndex]) run(filtered[activeIndex]);
                    }}
                    placeholder="Search commands, missions, personnel…"
                    className="w-full bg-transparent text-sm text-[color:var(--color-ink-0)] placeholder:text-[color:var(--color-ink-3)] focus:outline-none"
                  />
                  <kbd className="rounded border border-[color:var(--color-border-strong)] px-1.5 py-0.5 text-[10px] text-[color:var(--color-ink-3)]">ESC</kbd>
                </div>
                <div className="max-h-80 overflow-y-auto p-2">
                  {filtered.length === 0 && (
                    <p className="px-3 py-8 text-center text-sm text-[color:var(--color-ink-3)]">No matching commands.</p>
                  )}
                  {filtered.map((item, i) => {
                    const Icon = item.icon;
                    const active = i === activeIndex;
                    const showGroupHeader = i === 0 || filtered[i - 1].group !== item.group;
                    return (
                      <div key={item.id}>
                      {showGroupHeader && (
                        <p className="px-3 pb-1 pt-2.5 text-[10px] font-medium uppercase tracking-wider text-[color:var(--color-ink-4)] first:pt-1">{item.group}</p>
                      )}
                      <button
                        onClick={() => run(item)}
                        onMouseEnter={() => setActiveIndex(i)}
                        className={`flex w-full items-center justify-between gap-3 rounded-[var(--radius-sm)] px-3 py-2.5 text-left text-sm transition-colors ${
                          active ? "bg-[color:var(--color-sentinel-500)]/12 text-[color:var(--color-ink-0)]" : "text-[color:var(--color-ink-1)]"
                        }`}
                      >
                        <span className="flex items-center gap-3">
                          <Icon className="h-4 w-4 text-[color:var(--color-ink-3)]" />
                          {item.label}
                        </span>
                        {active && <CornerDownLeft className="h-3.5 w-3.5 text-[color:var(--color-ink-3)]" />}
                      </button>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            </DialogPrimitive.Content>
          </DialogPrimitive.Portal>
        )}
      </AnimatePresence>
    </DialogPrimitive.Root>
  );
}
