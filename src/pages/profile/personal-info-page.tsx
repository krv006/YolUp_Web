import { useRef, useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { useAuth, useUpdateAvatarMutation, useUpdateProfileMutation } from "@/modules/auth";
import { useSubjects } from "@/modules/course";
import { SelectPicker } from "@/shared/ui/legacy/form-pickers";
import { Avatar } from "@/shared/ui/legacy";
import { ProfileSubPage } from "./profile-shell";

const CITIES = [
  "Toshkent",
  "Samarqand",
  "Buxoro",
  "Andijon",
  "Farg'ona",
  "Namangan",
  "Qarshi",
  "Nukus",
  "Urganch",
  "Jizzax",
  "Guliston",
  "Navoiy",
  "Termiz",
];

const FIELD = "flex flex-col gap-2";
const LABEL = "text-body-sm text-ink-secondary";
const INPUT =
  "h-13 w-full rounded-md border border-transparent bg-surface px-4 text-body text-ink outline-none placeholder:text-ink-tertiary focus:border-focus";

export function PersonalInfoPage() {
  const { t } = useTranslation("account");
  const { user } = useAuth();
  const update = useUpdateProfileMutation();
  const updateAvatar = useUpdateAvatarMutation();
  const subjects = useSubjects();
  const fileRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({
    firstName: user?.firstName ?? "",
    lastName: user?.lastName ?? "",
    phone: user?.phone ?? "",
    email: user?.email ?? "",
    subject: user?.subject ?? "",
    city: user?.city ?? "",
  });

  const subjectOptions = [{ value: "", label: t("page.subjectNone") }, ...(subjects.data ?? [])];

  function reset() {
    setForm({
      firstName: user?.firstName ?? "",
      lastName: user?.lastName ?? "",
      phone: user?.phone ?? "",
      email: user?.email ?? "",
      subject: user?.subject ?? "",
      city: user?.city ?? "",
    });
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    update.mutate(
      {
        ...form,
        middleName: user?.middleName ?? "",
        birthDate: user?.birthDate ?? "",
        bio: user?.bio ?? "",
      },
      {
        onSuccess: () => toast.success(t("page.savedHint")),
        onError: (error: Error) => toast.error(error.message),
      }
    );
  }

  return (
    <ProfileSubPage
      title={t("page.personalTitle")}
      footer={
        <>
          <button
            type="button"
            className="flex h-11 items-center justify-center rounded-full border border-line bg-surface px-5 text-button text-ink transition-colors hover:bg-subtle"
            onClick={reset}
          >
            {t("page.cancel")}
          </button>
          <button
            type="submit"
            form="personal-form"
            className="flex h-11 items-center justify-center rounded-full bg-brand px-6 text-button text-on-action transition-colors hover:bg-brand-strong disabled:opacity-50"
            disabled={update.isPending}
          >
            {update.isPending ? t("page.saving") : t("page.save")}
          </button>
        </>
      }
    >
      <section className="flex items-center gap-4 rounded-lg bg-surface px-5 py-4">
        <span className="shrink-0 [&_.avatar]:size-16 [&_.avatar]:text-h2">
          <Avatar name={user?.name} size="lg" src={user?.avatarUrl} />
        </span>

        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <strong className="truncate font-heading text-h2 text-ink">{user?.name}</strong>
          <small className="truncate text-body-sm text-ink-secondary">
            {[user?.subject, user?.city].filter(Boolean).join(" · ") || "—"}
          </small>
        </span>

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
          className="flex h-10 shrink-0 items-center rounded-full border border-line-strong bg-surface px-4 text-button text-ink transition-colors hover:bg-subtle"
          onClick={() => fileRef.current?.click()}
        >
          {t("page.avatarUpload")}
        </button>

        <button
          type="button"
          className="shrink-0 text-button text-brand transition-opacity hover:opacity-80"
          onClick={() => toast.info(t("page.notAvailable"))}
        >
          {t("page.avatarRemove")}
        </button>
      </section>

      <form id="personal-form" className="flex flex-col gap-5" onSubmit={submit}>
        <div className="grid grid-cols-2 items-start gap-5">
          <label className={FIELD}>
            <span className={LABEL}>{t("page.firstName")}</span>
            <input
              className={INPUT}
              value={form.firstName}
              onChange={(event) => setForm((c) => ({ ...c, firstName: event.target.value }))}
              required
            />
          </label>

          <label className={FIELD}>
            <span className={LABEL}>{t("page.lastName")}</span>
            <input
              className={INPUT}
              value={form.lastName}
              onChange={(event) => setForm((c) => ({ ...c, lastName: event.target.value }))}
              required
            />
          </label>
        </div>

        <label className={FIELD}>
          <span className={LABEL}>{t("page.phone")}</span>
          <input
            className={INPUT}
            value={form.phone}
            inputMode="tel"
            onChange={(event) => setForm((c) => ({ ...c, phone: event.target.value }))}
          />
          <small className="text-body-xs text-ink-tertiary">{t("page.phoneNote")}</small>
        </label>

        <label className={FIELD}>
          <span className={LABEL}>{t("page.email")}</span>
          <input
            className={INPUT}
            value={form.email}
            inputMode="email"
            onChange={(event) => setForm((c) => ({ ...c, email: event.target.value }))}
          />
        </label>

        <div className="profile-form grid grid-cols-2 items-start gap-5">
          <SelectPicker
            label={t("page.subject")}
            value={form.subject}
            onChange={(value) => setForm((c) => ({ ...c, subject: value }))}
            options={subjectOptions}
            searchable
          />

          <SelectPicker
            label={t("page.city")}
            value={form.city}
            onChange={(value) => setForm((c) => ({ ...c, city: value }))}
            searchable
            options={CITIES.map((city) => ({ value: city, label: city }))}
          />
        </div>

        {update.isError ? (
          <p className="rounded-md bg-danger-bg px-4 py-3 text-body-sm text-danger">
            {update.error.message}
          </p>
        ) : null}
      </form>
    </ProfileSubPage>
  );
}
