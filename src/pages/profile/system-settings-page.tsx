import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { NotificationSettings } from "@/widgets/account-menu/notification-settings";
import { useLanguageStore, useTextSizeStore, type TextSize } from "@/shared/model";
import { useTheme } from "@/shared/model/theme.store";
import { AppDialog, dialogButton } from "@/shared/ui/app-dialog";
import { Icon } from "@/shared/ui/icon";
import { ProfileSubPage, SettingsRow, SettingsSection } from "./profile-shell";

const LANGUAGES = [
  { id: "uz", label: "O‘zbekcha" },
  { id: "ru", label: "Русский" },
  { id: "en", label: "English" },
] as const;

const SIZES: TextSize[] = ["small", "medium", "large"];

export function SystemSettingsPage() {
  const { t } = useTranslation("account");
  const language = useLanguageStore((state) => state.language);
  const setLanguage = useLanguageStore((state) => state.setLanguage);
  const { mode, setMode } = useTheme();
  const size = useTextSizeStore((state) => state.size);
  const setSize = useTextSizeStore((state) => state.setSize);
  const [languageOpen, setLanguageOpen] = useState(false);
  const [draftLanguage, setDraftLanguage] = useState(language);

  const themes = [
    { id: "light" as const, label: t("page.themeLight"), preview: "bg-surface" },
    { id: "dark" as const, label: t("page.themeDark"), preview: "bg-ink" },
    { id: "system" as const, label: t("page.themeSystem"), preview: "bg-linear-to-r from-surface to-ink" },
  ];

  return (
    <ProfileSubPage title={t("page.systemTitle")}>
      <SettingsSection label={t("page.generalSection")}>
        <div className="flex flex-col gap-3 p-4">
          <div className="flex items-center gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-action text-on-action">
              <Icon name="more" size={18} />
            </span>
            <span className="flex min-w-0 flex-1 flex-col">
              <strong className="text-label-strong text-ink">{t("page.language")}</strong>
              <small className="text-caption text-ink-tertiary">{t("page.languageHint")}</small>
            </span>
          </div>
          <div className="flex items-center gap-1 rounded-full bg-subtle p-1">
            {LANGUAGES.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`h-10 flex-1 rounded-full text-label-strong transition-colors ${
                  language === item.id ? "bg-surface text-ink shadow-xs" : "text-ink-secondary"
                }`}
                onClick={() => {
                  setDraftLanguage(item.id);
                  setLanguageOpen(true);
                }}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-3 p-4">
          <div className="flex items-center gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-saffron-strong text-white">
              <Icon name="clock" size={18} />
            </span>
            <span className="flex min-w-0 flex-1 flex-col">
              <strong className="text-label-strong text-ink">{t("page.theme")}</strong>
              <small className="text-caption text-ink-tertiary">{t("page.themeHint")}</small>
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {themes.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`flex flex-col items-center gap-2 rounded-xl border p-2 transition-colors ${
                  mode === item.id ? "border-action bg-action-subtle" : "border-line bg-surface"
                }`}
                onClick={() => setMode(item.id)}
              >
                <span className={`h-12 w-full rounded-lg border border-line ${item.preview}`} />
                <span className="flex items-center gap-1.5 text-caption text-ink">
                  <span
                    className={`grid size-3.5 place-items-center rounded-full border ${
                      mode === item.id ? "border-action" : "border-line"
                    }`}
                  >
                    {mode === item.id ? <span className="size-2 rounded-full bg-action" /> : null}
                  </span>
                  {item.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-3 p-4">
          <div className="flex items-center gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-action text-on-action">
              <Icon name="assign" size={18} />
            </span>
            <strong className="flex-1 text-label-strong text-ink">{t("page.textSize")}</strong>
            <small className="text-label-strong text-action">{t(`page.text${size === "small" ? "Small" : size === "large" ? "Large" : "Medium"}`)}</small>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-caption text-ink-tertiary">A</span>
            <input
              className="h-1.5 flex-1 accent-[var(--action-primary)]"
              type="range"
              min={0}
              max={2}
              step={1}
              value={SIZES.indexOf(size)}
              onChange={(event) => setSize(SIZES[Number(event.target.value)])}
              aria-label={t("page.textSize")}
            />
            <span className="text-h3 text-ink-tertiary">A</span>
          </div>
        </div>
      </SettingsSection>

      <section className="flex flex-col gap-2">
        <span className="px-1 text-caption-strong tracking-wide text-ink-tertiary uppercase">
          {t("page.notificationsSection")}
        </span>
        <div className="overflow-hidden rounded-2xl border border-line bg-surface p-4">
          <NotificationSettings />
        </div>
      </section>

      <SettingsSection label={t("page.dataSection")}>
        <SettingsRow
          icon="more"
          tone="bg-ink-tertiary text-white"
          title={t("page.clearCache")}
          onClick={() => {
            try {
              localStorage.removeItem("REACT_QUERY_OFFLINE_CACHE");
            } catch {
              /* ignore */
            }
            toast.success(t("page.cacheCleared"));
          }}
        />
      </SettingsSection>

      <AppDialog
        open={languageOpen}
        onOpenChange={setLanguageOpen}
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
        <div className="flex flex-col">
          {LANGUAGES.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`flex items-center gap-3 rounded-xl px-4 py-3.5 text-left transition-colors ${
                draftLanguage === item.id ? "bg-action-subtle text-action" : "text-ink hover:bg-subtle"
              }`}
              onClick={() => setDraftLanguage(item.id)}
            >
              <span className="flex-1 text-body">{item.label}</span>
              {draftLanguage === item.id ? <Icon name="check-circle" size={20} /> : null}
            </button>
          ))}
        </div>
      </AppDialog>
    </ProfileSubPage>
  );
}
