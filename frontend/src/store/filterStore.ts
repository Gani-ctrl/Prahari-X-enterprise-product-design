import { create } from "zustand";
import type { MissionStatus, Priority } from "@/types";

interface OperationsFilters {
  search: string;
  status: MissionStatus | "all";
  priority: Priority | "all";
}

interface FilterState {
  operations: OperationsFilters;
  setOperationsFilter: <K extends keyof OperationsFilters>(key: K, value: OperationsFilters[K]) => void;
  resetOperationsFilters: () => void;
}

const defaultOperationsFilters: OperationsFilters = {
  search: "",
  status: "all",
  priority: "all",
};

export const useFilterStore = create<FilterState>((set, get) => ({
  operations: defaultOperationsFilters,
  setOperationsFilter: (key, value) =>
    set({ operations: { ...get().operations, [key]: value } }),
  resetOperationsFilters: () => set({ operations: defaultOperationsFilters }),
}));
