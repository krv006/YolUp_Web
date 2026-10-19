import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/modules/auth";
import { useConversations } from "@/modules/conversation";
import { useCourses } from "@/modules/course";
import { useLessons } from "@/modules/lesson";
import { quizDisplayTitle, useQuizzes } from "@/modules/quiz";
import { ROLES } from "@/shared/constants";
import { Icon } from "@/shared/ui/icon";

type Filter = "all" | "groups" | "lessons" | "quizzes" | "messages";

export function WorkspaceSearchPage() {
  const { t } = useTranslation("workspace");
  const { t: tl } = useTranslation("lesson");
  const navigate = useNavigate();
  const { user } = useAuth();
  const isStudent = user?.role === ROLES.STUDENT;
  const basePath = isStudent ? "/student/chats" : "/teacher/chats";

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
    () => (enabled ? (lessons.data ?? []).filter((item) => matches(item.title)) : []),
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
    return `${date.getDate()}-${(months[date.getMonth()] ?? "").toLowerCase()}, ${time}`;
  }

  return (
    <div className="flex h-full flex-col bg-canvas">
      <header className="flex shrink-0 items-center gap-3 px-4 py-3 lg:px-6">
        <button
          type="button"
          className="grid size-10 shrink-0 place-items-center rounded-full text-ink transition-colors hover:bg-subtle"
          onClick={() => navigate(-1)}
          aria-label={t("searchTitle")}
        >
          <Icon name="arrow-back" size={22} />
        </button>
        <label className="flex h-12 flex-1 items-center gap-3 rounded-full border border-focus bg-surface px-4">
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
              className="grid size-7 shrink-0 place-items-center rounded-full text-ink-tertiary hover:text-ink"
              onClick={() => setTerm("")}
              aria-label={t("searchTitle")}
            >
              <Icon name="add" size={18} className="rotate-45" />
            </button>
          ) : null}
        </label>
      </header>

      <div className="flex shrink-0 items-center gap-2 overflow-x-auto px-4 pb-3 lg:px-6">
        {FILTERS.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`flex h-9 shrink-0 items-center rounded-full px-3.5 text-caption-strong transition-colors ${
              filter === item.id
                ? "bg-subtle text-ink"
                : "bg-surface text-ink-secondary hover:bg-subtle"
            }`}
            onClick={() => setFilter(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-4 pb-6 lg:px-6">
        {!enabled ? (
          <p className="px-1 text-body-sm text-ink-tertiary">{t("searchHint")}</p>
        ) : total === 0 ? (
          <p className="px-1 text-body-sm text-ink-tertiary">{t("searchEmpty", { query: term })}</p>
        ) : null}

        {show("groups") && groups.length ? (
          <section className="flex flex-col gap-2">
            <span className="px-1 text-caption-strong tracking-wide text-ink-tertiary uppercase">
              {t("sectionGroups", { count: groups.length })}
            </span>
            <div className="flex flex-col divide-y divide-line overflow-hidden rounded-xl border border-line bg-surface">
              {groups.map((course) => (
                <button
                  key={course.id}
                  type="button"
                  className="flex items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-subtle"
                  onClick={() => navigate(basePath)}
                >
                  <span className="grid size-10 shrink-0 place-items-center rounded-full bg-action-subtle font-heading text-label-strong text-action">
                    {course.title.slice(0, 2).toUpperCase()}
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col">
                    <strong className="truncate text-label-strong text-ink">{course.title}</strong>
                    <small className="truncate text-caption text-ink-tertiary">
                      {t("groupMeta", { count: course.studentCount ?? 0 })} ·{" "}
                      {course.subjectLabel || course.subject}
                    </small>
                  </span>
                </button>
              ))}
            </div>
          </section>
        ) : null}

        {show("lessons") && lessonHits.length ? (
          <section className="flex flex-col gap-2">
            <span className="px-1 text-caption-strong tracking-wide text-ink-tertiary uppercase">
              {t("sectionLessons", { count: lessonHits.length })}
            </span>
            <div className="flex flex-col divide-y divide-line overflow-hidden rounded-xl border border-line bg-surface">
              {lessonHits.map((item) => (
                <div key={item.id} className="flex items-center gap-3 px-4 py-3">
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-action text-on-action">
                    <Icon name="nav-calendar" size={18} />
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col">
                    <strong className="truncate text-label-strong text-ink">{item.title}</strong>
                    <small className="truncate text-caption text-ink-tertiary">
                      {item.courseTitle} · {lessonMoment(item.startsAt)}
                    </small>
                  </span>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {show("quizzes") && quizHits.length ? (
          <section className="flex flex-col gap-2">
            <span className="px-1 text-caption-strong tracking-wide text-ink-tertiary uppercase">
              {t("sectionQuizzes", { count: quizHits.length })}
            </span>
            <div className="flex flex-col divide-y divide-line overflow-hidden rounded-xl border border-line bg-surface">
              {quizHits.map((quiz) => (
                <button
                  key={quiz.id}
                  type="button"
                  className="flex items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-subtle"
                  onClick={() => navigate(`${basePath}/quizzes?quiz=${quiz.id}`)}
                >
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-action text-on-action">
                    <Icon name="assign" size={18} />
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col">
                    <strong className="truncate text-label-strong text-ink">
                      {quizDisplayTitle(quiz)}
                    </strong>
                    <small className="truncate text-caption text-ink-tertiary">
                      {quiz.status === "draft" ? t("draft") : t("published")} ·{" "}
                      {t("quizQuestions", { count: quiz.questionCount })}
                    </small>
                  </span>
                </button>
              ))}
            </div>
          </section>
        ) : null}

        {show("messages") && messageHits.length ? (
          <section className="flex flex-col gap-2">
            <span className="px-1 text-caption-strong tracking-wide text-ink-tertiary uppercase">
              {t("sectionMessages", { count: messageHits.length })}
            </span>
            <div className="flex flex-col divide-y divide-line overflow-hidden rounded-xl border border-line bg-surface">
              {messageHits.map((room) => (
                <button
                  key={room.id}
                  type="button"
                  className="flex items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-subtle"
                  onClick={() => navigate(`${basePath}/${room.id}`)}
                >
                  <span className="grid size-10 shrink-0 place-items-center rounded-full bg-action-subtle font-heading text-label-strong text-action">
                    {room.title.slice(0, 2).toUpperCase()}
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col">
                    <strong className="truncate text-label-strong text-ink">{room.title}</strong>
                    <small className="truncate text-caption text-ink-tertiary">
                      {room.lastMessage}
                    </small>
                  </span>
                </button>
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </div>
  );
}
