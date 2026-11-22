import { create } from "zustand";

export type PageCreateKey = "quiz";

interface PageCreateState {
  open: Record<PageCreateKey, boolean>;
  setOpen: (key: PageCreateKey, value: boolean) => void;
}

export const usePageCreateStore = create<PageCreateState>((set) => ({
  open: { quiz: false },
  setOpen: (key, value) => set((state) => ({ open: { ...state.open, [key]: value } })),
}));
