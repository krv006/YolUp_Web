import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { useAuth, useUpdateLessonReminderMutation } from "@/modules/auth";
import { usePushNotifications } from "@/modules/notification";
import { ROLES } from "@/shared/constants";
import { useIsCompact } from "@/shared/hooks/use-media-query";
import { useLanguageStore, useTextSizeStore, type TextSize } from "@/shared/model";
import { useTheme } from "@/shared/model/theme.store";
import { AppDialog, dialogButton } from "@/shared/ui/app-dialog";
import { Icon } from "@/shared/ui/icon";
import { Switch } from "@/shared/ui/switch";
import { SETTINGS_TONES } from "./settings-tones";
import { ProfileSubPage, SettingsRow, SettingsSection } from "./profile-shell";

const LANGUAGES = [
  { id: "uz", label: "O‘zbekcha" },
  { id: "ru", label: "Русский" },
  { id: "en", label: "English" },
] as const;

const SIZES: TextSize[] = ["small", "medium", "large"];
const MINUTE_OPTIONS = [5, 10, 15, 30, 60];

const SEGMENT =
  "flex h-9 min-w-0 flex-1 items-center justify-center rounded-full text-button transition-colors max-lg:h-10 max-lg:text-body-sm max-lg:font-medium";

function Segmented<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: ReadonlyArray<{ id: T; label: string }>;
  onChange: (next: T) => void;
}) {
  return (
    <div className="flex items-center gap-1 rounded-full bg-subtle p-1 max-lg:p-[5px]">
      {options.map((option) => (
        <button
          key={option.id}
          type="button"
          className={`${SEGMENT} ${
            value === option.id
              ? "bg-brand text-on-action"
              : "text-ink-secondary hover:text-ink max-lg:text-ink"
          }`}
          onClick={() => onChange(option.id)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

export function SystemSettingsPage() {
  const { t } = useTranslation("account");
  const { user } = useAuth();
  const isCompact = useIsCompact();
  const language = useLanguageStore((state) => state.language);
  const setLanguage = useLanguageStore((state) => state.setLanguage);
  const { mode, setMode } = useTheme();
  const size = useTextSizeStore((state) => state.size);
  const setSize = useTextSizeStore((state) => state.setSize);
  const push = usePushNotifications();
  const reminder = useUpdateLessonReminderMutation();
  const [languageOpen, setLanguageOpen] = useState(false);
  const [reminderOpen, setReminderOpen] = useState(false);
  const [draftLanguage, setDraftLanguage] = useState(language);

  const minutes =
    user?.lessonReminderMinutes ?? (user?.role === ROLES.STUDENT ? 15 : 10);
  const languageLabel = LANGUAGES.find((item) => item.id === language)?.label ?? "";

  return (
    <ProfileSubPage title={t("page.systemTitle")}>
      <SettingsSection label={t("page.generalSectionTitle")}>
        <SettingsRow
          icon="settings"
          tone={SETTINGS_TONES.brand}
          title={t("page.language")}
          value={languageLabel}
          onClick={() => {
            setDraftLanguage(language);
            setLanguageOpen(true);
          }}
        />

        <div className="flex flex-col gap-3 px-4 py-4 max-lg:gap-[11px] max-lg:pt-3 max-lg:pb-3.5">
          <span className="flex items-center gap-3">
            <span
              className={`grid size-9 shrink-0 place-items-center rounded-md max-lg:size-10 ${SETTINGS_TONES.violet}`}
            >
              <Icon name="star" size={18} className="max-lg:size-5" />
            </span>
            <strong className="min-w-0 flex-1 truncate text-title-sm text-ink max-lg:text-title">
              {t("page.theme")}
            </strong>
          </span>

          <Segmented
            value={mode}
            onChange={setMode}
            options={[
              { id: "light", label: t("page.themeLight") },
              { id: "dark", label: t("page.themeDark") },
              { id: "system", label: t("page.themeSystem") },
            ]}
          />
        </div>

        <div className="flex flex-col gap-3 px-4 py-4 max-lg:gap-[11px] max-lg:pt-3 max-lg:pb-3.5">
          <span className="flex items-center gap-3">
            <span
              className={`grid size-9 shrink-0 place-items-center rounded-md max-lg:size-10 ${SETTINGS_TONES.warning}`}
            >
              <Icon name="edit" size={18} className="max-lg:size-5" />
            </span>
            <strong className="min-w-0 flex-1 truncate text-title-sm text-ink max-lg:text-title">
              {t("page.textSize")}
            </strong>
          </span>

          <Segmented
            value={size}
            onChange={setSize}
            options={[
              { id: SIZES[0], label: t("page.textSmall") },
              { id: SIZES[1], label: t("page.textMedium") },
              { id: SIZES[2], label: t("page.textLarge") },
            ]}
          />
        </div>
      </SettingsSection>

      <SettingsSection label={t("page.notificationsSectionTitle")}>
        <SettingsRow
          icon="bell"
          tone={SETTINGS_TONES.brand}
          title={t("page.pushTitle")}
          hint={
            push.supported
              ? push.enabled
                ? t("page.pushOn")
                : t("page.pushOff")
              : t("settingsDialog.pushUnsupported")
          }
          right={
            <Switch
              size={isCompact ? "lg" : "default"}
              checked={push.enabled}
              disabled={!push.supported || push.pending || push.blocked}
              onCheckedChange={(next) => push.toggle(next)}
              aria-label={t("page.pushTitle")}
            />
          }
        />

        <SettingsRow
          icon="clock"
          tone={SETTINGS_TONES.success}
          title={t("page.lessonReminder")}
          value={t("page.reminderValue", { count: minutes })}
          onClick={() => setReminderOpen(true)}
        />
      </SettingsSection>

      <AppDialog
        open={languageOpen}
        onOpenChange={setLanguageOpen}
        variant="confirm"
        width="lg:w-100"
        title={t("page.language")}
        footer={
          <>
            <button
              type="button"
              className={dialogButton.secondary}
              onClick={() => setLanguageOpen(false)}
            >
              {t("page.cancel")}
            </button>
            <button
              type="button"
              className={dialogButton.primary}
              onClick={() => {
                setLanguage(draftLanguage);
                setLanguageOpen(false);
              }}
            >
              {t("page.save")}
            </button>
          </>
        }
      >
        <div className="flex flex-col gap-1">
          {LANGUAGES.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`flex items-center gap-3 rounded-md px-4 py-3 text-left transition-colors ${
                draftLanguage === item.id ? "bg-brand-subtle text-brand" : "text-ink hover:bg-subtle"
              }`}
              onClick={() => setDraftLanguage(item.id)}
            >
              <span className="min-w-0 flex-1 truncate text-body">{item.label}</span>
              {draftLanguage === item.id ? <Icon name="check-circle" size={20} /> : null}
            </button>
          ))}
        </div>
      </AppDialog>

      <AppDialog
        open={reminderOpen}
        onOpenChange={setReminderOpen}
        variant="confirm"
        width="lg:w-100"
        title={t("page.lessonReminder")}
      >
        <div className="flex flex-col gap-1">
          {MINUTE_OPTIONS.map((option) => (
            <button
              key={option}
              type="button"
              className={`flex items-center gap-3 rounded-md px-4 py-3 text-left transition-colors ${
                minutes === option ? "bg-brand-subtle text-brand" : "text-ink hover:bg-subtle"
              }`}
              disabled={reminder.isPending}
              onClick={() =>
                reminder.mutate(option, {
                  onSuccess: () => setReminderOpen(false),
                  onError: (error: Error) => toast.error(error.message),
                })
              }
            >
              <span className="min-w-0 flex-1 truncate text-body">
                {t("page.reminderValue", { count: option })}
              </span>
              {minutes === option ? <Icon name="check-circle" size={20} /> : null}
            </button>
          ))}
        </div>
      </AppDialog>
    </ProfileSubPage>
  );
}
