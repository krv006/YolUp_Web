import { useState } from "react";
import { ArrowLeft, Flag } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import {
  useSpamReport,
  useSpamReportAction,
  useSpamReports,
  type SpamReport,
  type SpamReportAction,
  type SpamReportStatus,
} from "@/modules/conversation";
import { ROUTES } from "@/shared/config";
import { AppDialog, dialogButton } from "@/shared/ui/app-dialog";
import { Avatar, Button, LoadingFallback } from "@/shared/ui/legacy";
import { RoleTag } from "@/shared/ui/role-tag";

const STATUSES: SpamReportStatus[] = ["open", "resolved", "dismissed"];

function formatDateTime(value: string | null): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (part: number) => String(part).padStart(2, "0");
  return `${pad(date.getDate())}.${pad(date.getMonth() + 1)}.${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function AdminReportsPage() {
  const { t } = useTranslation("admin");
  const [status, setStatus] = useState<SpamReportStatus>("open");
  const [page, setPage] = useState(1);
  const [params] = useSearchParams();
  const [openId, setOpenId] = useState<string | null>(() => params.get("report"));
  const reports = useSpamReports(status, page);
  const items = reports.data?.items ?? [];
  const totalPages = reports.data?.totalPages ?? 1;

  return (
    <main className="portal-page admin-page">
      <div className="portal-page-heading">
        <div>
          <span className="portal-eyebrow">
            <Flag size={14} /> {t("reports.eyebrow")}
          </span>
          <h1>{t("reports.title")}</h1>
          <p>{t("reports.subtitle")}</p>
        </div>
        <Link className="portal-primary-link" to={ROUTES.admin.dashboard}>
          <ArrowLeft size={15} /> {t("teachers.backToDashboard")}
        </Link>
      </div>

      <section className="portal-card admin-teacher-panel">
        <div className="flex flex-wrap gap-2" role="tablist" aria-label={t("reports.filterLabel")}>
          {STATUSES.map((item) => (
            <button
              key={item}
              type="button"
              role="tab"
              aria-selected={status === item}
              className={`h-10 rounded-full px-4 text-button transition-colors ${
                status === item ? "bg-brand text-on-action" : "bg-subtle text-ink hover:bg-muted"
              }`}
              onClick={() => {
                setStatus(item);
                setPage(1);
              }}
            >
              {t(`reports.status.${item}`)}
            </button>
          ))}
        </div>

        {reports.isLoading ? <LoadingFallback label={t("reports.loading")} /> : null}

        <div className="admin-teacher-list">
          {items.map((item) => (
            <article key={item.id} className="admin-teacher-row">
              <Avatar name={item.reported.name} size="sm" />
              <div>
                <strong className="flex flex-wrap items-center gap-2">
                  {item.reported.name}
                  <RoleTag role={item.reported.role} />
                  <span className="rounded-full bg-danger-bg px-2 py-0.5 text-caption-strong text-danger">
                    {t(`reports.reasons.${item.reason}`)}
                  </span>
                </strong>
                <small>
                  {t("reports.reportedBy", { name: item.reporter.name })} · {formatDateTime(item.createdAt)}
                </small>
                {item.comment ? <small>«{item.comment}»</small> : null}
              </div>
              <Button size="sm" variant="secondary" onClick={() => setOpenId(item.id)}>
                {t("reports.view")}
              </Button>
            </article>
          ))}
          {!reports.isLoading && !items.length ? (
            <p className="portal-muted">{t(`reports.empty.${status}`)}</p>
          ) : null}
        </div>

        {totalPages > 1 ? (
          <div className="flex items-center justify-end gap-2">
            <Button size="sm" variant="secondary" disabled={page <= 1} onClick={() => setPage((value) => value - 1)}>
              {t("reports.prev")}
            </Button>
            <span className="text-body-sm text-ink-secondary">
              {page} / {totalPages}
            </span>
            <Button
              size="sm"
              variant="secondary"
              disabled={page >= totalPages}
              onClick={() => setPage((value) => value + 1)}
            >
              {t("reports.next")}
            </Button>
          </div>
        ) : null}
      </section>

      <ReportDetailDialog reportId={openId} onClose={() => setOpenId(null)} />
    </main>
  );
}

function ReportDetailDialog({ reportId, onClose }: { reportId: string | null; onClose: () => void }) {
  const { t } = useTranslation("admin");
  const detail = useSpamReport(reportId);
  const act = useSpamReportAction();
  const report = detail.data ?? null;

  function run(action: SpamReportAction) {
    if (!report) return;
    act.mutate(
      { id: report.id, action },
      {
        onSuccess: () => {
          toast.success(t(`reports.done.${action}`));
          onClose();
        },
        onError: (error: Error) => toast.error(error.message),
      }
    );
  }

  const actions: Array<{ action: SpamReportAction; tone: "primary" | "secondary" | "danger" }> = !report
    ? []
    : report.status === "open"
      ? [
          { action: "dismiss", tone: "secondary" },
          { action: "resolve", tone: "danger" },
        ]
      : report.roomStatus === "spam"
        ? [{ action: "unblock", tone: "primary" }]
        : [];

  return (
    <AppDialog
      open={Boolean(reportId)}
      onOpenChange={(open) => !open && onClose()}
      variant="adaptive"
      width="lg:max-w-140"
      title={t("reports.detailTitle")}
      description={report ? t(`reports.status.${report.status}`) : ""}
      footer={
        actions.length ? (
          <>
            {actions.map(({ action, tone }) => (
              <button
                key={action}
                type="button"
                className={dialogButton[tone]}
                disabled={act.isPending}
                onClick={() => run(action)}
              >
                {t(`reports.actions.${action}`)}
              </button>
            ))}
          </>
        ) : undefined
      }
    >
      {!report ? (
        <LoadingFallback label={t("reports.loading")} />
      ) : (
        <div className="flex flex-col gap-4">
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-body-sm">
            <dt className="text-ink-secondary">{t("reports.reporter")}</dt>
            <dd className="text-ink">
              {report.reporter.name} · @{report.reporter.username}
            </dd>
            <dt className="text-ink-secondary">{t("reports.reported")}</dt>
            <dd className="text-ink">
              {report.reported.name} · @{report.reported.username}
            </dd>
            <dt className="text-ink-secondary">{t("reports.reason")}</dt>
            <dd className="text-ink">{t(`reports.reasons.${report.reason}`)}</dd>
            {report.comment ? (
              <>
                <dt className="text-ink-secondary">{t("reports.comment")}</dt>
                <dd className="text-ink">{report.comment}</dd>
              </>
            ) : null}
            <dt className="text-ink-secondary">{t("reports.date")}</dt>
            <dd className="text-ink">{formatDateTime(report.createdAt)}</dd>
            {report.handledBy ? (
              <>
                <dt className="text-ink-secondary">{t("reports.handledBy")}</dt>
                <dd className="text-ink">
                  {report.handledBy.name} · {formatDateTime(report.handledAt)}
                </dd>
              </>
            ) : null}
          </dl>

          <section className="flex flex-col gap-2">
            <strong className="text-title-sm text-ink">{t("reports.messages")}</strong>
            <ReportMessages report={report} />
          </section>
        </div>
      )}
    </AppDialog>
  );
}

function ReportMessages({ report }: { report: SpamReport }) {
  const { t } = useTranslation("admin");
  if (!report.recentMessages.length) return <p className="text-body-sm text-ink-secondary">{t("reports.noMessages")}</p>;
  return (
    <ul className="flex max-h-72 flex-col gap-2 overflow-y-auto rounded-xl bg-subtle p-3">
      {report.recentMessages.map((message, index) => {
        const fromReported = message.senderId === report.reported.id;
        return (
          <li
            key={`${message.createdAt}-${index}`}
            className={`flex max-w-[85%] flex-col gap-0.5 rounded-xl px-3 py-2 ${
              fromReported ? "self-start bg-danger-bg" : "self-end bg-surface"
            }`}
          >
            <small className="text-caption-strong text-ink-secondary">
              {fromReported ? report.reported.name : report.reporter.name} · {formatDateTime(message.createdAt)}
            </small>
            <span className="text-body-sm break-words text-ink">{message.text || "—"}</span>
          </li>
        );
      })}
    </ul>
  );
}
