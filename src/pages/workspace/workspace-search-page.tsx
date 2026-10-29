import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useIsStudent, useRoleRoutes } from "@/modules/auth";
import { useConversations } from "@/modules/conversation";
import { useQuizzes } from "@/modules/quiz";
import { useGlobalSearch, type SearchHit, type SearchType } from "@/modules/search";
import { ROUTES } from "@/shared/config";
import { Icon } from "@/shared/ui/icon";
import { Avatar } from "@/shared/ui/legacy";
import { MobileEmptyCard, MobilePageHeader, MobileSegment } from "@/shared/ui/mobile-page";

type Filter = "all" | SearchType;

export function WorkspaceSearchPage() {
  const { t } = useTranslation("workspace");
  const { t: tl } = useTranslation("lesson");
  const navigate = useNavigate();
  const isStudent = useIsStudent();
  const routes = useRoleRoutes();

  const [term, setTerm] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const search = useGlobalSearch(term, filter);
  const enabled = search.active;

  const quizzes = useQuizzes(null, !isStudent);
  const conversations = useConversations(isStudent ? "student" : "teacher");
  const months = tl("list.months", { returnObjects: true }) as string[];

  const byType = (type: SearchType) => search.items.filter((item) => item.type === type);
  const groups = byType("groups");
  const lessonHits = byType("lessons");
  const quizHits = byType("quizzes");
  const messageHits = byType("messages");
  const people = byType("people");
  const countOf = (type: SearchType) => search.counts[type] ?? 0;
  const total = (Object.values(search.counts) as number[]).reduce((sum, value) => sum + value, 0);

  const FILTERS: Array<{ id: Filter; label: string }> = [
    { id: "all", label: t("filterAll", { count: total }) },
    { id: "groups", label: t("filterGroups") },
    { id: "lessons", label: t("filterLessons") },
    { id: "quizzes", label: t("filterQuizzes") },
    { id: "messages", label: t("filterMessages") },
    { id: "people", label: t("filterPeople") },
  ];

  const show = (id: Filter) => filter === "all" || filter === id;

  function openQuiz(hit: SearchHit) {
    const quiz = quizzes.data?.find((entry) => entry.id === hit.id);
    navigate(
      isStudent
        ? ROUTES.student.test(hit.id)
        : quiz && quiz.status !== "draft"
          ? ROUTES.teacher.testResults(hit.id)
          : ROUTES.teacher.test(hit.id)
    );
  }

  function lessonMoment(value: string | null): string {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    const time = `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);
    if (date.toDateString() === today.toDateString()) return `${t("mobileSearch.today")}, ${time}`;
    if (date.toDateString() === tomorrow.toDateString()) return `${t("mobileSearch.tomorrow")}, ${time}`;
    return `${date.getDate()}-${(months[date.getMonth()] ?? "").toLowerCase()}, ${time}`;
  }

  return (
    <main className="h-full overflow-y-auto bg-canvas bg-auth-gradient px-4 pt-5 pb-8 font-body text-ink">
      <div className="mx-auto flex max-w-2xl flex-col">
        <MobilePageHeader
          title={t("searchTitle")}
          backLabel={t("searchBack")}
          onBack={() => navigate(-1)}
        />

        <label className="mt-5 flex h-12 items-center gap-3 rounded-full border-[1.5px] border-transparent bg-surface px-4.5 transition-colors focus-within:border-focus">
          <Icon name="search" size={20} className="shrink-0 text-ink-secondary" />
          <input
            autoFocus
            className="h-full min-w-0 flex-1 bg-transparent text-body font-medium text-ink outline-none placeholder:font-normal placeholder:text-ink-secondary"
            value={term}
            onChange={(event) => setTerm(event.target.value)}
            placeholder={t("searchPlaceholder")}
            aria-label={t("searchPlaceholder")}
          />
          {term ? (
            <button
              type="button"
              className="grid size-6 shrink-0 place-items-center rounded-full bg-subtle text-ink-secondary transition-colors hover:text-ink"
              onClick={() => setTerm("")}
              aria-label={t("mobileSearch.clear")}
            >
              <Icon name="close" size={14} />
            </button>
          ) : null}
        </label>

        {enabled && (total > 0 || filter !== "all") ? (
          <div className="mt-5">
            <MobileSegment
              scroll
              items={FILTERS.map((item) => ({ id: item.id, label: item.label }))}
              value={filter}
              onChange={setFilter}
            />
          </div>
        ) : null}

        {!enabled ? (
          <p className="mt-5 px-1 text-body-sm text-ink-secondary">{t("searchHint")}</p>
        ) : search.loading && !search.items.length ? (
          <div className="mt-5 flex flex-col overflow-hidden rounded-xl bg-surface" aria-hidden="true">
            {Array.from({ length: 4 }, (_, index) => (
              <span key={index} className="flex items-center gap-3 border-b border-line px-4 py-3.75 last:border-b-0">
                <i className="size-10 shrink-0 rounded-lg bg-skeleton" />
                <span className="flex min-w-0 flex-1 flex-col gap-2">
                  <i className="h-3.5 w-44 max-w-full rounded-full bg-skeleton" />
                  <i className="h-3 w-28 max-w-full rounded-full bg-skeleton" />
                </span>
              </span>
            ))}
          </div>
        ) : !search.items.length ? (
          <div className="mt-5">
            <MobileEmptyCard
              icon="search"
              title={t("mobileSearch.emptyTitle")}
              description={t("mobileSearch.emptyHint", { query: term.trim() })}
            />
          </div>
        ) : null}

        {show("groups") && groups.length ? (
          <ResultSection title={t("mobileSearch.groups", { count: countOf("groups") })}>
            {groups.map((hit) => (
              <ResultRow
                key={hit.id}
                icon="person"
                tone="bg-brand-subtle text-ink"
                title={hit.title}
                hint={hit.subtitle}
                onClick={() => {
                  const room = conversations.data?.find((item) => item.courseId === hit.id);
                  navigate(room ? routes.chat(room.id) : routes.chats);
                }}
              />
            ))}
          </ResultSection>
        ) : null}

        {show("lessons") && lessonHits.length ? (
          <ResultSection title={t("mobileSearch.lessons", { count: countOf("lessons") })}>
            {lessonHits.map((hit) => (
              <ResultRow
                key={hit.id}
                icon="clock"
                tone="bg-accent-teal-bg text-accent-teal-fg"
                title={hit.subtitle && hit.subtitle !== hit.title ? `${hit.subtitle} — ${hit.title}` : hit.title}
                hint={lessonMoment(hit.startsAt)}
                onClick={() => navigate(routes.schedule)}
              />
            ))}
          </ResultSection>
        ) : null}

        {show("quizzes") && quizHits.length ? (
          <ResultSection title={t("mobileSearch.quizzes", { count: countOf("quizzes") })}>
            {quizHits.map((hit) => (
              <ResultRow
                key={hit.id}
                icon="quiz"
                tone="bg-accent-violet-bg text-accent-violet-fg"
                title={hit.title}
                hint={hit.subtitle}
                onClick={() => openQuiz(hit)}
              />
            ))}
          </ResultSection>
        ) : null}

        {show("messages") && messageHits.length ? (
          <ResultSection title={t("mobileSearch.messages", { count: countOf("messages") })}>
            {messageHits.map((hit) => (
              <ResultRow
                key={hit.id}
                icon="chat"
                tone="bg-success-bg text-success-fg"
                title={hit.title}
                hint={[hit.subtitle, hit.sender].filter(Boolean).join(" · ")}
                onClick={() => navigate(hit.roomId ? routes.chat(hit.roomId) : routes.chats)}
              />
            ))}
          </ResultSection>
        ) : null}

        {show("people") && people.length ? (
          <ResultSection title={t("mobileSearch.people", { count: countOf("people") })}>
            {people.map((hit) => (
              <ResultRow
                key={hit.id}
                avatar={{ name: hit.title, src: hit.avatarUrl }}
                title={hit.title}
                hint={hit.subtitle}
                onClick={() => navigate(hit.roomId ? routes.chat(hit.roomId) : routes.chats)}
              />
            ))}
          </ResultSection>
        ) : null}
      </div>
    </main>
  );
}

function ResultSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-5 flex flex-col gap-2.5">
      <h2 className="text-body text-ink">{title}</h2>
      <div className="flex flex-col overflow-hidden rounded-xl bg-surface">{children}</div>
    </section>
  );
}

function ResultRow({
  icon,
  tone,
  avatar,
  title,
  hint,
  onClick,
}: {
  icon?: string;
  tone?: string;
  avatar?: { name: string; src: string | null };
  title: string;
  hint: string;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      className="flex items-center gap-3 border-b border-line px-4 py-3.75 text-left transition-colors last:border-b-0 hover:bg-subtle"
      onClick={onClick}
    >
      {avatar ? (
        <Avatar name={avatar.name} src={avatar.src ?? undefined} size="sm" className="[&_.avatar]:size-10" />
      ) : (
        <span className={`grid size-10 shrink-0 place-items-center rounded-lg ${tone ?? ""}`}>
          <Icon name={icon ?? "search"} size={20} />
        </span>
      )}
      <span className="flex min-w-0 flex-1 flex-col">
        <strong className="truncate text-title text-ink">{title}</strong>
        <small className="truncate text-body-sm text-ink-secondary">{hint}</small>
      </span>
      <Icon name="chevron-right" size={20} className="shrink-0 text-icon-secondary" />
    </button>
  );
}
