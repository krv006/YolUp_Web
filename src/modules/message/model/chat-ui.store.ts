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
  searchIndex: number;
  searchCount: number;
  setSearchCount: (count: number) => void;
  stepSearch: (direction: 1 | -1) => void;
  pinned: Record<string, PinnedMessage>;
  pin: (roomId: string, message: PinnedMessage) => void;
  unpin: (roomId: string) => void;
  announcement: Record<string, boolean>;
  setAnnouncement: (roomId: string, value: boolean) => void;
  selected: string[];
  toggleSelected: (messageId: string) => void;
  startSelection: (messageId: string) => void;
  clearSelection: () => void;
}

export const useChatUiStore = create<ChatUiState>()(
  persist(
    (set) => ({
      search: "",
      setSearch: (search) => set({ search, searchIndex: 0 }),
      searchOpen: false,
      setSearchOpen: (searchOpen) =>
        set({ searchOpen, search: "", searchIndex: 0, searchCount: 0 }),
      searchIndex: 0,
      searchCount: 0,
      setSearchCount: (searchCount) =>
        set((state) => ({
          searchCount,
          searchIndex: searchCount ? Math.min(state.searchIndex, searchCount - 1) : 0,
        })),
      stepSearch: (direction) =>
        set((state) => {
          if (!state.searchCount) return { searchIndex: 0 };
          const next = (state.searchIndex + direction + state.searchCount) % state.searchCount;
          return { searchIndex: next };
        }),
      pinned: {},
      pin: (roomId, message) =>
        set((state) => ({ pinned: { ...state.pinned, [roomId]: message } })),
      announcement: {},
      setAnnouncement: (roomId, value) =>
        set((state) => ({ announcement: { ...state.announcement, [roomId]: value } })),
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
      partialize: (state) => ({ pinned: state.pinned, announcement: state.announcement }),
    }
  )
);

export function useAnnouncementMode(roomId: string | undefined) {
  return useChatUiStore((state) => (roomId ? Boolean(state.announcement[roomId]) : false));
}

export function usePinnedMessage(roomId: string | undefined) {
  return useChatUiStore((state) => (roomId ? state.pinned[roomId] : undefined));
}
