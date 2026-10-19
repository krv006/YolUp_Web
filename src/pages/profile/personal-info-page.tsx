import { useRef, useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { useAuth, useUpdateAvatarMutation, useUpdateProfileMutation } from "@/modules/auth";
import { Icon } from "@/shared/ui/icon";
import { ProfileSubPage } from "./profile-shell";

const LOCKED = "pointer-events-none opacity-60";

export function PersonalInfoPage() {
  const { t } = useTranslation("account");
  const { user } = useAuth();
  const update = useUpdateProfileMutation();
  const updateAvatar = useUpdateAvatarMutation();
  const fileRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({
    firstName: user?.firstName ?? "",
    lastName: user?.lastName ?? "",
    phone: user?.phone ?? "",
  });
  const [emailError, setEmailError] = useState(false);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    update.mutate(
      { firstName: form.firstName, lastName: form.lastName, phone: form.phone },
      { onSuccess: () => toast.success(t("page.saved")) }
    );
  }

  return (
    <ProfileSubPage
      title={t("page.personalTitle")}
      footer={
        <button
          type="submit"
          form="personal-form"
          className="flex h-13 w-full items-center justify-center gap-2 rounded-full bg-action text-label-strong text-on-action transition-colors hover:bg-action-hover disabled:opacity-60"
          disabled={update.isPending}
        >
          {update.isPending ? (
            <>
              <span className="size-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
              {t("page.saving")}
            </>
          ) : (
            t("page.save")
          )}
        </button>
      }
    >
      <section className="flex items-center gap-4 rounded-2xl border border-line bg-surface p-4">
        <span className="relative shrink-0">
          {user?.avatarUrl ? (
            <img className="size-16 rounded-full object-cover" src={user.avatarUrl} alt="" />
          ) : (
            <span className="grid size-16 place-items-center rounded-full bg-action-subtle font-heading text-title text-action">
              {(user?.name ?? "")
                .split(" ")
                .map((part) => part[0])
                .filter(Boolean)
                .slice(0, 2)
                .join("")
                .toUpperCase()}
            </span>
          )}
          <input
            ref={fileRef}
            type="file"
            accept="image/png,image/jpeg"
            hidden
            onChange={(event) => {
              const file = event.target.files?.[0];
              event.target.value = "";
              if (file) updateAvatar.mutate(file);
            }}
          />
          <button
            type="button"
            className="absolute right-0 bottom-0 grid size-7 place-items-center rounded-full border-2 border-surface bg-action text-on-action"
            onClick={() => fileRef.current?.click()}
            aria-label={t("page.avatarUpload")}
          >
            <Icon name="camera" size={14} />
          </button>
        </span>
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <strong className="text-label-strong text-ink">{t("page.avatarTitle")}</strong>
          <small className="text-caption text-ink-tertiary">{t("page.avatarHint")}</small>
          <span className="mt-1 flex items-center gap-4">
            <button
              type="button"
              className="text-label-strong text-action"
              onClick={() => fileRef.current?.click()}
            >
              {t("page.avatarUpload")}
            </button>
            <button
              type="button"
              className="text-label-strong text-error-text"
              onClick={() => toast.info(t("page.notAvailable"))}
            >
              {t("page.avatarRemove")}
            </button>
          </span>
        </span>
      </section>

      <form id="personal-form" className="flex flex-col gap-4" onSubmit={submit}>
        <div className="grid grid-cols-2 gap-3">
          <label className="field-group">
            <span>{t("page.firstName")}</span>
            <input
              value={form.firstName}
              onChange={(event) => setForm((c) => ({ ...c, firstName: event.target.value }))}
              required
            />
          </label>
          <label className="field-group">
            <span>{t("page.lastName")}</span>
            <input
              value={form.lastName}
              onChange={(event) => setForm((c) => ({ ...c, lastName: event.target.value }))}
              required
            />
          </label>
        </div>

        <label className={`field-group ${LOCKED}`}>
          <span>{t("page.fatherName")}</span>
          <input placeholder={t("page.fatherName")} disabled />
          <small className="px-1 text-caption text-ink-tertiary">{t("page.backendPending")}</small>
        </label>

        <label className={`field-group ${LOCKED}`}>
          <span>{t("page.birthDate")}</span>
          <input placeholder="XX.XX.2009" disabled />
        </label>

        <label className="field-group">
          <span>{t("page.phone")}</span>
          <input
            value={form.phone}
            onChange={(event) => setForm((c) => ({ ...c, phone: event.target.value }))}
            inputMode="tel"
          />
          <small className="px-1 text-caption text-ink-tertiary">{t("page.phoneNote")}</small>
        </label>

        <label className={`field-group ${LOCKED}`}>
          <span>{t("page.email")}</span>
          <input
            className={emailError ? "border-error" : undefined}
            defaultValue={user?.email ?? ""}
            onBlur={(event) => setEmailError(Boolean(event.target.value) && !event.target.value.includes("@"))}
            disabled
          />
          <small className="px-1 text-caption text-ink-tertiary">{t("page.backendPending")}</small>
        </label>

        <label className={`field-group ${LOCKED}`}>
          <span>{t("page.subject")}</span>
          <input placeholder="—" disabled />
        </label>

        <label className={`field-group ${LOCKED}`}>
          <span>{t("page.city")}</span>
          <input placeholder="—" disabled />
        </label>

        <label className={`field-group ${LOCKED}`}>
          <span>{t("page.about")}</span>
          <textarea rows={3} placeholder="—" disabled />
        </label>

        {update.isError ? (
          <p className="rounded-xl bg-error-bg px-4 py-3 text-body-sm text-error-text">
            {update.error.message}
          </p>
        ) : null}
      </form>
    </ProfileSubPage>
  );
}
