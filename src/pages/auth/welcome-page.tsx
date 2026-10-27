import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Navigate, useNavigate } from "react-router-dom";
import { resolveHomeRoute, useAuth } from "@/modules/auth";
import { AuthButton } from "@/modules/auth";
import { SUPPORTED_LANGUAGES, useLanguageStore, type AppLanguage } from "@/shared/model";
import logoUrl from "@/shared/assets/y-logo.svg";

const FLAGS: Record<AppLanguage, string> = { uz: "🇺🇿", ru: "🇷🇺", en: "🇬🇧" };
const CODES: Record<AppLanguage, string> = { uz: "UZ", ru: "RU", en: "EN" };

export function WelcomePage() {
  const { t } = useTranslation("auth");
  const { t: common } = useTranslation("common");
  const navigate = useNavigate();
  const { user } = useAuth();
  const language = useLanguageStore((state) => state.language);
  const setLanguage = useLanguageStore((state) => state.setLanguage);
  const [open, setOpen] = useState(false);

  if (user) return <Navigate to={resolveHomeRoute(user)} replace />;

  return (
    <main className="relative flex min-h-dvh flex-col bg-canvas bg-auth-gradient px-4 pt-2 pb-6 font-body text-ink">
      <div className="relative z-10 flex shrink-0 justify-end pt-6">
        <button
          type="button"
          className="flex h-9 items-center gap-1 rounded-full bg-surface px-2.5 text-label-sm text-ink shadow-xs"
          aria-haspopup="listbox"
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
        >
          <span aria-hidden="true">{FLAGS[language]}</span>
          {CODES[language]}
          <ChevronDown size={14} className="text-ink-secondary" />
        </button>

        {open ? (
          <ul
            className="absolute top-12 right-0 z-10 flex w-[140px] flex-col gap-0.5 rounded-2xl border border-line bg-surface p-1.5 shadow-xl"
            role="listbox"
          >
            {SUPPORTED_LANGUAGES.map((code) => (
              <li key={code}>
                <button
                  type="button"
                  role="option"
                  aria-selected={language === code}
                  className={`flex h-11 w-full items-center gap-2 rounded-xl px-3 text-left text-label-strong transition-colors ${
                    language === code ? "bg-action-subtle text-action" : "text-ink hover:bg-subtle"
                  }`}
                  onClick={() => {
                    setLanguage(code);
                    setOpen(false);
                  }}
                >
                  <span aria-hidden="true">{FLAGS[code]}</span>
                  {common(`language.${code}`)}
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <img className="size-34 select-none" src={logoUrl} alt="YolUp" draggable={false} />
      </div>

      <div className="relative z-10 mx-auto mt-auto flex w-full max-w-[420px] shrink-0 flex-col gap-3 pb-10">
        <AuthButton onClick={() => navigate("/login")}>{t("form.submit")}</AuthButton>
        <AuthButton variant="secondary" onClick={() => navigate("/register")}>
          {t("mobile.login.registerLink")}
        </AuthButton>
      </div>
    </main>
  );
}
