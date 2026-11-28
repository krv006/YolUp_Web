export type HelpRole = "teacher" | "student" | "parent";

export type HelpCategoryId = "start" | "lessons" | "tasks" | "payments" | "account" | "tech";

export interface HelpCategory {
  id: HelpCategoryId;
  icon: string;
  tone: string;
  tags?: string[];
}

export interface HelpArticle {
  id: string;
  category: HelpCategoryId;
  icon: string;
  minutes: number;
  updatedAt: string;
  tag?: string;
  roles?: HelpRole[];
  popular?: HelpRole[];
}

export const HELP_TONES = {
  brand: "bg-brand-subtle text-brand",
  success: "bg-success-bg text-success-fg",
  saffron: "bg-accent-saffron-bg text-accent-saffron-fg",
  violet: "bg-accent-violet-bg text-accent-violet-fg",
  danger: "bg-danger-bg text-error-text",
  teal: "bg-accent-teal-bg text-accent-teal-fg",
} as const;

export const HELP_CATEGORIES: readonly HelpCategory[] = [
  { id: "start", icon: "school", tone: HELP_TONES.brand },
  { id: "lessons", icon: "calendar-month", tone: HELP_TONES.success },
  { id: "tasks", icon: "assignment", tone: HELP_TONES.saffron, tags: ["homework", "tests"] },
  { id: "payments", icon: "payments", tone: HELP_TONES.violet },
  { id: "account", icon: "shield", tone: HELP_TONES.brand },
  { id: "tech", icon: "warning", tone: HELP_TONES.danger },
];

const UPDATED = "2026-11-28";
const ALL: HelpRole[] = ["teacher", "student", "parent"];

export const HELP_ARTICLES: readonly HelpArticle[] = [
  { id: "intro", category: "start", icon: "school", minutes: 2, updatedAt: UPDATED, roles: ["teacher", "student"] },
  { id: "joinGroup", category: "start", icon: "person-add", minutes: 1, updatedAt: UPDATED, roles: ["student"] },
  { id: "createGroup", category: "start", icon: "groups", minutes: 2, updatedAt: UPDATED, roles: ["teacher"] },
  { id: "addStudent", category: "start", icon: "person-add", minutes: 1, updatedAt: UPDATED, roles: ["teacher"] },
  { id: "parentStart", category: "start", icon: "groups", minutes: 2, updatedAt: UPDATED, roles: ["parent"] },
  { id: "language", category: "start", icon: "language", minutes: 1, updatedAt: UPDATED },

  { id: "joinLesson", category: "lessons", icon: "videocam", minutes: 1, updatedAt: UPDATED, roles: ["student"], popular: ["student"] },
  { id: "startLesson", category: "lessons", icon: "videocam", minutes: 2, updatedAt: UPDATED, roles: ["teacher"], popular: ["teacher"] },
  { id: "createLesson", category: "lessons", icon: "event", minutes: 2, updatedAt: UPDATED, roles: ["teacher"] },
  { id: "cancelLesson", category: "lessons", icon: "event-repeat", minutes: 1, updatedAt: UPDATED, roles: ["teacher"] },
  { id: "recordings", category: "lessons", icon: "play-circle", minutes: 1, updatedAt: UPDATED, roles: ["teacher", "student"] },
  { id: "schedule", category: "lessons", icon: "calendar-month", minutes: 1, updatedAt: UPDATED, roles: ["teacher", "student"] },
  { id: "parentAttendance", category: "lessons", icon: "event", minutes: 1, updatedAt: UPDATED, roles: ["parent"], popular: ["parent"] },

  { id: "submitHomework", category: "tasks", icon: "assignment", minutes: 2, updatedAt: UPDATED, tag: "homework", roles: ["student"], popular: ["student"] },
  { id: "lateHomework", category: "tasks", icon: "clock", minutes: 1, updatedAt: UPDATED, tag: "homework", roles: ["student"] },
  { id: "resubmit", category: "tasks", icon: "refresh", minutes: 1, updatedAt: UPDATED, tag: "homework", roles: ["student"] },
  { id: "createHomework", category: "tasks", icon: "assignment", minutes: 2, updatedAt: UPDATED, tag: "homework", roles: ["teacher"], popular: ["teacher"] },
  { id: "checkHomework", category: "tasks", icon: "task-alt", minutes: 2, updatedAt: UPDATED, tag: "homework", roles: ["teacher"] },
  { id: "aiCheck", category: "tasks", icon: "auto-awesome", minutes: 2, updatedAt: UPDATED, tag: "homework" },
  { id: "takeTest", category: "tasks", icon: "quiz", minutes: 1, updatedAt: UPDATED, tag: "tests", roles: ["student"] },
  { id: "testResults", category: "tasks", icon: "bar-chart", minutes: 1, updatedAt: UPDATED, tag: "tests", roles: ["student"] },
  { id: "parentHomework", category: "tasks", icon: "assignment", minutes: 1, updatedAt: UPDATED, tag: "homework", roles: ["parent"] },
  { id: "parentResults", category: "tasks", icon: "bar-chart", minutes: 1, updatedAt: UPDATED, tag: "tests", roles: ["parent"], popular: ["parent"] },
  { id: "assignTest", category: "tasks", icon: "quiz", minutes: 2, updatedAt: UPDATED, tag: "tests", roles: ["teacher"] },

  { id: "paymentQuestion", category: "payments", icon: "payments", minutes: 1, updatedAt: UPDATED },
  { id: "paymentCharged", category: "payments", icon: "payments", minutes: 1, updatedAt: UPDATED, popular: ALL },

  { id: "forgotPassword", category: "account", icon: "key", minutes: 2, updatedAt: UPDATED, popular: ALL },
  { id: "changePassword", category: "account", icon: "key", minutes: 1, updatedAt: UPDATED },
  { id: "emailLogin", category: "account", icon: "mail", minutes: 1, updatedAt: UPDATED },
  { id: "switchAccount", category: "account", icon: "swap-horiz", minutes: 1, updatedAt: UPDATED },
  { id: "loginHistory", category: "account", icon: "history", minutes: 1, updatedAt: UPDATED },

  { id: "notifications", category: "tech", icon: "notifications", minutes: 2, updatedAt: UPDATED, popular: ALL },
  { id: "cameraMic", category: "tech", icon: "mic", minutes: 2, updatedAt: UPDATED, roles: ["teacher", "student"] },
  { id: "blankScreen", category: "tech", icon: "refresh", minutes: 1, updatedAt: UPDATED },
  { id: "fileUpload", category: "tech", icon: "upload", minutes: 1, updatedAt: UPDATED },
];

export function articlesFor(role: HelpRole): HelpArticle[] {
  return HELP_ARTICLES.filter((article) => !article.roles || article.roles.includes(role));
}

export function popularFor(role: HelpRole): HelpArticle[] {
  return articlesFor(role).filter((article) => article.popular?.includes(role));
}

export function findArticle(id: string): HelpArticle | null {
  return HELP_ARTICLES.find((article) => article.id === id) ?? null;
}

export function findCategory(id: string): HelpCategory | null {
  return HELP_CATEGORIES.find((category) => category.id === id) ?? null;
}

export const TICKET_TOPICS = [
  { id: "tech", icon: "warning", tone: HELP_TONES.danger },
  { id: "lessons", icon: "calendar-month", tone: HELP_TONES.success },
  { id: "tasks", icon: "assignment", tone: HELP_TONES.saffron },
  { id: "payments", icon: "payments", tone: HELP_TONES.violet },
  { id: "account", icon: "shield", tone: HELP_TONES.brand },
  { id: "feedback", icon: "emoji", tone: HELP_TONES.teal },
] as const;

export type TicketTopicId = (typeof TICKET_TOPICS)[number]["id"];

export function ticketTopic(id: string | null | undefined) {
  return TICKET_TOPICS.find((topic) => topic.id === id) ?? null;
}
