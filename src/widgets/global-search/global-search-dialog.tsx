import { useMemo, useRef, useState, type ReactNode } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useIsStudent, useRoleRoutes } from "@/modules/auth";
import { useConversations } from "@/modules/conversation";
import { useQuizzes } from "@/modules/quiz";
import { useGlobalSearch, type SearchType } from "@/modules/search";
import { ROUTES } from "@/shared/config";
import { useIsCompact } from "@/shared/hooks/use-media-query";
import { Avatar } from "@/shared/ui/legacy";
import { Icon } from "@/shared/ui/icon";

type Filter = "all" | SearchType;

interface Hit {
  key: string;
  section: SearchType;
  title: string;
  meta: string;
  avatar?: string;
  avatarUrl?: string | null;
  icon?: string;
  to: string;
}

const SECTION_ICONS: Record<SearchType, string> = {
  groups: "person",
  lessons: "nav-calendar",
  quizzes: "assign",
  messages: "chat",
  people: "person",
};

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
  const isStudent = useIsStudent();
  const routes = useRoleRoutes();

  const [term, setTerm] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const query = term.trim().toLowerCase();
  const search = useGlobalSearch(term, filter, open);
  const enabled = search.active;

  const quizzes = useQuizzes(null, open && !isStudent);
  const conversations = useConversations(isStudent ? "student" : "teacher");
  const months = tl("list.months", { returnObjects: true }) as string[];

  const hits = useMemo<Hit[]>(() => {
    function moment(value: string | null): string {
      if (!value) return "";
      const date = new Date(value);
      if (Number.isNaN(date.getTime())) return "";
      const time = `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
      return `${date.getDate()}-${(months[date.getMonth()] ?? "").toLowerCase()}, ${time}`;
    }

    return search.items.map((item) => {
      const base = { key: `${item.type}-${item.id}`, section: item.type, title: item.title, icon: SECTION_ICONS[item.type] };
      if (item.type === "groups") {
        const room = conversations.data?.find((conversation) => conversation.courseId === item.id);
        return { ...base, meta: item.subtitle, avatar: item.title, to: room ? routes.chat(room.id) : routes.chats };
      }
      if (item.type === "lessons")
        return { ...base, meta: [item.subtitle, moment(item.startsAt)].filter(Boolean).join(" · "), to: routes.schedule };
      if (item.type === "quizzes") {
        const quiz = quizzes.data?.find((entry) => entry.id === item.id);
        return {
          ...base,
          meta: item.subtitle,
          to: isStudent
            ? ROUTES.student.test(item.id)
            : quiz && quiz.status !== "draft"
              ? ROUTES.teacher.testResults(item.id)
              : ROUTES.teacher.test(item.id),
        };
      }
      if (item.type === "messages")
        return {
          ...base,
          meta: [item.subtitle, item.sender].filter(Boolean).join(" · "),
          avatar: item.subtitle || item.title,
          to: item.roomId ? routes.chat(item.roomId) : routes.chats,
        };
      return {
        ...base,
        meta: item.subtitle,
        avatar: item.title,
        avatarUrl: item.avatarUrl,
        to: item.roomId ? routes.chat(item.roomId) : routes.chats,
      };
    });
  }, [search.items, conversations.data, quizzes.data, routes, isStudent, months]);

  const visible = hits;
  const countOf = (section: SearchType) => search.counts[section] ?? 0;
  const total = (Object.values(search.counts) as number[]).reduce((sum, value) => sum + value, 0);

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

  const sections: Array<{ id: SearchType; label: string }> = [
    { id: "groups", label: t("sectionGroups", { count: countOf("groups") }) },
    { id: "lessons", label: t("sectionLessons", { count: countOf("lessons") }) },
    { id: "quizzes", label: t("sectionQuizzes", { count: countOf("quizzes") }) },
    { id: "messages", label: t("sectionMessages", { count: countOf("messages") }) },
    { id: "people", label: t("sectionPeople", { count: countOf("people") }) },
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
              { id: "all" as const, label: t("filterAll", { count: total }) },
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
          ) : !visible.length && search.loading ? (
            <div className="flex flex-col gap-2" aria-hidden="true">
              {Array.from({ length: 4 }, (_, index) => (
                <i key={index} className="h-16 rounded-xl bg-skeleton" />
              ))}
            </div>
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
                            <Avatar name={hit.avatar} src={hit.avatarUrl ?? undefined} size="sm" />
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
            ) : !visible.length && search.loading ? (
              <div className="flex flex-col gap-1 px-6 py-2" aria-hidden="true">
                {Array.from({ length: 5 }, (_, index) => (
                  <span key={index} className="flex h-14 items-center gap-3.5">
                    <i className="size-9 shrink-0 rounded-lg bg-skeleton" />
                    <span className="flex min-w-0 flex-1 flex-col gap-2">
                      <i className="h-3.5 w-48 max-w-full rounded-full bg-skeleton" />
                      <i className="h-3 w-32 max-w-full rounded-full bg-skeleton" />
                    </span>
                  </span>
                ))}
              </div>
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
