import { describe, expect, it } from "vitest";
import type { ChatRoomDto } from "../api/conversation.dto";
import { isDirectLocked } from "../constants/direct-status";
import { mapConversationDto } from "./conversation.mappers";

const dto = (patch: Partial<ChatRoomDto>) => ({ id: "r1", kind: "direct", title: "Dilnoza", ...patch }) as ChatRoomDto;

describe("mapConversationDto", () => {
  it("reads the last sender id and message type", () => {
    const room = mapConversationDto(
      dto({ last_message: { text: "Salom", sender: "Aziza", sender_id: "u7", message_type: "voice", created_at: "2026-10-29T10:00:00Z" } } as Partial<ChatRoomDto>)
    );
    expect(room.lastSenderId).toBe("u7");
    expect(room.lastMessageType).toBe("voice");
    expect(room.updatedAt).toBe("2026-10-29T10:00:00Z");
  });

  it("shows the other person's photo in a direct chat", () => {
    const room = mapConversationDto(dto({ other_user: { id: "t1", username: "dilnoza", avatar: "https://cdn.example/t1.png" } }));
    expect(room.imageUrl).toBe("https://cdn.example/t1.png");
    expect(room.participantId).toBe("t1");
  });

  it("does not fail on a room without optional fields", () => {
    const room = mapConversationDto(dto({}));
    expect(room.unreadCount).toBe(0);
    expect(room.lastSenderId).toBeNull();
    expect(room.directStatus).toBeNull();
    expect(room.imageUrl).toBeNull();
  });
});

describe("isDirectLocked", () => {
  it("locks pending and blocked direct chats only", () => {
    expect(isDirectLocked(mapConversationDto(dto({ direct_status: "pending" })))).toBe(true);
    expect(isDirectLocked(mapConversationDto(dto({ direct_status: "blocked" })))).toBe(true);
    expect(isDirectLocked(mapConversationDto(dto({ direct_status: "active" })))).toBe(false);
    expect(isDirectLocked(mapConversationDto(dto({ kind: "course", direct_status: null })))).toBe(false);
  });
});
