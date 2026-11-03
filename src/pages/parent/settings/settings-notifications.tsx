import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { useAuth, useUpdateLessonReminderMutation, useUpdateNotificationPrefsMutation } from "@/modules/auth";
import { usePushNotifications } from "@/modules/notification";
import { ConfirmDialog } from "@/shared/ui/confirm-dialog";
import { Icon } from "@/shared/ui/icon";
import { Switch } from "@/shared/ui/switch";

const REMINDERS = [5, 10, 15, 30, 60, 0];
const CHILD_ALERTS = [
  { key: "notifyChildAbsent", icon: "cancel", tone: "bg-danger-bg text-error-text" },
  { key: "notifyChildNewDevice", icon: "shield", tone: "bg-accent-violet-bg text-accent-violet-fg" },
  { key: "notifyHomeworkDue", icon: "hourglass-empty", tone: "bg-accent-saffron-bg text-accent-saffron-fg" },
] as const;
const SWITCH = "data-[state=checked]:bg-brand data-[state=unchecked]:bg-line-strong";

function Row({
  icon,
  tone,
  title,
  text,
  children,
}: {
  icon: string;
  tone: string;
  title: string;
  text: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-4 border-b border-line py-4 last:border-b-0">
      <span className={`grid size-11 shrink-0 place-items-center rounded-xl ${tone}`}>
        <Icon name={icon} size={22} />
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <strong className="text-title-sm text-ink">{title}</strong>
        <small className="text-body-xs text-ink-secondary">{text}</small>
      </span>
      {children}
    </div>
  );
}

export function SettingsNotifications() {
  const { t } = useTranslation("parent");
  const { user } = useAuth();
  const push = usePushNotifications();
  const prefs = useUpdateNotificationPrefsMutation();
  const reminder = useUpdateLessonReminderMutation();
  const [askPush, setAskPush] = useState(false);
  const minutes = user?.lessonReminderMinutes ?? 0;

  function reminderLabel(value: number): string {
    if (!value) return t("settings.notifications.never");
    if (value >= 60) return t("settings.notifications.hours", { count: value / 60 });
    return t("settings.notifications.minutes", { count: value });
  }

  return (
    <section className="flex flex-col gap-5 rounded-[24px] bg-surface p-7">
      <span className="flex flex-col gap-1">
        <h2 className="font-heading text-[20px]/7 font-semibold text-ink">{t("settings.notifications.title")}</h2>
        <small className="text-body-sm text-ink-secondary">{t("settings.notifications.subtitle")}</small>
      </span>

      <div className="flex flex-col">
        <small className="text-caption-strong tracking-wide text-ink-tertiary uppercase">{t("settings.notifications.channels")}</small>
        <Row
          icon="notifications"
          tone="bg-accent-saffron-bg text-accent-saffron-fg"
          title={t("settings.notifications.push")}
          text={push.supported ? (push.blocked ? t("settings.notifications.pushBlocked") : t("settings.notifications.pushText")) : t("settings.notifications.pushUnsupported")}
        >
          <Switch
            size="lg"
            className={SWITCH}
            checked={push.enabled}
            disabled={!push.supported || push.pending || push.blocked}
            aria-label={t("settings.notifications.push")}
            onCheckedChange={(next) => (next ? setAskPush(true) : push.toggle(false))}
          />
        </Row>
        <Row icon="mail" tone="bg-accent-blue-bg text-accent-blue-fg" title={t("settings.notifications.email")} text={t("settings.notifications.emailText")}>
          <Switch
            size="lg"
            className={SWITCH}
            checked={Boolean(user?.notifyEmail)}
            disabled={prefs.isPending}
            aria-label={t("settings.notifications.email")}
            onCheckedChange={(next) => prefs.mutate({ notifyEmail: next })}
          />
        </Row>
      </div>

      <div className="flex items-center gap-4 rounded-2xl bg-subtle px-5 py-4">
        <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-surface text-accent-teal-fg">
          <Icon name="schedule" size={22} />
        </span>
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <strong className="text-title-sm text-ink">{t("settings.notifications.reminder")}</strong>
          <small className="text-body-xs text-ink-secondary">{t("settings.notifications.reminderText")}</small>
        </span>
        <label className="flex flex-col gap-1.5">
          <small className="text-body-sm font-medium text-ink">{t("settings.notifications.when")}</small>
          <select
            className="h-12 w-56 rounded-2xl border border-transparent bg-surface px-4 text-body text-ink outline-none focus:border-focus"
            value={minutes}
            disabled={reminder.isPending}
            onChange={(event) =>
              reminder.mutate(Number(event.target.value), {
                onSuccess: () => toast.success(t("settings.notifications.reminderSaved")),
                onError: (error: Error) => toast.error(error.message),
              })
            }
          >
            {REMINDERS.map((value) => (
              <option key={value} value={value}>
                {reminderLabel(value)}
              </option>
            ))}
          </select>
        </label>
      </div>

      <ConfirmDialog
        alert
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
      <div className="flex flex-col">
        <small className="text-caption-strong tracking-wide text-ink-tertiary uppercase">{t("settings.alerts.title")}</small>
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
              className="flex h-10 shrink-0 items-center rounded-full border border-line-strong bg-surface px-4 text-button text-ink transition-colors hover:bg-subtle disabled:opacity-50"
              onClick={() => prefs.mutate({ mutedKinds: [] }, { onSuccess: () => toast.success(t("settings.alerts.muted.done")) })}
            >
              {t("settings.alerts.muted.reset")}
            </button>
          </Row>
        ) : null}
      </div>
    </section>
  );
}
