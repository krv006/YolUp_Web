import { Monitor, Moon, Sun } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useTheme, type ThemeMode } from "@/shared/model";
import { cn } from "@/shared/lib";

const MODES: Array<{ id: ThemeMode; icon: typeof Sun }> = [
  { id: "light", icon: Sun },
  { id: "dark", icon: Moon },
  { id: "system", icon: Monitor },
];

export function ThemeToggle({ className }: { className?: string }) {
  const { t } = useTranslation("common");
  const { mode, setMode } = useTheme();

  return (
    <div className={cn("theme-toggle", className)} role="radiogroup" aria-label={t("a11y.theme")}>
      {MODES.map((item) => {
        const Icon = item.icon;
        return (
          <button
            key={item.id}
            type="button"
            role="radio"
            aria-checked={mode === item.id}
            aria-label={t(`themeModes.${item.id}`)}
            title={t(`themeModes.${item.id}`)}
            className={mode === item.id ? "is-active" : ""}
            onClick={() => setMode(item.id)}
          >
            <Icon size={15} />
          </button>
        );
      })}
    </div>
  );
}

export function ThemeToggleButton({ className }: { className?: string }) {
  const { t } = useTranslation("common");
  const { resolved, toggle } = useTheme();
  return (
    <button
      type="button"
      className={cn("icon-button", className)}
      onClick={toggle}
      aria-label={resolved === "dark" ? t("a11y.toLightTheme") : t("a11y.toDarkTheme")}
    >
      {resolved === "dark" ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}
