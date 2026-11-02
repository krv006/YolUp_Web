import { useTranslation } from "react-i18next";
import { useUpdateSettingsMutation } from "@/modules/auth";
import { SUPPORTED_LANGUAGES, useLanguageStore, type AppLanguage } from "@/shared/model";
import { useTheme } from "@/shared/model/theme.store";
import { Icon } from "@/shared/ui/icon";

const LANGUAGE_NAMES: Record<AppLanguage, string> = { uz: "O‘zbekcha", en: "English", ru: "Русский" };
const THEMES = [
  { id: "light", icon: "light-mode", preview: "bg-canvas", bar: "bg-surface", line: "bg-line-strong" },
  { id: "dark", icon: "dark-mode", preview: "bg-[#14152b]", bar: "bg-[#24264a]", line: "bg-[#3a3d6b]" },
  { id: "system", icon: "devices", preview: "bg-gradient-to-r from-canvas to-[#14152b]", bar: "bg-surface/70", line: "bg-line-strong" },
] as const;

function Radio({ active }: { active: boolean }) {
  return (
    <span className={`grid size-5 shrink-0 place-items-center rounded-full border-2 ${active ? "border-brand" : "border-line-strong"}`}>
      {active ? <span className="size-2.5 rounded-full bg-brand" /> : null}
    </span>
  );
}

export function SettingsInterface() {
  const { t } = useTranslation("parent");
  const language = useLanguageStore((state) => state.language);
  const setLanguage = useLanguageStore((state) => state.setLanguage);
  const { mode, setMode } = useTheme();
  const settings = useUpdateSettingsMutation();

  return (
    <section className="flex flex-col gap-5 rounded-[24px] bg-surface p-7">
      <h2 className="font-heading text-[20px]/7 font-semibold text-ink">{t("settings.interface.title")}</h2>

      <div className="flex flex-col gap-3">
        <small className="text-caption-strong tracking-wide text-ink-tertiary uppercase">{t("settings.interface.language")}</small>
        <div role="radiogroup" className="grid grid-cols-3 gap-3">
          {SUPPORTED_LANGUAGES.map((code) => {
            const active = language === code;
            return (
              <button
                key={code}
                type="button"
                role="radio"
                aria-checked={active}
                className={`flex h-16 items-center gap-3 rounded-2xl border-2 px-4 text-left transition-colors ${
                  active ? "border-brand bg-brand-subtle" : "border-transparent bg-subtle hover:bg-muted"
                }`}
                onClick={() => setLanguage(code)}
              >
                <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-surface text-caption-strong text-brand uppercase">
                  {code}
                </span>
                <strong className="min-w-0 flex-1 truncate text-title-sm text-ink">{LANGUAGE_NAMES[code]}</strong>
                <Radio active={active} />
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <small className="text-caption-strong tracking-wide text-ink-tertiary uppercase">{t("settings.interface.theme")}</small>
        <div role="radiogroup" className="grid grid-cols-3 gap-3">
          {THEMES.map((theme) => {
            const active = mode === theme.id;
            return (
              <button
                key={theme.id}
                type="button"
                role="radio"
                aria-checked={active}
                className={`flex flex-col gap-3 rounded-2xl border-2 p-3 text-left transition-colors ${
                  active ? "border-brand bg-brand-subtle" : "border-transparent bg-subtle hover:bg-muted"
                }`}
                onClick={() => {
                  setMode(theme.id);
                  settings.mutate({ theme: theme.id });
                }}
              >
                <span className={`flex h-[88px] flex-col gap-2 rounded-xl p-3 ${theme.preview}`} aria-hidden="true">
                  <span className={`h-2 w-1/4 rounded-full ${theme.line}`} />
                  <span className={`h-2 w-1/2 rounded-full ${theme.line}`} />
                  <span className={`mt-auto h-6 rounded-lg ${theme.bar}`} />
                </span>
                <span className="flex items-center gap-2 px-1">
                  <Icon name={theme.icon} size={18} className="shrink-0 text-icon-secondary" />
                  <strong className="min-w-0 flex-1 truncate text-title-sm text-ink">{t(`settings.interface.themes.${theme.id}`)}</strong>
                  <Radio active={active} />
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
