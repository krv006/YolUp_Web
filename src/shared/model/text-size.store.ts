import { create } from "zustand";
import { persist } from "zustand/middleware";
import { STORAGE_KEYS } from "@/shared/constants";

export type TextSize = "small" | "medium" | "large";

const SCALE: Record<TextSize, string> = {
  small: "0.92",
  medium: "1",
  large: "1.12",
};

export function applyTextSize(size: TextSize) {
  document.documentElement.style.setProperty("--text-scale", SCALE[size]);
}

interface TextSizeState {
  size: TextSize;
  setSize: (size: TextSize) => void;
}

export const useTextSizeStore = create<TextSizeState>()(
  persist(
    (set) => ({
      size: "medium",
      setSize: (size) => {
        applyTextSize(size);
        set({ size });
      },
    }),
    {
      name: STORAGE_KEYS.TEXT_SIZE,
      onRehydrateStorage: () => (state) => {
        if (state) applyTextSize(state.size);
      },
    }
  )
);
