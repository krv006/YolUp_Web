import { create } from "zustand";
import { persist } from "zustand/middleware";
import { STORAGE_KEYS } from "@/shared/constants";

interface ConversationPrefsState {
  pinned: string[];
  muted: string[];
  togglePinned: (roomId: string) => void;
  toggleMuted: (roomId: string) => void;
}

function toggle(list: string[], value: string): string[] {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
}

export const useConversationPrefsStore = create<ConversationPrefsState>()(
  persist(
    (set) => ({
      pinned: [],
      muted: [],
      togglePinned: (roomId) => set((state) => ({ pinned: toggle(state.pinned, roomId) })),
      toggleMuted: (roomId) => set((state) => ({ muted: toggle(state.muted, roomId) })),
    }),
    { name: STORAGE_KEYS.CONVERSATION_PREFS }
  )
);
