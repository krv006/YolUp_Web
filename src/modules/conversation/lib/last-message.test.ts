import { describe, expect, it } from "vitest";
import type { Conversation } from "@/shared/types";
import { isOwnLastMessage, lastMessageBody } from "./last-message";

const labels = { voice: "Ovozli xabar", image: "Rasm", video: "Video" };
const room = (patch: Partial<Conversation>) => ({ lastMessage: "Salom", lastSender: null, lastSenderId: null, ...patch }) as Conversation;
const me = { id: "u1", firstName: "Aziz", username: "aziz" };

describe("isOwnLastMessage", () => {
  it("trusts sender_id when the backend sends it", () => {
    expect(isOwnLastMessage(room({ lastSenderId: "u1", lastSender: "Boshqa" }), me)).toBe(true);
    expect(isOwnLastMessage(room({ lastSenderId: "u2", lastSender: "Aziz" }), me)).toBe(false);
  });

  it("falls back to the sender name without sender_id", () => {
    expect(isOwnLastMessage(room({ lastSender: "Aziz" }), me)).toBe(true);
    expect(isOwnLastMessage(room({ lastSender: "Dilnoza" }), me)).toBe(false);
    expect(isOwnLastMessage(room({}), me)).toBe(false);
    expect(isOwnLastMessage(room({ lastSender: "Aziz" }), null)).toBe(false);
  });
});

describe("lastMessageBody", () => {
  it("labels voice messages", () => {
    expect(lastMessageBody(room({ lastMessageType: "voice", lastMessage: "voice-1.webm" }), labels)).toBe("🎤 Ovozli xabar");
  });

  it("uses a caption for media but hides raw file names", () => {
    expect(lastMessageBody(room({ lastMessageType: "image", lastMessage: "Doskadan rasm" }), labels)).toBe("🖼 Doskadan rasm");
    expect(lastMessageBody(room({ lastMessageType: "image", lastMessage: "IMG_2041.jpg" }), labels)).toBe("🖼 Rasm");
    expect(lastMessageBody(room({ lastMessageType: "video", lastMessage: "clip.mp4" }), labels)).toBe("🎬 Video");
  });

  it("keeps files and plain text", () => {
    expect(lastMessageBody(room({ lastMessageType: "file", lastMessage: "bob3.pdf" }), labels)).toBe("📎 bob3.pdf");
    expect(lastMessageBody(room({ lastMessageType: "text", lastMessage: "Salom" }), labels)).toBe("Salom");
  });
});
