import { create } from "zustand";

interface AssignmentCreateState {
  open: boolean;
  setOpen: (open: boolean) => void;
}

export const useAssignmentCreateStore = create<AssignmentCreateState>((set) => ({
  open: false,
  setOpen: (open) => set({ open }),
}));
