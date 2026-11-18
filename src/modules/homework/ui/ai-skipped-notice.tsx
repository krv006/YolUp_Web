import { useTranslation } from "react-i18next";
import { Icon } from "@/shared/ui/icon";

export function AiSkippedNotice({ count, className = "" }: { count: number; className?: string }) {
  const { t } = useTranslation("homework");
  if (count <= 0) return null;
  return (
    <p className={`flex items-start gap-2 rounded-lg bg-warning-bg px-3 py-2 text-left text-body-xs text-warning-fg ${className}`}>
      <Icon name="warning" size={16} className="mt-0.5 shrink-0" />
      <span>{t("aiSkipped", { count })}</span>
    </p>
  );
}
