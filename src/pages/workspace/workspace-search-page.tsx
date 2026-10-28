import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useIsStudent, useRoleRoutes } from "@/modules/auth";
import { useConversations } from "@/modules/conversation";
import { useCourses } from "@/modules/course";
import { useLessons } from "@/modules/lesson";
import { quizDisplayTitle, useQuizzes } from "@/modules/quiz";
import { ROUTES } from "@/shared/config";
import { Icon } from "@/shared/ui/icon";
import { MobileEmptyCard, MobilePageHeader, MobileSegment } from "@/shared/ui/mobile-page";

type Filter = "all" | "groups" | "lessons" | "quizzes" | "messages";

export function WorkspaceSearchPage() {
  const { t } = useTranslation("workspace");
  const { t: tl } = useTranslation("lesson");
  const navigate = useNavigate();
  const isStudent = useIsStudent();
  const routes = useRoleRoutes();

  const [term, setTerm] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const query = term.trim().toLowerCase();
  const enabled = query.length >= 2;

  const courses = useCourses();
  const lessons = useLessons({ page_size: 200 });
  const quizzes = useQuizzes(null);
  const conversations = useConversations(isStudent ? "student" : "teacher");
  const months = tl("list.months", { returnObjects: true }) as string[];

  function matches(value: string | null | undefined): boolean {
    return Boolean(value && value.toLowerCase().includes(query));
  }

  const groups = useMemo(
    () => (enabled ? (courses.data ?? []).filter((item) => matches(item.title)) : []),
    [courses.data, query, enabled]
  );
  const lessonHits = useMemo(
    () => (enabled
        ? (lessons.data ?? []).filter((item) => matches(item.title) || matches(item.courseTitle))
        : []),
    [lessons.data, query, enabled]
  );
  const quizHits = useMemo(
    () => (enabled ? (quizzes.data ?? []).filter((item) => matches(quizDisplayTitle(item))) : []),
    [quizzes.data, query, enabled]
  );
  const messageHits = useMemo(
    () =>
      enabled
        ? (conversations.data ?? []).filter(
            (item) => matches(item.title) || matches(item.lastMessage)
          )
        : [],
    [conversations.data, query, enabled]
  );

  const total = groups.length + lessonHits.length + quizHits.length + messageHits.length;

  const FILTERS: Array<{ id: Filter; label: string }> = [
    { id: "all", label: t("filterAll", { count: total }) },
    { id: "groups", label: t("filterGroups") },
    { id: "lessons", label: t("filterLessons") },
    { id: "quizzes", label: t("filterQuizzes") },
    { id: "messages", label: t("filterMessages") },
  ];

  const show = (id: Filter) => filter === "all" || filter === id;

  function lessonMoment(value: string): string {
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

        {enabled && total > 0 ? (
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
        ) : total === 0 ? (
          <div className="mt-5">
            <MobileEmptyCard
              icon="search"
              title={t("mobileSearch.emptyTitle")}
              description={t("mobileSearch.emptyHint", { query: term.trim() })}
            />
          </div>
        ) : null}

        {show("groups") && groups.length ? (
          <ResultSection title={t("mobileSearch.groups", { count: groups.length })}>
            {groups.map((course) => (
              <ResultRow
                key={course.id}
                icon="person"
                tone="bg-brand-subtle text-ink"
                title={course.title}
                hint={`${t("groupMeta", { count: course.studentCount ?? 0 })} · ${course.subjectLabel || course.subject}`}
                onClick={() => {
                  const room = conversations.data?.find((item) => item.courseId === course.id);
                  navigate(room ? routes.chat(room.id) : routes.chats);
                }}
              />
            ))}
          </ResultSection>
        ) : null}

        {show("lessons") && lessonHits.length ? (
          <ResultSection title={t("mobileSearch.lessons", { count: lessonHits.length })}>
            {lessonHits.map((item) => (
              <ResultRow
                key={item.id}
                icon="clock"
                tone="bg-accent-teal-bg text-accent-teal-fg"
                title={item.title ? `${item.courseTitle} — ${item.title}` : item.courseTitle}
                hint={lessonMoment(item.startsAt)}
                onClick={() => navigate(routes.schedule)}
              />
            ))}
          </ResultSection>
        ) : null}

        {show("quizzes") && quizHits.length ? (
          <ResultSection title={t("mobileSearch.quizzes", { count: quizHits.length })}>
            {quizHits.map((quiz) => (
              <ResultRow
                key={quiz.id}
                icon="quiz"
                tone="bg-accent-violet-bg text-accent-violet-fg"
                title={quizDisplayTitle(quiz)}
                hint={`${quiz.status === "draft" ? t("draft") : t("published")} · ${t("quizQuestions", { count: quiz.questionCount })}`}
                onClick={() =>
                  navigate(
                    isStudent
                      ? ROUTES.student.test(quiz.id)
                      : quiz.status === "draft"
                        ? ROUTES.teacher.test(quiz.id)
                        : ROUTES.teacher.testResults(quiz.id)
                  )
                }
              />
            ))}
          </ResultSection>
        ) : null}

        {show("messages") && messageHits.length ? (
          <ResultSection title={t("mobileSearch.messages", { count: messageHits.length })}>
            {messageHits.map((room) => (
              <ResultRow
                key={room.id}
                icon="chat"
                tone="bg-success-bg text-success-fg"
                title={room.title}
                hint={room.lastMessage}
                onClick={() => navigate(routes.chat(room.id))}
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
  title,
  hint,
  onClick,
}: {
  icon: string;
  tone: string;
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
      <span className={`grid size-10 shrink-0 place-items-center rounded-lg ${tone}`}>
        <Icon name={icon} size={20} />
      </span>
      <span className="flex min-w-0 flex-1 flex-col">
        <strong className="truncate text-title text-ink">{title}</strong>
        <small className="truncate text-body-sm text-ink-secondary">{hint}</small>
      </span>
      <Icon name="chevron-right" size={20} className="shrink-0 text-icon-secondary" />
    </button>
  );
}
