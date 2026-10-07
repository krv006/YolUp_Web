import { useState } from "react";
import {
  BarChart3,
  CheckCircle2,
  Clock3,
  Download,
  FileText,
  Paperclip,
  RefreshCw,
  Users,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { toIntlLocale } from "@/shared/i18n";
import { Avatar, Button, Dialog, DialogContent, RouteState } from "@/shared/ui/legacy";
import {
  useAssignment,
  useDownloadAssignmentFile,
  useDownloadSubmissionFile,
  useRecheckSubmission,
} from "../model/homework.queries";
import { HomeworkResultDialog } from "./homework-result-dialog";
import type { Submission } from "@/shared/types";

export interface AssignmentDetailDialogProps {
  /** Bildirishnomadan kelganda shu topshiriq darhol ochiladi. */
  openSubmissionId?: string | null;
  assignmentId?: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function SubmissionRow({ submission, onOpenResult }: { submission: Submission; onOpenResult: (submission: Submission) => void }) {
  const { t } = useTranslation("homework");
  const statusLabels: Record<string, string> = {
    checking: t("status.checking"),
    done: t("status.done"),
    error: t("status.error"),
  };
  const download = useDownloadSubmissionFile();
  const recheck = useRecheckSubmission();
  const statusClass =
    submission.status === "done"
      ? ""
      : submission.status === "error"
      ? " grade-pill--error"
      : " grade-pill--checking";

  return (
    <article className="submission-row">
      <Avatar name={submission.studentName || t("detailDialog.defaultStudent")} size="sm" />
      <div className="submission-row-main">
        <strong>{submission.studentName || t("detailDialog.defaultStudent")}</strong>
        <small>
          <FileText size={12} /> {submission.fileName || t("detailDialog.defaultFile")}
          {submission.isLate ? <em className="is-late"> · {t("detailDialog.lateSuffix")}</em> : null}
        </small>
      </div>
      <span className={`grade-pill${statusClass}`}>
        {submission.status === "done" ? (
          <>
            <CheckCircle2 size={14} />{" "}
            {t("detailDialog.scorePoints", { score: submission.overallScore ?? "—" })}
          </>
        ) : (
          <>
            <Clock3 size={13} /> {statusLabels[submission.status] ?? submission.status}
          </>
        )}
      </span>
      <div className="submission-row-actions">
        <button
          className="icon-button"
          aria-label={t("detailDialog.downloadSubmissionAria")}
          disabled={download.isPending}
          onClick={() =>
            download.mutate({ id: submission.id, fileName: submission.fileName })
          }
        >
          <Download size={16} />
        </button>
        <button
          className="icon-button"
          aria-label={t("detailDialog.recheckAria")}
          disabled={recheck.isPending || submission.status === "checking"}
          onClick={() => recheck.mutate(submission.id)}
        >
          <RefreshCw size={16} />
        </button>
        <Button size="sm" variant="secondary" onClick={() => onOpenResult(submission)}>
          {t("detailDialog.result")}
        </Button>
      </div>
    </article>
  );
}

export function AssignmentDetailDialog({
  assignmentId,
  openSubmissionId = null,
  open,
  onOpenChange,
}: AssignmentDetailDialogProps) {
  const { t, i18n } = useTranslation("homework");
  const assignment = useAssignment(open ? assignmentId : null);
  const downloadAttachment = useDownloadAssignmentFile();
  const [resultOf, setResultOf] = useState<Submission | null>(null);
  const [linkedSubmissionId, setLinkedSubmissionId] = useState<string | null>(openSubmissionId);
  const data = assignment.data;
  const submissions = data?.submissions ?? [];

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        {open ? (
          <DialogContent
            className="assignment-detail-dialog"
            title={data?.title || t("detailDialog.defaultTitle")}
            description={
              data
                ? `${data.courseTitle ?? ""}${
                    data.dueAt
                      ? ` · ${t("detailDialog.dueLabel", {
                          date: new Intl.DateTimeFormat(toIntlLocale(i18n.language), {
                            dateStyle: "medium",
                            timeStyle: "short",
                          }).format(new Date(data.dueAt)),
                        })}`
                      : ` · ${t("detailDialog.noDue")}`
                  }`
                : t("detailDialog.loading")
            }
          >
            {assignment.isError ? (
              <RouteState
                title={t("detailDialog.loadError")}
                description={assignment.error?.message}
                actionLabel={t("detailDialog.retry")}
                onAction={assignment.refetch}
              />
            ) : assignment.isLoading || !data ? (
              <div className="student-tab-loading">
                <span />
              </div>
            ) : (
              <div className="assignment-detail">
                {data.description || data.body ? (
                  <p className="assignment-detail-body">
                    {data.description || data.body}
                  </p>
                ) : null}

                {data.hasAttachment ? (
                  <Button
                    variant="secondary"
                    loading={downloadAttachment.isPending}
                    onClick={() =>
                      downloadAttachment.mutate({
                        id: data.id,
                        fileName: data.attachmentName || `${data.title}.pdf`,
                      })
                    }
                  >
                    <Paperclip size={16} />{" "}
                    {data.attachmentName || t("detailDialog.downloadAttachmentAria")}
                  </Button>
                ) : null}

                {data.stats ? (
                  <div className="assignment-stat-grid">
                    <span>
                      <Users size={16} />
                      <strong>{data.stats.studentsCount ?? 0}</strong>
                      <small>{t("detailDialog.studentsCount")}</small>
                    </span>
                    <span>
                      <CheckCircle2 size={16} />
                      <strong>{data.stats.submittedCount ?? 0}</strong>
                      <small>{t("detailDialog.submittedCount")}</small>
                    </span>
                    <span>
                      <BarChart3 size={16} />
                      <strong>
                        {data.stats.averageScore ?? "—"}
                      </strong>
                      <small>{t("detailDialog.averageScore")}</small>
                    </span>
                  </div>
                ) : null}

                <span className="dialog-section-label">
                  {t("detailDialog.submissionsHeader", { count: submissions.length })}
                </span>
                <div className="submission-list">
                  {submissions.map((submission) => (
                    <SubmissionRow
                      key={submission.id}
                      submission={submission}
                      onOpenResult={setResultOf}
                    />
                  ))}
                  {!submissions.length ? (
                    <p className="portal-muted">{t("detailDialog.noSubmissions")}</p>
                  ) : null}
                </div>
              </div>
            )}
          </DialogContent>
        ) : null}
      </Dialog>

      <HomeworkResultDialog
        submissionId={resultOf?.id ?? linkedSubmissionId ?? undefined}
        initial={resultOf}
        open={Boolean(resultOf || linkedSubmissionId)}
        onOpenChange={(value) => {
          if (!value) {
            setResultOf(null);
            setLinkedSubmissionId(null);
          }
        }}
        canRecheck
        canDownloadFile
        canReview
      />
    </>
  );
}
