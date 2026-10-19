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
    <main className="flex min-h-dvh flex-col bg-canvas px-5 pt-4 pb-7">
      <div className="relative flex shrink-0 justify-end">
        <button
          type="button"
          className="flex h-10 items-center gap-1.5 rounded-full bg-subtle px-3 text-label-strong text-ink"
          aria-haspopup="listbox"
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
        >
          <span aria-hidden="true">{FLAGS[language]}</span>
          {CODES[language]}
          <ChevronDown size={16} className="text-ink-secondary" />
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

      <div className="flex flex-1 items-center justify-center py-10">
        <img className="size-32 select-none" src={logoUrl} alt="YolUp" draggable={false} />
      </div>

      <div className="mx-auto flex w-full max-w-[420px] shrink-0 flex-col gap-3">
        <AuthButton onClick={() => navigate("/login")}>{t("form.submit")}</AuthButton>
        <AuthButton variant="secondary" onClick={() => navigate("/register")}>
          {t("mobile.login.registerLink")}
        </AuthButton>
      </div>
    </main>
  );
}
