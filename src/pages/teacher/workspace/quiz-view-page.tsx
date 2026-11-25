import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import { useCourse } from "@/modules/course";
import { MathText, quizDisplayTitle, useQuiz } from "@/modules/quiz";
import { ROUTES } from "@/shared/config";
import { useIsCompact } from "@/shared/hooks/use-media-query";
import { formatDateTime } from "@/shared/lib";
import type { QuizQuestion } from "@/shared/types";
import { Icon } from "@/shared/ui/icon";
import { MobilePageHeader } from "@/shared/ui/mobile-page";
import { WorkspaceShell, workspaceAction, workspaceGhostAction } from "@/widgets/workspace-shell";

function AnswerKey({ question }: { question: QuizQuestion }) {
  const { t } = useTranslation("quiz");
  const key = question.answerKey;
  const pill = "rounded-full bg-success-bg px-3 py-1 text-body-sm text-success-fg";

  if (question.type === "single" || question.type === "multiple") {
    return (
      <ul className="flex flex-col gap-1.5">
        {question.options.map((option) => (
          <li
            key={option.id}
            className={`flex items-start gap-2.5 rounded-lg px-3 py-2 text-body-sm ${
              option.isCorrect ? "bg-success-bg text-success-fg" : "bg-subtle text-ink"
            }`}
          >
            <Icon name={option.isCorrect ? "check-circle" : "radio-unchecked"} size={18} className="mt-px shrink-0" />
            <span className="min-w-0 flex-1 break-words">
              <MathText text={option.text} size={15} />
            </span>
          </li>
        ))}
      </ul>
    );
  }

  const values: string[] =
    question.type === "true_false" && key?.correctBool !== undefined
      ? [key.correctBool ? t("view.true") : t("view.false")]
      : question.type === "matching"
        ? (key?.pairs ?? []).map((pair) => `${pair.left} → ${pair.right}`)
        : question.type === "ordering"
          ? (key?.items ?? []).map((item, index) => `${index + 1}. ${item}`)
          : question.type === "fill_blank"
            ? (key?.blanks ?? []).map((blank, index) => `${index + 1}: ${blank.answers.join(" / ")}`)
            : (key?.acceptedAnswers ?? []);

  if (!values.length) {
    return <p className="text-body-sm text-ink-tertiary">{question.type === "essay" ? t("view.essay") : t("view.noKey")}</p>;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {values.map((value) => (
        <span key={value} className={pill}>
          <MathText text={value} size={15} />
        </span>
      ))}
    </div>
  );
}

function QuestionCard({ question, index }: { question: QuizQuestion; index: number }) {
  const { t } = useTranslation("quiz");
  return (
    <article className="flex flex-col gap-3 rounded-xl bg-surface p-4 lg:p-5">
      <div className="flex items-start gap-2">
        <strong className="text-title-sm text-brand">{index + 1}.</strong>
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          {question.text ? (
            <p className="text-body break-words whitespace-pre-wrap text-ink">
              <MathText text={question.text} />
            </p>
          ) : null}
          {question.image?.url ? (
            <img className="max-h-72 w-fit max-w-full rounded-lg object-contain" src={question.image.url} alt="" />
          ) : null}
          {question.textAfter ? (
            <p className="text-body break-words whitespace-pre-wrap text-ink">
              <MathText text={question.textAfter} />
            </p>
          ) : null}
        </div>
        <span className="shrink-0 rounded-full bg-subtle px-2 py-0.5 text-caption-strong text-ink-secondary">
          {t("view.points", { count: question.points })}
        </span>
      </div>
      <small className="text-caption text-ink-tertiary">{t(`types.${question.type}`)}</small>
      <AnswerKey question={question} />
    </article>
  );
}

export function QuizViewPage() {
  const { t } = useTranslation("quiz");
  const { quizId = "" } = useParams();
  const navigate = useNavigate();
  const isCompact = useIsCompact();
  const quiz = useQuiz(quizId || null);
  const course = useCourse(quiz.data?.courseId || null);
  const data = quiz.data;
  const title = data ? quizDisplayTitle(data) : t("view.title");

  const meta = data
    ? [
        course.data?.title ?? "",
        data.opensAt ? t("view.opens", { date: formatDateTime(data.opensAt) }) : "",
        data.dueAt ? t("view.due", { date: formatDateTime(data.dueAt) }) : "",
        t("view.questions", { count: data.questions.length }),
      ].filter(Boolean)
    : [];

  const actions = (
    <>
      <button type="button" className={workspaceGhostAction} onClick={() => navigate(ROUTES.teacher.testResults(quizId))}>
        <Icon name="bar-chart" size={18} />
        {t("view.results")}
      </button>
      <button type="button" className={workspaceAction} onClick={() => navigate(ROUTES.teacher.test(quizId))}>
        <Icon name="edit" size={18} />
        {t("view.edit")}
      </button>
    </>
  );

  let body: ReactNode;
  if (quiz.isLoading) {
    body = (
      <div className="flex flex-col gap-3" aria-hidden="true">
        {Array.from({ length: 3 }, (_, index) => (
          <span key={index} className="h-32 animate-pulse rounded-xl bg-skeleton motion-reduce:animate-none" />
        ))}
      </div>
    );
  } else if (quiz.isError || !data) {
    body = <p className="rounded-xl bg-surface px-5 py-8 text-center text-body-sm text-ink-secondary">{t("view.loadError")}</p>;
  } else {
    body = (
      <>
        {meta.length ? (
          <div className="flex flex-wrap gap-2">
            {meta.map((item) => (
              <span key={item} className="rounded-full bg-surface px-3 py-1.5 text-body-sm text-ink-secondary">
                {item}
              </span>
            ))}
          </div>
        ) : null}
        {data.description ? <p className="text-body-sm whitespace-pre-wrap text-ink-secondary">{data.description}</p> : null}
        <div className="flex flex-col gap-3">
          {data.questions.map((question, index) => (
            <QuestionCard key={question.id} question={question} index={index} />
          ))}
        </div>
      </>
    );
  }

  if (isCompact) {
    return (
      <main className="flex h-full flex-col gap-4 overflow-y-auto bg-canvas bg-auth-gradient px-4 pt-5 pb-32 font-body text-ink">
        <MobilePageHeader title={title} backLabel={t("view.back")} onBack={() => (window.history.length > 1 ? navigate(-1) : navigate(ROUTES.teacher.tests))} />
        <div className="grid grid-cols-2 gap-2 [&>button]:justify-center">{actions}</div>
        {body}
      </main>
    );
  }

  return (
    <WorkspaceShell backTo={ROUTES.teacher.tests} eyebrow={t("view.eyebrow")} title={title} action={actions}>
      {body}
    </WorkspaceShell>
  );
}
