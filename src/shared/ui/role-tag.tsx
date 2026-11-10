import { useTranslation } from "react-i18next";

const LABELLED_ROLES = new Set(["teacher", "student", "parent"]);

export function RoleTag({ role, className = "" }: { role?: string | null; className?: string }) {
  const { t } = useTranslation("nav");
  if (!role || !LABELLED_ROLES.has(role)) return null;
  return (
    <span
      className={`inline-flex h-5 shrink-0 items-center rounded-full bg-brand-subtle px-2 text-caption-strong text-brand-strong ${className}`}
    >
      {t(`roles.${role}`)}
    </span>
  );
}
