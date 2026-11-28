import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { MobilePageHeader } from "@/shared/ui/mobile-page";
import { useTranslation } from "react-i18next";

export function MobileHelpScreen({
  title,
  onBack,
  action,
  footer,
  children,
}: {
  title: ReactNode;
  onBack?: () => void;
  action?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
}) {
  const navigate = useNavigate();
  const { t } = useTranslation("account");
  return (
    <div className="relative flex h-full min-h-0 flex-col bg-canvas bg-auth-gradient font-body text-ink">
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-4 pt-5 pb-6 [&>*]:shrink-0">
        <MobilePageHeader title={title} backLabel={t("page.back")} onBack={onBack ?? (() => navigate(-1))} action={action} />
        <div className="mt-5 flex flex-col gap-5">{children}</div>
      </div>
      {footer ? <div className="shrink-0 px-4 pt-3 pb-[calc(env(safe-area-inset-bottom)+16px)]">{footer}</div> : null}
    </div>
  );
}
