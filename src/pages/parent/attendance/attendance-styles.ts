import type { AttendanceStatus } from "@/modules/parent";

export const DEFAULT_STATUSES: AttendanceStatus[] = ["attended", "late", "missed"];

export const STATUS_TILE: Record<AttendanceStatus, string> = {
  live: "bg-danger-bg text-error-text",
  attended: "bg-accent-green-bg text-accent-green-fg",
  late: "bg-accent-saffron-bg text-accent-saffron-fg",
  missed: "bg-danger-bg text-error-text",
  upcoming: "bg-accent-teal-bg text-accent-teal-fg",
};

export const STATUS_DOT: Record<AttendanceStatus, string> = {
  live: "bg-danger",
  attended: "bg-success",
  late: "bg-saffron",
  missed: "bg-danger",
  upcoming: "bg-accent-teal-fg",
};

export function subjectLook(subject: string): { icon: string; tone: string } {
  if (/ingliz|english|ielts|rus|nemis|german|fransuz|french|arab|koreys|korean|turk|language/i.test(subject)) {
    return { icon: "translate", tone: "bg-accent-blue-bg text-accent-blue-fg" };
  }
  if (/mat|algebra|geometr/i.test(subject)) return { icon: "functions", tone: "bg-accent-green-bg text-accent-green-fg" };
  return { icon: "menu-book", tone: "bg-accent-violet-bg text-accent-violet-fg" };
}
