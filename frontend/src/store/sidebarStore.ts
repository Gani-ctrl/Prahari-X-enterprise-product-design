import { create } from "zustand";

interface SidebarState {
  collapsed: boolean;
  mobileOpen: boolean;
  commandPaletteOpen: boolean;
  toggleCollapsed: () => void;
  setMobileOpen: (open: boolean) => void;
  setCommandPaletteOpen: (open: boolean) => void;
}

export const useSidebarStore = create<SidebarState>((set, get) => ({
  collapsed: false,
  mobileOpen: false,
  commandPaletteOpen: false,
  toggleCollapsed: () => set({ collapsed: !get().collapsed }),
  setMobileOpen: (open) => set({ mobileOpen: open }),
  setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),
}));
