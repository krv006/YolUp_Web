import { afterEach, describe, expect, it, vi } from "vitest";
import { apiClient } from "@/shared/api";
import { clubApi } from "./club.api";

afterEach(() => vi.restoreAllMocks());

describe("clubApi", () => {
  it("maps clubs with their chat room", async () => {
    vi.spyOn(apiClient, "get").mockResolvedValue([{ id: "k1", title: "Speaking B2", kind: "club", members_count: 9, chat_room_id: "r7" }]);
    const [club] = await clubApi.list();
    expect(club).toMatchObject({ id: "k1", kind: "club", membersCount: 9, chatRoomId: "r7" });
  });

  it("adds members by groups and students", async () => {
    const post = vi.spyOn(apiClient, "post").mockResolvedValue({ added: 4 });
    expect(await clubApi.addMembers("k1", { courseIds: [], studentIds: ["s1"] })).toBe(4);
    expect(post).toHaveBeenCalledWith("/api/v1/clubs/k1/members/", { student_ids: ["s1"] });
  });
});
