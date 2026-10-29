import { useEffect, useState } from "react";
import { ArrowLeft, Award, ExternalLink } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { useAdminCertificates, useRejectCertificate, useVerifyCertificate } from "@/modules/auth";
import { ROUTES } from "@/shared/config";
import type { AdminCertificate, CertificateStatus } from "@/shared/types";
import { AppDialog, dialogButton } from "@/shared/ui/app-dialog";
import { Avatar, Button, LoadingFallback } from "@/shared/ui/legacy";
import { SelectPicker } from "@/shared/ui/legacy/form-pickers";

const STATUSES: CertificateStatus[] = ["pending", "verified", "rejected"];

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return `${String(date.getDate()).padStart(2, "0")}.${String(date.getMonth() + 1).padStart(2, "0")}.${date.getFullYear()}`;
}

export function AdminCertificatesPage() {
  const { t } = useTranslation("admin");
  const [params] = useSearchParams();
  const highlightId = params.get("certificate");
  const [status, setStatus] = useState<CertificateStatus>("pending");
  const certificates = useAdminCertificates(status);
  const verify = useVerifyCertificate();
  const reject = useRejectCertificate();
  const [rejecting, setRejecting] = useState<AdminCertificate | null>(null);
  const [reason, setReason] = useState("");
  const items = certificates.data ?? [];

  useEffect(() => {
    if (!highlightId || !items.length) return;
    document
      .querySelector(`[data-certificate-id="${CSS.escape(highlightId)}"]`)
      ?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [highlightId, items.length]);

  function confirmReject() {
    if (!rejecting || !reason.trim()) return;
    reject.mutate(
      { id: rejecting.id, reason: reason.trim() },
      {
        onSuccess: () => {
          toast.success(t("certificates.rejectedToast"));
          setRejecting(null);
          setReason("");
        },
      }
    );
  }

  return (
    <main className="portal-page admin-page">
      <div className="portal-page-heading">
        <div>
          <span className="portal-eyebrow">
            <Award size={14} /> {t("certificates.eyebrow")}
          </span>
          <h1>{t("certificates.title")}</h1>
          <p>{t("certificates.subtitle")}</p>
        </div>
        <Link className="portal-primary-link" to={ROUTES.admin.dashboard}>
          <ArrowLeft size={15} /> {t("teachers.backToDashboard")}
        </Link>
      </div>

      <section className="portal-card admin-teacher-panel">
        <div className="portal-section-head">
          <div>
            <span>
              <Award size={13} /> {t(`certificates.status.${status}`)}
            </span>
            <h2>{t("certificates.listTitle")}</h2>
          </div>
          <div className="admin-teacher-filter">
            <SelectPicker
              hideLabel
              label={t("certificates.filterLabel")}
              icon={Award}
              value={status}
              onChange={(value) => setStatus(value as CertificateStatus)}
              options={STATUSES.map((item) => ({ value: item, label: t(`certificates.status.${item}`) }))}
            />
          </div>
        </div>

        {certificates.isLoading ? <LoadingFallback label={t("certificates.loading")} /> : null}

        <div className="admin-teacher-list">
          {items.map((item) => (
            <article
              key={item.id}
              className={`admin-teacher-row ${item.id === highlightId ? "is-highlighted" : ""}`}
              data-certificate-id={item.id}
            >
              <Avatar name={item.owner?.name ?? item.title} src={item.owner?.avatarUrl ?? undefined} size="sm" />
              <div>
                <strong>{item.title || "—"}</strong>
                <small>
                  {[
                    item.owner ? `${item.owner.name}${item.owner.username ? ` · @${item.owner.username}` : ""}` : "",
                    item.issuer,
                    item.issuedYear ? String(item.issuedYear) : "",
                    formatDate(item.createdAt),
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </small>
                {item.status === "rejected" && item.rejectReason ? (
                  <small>{t("certificates.reason", { reason: item.rejectReason })}</small>
                ) : null}
              </div>
              {item.file ? (
                <a
                  className="icon-button"
                  href={item.file}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={t("certificates.openFile")}
                  title={t("certificates.openFile")}
                >
                  <ExternalLink size={16} />
                </a>
              ) : null}
              {item.status === "pending" ? (
                <>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      setReason("");
                      setRejecting(item);
                    }}
                  >
                    {t("certificates.reject")}
                  </Button>
                  <Button
                    size="sm"
                    loading={verify.isPending && verify.variables === item.id}
                    onClick={() =>
                      verify.mutate(item.id, { onSuccess: () => toast.success(t("certificates.verifiedToast")) })
                    }
                  >
                    {t("certificates.verify")}
                  </Button>
                </>
              ) : null}
            </article>
          ))}
          {!certificates.isLoading && !items.length ? (
            <p className="portal-muted">{t(`certificates.empty.${status}`)}</p>
          ) : null}
        </div>
      </section>

      <AppDialog
        open={Boolean(rejecting)}
        onOpenChange={(open) => !open && setRejecting(null)}
        variant="confirm"
        width="lg:w-120"
        title={t("certificates.rejectTitle")}
        description={rejecting?.title ?? ""}
        footer={
          <>
            <button type="button" className={dialogButton.secondary} onClick={() => setRejecting(null)}>
              {t("certificates.cancel")}
            </button>
            <button
              type="button"
              className={dialogButton.danger}
              disabled={!reason.trim() || reject.isPending}
              onClick={confirmReject}
            >
              {t("certificates.reject")}
            </button>
          </>
        }
      >
        <label className="flex flex-col gap-2">
          <span className="text-body-sm text-ink">{t("certificates.reasonLabel")}</span>
          <textarea
            className="min-h-24 resize-y rounded-xl border border-line-strong bg-surface px-4 py-3 text-body-sm text-ink outline-none focus:border-focus"
            value={reason}
            autoFocus
            placeholder={t("certificates.reasonPlaceholder")}
            onChange={(event) => setReason(event.target.value)}
          />
        </label>
      </AppDialog>
    </main>
  );
}
