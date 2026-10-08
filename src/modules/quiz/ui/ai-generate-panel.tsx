import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { FileUp, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { quizApi, type ImportedQuiz } from "../api/quiz.api";
import type { AiQuizStandard } from "../api/quiz.dto";
import { mapImportWarningDtos } from "../lib/quiz.mappers";
import { quizErrorMessage } from "../lib/quiz-errors";
import { useAiQuizJob, useStartAiQuiz } from "../model/quiz.queries";

const STANDARDS: AiQuizStandard[] = ["uzbmb", "ielts", "sat"];
const MATERIAL_ACCEPT = ".pdf,.docx,.pptx,.xlsx,.xlsm,.csv,.txt,.md";
const MIN_QUESTIONS = 5;
const MAX_QUESTIONS = 60;

interface AiGeneratePanelProps {
  /** Dialogdagi mavzu/guruh/fan maydonlarini tekshiradi; xato matnini qaytaradi. */
  validateTarget: () => string | null;
  /** Dialogdagi mavzu/guruh/fan/nom qiymatlari. */
  getRequest: () => { topic: string; courseId?: string | null; subject?: string; title?: string };
  onCreated: (result: ImportedQuiz) => void;
  onError: (message: string | null) => void;
}

/** Material yuklab AI bilan test yaratish: ish fonda bajariladi, tayyor bo'lgach qoralama test ochiladi. */
export function AiGeneratePanel({ validateTarget, getRequest, onCreated, onError }: AiGeneratePanelProps) {
  const { t } = useTranslation("quiz");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [standard, setStandard] = useState<AiQuizStandard>("uzbmb");
  const [count, setCount] = useState(20);
  const [jobId, setJobId] = useState<string | null>(null);
  const start = useStartAiQuiz();
  const job = useAiQuizJob(jobId);
  const status = job.data?.status;
  const finishedRef = useRef<string | null>(null);

  useEffect(() => {
    if (!jobId || status !== "done" || !job.data?.quiz || finishedRef.current === jobId) return;
    finishedRef.current = jobId;
    const warnings = mapImportWarningDtos(job.data.warnings);
    quizApi
      .getById(String(job.data.quiz))
      .then((quiz) => onCreated({ quiz, warnings }))
      .catch((error: unknown) => onError(quizErrorMessage(error)));
  }, [jobId, status, job.data, onCreated, onError]);

  function handleFile(event: ChangeEvent<HTMLInputElement>) {
    setFile(event.target.files?.[0] ?? null);
    event.target.value = "";
  }

  function handleStart() {
    const targetError = validateTarget();
    if (targetError) return onError(targetError);
    if (!file) return onError(t("createDialog.ai.fileRequired"));
    if (count < MIN_QUESTIONS || count > MAX_QUESTIONS) {
      return onError(t("createDialog.ai.countRange", { min: MIN_QUESTIONS, max: MAX_QUESTIONS }));
    }
    onError(null);
    start.mutate(
      { file, request: { ...getRequest(), standard, questionCount: count } },
      { onSuccess: (created) => setJobId(created.id) }
    );
  }

  function handleRetry() {
    setJobId(null);
    finishedRef.current = null;
    onError(null);
  }

  if (jobId) {
    const failed = status === "failed";
    return (
      <div className="quiz-google-import" role="status" aria-live="polite">
        {failed ? (
          <>
            <strong>{t("createDialog.ai.failedTitle")}</strong>
            <small>{job.data?.error || t("createDialog.ai.failedFallback")}</small>
            <button type="button" className="quiz-generate-button" onClick={handleRetry}>
              {t("createDialog.ai.retry")}
            </button>
          </>
        ) : (
          <>
            <strong>
              <Loader2 size={14} className="spin" /> {t(`createDialog.ai.status.${status ?? "queued"}`)}
            </strong>
            <small>{t("createDialog.ai.waitHint")}</small>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="quiz-google-import">
      <input ref={fileInputRef} type="file" accept={MATERIAL_ACCEPT} hidden onChange={handleFile} />
      <button
        type="button"
        className="quiz-generate-button quiz-generate-button--ghost"
        onClick={() => fileInputRef.current?.click()}
      >
        <FileUp size={14} /> {file ? file.name : t("createDialog.ai.chooseFile")}
      </button>
      <select
        aria-label={t("createDialog.ai.standardLabel")}
        value={standard}
        onChange={(event) => setStandard(event.target.value as AiQuizStandard)}
      >
        {STANDARDS.map((value) => (
          <option key={value} value={value}>
            {t(`createDialog.ai.standards.${value}`)}
          </option>
        ))}
      </select>
      <input
        type="number"
        min={MIN_QUESTIONS}
        max={MAX_QUESTIONS}
        aria-label={t("createDialog.ai.countLabel")}
        value={count}
        onChange={(event) => setCount(Number(event.target.value))}
      />
      <button
        type="button"
        className="quiz-generate-button"
        disabled={start.isPending}
        onClick={handleStart}
      >
        {start.isPending ? t("createDialog.importButtonLoading") : t("createDialog.ai.submit")}
      </button>
      <small>{t("createDialog.ai.hint", { min: MIN_QUESTIONS, max: MAX_QUESTIONS })}</small>
    </div>
  );
}
