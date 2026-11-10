import { describe, expect, it } from "vitest";
import { parseBoardEvent } from "@/modules/board";
import { identityUserId } from "./live-permissions";
import { mapMediaModeDto, mapRoomTokenDto } from "./live.mappers";

describe("mapRoomTokenDto", () => {
  it("reads the open microphone and camera modes", () => {
    const token = mapRoomTokenDto({ token: "t", url: "wss://lk", room: "r", is_teacher: false, open_mic: true, open_camera: false });
    expect(token.mediaMode).toEqual({ openMic: true, openCamera: false });
  });

  it("leaves the mode unknown when an older server does not send it", () => {
    expect(mapRoomTokenDto({ token: "t", url: "wss://lk", room: "r", is_teacher: true }).mediaMode).toBeNull();
  });
});

describe("mapMediaModeDto", () => {
  it("treats a missing flag as closed", () => {
    expect(mapMediaModeDto({ open_mic: true })).toEqual({ openMic: true, openCamera: false });
    expect(mapMediaModeDto(null)).toEqual({ openMic: false, openCamera: false });
  });
});

describe("identityUserId", () => {
  it("strips the LiveKit identity prefix so board events match the local user", () => {
    expect(identityUserId("user-7f3a")).toBe("7f3a");
    expect(identityUserId("7f3a")).toBe("7f3a");
  });
});

describe("board media events", () => {
  it("parses permission revokes and the open mode", () => {
    expect(parseBoardEvent({ type: "mic_revoked", student_id: 5 })).toEqual({ type: "mic_revoked", studentId: "5" });
    expect(parseBoardEvent({ type: "camera_revoked", student_id: "s1" })).toEqual({ type: "camera_revoked", studentId: "s1" });
    expect(parseBoardEvent({ type: "mic_revoked" })).toBeNull();
    expect(parseBoardEvent({ type: "media_mode", open_mic: true })).toEqual({
      type: "media_mode",
      openMic: true,
      openCamera: false,
    });
  });
});
