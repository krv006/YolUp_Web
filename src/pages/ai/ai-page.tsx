import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useCourses, useSubjects } from "@/modules/course";
import { AiQuizCreator, useQuizzes, quizDisplayTitle } from "@/modules/quiz";
import { Icon } from "@/shared/ui/icon";

export function AiPage() {
  const { t } = useTranslation("quiz");
  const navigate = useNavigate();
  const subjects = useSubjects();
  const courses = useCourses();
  const quizzes = useQuizzes(null);

  const drafts = (quizzes.data ?? [])
    .filter((quiz) => quiz.status === "draft")
    .slice(0, 6);

  return (
    <div className="flex h-full min-h-0 flex-col gap-4 overflow-y-auto bg-canvas p-4 lg:flex-row lg:gap-6 lg:p-6">
      <div className="flex min-w-0 flex-1 flex-col gap-4">
        <p className="text-body-sm text-ink-secondary">{t("aiPage.description")}</p>
        <AiQuizCreator
          subjects={subjects.data ?? []}
          courses={(courses.data ?? []).map((course) => ({ id: course.id, title: course.title }))}
          onOpenQuiz={(quizId) => navigate(`../quizzes?quiz=${quizId}`)}
        />
      </div>

      <aside className="flex w-full shrink-0 flex-col gap-3 lg:w-[360px]">
        <h2 className="text-title text-ink">{t("aiPage.myTestsTitle")}</h2>

        {drafts.length ? (
          drafts.map((quiz) => (
            <article
              key={quiz.id}
              className="flex flex-col gap-3 rounded-2xl border border-line bg-surface p-4"
            >
              <div className="flex items-start gap-3">
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-action text-on-action">
                  <Icon name="assign" size={18} />
                </span>
                <span className="flex min-w-0 flex-1 flex-col">
                  <strong className="truncate text-label-strong text-ink">
                    {quizDisplayTitle(quiz)}
                  </strong>
                  <small className="truncate text-caption text-ink-tertiary">
                    {[quiz.subjectLabel, t("teacherPage.questionCount", { count: quiz.questionCount })]
                      .filter(Boolean)
                      .join(" · ")}
                  </small>
                </span>
                <span className="shrink-0 rounded-full bg-success-bg px-2.5 py-1 text-caption-strong text-success-text">
                  {t("aiPage.readyBadge")}
                </span>
              </div>

              <button
                type="button"
                className="flex h-11 items-center justify-center gap-2 rounded-xl bg-action-subtle text-label-strong text-action transition-opacity hover:opacity-80"
                onClick={() => navigate(`../quizzes?quiz=${quiz.id}`)}
              >
                <Icon name="eye" size={17} /> {t("aiPage.openTest")}
              </button>
            </article>
          ))
        ) : (
          <div className="flex flex-col items-center gap-2 rounded-2xl border border-line bg-surface px-6 py-10 text-center">
            <span className="grid size-12 place-items-center rounded-full bg-subtle text-ink-tertiary">
              <Icon name="assign" size={22} />
            </span>
            <strong className="text-label-strong text-ink">{t("aiPage.myTestsEmpty")}</strong>
            <small className="text-caption text-ink-tertiary">{t("aiPage.myTestsHint")}</small>
          </div>
        )}
      </aside>
    </div>
  );
}
