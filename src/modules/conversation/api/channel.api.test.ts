import { afterEach, describe, expect, it, vi } from "vitest";
import { apiClient } from "@/shared/api";
import { mapConversationDto } from "../lib/conversation.mappers";
import { channelApi } from "./channel.api";

afterEach(() => vi.restoreAllMocks());

describe("channels", () => {
  it("maps a channel room with posting and comment rights", () => {
    const room = mapConversationDto({
      id: "c1",
      kind: "channel",
      title: "E'lonlar",
      description: "Muhim xabarlar",
      members_count: 12,
      can_write: false,
      can_comment: true,
      updated_at: "2026-11-10T10:00:00Z",
    });
    expect(room).toMatchObject({ type: "channel", memberCount: 12, canWrite: false, canComment: true, description: "Muhim xabarlar" });
  });

  it("sends only the chosen audience when creating", async () => {
    const post = vi.spyOn(apiClient, "post").mockResolvedValue({ id: "c1", kind: "channel", title: "E'lonlar", updated_at: "" });
    await channelApi.create({ title: " E'lonlar ", description: "", courseIds: ["g1"], studentIds: [] });
    expect(post).toHaveBeenCalledWith("/api/v1/chat/channels/", { title: "E'lonlar", description: "", course_ids: ["g1"] });
  });
});
