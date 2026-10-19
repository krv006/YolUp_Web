import { Lock } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "@/shared/config";
import { Icon } from "@/shared/ui/icon";
import { RouteStatus, routeStatusButton } from "@/shared/ui/route-status";

export function ForbiddenPage() {
  const { t } = useTranslation("common");
  const navigate = useNavigate();

  return (
    <RouteStatus
      tone="warning"
      eyebrow="403"
      icon={<Lock size={28} />}
      title={t("routeState.forbiddenTitle")}
      description={t("routeState.forbiddenDescription")}
      action={
        <button type="button" className={routeStatusButton} onClick={() => navigate(ROUTES.root)}>
          <Icon name="person" size={18} /> {t("routeState.forbiddenAction")}
        </button>
      }
    />
  );
}

export function NotFoundPage() {
  const { t } = useTranslation("common");
  const navigate = useNavigate();

  return (
    <RouteStatus
      eyebrow="404"
      icon={<Icon name="search" size={26} />}
      title={t("routeState.notFoundTitle")}
      description={t("routeState.notFoundDescription")}
      action={
        <button type="button" className={routeStatusButton} onClick={() => navigate(ROUTES.root)}>
          <Icon name="arrow-back" size={18} /> {t("routeState.notFoundAction")}
        </button>
      }
    />
  );
}
