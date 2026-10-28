import { useMemo, useRef, useState, type ReactNode } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/modules/auth";
import { useConversations } from "@/modules/conversation";
import { useCourses } from "@/modules/course";
import { useLessons } from "@/modules/lesson";
import { quizDisplayTitle, useQuizzes } from "@/modules/quiz";
import { ROLES } from "@/shared/constants";
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

function highlight(text: string, query: string): ReactNode {
  if (!query) return text;
  const index = text.toLowerCase().indexOf(query);
  if (index < 0) return text;
  return (
    <>
      {text.slice(0, index)}
      <b className="font-semibold text-brand">{text.slice(index, index + query.length)}</b>
      {text.slice(index + query.length)}
    </>
  );
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

        <div className="-mx-4 flex items-center gap-2 overflow-x-auto px-4 [scrollbar-width:none] lg:mx-0 lg:flex-wrap lg:px-0 [&::-webkit-scrollbar]:hidden">
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
    <DialogPrimitive.Root
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          setTerm("");
          setFilter("all");
        }
        onOpenChange(next);
      }}
    >
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-scrim data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content
          aria-describedby={undefined}
          className="fixed top-[110px] left-1/2 z-50 flex max-h-[600px] w-[640px] max-w-[calc(100%-48px)] -translate-x-1/2 flex-col overflow-hidden rounded-xl bg-surface shadow-2xl outline-none data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95"
          onKeyDown={(event) => {
            if (event.key === "ArrowDown") {
              event.preventDefault();
              setActive((index) => (visible.length ? (index + 1) % visible.length : 0));
            }
            if (event.key === "ArrowUp") {
              event.preventDefault();
              setActive((index) =>
                visible.length ? (index - 1 + visible.length) % visible.length : 0
              );
            }
            if (event.key === "Enter") {
              event.preventDefault();
              go(visible[active]);
            }
          }}
        >
          <DialogPrimitive.Title className="sr-only">{t("searchTitle")}</DialogPrimitive.Title>

          <label className="flex h-15 shrink-0 items-center gap-3 border-b border-line-subtle px-6">
            <Icon name="search" size={20} className="shrink-0 text-icon-tertiary" />
            <input
              ref={inputRef}
              autoFocus
              className="h-full min-w-0 flex-1 bg-transparent text-body text-ink outline-none placeholder:text-ink-tertiary"
              value={term}
              onChange={(event) => setTerm(event.target.value)}
              placeholder={t("searchPlaceholder")}
              aria-label={t("searchPlaceholder")}
            />
            <DialogPrimitive.Close asChild>
              <kbd className="shrink-0 cursor-pointer rounded-lg bg-subtle px-2.5 py-1 text-caption text-ink-tertiary">
                esc
              </kbd>
            </DialogPrimitive.Close>
          </label>

          <div className="flex min-h-0 flex-1 flex-col overflow-y-auto py-2">
            {!enabled ? (
              <p className="px-6 py-10 text-center text-body-sm text-ink-tertiary">
                {t("searchHint")}
              </p>
            ) : !visible.length ? (
              <div className="flex flex-col items-center gap-2 px-6 py-12 text-center">
                <span className="grid size-14 place-items-center rounded-2xl bg-brand-subtle text-brand">
                  <Icon name="search" size={26} />
                </span>
                <strong className="mt-2 text-title-lg text-ink">
                  {t("searchEmptyTitle", { query: term })}
                </strong>
                <p className="text-body-sm text-ink-secondary">{t("searchEmptyHint")}</p>
              </div>
            ) : (
              sections.map((section) => {
                const rows = visible.filter((hit) => hit.section === section.id);
                if (!rows.length) return null;
                return (
                  <section key={section.id} className="flex flex-col">
                    <span className="px-6 pt-3 pb-1.5 text-micro tracking-wide text-ink-tertiary uppercase">
                      {section.label.split(" · ")[0]}
                    </span>
                    {rows.map((hit) => {
                      const index = visible.indexOf(hit);
                      const isActive = index === active;
                      return (
                        <button
                          key={hit.key}
                          type="button"
                          className={`flex h-14 items-center gap-3.5 px-6 text-left transition-colors ${
                            isActive ? "bg-brand-subtle" : "hover:bg-subtle"
                          }`}
                          onMouseEnter={() => setActive(index)}
                          onClick={() => go(hit)}
                        >
                          <span
                            className={`grid size-9 shrink-0 place-items-center rounded-lg ${
                              isActive ? "bg-surface text-brand" : "bg-subtle text-icon-secondary"
                            }`}
                          >
                            <Icon name={hit.icon ?? "assign"} size={18} />
                          </span>
                          <span className="flex min-w-0 flex-1 flex-col">
                            <strong className="truncate text-title-sm text-ink">
                              {highlight(hit.title, query)}
                            </strong>
                            <small className="truncate text-caption text-ink-tertiary">
                              {hit.meta}
                            </small>
                          </span>
                          {isActive ? (
                            <kbd className="shrink-0 rounded-lg bg-surface px-2 py-1 text-caption text-ink-tertiary">
                              ↵
                            </kbd>
                          ) : null}
                        </button>
                      );
                    })}
                  </section>
                );
              })
            )}
          </div>

          <div className="flex h-10 shrink-0 items-center gap-5 bg-subtle px-6 text-caption text-ink-tertiary">
            <span>↑↓ {t("searchKeySelect")}</span>
            <span>↵ {t("searchKeyOpen")}</span>
            <span>⌘K {t("searchKeyClose")}</span>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
