import { ArrowLeft } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

export interface PageBackLinkProps {
  to?: string;
  label?: string;
}

export function PageBackLink({ to = "../workspace", label }: PageBackLinkProps) {
  const { t } = useTranslation("common");
  return (
    <Link className="portal-back-link" to={to}>
      <ArrowLeft size={16} />
      {label ?? t("actions.back")}
    </Link>
  );
}
