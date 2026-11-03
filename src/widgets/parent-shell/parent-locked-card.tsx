import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "@/shared/config";
import { useIsCompact } from "@/shared/hooks/use-media-query";
import { Icon } from "@/shared/ui/icon";

export function ParentLockedCard({ childId, childName, action = true }: { childId: string; childName: string; action?: boolean }) {
  const { t } = useTranslation("parent");
  const navigate = useNavigate();
  const compact = useIsCompact();
  return (
    <section className="flex flex-col items-center gap-3 rounded-[24px] bg-surface px-6 py-12 text-center">
      <span className="grid size-20 place-items-center rounded-full bg-accent-violet-bg">
        <span className="grid size-13 place-items-center rounded-full bg-accent-violet-fg text-on-action">
          <Icon name="lock-fill" size={24} />
        </span>
      </span>
      <strong className="font-heading text-[20px]/7 font-semibold text-ink">{t("locked.title")}</strong>
      <p className="max-w-[420px] text-body-sm text-ink-secondary">{t("locked.text", { name: childName.split(" ")[0] || childName })}</p>
      {action ? (
        <button
          type="button"
          className="mt-1 flex h-11 items-center gap-2 rounded-full bg-brand px-5 text-button text-on-action transition-colors hover:bg-brand-strong"
          onClick={() => navigate(compact ? ROUTES.parent.childPermissions(childId) : ROUTES.parent.child(childId))}
        >
          <Icon name="shield" size={18} />
          {t("locked.action")}
        </button>
      ) : null}
    </section>
  );
}
