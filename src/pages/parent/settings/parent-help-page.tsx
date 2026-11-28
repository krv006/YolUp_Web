import { useTranslation } from "react-i18next";
import { useLocation } from "react-router-dom";
import { HelpCenterPage } from "@/pages/profile/help-center-page";
import { useIsCompact } from "@/shared/hooks/use-media-query";
import { ParentPageHeader } from "@/widgets/parent-shell";

export function ParentHelpPage() {
  const { t } = useTranslation("parent");
  const { pathname } = useLocation();
  if (useIsCompact() || pathname.includes("/help/tickets")) return <HelpCenterPage />;
  return (
    <div className="flex flex-col gap-6 px-8 py-7">
      <ParentPageHeader eyebrow={t("settings.eyebrow")} title={t("account.help")} />
      <div className="max-w-[1180px]">
        <HelpCenterPage />
      </div>
    </div>
  );
}
