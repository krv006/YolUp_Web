import { describe, expect, it } from "vitest";
import { directChatAction } from "./use-start-direct-chat";

describe("directChatAction", () => {
  it("opens an existing room, even a pending or reported one", () => {
    expect(directChatAction({ id: "u1", roomId: "r1", canMessage: "request" })).toBe("open");
    expect(directChatAction({ id: "u1", roomId: "r1", canMessage: "none" })).toBe("open");
  });

  it("lets a teacher write without a request and others ask first", () => {
    expect(directChatAction({ id: "s1", roomId: null, canMessage: "write" })).toBe("write");
    expect(directChatAction({ id: "t1", roomId: null, canMessage: "request" })).toBe("request");
  });

  it("does nothing for people the user may only see", () => {
    expect(directChatAction({ id: "s2", roomId: null, canMessage: "none" })).toBe("none");
    expect(directChatAction({ id: "s2", roomId: null, canMessage: null })).toBe("none");
  });
});
