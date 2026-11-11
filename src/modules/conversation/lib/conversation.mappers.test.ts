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
    expect(room.lastSenderRole).toBeNull();
    expect(room.lastMessageType).toBe("voice");
    expect(room.updatedAt).toBe("2026-10-29T10:00:00Z");
  });

  it("keeps the last sender's role for the list tag", () => {
    const room = mapConversationDto(
      dto({ kind: "course", last_message: { text: "Vazifa", sender: "Aziz", sender_id: "t1", sender_role: "teacher" } })
    );
    expect(room.lastSenderRole).toBe("teacher");
  });

  it("shows the other person's photo in a direct chat", () => {
    const room = mapConversationDto(dto({ other_user: { id: "t1", username: "dilnoza", avatar: "https://cdn.example/t1.png" } }));
    expect(room.imageUrl).toBe("https://cdn.example/t1.png");
    expect(room.participantId).toBe("t1");
  });

  it("tells a club group apart without asking for the club list", () => {
    expect(mapConversationDto(dto({ kind: "course", course: "c1", course_kind: "club" })).courseKind).toBe("club");
    expect(mapConversationDto(dto({ kind: "course", course: "c1", course_kind: "group" })).courseKind).toBe("group");
    expect(mapConversationDto(dto({ kind: "channel", course_kind: null })).courseKind).toBeNull();
    expect(mapConversationDto(dto({ kind: "course" })).courseKind).toBeUndefined();
  });

  it("lists the groups a channel is linked to", () => {
    const room = mapConversationDto(
      dto({ kind: "channel", course_ids: ["c1", "c2"], courses: [{ id: "c1", title: "Algebra" }, { id: "c2", title: "IELTS" }] })
    );
    expect(room.linkedCourses).toEqual([
      { id: "c1", title: "Algebra" },
      { id: "c2", title: "IELTS" },
    ]);
    expect(mapConversationDto(dto({ kind: "channel", course_ids: [7] })).linkedCourses).toEqual([{ id: "7", title: "" }]);
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
