import { describe, expect, it } from "vitest";
import { notificationFeedState } from "./use-notification-feed";

describe("notificationFeedState", () => {
  it("keeps the bell while the count is loading or the server is down", () => {
    expect(notificationFeedState(true, undefined)).toEqual({ available: true, ready: false });
    expect(notificationFeedState(true, 3)).toEqual({ available: true, ready: true });
  });

  it("hides the bell only when the module is missing or the feed is disabled", () => {
    expect(notificationFeedState(true, null)).toEqual({ available: false, ready: false });
    expect(notificationFeedState(false, 3)).toEqual({ available: false, ready: false });
  });
});
