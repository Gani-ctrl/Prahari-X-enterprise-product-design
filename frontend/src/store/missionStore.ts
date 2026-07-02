import { create } from "zustand";

interface CurrentMissionState {
  selectedMissionId: string | null;
  setSelectedMission: (id: string | null) => void;
}

export const useCurrentMissionStore = create<CurrentMissionState>((set) => ({
  selectedMissionId: null,
  setSelectedMission: (id) => set({ selectedMissionId: id }),
}));
