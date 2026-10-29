import { useState } from "react";
import { ArrowLeft, LifeBuoy, MessageSquare } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { SupportThread, useSupportTickets, type SupportTicketStatus } from "@/modules/support";
import { ROUTES } from "@/shared/config";
import { AppDialog } from "@/shared/ui/app-dialog";
import { Avatar, LoadingFallback } from "@/shared/ui/legacy";
import { SelectPicker } from "@/shared/ui/legacy/form-pickers";

type StatusFilter = "all" | SupportTicketStatus;

const STATUSES: StatusFilter[] = ["open", "answered", "closed", "all"];

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return `${String(date.getDate()).padStart(2, "0")}.${String(date.getMonth() + 1).padStart(2, "0")}.${date.getFullYear()} ${String(
    date.getHours()
  ).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

export function AdminSupportPage() {
  const { t } = useTranslation("admin");
  const [params, setParams] = useSearchParams();
  const [status, setStatus] = useState<StatusFilter>("open");
  const tickets = useSupportTickets({ all: true, status: status === "all" ? null : status });
  const items = tickets.data ?? [];
  const openId = params.get("ticket");

  function open(id: string | null) {
    const next = new URLSearchParams(params);
    if (id) next.set("ticket", id);
    else next.delete("ticket");
    setParams(next, { replace: !id });
  }

  return (
    <main className="portal-page admin-page">
      <div className="portal-page-heading">
        <div>
          <span className="portal-eyebrow">
            <LifeBuoy size={14} /> {t("support.eyebrow")}
          </span>
          <h1>{t("support.title")}</h1>
          <p>{t("support.subtitle")}</p>
        </div>
        <Link className="portal-primary-link" to={ROUTES.admin.dashboard}>
          <ArrowLeft size={15} /> {t("teachers.backToDashboard")}
        </Link>
      </div>

      <section className="portal-card admin-teacher-panel">
        <div className="portal-section-head">
          <div>
            <span>
              <MessageSquare size={13} /> {t(`support.status.${status}`)}
            </span>
            <h2>{t("support.listTitle")}</h2>
          </div>
          <div className="admin-teacher-filter">
            <SelectPicker
              hideLabel
              label={t("support.filterLabel")}
              icon={MessageSquare}
              value={status}
              onChange={(value) => setStatus(value as StatusFilter)}
              options={STATUSES.map((item) => ({ value: item, label: t(`support.status.${item}`) }))}
            />
          </div>
        </div>

        {tickets.isLoading ? <LoadingFallback label={t("support.loading")} /> : null}

        <div className="admin-teacher-list">
          {items.map((item) => (
            <article
              key={item.id}
              className={`admin-teacher-row cursor-pointer ${item.id === openId ? "is-highlighted" : ""}`}
              role="button"
              tabIndex={0}
              onClick={() => open(item.id)}
              onKeyDown={(event) => event.key === "Enter" && open(item.id)}
            >
              <Avatar name={item.subject} size="sm" />
              <div>
                <strong>{item.subject || "—"}</strong>
                <small>{[item.lastMessage, formatDate(item.updatedAt)].filter(Boolean).join(" · ")}</small>
              </div>
              <span className="portal-muted">{t(`support.status.${item.status}`)}</span>
            </article>
          ))}
          {!tickets.isLoading && !items.length ? <p className="portal-muted">{t("support.empty")}</p> : null}
        </div>
      </section>

      <AppDialog
        open={Boolean(openId)}
        onOpenChange={(next) => !next && open(null)}
        variant="panel"
        width="lg:w-[480px]"
        title={t("support.threadTitle")}
      >
        {openId ? <SupportThread id={openId} staffView onBack={() => open(null)} /> : null}
      </AppDialog>
    </main>
  );
}
