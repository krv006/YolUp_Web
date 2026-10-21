import { AlarmClock, BellRing, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  useAuth,
  useUpdateLessonReminderMutation,
  useUpdateNotificationPrefsMutation,
} from "@/modules/auth";
import { usePushNotifications } from "@/modules/notification";
import { ROLES } from "@/shared/constants";
import { SelectPicker } from "@/shared/ui/legacy/form-pickers";
import { Switch } from "@/shared/ui/switch";

const MINUTE_OPTIONS = [5, 10, 15, 30, 60];

function defaultMinutes(role: string | undefined): number {
  return role === ROLES.STUDENT ? 15 : 10;
}

export function NotificationSettings() {
  const { t } = useTranslation("account");
  const { user } = useAuth();
  const push = usePushNotifications();
  const reminder = useUpdateLessonReminderMutation();
  const prefs = useUpdateNotificationPrefsMutation();
  const minutes = user?.lessonReminderMinutes ?? defaultMinutes(user?.role);

  return (
    <>
      <div className="account-settings-row">
        <span>{t("settingsDialog.pushLabel")}</span>
        <div className="account-settings-control">
          {push.supported ? (
            <button
              type="button"
              className={`push-toggle ${push.enabled ? "is-on" : ""}`}
              disabled={push.pending || push.blocked}
              aria-pressed={push.enabled}
              onClick={() => push.toggle(!push.enabled)}
            >
              {push.pending ? <Loader2 size={15} className="spin" /> : <BellRing size={15} />}
              {push.enabled ? t("settingsDialog.pushOn") : t("settingsDialog.pushOff")}
            </button>
          ) : (
            <small className="account-settings-hint">{t("settingsDialog.pushUnsupported")}</small>
          )}
        </div>
      </div>
      {push.supported && push.blocked ? (
        <p className="account-settings-hint">{t("settingsDialog.pushBlocked")}</p>
      ) : null}
      {push.error ? <p className="account-settings-error">{push.error}</p> : null}

      <div className="account-settings-row">
        <span>{t("settingsDialog.messagesLabel")}</span>
        <div className="account-settings-control">
          <Switch
            checked={user?.notifyMessages !== false}
            disabled={prefs.isPending}
            onCheckedChange={(next) => prefs.mutate({ notifyMessages: next })}
            aria-label={t("settingsDialog.messagesLabel")}
          />
        </div>
      </div>
      <p className="account-settings-hint">{t("settingsDialog.messagesHint")}</p>

      <div className="account-settings-row">
        <span>{t("settingsDialog.emailLabel")}</span>
        <div className="account-settings-control">
          <Switch
            checked={user?.notifyEmail === true}
            disabled={prefs.isPending}
            onCheckedChange={(next) => prefs.mutate({ notifyEmail: next })}
            aria-label={t("settingsDialog.emailLabel")}
          />
        </div>
      </div>
      <p className="account-settings-hint">{t("settingsDialog.emailHint")}</p>

      <div className="account-settings-row">
        <span>{t("settingsDialog.reminderLabel")}</span>
        <div className="account-settings-control account-settings-control--picker">
          <SelectPicker
            hideLabel
            label={t("settingsDialog.reminderLabel")}
            icon={AlarmClock}
            value={String(minutes)}
            onChange={(value) => reminder.mutate(Number(value))}
            options={MINUTE_OPTIONS.map((value) => ({
              value: String(value),
              label: t("settingsDialog.reminderOption", { count: value }),
            }))}
          />
        </div>
      </div>
    </>
  );
}
