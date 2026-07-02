import { create } from "zustand";

type Theme = "dark" | "light";

interface ThemeState {
  theme: Theme;
  setTheme: (t: Theme) => void;
  toggle: () => void;
}

const STORAGE_KEY = "prahari-x:theme";

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  root.classList.toggle("dark", theme === "dark");
  root.classList.toggle("light", theme === "light");
}

const stored = (localStorage.getItem(STORAGE_KEY) as Theme | null) ?? "dark";
applyTheme(stored);

export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: stored,
  setTheme(t) {
    localStorage.setItem(STORAGE_KEY, t);
    applyTheme(t);
    set({ theme: t });
  },
  toggle() {
    const next = get().theme === "dark" ? "light" : "dark";
    get().setTheme(next);
  },
}));
