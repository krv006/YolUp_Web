import { describe, expect, it } from "vitest";
import { hasEmptyTarget, targetOf, targetsOf } from "./group-targets";

describe("group targets", () => {
  it("gives the whole group while nobody is unticked", () => {
    expect(targetOf("c1", { excluded: new Set(), studentIds: ["s1", "s2"] })).toEqual({ courseId: "c1", studentIds: null });
    expect(targetOf("c1", { excluded: new Set(), studentIds: [] })).toEqual({ courseId: "c1", studentIds: null });
  });

  it("lists only the ticked students once someone is unticked", () => {
    expect(targetOf("c1", { excluded: new Set(["s2"]), studentIds: ["s1", "s2", "s3"] })).toEqual({
      courseId: "c1",
      studentIds: ["s1", "s3"],
    });
  });

  it("builds one target per picked group", () => {
    const picks = new Map([
      ["c1", { excluded: new Set<string>(), studentIds: ["s1"] }],
      ["c2", { excluded: new Set(["s9"]), studentIds: ["s8", "s9"] }],
    ]);
    expect(targetsOf(picks)).toEqual([
      { courseId: "c1", studentIds: null },
      { courseId: "c2", studentIds: ["s8"] },
    ]);
  });

  it("blocks giving when no group is picked or a group has nobody ticked", () => {
    expect(hasEmptyTarget([])).toBe(true);
    expect(hasEmptyTarget([{ courseId: "c1", studentIds: null }])).toBe(false);
    expect(hasEmptyTarget([{ courseId: "c1", studentIds: null }, { courseId: "c2", studentIds: [] }])).toBe(true);
  });
});
