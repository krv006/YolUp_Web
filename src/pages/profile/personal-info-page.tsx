import { useRef, useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { useAuth, useIsStudent, useUpdateAvatarMutation, useUpdateProfileMutation } from "@/modules/auth";
import { useCourses, useSubjects } from "@/modules/course";
import { useIsCompact } from "@/shared/hooks/use-media-query";
import { Icon } from "@/shared/ui/icon";
import { SelectPicker } from "@/shared/ui/legacy/form-pickers";
import { Avatar } from "@/shared/ui/legacy";
import { MOBILE_INPUT_SURFACE, MobileFieldLabel, MobilePickerField } from "@/shared/ui/mobile-fields";
import { mobileButton } from "@/shared/ui/mobile-page";
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
const LABEL = "text-body-sm text-ink";
const INPUT =
  "h-13 w-full rounded-md border border-transparent bg-surface px-4 text-body text-ink outline-none placeholder:text-ink-tertiary focus:border-focus";

export function PersonalInfoPage() {
  const { t } = useTranslation("account");
  const { t: tn } = useTranslation("nav");
  const { user } = useAuth();
  const isCompact = useIsCompact();
  const update = useUpdateProfileMutation();
  const updateAvatar = useUpdateAvatarMutation();
  const subjects = useSubjects();
  const student = useIsStudent();
  const courses = useCourses();
  const studying = [...new Set((courses.data ?? []).map((course) => course.subjectLabel).filter(Boolean))].join(", ");
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
        onSuccess: () => toast.success(isCompact ? t("page.mobile.saved") : t("page.savedHint")),
      }
    );
  }

  if (isCompact) {
    const subjectLabel = subjectOptions.find((item) => item.value === form.subject)?.label ?? "";
    const field = (key: "firstName" | "lastName" | "phone" | "email", extra: { inputMode?: "tel" | "email" } = {}) => (
      <input
        className={MOBILE_INPUT_SURFACE}
        value={form[key]}
        inputMode={extra.inputMode}
        onChange={(event) => setForm((current) => ({ ...current, [key]: event.target.value }))}
        required={key === "firstName" || key === "lastName"}
      />
    );
    return (
      <ProfileSubPage
        title={t("page.personalTitle")}
        footerNote={
          update.isError ? (
            <p className="flex items-center gap-3 rounded-xl bg-danger-bg px-4 py-3 text-body-sm leading-[18px] font-medium text-error-text">
              <Icon name="warning-fill" size={20} className="shrink-0 text-danger" />
              {t("page.mobile.saveFailed")}
            </p>
          ) : null
        }
        footer={
          <button type="submit" form="personal-form" className={mobileButton.primary} disabled={update.isPending}>
            {t("page.save")}
          </button>
        }
      >
        <form id="personal-form" className="-mt-[6px] flex flex-col gap-[15px]" onSubmit={submit}>
          <div className="grid grid-cols-2 gap-3">
            <MobileFieldLabel gapClassName="gap-[7px]" label={t("page.firstName")}>{field("firstName")}</MobileFieldLabel>
            <MobileFieldLabel gapClassName="gap-[7px]" label={t("page.lastName")}>{field("lastName")}</MobileFieldLabel>
          </div>
          <div className="flex flex-col gap-2">
            <MobileFieldLabel gapClassName="gap-[7px]" label={t("page.phone")}>{field("phone", { inputMode: "tel" })}</MobileFieldLabel>
            <small className="text-caption font-normal text-ink-secondary">{t("page.phoneNote")}</small>
          </div>
          <MobileFieldLabel gapClassName="gap-[7px]" label={t("page.email")}>{field("email", { inputMode: "email" })}</MobileFieldLabel>
          <div className="grid grid-cols-2 gap-3">
            <MobileFieldLabel gapClassName="gap-[7px]" label={student ? t("page.studying") : t("page.subject")}>
              {student ? (
                <span className={`${MOBILE_INPUT_SURFACE} flex items-center truncate`}>{studying || "—"}</span>
              ) : (
                <MobilePickerField
                  type="select"
                  surface
                  value={form.subject}
                  display={subjectLabel}
                  ariaLabel={t("page.subject")}
                  options={subjectOptions.map((item) => ({ value: item.value, label: item.label }))}
                  onChange={(value) => setForm((current) => ({ ...current, subject: value }))}
                />
              )}
            </MobileFieldLabel>
            <MobileFieldLabel gapClassName="gap-[7px]" label={t("page.city")}>
              <MobilePickerField
                type="select"
                surface
                value={form.city}
                display={form.city || t("page.subjectNone")}
                ariaLabel={t("page.city")}
                options={[
                  ...(form.city ? [] : [{ value: "", label: t("page.subjectNone") }]),
                  ...CITIES.map((city) => ({ value: city, label: city })),
                ]}
                onChange={(value) => setForm((current) => ({ ...current, city: value }))}
              />
            </MobileFieldLabel>
          </div>
        </form>
      </ProfileSubPage>
    );
  }

  return (
    <ProfileSubPage
      title={t("page.personalTitle")}
      footer={
        <>
          <button
            type="button"
            className="flex h-[42px] items-center justify-center rounded-full border border-line-strong bg-surface px-4 text-body-sm font-semibold text-ink transition-colors hover:bg-subtle"
            onClick={reset}
          >
            {t("page.cancel")}
          </button>
          <button
            type="submit"
            form="personal-form"
            className="flex h-[42px] items-center justify-center rounded-full bg-brand px-4 text-body-sm font-semibold text-on-action transition-colors hover:bg-brand-strong disabled:opacity-50"
            disabled={update.isPending}
          >
            {update.isPending ? t("page.saving") : t("page.save")}
          </button>
        </>
      }
    >
      {update.isError ? (
        <p className="mb-0.5 flex h-11 items-center gap-2.5 rounded-xl bg-danger-bg px-4 text-body-sm font-medium text-error-text shadow-sm">
          <Icon name="warning-fill" size={18} className="shrink-0 text-danger" />
          {t("page.mobile.saveFailed")}
        </p>
      ) : null}

      <section className="flex items-center gap-4 rounded-lg bg-surface px-5 py-3.5">
        <span className="shrink-0 [&_.avatar]:size-18 [&_.avatar]:text-h2">
          <Avatar name={user?.name} size="lg" src={user?.avatarUrl} />
        </span>

        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <strong className="truncate font-heading text-h2 text-ink">{user?.name}</strong>
          <small className="truncate text-body-sm text-ink-secondary">
            {[
              student ? tn("roles.student") : user?.subject ? tn("sidebar.subjectTeacher", { subject: user.subject }) : "",
              user?.city,
            ]
              .filter(Boolean)
              .join(" · ") || "—"}
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
          className="flex h-9 shrink-0 items-center rounded-full border border-line-strong bg-surface px-4 text-body-xs font-semibold text-ink transition-colors hover:bg-subtle"
          onClick={() => fileRef.current?.click()}
        >
          {t("page.avatarUpload")}
        </button>

        <button
          type="button"
          className="flex h-9 shrink-0 items-center px-3.5 text-body-xs font-semibold text-brand transition-opacity hover:opacity-80"
          onClick={() => toast.info(t("page.notAvailable"))}
        >
          {t("page.avatarRemove")}
        </button>
      </section>

      <form id="personal-form" className="flex flex-col gap-4" onSubmit={submit}>
        <div className="grid grid-cols-2 items-start gap-3">
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
          <small className="text-caption font-normal text-ink-secondary">{t("page.phoneNote")}</small>
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

        <div className="profile-form grid grid-cols-2 items-start gap-3">
          {student ? (
            <div className={FIELD}>
              <span className={LABEL}>{t("page.studying")}</span>
              <span className={`${INPUT} flex items-center gap-3`}>
                <span className="min-w-0 flex-1 truncate">{studying || "—"}</span>
                <Icon name="chevron-down" size={18} className="shrink-0 text-icon-secondary" />
              </span>
            </div>
          ) : (
            <SelectPicker
              label={t("page.subject")}
              value={form.subject}
              onChange={(value) => setForm((c) => ({ ...c, subject: value }))}
              options={subjectOptions}
              searchable
            />
          )}

          <SelectPicker
            label={t("page.city")}
            value={form.city}
            onChange={(value) => setForm((c) => ({ ...c, city: value }))}
            searchable
            options={CITIES.map((city) => ({ value: city, label: city }))}
          />
        </div>
      </form>
    </ProfileSubPage>
  );
}
