import { create } from "zustand";

export interface RoomTyping {
  name: string;
  kind: "text" | "voice";
}

export const useTypingStore = create<{ rooms: Record<string, RoomTyping> }>(() => ({ rooms: {} }));

const timers = new Map<string, ReturnType<typeof setTimeout>>();

export function clearRoomTyping(roomId: string) {
  const timer = timers.get(roomId);
  if (timer) clearTimeout(timer);
  timers.delete(roomId);
  useTypingStore.setState((state) => {
    if (!(roomId in state.rooms)) return state;
    const rooms = { ...state.rooms };
    delete rooms[roomId];
    return { rooms };
  });
}

export function markRoomTyping(roomId: string, value: RoomTyping, ttlMs: number) {
  const timer = timers.get(roomId);
  if (timer) clearTimeout(timer);
  useTypingStore.setState((state) => ({ rooms: { ...state.rooms, [roomId]: value } }));
  timers.set(
    roomId,
    setTimeout(() => clearRoomTyping(roomId), ttlMs)
  );
}

export function useRoomTyping(roomId: string | undefined): RoomTyping | null {
  return useTypingStore((state) => (roomId ? (state.rooms[roomId] ?? null) : null));
}
