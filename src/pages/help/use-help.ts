import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/modules/auth";
import {
  articlesFor,
  findCategory,
  HELP_CATEGORIES,
  popularFor,
  useHelpConfig,
  useHelpFaq,
  useHelpVideos,
  type FaqItem,
  type HelpArticle,
  type HelpRole,
  type HelpVideo,
  type SearchEntry,
  type SupportTicket,
} from "@/modules/support";
import { ROUTES } from "@/shared/config";
import { ROLES } from "@/shared/constants";

export const DEFAULT_REPLY_MINUTES = 10;

export function useHelpRole(): HelpRole {
  const { user } = useAuth();
  if (user?.role === ROLES.PARENT) return "parent";
  if (user?.role === ROLES.STUDENT) return "student";
  return "teacher";
}

export function useHelpBase(): string {
  const role = useHelpRole();
  if (role === "parent") return ROUTES.parent.help;
  return `${role === "student" ? ROUTES.student.profile : ROUTES.teacher.profile}/help`;
}

export function useHelpPaths() {
  const base = useHelpBase();
  return useMemo(
    () => ({
      home: base,
      search: (query = "") => `${base}/search${query ? `?q=${encodeURIComponent(query)}` : ""}`,
      category: (id: string) => `${base}/category/${id}`,
      article: (id: string) => `${base}/articles/${id}`,
      articles: `${base}/articles`,
      videos: `${base}/videos`,
      faq: (id: string) => `${base}/faq/${id}`,
      newTicket: `${base}/new`,
      tickets: `${base}/tickets`,
      ticket: (id: string) => `${base}/tickets/${id}`,
    }),
    [base]
  );
}

export interface ArticleView extends HelpArticle {
  title: string;
  hint: string;
  intro: string;
  steps: string[];
  tip: string;
}

export function useArticleText() {
  const { t } = useTranslation("help");
  return (article: HelpArticle): ArticleView => {
    const steps = t(`articles.${article.id}.steps`, { returnObjects: true });
    const tipKey = `articles.${article.id}.tip`;
    const tip = t(tipKey, { defaultValue: "" });
    return {
      ...article,
      title: t(`articles.${article.id}.title`),
      hint: t(`articles.${article.id}.hint`),
      intro: t(`articles.${article.id}.intro`),
      steps: Array.isArray(steps) ? (steps as string[]) : [],
      tip: tip === tipKey ? "" : tip,
    };
  };
}

export function useHelpArticles() {
  const role = useHelpRole();
  const text = useArticleText();
  const { i18n, ready } = useTranslation("help");
  return useMemo(
    () => ({
      all: articlesFor(role).map(text),
      popular: popularFor(role).map(text),
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [role, i18n.language, ready]
  );
}

export type HelpSearchEntry =
  | (SearchEntry & { kind: "article"; article: ArticleView })
  | (SearchEntry & { kind: "video"; video: HelpVideo })
  | (SearchEntry & { kind: "faq"; faq: FaqItem });

export function useHelpSearchEntries() {
  const { all } = useHelpArticles();
  const videos = useHelpVideos();
  const faq = useHelpFaq();
  return useMemo<HelpSearchEntry[]>(
    () => [
      ...all.map((article) => ({
        id: article.id,
        kind: "article" as const,
        title: article.title,
        text: `${article.hint} ${article.intro} ${article.steps.join(" ")}`,
        article,
      })),
      ...(faq.data ?? []).map((item) => ({ id: item.id, kind: "faq" as const, title: item.question, text: item.answer, faq: item })),
      ...(videos.data ?? []).map((video) => ({
        id: video.id,
        kind: "video" as const,
        title: video.title,
        text: video.description,
        video,
      })),
    ],
    [all, faq.data, videos.data]
  );
}

export function useReplyMinutes(): number {
  const config = useHelpConfig();
  return config.data?.replyMinutes ?? DEFAULT_REPLY_MINUTES;
}

export function useCategoryList() {
  const { all } = useHelpArticles();
  const videos = useHelpVideos();
  return useMemo(
    () =>
      HELP_CATEGORIES.map((category) => ({
        ...category,
        articles: all.filter((article) => article.category === category.id),
        videos: (videos.data ?? []).filter((video) => video.category === category.id),
      })).filter((category) => category.articles.length),
    [all, videos.data]
  );
}

export { findCategory };

export function videoDuration(seconds: number | null): string {
  if (!seconds) return "";
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

export function openVideo(video: HelpVideo) {
  window.open(video.url, "_blank", "noopener,noreferrer");
}

export function activeTicket(tickets: readonly SupportTicket[] | undefined): SupportTicket | null {
  return (
    [...(tickets ?? [])]
      .filter((ticket) => ticket.status !== "closed")
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0] ?? null
  );
}


export function useHelpDate() {
  const { i18n } = useTranslation("help");
  const months = useTranslation("lesson").t("list.monthsLong", { returnObjects: true }) as string[];
  return (value: string, part: "day" | "month" = "day"): string => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    if (i18n.language === "uz") {
      const month = (months[date.getMonth()] ?? "").toLowerCase();
      return part === "month" ? month : `${date.getDate()}-${month}`;
    }
    return new Intl.DateTimeFormat(i18n.language, part === "month" ? { month: "long" } : { day: "numeric", month: "long" }).format(date);
  };
}
