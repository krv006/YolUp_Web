import { afterEach, describe, expect, it, vi } from "vitest";
import { apiClient } from "@/shared/api";
import { conversationApi } from "./conversation.api";
import { mapSpamReportDto, spamReportApi } from "./spam-report.api";

afterEach(() => vi.restoreAllMocks());

const row = {
  id: "rep1",
  room_id: "r1",
  reporter: { id: "u1", name: "Aziza", username: "aziza", role: "teacher" },
  reported: { id: "u2", name: "", username: "bekzod", role: "STUDENT" },
  reason: "insult" as const,
  comment: null,
  status: "open" as const,
  room_status: "spam" as const,
  created_at: "2026-11-10T10:00:00Z",
  recent_messages: [{ sender_id: 2, text: "salom", created_at: "2026-11-10T09:59:00Z" }],
};

describe("spam reports", () => {
  it("maps a report for the admin page", () => {
    const report = mapSpamReportDto(row);
    expect(report.reported).toEqual({ id: "u2", name: "bekzod", username: "bekzod", role: "student" });
    expect(report.comment).toBe("");
    expect(report.roomStatus).toBe("spam");
    expect(report.recentMessages[0]).toEqual({ senderId: "2", text: "salom", createdAt: "2026-11-10T09:59:00Z" });
  });

  it("posts admin actions to their own endpoint", async () => {
    const post = vi.spyOn(apiClient, "post").mockResolvedValue({ ...row, status: "dismissed" });
    const report = await spamReportApi.act("rep1", "dismiss");
    expect(post).toHaveBeenCalledWith("/api/v1/admin/reports/rep1/dismiss/", {});
    expect(report.status).toBe("dismissed");
  });

  it("sends the reason and only a non-empty comment", async () => {
    const post = vi.spyOn(apiClient, "post").mockResolvedValue({});
    await conversationApi.report("r1", "advertising", "  ");
    expect(post).toHaveBeenLastCalledWith("/api/v1/chat/rooms/r1/report/", { reason: "advertising" });
    await conversationApi.report("r1", "other", " Reklama yubordi ");
    expect(post).toHaveBeenLastCalledWith("/api/v1/chat/rooms/r1/report/", { reason: "other", comment: "Reklama yubordi" });
  });

  it("opens a teacher's direct chat by user id", async () => {
    const post = vi.spyOn(apiClient, "post").mockResolvedValue({ id: "r9", kind: "direct", title: "Ali", direct_status: "active", updated_at: "" });
    const room = await conversationApi.openDirect("s1");
    expect(post).toHaveBeenCalledWith("/api/v1/chat/rooms/direct/open/", { user_id: "s1" });
    expect(room.id).toBe("r9");
  });
});
