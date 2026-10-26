import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useCourses, useSubjects } from "@/modules/course";
import { useAiQuizJobs, useStartAiQuiz } from "@/modules/quiz";
import type { AiQuizStandard } from "@/modules/quiz";
import { ROUTES } from "@/shared/config";
import { Icon } from "@/shared/ui/icon";
import { SelectPicker } from "@/shared/ui/legacy/form-pickers";
import { WorkspaceShell } from "@/widgets/workspace-shell";

const EXAM_MODES: Array<{ id: string; standard: AiQuizStandard | null }> = [
  { id: "simple", standard: null },
  { id: "uzbmb", standard: "uzbmb" },
  { id: "ielts", standard: "ielts" },
  { id: "sat", standard: "sat" },
];

const MAX_FILES = 5;
const MAX_FILE_MB = 20;
const MAX_FILE_BYTES = MAX_FILE_MB * 1024 * 1024;
const MIN_QUESTIONS = 5;
const MAX_QUESTIONS = 50;

export function AiAssistantPage() {
  const { t } = useTranslation("quiz");
  const navigate = useNavigate();
  const courses = useCourses();
  const subjectOptions = useSubjects();
  const jobs = useAiQuizJobs();
  const start = useStartAiQuiz();
  const fileRef = useRef<HTMLInputElement>(null);

  const [subject, setSubject] = useState("");
  const [courseId, setCourseId] = useState("");
  const [topic, setTopic] = useState("");
  const [mode, setMode] = useState("simple");
  const [files, setFiles] = useState<File[]>([]);
  const [count, setCount] = useState(15);
  const [fileError, setFileError] = useState<string | null>(null);

  const standard = EXAM_MODES.find((item) => item.id === mode)?.standard ?? undefined;

  function submit() {
    if (!topic.trim()) return;
    start.mutate(
      {
        files,
        request: {
          topic: topic.trim(),
          courseId: courseId || null,
          subject: subject || undefined,
          questionCount: count,
          ...(standard ? { standard } : {}),
        },
      },
      {
        onSuccess: () => {
          setFiles([]);
          setTopic("");
        },
      }
    );
  }

  return (
    <WorkspaceShell eyebrow={t("ai.eyebrow")} title={t("ai.title")}>
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_490px]">
        <section className="flex min-w-0 flex-col gap-4.5 rounded-lg bg-surface p-6">
          <p className="text-body-sm text-ink-secondary">{t("ai.intro")}</p>

          <div className="lesson-form grid grid-cols-2 items-start gap-3">
            <SelectPicker
              label={t("ai.subject")}
              value={subject}
              onChange={setSubject}
              options={(subjectOptions.data ?? []).map((item) => ({
                value: item.value,
                label: item.label,
              }))}
            />
            <SelectPicker
              label={t("ai.group")}
              searchable
              value={courseId}
              onChange={setCourseId}
              options={(courses.data ?? []).map((course) => ({
                value: course.id,
                label: course.title,
              }))}
            />
          </div>

          <label className="flex flex-col gap-2">
            <span className="text-body-xs text-ink-secondary">{t("ai.topic")}</span>
            <input
              className="h-12.5 w-full rounded-md border border-transparent bg-subtle px-4 text-body text-ink outline-none placeholder:text-ink-tertiary focus:border-focus focus:bg-surface"
              value={topic}
              placeholder={t("ai.topicPlaceholder")}
              onChange={(event) => setTopic(event.target.value)}
            />
          </label>

          <div className="lesson-form">
            <SelectPicker
              label={t("ai.examType")}
              value={mode}
              onChange={setMode}
              options={EXAM_MODES.map((item) => ({
                value: item.id,
                label: t(`ai.modes.${item.id}`),
              }))}
            />
          </div>

          <button
            type="button"
            className="flex items-center gap-3 rounded-md border border-dashed border-brand bg-brand-subtle/40 px-4 py-3.5 text-left transition-colors hover:bg-brand-subtle"
            onClick={() => fileRef.current?.click()}
          >
            <span className="grid size-9 shrink-0 place-items-center rounded-md bg-surface text-brand">
              <Icon name="upload" size={18} />
            </span>
            <span className="flex min-w-0 flex-1 flex-col">
              <strong className="truncate text-title-sm text-ink">
                {files.length ? t("ai.filesPicked", { count: files.length }) : t("ai.pickFiles")}
              </strong>
              <small className="truncate text-body-xs text-ink-tertiary">{t("ai.filesHint")}</small>
            </span>
          </button>

          <input
            ref={fileRef}
            type="file"
            multiple
            accept=".pdf,.doc,.docx,image/*"
            className="hidden"
            onChange={(event) => {
              const picked = Array.from(event.target.files ?? []);
              event.target.value = "";
              const tooBig = picked.find((file) => file.size > MAX_FILE_BYTES);
              if (tooBig) {
                setFileError(t("ai.fileTooBig", { name: tooBig.name, size: MAX_FILE_MB }));
                return;
              }
              setFileError(null);
              setFiles(picked.slice(0, MAX_FILES));
            }}
          />

          {fileError || start.isError ? (
            <p className="flex items-start gap-2.5 rounded-md bg-danger-bg px-4 py-3 text-body-sm text-danger">
              <Icon name="error" size={18} className="mt-0.5 shrink-0" />
              {fileError ?? start.error?.message}
            </p>
          ) : null}

          {files.length ? (
            <div className="flex flex-col gap-2">
              {files.map((file) => (
                <span
                  key={file.name}
                  className="flex items-center gap-3 rounded-md bg-subtle px-4 py-2.5"
                >
                  <Icon name="description" size={18} className="shrink-0 text-icon-secondary" />
                  <small className="min-w-0 flex-1 truncate text-body-sm text-ink">
                    {file.name}
                  </small>
                  <button
                    type="button"
                    className="grid size-7 shrink-0 place-items-center rounded-full text-icon-tertiary transition-colors hover:bg-surface hover:text-danger"
                    aria-label={t("ai.removeFile")}
                    onClick={() => setFiles((current) => current.filter((item) => item !== file))}
                  >
                    <Icon name="close" size={16} />
                  </button>
                </span>
              ))}
            </div>
          ) : null}

          <div className="flex items-center gap-3">
            <span className="min-w-0 flex-1 text-body-xs text-ink-secondary">
              {t("ai.questionCount")}
            </span>
            <span className="flex h-10 shrink-0 items-center gap-1 rounded-full bg-subtle px-2">
              <button
                type="button"
                className="grid size-7 place-items-center rounded-full text-icon transition-colors hover:bg-muted"
                aria-label={t("ai.less")}
                onClick={() => setCount((value) => Math.max(MIN_QUESTIONS, value - 5))}
              >
                <Icon name="remove" size={16} />
              </button>
              <strong className="w-8 text-center font-numeric text-title-sm text-ink">
                {count}
              </strong>
              <button
                type="button"
                className="grid size-7 place-items-center rounded-full text-icon transition-colors hover:bg-muted"
                aria-label={t("ai.more")}
                onClick={() => setCount((value) => Math.min(MAX_QUESTIONS, value + 5))}
              >
                <Icon name="add" size={16} />
              </button>
            </span>
          </div>

          <button
            type="button"
            className="flex h-12.5 w-full items-center justify-center rounded-full bg-brand text-button text-ink-inverse transition-colors hover:bg-brand-strong disabled:opacity-40"
            disabled={start.isPending || !topic.trim()}
            onClick={submit}
          >
            {t("ai.submit")}
          </button>
        </section>

        <section className="flex min-w-0 flex-col gap-3">
          <strong className="text-title text-ink">{t("ai.jobsTitle")}</strong>

          {(jobs.data ?? []).map((job) => {
            const done = job.status === "done";
            return (
              <article key={job.id} className="flex flex-col gap-3 rounded-lg bg-surface p-4">
                <div className="flex items-center gap-3">
                  <span
                    className={`grid size-9 shrink-0 place-items-center rounded-md ${
                      done
                        ? "bg-accent-green-bg text-accent-green-fg"
                        : "bg-accent-violet-bg text-accent-violet-fg"
                    }`}
                  >
                    <Icon name={done ? "check-circle" : "auto-awesome"} size={18} />
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col">
                    <strong className="truncate text-title-sm text-ink">
                      {job.title || job.topic}
                    </strong>
                    <small className="truncate text-body-xs text-ink-tertiary">
                      {done
                        ? t("ai.jobDone", { count: job.questionCount })
                        : t(`ai.status.${job.status}`)}
                    </small>
                  </span>
                  {done && job.quizId ? (
                    <button
                      type="button"
                      className="flex h-9 shrink-0 items-center rounded-full bg-brand-subtle px-4 text-button-sm text-brand transition-colors hover:bg-tint"
                      onClick={() => navigate(ROUTES.teacher.test(job.quizId as string))}
                    >
                      {t("ai.openTest")}
                    </button>
                  ) : null}
                </div>

                {done ? null : (
                  <span className="h-1.5 w-full overflow-hidden rounded-full bg-subtle">
                    <i className="block h-full w-2/5 animate-pulse rounded-full bg-accent-violet-fg" />
                  </span>
                )}
              </article>
            );
          })}

          {!jobs.isLoading && !(jobs.data ?? []).length ? (
            <p className="rounded-lg bg-surface px-5 py-6 text-center text-body-sm text-ink-tertiary">
              {t("ai.jobsEmpty")}
            </p>
          ) : null}

          <p className="text-body-xs text-ink-tertiary">{t("ai.jobsHint")}</p>
        </section>
      </div>
    </WorkspaceShell>
  );
}
