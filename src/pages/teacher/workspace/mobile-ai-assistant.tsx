import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import type { AiQuizJob, AiQuizStandard } from "@/modules/quiz";
import { Icon } from "@/shared/ui/icon";
import { MOBILE_INPUT_SURFACE, MobileFieldLabel, MobilePickerField } from "@/shared/ui/mobile-fields";
import {
  MobileActionBar,
  MobileEmptyCard,
  MobileListSkeleton,
  MobilePageHeader,
  MobileSegment,
  mobileButton,
  mobileRoundButton,
} from "@/shared/ui/mobile-page";

type Tab = "simple" | "rules" | "bank";

const STANDARDS: AiQuizStandard[] = ["uzbmb", "ielts", "sat"];
const MAX_FILES = 5;
const MAX_TOTAL_MB = 20;
const MIN_QUESTIONS = 5;
const MAX_QUESTIONS = 50;

export interface MobileAiFormProps {
  subjects: Array<{ value: string; label: string }>;
  pending: boolean;
  error: string | null;
  onBack: () => void;
  onHistory: () => void;
  onSubmit: (value: { files: File[]; subject: string; topic: string; count: number; standard: AiQuizStandard | null }) => void;
  bankPending: boolean;
  bankError: string | null;
  onBank: (value: { topic: string; count: number }) => void;
}

export function MobileAiForm({
  subjects,
  pending,
  error,
  onBack,
  onHistory,
  onSubmit,
  bankPending,
  bankError,
  onBank,
}: MobileAiFormProps) {
  const { t } = useTranslation("quiz");
  const fileRef = useRef<HTMLInputElement>(null);
  const [tab, setTab] = useState<Tab>("simple");
  const [subject, setSubject] = useState("");
  const [topic, setTopic] = useState("");
  const [standard, setStandard] = useState<AiQuizStandard>("ielts");
  const [files, setFiles] = useState<File[]>([]);
  const [count, setCount] = useState(15);
  const [fileError, setFileError] = useState<string | null>(null);

  const subjectLabel = subjects.find((item) => item.value === subject)?.label ?? "";
  const placeholder = <span className="text-ink-secondary">{t("assignDialog.pick")}</span>;

  return (
    <div className="flex h-full min-h-0 flex-col bg-canvas bg-auth-gradient font-body text-ink">
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-4 pt-5.5 pb-6 [&>*]:shrink-0">
        <MobilePageHeader
          title={t("ai.title")}
          backLabel={t("ai.mobile.back")}
          onBack={onBack}
          action={
            <button type="button" className={mobileRoundButton} aria-label={t("ai.mobile.history")} onClick={onHistory}>
              <Icon name="schedule" size={22} />
            </button>
          }
        />

        <div className="mt-3.5">
          <MobileSegment
            items={(["simple", "rules", "bank"] as const).map((id) => ({ id, label: t(`ai.mobile.tabs.${id}`) }))}
            value={tab}
            onChange={setTab}
          />
        </div>

        {tab === "bank" ? (
          <div className="mt-[15px] flex flex-col gap-[15px]">
            <p className="flex items-start gap-2.5 rounded-lg bg-brand-subtle px-4 py-3 text-body-sm text-brand">
              <Icon name="info" size={18} className="mt-0.5 shrink-0" />
              {t("ai.bankHint")}
            </p>
            <MobileFieldLabel gapClassName="gap-[7px]" label={t("ai.topic")}>
              <input
                className={MOBILE_INPUT_SURFACE}
                value={topic}
                placeholder={t("ai.topicPlaceholder")}
                onChange={(event) => setTopic(event.target.value)}
              />
            </MobileFieldLabel>
            {bankError ? (
              <p className="flex items-start gap-2.5 rounded-lg bg-danger-bg px-4 py-3 text-body-sm text-error-text">
                <Icon name="warning-fill" size={18} className="mt-0.5 shrink-0 text-danger" />
                {bankError}
              </p>
            ) : null}
            <div className="flex items-center gap-3">
              <span className="min-w-0 flex-1 text-body-sm text-ink">{t("ai.questionCount")}</span>
              <span className="flex h-13 shrink-0 items-center gap-1 rounded-full bg-subtle p-1.5">
                <button
                  type="button"
                  className="grid size-10 place-items-center rounded-full bg-surface text-ink transition-colors hover:bg-muted disabled:opacity-40"
                  aria-label={t("ai.less")}
                  disabled={count <= MIN_QUESTIONS}
                  onClick={() => setCount((value) => Math.max(MIN_QUESTIONS, value - 5))}
                >
                  <Icon name="remove" size={22} />
                </button>
                <strong className="w-13 text-center text-title-sm text-ink">{t("ai.mobile.count", { count })}</strong>
                <button
                  type="button"
                  className="grid size-10 place-items-center rounded-full bg-surface text-ink transition-colors hover:bg-muted disabled:opacity-40"
                  aria-label={t("ai.more")}
                  disabled={count >= MAX_QUESTIONS}
                  onClick={() => setCount((value) => Math.min(MAX_QUESTIONS, value + 5))}
                >
                  <Icon name="add" size={22} />
                </button>
              </span>
            </div>
          </div>
        ) : (
          <>
            <div className="mt-[15px] flex flex-col gap-[15px]">
              <MobileFieldLabel gapClassName="gap-[7px]" label={t("ai.subject")}>
                <MobilePickerField
                  type="select"
                  surface
                  value={subject}
                  display={subjectLabel || placeholder}
                  ariaLabel={t("ai.subject")}
                  options={[...(subjectLabel ? [] : [{ value: "", label: t("assignDialog.pick") }]), ...subjects]}
                  onChange={setSubject}
                />
              </MobileFieldLabel>

              {tab === "rules" ? (
                <MobileFieldLabel gapClassName="gap-[7px]" label={t("ai.examType")}>
                  <MobilePickerField
                    type="select"
                    surface
                    value={standard}
                    display={t(`ai.modes.${standard}`)}
                    ariaLabel={t("ai.examType")}
                    options={STANDARDS.map((item) => ({ value: item, label: t(`ai.modes.${item}`) }))}
                    onChange={(value) => setStandard(value as AiQuizStandard)}
                  />
                </MobileFieldLabel>
              ) : null}

              <MobileFieldLabel gapClassName="gap-[7px]" label={t("ai.topic")}>
                <input
                  className={MOBILE_INPUT_SURFACE}
                  value={topic}
                  placeholder={t("ai.topicPlaceholder")}
                  onChange={(event) => setTopic(event.target.value)}
                />
              </MobileFieldLabel>
            </div>

            <button
              type="button"
              className="mt-4 flex h-[117px] flex-col items-center justify-center rounded-lg border-[1.5px] border-dashed border-brand bg-brand-subtle px-6 text-center transition-colors hover:bg-tint"
              onClick={() => fileRef.current?.click()}
            >
              <Icon name="add" size={24} className="text-brand" />
              <strong className="mt-2 text-title-sm text-ink">
                {files.length ? t("ai.filesPicked", { count: files.length }) : t("ai.mobile.pickFiles")}
              </strong>
              <small className="mt-1 text-caption font-normal text-ink-secondary">{t("ai.mobile.filesHint")}</small>
            </button>
            <input
              ref={fileRef}
              type="file"
              multiple
              accept=".pdf,.doc,.docx,image/*"
              className="hidden"
              onChange={(event) => {
                const picked = Array.from(event.target.files ?? []).slice(0, MAX_FILES);
                event.target.value = "";
                const total = picked.reduce((sum, file) => sum + file.size, 0);
                if (total > MAX_TOTAL_MB * 1024 * 1024) {
                  setFileError(t("ai.mobile.filesTooBig", { size: MAX_TOTAL_MB }));
                  return;
                }
                setFileError(null);
                setFiles(picked);
              }}
            />

            {fileError || error ? (
              <p className="mt-3 flex items-start gap-2.5 rounded-lg bg-danger-bg px-4 py-3 text-body-sm text-error-text">
                <Icon name="warning-fill" size={18} className="mt-0.5 shrink-0 text-danger" />
                {fileError ?? error}
              </p>
            ) : null}

            <div className="mt-4 flex items-center gap-3">
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="text-body-sm text-ink">{t("ai.questionCount")}</span>
                <small className="text-caption font-normal text-ink-secondary">
                  {t("ai.mobile.countRange", { min: MIN_QUESTIONS, max: MAX_QUESTIONS })}
                </small>
              </span>
              <span className="flex h-13 shrink-0 items-center gap-1 rounded-full bg-subtle p-1.5">
                <button
                  type="button"
                  className="grid size-10 place-items-center rounded-full bg-surface text-ink transition-colors hover:bg-muted disabled:opacity-40"
                  aria-label={t("ai.less")}
                  disabled={count <= MIN_QUESTIONS}
                  onClick={() => setCount((value) => Math.max(MIN_QUESTIONS, value - 5))}
                >
                  <Icon name="remove" size={22} />
                </button>
                <strong className="w-13 text-center text-title-sm text-ink">{t("ai.mobile.count", { count })}</strong>
                <button
                  type="button"
                  className="grid size-10 place-items-center rounded-full bg-surface text-ink transition-colors hover:bg-muted disabled:opacity-40"
                  aria-label={t("ai.more")}
                  disabled={count >= MAX_QUESTIONS}
                  onClick={() => setCount((value) => Math.min(MAX_QUESTIONS, value + 5))}
                >
                  <Icon name="add" size={22} />
                </button>
              </span>
            </div>
          </>
        )}
      </div>

      {tab === "bank" ? (
        <MobileActionBar>
          <button
            type="button"
            className={mobileButton.primary}
            disabled={bankPending || !topic.trim()}
            onClick={() => onBank({ topic: topic.trim(), count })}
          >
            <Icon name="quiz" size={20} />
            {t("ai.bankSubmit")}
          </button>
        </MobileActionBar>
      ) : (
        <MobileActionBar>
          <button
            type="button"
            className={mobileButton.primary}
            disabled={pending || !topic.trim()}
            onClick={() =>
              onSubmit({ files, subject, topic: topic.trim(), count, standard: tab === "rules" ? standard : null })
            }
          >
            <Icon name="sparkles-fill" size={20} />
            {t("ai.mobile.submit")}
          </button>
        </MobileActionBar>
      )}
    </div>
  );
}

export interface MobileAiJobsProps {
  jobs: AiQuizJob[];
  loading: boolean;
  started: boolean;
  retrying: boolean;
  onBack: () => void;
  onOpen: (job: AiQuizJob) => void;
  onRetry: (job: AiQuizJob) => void;
}

const JOB_TONE: Record<string, { icon: string; tone: string }> = {
  queued: { icon: "schedule", tone: "bg-accent-blue-bg text-accent-blue-fg" },
  processing: { icon: "sparkles-fill", tone: "bg-accent-saffron-bg text-accent-saffron-fg" },
  generating: { icon: "sparkles-fill", tone: "bg-accent-saffron-bg text-accent-saffron-fg" },
  done: { icon: "check-circle", tone: "bg-accent-green-bg text-accent-green-fg" },
  failed: { icon: "warning-fill", tone: "bg-accent-red-bg text-accent-red-fg" },
};

export function MobileAiJobs({ jobs, loading, started, retrying, onBack, onOpen, onRetry }: MobileAiJobsProps) {
  const { t } = useTranslation("quiz");
  const months = useTranslation("lesson").t("list.months", { returnObjects: true }) as string[];

  function stamp(value: string): string {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return `${date.getDate()}-${(months[date.getMonth()] ?? "").slice(0, 3).toLowerCase()}, ${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
  }

  return (
    <main className="flex h-full flex-col overflow-y-auto bg-canvas bg-auth-gradient px-4 pt-5.5 pb-8 font-body text-ink [&>*]:shrink-0">
      <MobilePageHeader title={t("ai.mobile.jobsTitle")} backLabel={t("ai.mobile.back")} onBack={onBack} />

      {started ? (
        <p className="mt-[18px] flex items-center gap-3 rounded-xl bg-success-bg px-4 py-2.5 text-body-sm font-semibold text-success-fg">
          <Icon name="check-circle" size={22} className="shrink-0 text-success" />
          {t("ai.mobile.started")}
        </p>
      ) : null}

      {loading ? <MobileListSkeleton card rows={4} className="mt-5" /> : null}

      <div className={`${started ? "mt-5" : "mt-[18px]"} flex flex-col gap-5`}>
        {jobs.map((job) => {
          const look = JOB_TONE[job.status] ?? JOB_TONE.queued;
          const running = job.status === "processing" || job.status === "generating";
          return (
            <article key={job.id} className="flex flex-col rounded-xl bg-surface p-4">
              <div className="flex items-center gap-3">
                <span className={`grid size-10 shrink-0 place-items-center rounded-md ${look.tone}`}>
                  <Icon name={look.icon} size={20} />
                </span>
                <span className="flex min-w-0 flex-1 flex-col">
                  <strong className="text-title leading-6 text-ink">
                    {t("ai.mobile.jobTitle", { title: job.title || job.topic, count: job.questionCount })}
                  </strong>
                  <small className="truncate text-body-sm text-ink-secondary">
                    {job.status === "done"
                      ? t("ai.mobile.ready", { date: stamp(job.createdAt) })
                      : job.status === "failed"
                        ? job.error || t("ai.status.failed")
                        : running
                          ? t("ai.mobile.running")
                          : t("ai.mobile.queued")}
                  </small>
                </span>
                {job.status === "done" && job.quizId ? (
                  <button
                    type="button"
                    className="flex h-10 shrink-0 items-center rounded-full bg-brand-subtle px-3.5 text-button-sm text-brand transition-colors hover:bg-tint"
                    onClick={() => onOpen(job)}
                  >
                    {t("ai.mobile.open")}
                  </button>
                ) : null}
                {job.status === "failed" ? (
                  <button
                    type="button"
                    className="flex h-10 shrink-0 items-center gap-1.5 rounded-full border border-line-strong px-3.5 text-button-sm text-ink transition-colors hover:bg-subtle disabled:opacity-40"
                    disabled={retrying}
                    onClick={() => onRetry(job)}
                  >
                    <Icon name="refresh" size={16} />
                    {t("ai.mobile.retry")}
                  </button>
                ) : null}
              </div>
              {running ? (
                <span className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-subtle">
                  <i
                    className={`block h-full rounded-full bg-brand ${job.status === "generating" ? "w-3/5" : "w-[31%]"}`}
                  />
                </span>
              ) : null}
            </article>
          );
        })}

        {!loading && !jobs.length ? (
          <MobileEmptyCard icon="sparkles-fill" title={t("ai.jobsEmpty")} description={t("ai.jobsHint")} />
        ) : null}
      </div>
    </main>
  );
}
