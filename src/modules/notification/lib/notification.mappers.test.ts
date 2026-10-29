import { describe, expect, it } from "vitest";
import { mapInboxNotificationDto, mapSentNotificationDto } from "./notification.mappers";
import type { NotificationRecipientDto, SentNotificationDto } from "../api/notification.dto";

const evil = '<p>Salom</p><img src=x onerror="alert(1)"><script>alert(2)</script>';

describe("notification mappers sanitize the server HTML before it reaches the UI", () => {
  it("inbox notifications", () => {
    const dto = { id: 1, is_read: false, notification: { id: 7, description: evil } } as unknown as NotificationRecipientDto;
    const mapped = mapInboxNotificationDto(dto);
    expect(mapped.html).toBe("<p>Salom</p>");
    expect(mapped.id).toBe("1");
    expect(mapped.notificationId).toBe("7");
  });

  it("sent notifications", () => {
    const dto = { id: 5, description: evil, read_count: "2", total_count: 3 } as unknown as SentNotificationDto;
    const mapped = mapSentNotificationDto(dto);
    expect(mapped.html).toBe("<p>Salom</p>");
    expect(mapped.readCount).toBe(2);
    expect(mapped.totalCount).toBe(3);
  });
});
