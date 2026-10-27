import { create } from "zustand";

interface VoiceUiState {
  createOpen: boolean;
  setCreateOpen: (open: boolean) => void;
}

export const useVoiceUiStore = create<VoiceUiState>((set) => ({
  createOpen: false,
  setCreateOpen: (createOpen) => set({ createOpen }),
}));
