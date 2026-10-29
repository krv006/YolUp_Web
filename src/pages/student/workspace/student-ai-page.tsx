import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { PracticeSession, useExplainMutation, usePracticeMutation } from "@/modules/tutor";
import { ROUTES } from "@/shared/config";
import { useIsCompact } from "@/shared/hooks/use-media-query";
import type { PracticeRequest } from "@/modules/tutor";
import { Icon } from "@/shared/ui/icon";
import { MobilePageHeader, MobileSegment } from "@/shared/ui/mobile-page";
import { WorkspaceShell } from "@/widgets/workspace-shell";
import { FilterChips } from "./filter-chips";

type Mode = "practice" | "explain";

const COUNTS = [3, 5, 10];

const FIELD =
  "w-full rounded-xl border border-transparent bg-subtle px-4 text-body text-ink outline-none placeholder:text-ink-tertiary focus:border-focus focus:bg-surface";

export function StudentAiPage() {
  const { t } = useTranslation("student");
  const navigate = useNavigate();
  const isCompact = useIsCompact();
  const [mode, setMode] = useState<Mode>("practice");
  const modes = [
    { id: "practice" as const, label: t("tutor.modes.practice") },
    { id: "explain" as const, label: t("tutor.modes.explain") },
  ];

  const body = mode === "practice" ? <PracticePanel /> : <ExplainPanel />;

  if (isCompact)
    return (
      <main className="flex h-full flex-col gap-5 overflow-y-auto bg-canvas bg-auth-gradient px-4 pt-5 pb-32 font-body text-ink [&>*]:shrink-0">
        <MobilePageHeader
          title={t("tutor.title")}
          backLabel={t("workspace.back")}
          onBack={() => navigate(ROUTES.student.workspace)}
        />
        <MobileSegment items={modes} value={mode} onChange={setMode} />
        {body}
      </main>
    );

  return (
    <WorkspaceShell eyebrow={t("tutor.eyebrow")} title={t("tutor.title")}>
      <FilterChips items={modes} value={mode} onChange={setMode} />
      <div className="max-w-3xl">{body}</div>
    </WorkspaceShell>
  );
}

function PracticePanel() {
  const { t } = useTranslation("student");
  const practice = usePracticeMutation();
  const [topic, setTopic] = useState("");
  const [material, setMaterial] = useState("");
  const [count, setCount] = useState(5);
  const [request, setRequest] = useState<PracticeRequest | null>(null);

  function run(input: PracticeRequest) {
    setRequest(input);
    practice.mutate(input, { onError: (error) => toast.error(error.message) });
  }

  return (
    <div className="flex flex-col gap-4">
      <form
        className="flex flex-col gap-4 rounded-2xl bg-surface p-4 lg:p-5"
        onSubmit={(event) => {
          event.preventDefault();
          if (topic.trim()) run({ topic: topic.trim(), count, material: material.trim() });
        }}
      >
        <span className="flex items-center gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-accent-violet-bg text-accent-violet-fg">
            <Icon name="auto-awesome" size={20} />
          </span>
          <span className="flex min-w-0 flex-col">
            <strong className="text-title text-ink">{t("tutor.practiceTitle")}</strong>
            <small className="text-body-xs text-ink-secondary">{t("tutor.practiceHint")}</small>
          </span>
        </span>
        <label className="flex flex-col gap-2">
          <span className="text-body-xs text-ink-secondary">{t("tutor.topic")}</span>
          <input
            className={`${FIELD} h-12.5`}
            value={topic}
            maxLength={300}
            placeholder={t("tutor.topicPlaceholder")}
            onChange={(event) => setTopic(event.target.value)}
          />
        </label>
        <label className="flex flex-col gap-2">
          <span className="text-body-xs text-ink-secondary">{t("tutor.material")}</span>
          <textarea
            className={`${FIELD} min-h-24 resize-y py-3`}
            value={material}
            maxLength={3000}
            placeholder={t("tutor.materialPlaceholder")}
            onChange={(event) => setMaterial(event.target.value)}
          />
        </label>
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-body-xs text-ink-secondary">{t("tutor.count")}</span>
          <div className="flex gap-2">
            {COUNTS.map((value) => (
              <button
                key={value}
                type="button"
                aria-pressed={count === value}
                className={`h-9 min-w-11 rounded-full px-3 text-body-sm font-semibold transition-colors ${
                  count === value ? "bg-brand text-on-action" : "border border-line-strong bg-surface text-ink hover:bg-subtle"
                }`}
                onClick={() => setCount(value)}
              >
                {value}
              </button>
            ))}
          </div>
          <button
            type="submit"
            disabled={!topic.trim() || practice.isPending}
            className="ml-auto flex h-11 items-center justify-center gap-2 rounded-full bg-brand px-5 text-button text-ink-inverse transition-colors hover:bg-brand-strong disabled:opacity-60 max-lg:w-full"
          >
            <Icon name="auto-awesome" size={18} />
            {practice.isPending ? t("tutor.generating") : t("tutor.generate")}
          </button>
        </div>
      </form>

      {practice.isPending && !practice.data ? (
        <div className="flex flex-col gap-3" aria-hidden="true">
          {Array.from({ length: 3 }, (_, index) => (
            <i key={index} className="h-40 rounded-2xl bg-skeleton" />
          ))}
        </div>
      ) : null}

      {practice.data ? (
        <PracticeSession
          key={practice.data.questions.map((question) => question.text).join("|")}
          set={practice.data}
          restarting={practice.isPending}
          onRestart={request ? () => run(request) : undefined}
        />
      ) : null}
    </div>
  );
}

function ExplainPanel() {
  const { t } = useTranslation("student");
  const explain = useExplainMutation();
  const [question, setQuestion] = useState("");
  const [wrongAnswer, setWrongAnswer] = useState("");
  const [correctAnswer, setCorrectAnswer] = useState("");
  const result = explain.data;

  return (
    <div className="flex flex-col gap-4">
      <form
        className="flex flex-col gap-4 rounded-2xl bg-surface p-4 lg:p-5"
        onSubmit={(event) => {
          event.preventDefault();
          if (!question.trim()) return;
          explain.mutate(
            { question: question.trim(), wrongAnswer: wrongAnswer.trim(), correctAnswer: correctAnswer.trim() },
            { onError: (error) => toast.error(error.message) }
          );
        }}
      >
        <span className="flex items-center gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-accent-blue-bg text-accent-blue-fg">
            <Icon name="help" size={20} />
          </span>
          <span className="flex min-w-0 flex-col">
            <strong className="text-title text-ink">{t("tutor.explainTitle")}</strong>
            <small className="text-body-xs text-ink-secondary">{t("tutor.explainHint")}</small>
          </span>
        </span>
        <label className="flex flex-col gap-2">
          <span className="text-body-xs text-ink-secondary">{t("tutor.question")}</span>
          <textarea
            className={`${FIELD} min-h-28 resize-y py-3`}
            value={question}
            maxLength={3000}
            placeholder={t("tutor.questionPlaceholder")}
            onChange={(event) => setQuestion(event.target.value)}
          />
        </label>
        <div className="grid gap-4 lg:grid-cols-2">
          <label className="flex flex-col gap-2">
            <span className="text-body-xs text-ink-secondary">{t("tutor.wrongAnswer")}</span>
            <input
              className={`${FIELD} h-12.5`}
              value={wrongAnswer}
              maxLength={500}
              onChange={(event) => setWrongAnswer(event.target.value)}
            />
          </label>
          <label className="flex flex-col gap-2">
            <span className="text-body-xs text-ink-secondary">{t("tutor.correctAnswer")}</span>
            <input
              className={`${FIELD} h-12.5`}
              value={correctAnswer}
              maxLength={500}
              onChange={(event) => setCorrectAnswer(event.target.value)}
            />
          </label>
        </div>
        <button
          type="submit"
          disabled={!question.trim() || explain.isPending}
          className="flex h-11 items-center justify-center gap-2 self-end rounded-full bg-brand px-5 text-button text-ink-inverse transition-colors hover:bg-brand-strong disabled:opacity-60 max-lg:w-full"
        >
          <Icon name="auto-awesome" size={18} />
          {explain.isPending ? t("tutor.thinking") : t("tutor.explain")}
        </button>
      </form>

      {explain.isPending && !result ? <i className="h-40 rounded-2xl bg-skeleton" aria-hidden="true" /> : null}

      {result ? (
        <section className="flex flex-col gap-3 rounded-2xl bg-surface p-4 lg:p-5">
          <strong className="text-title text-ink">{t("tutor.answerTitle")}</strong>
          <p className="text-body-sm whitespace-pre-line text-ink">{result.explanation}</p>
          {result.tip ? (
            <p className="flex items-start gap-2 rounded-xl bg-brand-subtle px-4 py-3 text-body-sm text-brand">
              <Icon name="info" size={18} className="mt-0.5 shrink-0" />
              <span>{result.tip}</span>
            </p>
          ) : null}
          {result.limit ? (
            <small className="text-caption text-ink-tertiary">
              {t("tutor.usage", { used: result.used ?? 0, limit: result.limit })}
            </small>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}
