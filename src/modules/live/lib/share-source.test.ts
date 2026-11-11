import { describe, expect, it } from "vitest";
import { describeShareTrack } from "./share-source";

const track = (label: string, displaySurface?: string) =>
  ({ label, getSettings: () => (displaySurface ? { displaySurface } : {}) }) as unknown as MediaStreamTrack;

describe("describeShareTrack", () => {
  it("names the shared surface and hides the browser's internal ids", () => {
    expect(describeShareTrack(track("screen:69734807:0", "monitor"))).toEqual({ surface: "monitor", name: null });
    expect(describeShareTrack(track("web-contents-media-stream://1093:3", "browser"))).toEqual({ surface: "browser", name: null });
  });

  it("keeps a readable window title", () => {
    expect(describeShareTrack(track("Visual Studio Code", "window"))).toEqual({ surface: "window", name: "Visual Studio Code" });
  });

  it("guesses the surface from the label when the browser does not report it", () => {
    expect(describeShareTrack(track("window:1234:0")).surface).toBe("window");
    expect(describeShareTrack(null)).toEqual({ surface: null, name: null });
  });
});
