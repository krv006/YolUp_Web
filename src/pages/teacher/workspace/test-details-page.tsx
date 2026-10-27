import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { quizDisplayTitle, useQuiz, useQuizAttempts, useQuizzes, useUpdateQuiz } from "@/modules/quiz";
import { ROUTES } from "@/shared/config";
import { useIsCompact } from "@/shared/hooks/use-media-query";
import { Icon } from "@/shared/ui/icon";
import { MOBILE_INPUT_SURFACE, MobileFieldLabel, MobilePickerField } from "@/shared/ui/mobile-fields";
import { MobileScreen, MobileWarningNote, mobileButton } from "@/shared/ui/mobile-page";

function localValue(value: string | null): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (part: number) => String(part).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function TestDetailsPage() {
  const { t } = useTranslation("quiz");
  const months = useTranslation("lesson").t("list.months", { returnObjects: true }) as string[];
  const { quizId = null } = useParams();
  const navigate = useNavigate();
  const isCompact = useIsCompact();
  const quiz = useQuiz(quizId);
  const quizzes = useQuizzes(null, isCompact);
  const attempts = useQuizAttempts(quizId, Boolean(quizId) && isCompact);
  const update = useUpdateQuiz();
  const [draft, setDraft] = useState<{ title: string; topic: string; due: string } | null>(null);

  const detail = quiz.data ?? null;
  const values = draft ?? {
    title: detail ? quizDisplayTitle(detail) : "",
    topic: detail?.topic ?? "",
    due: localValue(detail?.dueAt ?? null),
  };
  const topics = useMemo(
    () =>
      [...new Set([values.topic, ...(quizzes.data ?? []).map((item) => item.topic)].filter(Boolean))].map((topic) => ({
        value: topic,
        label: topic,
      })),
    [quizzes.data, values.topic]
  );

  if (!isCompact && quizId) return <Navigate to={ROUTES.teacher.test(quizId)} replace />;

  const locked = (attempts.data ?? []).length > 0;
  const due = values.due ? new Date(values.due) : null;
  const dueLabel =
    due && !Number.isNaN(due.getTime())
      ? `${due.getDate()}-${(months[due.getMonth()] ?? "").slice(0, 3).toLowerCase()}, ${values.due.slice(11, 16)}`
      : t("details.noDue");

  function change(patch: Partial<typeof values>) {
    setDraft({ ...values, ...patch });
  }

  function save() {
    if (!quizId || !values.title.trim()) return;
    update.mutate(
      {
        id: quizId,
        values: { title: values.title.trim(), topic: values.topic, dueAt: values.due || null },
      },
      { onSuccess: () => navigate(ROUTES.teacher.tests) }
    );
  }

  return (
    <MobileScreen
      title={t("details.title")}
      closeLabel={t("details.close")}
      onClose={() => navigate(ROUTES.teacher.tests)}
      footer={
        <button
          type="button"
          className={mobileButton.primary}
          disabled={update.isPending || !detail || !values.title.trim()}
          onClick={save}
        >
          {t("details.save")}
        </button>
      }
    >
      {locked ? <MobileWarningNote className="mt-4">{t("details.lockedNotice")}</MobileWarningNote> : null}

      <div className={`${locked ? "mt-[11px]" : "mt-5"} flex flex-col gap-[11px]`}>
        <MobileFieldLabel gapClassName="gap-[7px]" label={t("newTest.name")}>
          <input
            className={MOBILE_INPUT_SURFACE}
            value={values.title}
            onChange={(event) => change({ title: event.target.value })}
          />
        </MobileFieldLabel>

        <MobileFieldLabel gapClassName="gap-[7px]" label={t("details.topic")}>
          <MobilePickerField
            type="select"
            surface
            value={values.topic}
            display={values.topic || <span className="text-ink-secondary">{t("assignDialog.pick")}</span>}
            ariaLabel={t("details.topic")}
            options={topics}
            onChange={(topic) => change({ topic })}
          />
        </MobileFieldLabel>

        <MobileFieldLabel gapClassName="gap-[7px]" label={t("newTest.due")}>
          <MobilePickerField
            type="datetime-local"
            surface
            value={values.due}
            display={dueLabel}
            ariaLabel={t("newTest.due")}
            onChange={(next) => change({ due: next })}
          />
        </MobileFieldLabel>
      </div>

      <span className="mt-3 text-caption-strong text-ink-secondary uppercase">
        {locked ? t("details.questionsLocked") : t("details.questions")}
      </span>

      <div className="mt-[13px] flex flex-col gap-[13px]">
        {(detail?.questions ?? []).map((question, index) => {
          const body = (
            <>
              <span className="shrink-0">{index + 1}.</span>
              <span className="min-w-0 flex-1 truncate">{question.text || t("editor.noText")}</span>
              <Icon
                name={locked ? "lock-fill" : "chevron-right"}
                size={locked ? 16 : 18}
                className="shrink-0 text-icon-tertiary"
              />
            </>
          );
          const className =
            "flex h-[43px] items-center gap-3 rounded-lg bg-surface/75 px-3.5 text-left text-body-sm text-ink-secondary";
          return locked ? (
            <div key={question.id} className={className}>
              {body}
            </div>
          ) : (
            <button
              key={question.id}
              type="button"
              className={`${className} transition-colors hover:bg-surface`}
              onClick={() => quizId && navigate(ROUTES.teacher.test(quizId))}
            >
              {body}
            </button>
          );
        })}
      </div>
    </MobileScreen>
  );
}
