import { describe, expect, it } from "vitest";
import { parseRealtimeEvent } from "./notification-socket-manager";

describe("parseRealtimeEvent", () => {
  it("reads chat_activity", () => {
    const event = parseRealtimeEvent(
      JSON.stringify({ type: "chat_activity", room: "r1", message_id: "m1", sender_id: "u2", created_at: "2026-10-29T14:15:37+05:00" })
    );
    expect(event).toEqual({
      type: "chatActivity",
      roomId: "r1",
      messageId: "m1",
      senderId: "u2",
      createdAt: "2026-10-29T14:15:37+05:00",
    });
  });

  it("keeps a missing sender of a system message as null", () => {
    const event = parseRealtimeEvent({ type: "chat_activity", room: "r1", message_id: "m1", sender_id: null });
    expect(event).toMatchObject({ type: "chatActivity", senderId: null });
  });

  it("reads chat_typing and falls back to text for an unknown kind", () => {
    expect(parseRealtimeEvent({ type: "chat_typing", room: "r1", user_id: 7, name: "Aziza", kind: "voice" })).toEqual({
      type: "chatTyping",
      roomId: "r1",
      userId: "7",
      name: "Aziza",
      kind: "voice",
    });
    expect(parseRealtimeEvent({ type: "chat_typing", room: "r1", user_id: 7, name: "Aziza", kind: "video" })).toMatchObject({
      kind: "text",
    });
  });

  it("still reads notifications", () => {
    const event = parseRealtimeEvent({ type: "notification", notification: { id: 3, description: "<p>Salom</p>" } });
    expect(event).toMatchObject({ type: "notification", notification: { id: "3", html: "<p>Salom</p>" } });
  });

  it("ignores unknown and malformed events", () => {
    expect(parseRealtimeEvent({ type: "lesson_live", lesson: {} })).toBeNull();
    expect(parseRealtimeEvent({ type: "chat_activity" })).toBeNull();
    expect(parseRealtimeEvent("null")).toBeNull();
    expect(parseRealtimeEvent(42)).toBeNull();
  });
});
