import { describe, expect, it } from "vitest";
import { mapUserDto } from "./auth.mappers";

const teacher = { id: "t1", username: "ustoz", role: "teacher" };

describe("test creation access", () => {
  it("stays open when the backend does not send the flag", () => {
    expect(mapUserDto(teacher).canCreateTests).toBe(true);
    expect(mapUserDto({ ...teacher, can_create_tests: null }).canCreateTests).toBe(true);
  });

  it("locks test creation only on an explicit false", () => {
    expect(mapUserDto({ ...teacher, can_create_tests: false }).canCreateTests).toBe(false);
    expect(mapUserDto({ ...teacher, can_create_tests: true }).canCreateTests).toBe(true);
  });
});
