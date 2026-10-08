import { useRef, useState, type ChangeEvent } from "react";
import { BookOpen, CircleAlert, FileUp, Loader2, Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button, LoadingFallback } from "@/shared/ui/legacy";
import { SelectPicker } from "@/shared/ui/legacy/form-pickers";
import type { AiQuizJob, AiQuizStandard } from "../api/quiz.dto";
import { useAiQuizJobs, useStartAiQuiz } from "../model/quiz.queries";

const STANDARDS: AiQuizStandard[] = ["uzbmb", "ielts", "sat"];
const MATERIAL_ACCEPT = ".pdf,.docx,.pptx,.xlsx,.xlsm,.csv,.txt,.md";
const MIN_QUESTIONS = 5;
const MAX_QUESTIONS = 60;
const ACTIVE = ["queued", "processing", "generating"];

export interface AiQuizCreatorProps {
  subjects: ReadonlyArray<{ value: string; label: string }>;
  onOpenQuiz: (quizId: string) => void;
}

/** Material yuklab AI bilan test yaratish va yaratilayotgan/tayyor AI testlar ro'yxati. */
export function AiQuizCreator({ subjects, onOpenQuiz }: AiQuizCreatorProps) {
  const { t } = useTranslation("quiz");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [subject, setSubject] = useState("");
  const [topic, setTopic] = useState("");
  const [title, setTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [standard, setStandard] = useState<AiQuizStandard>("uzbmb");
  const [count, setCount] = useState(20);
  const [error, setError] = useState<string | null>(null);
  const start = useStartAiQuiz();
  const jobs = useAiQuizJobs();

  function handleFile(event: ChangeEvent<HTMLInputElement>) {
    setFile(event.target.files?.[0] ?? null);
    event.target.value = "";
    setError(null);
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
      { file, request: { topic: topic.trim(), subject, title: title.trim(), standard, questionCount: count } },
      {
        onSuccess: () => {
          setTopic("");
          setTitle("");
          setFile(null);
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
            <input ref={fileInputRef} type="file" accept={MATERIAL_ACCEPT} hidden onChange={handleFile} />
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
            <span>{t("aiPage.standardLabel")}</span>
            <select value={standard} onChange={(event) => setStandard(event.target.value as AiQuizStandard)}>
              {STANDARDS.map((value) => (
                <option key={value} value={value}>
                  {t(`aiPage.standards.${value}`)}
                </option>
              ))}
            </select>
          </label>
          <label className="ai-quiz-field">
            <span>{t("aiPage.countLabel")}</span>
            <input
              type="number"
              min={MIN_QUESTIONS}
              max={MAX_QUESTIONS}
              value={count}
              onChange={(event) => setCount(Number(event.target.value))}
            />
          </label>
        </div>

        <small className="ai-quiz-hint">{t("aiPage.hint", { min: MIN_QUESTIONS, max: MAX_QUESTIONS })}</small>
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
  return (
    <article className={`ai-quiz-job is-${job.status}`}>
      <span className="workspace-list-icon">
        {active ? <Loader2 size={18} className="spin" /> : job.status === "failed" ? <CircleAlert size={18} /> : <Sparkles size={18} />}
      </span>
      <div>
        <strong>{job.title || job.topic}</strong>
        <small>
          {job.standard ? `${t(`aiPage.standards.${job.standard}`)} · ` : ""}
          {t("aiPage.questions", { count: job.questionCount })} · {t(`aiPage.status.${job.status}`)}
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
