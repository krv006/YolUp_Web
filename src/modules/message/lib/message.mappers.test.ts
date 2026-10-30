import { describe, expect, it } from "vitest";
import type { ChatMessage } from "@/shared/types";
import type { MessageDto } from "../api/message.dto";
import { mapMessageDto, parseSocketEvent, upsertMessage } from "./message.mappers";

const message = (patch: Partial<ChatMessage>) =>
  ({ id: "m1", text: "", createdAt: "2026-10-29T10:00:00Z", senderId: "u1", pending: false, ...patch }) as ChatMessage;

describe("upsertMessage", () => {
  it("replaces the optimistic message by client id instead of adding a second one", () => {
    const pending = message({ id: "temp-1", clientMessageId: "c1", pending: true, text: "Salom" });
    const saved = message({ id: "srv-1", clientMessageId: "c1", text: "Salom" });
    const list = upsertMessage([pending], saved);
    expect(list).toHaveLength(1);
    expect(list[0]).toMatchObject({ id: "srv-1", clientMessageId: "c1", pending: false });
  });

  it("keeps messages in time order", () => {
    const list = upsertMessage([message({ id: "b", createdAt: "2026-10-29T10:05:00Z" })], message({ id: "a" }));
    expect(list.map((item) => item.id)).toEqual(["a", "b"]);
  });
});

describe("mapMessageDto", () => {
  it("reads the sender photo", () => {
    const mapped = mapMessageDto({ id: 1, text: "Salom", sender: { id: "t1", username: "dilnoza", avatar: "https://cdn.example/t1.png" } } as unknown as MessageDto);
    expect(mapped.senderAvatarUrl).toBe("https://cdn.example/t1.png");
  });
});

describe("parseSocketEvent typing", () => {
  it("reads the typing kind and defaults to text", () => {
    expect(parseSocketEvent({ type: "typing", user_id: 2, name: "Aziza", kind: "voice" })).toEqual({ type: "typing", userId: "2", name: "Aziza", kind: "voice" });
    expect(parseSocketEvent({ type: "typing", user_id: 2, name: "Aziza" })).toMatchObject({ kind: "text" });
  });
});
