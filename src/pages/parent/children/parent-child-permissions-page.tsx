import { useTranslation } from "react-i18next";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { useSelectedChild } from "@/modules/parent";
import { ROUTES } from "@/shared/config";
import { useIsCompact } from "@/shared/hooks/use-media-query";
import { Icon } from "@/shared/ui/icon";
import { Avatar } from "@/shared/ui/legacy";
import { MobilePageHeader, mobileRoundButton } from "@/shared/ui/mobile-page";
import { ConsentSwitches } from "./consent-switches";

export function ParentChildPermissionsPage() {
  const { t } = useTranslation("parent");
  const navigate = useNavigate();
  const { childId = "" } = useParams();
  const compact = useIsCompact();
  const { children, childrenQuery } = useSelectedChild();
  const child = children.find((item) => item.id === childId) ?? null;
  if (!compact) return <Navigate to={ROUTES.parent.child(childId)} replace />;
  if (!childrenQuery.isLoading && !child) return <Navigate to={ROUTES.parent.children} replace />;

  return (
    <div className="flex flex-col gap-4 px-4 pt-5 pb-10">
      <MobilePageHeader
        title={t("profile.permissions")}
        backLabel={t("profile.title")}
        onBack={() => navigate(ROUTES.parent.child(childId))}
        action={
          <button type="button" className={mobileRoundButton} aria-label={t("profile.logins")} onClick={() => navigate(ROUTES.parent.childLogins(childId))}>
            <Icon name="history" size={22} />
          </button>
        }
      />
      {child ? (
        <>
          <section className="flex items-center gap-3 rounded-[20px] bg-brand-subtle px-4 py-4">
            <Avatar name={child.name} src={child.avatarUrl ?? undefined} tone={child.avatarTone} size="md" className="shrink-0 [&_.avatar]:size-12" />
            <span className="flex min-w-0 flex-col">
              <strong className="truncate text-title text-ink">{t("mobile.profile.permissionsFor", { name: child.name.split(" ")[0] })}</strong>
              <small className="text-body-xs text-ink-secondary">{t("mobile.profile.permissionsHint")}</small>
            </span>
          </section>
          <ConsentSwitches childId={child.id} childName={child.name} />
        </>
      ) : (
        <span className="h-[260px] animate-pulse rounded-[20px] bg-surface" aria-hidden="true" />
      )}
    </div>
  );
}
