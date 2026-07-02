import { create } from "zustand";

interface NotificationPrefs {
  missionUpdates: boolean;
  threatAlerts: boolean;
  personnelChanges: boolean;
  systemDigest: boolean;
}

interface UserPrefsState {
  density: "comfortable" | "compact";
  accent: "sentinel" | "amber";
  notificationPrefs: NotificationPrefs;
  setDensity: (d: UserPrefsState["density"]) => void;
  setAccent: (a: UserPrefsState["accent"]) => void;
  toggleNotificationPref: (key: keyof NotificationPrefs) => void;
}

const STORAGE_KEY = "prahari-x:user-prefs";

function load(): Pick<UserPrefsState, "density" | "accent" | "notificationPrefs"> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    /* ignore */
  }
  return {
    density: "comfortable",
    accent: "sentinel",
    notificationPrefs: {
      missionUpdates: true,
      threatAlerts: true,
      personnelChanges: false,
      systemDigest: true,
    },
  };
}

function persist(state: Pick<UserPrefsState, "density" | "accent" | "notificationPrefs">) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

const initial = load();

export const useUserStore = create<UserPrefsState>((set, get) => ({
  ...initial,
  setDensity(d) {
    set({ density: d });
    persist({ density: d, accent: get().accent, notificationPrefs: get().notificationPrefs });
  },
  setAccent(a) {
    set({ accent: a });
    persist({ density: get().density, accent: a, notificationPrefs: get().notificationPrefs });
  },
  toggleNotificationPref(key) {
    const next = { ...get().notificationPrefs, [key]: !get().notificationPrefs[key] };
    set({ notificationPrefs: next });
    persist({ density: get().density, accent: get().accent, notificationPrefs: next });
  },
}));
