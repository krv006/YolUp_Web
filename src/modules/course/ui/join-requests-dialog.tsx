import { useTranslation } from "react-i18next";
import { Avatar } from "@/shared/ui/legacy";
import { AppDialog, dialogButton } from "@/shared/ui/app-dialog";
import { formatDateTime } from "@/shared/lib";
import { useCourseRequests, useRespondCourseRequest } from "../model/course.queries";

export interface JoinRequestsDialogProps {
  courseId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function JoinRequestsDialog({ courseId, open, onOpenChange }: JoinRequestsDialogProps) {
  const { t } = useTranslation("group");
  const requests = useCourseRequests({ page_size: 50 }, open);
  const respond = useRespondCourseRequest();

  const rows = (requests.data?.items ?? []).filter(
    (item) => !courseId || item.courseId === courseId
  );

  async function acceptAll() {
    await Promise.allSettled(
      rows.map((row) => respond.mutateAsync({ enrollmentId: row.id, action: "approve" }))
    );
    onOpenChange(false);
  }

  return (
    <AppDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t("addStudent.requestsTitle", { count: rows.length })}
      description={t("addStudent.requestsDescription")}
      footer={
        <>
          <button
            type="button"
            className={dialogButton.secondary}
            onClick={() => onOpenChange(false)}
          >
            {t("addStudent.close")}
          </button>
          <button
            type="button"
            className={dialogButton.primary}
            disabled={!rows.length || respond.isPending}
            onClick={acceptAll}
          >
            {t("addStudent.acceptAll", { count: rows.length })}
          </button>
        </>
      }
    >
      {requests.isLoading ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 3 }, (_, index) => (
            <div key={index} className="h-20 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      ) : rows.length ? (
        <ul className="flex flex-col divide-y divide-line overflow-hidden rounded-xl border border-line">
          {rows.map((row) => (
            <li key={row.id} className="flex flex-col gap-3 px-4 py-3">
              <div className="flex items-center gap-3">
                <Avatar name={row.student.name} tone={row.student.avatarTone} size="sm" />
                <span className="flex min-w-0 flex-1 flex-col">
                  <strong className="truncate text-label-strong text-ink">
                    {row.student.name}
                  </strong>
                  <small className="truncate text-caption text-ink-tertiary">
                    {row.courseTitle} · {formatDateTime(row.createdAt)}
                  </small>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="flex h-10 items-center rounded-full border border-line bg-surface px-4 text-label-strong text-ink transition-colors hover:bg-subtle"
                  disabled={respond.isPending}
                  onClick={() => respond.mutate({ enrollmentId: row.id, action: "decline" })}
                >
                  {t("addStudent.decline")}
                </button>
                <button
                  type="button"
                  className="flex h-10 items-center rounded-full bg-action px-4 text-label-strong text-on-action transition-colors hover:bg-action-hover"
                  disabled={respond.isPending}
                  onClick={() => respond.mutate({ enrollmentId: row.id, action: "approve" })}
                >
                  {t("addStudent.accept")}
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="px-1 py-6 text-center text-body-sm text-ink-secondary">
          {t("addStudent.requestsEmpty")}
        </p>
      )}
    </AppDialog>
  );
}
