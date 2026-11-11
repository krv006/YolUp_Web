import { ExternalLink } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Icon } from "@/shared/ui/icon";

export interface GoogleFormLinkProps {
  url: string;
  hint?: string;
  className?: string;
}

export function GoogleFormLink({ url, hint, className = "" }: GoogleFormLinkProps) {
  const { t } = useTranslation("homework");
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={`flex min-h-14 items-center gap-3 rounded-xl bg-accent-violet-bg px-3 py-2.5 text-left transition-opacity hover:opacity-85 ${className}`}
    >
      <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-surface text-accent-violet-fg">
        <Icon name="link" size={20} />
      </span>
      <span className="flex min-w-0 flex-1 flex-col">
        <strong className="truncate text-body-sm font-semibold text-ink">{t("googleForm.open")}</strong>
        <small className="line-clamp-2 text-caption text-ink-secondary">{hint ?? t("googleForm.hint")}</small>
      </span>
      <ExternalLink size={18} className="shrink-0 text-accent-violet-fg" />
    </a>
  );
}
