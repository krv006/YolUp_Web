import { useRef, useState, type ChangeEvent } from "react";
import { BookOpen, CircleAlert, FileText, FileUp, Loader2, Sparkles, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button, LoadingFallback } from "@/shared/ui/legacy";
import { SelectPicker } from "@/shared/ui/legacy/form-pickers";
import type { AiQuizJob } from "../api/quiz.dto";
import { useAiQuizJobs, useStartAiQuiz } from "../model/quiz.queries";

const MATERIAL_ACCEPT = ".pdf,.docx,.pptx,.xlsx,.xlsm,.csv,.txt,.md";
const MIN_QUESTIONS = 5;
const MAX_QUESTIONS = 60;
const MAX_FILE_MB = 20;
const MAX_FILES = 5;
const MAX_TOTAL_MB = 40;
const MAX_MATERIAL_TEXT = 120000;
const MAX_RULES_MB = 5;
const MAX_RULES_TEXT = 30000;
const ACTIVE = ["queued", "processing", "generating"];
/** Faqat tavsiyalar (datalist): har qanday imtihon nomini yozish mumkin — AI uni o'zi biladi. */
const EXAM_SUGGESTIONS = [
  "IELTS Academic Reading", "IELTS General Training Reading", "IELTS Listening", "IELTS Writing",
  "SAT Reading and Writing", "SAT Math", "TOEFL iBT Reading", "Cambridge B2 First (FCE) Reading",
  "CEFR B1", "Milliy sertifikat (matematika)", "DTM test",
];

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
  const [files, setFiles] = useState<File[]>([]);
  const [materialText, setMaterialText] = useState("");
  const [examName, setExamName] = useState("");
  const [rulesFile, setRulesFile] = useState<File | null>(null);
  const [rulesText, setRulesText] = useState("");
  const [count, setCount] = useState(20);
  const [error, setError] = useState<string | null>(null);
  const start = useStartAiQuiz();
  const jobs = useAiQuizJobs();

  function pickMaterial(event: ChangeEvent<HTMLInputElement>) {
    const picked = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (!picked.length) return;
    const big = picked.find((item) => item.size > MAX_FILE_MB * 1024 * 1024);
    if (big) {
      return setError(t("aiPage.fileTooLarge", { size: (big.size / 1024 / 1024).toFixed(1), max: MAX_FILE_MB }));
    }
    // Yangi tanlov oldingilariga QO'SHILADI (bir xil fayl ikki marta qo'shilmaydi)
    const known = new Set(files.map((item) => `${item.name}:${item.size}`));
    const merged = [...files, ...picked.filter((item) => !known.has(`${item.name}:${item.size}`))];
    if (merged.length > MAX_FILES) return setError(t("aiPage.tooManyFiles", { max: MAX_FILES }));
    if (merged.reduce((sum, item) => sum + item.size, 0) > MAX_TOTAL_MB * 1024 * 1024) {
      return setError(t("aiPage.totalTooLarge", { max: MAX_TOTAL_MB }));
    }
    setError(null);
    setFiles(merged);
  }

  function removeFile(index: number) {
    setFiles((current) => current.filter((_, position) => position !== index));
    setError(null);
  }

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
    if (!(count >= MIN_QUESTIONS && count <= MAX_QUESTIONS)) {
      return setError(t("aiPage.countRange", { min: MIN_QUESTIONS, max: MAX_QUESTIONS }));
    }
    setError(null);
    start.mutate(
      {
        files,
        request: {
          topic: topic.trim(),
          subject,
          title: title.trim(),
          questionCount: count,
          rulesFile,
          rulesText: rulesText.trim(),
          materialText: materialText.trim(),
          examName: examName.trim(),
        },
      },
      {
        onSuccess: () => {
          setTopic("");
          setTitle("");
          setFiles([]);
          setMaterialText("");
          setExamName("");
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

        <label className="quiz-topic-field">
          {t("aiPage.examLabel")}
          <input
            list="ai-exam-suggestions"
            value={examName}
            maxLength={120}
            onChange={(event) => setExamName(event.target.value)}
            placeholder={t("aiPage.examPlaceholder")}
          />
          <datalist id="ai-exam-suggestions">
            {EXAM_SUGGESTIONS.map((name) => (
              <option key={name} value={name} />
            ))}
          </datalist>
          <small className="ai-quiz-hint">{t("aiPage.examHint")}</small>
        </label>

        <div className="ai-quiz-row">
          <div className="ai-quiz-field">
            <span>{t("aiPage.materialLabel")}</span>
            <input
              ref={fileInputRef}
              type="file"
              accept={MATERIAL_ACCEPT}
              multiple
              hidden
              onChange={pickMaterial}
            />
            <button
              type="button"
              className={`quiz-generate-button quiz-generate-button--ghost ${files.length ? "is-active" : ""}`}
              onClick={() => fileInputRef.current?.click()}
            >
              <FileUp size={14} /> {files.length === 0 ? t("aiPage.chooseFiles") : t("aiPage.addMoreFiles")}
            </button>
            {files.length ? (
              <ul className="ai-quiz-files">
                {files.map((item, index) => (
                  <li key={`${item.name}-${item.size}`}>
                    <FileText size={13} />
                    <span>{item.name}</span>
                    <button
                      type="button"
                      aria-label={t("aiPage.removeFile", { name: item.name })}
                      onClick={() => removeFile(index)}
                    >
                      <X size={13} />
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
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

        <label className="ai-quiz-field">
          <span>{t("aiPage.materialTextLabel")}</span>
          <textarea
            rows={4}
            maxLength={MAX_MATERIAL_TEXT}
            value={materialText}
            onChange={(event) => setMaterialText(event.target.value)}
            placeholder={t("aiPage.materialTextPlaceholder")}
          />
          <small>{t("aiPage.materialOptionalHint")}</small>
        </label>

        <details className="ai-quiz-details" open={Boolean(rulesFile || rulesText.trim())}>
          <summary>{t("aiPage.rulesToggle")}</summary>
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
        </details>

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
