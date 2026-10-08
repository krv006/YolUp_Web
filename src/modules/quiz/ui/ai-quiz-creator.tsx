import { useRef, useState, type ChangeEvent } from "react";
import { BookOpen, CircleAlert, FileText, FileUp, Loader2, Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button, LoadingFallback } from "@/shared/ui/legacy";
import { SelectPicker } from "@/shared/ui/legacy/form-pickers";
import type { AiQuizJob } from "../api/quiz.dto";
import { useAiQuizJobs, useStartAiQuiz } from "../model/quiz.queries";

const MATERIAL_ACCEPT = ".pdf,.docx,.pptx,.xlsx,.xlsm,.csv,.txt,.md";
const MIN_QUESTIONS = 5;
const MAX_QUESTIONS = 60;
const MAX_FILE_MB = 20;
const MAX_RULES_MB = 5;
const MAX_RULES_TEXT = 30000;
const ACTIVE = ["queued", "processing", "generating"];

export interface AiQuizCreatorProps {
  subjects: ReadonlyArray<{ value: string; label: string }>;
  onOpenQuiz: (quizId: string) => void;
}

/**
 * Material va (ixtiyoriy) imtihon qoidalarini yuklab AI bilan test yaratish. Qoidalar berilsa AI testni
 * shu tuzilmaga qarab (bo'limlar, matn parchalari, turli savollar) tuzadi, aks holda oddiy variantli test.
 */
export function AiQuizCreator({ subjects, onOpenQuiz }: AiQuizCreatorProps) {
  const { t } = useTranslation("quiz");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const rulesInputRef = useRef<HTMLInputElement>(null);
  const [subject, setSubject] = useState("");
  const [topic, setTopic] = useState("");
  const [title, setTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [rulesFile, setRulesFile] = useState<File | null>(null);
  const [rulesText, setRulesText] = useState("");
  const [count, setCount] = useState(20);
  const [error, setError] = useState<string | null>(null);
  const start = useStartAiQuiz();
  const jobs = useAiQuizJobs();

  function pick(event: ChangeEvent<HTMLInputElement>, maxMb: number, key: "fileTooLarge" | "rulesTooLarge") {
    const picked = event.target.files?.[0] ?? null;
    event.target.value = "";
    if (picked && picked.size > maxMb * 1024 * 1024) {
      setError(t(`aiPage.${key}`, { size: (picked.size / 1024 / 1024).toFixed(1), max: maxMb }));
      return null;
    }
    setError(null);
    return picked;
  }

  function submit() {
    if (!subject) return setError(t("aiPage.chooseSubject"));
    if (!topic.trim()) return setError(t("aiPage.enterTopic"));
    if (!file) return setError(t("aiPage.fileRequired"));
    if (!(count >= MIN_QUESTIONS && count <= MAX_QUESTIONS)) {
      return setError(t("aiPage.countRange", { min: MIN_QUESTIONS, max: MAX_QUESTIONS }));
    }
    setError(null);
    start.mutate(
      {
        file,
        request: {
          topic: topic.trim(),
          subject,
          title: title.trim(),
          questionCount: count,
          rulesFile,
          rulesText: rulesText.trim(),
        },
      },
      {
        onSuccess: () => {
          setTopic("");
          setTitle("");
          setFile(null);
          setRulesFile(null);
          setRulesText("");
        },
      }
    );
  }

  return (
    <div className="ai-quiz">
      <section className="portal-card ai-quiz-form group-action-form">
        <div className="ai-quiz-head">
          <span className="workspace-list-icon">
            <Sparkles size={19} />
          </span>
          <div>
            <h2>{t("aiPage.title")}</h2>
            <p>{t("aiPage.description")}</p>
          </div>
        </div>

        <SelectPicker
          label={t("aiPage.subjectLabel")}
          icon={BookOpen}
          searchable
          value={subject}
          onChange={(value) => {
            setSubject(value);
            setError(null);
          }}
          options={subjects.map((item) => ({ value: item.value, label: item.label }))}
        />

        <div className="form-grid-two">
          <label className="quiz-topic-field">
            {t("aiPage.topicLabel")}
            <input
              value={topic}
              onChange={(event) => {
                setTopic(event.target.value);
                setError(null);
              }}
              placeholder={t("aiPage.topicPlaceholder")}
            />
          </label>
          <label className="quiz-topic-field">
            {t("aiPage.titleLabel")}
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder={t("aiPage.titlePlaceholder")}
            />
          </label>
        </div>

        <div className="ai-quiz-row">
          <div className="ai-quiz-field">
            <span>{t("aiPage.materialLabel")}</span>
            <input
              ref={fileInputRef}
              type="file"
              accept={MATERIAL_ACCEPT}
              hidden
              onChange={(event) => {
                const picked = pick(event, MAX_FILE_MB, "fileTooLarge");
                if (picked) setFile(picked);
              }}
            />
            <button
              type="button"
              className={`quiz-generate-button quiz-generate-button--ghost ${file ? "is-active" : ""}`}
              onClick={() => fileInputRef.current?.click()}
            >
              <FileUp size={14} /> {file ? file.name : t("aiPage.chooseFile")}
            </button>
            <small>{t("aiPage.fileHint")}</small>
          </div>
          <label className="ai-quiz-field">
            <span>{t("aiPage.countLabel")}</span>
            <input
              type="number"
              min={MIN_QUESTIONS}
              max={MAX_QUESTIONS}
              value={count}
              onChange={(event) => setCount(Number(event.target.value))}
            />
            <small>{t("aiPage.countHint")}</small>
          </label>
        </div>

        <div className="ai-quiz-rules">
          <div className="ai-quiz-field">
            <span>{t("aiPage.rulesLabel")}</span>
            <input
              ref={rulesInputRef}
              type="file"
              accept={MATERIAL_ACCEPT}
              hidden
              onChange={(event) => {
                const picked = pick(event, MAX_RULES_MB, "rulesTooLarge");
                if (picked) setRulesFile(picked);
              }}
            />
            <button
              type="button"
              className={`quiz-generate-button quiz-generate-button--ghost ${rulesFile ? "is-active" : ""}`}
              onClick={() => rulesInputRef.current?.click()}
            >
              <FileText size={14} /> {rulesFile ? rulesFile.name : t("aiPage.rulesChoose")}
            </button>
          </div>
          <label className="ai-quiz-field">
            <span>{t("aiPage.rulesTextLabel")}</span>
            <textarea
              rows={4}
              maxLength={MAX_RULES_TEXT}
              value={rulesText}
              onChange={(event) => setRulesText(event.target.value)}
              placeholder={t("aiPage.rulesPlaceholder")}
            />
          </label>
          <small className="ai-quiz-hint">{t("aiPage.rulesHint")}</small>
        </div>

        <small className="ai-quiz-hint">{t("aiPage.hint")}</small>
        {error ? <div className="form-alert">{error}</div> : null}
        <div className="dialog-actions">
          <Button loading={start.isPending} onClick={submit}>
            <Sparkles size={15} /> {t("aiPage.submit")}
          </Button>
        </div>
      </section>

      <section className="portal-card ai-quiz-jobs">
        <h2>{t("aiPage.jobsTitle")}</h2>
        {jobs.isLoading ? <LoadingFallback label={t("aiPage.jobsLoading")} /> : null}
        {jobs.isError && !jobs.data ? <p className="ai-quiz-hint">{t("aiPage.jobsError")}</p> : null}
        {jobs.data && !jobs.data.length ? <p className="ai-quiz-hint">{t("aiPage.jobsEmpty")}</p> : null}
        {(jobs.data ?? []).map((job) => (
          <JobRow key={job.id} job={job} onOpenQuiz={onOpenQuiz} />
        ))}
      </section>
    </div>
  );
}

function JobRow({ job, onOpenQuiz }: { job: AiQuizJob; onOpenQuiz: (quizId: string) => void }) {
  const { t } = useTranslation("quiz");
  const active = ACTIVE.includes(job.status);
  const kind =
    job.mode === "rules" ? t("aiPage.modeRules") : job.mode === "simple" ? t("aiPage.modeSimple") : t("aiPage.modeBank");
  return (
    <article className={`ai-quiz-job is-${job.status}`}>
      <span className="workspace-list-icon">
        {active ? <Loader2 size={18} className="spin" /> : job.status === "failed" ? <CircleAlert size={18} /> : <Sparkles size={18} />}
      </span>
      <div>
        <strong>{job.title || job.topic}</strong>
        <small>
          {kind} · {job.summary || t("aiPage.questions", { count: job.questionCount })} · {t(`aiPage.status.${job.status}`)}
        </small>
        {job.status === "failed" ? <small className="ai-quiz-error">{job.error || t("aiPage.failedFallback")}</small> : null}
        {active ? <small>{t("aiPage.waitHint")}</small> : null}
      </div>
      {job.status === "done" && job.quizId ? (
        <Button size="sm" variant="secondary" onClick={() => onOpenQuiz(job.quizId as string)}>
          {t("aiPage.openQuiz")}
        </Button>
      ) : null}
    </article>
  );
}
