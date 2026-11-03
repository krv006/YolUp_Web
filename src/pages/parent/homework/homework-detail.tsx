import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { homeworkApi } from "@/modules/homework";
import { downloadBlob, parentHomework, retryMinutes, useRemindChildHomework, type HomeworkState } from "@/modules/parent";
import { formatLocalized, htmlToPlainText } from "@/shared/lib";
import type { Assignment, Course } from "@/shared/types";
import { FileViewer } from "@/shared/ui/file-viewer";
import { Icon } from "@/shared/ui/icon";
import { Avatar } from "@/shared/ui/legacy";
import { subjectLook } from "../attendance/attendance-styles";
import { fileKind, formatBytes, resultTone } from "./homework-format";
import { StateChip } from "./homework-list";

type Step = { tone: "done" | "fail" | "current" | "todo"; title: string; meta?: string };
type Viewable = { name: string; mimeType: string; meta: string; source: string; load: (signal: AbortSignal) => Promise<Blob> };

const STEP_DOT: Record<Step["tone"], string> = {
  done: "bg-success text-on-action",
  fail: "bg-danger text-on-action",
  current: "bg-accent-teal-fg text-on-action",
  todo: "bg-line-strong",
};
const KIND_TILE = {
  pdf: { icon: "description-fill", tone: "bg-danger-bg text-error-text" },
  image: { icon: "image", tone: "bg-accent-blue-bg text-accent-blue-fg" },
  file: { icon: "attach-file", tone: "bg-subtle text-icon-secondary" },
};
const RADIUS = 42;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function Timeline({ steps }: { steps: Step[] }) {
  return (
    <ol className="flex flex-col rounded-2xl bg-subtle px-5 py-4">
      {steps.map((step, index) => (
        <li key={step.title} className="relative flex gap-3 pb-4 last:pb-0">
          {index < steps.length - 1 ? (
            <span
              className={`absolute top-6 bottom-0 left-[11px] w-0.5 ${step.tone === "done" ? "bg-success" : "bg-line-strong"}`}
            />
          ) : null}
          <span className={`relative grid size-6 shrink-0 place-items-center rounded-full ${STEP_DOT[step.tone]}`}>
            {step.tone === "done" ? <Icon name="check" size={14} /> : null}
            {step.tone === "fail" ? <Icon name="close" size={14} /> : null}
            {step.tone === "current" ? <Icon name="more-horiz" size={14} /> : null}
          </span>
          <span className="flex min-w-0 flex-col">
            <strong className={`text-title-sm ${step.tone === "fail" ? "text-error-text" : step.tone === "todo" ? "text-ink-tertiary" : "text-ink"}`}>
              {step.title}
            </strong>
            {step.meta ? <small className="text-body-xs text-ink-secondary">{step.meta}</small> : null}
          </span>
        </li>
      ))}
    </ol>
  );
}

function FileCard({ file, onView }: { file: Viewable; onView: (file: Viewable) => void }) {
  const { t } = useTranslation("parent");
  const tile = KIND_TILE[fileKind(file.name, file.mimeType)];
  const [busy, setBusy] = useState(false);

  async function download() {
    setBusy(true);
    try {
      downloadBlob(file.name, await file.load(new AbortController().signal));
    } catch {
      toast.error(t("homeworkView.downloadError"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex items-center gap-3 rounded-2xl bg-subtle px-4 py-3">
      <span className={`grid size-11 shrink-0 place-items-center rounded-xl ${tile.tone}`}>
        <Icon name={tile.icon} size={22} />
      </span>
      <span className="flex min-w-0 flex-1 flex-col">
        <strong className="truncate text-title-sm text-ink">{file.name}</strong>
        <small className="truncate text-body-xs text-ink-secondary">{file.meta}</small>
      </span>
      <button
        type="button"
        className="grid size-9 shrink-0 place-items-center rounded-full bg-surface text-icon transition-colors hover:bg-muted"
        aria-label={t("homeworkView.view")}
        onClick={() => onView(file)}
      >
        <Icon name="visibility" size={18} />
      </button>
      <button
        type="button"
        className="grid size-9 shrink-0 place-items-center rounded-full bg-surface text-icon transition-colors hover:bg-muted disabled:opacity-50"
        aria-label={t("homeworkView.download")}
        disabled={busy}
        onClick={() => void download()}
      >
        <Icon name="download" size={18} />
      </button>
    </div>
  );
}

function RemindChild({ assignmentId, childId, name }: { assignmentId: string; childId: string; name: string }) {
  const { t } = useTranslation("parent");
  const remind = useRemindChildHomework(childId);
  const sent = remind.isSuccess && remind.variables === assignmentId;

  return (
    <button
      type="button"
      disabled={sent || remind.isPending}
      className="flex h-11 items-center justify-center gap-2 self-start rounded-full bg-brand-subtle px-4 text-button text-brand transition-opacity hover:opacity-85 disabled:opacity-60"
      onClick={() =>
        remind.mutate(assignmentId, {
          onSuccess: () => toast.success(t("homeworkView.remind.done", { name })),
          onError: (error) => {
            const minutes = retryMinutes(error);
            toast.error(minutes === null ? t("homeworkView.remind.failed") : t("homeworkView.remind.limit", { count: minutes }));
          },
        })
      }
    >
      <Icon name={sent ? "check" : "notifications-active"} size={18} />
      {sent ? t("homeworkView.remind.sent") : t("homeworkView.remind.action", { name })}
    </button>
  );
}

export function HomeworkDetail({
  assignment,
  assignments,
  course,
  childId,
  childName,
  now,
}: {
  assignment: Assignment;
  assignments: Assignment[];
  course: Course | undefined;
  childId: string | null;
  childName: string;
  now: number;
}) {
  const { t } = useTranslation("parent");
  const [viewing, setViewing] = useState<Viewable | null>(null);
  const state: HomeworkState = parentHomework.homeworkState(assignment, now);
  const submission = assignment.mySubmission;
  const first = childName.split(" ")[0] || childName;
  const teacher = course?.teacher ?? "";
  const look = subjectLook(`${course?.subject ?? ""} ${course?.subjectLabel ?? ""} ${assignment.courseTitle}`);
  const pattern = t("homeworkView.shortPattern");
  const short = (value: string) => formatLocalized(value, pattern).toLowerCase();
  const full = (value: string) => formatLocalized(value, t("homeworkView.fullPattern")).toLowerCase();
  const description = assignment.description || htmlToPlainText(assignment.body);

  const attachment: Viewable | null = assignment.hasAttachment
    ? {
        name: assignment.attachmentName || t("homeworkView.attachment"),
        mimeType: "",
        meta: [fileKind(assignment.attachmentName).toUpperCase(), formatBytes(assignment.attachmentSize), t("homeworkView.fromTeacher")]
          .filter(Boolean)
          .join(" · "),
        source: t("homeworkView.fromTeacher"),
        load: (signal) => homeworkApi.downloadAssignment(assignment.id, { signal }),
      }
    : null;
  const answers: Viewable[] = submission
    ? (submission.files.length ? submission.files : submission.fileName ? [{ name: submission.fileName, size: null, mimeType: "", index: 0 }] : []).map(
        (file) => ({
          name: file.name,
          mimeType: file.mimeType,
          meta: [formatBytes(file.size), t("homeworkView.uploadedBy", { name: first })].filter(Boolean).join(" · "),
          source: t("homeworkView.uploadedBy", { name: first }),
          load: (signal: AbortSignal) => homeworkApi.downloadSubmission(submission.id, { signal }, file.index),
        })
      )
    : [];

  const given: Step = { tone: "done", title: t("homeworkView.steps.given"), meta: [short(assignment.createdAt), teacher].filter(Boolean).join(" · ") };
  const submittedStep: Step | null = submission
    ? {
        tone: "done",
        title: t("homeworkView.steps.submitted"),
        meta: [
          full(submission.createdAt),
          assignment.dueAt && parentHomework.countdown(assignment.dueAt, Date.parse(submission.createdAt)).days >= 1
            ? t("homeworkView.steps.early", { count: parentHomework.countdown(assignment.dueAt, Date.parse(submission.createdAt)).days })
            : submission.isLate
              ? t("homeworkView.steps.late")
              : "",
        ]
          .filter(Boolean)
          .join(" · "),
      }
    : null;

  let steps: Step[] = [];
  if (state === "checking" && submittedStep)
    steps = [given, submittedStep, { tone: "current", title: t("homeworkView.steps.checking"), meta: t("homeworkView.steps.checkingMeta") }, { tone: "todo", title: t("homeworkView.steps.graded") }];
  if (state === "error" && submittedStep)
    steps = [submittedStep, { tone: "fail", title: t("homeworkView.steps.aiFailed"), meta: t("homeworkView.steps.aiFailedMeta") }, { tone: "current", title: t("homeworkView.steps.teacherCheck"), meta: t("homeworkView.steps.teacherCheckMeta") }, { tone: "todo", title: t("homeworkView.steps.graded") }];
  if (state === "overdue")
    steps = [
      given,
      { tone: "fail", title: t("homeworkView.steps.notSubmitted"), meta: assignment.dueAt ? t("homeworkView.steps.dueEnded", { date: full(assignment.dueAt) }) : undefined },
      ...(assignment.allowLate ? [{ tone: "current" as const, title: t("homeworkView.steps.lateAllowed"), meta: t("homeworkView.steps.lateAllowedMeta") }] : []),
    ];
  if (state === "resubmit" && submittedStep)
    steps = [submittedStep, { tone: "current", title: t("homeworkView.steps.resubmit"), meta: submission?.resubmitComment || undefined }];
  if (state === "done" && submittedStep) steps = [given, submittedStep, { tone: "done", title: t("homeworkView.steps.accepted") }];

  const percent = submission?.gradeValue != null && assignment.maxScore ? (submission.gradeValue / assignment.maxScore) * 100 : 0;
  const delta = state === "graded" ? parentHomework.scoreDelta(assignment, assignments) : null;
  const left = assignment.dueAt ? parentHomework.countdown(assignment.dueAt, now) : null;
  const group = state === "graded" ? assignment.groupStats : null;
  const canRemind = Boolean(childId) && (state === "pending" || state === "resubmit" || (state === "overdue" && assignment.allowLate));

  return (
    <section className="flex flex-col gap-5 rounded-[24px] bg-surface p-5 lg:min-h-[560px] lg:p-6">
      <div className="flex flex-col gap-3">
        <span className="flex flex-wrap items-center gap-2">
          <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-caption-strong ${look.tone}`}>
            <Icon name={look.icon} size={14} />
            {assignment.courseTitle}
          </span>
          <StateChip assignment={assignment} state={state} now={now} />
        </span>
        <h2 className="font-heading text-[24px]/8 font-semibold text-ink">{assignment.title}</h2>
        <span className="flex items-center gap-2 text-body-xs text-ink-secondary">
          {teacher ? <Avatar name={teacher} src={course?.teacherUser?.avatarUrl ?? undefined} size="xs" className="[&_.avatar]:size-6" /> : null}
          {[teacher, t("homeworkView.givenOn", { date: short(assignment.createdAt) })].filter(Boolean).join(" · ")}
        </span>
      </div>

      {state === "error" ? (
        <p className="flex items-start gap-3 rounded-2xl bg-danger-bg px-4 py-3 text-body-sm text-error-text">
          <Icon name="warning-fill" size={20} className="mt-px shrink-0" />
          {t("homeworkView.errorBanner")}
        </p>
      ) : null}
      {state === "overdue" && assignment.dueAt ? (
        <p className="flex items-start gap-3 rounded-2xl bg-danger-bg px-4 py-3 text-body-sm text-error-text">
          <Icon name="schedule" size={20} className="mt-px shrink-0" />
          {t("homeworkView.overdueBanner", { count: Math.max(1, parentHomework.daysBetween(Date.parse(assignment.dueAt), now)) })}{" "}
          {assignment.allowLate ? t("homeworkView.lateAccepted") : t("homeworkView.lateRejected")}
        </p>
      ) : null}

      {state === "pending" && left && assignment.dueAt ? (
        <div className="flex flex-col gap-3 rounded-2xl bg-warning-bg px-4 py-4 lg:flex-row lg:items-center lg:gap-4 lg:px-5">
          <span className="flex min-w-0 flex-1 flex-col gap-1 text-warning-text">
            <strong className="flex items-center gap-2 text-title-sm">
              <Icon name="timer" size={18} />
              {t("homeworkView.timeLeft")}
            </strong>
            <small className="text-body-xs">{t("homeworkView.dueOn", { date: full(assignment.dueAt) })}</small>
          </span>
          <span className="grid grid-cols-3 gap-2 lg:flex lg:gap-4">
          {(["days", "hours", "minutes"] as const).map((unit) => (
            <span key={unit} className="flex flex-col items-center rounded-2xl bg-surface py-2.5 lg:w-[76px]">
              <strong className="font-heading text-[26px]/8 font-semibold text-warning-text">{String(left[unit]).padStart(2, "0")}</strong>
              <small className="text-caption text-ink-secondary">{t(`homeworkView.units.${unit}`)}</small>
            </span>
          ))}
          </span>
        </div>
      ) : null}

      {state === "graded" && submission ? (
        <div className="flex items-center gap-5 rounded-2xl bg-accent-green-bg px-5 py-4">
          <span className="relative grid size-24 shrink-0 place-items-center">
            <svg viewBox="0 0 96 96" className="absolute inset-0 -rotate-90" aria-hidden="true">
              <circle cx="48" cy="48" r={RADIUS} fill="none" strokeWidth="8" className="stroke-surface" />
              <circle
                cx="48"
                cy="48"
                r={RADIUS}
                fill="none"
                strokeWidth="8"
                strokeLinecap="round"
                className="stroke-success"
                strokeDasharray={`${(percent / 100) * CIRCUMFERENCE} ${CIRCUMFERENCE}`}
              />
            </svg>
            <strong className="font-heading text-[20px]/7 font-semibold text-ink">
              {submission.gradeValue}/{assignment.maxScore}
            </strong>
          </span>
          <span className="flex flex-col items-start gap-1.5">
            <strong className="font-heading text-[20px]/7 font-semibold text-accent-green-fg">
              {t(`homeworkView.result.${resultTone(percent)}`)}
            </strong>
            {delta !== null && delta !== 0 ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-surface px-2.5 py-1 text-caption-strong text-success-text">
                <Icon name="trending-up" size={14} />
                {t("homeworkView.delta", { value: `${delta > 0 ? "+" : ""}${delta}` })}
              </span>
            ) : null}
            {group && (group.average !== null || group.rank !== null) ? (
              <small className="text-body-xs text-ink-secondary">
                {[
                  group.average !== null ? t("homeworkView.group.average", { value: group.average }) : "",
                  group.rank !== null ? t("homeworkView.group.rank", { name: first, rank: group.rank, total: group.total ?? "—" }) : "",
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </small>
            ) : null}
          </span>
        </div>
      ) : null}

      {canRemind && childId ? <RemindChild assignmentId={assignment.id} childId={childId} name={first} /> : null}

      {steps.length ? <Timeline steps={steps} /> : null}

      {state === "graded" && submission?.teacherComment ? (
        <div className="flex items-start gap-3 rounded-2xl bg-accent-violet-bg px-4 py-3">
          <Avatar name={teacher || "?"} src={course?.teacherUser?.avatarUrl ?? undefined} size="sm" className="shrink-0 [&_.avatar]:size-9" />
          <span className="flex min-w-0 flex-col">
            <small className="text-caption-strong text-accent-violet-fg">{teacher}</small>
            <span className="text-body-sm text-ink">{submission.teacherComment}</span>
          </span>
        </div>
      ) : null}

      {(state === "pending" || state === "overdue") && description ? (
        <section className="flex flex-col gap-1.5">
          <strong className="text-title-sm text-ink">{t("homeworkView.task")}</strong>
          <p className="text-body-sm whitespace-pre-line text-ink-secondary">{description}</p>
        </section>
      ) : null}

      {(state === "pending" || state === "overdue") && attachment ? <FileCard file={attachment} onView={setViewing} /> : null}
      {submission ? answers.map((file) => <FileCard key={`${file.name}-${file.meta}`} file={file} onView={setViewing} />) : null}

      <FileViewer
        open={Boolean(viewing)}
        onOpenChange={(open) => {
          if (!open) setViewing(null);
        }}
        name={viewing?.name ?? ""}
        mimeType={viewing?.mimeType}
        meta={viewing?.source}
        load={viewing?.load ?? (() => Promise.reject(new Error("no file")))}
      />
    </section>
  );
}
