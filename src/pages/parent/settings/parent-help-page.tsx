import { useTranslation } from "react-i18next";
import { HelpCenterPage } from "@/pages/profile/help-center-page";
import { useIsCompact } from "@/shared/hooks/use-media-query";
import { ParentPageHeader } from "@/widgets/parent-shell";

export function ParentHelpPage() {
  const { t } = useTranslation("parent");
  if (useIsCompact()) return <HelpCenterPage />;
  return (
    <div className="flex flex-col gap-6 px-8 py-7">
      <ParentPageHeader eyebrow={t("settings.eyebrow")} title={t("account.help")} />
      <div className="max-w-[860px]">
        <HelpCenterPage />
      </div>
    </div>
  );
}
