import { describe, expect, it } from "vitest";
import { mapRecordingChoice } from "./recording-choice";

describe("recording choice", () => {
  it("reads a saved choice", () => {
    expect(mapRecordingChoice({ post_recording: false, decided: true })).toEqual({ postRecording: false, decided: true });
    expect(mapRecordingChoice({ post_recording: true })).toEqual({ postRecording: true, decided: true });
  });

  it("treats a missing choice as not decided yet", () => {
    expect(mapRecordingChoice({ post_recording: null, decided: false })).toEqual({ postRecording: null, decided: false });
    expect(mapRecordingChoice(null)).toEqual({ postRecording: null, decided: false });
  });
});
