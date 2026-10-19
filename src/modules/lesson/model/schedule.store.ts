import { create } from "zustand";
import { addDays, addMonths, startOfDay } from "date-fns";

export type ScheduleView = "list" | "day" | "week" | "month";

interface ScheduleState {
  view: ScheduleView;
  anchor: number;
  createOpen: boolean;
  setView: (view: ScheduleView) => void;
  setAnchor: (date: Date) => void;
  step: (direction: 1 | -1) => void;
  goToday: () => void;
  setCreateOpen: (open: boolean) => void;
}

export const useScheduleStore = create<ScheduleState>((set) => ({
  view: "list",
  anchor: startOfDay(new Date()).getTime(),
  createOpen: false,
  setView: (view) => set({ view }),
  setAnchor: (date) => set({ anchor: startOfDay(date).getTime() }),
  step: (direction) =>
    set((state) => {
      const current = new Date(state.anchor);
      const next =
        state.view === "month"
          ? addMonths(current, direction)
          : addDays(current, state.view === "week" || state.view === "list" ? direction * 7 : direction);
      return { anchor: startOfDay(next).getTime() };
    }),
  goToday: () => set({ anchor: startOfDay(new Date()).getTime() }),
  setCreateOpen: (createOpen) => set({ createOpen }),
}));
