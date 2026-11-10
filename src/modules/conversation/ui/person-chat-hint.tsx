import { useTranslation } from "react-i18next";
import { Icon } from "@/shared/ui/icon";
import type { DirectChatAction } from "../model/use-start-direct-chat";

export function PersonChatHint({ action }: { action: DirectChatAction }) {
  const { t } = useTranslation("chat");
  if (action === "open") return <Icon name="chevron-right" size={18} className="shrink-0 text-icon-tertiary" />;
  if (action === "none") return <small className="shrink-0 text-body-xs text-ink-tertiary">{t("people.viewOnly")}</small>;
  return (
    <small className="shrink-0 text-body-xs text-brand">
      {action === "write" ? t("panel.startChat") : t("people.sendRequest")}
    </small>
  );
}
