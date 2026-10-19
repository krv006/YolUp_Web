import { create } from "zustand";
import { persist } from "zustand/middleware";
import { STORAGE_KEYS } from "@/shared/constants";

export interface PinnedMessage {
  id: string;
  author: string;
  text: string;
}

interface ChatUiState {
  search: string;
  setSearch: (search: string) => void;
  searchOpen: boolean;
  setSearchOpen: (open: boolean) => void;
  pinned: Record<string, PinnedMessage>;
  pin: (roomId: string, message: PinnedMessage) => void;
  unpin: (roomId: string) => void;
  selected: string[];
  toggleSelected: (messageId: string) => void;
  startSelection: (messageId: string) => void;
  clearSelection: () => void;
}

export const useChatUiStore = create<ChatUiState>()(
  persist(
    (set) => ({
      search: "",
      setSearch: (search) => set({ search }),
      searchOpen: false,
      setSearchOpen: (searchOpen) => set({ searchOpen, search: searchOpen ? "" : "" }),
      pinned: {},
      pin: (roomId, message) =>
        set((state) => ({ pinned: { ...state.pinned, [roomId]: message } })),
      selected: [],
      toggleSelected: (messageId) =>
        set((state) => ({
          selected: state.selected.includes(messageId)
            ? state.selected.filter((id) => id !== messageId)
            : [...state.selected, messageId],
        })),
      startSelection: (messageId) => set({ selected: [messageId] }),
      clearSelection: () => set({ selected: [] }),
      unpin: (roomId) =>
        set((state) => {
          const pinned = { ...state.pinned };
          delete pinned[roomId];
          return { pinned };
        }),
    }),
    {
      name: STORAGE_KEYS.CHAT_PINNED_MESSAGES,
      partialize: (state) => ({ pinned: state.pinned }),
    }
  )
);

export function usePinnedMessage(roomId: string | undefined) {
  return useChatUiStore((state) => (roomId ? state.pinned[roomId] : undefined));
}
