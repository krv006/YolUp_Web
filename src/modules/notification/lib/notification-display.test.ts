import { describe, expect, it } from "vitest";
import { notificationCategory, notificationIcon } from "./notification-display";

const item = (kind: string | null, link: string | null = null) =>
  ({ kind, link: link ? { type: link, id: "1" } : null }) as Parameters<typeof notificationCategory>[0];

describe("notificationCategory", () => {
  it("groups parent notifications into attendance, homework and security", () => {
    expect(notificationCategory(item("homework_reminder", "assignment"))).toBe("homework");
    expect(notificationCategory(item(null, "submission"))).toBe("homework");
    expect(notificationCategory(item("lesson_reminder"))).toBe("attendance");
    expect(notificationCategory(item("recording_ready", "recording"))).toBe("attendance");
    expect(notificationCategory(item("new_device_login"))).toBe("security");
    expect(notificationCategory(item("announcement"))).toBeNull();
  });
});

describe("notificationIcon", () => {
  it("marks parent security and attendance kinds without touching other roles' kinds", () => {
    const icon = (kind: string) => notificationIcon({ kind, link: null } as Parameters<typeof notificationIcon>[0]).icon;
    expect(icon("new_device_login")).toBe("shield");
    expect(icon("attendance_joined")).toBe("how-to-reg");
    expect(icon("member_joined")).not.toBe("how-to-reg");
  });
});
