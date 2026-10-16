import { create } from "zustand";

interface NewConversationState {
  open: boolean;
  setOpen: (open: boolean) => void;
}

export const useNewConversationStore = create<NewConversationState>()((set) => ({
  open: false,
  setOpen: (open) => set({ open }),
}));
