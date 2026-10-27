import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Avatar } from "@/shared/ui/legacy";
import { AppDialog, dialogButton } from "@/shared/ui/app-dialog";
import { Icon } from "@/shared/ui/icon";
import { useCourseRequests, useRespondCourseRequest } from "../model/course.queries";

function timeAgo(value: string, now: number, language: string): string {
  const time = new Date(value).getTime();
  if (Number.isNaN(time)) return "";
  const minutes = Math.round((time - now) / 60_000);
  const format = new Intl.RelativeTimeFormat(language, { numeric: "auto" });
  if (Math.abs(minutes) < 60) return format.format(Math.min(minutes, -1), "minute");
  const hours = Math.round(minutes / 60);
  if (Math.abs(hours) < 24) return format.format(hours, "hour");
  return format.format(Math.round(hours / 24), "day");
}

export interface JoinRequestsDialogProps {
  courseId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function JoinRequestsDialog({ courseId, open, onOpenChange }: JoinRequestsDialogProps) {
  const { t, i18n } = useTranslation("group");
  const [now] = useState(() => Date.now());
  const language = i18n.language || "uz";
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
      variant="adaptive"
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
        <div className="flex flex-col gap-3">
          {Array.from({ length: 3 }, (_, index) => (
            <div key={index} className="h-12 animate-pulse rounded-md bg-muted" />
          ))}
        </div>
      ) : rows.length ? (
        <ul className="flex flex-col gap-3">
          {rows.map((row) => (
            <li key={row.id} className="flex items-center gap-3">
              <Avatar
                name={row.student.name}
                tone={row.student.avatarTone}
                size="md"
              />
              <span className="flex min-w-0 flex-1 flex-col">
                <strong className="truncate text-title-sm text-ink">{row.student.name}</strong>
                <small className="truncate text-body-xs text-ink-tertiary">
                  {timeAgo(row.createdAt, now, language)}
                </small>
              </span>
              <button
                type="button"
                className="grid size-9 shrink-0 place-items-center rounded-full border border-line bg-surface text-ink transition-colors hover:bg-subtle"
                disabled={respond.isPending}
                aria-label={t("addStudent.decline")}
                onClick={() => respond.mutate({ enrollmentId: row.id, action: "decline" })}
              >
                <Icon name="close" size={18} />
              </button>
              <button
                type="button"
                className="grid size-9 shrink-0 place-items-center rounded-full bg-brand text-ink-inverse transition-colors hover:bg-brand-strong"
                disabled={respond.isPending}
                aria-label={t("addStudent.accept")}
                onClick={() => respond.mutate({ enrollmentId: row.id, action: "approve" })}
              >
                <Icon name="check" size={18} />
              </button>
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
