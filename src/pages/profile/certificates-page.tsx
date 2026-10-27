import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuth, useDeleteCertificate, useUploadCertificate } from "@/modules/auth";
import type { Certificate } from "@/shared/types";
import { useIsCompact } from "@/shared/hooks/use-media-query";
import { AppDialog, dialogButton } from "@/shared/ui/app-dialog";
import { Icon } from "@/shared/ui/icon";
import { Dropdown, DropdownContent, DropdownItem, DropdownTrigger } from "@/shared/ui/legacy";
import { MOBILE_INPUT, MobileFieldLabel } from "@/shared/ui/mobile-fields";
import { MobileEmptyCard, mobileButton } from "@/shared/ui/mobile-page";
import { ProfileSubPage } from "./profile-shell";

const MAX_CERTIFICATE_MB = 10;

function fileSize(bytes: number): string {
  return bytes >= 1024 * 1024
    ? `${(bytes / (1024 * 1024)).toFixed(1).replace(".", ",")} MB`
    : `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

function CertificateUploadSheet({
  open,
  pending,
  onOpenChange,
  onUpload,
}: {
  open: boolean;
  pending: boolean;
  onOpenChange: (open: boolean) => void;
  onUpload: (file: File, title: string) => void;
}) {
  const { t } = useTranslation("account");
  const isCompact = useIsCompact();
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [error, setError] = useState<string | null>(null);

  function pick(next: File | null) {
    if (next && next.size > MAX_CERTIFICATE_MB * 1024 * 1024) {
      setError(t("page.mobile.fileTooBig", { size: MAX_CERTIFICATE_MB }));
      return;
    }
    setError(null);
    setFile(next);
    if (next && !title) setTitle(next.name.replace(/\.[^.]+$/, ""));
  }

  function close(next: boolean) {
    if (!next) {
      setFile(null);
      setTitle("");
      setError(null);
    }
    onOpenChange(next);
  }

  const extension = file?.name.split(".").pop()?.toUpperCase() ?? "";

  return (
    <AppDialog
      open={open}
      onOpenChange={close}
      variant={isCompact ? "adaptive" : "confirm"}
      width="lg:w-120"
      titleClassName="text-title-lg font-semibold"
      closeClassName="size-11"
      title={t("page.uploadCertificate")}
      description={t("page.mobile.uploadHint")}
      footerClassName="px-4 pt-[26px] pb-[29px]"
      footer={
        <div className="grid w-full grid-cols-2 gap-3">
          <button
            type="button"
            className={`${dialogButton.secondary} border-line-strong text-title font-semibold`}
            onClick={() => close(false)}
          >
            {t("page.cancel")}
          </button>
          <button
            type="button"
            className={`${dialogButton.primary} text-title font-semibold disabled:bg-muted disabled:text-ink-secondary disabled:opacity-100`}
            disabled={pending || !file}
            onClick={() => file && onUpload(file, title.trim() || file.name)}
          >
            <Icon name="upload" size={20} />
            {t("page.mobile.upload")}
          </button>
        </div>
      }
    >
      <div className="-mt-1 flex flex-col gap-[15px]">
        <MobileFieldLabel gapClassName="gap-[7px]" label={t("page.mobile.file")}>
          {file ? (
            <span className="-mt-0.5 flex h-[68px] items-center gap-3 rounded-lg bg-subtle pr-2 pl-2.5">
              <span className="grid size-10 shrink-0 place-items-center rounded-md bg-danger-bg text-error-text">
                <Icon name="description-fill" size={20} />
              </span>
              <span className="flex min-w-0 flex-1 flex-col">
                <strong className="truncate text-title-sm text-ink">{file.name}</strong>
                <small className="truncate text-caption font-normal text-ink-secondary">
                  {t("page.mobile.fileMeta", { type: extension, size: fileSize(file.size) })}
                </small>
              </span>
              <Icon name="check-circle" size={22} className="shrink-0 text-success" />
              <button
                type="button"
                className="grid size-9 shrink-0 place-items-center rounded-full text-icon-secondary transition-colors hover:bg-muted"
                aria-label={t("page.mobile.removeFile")}
                onClick={() => setFile(null)}
              >
                <Icon name="close" size={20} />
              </button>
            </span>
          ) : (
            <button
              type="button"
              className="flex h-[143px] flex-col items-center justify-center rounded-lg border-[1.5px] border-dashed border-brand/40 bg-canvas px-6 text-center transition-colors hover:bg-brand-subtle/50"
              onClick={() => fileRef.current?.click()}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault();
                pick(event.dataTransfer.files?.[0] ?? null);
              }}
            >
              <span className="grid size-9 place-items-center rounded-full bg-brand-subtle text-brand">
                <Icon name="upload" size={20} />
              </span>
              <strong className="mt-2 text-title-sm text-ink">
                {isCompact ? t("page.mobile.pickFile") : t("page.mobile.pickOrDrop")}
              </strong>
              <small className="mt-1 text-caption font-normal text-ink-secondary">
                {t("page.mobile.fileTypes", { size: MAX_CERTIFICATE_MB })}
              </small>
            </button>
          )}
        </MobileFieldLabel>
        <input
          ref={fileRef}
          type="file"
          accept="application/pdf,image/png,image/jpeg"
          hidden
          onChange={(event) => {
            const next = event.target.files?.[0] ?? null;
            event.target.value = "";
            pick(next);
          }}
        />
        {error ? <small className="-mt-2 text-caption font-normal text-error-text">{error}</small> : null}
        <MobileFieldLabel gapClassName="gap-[7px]" label={t("page.mobile.certificateName")}>
          <input
            className={MOBILE_INPUT}
            value={title}
            placeholder={t("page.mobile.certificatePlaceholder")}
            onChange={(event) => setTitle(event.target.value)}
          />
        </MobileFieldLabel>
      </div>
    </AppDialog>
  );
}

function StatusChip({ item }: { item: Certificate }) {
  const { t } = useTranslation("account");
  return item.verified ? (
    <span className="flex h-6 shrink-0 items-center gap-1 rounded-full bg-success-bg px-2 text-caption-strong text-success-fg">
      <Icon name="check-circle" size={14} />
      {t("page.verified")}
    </span>
  ) : (
    <span className="flex h-6 shrink-0 items-center gap-1 rounded-full bg-accent-teal-bg px-2 text-caption-strong text-accent-teal-fg">
      <Icon name="schedule" size={14} />
      {t("page.certificatePending")}
    </span>
  );
}

function CertificateList({
  items,
  className = "",
  onUpload,
  onRemove,
}: {
  items: Certificate[];
  className?: string;
  onUpload: () => void;
  onRemove: (id: string) => void;
}) {
  const { t } = useTranslation("account");
  return (
    <section className={`flex flex-col gap-3 ${className}`}>
      <span className="flex items-center justify-between gap-3">
        <span className="text-title leading-5 font-normal text-ink">
          {t("page.mobile.uploadedCount", { count: items.length })}
        </span>
        <button type="button" className="text-body-xs font-semibold text-brand" onClick={onUpload}>
          + {t("page.uploadCertificate")}
        </button>
      </span>
      <div className="flex flex-col divide-y divide-line overflow-hidden rounded-xl bg-surface py-1">
        {items.map((item) => (
          <Dropdown key={item.id}>
            <DropdownTrigger asChild>
              <button type="button" className="flex min-h-[68px] items-center gap-3 px-4 py-3 text-left">
                <span className="grid size-10 shrink-0 place-items-center rounded-md bg-accent-saffron-bg text-accent-saffron-fg">
                  <Icon name="star" size={20} />
                </span>
                <span className="flex min-w-0 flex-1 flex-col">
                  <strong className="truncate text-title text-ink">{item.title || "—"}</strong>
                  <small className="truncate text-body-sm leading-[22px] text-ink-secondary">
                    {[item.issuer, formatWhen(item.createdAt, t("page.mobile.today"))].filter(Boolean).join(" · ")}
                  </small>
                </span>
                <StatusChip item={item} />
              </button>
            </DropdownTrigger>
            <DropdownContent align="end">
              {item.file ? (
                <DropdownItem onSelect={() => window.open(item.file, "_blank", "noopener")}>
                  {t("page.mobile.openFile")}
                </DropdownItem>
              ) : null}
              <DropdownItem destructive onSelect={() => onRemove(item.id)}>
                {t("page.delete")}
              </DropdownItem>
            </DropdownContent>
          </Dropdown>
        ))}
      </div>
    </section>
  );
}

function formatWhen(value: string, today: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toDateString() === new Date().toDateString() ? today : String(date.getFullYear());
}

export function CertificatesPage() {
  const { t } = useTranslation("account");
  const { user } = useAuth();
  const isCompact = useIsCompact();
  const upload = useUploadCertificate();
  const remove = useDeleteCertificate();
  const [sheetOpen, setSheetOpen] = useState(false);
  const items = user?.certificates ?? [];

  if (isCompact)
    return (
      <ProfileSubPage
        title={t("page.certificatesTitle")}
        description={t("page.mobile.certificatesDescription")}
        footer={
          <button type="button" className={mobileButton.primary} onClick={() => setSheetOpen(true)}>
            <Icon name="add" size={20} />
            {t("page.uploadCertificate")}
          </button>
        }
      >
        {items.length ? (
          <CertificateList items={items} className="mt-[7px]" onUpload={() => setSheetOpen(true)} onRemove={(id) => remove.mutate(id)} />
        ) : (
          <div className="mt-1.5">
            <MobileEmptyCard
              icon="workspace-premium"
              title={t("page.mobile.noCertificatesTitle")}
              description={t("page.mobile.noCertificatesHint")}
            />
          </div>
        )}
        <CertificateUploadSheet
          open={sheetOpen}
          pending={upload.isPending}
          onOpenChange={setSheetOpen}
          onUpload={(file, title) => upload.mutate({ file, title }, { onSuccess: () => setSheetOpen(false) })}
        />
      </ProfileSubPage>
    );

  return (
    <ProfileSubPage title={t("page.certificatesTitle")} description={t("page.mobile.certificatesDescription")}>
      {items.length ? (
        <CertificateList items={items} onUpload={() => setSheetOpen(true)} onRemove={(id) => remove.mutate(id)} />
      ) : (
        <MobileEmptyCard
          icon="workspace-premium"
          title={t("page.mobile.noCertificatesTitle")}
          description={t("page.mobile.noCertificatesHint")}
          action={{ label: t("page.uploadCertificate"), icon: "add", onClick: () => setSheetOpen(true) }}
        />
      )}
      <CertificateUploadSheet
        open={sheetOpen}
        pending={upload.isPending}
        onOpenChange={setSheetOpen}
        onUpload={(file, title) => upload.mutate({ file, title }, { onSuccess: () => setSheetOpen(false) })}
      />
    </ProfileSubPage>
  );
}
