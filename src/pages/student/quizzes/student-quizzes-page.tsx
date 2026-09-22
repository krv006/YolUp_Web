import { useEffect, useMemo, useState } from "react";
import { FileQuestion, History, ListFilter } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router-dom";
import { toIntlLocale } from "@/shared/i18n";
import { useCourses, useSubjects } from "@/modules/course";
import { QuizAttemptDialog, QuizAttemptsDialog, quizDisplayTitle, useQuizzes } from "@/modules/quiz";
import type { QuizSummary } from "@/shared/types";
import { Button, LoadingFallback, RouteState, PageBackLink } from "@/shared/ui/legacy";
import { SelectPicker } from "@/shared/ui/legacy/form-pickers";

function useQuizHighlight(quizId: string | null, ready: boolean) {
  useEffect(() => {
    if (!quizId || !ready) return;
    document
      .querySelector(`[data-quiz-id="${CSS.escape(quizId)}"]`)
      ?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [quizId, ready]);
}

export function StudentQuizzesPage() {
  const { t, i18n } = useTranslation("quiz");
  const courses = useCourses();
  const quizzes = useQuizzes(null);
  const subjects = useSubjects();
  const [subjectFilter, setSubjectFilter] = useState("");
  const [attemptOf, setAttemptOf] = useState<QuizSummary | null>(null);
  const [historyOf, setHistoryOf] = useState<QuizSummary | null>(null);
  const [params] = useSearchParams();
  const highlightId = params.get("quiz");
  useQuizHighlight(highlightId, (quizzes.data?.length ?? 0) > 0);

  const courseTitleById = useMemo(
    () => new Map((courses.data ?? []).map((course) => [course.id, course.title])),
    [courses.data]
  );

  if (quizzes.isLoading) return <LoadingFallback label={t("studentPage.loading")} />;
  if (quizzes.isError)
    return (
      <RouteState
        eyebrow={t("studentPage.eyebrow")}
        title={t("studentPage.loadError")}
        description={quizzes.error?.message}
        actionLabel={t("studentPage.retry")}
        onAction={quizzes.refetch}
      />
    );

  const all = quizzes.data ?? [];
  const list = subjectFilter ? all.filter((item) => item.subject === subjectFilter) : all;
  const filterOptions = [
    { value: "", label: t("teacherPage.allSubjects") },
    ...(subjects.data ?? [])
      .filter((item) => all.some((quiz) => quiz.subject === item.value))
      .map((item) => ({ value: item.value, label: item.label })),
  ];

  return (
    <div className="portal-page">
      <div className="portal-page-heading">
        <div>
          <PageBackLink />
          <span className="portal-eyebrow">{t("studentPage.allCourses")}</span>
          <h1>{t("studentPage.title")}</h1>
          <p>{t("studentPage.subtitle")}</p>
        </div>
        {filterOptions.length > 1 ? (
          <div className="quiz-subject-filter">
            <SelectPicker
              label={t("teacherPage.subjectFilterLabel")}
              hideLabel
              searchable
              icon={ListFilter}
              value={subjectFilter}
              onChange={setSubjectFilter}
              options={filterOptions}
            />
          </div>
        ) : null}
      </div>

      <div className="student-workspace-list">
        {list.map((item) => (
          <article
            key={item.id}
            data-quiz-id={item.id}
            className={item.id === highlightId ? "is-highlighted" : ""}
          >
            <span className="workspace-list-icon">
              <FileQuestion size={20} />
            </span>
            <div>
              <strong>{quizDisplayTitle(item)}</strong>
              <p>
                {courseTitleById.get(item.courseId) ?? t("studentPage.courseFallback")} ·{" "}
                {item.dueAt
                  ? t("studentPage.dueLabel", {
                      date: new Intl.DateTimeFormat(toIntlLocale(i18n.language), {
                        dateStyle: "medium",
                        timeStyle: "short",
                      }).format(new Date(item.dueAt)),
                    })
                  : t("studentPage.noDue")}{" "}
                · {t("studentPage.questionCount", { count: item.questionCount })}
              </p>
            </div>
            <button
              className="icon-button"
              aria-label={t("studentPage.historyAria")}
              onClick={() => setHistoryOf(item)}
            >
              <History size={16} />
            </button>
            <Button size="sm" onClick={() => setAttemptOf(item)}>
              {t("studentPage.solveButton")}
            </Button>
          </article>
        ))}
        {!list.length ? <p className="portal-muted">{t("studentPage.empty")}</p> : null}
      </div>

      <QuizAttemptDialog
        quizId={attemptOf?.id ?? null}
        open={Boolean(attemptOf)}
        onOpenChange={(open) => {
          if (!open) setAttemptOf(null);
        }}
      />
      <QuizAttemptsDialog
        quizId={historyOf?.id ?? null}
        open={Boolean(historyOf)}
        onOpenChange={(open) => {
          if (!open) setHistoryOf(null);
        }}
        title={historyOf ? t("studentPage.attemptsOfTitle", { title: historyOf.title }) : undefined}
      />
    </div>
  );
}
