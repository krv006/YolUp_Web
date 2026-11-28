import { afterEach, describe, expect, it } from "vitest";
import { storage } from "@/shared/lib";
import { mapHelpConfig, mapTicket } from "../api/support.api";
import { fileProblem, filterTickets, groupTickets, markTicketSeen, staffName, ticketUnread } from "./ticket-helpers";

const ticket = (patch: Record<string, unknown> = {}) =>
  mapTicket({
    id: "t1",
    subject: "Darsga kira olmayapman",
    status: "answered",
    created_at: "2026-11-27T14:20:00+05:00",
    updated_at: "2026-11-27T14:31:00+05:00",
    messages: [
      { id: 1, body: "Ekran oq", from_staff: false, author: "Mirkamol", created_at: "2026-11-27T14:20:00+05:00" },
      { id: 2, body: "Keshni tozalang", from_staff: true, author: "Dilnoza Karimova", created_at: "2026-11-27T14:31:00+05:00" },
    ],
    ...patch,
  });

afterEach(() => storage.remove("yolup:help:seen"));

describe("support tickets", () => {
  it("maps optional backend fields and knows when rating is supported", () => {
    const plain = ticket();
    expect(plain).toMatchObject({ number: null, category: null, rateable: false, rating: null, queuePosition: null });
    const full = ticket({ number: 1042, category: "tech", queue_position: 2, queue_minutes: 10, rating: null });
    expect(full).toMatchObject({ number: "1042", category: "tech", rateable: true, queuePosition: 2 });
    expect(ticket({ rating: { stars: 4, tags: ["fast"], comment: "" } }).rating).toEqual({ stars: 4, tags: ["fast"], comment: "" });
    expect(staffName(plain)).toBe("Dilnoza");
  });

  it("shows an answered ticket as unread until it is opened, unless the backend says otherwise", () => {
    const item = ticket();
    expect(ticketUnread(item)).toBe(true);
    markTicketSeen(item);
    expect(ticketUnread(item)).toBe(false);
    expect(ticketUnread(ticket({ updated_at: "2026-11-27T15:00:00+05:00" }))).toBe(true);
    expect(ticketUnread(ticket({ unread: false }))).toBe(false);
    expect(ticketUnread(ticket({ status: "open" }))).toBe(false);
  });

  it("filters by status and groups this week apart from older months", () => {
    const now = new Date("2026-11-28T10:00:00+05:00");
    const old = ticket({ id: "t2", status: "closed", updated_at: "2026-10-28T10:00:00+05:00" });
    const items = [ticket(), old];
    expect(filterTickets(items, "closed").map((item) => item.id)).toEqual(["t2"]);
    expect(groupTickets(items, now, () => "Oktabr", "Bu hafta").map((group) => [group.label, group.items.length])).toEqual([
      ["Bu hafta", 1],
      ["Oktabr", 1],
    ]);
  });

  it("rejects files that are too large or of an unsupported type", () => {
    expect(fileProblem(new File(["x"], "a.png", { type: "image/png" }), 10)).toBeNull();
    expect(fileProblem(new File(["x"], "a.mp4", { type: "video/mp4" }), 10)).toBe("type");
    const big = new File([new Uint8Array(11 * 1024 * 1024)], "b.pdf", { type: "application/pdf" });
    expect(fileProblem(big, 10)).toBe("size");
  });

  it("reads help center settings and builds a Telegram link", () => {
    expect(mapHelpConfig({ online: true, reply_minutes: 10, telegram: "@yolup_support", attachments: { max_mb: 10 } })).toMatchObject({
      online: true,
      replyMinutes: 10,
      telegramUrl: "https://t.me/yolup_support",
      attachmentsMaxMb: 10,
    });
    expect(mapHelpConfig({})).toMatchObject({ online: null, attachmentsMaxMb: 0, phone: "" });
  });
});
