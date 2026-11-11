import { useTranslation } from "react-i18next";
import type { ShareSourceInfo } from "@/modules/live";

export function useShareSourceText() {
  const { t } = useTranslation("live");
  return (info: ShareSourceInfo) =>
    [info.surface ? t(`share.surface.${info.surface}`) : "", info.name].filter(Boolean).join(" · ") ||
    t("share.surface.unknown");
}
