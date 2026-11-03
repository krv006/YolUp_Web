import type { InboxNotification, NotificationLink } from "../api/notification.dto";

const LESSON_REMINDER_KIND = "lesson_reminder";

export type NotificationGroupKey = "today" | "yesterday" | "earlier";

export type NotificationCategory = "attendance" | "homework" | "security";

export const NOTIFICATION_CATEGORIES: NotificationCategory[] = ["attendance", "homework", "security"];

export const NOTIFICATION_TONES = {
  lesson: "bg-accent-saffron-bg text-accent-saffron-fg",
  people: "bg-accent-green-bg text-accent-green-fg",
  action: "bg-accent-blue-bg text-accent-blue-fg",
  quiz: "bg-accent-violet-bg text-accent-violet-fg",
  neutral: "bg-brand-subtle text-brand",
  danger: "bg-danger-bg text-error-text",
};

export function notificationCategory(item: Pick<InboxNotification, "kind" | "link">): NotificationCategory | null {
  const kind = item.kind ?? "";
  const link = item.link?.type ?? "";
  if (/login|device|session|security|password/.test(kind)) return "security";
  if (/homework|assignment|submission/.test(kind) || ["assignment", "submission", "homework"].includes(link)) return "homework";
  if (/lesson|attendance|focus|recording/.test(kind) || ["lesson", "recording"].includes(link)) return "attendance";
  return null;
}

export function notificationIcon(item: InboxNotification) {
  if (item.kind === LESSON_REMINDER_KIND) return { icon: "clock", tone: NOTIFICATION_TONES.lesson };
  if (/login|device|security/.test(item.kind ?? "")) return { icon: "shield", tone: NOTIFICATION_TONES.danger };
  if (item.kind === "attendance.missed") return { icon: "cancel", tone: NOTIFICATION_TONES.danger };
  if (item.kind === "attendance.late") return { icon: "schedule", tone: NOTIFICATION_TONES.lesson };
  if (/attendance/.test(item.kind ?? "")) return { icon: "how-to-reg", tone: NOTIFICATION_TONES.people };
  if (item.kind === "homework_due_soon") return { icon: "hourglass-empty", tone: NOTIFICATION_TONES.lesson };
  if (item.kind?.startsWith("link.")) return { icon: "link", tone: NOTIFICATION_TONES.danger };
  if (item.kind === "consent.changed") return { icon: "shield", tone: NOTIFICATION_TONES.quiz };
  if (item.kind?.includes("rating") || item.kind?.includes("grade"))
    return { icon: "star", tone: NOTIFICATION_TONES.people };
  if (item.link?.type === "submission") return { icon: "check-circle", tone: NOTIFICATION_TONES.people };
  if (item.link?.type === "assignment") return { icon: "assign", tone: NOTIFICATION_TONES.lesson };
  if (item.link?.type === "quiz") return { icon: "quiz", tone: NOTIFICATION_TONES.quiz };
  if (item.targetType === "all") return { icon: "campaign", tone: NOTIFICATION_TONES.action };
  if (item.kind === "mention") return { icon: "alternate-email", tone: NOTIFICATION_TONES.action };
  return { icon: "person", tone: NOTIFICATION_TONES.neutral };
}

export function notificationActionKey(link: NotificationLink | null): string | null {
  if (!link) return null;
  if (link.type === "assignment") return "openAssignment";
  if (link.type === "quiz" || link.type === "exam") return "openQuiz";
  if (link.type === "course") return "review";
  return "open";
}

export function notificationGroupKey(value: string): NotificationGroupKey {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "earlier";
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  if (date.getTime() >= start.getTime()) return "today";
  if (date.getTime() >= start.getTime() - 86_400_000) return "yesterday";
  return "earlier";
}

export function notificationContent(item: { html: string; title?: string; body?: string }): { title: string; body: string } {
  if (item.title) return { title: item.title, body: item.body ?? "" };
  return notificationLines(item.html);
}

export function notificationLines(html: string): { title: string; body: string } {
  const text = html.replace(/<br\s*\/?>|<\/(p|div|li|h\d)>/gi, "\n");
  const doc = new DOMParser().parseFromString(text, "text/html");
  const lines = (doc.body.textContent ?? "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  return { title: lines[0] ?? "", body: lines.slice(1).join(" · ") };
}
