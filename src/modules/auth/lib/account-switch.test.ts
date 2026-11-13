import { describe, expect, it } from "vitest";
import { ROLES } from "@/shared/constants";
import type { AuthUser, LinkedAccount } from "@/shared/types";
import { switchOptions } from "./account-switch";
import { mapUserDto } from "./auth.mappers";

const parent: LinkedAccount = { id: "p1", username: "ota", name: "Ota", role: ROLES.PARENT };

function user(patch: Partial<AuthUser>): AuthUser {
  return { role: ROLES.TEACHER, phone: "+998901112233", linkedAccounts: [], ...patch } as AuthUser;
}

describe("account switch options", () => {
  it("offers the roles the backend lists as not opened yet", () => {
    expect(switchOptions(user({ availableRoles: [ROLES.PARENT], roleSwitchBlocked: null }))).toEqual({
      blocked: null,
      roles: [ROLES.PARENT],
    });
  });

  it("works out the roles itself when the backend did not send them", () => {
    expect(switchOptions(user({ linkedAccounts: [parent] })).roles).toEqual([ROLES.STUDENT]);
  });

  it("offers no role to a student who signed up as a student", () => {
    expect(switchOptions(user({ role: ROLES.STUDENT, roleSwitchBlocked: "student_not_allowed", availableRoles: [] }))).toEqual({
      blocked: "student_not_allowed",
      roles: [],
    });
    expect(switchOptions(user({ role: ROLES.STUDENT, phone: null, roleSwitchBlocked: "phone_required" })).blocked).toBe(
      "student_not_allowed"
    );
  });

  it("lets a student opened from another role switch back", () => {
    expect(
      switchOptions(user({ role: ROLES.STUDENT, linkedAccounts: [parent], availableRoles: [ROLES.TEACHER], roleSwitchBlocked: null }))
    ).toEqual({ blocked: null, roles: [ROLES.TEACHER] });
  });

  it("asks for a phone first but still shows which roles could be opened", () => {
    expect(switchOptions(user({ phone: null, roleSwitchBlocked: "phone_required", availableRoles: [] }))).toEqual({
      blocked: "phone_required",
      roles: [ROLES.PARENT, ROLES.STUDENT],
    });
  });

  it("reads the switch fields from /auth/me", () => {
    const me = mapUserDto({
      id: "u1",
      username: "ali",
      role: "teacher",
      available_roles: ["parent", "student"],
      role_switch_blocked: null,
    });
    expect(me).toMatchObject({ availableRoles: [ROLES.PARENT, ROLES.STUDENT], roleSwitchBlocked: null });
    expect(mapUserDto({ id: "u2", username: "vali", role: "student", role_switch_blocked: "student_not_allowed" })).toMatchObject({
      availableRoles: null,
      roleSwitchBlocked: "student_not_allowed",
    });
  });
});
