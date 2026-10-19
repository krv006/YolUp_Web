import { useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/modules/auth";
import { useConversations } from "@/modules/conversation";
import { useCourses } from "@/modules/course";
import { useLessons } from "@/modules/lesson";
import { quizDisplayTitle, useQuizzes } from "@/modules/quiz";
import { ROLES } from "@/shared/constants";
import { AppDialog, dialogButton } from "@/shared/ui/app-dialog";
import { useIsCompact } from "@/shared/hooks/use-media-query";
import { Avatar } from "@/shared/ui/legacy";
import { Icon } from "@/shared/ui/icon";

type Filter = "all" | "groups" | "lessons" | "quizzes" | "messages";

interface Hit {
  key: string;
  section: Filter;
  title: string;
  meta: string;
  avatar?: string;
  icon?: string;
  to: string;
}

export interface GlobalSearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function GlobalSearchDialog({ open, onOpenChange }: GlobalSearchDialogProps) {
  const { t } = useTranslation("workspace");
  const { t: tl } = useTranslation("lesson");
  const navigate = useNavigate();
  const { user } = useAuth();
  const isStudent = user?.role === ROLES.STUDENT;
  const basePath = isStudent ? "/student/chats" : "/teacher/chats";

  const [term, setTerm] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const query = term.trim().toLowerCase();
  const enabled = open && query.length >= 2;

  const courses = useCourses();
  const lessons = useLessons({ page_size: 200 }, open);
  const quizzes = useQuizzes(null, open);
  const conversations = useConversations(isStudent ? "student" : "teacher");
  const months = tl("list.months", { returnObjects: true }) as string[];

  const hits = useMemo<Hit[]>(() => {
    if (!enabled) return [];
    const matches = (value: string | null | undefined) =>
      Boolean(value && value.toLowerCase().includes(query));

    function moment(value: string): string {
      const date = new Date(value);
      if (Number.isNaN(date.getTime())) return "";
      const time = `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
      return `${date.getDate()}-${(months[date.getMonth()] ?? "").toLowerCase()}, ${time}`;
    }

    return [
      ...(courses.data ?? [])
        .filter((item) => matches(item.title))
        .map((item) => ({
          key: `group-${item.id}`,
          section: "groups" as const,
          title: item.title,
          meta: [t("groupMeta", { count: item.studentCount ?? 0 }), item.subjectLabel || item.subject]
            .filter(Boolean)
            .join(" · "),
          avatar: item.title,
          to: basePath,
        })),
      ...(lessons.data ?? [])
        .filter((item) => matches(item.title))
        .map((item) => ({
          key: `lesson-${item.id}`,
          section: "lessons" as const,
          title: item.title,
          meta: [item.courseTitle, moment(item.startsAt)].filter(Boolean).join(" · "),
          icon: "nav-calendar",
          to: `${basePath}/schedule`,
        })),
      ...(quizzes.data ?? [])
        .filter((item) => matches(quizDisplayTitle(item)))
        .map((item) => ({
          key: `quiz-${item.id}`,
          section: "quizzes" as const,
          title: quizDisplayTitle(item),
          meta: `${item.status === "draft" ? t("draft") : t("published")} · ${t("quizQuestions", {
            count: item.questionCount,
          })}`,
          icon: "assign",
          to: `${basePath}/quizzes?quiz=${item.id}`,
        })),
      ...(conversations.data ?? [])
        .filter((item) => matches(item.title) || matches(item.lastMessage))
        .map((item) => ({
          key: `room-${item.id}`,
          section: "messages" as const,
          title: item.title,
          meta: item.lastMessage,
          avatar: item.title,
          to: `${basePath}/${item.id}`,
        })),
    ];
  }, [enabled, query, courses.data, lessons.data, quizzes.data, conversations.data, basePath, months, t]);

  const visible = hits.filter((hit) => filter === "all" || hit.section === filter);

  const resetKey = `${open}|${query}|${filter}`;
  const [syncedKey, setSyncedKey] = useState(resetKey);
  if (syncedKey !== resetKey) {
    setSyncedKey(resetKey);
    setActive(0);
  }

  function go(hit: Hit | undefined) {
    if (!hit) return;
    onOpenChange(false);
    navigate(hit.to);
  }

  const sections: Array<{ id: Filter; label: string }> = [
    { id: "groups", label: t("sectionGroups", { count: hits.filter((h) => h.section === "groups").length }) },
    { id: "lessons", label: t("sectionLessons", { count: hits.filter((h) => h.section === "lessons").length }) },
    { id: "quizzes", label: t("sectionQuizzes", { count: hits.filter((h) => h.section === "quizzes").length }) },
    { id: "messages", label: t("sectionMessages", { count: hits.filter((h) => h.section === "messages").length }) },
  ];

  const isCompact = useIsCompact();

  const body = (
      <div
        className="flex flex-col gap-3"
        onKeyDown={(event) => {
          if (event.key === "ArrowDown") {
            event.preventDefault();
            setActive((index) => (visible.length ? (index + 1) % visible.length : 0));
          }
          if (event.key === "ArrowUp") {
            event.preventDefault();
            setActive((index) => (visible.length ? (index - 1 + visible.length) % visible.length : 0));
          }
          if (event.key === "Enter") {
            event.preventDefault();
            go(visible[active]);
          }
        }}
      >
        <label className="hidden h-12 items-center gap-3 rounded-xl border border-action bg-surface px-4 lg:flex">
          <Icon name="search" size={18} className="shrink-0 text-ink-tertiary" />
          <input
            ref={inputRef}
            autoFocus
            className="h-full min-w-0 flex-1 bg-transparent text-body text-ink outline-none placeholder:text-ink-tertiary"
            value={term}
            onChange={(event) => setTerm(event.target.value)}
            placeholder={t("searchPlaceholder")}
            aria-label={t("searchPlaceholder")}
          />
          {term ? (
            <button
              type="button"
              className="grid size-7 shrink-0 place-items-center rounded-full text-ink-tertiary hover:text-ink"
              onClick={() => {
                setTerm("");
                inputRef.current?.focus();
              }}
              aria-label={t("searchTitle")}
            >
              <Icon name="add" size={18} className="rotate-45" />
            </button>
          ) : null}
        </label>

        <div className="-mx-4 flex items-center gap-2 overflow-x-auto px-4 lg:mx-0 lg:flex-wrap lg:px-0">
          {(
            [
              { id: "all" as const, label: t("filterAll", { count: hits.length }) },
              ...sections.map((item) => ({ id: item.id, label: item.label.split(" · ")[0] })),
            ]
          ).map((item) => (
            <button
              key={item.id}
              type="button"
              className={`h-9 shrink-0 rounded-full px-3.5 text-caption-strong transition-colors ${
                filter === item.id
                  ? "bg-subtle text-ink"
                  : "border border-line bg-surface text-ink-secondary hover:bg-subtle"
              }`}
              onClick={() => setFilter(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="flex max-h-[380px] flex-col gap-4 overflow-y-auto">
          {!enabled ? (
            <p className="px-1 text-body-sm text-ink-tertiary">{t("searchHint")}</p>
          ) : !visible.length ? (
            <p className="px-1 text-body-sm text-ink-tertiary">{t("searchEmpty", { query: term })}</p>
          ) : (
            sections.map((section) => {
              const rows = visible.filter((hit) => hit.section === section.id);
              if (!rows.length) return null;
              return (
                <section key={section.id} className="flex flex-col gap-2">
                  <span className="px-1 text-caption-strong tracking-wide text-ink-tertiary uppercase">
                    {section.label}
                  </span>
                  <div className="flex flex-col divide-y divide-line overflow-hidden rounded-xl border border-line bg-surface">
                    {rows.map((hit) => {
                      const index = visible.indexOf(hit);
                      return (
                        <button
                          key={hit.key}
                          type="button"
                          className={`flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                            index === active ? "bg-subtle" : "hover:bg-subtle"
                          }`}
                          onMouseEnter={() => setActive(index)}
                          onClick={() => go(hit)}
                        >
                          {hit.avatar ? (
                            <Avatar name={hit.avatar} size="sm" />
                          ) : (
                            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-action text-on-action">
                              <Icon name={hit.icon ?? "assign"} size={18} />
                            </span>
                          )}
                          <span className="flex min-w-0 flex-1 flex-col">
                            <strong className="truncate text-label-strong text-ink">{hit.title}</strong>
                            <small className="truncate text-caption text-ink-tertiary">{hit.meta}</small>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </section>
              );
            })
          )}
        </div>
      </div>
  );

  function close() {
    setTerm("");
    setFilter("all");
    onOpenChange(false);
  }

  if (isCompact)
    return open ? (
      <div className="fixed inset-0 z-50 flex flex-col bg-canvas">
        <header className="flex shrink-0 items-center gap-2 px-3 pt-3 pb-2">
          <button
            type="button"
            className="grid size-10 shrink-0 place-items-center rounded-full text-ink transition-colors hover:bg-subtle"
            aria-label={t("searchBack")}
            onClick={close}
          >
            <Icon name="arrow-back" size={22} />
          </button>
          <label className="flex h-12 min-w-0 flex-1 items-center gap-3 rounded-2xl border border-action bg-surface px-4">
            <Icon name="search" size={18} className="shrink-0 text-ink-tertiary" />
            <input
              autoFocus
              className="h-full min-w-0 flex-1 bg-transparent text-body text-ink outline-none placeholder:text-ink-tertiary"
              value={term}
              onChange={(event) => setTerm(event.target.value)}
              placeholder={t("searchPlaceholder")}
              aria-label={t("searchPlaceholder")}
            />
            {term ? (
              <button
                type="button"
                className="grid size-7 shrink-0 place-items-center rounded-full text-ink-tertiary"
                onClick={() => setTerm("")}
                aria-label={t("searchTitle")}
              >
                <Icon name="add" size={18} className="rotate-45" />
              </button>
            ) : null}
          </label>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-6">{body}</div>
      </div>
    ) : null;

  return (
    <AppDialog
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          setTerm("");
          setFilter("all");
        }
        onOpenChange(next);
      }}
      width="lg:w-[640px]"
      title={t("searchTitle")}
      description={t("searchSubtitle")}
      footer={
        <>
          <small className="mr-auto hidden text-caption text-ink-tertiary lg:block">
            {t("searchHotkeys")}
          </small>
          <button
            type="button"
            className={dialogButton.primary}
            onClick={() => {
              onOpenChange(false);
              navigate(`${basePath}/search`);
            }}
          >
            {t("searchAllResults")}
          </button>
        </>
      }
    >
        {body}
    </AppDialog>
  );
}
