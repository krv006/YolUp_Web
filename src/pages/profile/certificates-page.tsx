import { useRef } from "react";
import { useTranslation } from "react-i18next";
import { useAuth, useDeleteCertificate, useUploadCertificate } from "@/modules/auth";
import { Icon } from "@/shared/ui/icon";
import { ProfileSubPage } from "./profile-shell";

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
          className="flex h-13 w-full items-center justify-center gap-2 rounded-full bg-action text-label-strong text-on-action transition-colors hover:bg-action-hover disabled:opacity-60"
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
        <section className="flex flex-col gap-2">
          <span className="px-1 text-caption-strong tracking-wide text-ink-tertiary uppercase">
            {t("page.certificatesUploaded", { count: items.length })}
          </span>
          <div className="flex flex-col divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface">
            {items.map((item) => (
              <div key={item.id} className="flex items-center gap-3 px-4 py-3">
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-action text-on-action">
                  <Icon name="school" size={18} />
                </span>
                <span className="flex min-w-0 flex-1 flex-col">
                  <strong className="truncate text-label-strong text-ink">{item.title || "—"}</strong>
                  <small className="truncate text-caption text-ink-tertiary">{item.file}</small>
                </span>
                <button
                  type="button"
                  className="grid size-9 shrink-0 place-items-center rounded-full text-error-text transition-colors hover:bg-error-bg"
                  onClick={() => remove.mutate(item.id)}
                  aria-label={t("page.delete")}
                >
                  <Icon name="trash" size={17} />
                </button>
              </div>
            ))}
          </div>
        </section>
      ) : (
        <p className="px-1 text-body-sm text-ink-tertiary">{t("page.noCertificates")}</p>
      )}
    </ProfileSubPage>
  );
}
