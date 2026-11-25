import { describe, expect, it } from "vitest";
import type { AssignmentDto } from "../api/homework.dto";
import { mapAssignmentDto, mapAssignmentRequest } from "./homework.mappers";

describe("assignment voice note", () => {
  it("sends a recorded voice note with its duration and asks to remove it on null", () => {
    const file = new Blob(["x"], { type: "audio/webm" });
    const created = mapAssignmentRequest({ courseId: "c1", title: "Vazifa", voice: { file, durationMs: 42_000.4 } });
    expect((created.get("voice") as File).name).toBe("voice.webm");
    expect(created.get("voice_duration_ms")).toBe("42000");
    expect(created.has("remove_voice")).toBe(false);
    const removed = mapAssignmentRequest({ courseId: "c1", title: "Vazifa", voice: null });
    expect(removed.get("remove_voice")).toBe("true");
    expect(removed.has("voice")).toBe(false);
    expect(mapAssignmentRequest({ courseId: "c1", title: "Vazifa" }).has("remove_voice")).toBe(false);
  });

  it("reads the voice note from the assignment", () => {
    const voice = { url: "/api/v1/homework/assignments/a1/voice/", duration_ms: 42000, mime: "audio/webm" };
    expect(mapAssignmentDto({ id: "a1", title: "Vazifa", voice } as AssignmentDto).voice).toEqual({
      url: "/api/v1/homework/assignments/a1/voice/",
      durationMs: 42000,
      mime: "audio/webm",
    });
    expect(mapAssignmentDto({ id: "a1", title: "Vazifa", voice: null } as AssignmentDto).voice).toBeNull();
  });
});
