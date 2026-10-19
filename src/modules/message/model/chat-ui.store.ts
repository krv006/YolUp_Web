import { create } from "zustand";

interface ChatUiState {
  search: string;
  setSearch: (search: string) => void;
  searchOpen: boolean;
  setSearchOpen: (open: boolean) => void;
  searchIndex: number;
  searchCount: number;
  setSearchCount: (count: number) => void;
  stepSearch: (direction: 1 | -1) => void;
  selected: string[];
  toggleSelected: (messageId: string) => void;
  startSelection: (messageId: string) => void;
  clearSelection: () => void;
}

export const useChatUiStore = create<ChatUiState>()((set) => ({
  search: "",
  setSearch: (search) => set({ search, searchIndex: 0 }),
  searchOpen: false,
  setSearchOpen: (searchOpen) => set({ searchOpen, search: "", searchIndex: 0, searchCount: 0 }),
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
      return { searchIndex: (state.searchIndex + direction + state.searchCount) % state.searchCount };
    }),
  selected: [],
  toggleSelected: (messageId) =>
    set((state) => ({
      selected: state.selected.includes(messageId)
        ? state.selected.filter((id) => id !== messageId)
        : [...state.selected, messageId],
    })),
  startSelection: (messageId) => set({ selected: [messageId] }),
  clearSelection: () => set({ selected: [] }),
}));
