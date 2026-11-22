import { describe, expect, it } from "vitest";
import { chatImageUrl } from "./use-chat-image";

describe("chatImageUrl", () => {
  it("asks the server for the small preview of a protected image", () => {
    expect(chatImageUrl("https://api.test/api/v1/chat/files/m1/", true)).toBe("https://api.test/api/v1/chat/files/m1/?thumb=1");
    expect(chatImageUrl("https://api.test/api/v1/chat/attachments/a1/?thumb=1", true)).toBe("https://api.test/api/v1/chat/attachments/a1/?thumb=1");
    expect(chatImageUrl("https://api.test/api/v1/chat/files/m1/", false)).toBe("https://api.test/api/v1/chat/files/m1/");
  });

  it("keeps a local preview of an image that is still uploading", () => {
    expect(chatImageUrl("blob:http://localhost/abc", true)).toBe("blob:http://localhost/abc");
    expect(chatImageUrl(null, true)).toBeNull();
  });
});
