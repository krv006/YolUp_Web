import { describe, expect, it } from "vitest";
import { resolveHomeRoute, resolvePhoneRoute } from "./resolve-home-route";

describe("account routes", () => {
  it("sends each role to the page where its phone number is edited", () => {
    expect(resolvePhoneRoute({ role: "student" })).toBe("/student/profile/personal");
    expect(resolvePhoneRoute({ role: "TEACHER" })).toBe("/teacher/profile/personal");
    expect(resolvePhoneRoute({ role: "parent" })).toBe("/parent/settings/edit");
  });

  it("falls back to the home page for roles without a phone form", () => {
    expect(resolvePhoneRoute({ role: "admin" })).toBe(resolveHomeRoute({ role: "admin" }));
    expect(resolvePhoneRoute(null)).toBe("/login");
  });
});
