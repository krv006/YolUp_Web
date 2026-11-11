import { useRef, useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth, useRemoveAvatarMutation, useSessions, useUpdateAvatarMutation, useUpdateProfileMutation } from "@/modules/auth";
import { useParentLinks, useSelectedChild } from "@/modules/parent";
import { AppError } from "@/shared/api";
import { ROUTES } from "@/shared/config";
import { AppDialog } from "@/shared/ui/app-dialog";
import { ConfirmDialog } from "@/shared/ui/confirm-dialog";
import { Icon } from "@/shared/ui/icon";
import { Avatar } from "@/shared/ui/legacy";
import { MOBILE_INPUT_SURFACE } from "@/shared/ui/mobile-fields";
import { MobilePageHeader, mobileButton, mobileRoundButton } from "@/shared/ui/mobile-page";
import { ParentAccountSwitchDialog } from "@/widgets/parent-shell";

const PHONE = /^\+998\s?\d{2}\s?\d{3}\s?\d{2}\s?\d{2}$/;
type Field = "firstName" | "lastName" | "username" | "phone";
type PhotoAction = "camera" | "upload" | "remove";

const PHOTO_ACTIONS: Array<{ key: PhotoAction; icon: string }> = [
  { key: "camera", icon: "photo-camera-fill" },
  { key: "upload", icon: "image" },
  { key: "remove", icon: "delete-fill" },
];

function MenuRow({ icon, tone, title, text, onClick, danger = false }: { icon: string; tone: string; title: string; text?: string; onClick: () => void; danger?: boolean }) {
  return (
    <li className="border-b border-line last:border-b-0">
      <button type="button" className="flex w-full items-center gap-3 px-4 py-3.5 text-left" onClick={onClick}>
        <span className={`grid size-11 shrink-0 place-items-center rounded-xl ${tone}`}>
          <Icon name={icon} size={22} />
        </span>
        <span className="flex min-w-0 flex-1 flex-col">
          <strong className={`text-title-sm ${danger ? "text-error-text" : "text-ink"}`}>{title}</strong>
          {text ? <small className="truncate text-body-xs text-ink-secondary">{text}</small> : null}
        </span>
        {danger ? null : <Icon name="chevron-right" size={20} className="shrink-0 text-icon-tertiary" />}
      </button>
    </li>
  );
}

export function ProfileHubMobile() {
  const { t } = useTranslation("parent");
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { children, selectedChildId } = useSelectedChild();
  const links = useParentLinks();
  const sessions = useSessions();
  const [confirm, setConfirm] = useState(false);
  const [switchOpen, setSwitchOpen] = useState(false);
  const pending = (links.data ?? []).filter((link) => link.status === "pending").length;

  return (
    <div className="flex flex-col gap-4 px-4 pt-5 pb-10">
      <MobilePageHeader
        title={t("account.profile")}
        backLabel={t("mobile.tabs.home")}
        onBack={() => navigate(ROUTES.parent.dashboard)}
        action={
          <button type="button" className={mobileRoundButton} aria-label={t("account.settings")} onClick={() => navigate(ROUTES.parent.settings())}>
            <Icon name="settings" size={22} />
          </button>
        }
      />
      <button type="button" className="flex items-center gap-3 rounded-[20px] bg-surface px-4 py-4 text-left" onClick={() => navigate(ROUTES.parent.settings("profile"))}>
        <Avatar name={user?.name} src={user?.avatarUrl ?? undefined} size="lg" className="shrink-0 [&_.avatar]:size-16" />
        <span className="flex min-w-0 flex-1 flex-col">
          <strong className="truncate font-heading text-[18px]/6 font-semibold text-ink">{user?.name}</strong>
          <small className="text-body-xs text-ink-secondary">{t("mobile.settings.role", { count: children.length })}</small>
        </span>
        <Icon name="chevron-right" size={20} className="shrink-0 text-icon-tertiary" />
      </button>
      <button
        type="button"
        className="flex items-center gap-3 rounded-[20px] bg-success-bg px-4 py-3.5 text-left"
        onClick={() => navigate(ROUTES.parent.settings("security"))}
      >
        <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-surface text-success-text">
          <Icon name="shield" size={22} />
        </span>
        <span className="flex min-w-0 flex-1 flex-col">
          <strong className="text-title-sm text-success-text">{t("mobile.settings.securityTitle")}</strong>
          <small className="text-body-xs text-ink-secondary">{t("mobile.settings.securityText", { count: sessions.data?.length ?? 1 })}</small>
        </span>
        <Icon name="chevron-right" size={20} className="shrink-0 text-success-text" />
      </button>
      <ul className="flex flex-col overflow-hidden rounded-[20px] bg-surface">
        <MenuRow icon="person" tone="bg-brand-subtle text-brand" title={t("mobile.settings.info")} text={t("mobile.settings.infoText")} onClick={() => navigate(ROUTES.parent.settings("profile"))} />
        <MenuRow
          icon="group"
          tone="bg-accent-green-bg text-accent-green-fg"
          title={t("family.title")}
          text={pending ? t("mobile.settings.childrenPending", { linked: children.length, pending }) : t("mobile.settings.children", { count: children.length })}
          onClick={() => navigate(ROUTES.parent.children)}
        />
        {selectedChildId ? (
          <MenuRow icon="history" tone="bg-accent-violet-bg text-accent-violet-fg" title={t("profile.logins")} text={t("mobile.settings.loginsText")} onClick={() => navigate(ROUTES.parent.childLogins(selectedChildId))} />
        ) : null}
        <MenuRow icon="notifications" tone="bg-accent-saffron-bg text-accent-saffron-fg" title={t("settings.nav.notifications")} text={t("mobile.settings.notificationsText")} onClick={() => navigate(ROUTES.parent.notifications)} />
        <MenuRow icon="settings" tone="bg-accent-blue-bg text-accent-blue-fg" title={t("account.settings")} text={t("mobile.settings.settingsText")} onClick={() => navigate(ROUTES.parent.settings())} />
        <MenuRow icon="help" tone="bg-subtle text-icon" title={t("account.help")} onClick={() => navigate(ROUTES.parent.help)} />
        <MenuRow
          icon="swap-horiz"
          tone="bg-brand-subtle text-brand"
          title={t("account.switchAccount")}
          text={t("account.switchAccountText")}
          onClick={() => setSwitchOpen(true)}
        />
      </ul>
      <ul className="flex flex-col overflow-hidden rounded-[20px] bg-surface">
        <MenuRow icon="logout" tone="bg-danger-bg text-error-text" title={t("account.logout")} danger onClick={() => setConfirm(true)} />
      </ul>
      <ParentAccountSwitchDialog open={switchOpen} onOpenChange={setSwitchOpen} />
      <ConfirmDialog
        open={confirm}
        onOpenChange={setConfirm}
        icon="logout"
        title={t("account.logoutTitle")}
        description={t("account.logoutText")}
        confirmLabel={t("account.logoutConfirm")}
        cancelLabel={t("account.cancel")}
        onConfirm={() => {
          setConfirm(false);
          void logout().then(() => navigate(ROUTES.auth.login, { replace: true }));
        }}
      />
    </div>
  );
}

export function ProfileInfoMobile() {
  const { t } = useTranslation("parent");
  const navigate = useNavigate();
  const { user } = useAuth();
  const { children } = useSelectedChild();
  const upload = useUpdateAvatarMutation();
  const remove = useRemoveAvatarMutation();
  const galleryRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const [photoOpen, setPhotoOpen] = useState(false);
  if (!user) return null;

  function pick(file: File | undefined) {
    if (!file) return;
    upload.mutate(file, {
      onSuccess: () => toast.success(t("settings.profile.photoSaved")),
      onError: (error: Error) => toast.error(error.message),
    });
  }

  function photoAction(key: PhotoAction) {
    if (key === "camera") cameraRef.current?.click();
    if (key === "upload") galleryRef.current?.click();
    if (key === "remove") remove.mutate(undefined, { onSuccess: () => toast.success(t("settings.profile.photoRemoved")) });
  }

  async function copy(value: string) {
    try {
      await navigator.clipboard.writeText(value);
      toast.success(t("createChild.copied"));
    } catch {
      toast.error(t("children.genericError"));
    }
  }

  const rows = [
    { icon: "alternate-email", label: t("mobile.settings.username"), value: `@${user.username}`, copy: user.username },
    { icon: "call", label: t("settings.profile.phone"), value: user.phone || "—" },
    { icon: "group", label: t("mobile.settings.roleLabel"), value: t("mobile.settings.role", { count: children.length }) },
  ];

  return (
    <div className="flex min-h-full flex-col gap-4 px-4 pt-5 pb-[max(24px,env(safe-area-inset-bottom))]">
      <MobilePageHeader title={t("mobile.settings.info")} backLabel={t("account.profile")} onBack={() => navigate(ROUTES.parent.profile)} />
      <section className="flex flex-col items-center gap-2 pt-2">
        <span className="relative">
          <Avatar name={user.name} src={user.avatarUrl ?? undefined} size="xl" className="[&_.avatar]:size-24" />
          <button
            type="button"
            className="absolute right-0 bottom-0 grid size-9 place-items-center rounded-full border-[3px] border-canvas bg-brand text-on-action"
            aria-label={t("settings.profile.photo")}
            disabled={upload.isPending || remove.isPending}
            onClick={() => setPhotoOpen(true)}
          >
            <Icon name="photo-camera-fill" size={16} />
          </button>
        </span>
        <h2 className="font-heading text-[20px]/7 font-semibold text-ink">{user.name}</h2>
      </section>
      <ul className="flex flex-col overflow-hidden rounded-[20px] bg-surface">
        {rows.map((row) => (
          <li key={row.label} className="flex items-center gap-3 border-b border-line px-4 py-3.5 last:border-b-0">
            <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-subtle text-icon-secondary">
              <Icon name={row.icon} size={22} />
            </span>
            <span className="flex min-w-0 flex-1 flex-col">
              <small className="text-caption text-ink-secondary">{row.label}</small>
              <strong className="truncate text-title-sm text-ink">{row.value}</strong>
            </span>
            {row.copy ? (
              <button type="button" className="grid size-9 shrink-0 place-items-center rounded-full bg-subtle text-icon" aria-label={t("createChild.copy")} onClick={() => void copy(row.copy)}>
                <Icon name="content-copy" size={18} />
              </button>
            ) : null}
          </li>
        ))}
      </ul>
      <span className="flex-1" />
      <button type="button" className={`${mobileButton.primary} w-full flex-none`} onClick={() => navigate(ROUTES.parent.settings("edit"))}>
        <Icon name="edit" size={20} />
        {t("mobile.settings.edit")}
      </button>
      <input ref={galleryRef} type="file" accept="image/*" hidden onChange={(event) => pick(event.target.files?.[0])} />
      <input ref={cameraRef} type="file" accept="image/*" capture="user" hidden onChange={(event) => pick(event.target.files?.[0])} />
      <AppDialog open={photoOpen} onOpenChange={setPhotoOpen} variant="sheet" title={t("mobile.settings.photoTitle")} description={t("mobile.settings.photoHint")}>
        <div className="flex flex-col pb-4">
          {PHOTO_ACTIONS.filter((item) => item.key !== "remove" || user.avatarUrl).map((item) => (
            <button
              key={item.key}
              type="button"
              className={`flex h-13 items-center gap-3 text-left text-title-sm ${item.key === "remove" ? "text-error-text" : "text-ink"}`}
              onClick={() => {
                setPhotoOpen(false);
                photoAction(item.key);
              }}
            >
              <Icon name={item.icon} size={22} />
              {item.key === "upload" ? t("mobile.settings.gallery") : t(`settings.profile.photoMenu.${item.key}`)}
            </button>
          ))}
        </div>
      </AppDialog>
    </div>
  );
}

function fieldError(error: unknown, key: string): string {
  const value = error instanceof AppError ? error.fields?.[key] : undefined;
  return Array.isArray(value) ? value.join(" ") : value ? String(value) : "";
}

export function ProfileEditMobile() {
  const { t } = useTranslation("parent");
  const navigate = useNavigate();
  const { user } = useAuth();
  const update = useUpdateProfileMutation();
  const [draft, setDraft] = useState<Record<Field, string>>(() => ({
    firstName: user?.firstName ?? "",
    lastName: user?.lastName ?? "",
    username: user?.username ?? "",
    phone: user?.phone ?? "",
  }));
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
  const errorCount = Object.values(errors).filter(Boolean).length;

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const local: Partial<Record<Field, string>> = {};
    if (!draft.firstName.trim()) local.firstName = t("settings.profile.required");
    if (!draft.username.trim()) local.username = t("settings.profile.required");
    if (draft.phone.trim() && !PHONE.test(draft.phone.trim())) local.phone = t("settings.profile.phoneInvalid");
    setErrors(local);
    if (Object.keys(local).length) return;
    update.mutate(
      { firstName: draft.firstName, lastName: draft.lastName, username: draft.username, phone: draft.phone },
      {
        onSuccess: () => {
          toast.success(t("settings.profile.saved"));
          navigate(ROUTES.parent.settings("profile"));
        },
        onError: (error) => {
          const next = Object.fromEntries(
            (["firstName", "lastName", "username", "phone"] as const)
              .map((key) => [key, fieldError(error, { firstName: "first_name", lastName: "last_name", username: "username", phone: "phone" }[key])])
              .filter(([, value]) => value)
          ) as Partial<Record<Field, string>>;
          setErrors(next);
          if (!Object.keys(next).length) toast.error(error.message);
        },
      }
    );
  }

  const field = (key: Field, label: string, hint?: string, type = "text") => (
    <label className="flex flex-col gap-2">
      <span className="text-body-sm font-medium text-ink">{label}</span>
      <span className="relative">
        <input
          className={`${MOBILE_INPUT_SURFACE} ${errors[key] ? "border-line-danger pr-12" : ""}`}
          type={type}
          value={draft[key]}
          autoCapitalize={key === "username" ? "none" : undefined}
          aria-invalid={Boolean(errors[key])}
          onChange={(event) => {
            const value = event.target.value;
            setDraft((current) => ({ ...current, [key]: value }));
            setErrors((current) => ({ ...current, [key]: "" }));
          }}
        />
        {errors[key] ? <Icon name="warning-fill" size={20} className="absolute top-1/2 right-4 -translate-y-1/2 text-error-text" /> : null}
      </span>
      {errors[key] ? <small className="text-body-xs text-error-text">{errors[key]}</small> : hint ? <small className="text-body-xs text-ink-tertiary">{hint}</small> : null}
    </label>
  );

  return (
    <form className="flex min-h-full flex-col gap-4 px-4 pt-5 pb-[max(24px,env(safe-area-inset-bottom))]" onSubmit={submit} noValidate>
      <MobilePageHeader title={t("mobile.settings.editTitle")} backLabel={t("mobile.settings.info")} onBack={() => navigate(ROUTES.parent.settings("profile"))} />
      <div className="grid grid-cols-2 gap-3">
        {field("firstName", t("settings.profile.firstName"))}
        {field("lastName", t("settings.profile.lastName"))}
      </div>
      {field("username", t("settings.profile.username"), t("settings.profile.usernameHint"))}
      {field("phone", t("settings.profile.phone"), undefined, "tel")}
      {errorCount ? (
        <p className="flex items-center gap-3 rounded-2xl bg-danger-bg px-4 py-3 text-body-sm text-error-text">
          <Icon name="warning-fill" size={20} className="shrink-0" />
          {t("settings.profile.errors", { count: errorCount })}
        </p>
      ) : null}
      <span className="flex-1" />
      <span className="flex gap-3">
        <button type="button" className={mobileButton.secondary} onClick={() => navigate(ROUTES.parent.settings("profile"))}>
          {t("settings.profile.cancel")}
        </button>
        <button type="submit" className={mobileButton.primary} disabled={update.isPending}>
          {t("settings.profile.save")}
        </button>
      </span>
    </form>
  );
}
