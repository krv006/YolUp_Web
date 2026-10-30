import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { clearRoomTyping, markRoomTyping, useTypingStore } from "./typing.store";

describe("room typing store", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    useTypingStore.setState({ rooms: {} });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("clears the typing state after the timeout", () => {
    markRoomTyping("r1", { name: "Aziza", kind: "voice" }, 5000);
    expect(useTypingStore.getState().rooms.r1).toEqual({ name: "Aziza", kind: "voice" });
    vi.advanceTimersByTime(4999);
    expect(useTypingStore.getState().rooms.r1).toBeDefined();
    vi.advanceTimersByTime(1);
    expect(useTypingStore.getState().rooms.r1).toBeUndefined();
  });

  it("restarts the timeout when a new typing event arrives", () => {
    markRoomTyping("r1", { name: "Aziza", kind: "text" }, 5000);
    vi.advanceTimersByTime(4000);
    markRoomTyping("r1", { name: "Aziza", kind: "text" }, 5000);
    vi.advanceTimersByTime(4000);
    expect(useTypingStore.getState().rooms.r1).toBeDefined();
    vi.advanceTimersByTime(1000);
    expect(useTypingStore.getState().rooms.r1).toBeUndefined();
  });

  it("clears only the given room", () => {
    markRoomTyping("r1", { name: "A", kind: "text" }, 5000);
    markRoomTyping("r2", { name: "B", kind: "text" }, 5000);
    clearRoomTyping("r1");
    expect(Object.keys(useTypingStore.getState().rooms)).toEqual(["r2"]);
  });
});
