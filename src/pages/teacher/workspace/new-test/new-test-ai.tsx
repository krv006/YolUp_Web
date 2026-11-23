import { useRef, useState, type DragEvent } from "react";
import { useTranslation } from "react-i18next";
import { useCourses } from "@/modules/course";
import {
  AI_DEFAULT_QUESTIONS,
  AI_EXAM_FORMATS,
  AI_MATERIAL_ACCEPT,
  AI_MATERIAL_MAX_FILES,
  AI_MAX_QUESTIONS,
  AI_MIN_QUESTIONS,
  aiJobStep,
  checkAiForm,
  checkAiMaterials,
  isAiJobActive,
  useAiQuizJobs,
  useQuiz,
  useStartAiQuiz,
  type AiQuizJob,
  type AiQuizRequest,
} from "@/modules/quiz";
import { Icon } from "@/shared/ui/icon";
import { CARD, FIELD, LABEL, PRIMARY_BUTTON, SECONDARY_BUTTON, SELECT } from "./styles";

const SIMPLE = "simple";
const OTHER = "other";
const NO_GROUP = "";
type Language = NonNullable<AiQuizRequest["language"]>;
const LANGUAGES: Array<{ value: Language; key: string }> = [
  { value: "", key: "auto" },
  { value: "uz", key: "uz" },
  { value: "uz_cyrl", key: "uzCyrl" },
  { value: "ru", key: "ru" },
  { value: "en", key: "en" },
  { value: "tr", key: "tr" },
];

interface Tracked {
  jobId: string;
  requested: number;
}

export interface NewTestAiProps {
  onOpenQuiz: (quizId: string) => void;
}

/** «AI bilan yaratish»: Material → Sozlamalar → Yaratish; keyin jarayon va hisobot (savollar tayyor / so'ralgan). */
export function NewTestAi({ onOpenQuiz }: NewTestAiProps) {
  const { t } = useTranslation("quiz");
  const courses = useCourses();
  const jobs = useAiQuizJobs();
  const start = useStartAiQuiz();
  const fileRef = useRef<HTMLInputElement>(null);

  const [files, setFiles] = useState<File[]>([]);
  const [text, setText] = useState("");
  const [count, setCount] = useState(String(AI_DEFAULT_QUESTIONS));
  const [format, setFormat] = useState(SIMPLE);
  const [customExam, setCustomExam] = useState("");
  // "Avto": til fani (ingliz/rus/turk tili) bo'lsa test shu tilda, boshqa fanlarda o'zbekcha — o'qituvchi tilni qayta tanlab yurmaydi
  const [language, setLanguage] = useState<Language>("");
  const [topic, setTopic] = useState("");
  const [courseId, setCourseId] = useState(NO_GROUP);
  const [error, setError] = useState<string | null>(null);
  const [over, setOver] = useState(false);
  const [tracked, setTracked] = useState<Tracked | null>(null);

  const simple = format === SIMPLE;
  const examName = simple ? "" : format === OTHER ? customExam.trim() : format;

  // Sahifa qayta ochilsa ham ishlayotgan ish ko'rinadi va tugagach hisobot chiqadi
  const running = (jobs.data ?? []).find((job) => isAiJobActive(job.status)) ?? null;
  if (!tracked && running) setTracked({ jobId: running.id, requested: running.questionCount });
  const active = tracked;
  const job = active ? ((jobs.data ?? []).find((item) => item.id === active.jobId) ?? null) : null;

  function addFiles(picked: File[]) {
    if (!picked.length) return;
    const known = new Set(files.map((file) => `${file.name}:${file.size}`));
    const merged = [...files, ...picked.filter((file) => !known.has(`${file.name}:${file.size}`))];
    const problem = checkAiMaterials(merged);
    if (problem) {
      setError(t(`ai.material.${problem.kind}`, problem));
      return;
    }
    setError(null);
    setFiles(merged);
  }

  function drop(event: DragEvent) {
    event.preventDefault();
    setOver(false);
    addFiles(Array.from(event.dataTransfer.files));
  }

  function submit() {
    const problem = checkAiForm({
      fileCount: files.length,
      text,
      topic,
      simple,
      examName,
      count: Number(count),
    });
    if (problem) {
      setError(
        problem === "countRange"
          ? t("aiPage.countRange", { min: AI_MIN_QUESTIONS, max: AI_MAX_QUESTIONS })
          : problem === "enterExam"
            ? t("aiPage.enterExam")
            : t("newPage.ai.needMaterial")
      );
      return;
    }
    setError(null);
    const requested = simple ? Number(count) : 0;
    start.mutate(
      {
        files,
        request: {
          // Bo'sh bo'lsa backend o'zi nom beradi, lekin uni AI'ga mavzu qilib bermaydi (kitob nomi haqida savol chiqmasin)
          topic: topic.trim(),
          courseId: courseId || null,
          title: "",
          questionCount: requested,
          materialText: text.trim(),
          examName,
          language,
        },
      },
      {
        onSuccess: (created) => setTracked({ jobId: String(created.id), requested }),
      }
    );
  }

  function reset(clearForm: boolean) {
    setTracked(null);
    setError(null);
    if (clearForm) {
      setFiles([]);
      setText("");
      setTopic("");
    }
  }

  if (active && job) {
    return (
      <AiProgress
        job={job}
        requested={active.requested}
        onOpen={onOpenQuiz}
        onAnother={() => reset(true)}
        onRetry={() => reset(false)}
      />
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <section className={CARD}>
        <h2 className="flex items-center gap-2.5 text-title text-ink">
          <Step n={1} />
          {t("newPage.ai.material")}
        </h2>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="flex flex-col gap-2">
            <span className={LABEL}>{t("newPage.ai.uploadLabel")}</span>
            <input
              ref={fileRef}
              type="file"
              multiple
              hidden
              accept={AI_MATERIAL_ACCEPT}
              onChange={(event) => {
                addFiles(Array.from(event.target.files ?? []));
                event.target.value = "";
              }}
            />
            <button
              type="button"
              className={`flex h-40 flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed px-4 text-center transition-colors ${
                over ? "border-brand bg-brand-subtle" : "border-line-strong bg-subtle hover:bg-muted"
              }`}
              onClick={() => fileRef.current?.click()}
              onDragOver={(event) => {
                event.preventDefault();
                setOver(true);
              }}
              onDragLeave={() => setOver(false)}
              onDrop={drop}
            >
              <Icon name="upload" size={22} className="text-brand" />
              <strong className="text-title-sm text-ink">
                {files.length ? t("aiPage.addMoreFiles") : t("newPage.ai.dropTitle")}
              </strong>
              <small className="text-body-xs text-ink-tertiary">{t("newPage.ai.dropHint")}</small>
            </button>
            {files.length ? (
              <ul className="flex flex-wrap gap-2">
                {files.map((file, index) => (
                  <li
                    key={`${file.name}-${file.size}`}
                    className="flex items-center gap-1.5 rounded-md bg-subtle py-1 pr-1 pl-2.5 text-body-xs text-ink"
                  >
                    <Icon name="description" size={14} className="shrink-0 text-ink-tertiary" />
                    <span className="max-w-48 truncate">{file.name}</span>
                    <button
                      type="button"
                      className="grid size-6 place-items-center rounded-full text-icon-tertiary hover:bg-muted"
                      aria-label={t("aiPage.removeFile", { name: file.name })}
                      onClick={() => {
                        setFiles((current) => current.filter((_, position) => position !== index));
                        setError(null);
                      }}
                    >
                      <Icon name="close" size={14} />
                    </button>
                  </li>
                ))}
                <li className="self-center text-body-xs text-ink-tertiary">
                  {t("aiPage.fileCount", { count: files.length, max: AI_MATERIAL_MAX_FILES })}
                </li>
              </ul>
            ) : null}
          </div>

          <label className="flex flex-col gap-2">
            <span className={LABEL}>{t("newPage.ai.textLabel")}</span>
            <textarea
              className="h-40 w-full resize-none rounded-lg border border-transparent bg-subtle px-4 py-3 text-body text-ink outline-none placeholder:text-ink-tertiary focus:border-focus focus:bg-surface"
              value={text}
              maxLength={120000}
              placeholder={t("newPage.ai.textPlaceholder")}
              onChange={(event) => setText(event.target.value)}
            />
            <small className="text-body-xs text-ink-tertiary">{t("newPage.ai.textHint")}</small>
          </label>
        </div>
      </section>

      <section className={CARD}>
        <h2 className="flex items-center gap-2.5 text-title text-ink">
          <Step n={2} />
          {t("newPage.ai.settings")}
        </h2>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {simple ? (
            <div className="flex flex-col gap-2">
              <span className={LABEL}>{t("aiPage.countLabel")}</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="grid size-11 shrink-0 place-items-center rounded-md bg-subtle text-ink transition-colors hover:bg-muted"
                  aria-label={t("aiPage.countDecrease")}
                  onClick={() => setCount(String(Math.max(AI_MIN_QUESTIONS, Number(count) - 1)))}
                >
                  <Icon name="remove" size={18} />
                </button>
                <input
                  className={`${FIELD} text-center`}
                  inputMode="numeric"
                  value={count}
                  aria-label={t("aiPage.countLabel")}
                  onChange={(event) => setCount(event.target.value.replace(/\D/g, "").slice(0, 2))}
                />
                <button
                  type="button"
                  className="grid size-11 shrink-0 place-items-center rounded-md bg-subtle text-ink transition-colors hover:bg-muted"
                  aria-label={t("aiPage.countIncrease")}
                  onClick={() => setCount(String(Math.min(AI_MAX_QUESTIONS, Number(count) + 1)))}
                >
                  <Icon name="add" size={18} />
                </button>
              </div>
            </div>
          ) : null}

          <label className="flex flex-col gap-2">
            <span className={LABEL}>{t("newPage.ai.format")}</span>
            <select className={SELECT} value={format} onChange={(event) => setFormat(event.target.value)}>
              <option value={SIMPLE}>{t("newPage.ai.formatSimple")}</option>
              {AI_EXAM_FORMATS.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
              <option value={OTHER}>{t("newPage.ai.formatOther")}</option>
            </select>
          </label>

          <label className="flex flex-col gap-2">
            <span className={LABEL}>{t("newPage.ai.language")}</span>
            <select
              className={SELECT}
              value={language}
              onChange={(event) => setLanguage(event.target.value as Language)}
            >
              {LANGUAGES.map((item) => (
                <option key={item.value} value={item.value}>
                  {t(`newPage.ai.languages.${item.key}`)}
                </option>
              ))}
            </select>
            {language === "" ? <small className="text-body-xs text-ink-tertiary">{t("newPage.ai.languageHint")}</small> : null}
          </label>
        </div>

        {format === OTHER ? (
          <input
            className={FIELD}
            value={customExam}
            maxLength={120}
            placeholder={t("aiPage.examPlaceholder")}
            onChange={(event) => setCustomExam(event.target.value)}
          />
        ) : null}
        <small className="-mt-2 text-body-xs text-ink-tertiary">
          {simple ? t("newPage.ai.simpleHint") : t("newPage.ai.examHint")}
        </small>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <label className="flex flex-col gap-2">
            <span className={LABEL}>{t("newPage.ai.topic")}</span>
            <input
              className={FIELD}
              value={topic}
              maxLength={200}
              placeholder={t("newPage.ai.topicPlaceholder")}
              onChange={(event) => setTopic(event.target.value)}
            />
            <small className="text-body-xs text-ink-tertiary">{t("newPage.ai.topicHint")}</small>
          </label>
          <label className="flex flex-col gap-2">
            <span className={LABEL}>{t("newPage.ai.group")}</span>
            <select className={SELECT} value={courseId} onChange={(event) => setCourseId(event.target.value)}>
              <option value={NO_GROUP}>{t("newPage.ai.noGroup")}</option>
              {(courses.data ?? []).map((course) => (
                <option key={course.id} value={course.id}>
                  {course.title}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      {error ? (
        <p role="alert" className="text-body-sm text-error-text">
          {error}
        </p>
      ) : null}
      <div className="flex justify-end">
        <button type="button" className={PRIMARY_BUTTON} disabled={start.isPending} onClick={submit}>
          <Icon name="auto-awesome" size={18} />
          {t("newPage.ai.create")}
        </button>
      </div>
    </div>
  );
}

function Step({ n }: { n: number }) {
  return (
    <span className="grid size-6 place-items-center rounded-full bg-subtle text-caption-strong text-ink-secondary">
      {n}
    </span>
  );
}

interface AiProgressProps {
  job: AiQuizJob;
  requested: number;
  onOpen: (quizId: string) => void;
  onAnother: () => void;
  onRetry: () => void;
}

function AiProgress({ job, requested, onOpen, onAnother, onRetry }: AiProgressProps) {
  const { t } = useTranslation("quiz");
  const running = isAiJobActive(job.status);
  const quiz = useQuiz(job.status === "done" ? job.quizId : null);
  const produced = quiz.data?.questions.length ?? 0;
  const wanted = requested || produced;

  if (running) {
    const current = aiJobStep(job.status);
    const steps = [
      t("newPage.ai.steps.read"),
      t("newPage.ai.steps.write"),
      t("newPage.ai.steps.save"),
    ];
    return (
      <section className={CARD} aria-live="polite">
        <header className="flex flex-col gap-1">
          <h2 className="text-title text-ink">{t("newPage.ai.progressTitle")}</h2>
          <p className="text-body-sm text-ink-secondary">{t("newPage.ai.progressHint")}</p>
        </header>
        <ul className="flex flex-col gap-1">
          {steps.map((label, index) => (
            <li
              key={label}
              className={`flex items-center gap-2.5 py-1.5 text-body ${index > current ? "text-ink-tertiary" : "text-ink"}`}
            >
              {index < current ? (
                <Icon name="check-circle" size={20} className="text-success" />
              ) : index === current ? (
                <Icon name="refresh" size={20} className="animate-spin text-brand" />
              ) : (
                <Icon name="circle" size={20} />
              )}
              {label}
            </li>
          ))}
        </ul>
      </section>
    );
  }

  if (job.status === "failed") {
    return (
      <section className={CARD} role="alert">
        <h2 className="flex items-center gap-2 text-title text-ink">
          <Icon name="warning" size={20} className="text-warning" />
          {t("newPage.ai.failedTitle")}
        </h2>
        <p className="text-body-sm text-ink-secondary">{job.error || t("aiPage.failedFallback")}</p>
        <button type="button" className={`${PRIMARY_BUTTON} self-start`} onClick={onRetry}>
          {t("newPage.ai.retry")}
        </button>
      </section>
    );
  }

  const full = produced >= wanted && wanted > 0;
  return (
    <section className={CARD}>
      <header className="flex items-start justify-between gap-3">
        <span className="flex min-w-0 flex-col gap-0.5">
          <h2 className="truncate text-title text-ink">{job.title || job.topic}</h2>
          <p className="text-body-sm text-ink-secondary">{t("newPage.ai.resultNote")}</p>
        </span>
        <span className="shrink-0 rounded-full bg-subtle px-2.5 py-1 text-caption-strong text-ink-secondary">
          {t("newPage.ai.report")}
        </span>
      </header>

      {quiz.isLoading ? (
        <small className="text-body-xs text-ink-secondary">{t("newPage.ai.loadingResult")}</small>
      ) : (
        <div className="flex flex-col gap-2">
          <p className="text-ink">
            <span className="font-heading text-[28px] font-semibold">{produced}</span>
            <span className="text-title text-ink-secondary">
              {" "}
              / {wanted} {t("newPage.ai.ready")}
            </span>
          </p>
          <span className="h-1.5 w-full overflow-hidden rounded-full bg-subtle" aria-hidden="true">
            <span
              className={`block h-full rounded-full ${full ? "bg-success" : "bg-warning"}`}
              style={{ width: `${wanted ? Math.min(100, Math.round((produced / wanted) * 100)) : 0}%` }}
            />
          </span>
        </div>
      )}

      {!quiz.isLoading && requested > produced ? (
        <p className="flex items-start gap-2.5 rounded-md bg-warning-bg px-4 py-3 text-body-sm text-warning-fg">
          <Icon name="warning" size={18} className="mt-0.5 shrink-0 text-warning" />
          {t("newPage.ai.shortage", { requested, produced })}
        </p>
      ) : null}
      {job.warnings.length ? (
        <p className="flex items-start gap-2.5 rounded-md bg-warning-bg px-4 py-3 text-body-sm text-warning-fg">
          <Icon name="warning" size={18} className="mt-0.5 shrink-0 text-warning" />
          {t("newPage.ai.warnings", { count: job.warnings.length })}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center justify-end gap-2.5">
        <button type="button" className={SECONDARY_BUTTON} onClick={onAnother}>
          {t("newPage.ai.another")}
        </button>
        {job.quizId ? (
          <button type="button" className={PRIMARY_BUTTON} onClick={() => onOpen(job.quizId as string)}>
            {t("newPage.ai.open")}
          </button>
        ) : null}
      </div>
    </section>
  );
}
