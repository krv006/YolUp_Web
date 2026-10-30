import { describe, expect, it } from "vitest";
import { tokenAllowsTrack } from "./live-token";

const encode = (value: unknown) => btoa(JSON.stringify(value)).replace(/=+$/, "").replace(/\+/g, "-").replace(/\//g, "_");
const token = (video: unknown) => `${encode({ alg: "HS256" })}.${encode({ video })}.sig`;

describe("tokenAllowsTrack", () => {
  it("reads the publish grant from the LiveKit token", () => {
    expect(tokenAllowsTrack(token({ canPublish: false }), "microphone")).toBe(false);
    expect(tokenAllowsTrack(token({ canPublish: true, canPublishSources: ["camera"] }), "microphone")).toBe(false);
    expect(tokenAllowsTrack(token({ canPublish: true, canPublishSources: ["microphone"] }), "microphone")).toBe(true);
  });

  it("does not crash when the server sent no token", () => {
    expect(tokenAllowsTrack(undefined, "microphone")).toBe(true);
    expect(tokenAllowsTrack("not-a-jwt", "microphone")).toBe(true);
  });
});
