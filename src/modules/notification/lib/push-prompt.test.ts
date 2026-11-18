import { describe, expect, it } from "vitest";
import { PUSH_PROMPT_SNOOZE_MS, pushPromptSnoozed, shouldOfferPush } from "./push-prompt";

describe("push prompt", () => {
  it("offers only when the browser can and the user has not decided yet", () => {
    expect(shouldOfferPush({ supported: true, permission: "default", snoozed: false })).toBe(true);
    expect(shouldOfferPush({ supported: true, permission: "granted", snoozed: false })).toBe(false);
    expect(shouldOfferPush({ supported: true, permission: "denied", snoozed: false })).toBe(false);
    expect(shouldOfferPush({ supported: false, permission: "default", snoozed: false })).toBe(false);
    expect(shouldOfferPush({ supported: true, permission: "default", snoozed: true })).toBe(false);
  });

  it("stays quiet for a week after «later»", () => {
    const now = 1_800_000_000_000;
    expect(pushPromptSnoozed(String(now - 1000), now)).toBe(true);
    expect(pushPromptSnoozed(String(now - PUSH_PROMPT_SNOOZE_MS - 1), now)).toBe(false);
    expect(pushPromptSnoozed(null, now)).toBe(false);
    expect(pushPromptSnoozed("abc", now)).toBe(false);
  });
});
