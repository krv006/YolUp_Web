import { useRef } from "react";
import { useTranslation } from "react-i18next";
import { useAuth, useDeleteCertificate, useUploadCertificate } from "@/modules/auth";
import { Icon } from "@/shared/ui/icon";
import { ProfileSubPage } from "./profile-shell";

function formatYear(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : String(date.getFullYear());
}

export function CertificatesPage() {
  const { t } = useTranslation("account");
  const { user } = useAuth();
  const upload = useUploadCertificate();
  const remove = useDeleteCertificate();
  const fileRef = useRef<HTMLInputElement>(null);
  const items = user?.certificates ?? [];

  return (
    <ProfileSubPage
      title={t("page.certificatesTitle")}
      description={t("page.certificatesDescription")}
      footer={
        <button
          type="button"
          className="flex h-11 items-center justify-center rounded-full bg-brand px-6 text-button text-on-action transition-colors hover:bg-brand-strong disabled:opacity-50"
          disabled={upload.isPending}
          onClick={() => fileRef.current?.click()}
        >
          {t("page.uploadCertificate")}
        </button>
      }
    >
      <input
        ref={fileRef}
        type="file"
        accept="application/pdf,image/png,image/jpeg"
        hidden
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          if (file) upload.mutate({ file, title: file.name });
        }}
      />

      {items.length ? (
        <section className="flex flex-col gap-3">
          <span className="text-title text-ink">
            {t("page.uploadedTitle", { count: items.length })}
          </span>

          <div className="flex flex-col divide-y divide-line-subtle overflow-hidden rounded-lg bg-surface">
            {items.map((item) => (
              <div key={item.id} className="group flex items-center gap-3 px-4 py-3.5">
                <span className="grid size-9 shrink-0 place-items-center rounded-md bg-warning-bg text-warning-fg">
                  <Icon name="star" size={18} />
                </span>

                <span className="flex min-w-0 flex-1 flex-col">
                  <strong className="truncate text-title-sm text-ink">{item.title || "—"}</strong>
                  <small className="truncate text-body-xs text-ink-tertiary">
                    {[item.issuer, formatYear(item.createdAt)].filter(Boolean).join(" · ")}
                  </small>
                </span>

                {item.verified ? (
                  <span className="flex h-7 shrink-0 items-center gap-1.5 rounded-full bg-success-bg px-2.5 text-caption-strong text-success">
                    <Icon name="check-circle" size={14} />
                    {t("page.verified")}
                  </span>
                ) : (
                  <span className="flex h-7 shrink-0 items-center gap-1.5 rounded-full bg-warning-bg px-2.5 text-caption-strong text-warning-fg">
                    <Icon name="clock" size={14} />
                    {t("page.certificatePending")}
                  </span>
                )}

                <button
                  type="button"
                  className="grid size-9 shrink-0 place-items-center rounded-full text-icon-tertiary opacity-0 transition-opacity group-hover:opacity-100 hover:text-danger focus-visible:opacity-100"
                  onClick={() => remove.mutate(item.id)}
                  aria-label={t("page.delete")}
                >
                  <Icon name="delete" size={18} />
                </button>
              </div>
            ))}
          </div>
        </section>
      ) : (
        <p className="rounded-lg bg-surface px-5 py-8 text-center text-body-sm text-ink-tertiary">
          {t("page.noCertificates")}
        </p>
      )}
    </ProfileSubPage>
  );
}
