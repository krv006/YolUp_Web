import { QueryClient } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { applyChatActivity, applyChatTyping, setActiveConversation } from "./chat-realtime";
import { conversationKeys } from "./conversation.keys";
import { useTypingStore } from "./typing.store";

describe("chat realtime events", () => {
  let client: QueryClient;
  let invalidate: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    client = new QueryClient();
    invalidate = vi.spyOn(client, "invalidateQueries");
    setActiveConversation(null);
    useTypingStore.setState({ rooms: {} });
  });

  it("refreshes the conversation list on new activity and stops the typing hint", () => {
    applyChatTyping("r1", { userId: "u2", name: "Aziza", kind: "text" }, "me");
    applyChatActivity(client, "student", { roomId: "r1", senderId: "u2" }, "me");
    expect(invalidate).toHaveBeenCalledWith({ queryKey: conversationKeys.list("student"), exact: true });
    expect(useTypingStore.getState().rooms.r1).toBeUndefined();
  });

  it("leaves the open room to its own socket and read receipt", () => {
    setActiveConversation("r1");
    applyChatActivity(client, "teacher", { roomId: "r1", senderId: "u2" }, "me");
    expect(invalidate).not.toHaveBeenCalled();
  });

  it("still refreshes the open room when the message came from my other device", () => {
    setActiveConversation("r1");
    applyChatActivity(client, "teacher", { roomId: "r1", senderId: "me" }, "me");
    expect(invalidate).toHaveBeenCalledTimes(1);
  });

  it("ignores my own typing", () => {
    applyChatTyping("r1", { userId: "me", name: "Men", kind: "text" }, "me");
    expect(useTypingStore.getState().rooms.r1).toBeUndefined();
  });
});
