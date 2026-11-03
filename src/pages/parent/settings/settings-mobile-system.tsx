import { useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  useAuth,
  useChangePasswordMutation,
  useLogoutOtherSessionsMutation,
  useRevokeSessionMutation,
  useSessions,
  useUpdateLessonReminderMutation,
  useUpdateNotificationPrefsMutation,
  useUpdateSettingsMutation,
} from "@/modules/auth";
import { usePushNotifications } from "@/modules/notification";
import { parentLogins, passwordStrength } from "@/modules/parent";
import { AppError } from "@/shared/api";
import { ROUTES } from "@/shared/config";
import { formatRelativeShort } from "@/shared/lib";
import { SUPPORTED_LANGUAGES, useLanguageStore } from "@/shared/model";
import { useTheme } from "@/shared/model/theme.store";
import { AppDialog } from "@/shared/ui/app-dialog";
import { ConfirmDialog } from "@/shared/ui/confirm-dialog";
import { Icon } from "@/shared/ui/icon";
import { MOBILE_INPUT_SURFACE } from "@/shared/ui/mobile-fields";
import { MobilePageHeader, mobileButton } from "@/shared/ui/mobile-page";
import { Switch } from "@/shared/ui/switch";

const CHILD_ALERTS = [
  { key: "notifyChildAbsent", icon: "cancel", tone: "bg-danger-bg text-error-text" },
  { key: "notifyChildNewDevice", icon: "shield", tone: "bg-accent-violet-bg text-accent-violet-fg" },
  { key: "notifyHomeworkDue", icon: "hourglass-empty", tone: "bg-accent-saffron-bg text-accent-saffron-fg" },
] as const;
const SWITCH = "data-[state=checked]:bg-brand data-[state=unchecked]:bg-line-strong";
const REMINDERS = [5, 10, 15, 30, 60, 0];
const THEMES = [
  { id: "light", icon: "light-mode" },
  { id: "dark", icon: "dark-mode" },
  { id: "system", icon: "devices" },
] as const;

function Row({ icon, tone, title, text, children, onClick }: { icon: string; tone: string; title: string; text?: string; children?: React.ReactNode; onClick?: () => void }) {
  const body = (
    <>
      <span className={`grid size-11 shrink-0 place-items-center rounded-xl ${tone}`}>
        <Icon name={icon} size={22} />
      </span>
      <span className="flex min-w-0 flex-1 flex-col">
        <strong className="text-title-sm text-ink">{title}</strong>
        {text ? <small className="truncate text-body-xs text-ink-secondary">{text}</small> : null}
      </span>
      {children}
    </>
  );
  return (
    <li className="border-b border-line last:border-b-0">
      {onClick ? (
        <button type="button" className="flex w-full items-center gap-3 px-4 py-3.5 text-left" onClick={onClick}>
          {body}
        </button>
      ) : (
        <div className="flex items-center gap-3 px-4 py-3.5">{body}</div>
      )}
    </li>
  );
}

function Pills<T extends string>({ items, value, onChange, render }: { items: readonly T[]; value: T; onChange: (value: T) => void; render: (item: T) => React.ReactNode }) {
  return (
    <span className="flex shrink-0 gap-1 rounded-full bg-subtle p-1">
      {items.map((item) => (
        <button
          key={item}
          type="button"
          aria-pressed={value === item}
          className={`grid h-8 min-w-10 place-items-center rounded-full px-2.5 text-caption-strong transition-colors ${value === item ? "bg-surface text-brand shadow-sm" : "text-ink-secondary"}`}
          onClick={() => onChange(item)}
        >
          {render(item)}
        </button>
      ))}
    </span>
  );
}

export function SettingsMobile() {
  const { t } = useTranslation("parent");
  const navigate = useNavigate();
  const { user } = useAuth();
  const language = useLanguageStore((state) => state.language);
  const setLanguage = useLanguageStore((state) => state.setLanguage);
  const { mode, setMode } = useTheme();
  const settings = useUpdateSettingsMutation();
  const push = usePushNotifications();
  const prefs = useUpdateNotificationPrefsMutation();
  const reminder = useUpdateLessonReminderMutation();
  const [askPush, setAskPush] = useState(false);
  const [reminderOpen, setReminderOpen] = useState(false);
  const minutes = user?.lessonReminderMinutes ?? 0;
  const [draftMinutes, setDraftMinutes] = useState(minutes);
  const label = (value: number) =>
    !value
      ? t("settings.notifications.never")
      : value >= 60
        ? t("settings.notifications.hours", { count: value / 60 })
        : t("settings.notifications.minutes", { count: value });

  return (
    <div className="flex flex-col gap-4 px-4 pt-5 pb-10">
      <MobilePageHeader title={t("account.settings")} backLabel={t("account.profile")} onBack={() => navigate(ROUTES.parent.profile)} />
      <small className="px-1 text-body-sm text-ink-secondary">{t("settings.interface.title")}</small>
      <ul className="flex flex-col overflow-hidden rounded-[20px] bg-surface">
        <Row icon="translate" tone="bg-accent-blue-bg text-accent-blue-fg" title={t("settings.interface.language")}>
          <Pills items={SUPPORTED_LANGUAGES} value={language} onChange={setLanguage} render={(code) => code.toUpperCase()} />
        </Row>
        <Row icon="palette" tone="bg-accent-violet-bg text-accent-violet-fg" title={t("settings.interface.theme")}>
          <Pills
            items={THEMES.map((item) => item.id)}
            value={mode}
            onChange={(next) => {
              setMode(next);
              settings.mutate({ theme: next });
            }}
            render={(id) => <Icon name={THEMES.find((item) => item.id === id)?.icon ?? "light-mode"} size={18} />}
          />
        </Row>
      </ul>
      <small className="px-1 text-body-sm text-ink-secondary">{t("settings.notifications.title")}</small>
      <ul className="flex flex-col overflow-hidden rounded-[20px] bg-surface">
        <Row
          icon="notifications"
          tone="bg-accent-saffron-bg text-accent-saffron-fg"
          title={t("settings.notifications.push")}
          text={push.supported ? (push.blocked ? t("settings.notifications.pushBlocked") : t("settings.notifications.pushText")) : t("settings.notifications.pushUnsupported")}
        >
          <Switch size="lg" className={SWITCH} checked={push.enabled} disabled={!push.supported || push.pending || push.blocked} onCheckedChange={(next) => (next ? setAskPush(true) : push.toggle(false))} />
        </Row>
        <Row icon="mail" tone="bg-accent-blue-bg text-accent-blue-fg" title={t("settings.notifications.email")} text={t("settings.notifications.emailText")}>
          <Switch size="lg" className={SWITCH} checked={Boolean(user?.notifyEmail)} disabled={prefs.isPending} onCheckedChange={(next) => prefs.mutate({ notifyEmail: next })} />
        </Row>
        <Row
          icon="schedule"
          tone="bg-accent-green-bg text-accent-green-fg"
          title={t("settings.notifications.reminder")}
          onClick={() => {
            setDraftMinutes(minutes);
            setReminderOpen(true);
          }}
        >
          <small className="shrink-0 text-body-sm text-ink-secondary">{label(minutes)}</small>
          <Icon name="chevron-right" size={20} className="shrink-0 text-icon-tertiary" />
        </Row>
      </ul>
      <small className="px-1 text-body-sm text-ink-secondary">{t("settings.alerts.title")}</small>
      <ul className="flex flex-col overflow-hidden rounded-[20px] bg-surface">
        {CHILD_ALERTS.map((alert) => (
          <Row key={alert.key} icon={alert.icon} tone={alert.tone} title={t(`settings.alerts.${alert.key}.title`)} text={t(`settings.alerts.${alert.key}.text`)}>
            <Switch
              size="lg"
              className={SWITCH}
              checked={Boolean(user?.[alert.key])}
              disabled={prefs.isPending}
              aria-label={t(`settings.alerts.${alert.key}.title`)}
              onCheckedChange={(next) => prefs.mutate({ [alert.key]: next })}
            />
          </Row>
        ))}
        {user?.mutedKinds.length ? (
          <Row
            icon="notifications-off"
            tone="bg-subtle text-icon-secondary"
            title={t("settings.alerts.muted.title")}
            text={t("settings.alerts.muted.text", { count: user.mutedKinds.length })}
          >
            <button
              type="button"
              disabled={prefs.isPending}
              className="flex h-9 shrink-0 items-center rounded-full bg-brand-subtle px-3.5 text-button text-brand disabled:opacity-50"
              onClick={() => prefs.mutate({ mutedKinds: [] }, { onSuccess: () => toast.success(t("settings.alerts.muted.done")) })}
            >
              {t("settings.alerts.muted.reset")}
            </button>
          </Row>
        ) : null}
      </ul>

      <AppDialog
        open={reminderOpen}
        onOpenChange={setReminderOpen}
        variant="sheet"
        title={t("settings.notifications.reminder")}
        description={t("settings.notifications.reminderText")}
        footer={
          <button
            type="button"
            className={mobileButton.primary}
            disabled={reminder.isPending}
            onClick={() =>
              reminder.mutate(draftMinutes, {
                onSuccess: () => {
                  setReminderOpen(false);
                  toast.success(t("settings.notifications.reminderSaved"));
                },
                onError: (error: Error) => toast.error(error.message),
              })
            }
          >
            {t("settings.profile.save")}
          </button>
        }
      >
        <div role="radiogroup" className="flex flex-col">
          {REMINDERS.map((value) => (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={draftMinutes === value}
              className={`flex h-13 items-center justify-between text-title-sm ${draftMinutes === value ? "text-brand" : "text-ink"}`}
              onClick={() => setDraftMinutes(value)}
            >
              {label(value)}
              <span className={`grid size-6 place-items-center rounded-full border-2 ${draftMinutes === value ? "border-brand" : "border-line-strong"}`}>
                {draftMinutes === value ? <span className="size-3 rounded-full bg-brand" /> : null}
              </span>
            </button>
          ))}
        </div>
      </AppDialog>
      <ConfirmDialog
        tone="brand"
        open={askPush}
        onOpenChange={setAskPush}
        icon="notifications"
        title={t("settings.notifications.askTitle")}
        description={t("settings.notifications.askText")}
        confirmLabel={t("settings.notifications.allow")}
        cancelLabel={t("settings.notifications.later")}
        onConfirm={() => {
          setAskPush(false);
          push.toggle(true);
        }}
      />
    </div>
  );
}

export function SecurityMobile() {
  const { t } = useTranslation("parent");
  const navigate = useNavigate();
  const { user } = useAuth();
  const sessions = useSessions();
  const revoke = useRevokeSessionMutation();
  const logoutOthers = useLogoutOtherSessionsMutation();
  const [confirm, setConfirm] = useState(false);
  const list = sessions.data ?? [];
  const others = list.filter((item) => !item.isCurrent);

  return (
    <div className="flex flex-col gap-4 px-4 pt-5 pb-10">
      <MobilePageHeader title={t("settings.security.title")} backLabel={t("account.profile")} onBack={() => navigate(ROUTES.parent.profile)} />
      <p className="flex items-center gap-3 rounded-2xl bg-success-bg px-4 py-3 text-body-sm font-medium text-success-text">
        <Icon name="check-circle" size={20} className="shrink-0" />
        {t("mobile.settings.protected", { count: list.length || 1 })}
      </p>
      <small className="px-1 text-body-sm text-ink-secondary">{t("mobile.settings.password")}</small>
      <ul className="flex flex-col overflow-hidden rounded-[20px] bg-surface">
        <Row
          icon="key"
          tone="bg-brand-subtle text-brand"
          title={t("settings.security.password")}
          text={user?.passwordChangedAt ? t("mobile.settings.changedAt", { when: formatRelativeShort(user.passwordChangedAt) }) : undefined}
          onClick={() => navigate(ROUTES.parent.settings("password"))}
        >
          <Icon name="chevron-right" size={20} className="shrink-0 text-icon-tertiary" />
        </Row>
      </ul>
      <small className="px-1 text-body-sm text-ink-secondary">{t("mobile.settings.sessions", { count: list.length })}</small>
      <ul className={`flex flex-col overflow-hidden rounded-[20px] bg-surface ${sessions.isLoading ? "animate-pulse" : ""}`}>
        {list.map((session) => (
          <Row
            key={session.id}
            icon={parentLogins.deviceKind(session.device) === "computer" ? "laptop" : "smartphone"}
            tone="bg-subtle text-icon-secondary"
            title={session.device || t("settings.security.unknownDevice")}
            text={[session.city, session.isCurrent ? t("settings.security.now") : session.lastActive ? formatRelativeShort(session.lastActive) : ""].filter(Boolean).join(" · ")}
          >
            {session.isCurrent ? (
              <span className="flex shrink-0 items-center gap-1 rounded-full bg-success-bg px-2.5 py-1 text-caption-strong text-success-text">
                <Icon name="check-circle" size={14} />
                {t("settings.security.current")}
              </span>
            ) : (
              <button
                type="button"
                className="h-9 shrink-0 rounded-full bg-brand-subtle px-3.5 text-caption-strong text-brand disabled:opacity-50"
                disabled={revoke.isPending}
                onClick={() => revoke.mutate(session.id, { onSuccess: () => toast.success(t("settings.security.ended")) })}
              >
                {t("mobile.settings.signOut")}
              </button>
            )}
          </Row>
        ))}
      </ul>
      {others.length ? (
        <ul className="flex flex-col overflow-hidden rounded-[20px] bg-surface">
          <Row icon="logout" tone="bg-danger-bg text-error-text" title={t("settings.security.endOthers")} onClick={() => setConfirm(true)} />
        </ul>
      ) : null}
      <small className="px-1 text-body-xs text-ink-secondary">{t("logins.tip.text")}</small>
      <ConfirmDialog
        open={confirm}
        onOpenChange={setConfirm}
        icon="logout"
        title={t("mobile.settings.endOthersTitle")}
        description={t("mobile.settings.endOthersText", { count: others.length })}
        confirmLabel={t("mobile.settings.endOthersConfirm")}
        cancelLabel={t("account.cancel")}
        pending={logoutOthers.isPending}
        onConfirm={() =>
          logoutOthers.mutate(undefined, {
            onSuccess: () => {
              setConfirm(false);
              toast.success(t("settings.security.othersEnded"));
            },
          })
        }
      />
    </div>
  );
}

export function PasswordMobile() {
  const { t } = useTranslation("parent");
  const navigate = useNavigate();
  const change = useChangePasswordMutation();
  const [values, setValues] = useState({ current: "", next: "", repeat: "" });
  const [errors, setErrors] = useState<Partial<Record<"current" | "next" | "repeat", string>>>({});
  const strength = passwordStrength(values.next);
  const errorCount = Object.values(errors).filter(Boolean).length;

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const local: typeof errors = {};
    if (!strength.length || !strength.digit) local.next = t("settings.security.weak");
    if (values.repeat !== values.next) local.repeat = t("settings.security.mismatch");
    setErrors(local);
    if (Object.keys(local).length) return;
    change.mutate(
      { currentPassword: values.current, newPassword: values.next },
      {
        onSuccess: () => {
          toast.success(t("settings.security.changed"));
          navigate(ROUTES.parent.settings("security"));
        },
        onError: (error) => {
          const fields = error instanceof AppError ? error.fields : null;
          const pick = (key: string) => {
            const value = fields?.[key];
            return Array.isArray(value) ? value.join(" ") : value ? String(value) : "";
          };
          const next = { current: pick("current_password") || (pick("new_password") ? "" : error.message), next: pick("new_password") };
          setErrors(Object.fromEntries(Object.entries(next).filter(([, value]) => value)));
        },
      }
    );
  }

  const field = (key: "current" | "next" | "repeat", label: string, hint?: string) => (
    <label className="flex flex-col gap-2">
      <span className="text-body-sm font-medium text-ink">{label}</span>
      <span className="relative">
        <input
          className={`${MOBILE_INPUT_SURFACE} ${errors[key] ? "border-line-danger pr-12" : ""}`}
          type="password"
          autoComplete={key === "current" ? "current-password" : "new-password"}
          value={values[key]}
          onChange={(event) => {
            const value = event.target.value;
            setValues((current) => ({ ...current, [key]: value }));
            setErrors((current) => ({ ...current, [key]: "" }));
          }}
        />
        {errors[key] ? <Icon name="warning-fill" size={20} className="absolute top-1/2 right-4 -translate-y-1/2 text-error-text" /> : null}
      </span>
      {errors[key] ? <small className="text-body-xs text-error-text">{errors[key]}</small> : hint ? <small className="text-body-xs text-ink-tertiary">{hint}</small> : null}
    </label>
  );
  const tone = strength.level === "strong" ? "bg-success" : strength.level === "medium" ? "bg-saffron" : "bg-danger";

  return (
    <form className="flex min-h-full flex-col gap-4 px-4 pt-5 pb-[max(24px,env(safe-area-inset-bottom))]" onSubmit={submit} noValidate>
      <MobilePageHeader title={t("settings.security.password")} backLabel={t("settings.security.title")} onBack={() => navigate(ROUTES.parent.settings("security"))} />
      {errorCount ? (
        <p className="flex items-center gap-3 rounded-2xl bg-danger-bg px-4 py-3 text-body-sm font-medium text-error-text">
          <Icon name="warning-fill" size={20} className="shrink-0" />
          {t("mobile.settings.fixFields", { count: errorCount })}
        </p>
      ) : null}
      {field("current", t("mobile.settings.currentPassword"))}
      {field("next", t("settings.security.next"), t("mobile.settings.secret"))}
      {field("repeat", t("settings.security.repeat"))}
      <section className="flex flex-col gap-3 rounded-[20px] bg-surface px-4 py-4">
        <span className="flex items-center justify-between">
          <strong className="text-body-sm text-ink-secondary">{t("mobile.settings.strength")}</strong>
          <span className="rounded-full bg-subtle px-2.5 py-1 text-caption-strong text-ink">{t(`mobile.settings.levels.${strength.level}`)}</span>
        </span>
        <span className="h-1.5 overflow-hidden rounded-full bg-subtle">
          <span className={`block h-full rounded-full ${tone}`} style={{ width: `${(strength.score / 4) * 100}%` }} />
        </span>
        {(["length", "digit", "cases"] as const).map((rule) => (
          <span key={rule} className="flex items-center gap-2 text-body-xs text-ink">
            <Icon name={strength[rule] ? "check-circle" : "radio-unchecked"} size={18} className={strength[rule] ? "text-success" : "text-icon-tertiary"} />
            {t(`mobile.settings.rules.${rule}`)}
          </span>
        ))}
      </section>
      <span className="flex-1" />
      <span className="flex gap-3">
        <button type="button" className={mobileButton.secondary} onClick={() => navigate(ROUTES.parent.settings("security"))}>
          {t("settings.profile.cancel")}
        </button>
        <button type="submit" className={mobileButton.primary} disabled={!values.current || !values.next || !values.repeat || change.isPending}>
          {t("mobile.settings.update")}
        </button>
      </span>
    </form>
  );
}
