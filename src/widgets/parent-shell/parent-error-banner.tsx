import { useTranslation } from "react-i18next";
import { Icon } from "@/shared/ui/icon";

export function ParentErrorBanner({ onRetry }: { onRetry: () => void }) {
  const { t } = useTranslation(["parent", "common"]);
  return (
    <div className="-mb-1 flex items-center gap-3 rounded-2xl bg-surface-inverse px-5 py-3 text-body-sm text-ink-inverse">
      <Icon name="warning" size={20} className="shrink-0" />
      <span className="min-w-0 flex-1">{t("home.serverError")}</span>
      <button
        type="button"
        className="flex h-9 shrink-0 items-center rounded-full bg-surface px-4 text-button text-ink transition-colors hover:bg-subtle"
        onClick={onRetry}
      >
        {t("common:actions.retry")}
      </button>
    </div>
  );
}
