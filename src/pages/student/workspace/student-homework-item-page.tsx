import { useRef, useState, type DragEvent } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { useConversations } from "@/modules/conversation";
import { useCourse } from "@/modules/course";
import {
  homeworkFieldError,
  useAssignment,
  useDownloadAssignmentFile,
  useDownloadSubmissionFile,
  useSubmission,
  useSubmitHomework,
} from "@/modules/homework";
import { ROUTES } from "@/shared/config";
import { useIsCompact } from "@/shared/hooks/use-media-query";
import { sanitizeHtml } from "@/shared/lib";
import type { Assignment, Submission } from "@/shared/types";
import { Icon } from "@/shared/ui/icon";
import { MobileActionBar, MobileEmptyCard, MobilePageHeader } from "@/shared/ui/mobile-page";
import { SubmissionPreview } from "@/pages/teacher/workspace/homework/submission-preview";
import { WorkspaceShell } from "@/widgets/workspace-shell";
import { shortDateTime } from "../lib/format";

const DAY_MS = 86_400_000;
const GRADES = [1, 2, 3, 4, 5];
const ACCEPT = ".pdf,.png,.jpg,.jpeg,.webp,.docx";
const ACCEPT_SPEAKING = ".mp3,.wav,.m4a,.ogg";

const draftKey = (id: string) => `yolup.homework-draft.${id}`;

function readDraft(id: string): string {
  try {
    return window.localStorage.getItem(draftKey(id)) ?? "";
  } catch {
    return "";
  }
}

function writeDraft(id: string, value: string) {
  try {
    if (value.trim()) window.localStorage.setItem(draftKey(id), value);
    else window.localStorage.removeItem(draftKey(id));
  } catch {
    return;
  }
}

function fileSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1).replace(".", ",")} MB`;
}

export function StudentHomeworkItemPage() {
  const { t } = useTranslation("student");
  const { assignmentId = "" } = useParams();
  const assignment = useAssignment(assignmentId || null);
  const [resubmitting, setResubmitting] = useState(false);

  if (assignment.isError)
    return (
      <main className="grid h-full place-items-center bg-canvas bg-page-gradient p-6">
        <MobileEmptyCard
          icon="assign"
          title={t("workspace.hwItem.notFound")}
          action={{ label: t("workspace.hwItem.retry"), onClick: () => void assignment.refetch() }}
        />
      </main>
    );
  if (!assignment.data)
    return (
      <main className="flex h-full flex-col gap-5 bg-canvas bg-page-gradient px-4 py-7 lg:px-8" aria-hidden="true">
        <i className="h-9 w-80 max-w-full rounded-full bg-skeleton" />
        <div className="grid gap-5 xl:grid-cols-[380px_minmax(0,1fr)]">
          <i className="h-64 rounded-2xl bg-surface" />
          <i className="h-[600px] rounded-2xl bg-surface" />
        </div>
      </main>
    );

  const mine = assignment.data.mySubmission;
  if (mine && !resubmitting)
    return (
      <HomeworkResult
        assignment={assignment.data}
        initial={mine}
        onResubmit={mine.status === "resubmit_requested" ? () => setResubmitting(true) : undefined}
      />
    );
  return <HomeworkSubmit assignment={assignment.data} />;
}

function useCourseRoom(courseId: string) {
  const conversations = useConversations("student");
  return conversations.data?.find((item) => item.courseId === courseId)?.id ?? null;
}

function HomeworkSubmit({ assignment }: { assignment: Assignment }) {
  const { t } = useTranslation("student");
  const { t: th } = useTranslation("homework");
  const months = useTranslation("lesson").t("list.months", { returnObjects: true }) as string[];
  const navigate = useNavigate();
  const isCompact = useIsCompact();
  const course = useCourse(assignment.courseId || null);
  const submit = useSubmitHomework();
  const downloadTask = useDownloadAssignmentFile();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [comment, setComment] = useState(() => readDraft(assignment.id));
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [now] = useState(() => Date.now());

  const speaking = assignment.skillKey === "speaking";
  const left = assignment.dueAt ? Math.ceil((new Date(assignment.dueAt).getTime() - now) / DAY_MS) : null;
  const overdue = assignment.dueAt ? new Date(assignment.dueAt).getTime() < now : false;
  const locked = overdue && !assignment.allowLate;
  const leftLabel =
    left === null
      ? ""
      : overdue
        ? t("workspace.hwItem.overdue")
        : left <= 0
          ? t("workspace.hwItem.today")
          : t("workspace.hwItem.daysLeft", { count: left });
  const html = assignment.body ? sanitizeHtml(assignment.body) : "";

  function pick(next: File | null | undefined) {
    if (!next) return;
    setFile(next);
    setError(null);
  }

  function onDrop(event: DragEvent<HTMLButtonElement>) {
    event.preventDefault();
    setDragging(false);
    pick(event.dataTransfer.files?.[0]);
  }

  function send() {
    setError(null);
    submit
      .mutateAsync({ assignmentId: assignment.id, file, skillKey: assignment.skillKey, comment })
      .then(() => writeDraft(assignment.id, ""))
      .catch((reason: unknown) => setError(homeworkFieldError(reason, "file")));
  }

  function saveDraft() {
    writeDraft(assignment.id, comment);
    toast.success(t("workspace.hwItem.draftSaved"));
  }

  const task = (
    <section className="flex flex-col gap-4 rounded-2xl bg-surface p-5">
      <span className="flex flex-wrap items-center gap-2">
        {leftLabel ? (
          <span
            className={`flex h-[22px] items-center gap-1 rounded-full px-2 text-caption-strong ${
              overdue ? "bg-danger-bg text-error-text" : "bg-warning-bg text-warning-fg"
            }`}
          >
            <Icon name="timer" size={14} />
            {leftLabel}
          </span>
        ) : null}
        <span className="flex h-[22px] items-center rounded-full bg-accent-violet-bg px-2 text-caption-strong text-accent-violet-fg">
          {t("workspace.hwItem.aiCheck")}
        </span>
      </span>
      {assignment.description ? <p className="text-[15px]/5 whitespace-pre-line text-ink">{assignment.description}</p> : null}
      {html ? <div className="homework-board-task-body text-body-sm text-ink" dangerouslySetInnerHTML={{ __html: html }} /> : null}
      {assignment.hasAttachment ? (
        <button
          type="button"
          className="flex min-h-14 items-center gap-3 rounded-xl bg-subtle px-3 py-2.5 text-left transition-colors hover:bg-muted"
          disabled={downloadTask.isPending}
          onClick={() => downloadTask.mutate({ id: assignment.id, fileName: assignment.attachmentName })}
        >
          <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-surface text-error-text">
            <Icon name="description-fill" size={20} />
          </span>
          <strong className="min-w-0 flex-1 truncate text-body-sm font-semibold text-ink">
            {assignment.attachmentName || th("detailDialog.defaultFile")}
          </strong>
          <Icon name="download" size={20} className="shrink-0 text-icon-secondary" />
        </button>
      ) : null}
      <dl className="flex flex-col gap-3 text-body-sm">
        <span className="flex items-center justify-between gap-3">
          <dt className="text-ink-secondary">{th("detail.grading")}</dt>
          <dd className="font-semibold text-ink">{th(`form.gradings.${assignment.grading}`)}</dd>
        </span>
        <span className="flex items-center justify-between gap-3">
          <dt className="text-ink-secondary">{th("detail.allowLate")}</dt>
          <dd className="font-semibold text-ink">{assignment.allowLate ? th("detail.allowed") : th("detail.notAllowed")}</dd>
        </span>
        {assignment.lessonTitle ? (
          <span className="flex items-center justify-between gap-3">
            <dt className="shrink-0 text-ink-secondary">{th("detail.lesson")}</dt>
            <dd className="truncate font-semibold text-ink">{assignment.lessonTitle}</dd>
          </span>
        ) : null}
      </dl>
    </section>
  );

  const form = (
    <section className="flex flex-col rounded-2xl bg-surface p-5 lg:p-6">
      <strong className="text-title-lg font-semibold text-ink">{t("workspace.hwItem.answer")}</strong>
      <small className="mt-1 text-body-xs text-ink-secondary">{t("workspace.hwItem.answerHint")}</small>
      <input
        ref={inputRef}
        type="file"
        hidden
        accept={speaking ? ACCEPT_SPEAKING : ACCEPT}
        onChange={(event) => {
          pick(event.target.files?.[0]);
          event.target.value = "";
        }}
      />
      <button
        type="button"
        className={`mt-6 flex min-h-[158px] flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-5 text-center transition-colors ${
          dragging ? "border-brand bg-brand-subtle" : "border-brand/70 bg-brand-subtle/40 hover:bg-brand-subtle"
        } disabled:opacity-50`}
        disabled={locked}
        onClick={() => inputRef.current?.click()}
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
      >
        <span className="grid size-12 place-items-center rounded-full bg-surface text-brand">
          <Icon name="attach-file" size={24} />
        </span>
        <strong className="mt-2 text-title font-semibold text-ink">{t("workspace.hwItem.drop")}</strong>
        <small className="text-caption text-ink-secondary">
          {speaking ? t("workspace.hwItem.dropSpeaking") : t("workspace.hwItem.dropHint")}
        </small>
      </button>

      {file ? (
        <span className="mt-4 flex min-h-14 items-center gap-3 rounded-xl bg-subtle px-3 py-2.5">
          <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-surface text-error-text">
            <Icon name="description-fill" size={20} />
          </span>
          <span className="flex min-w-0 flex-1 flex-col">
            <strong className="truncate text-body-sm font-semibold text-ink">{file.name}</strong>
            <small className="text-caption text-ink-secondary">
              {t("workspace.hwItem.fileReady", { size: fileSize(file.size) })}
            </small>
          </span>
          <button
            type="button"
            className="grid size-8 shrink-0 place-items-center rounded-full text-icon-secondary transition-colors hover:bg-surface"
            aria-label={t("workspace.hwItem.remove")}
            onClick={() => setFile(null)}
          >
            <Icon name="close" size={18} />
          </button>
        </span>
      ) : null}
      {error ? <small className="mt-2 text-body-xs text-error-text">{error}</small> : null}

      <label className="mt-4 flex flex-col gap-2">
        <span className="text-body-sm font-medium text-ink">{t("workspace.hwItem.comment")}</span>
        <textarea
          className="min-h-28 resize-y rounded-xl border border-line-strong bg-surface px-4 py-3 text-body-sm text-ink outline-none placeholder:text-ink-tertiary focus:border-focus"
          value={comment}
          placeholder={t("workspace.hwItem.commentPlaceholder")}
          onChange={(event) => setComment(event.target.value)}
        />
      </label>

      <p
        className={`mt-4 flex items-center gap-2.5 rounded-xl px-4 py-3 text-body-xs ${
          locked ? "bg-danger-bg text-error-text" : "bg-accent-teal-bg text-accent-teal-fg"
        }`}
      >
        <Icon name="schedule" size={20} className="shrink-0" />
        <span>
          {assignment.dueAt
            ? `${t("workspace.hwItem.dueNotice", { date: shortDateTime(assignment.dueAt, months), left: leftLabel })} ${
                assignment.allowLate ? t("workspace.hwItem.lateAllowed") : t("workspace.hwItem.lateDenied")
              }`
            : t("workspace.hwItem.noDue")}
        </span>
      </p>

      {isCompact ? null : (
        <div className="mt-4 flex flex-wrap items-center justify-end gap-3">
          <button
            type="button"
            className="mr-auto flex h-11 items-center gap-2 rounded-full px-3 text-body-sm font-semibold text-brand transition-colors hover:bg-brand-subtle disabled:opacity-50"
            disabled={locked}
            onClick={() => navigate(ROUTES.student.homeworkBoard(assignment.id))}
          >
            <Icon name="edit" size={18} />
            {t("workspace.hwItem.board")}
          </button>
          <button
            type="button"
            className="flex h-11 items-center rounded-full border border-line-strong bg-surface px-[15px] text-body-sm font-semibold text-ink transition-colors hover:bg-subtle"
            onClick={saveDraft}
          >
            {t("workspace.hwItem.draft")}
          </button>
          <button
            type="button"
            className="flex h-11 items-center gap-2 rounded-full bg-brand px-[15px] text-body-sm font-semibold text-ink-inverse transition-colors hover:bg-brand-strong disabled:opacity-50"
            disabled={!file || locked || submit.isPending}
            onClick={send}
          >
            <Icon name="send" size={18} />
            {t("workspace.hwItem.submit")}
          </button>
        </div>
      )}
    </section>
  );

  if (isCompact)
    return (
      <div className="flex h-full min-h-0 flex-col bg-canvas bg-auth-gradient font-body text-ink">
        <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-4 pt-5 pb-6 [&>*]:shrink-0">
          <MobilePageHeader title={assignment.title} backLabel={t("workspace.back")} onBack={() => navigate(-1)} />
          {task}
          <button
            type="button"
            className="flex h-11 items-center justify-center gap-2 rounded-full border border-line-strong bg-surface text-body-sm font-semibold text-ink disabled:opacity-50"
            disabled={locked}
            onClick={() => navigate(ROUTES.student.homeworkBoard(assignment.id))}
          >
            <Icon name="edit" size={18} />
            {t("workspace.hwItem.board")}
          </button>
          {form}
        </div>
        <MobileActionBar>
          <button
            type="button"
            className="flex h-13 min-w-0 flex-1 items-center justify-center rounded-full border border-line-strong bg-surface px-3 text-body-sm font-semibold text-ink"
            onClick={saveDraft}
          >
            {t("workspace.hwItem.draft")}
          </button>
          <button
            type="button"
            className="flex h-13 min-w-0 flex-1 items-center justify-center gap-2 rounded-full bg-brand px-3 text-body-sm font-semibold text-on-action disabled:opacity-50"
            disabled={!file || locked || submit.isPending}
            onClick={send}
          >
            <Icon name="send" size={18} />
            {t("workspace.hwItem.submit")}
          </button>
        </MobileActionBar>
      </div>
    );

  return (
    <WorkspaceShell
      eyebrow={t("workspace.hwItem.eyebrow", {
        course: assignment.courseTitle || course.data?.title || "",
        teacher: course.data?.teacher ?? "",
      })}
      title={assignment.title}
    >
      <div className="grid items-start gap-5 xl:grid-cols-[380px_minmax(0,1fr)]">
        {task}
        {form}
      </div>
    </WorkspaceShell>
  );
}

function HomeworkResult({
  assignment,
  initial,
  onResubmit,
}: {
  assignment: Assignment;
  initial: Submission;
  onResubmit?: () => void;
}) {
  const { t } = useTranslation("student");
  const months = useTranslation("lesson").t("list.months", { returnObjects: true }) as string[];
  const navigate = useNavigate();
  const isCompact = useIsCompact();
  const submission = useSubmission(initial.id);
  const download = useDownloadSubmissionFile();
  const room = useCourseRoom(assignment.courseId);
  const current = submission.data ?? initial;

  const checking = current.status === "checking";
  const failed = current.status === "error";
  const aiScore = current.overallScore;
  const aiGrade = aiScore === null ? null : Math.max(1, Math.min(5, Math.round(aiScore / 20)));
  const teacherGrade = current.status === "done" ? current.gradeValue : null;
  const findings = (current.result?.questions ?? [])
    .map((question) => question.analysis ?? "")
    .filter(Boolean)
    .slice(0, 3);
  const meta = [
    assignment.courseTitle,
    shortDateTime(current.createdAt, months),
    current.isLate ? t("workspace.hwItem.late") : t("workspace.hwItem.onTime"),
  ]
    .filter(Boolean)
    .join(" · ");
  const writeTeacher = () => navigate(room ? ROUTES.student.chat(room) : ROUTES.student.chats);
  const done = () => navigate(-1);

  const panel = (
    <div className="flex flex-col gap-4">
      {checking ? (
        <section className="flex flex-col gap-3 rounded-2xl bg-brand-subtle p-4">
          <span className="flex items-center gap-3">
            <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-accent-violet-fg text-ink-inverse">
              <Icon name="auto-awesome" size={24} />
            </span>
            <span className="flex min-w-0 flex-1 flex-col">
              <strong className="truncate text-body-sm font-semibold text-brand">{t("workspace.hwItem.checking")}</strong>
              <small className="text-caption text-ink-secondary">{t("workspace.hwItem.checkingHint")}</small>
            </span>
          </span>
          <span className="h-1.5 overflow-hidden rounded-full bg-surface">
            <i className="block h-full w-1/2 animate-pulse rounded-full bg-accent-violet-fg" />
          </span>
        </section>
      ) : failed ? (
        <p className="rounded-2xl bg-subtle/60 p-4 text-body-sm text-ink-secondary">{t("workspace.hwItem.failed")}</p>
      ) : (
        <section className="flex flex-col gap-3 rounded-2xl bg-subtle/60 p-4">
          <span className="flex items-center gap-3">
            <strong className="flex size-16 shrink-0 flex-col items-center justify-center rounded-2xl bg-brand text-ink-inverse">
              <span className="font-heading text-[24px]/7 font-semibold">{aiScore ?? "—"}</span>
              <span className="text-caption opacity-80">/100</span>
            </strong>
            <span className="flex min-w-0 flex-1 flex-col gap-0.5">
              <strong className="flex items-center gap-1.5 text-body-sm font-semibold text-ink">
                <Icon name="auto-awesome" size={16} className="shrink-0 text-brand" />
                {t("workspace.hwItem.aiScore", { value: aiGrade ?? "—" })}
              </strong>
              <small className="text-caption text-ink-secondary">
                {teacherGrade === null ? t("workspace.hwItem.aiHint") : t("workspace.hwItem.aiHintDone")}
              </small>
            </span>
          </span>
          {findings.length ? (
            <span className="flex flex-col gap-1">
              <strong className="text-body-xs font-semibold text-ink">{t("workspace.hwItem.findings")}</strong>
              {findings.map((item, index) => (
                <small key={index} className="text-caption text-ink">
                  • {item}
                </small>
              ))}
            </span>
          ) : null}
        </section>
      )}

      <div className="flex flex-col gap-2">
        <span className="text-overline text-ink-secondary uppercase">{t("workspace.hwItem.teacherGrade")}</span>
        {teacherGrade === null ? (
          <small className="text-body-sm text-ink-secondary">{t("workspace.hwItem.waitingGrade")}</small>
        ) : (
          <>
            <div className="grid grid-cols-5 gap-2">
              {GRADES.map((value) => (
                <span
                  key={value}
                  className={`flex h-11 items-center justify-center rounded-xl text-title font-semibold ${
                    teacherGrade === value ? "bg-brand text-ink-inverse" : "bg-subtle text-ink"
                  }`}
                >
                  {value}
                </span>
              ))}
            </div>
            {aiGrade !== null && aiGrade === teacherGrade ? (
              <small className="flex items-center gap-1 text-caption-strong text-success-fg">
                <Icon name="check" size={14} />
                {t("workspace.hwItem.matchesAi")}
              </small>
            ) : null}
          </>
        )}
      </div>

      {current.resubmitComment ? (
        <div className="flex flex-col gap-2">
          <span className="text-body-sm font-medium text-ink">
            {current.status === "resubmit_requested" ? t("workspace.hwItem.resubmitAsked") : t("workspace.hwItem.teacherComment")}
          </span>
          <p className="rounded-2xl bg-subtle px-4 py-2.5 text-title font-normal text-ink">{current.resubmitComment}</p>
        </div>
      ) : null}
    </div>
  );

  const actions = (
    <>
      <button
        type="button"
        className="flex h-13 min-w-0 flex-1 items-center justify-center rounded-full border border-line-strong bg-surface px-2 text-[15px] font-medium whitespace-nowrap text-ink transition-colors hover:bg-subtle"
        onClick={writeTeacher}
      >
        {t("workspace.hwItem.writeTeacher")}
      </button>
      <button
        type="button"
        className="flex h-13 min-w-0 flex-1 items-center justify-center rounded-full bg-brand px-2 text-[15px] font-medium whitespace-nowrap text-ink-inverse transition-colors hover:bg-brand-strong"
        onClick={onResubmit ?? done}
      >
        {onResubmit ? t("workspace.hwItem.resubmit") : t("workspace.hwItem.ok")}
      </button>
    </>
  );

  const preview = current.fileName ? (
    <div className="flex min-h-80 w-full max-w-[470px] items-center justify-center overflow-hidden rounded-xl bg-surface shadow-sm">
      <SubmissionPreview id={current.id} fileName={current.fileName} />
    </div>
  ) : null;

  if (isCompact)
    return (
      <div className="flex h-full min-h-0 flex-col bg-canvas bg-auth-gradient font-body text-ink">
        <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-4 pt-5 pb-6 [&>*]:shrink-0">
          <MobilePageHeader title={assignment.title} backLabel={t("workspace.back")} onBack={done} />
          <small className="-mt-2 text-center text-caption text-ink-secondary">{meta}</small>
          {preview}
          {panel}
        </div>
        <MobileActionBar>{actions}</MobileActionBar>
      </div>
    );

  return (
    <div className="flex h-full min-h-0 bg-canvas">
      <div className="flex min-w-0 flex-1 flex-col overflow-y-auto bg-subtle px-7 pt-6 pb-8">
        <header className="flex items-start gap-3">
          <span className="flex min-w-0 flex-1 flex-col gap-0.5">
            <h1 className="truncate font-heading text-[22px]/7 font-semibold text-ink">
              {t("workspace.hwItem.resultTitle", { title: assignment.title })}
            </h1>
            <small className="truncate text-body-xs text-ink-secondary">{meta}</small>
          </span>
          <button
            type="button"
            className="grid size-11 shrink-0 place-items-center rounded-full bg-surface text-icon transition-colors hover:bg-subtle disabled:opacity-40"
            aria-label={t("workspace.hwItem.download")}
            disabled={!current.fileName || download.isPending}
            onClick={() => download.mutate({ id: current.id, fileName: current.fileName })}
          >
            <Icon name="download" size={20} />
          </button>
        </header>
        <div className="mt-4 flex flex-1 items-start justify-center">{preview}</div>
      </div>
      <aside className="flex h-full w-95 shrink-0 flex-col border-l border-line bg-surface px-5 py-6">
        <div className="min-h-0 flex-1 overflow-y-auto">{panel}</div>
        <div className="mt-4 flex shrink-0 gap-2.5">{actions}</div>
      </aside>
    </div>
  );
}
