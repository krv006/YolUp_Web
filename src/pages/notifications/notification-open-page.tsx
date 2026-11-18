import { useEffect, useMemo, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { resolveHomeRoute, useAuth } from "@/modules/auth";
import type { NotificationLink, OpenNotificationLink } from "@/modules/notification";
import { ROUTES } from "@/shared/config";
import { ROLES } from "@/shared/constants";
import { LoadingFallback } from "@/shared/ui/legacy";
import { useOpenNotificationLink } from "@/widgets/notification-link";
import { useParentNotificationLink } from "@/widgets/parent-shell";

const STAFF_FALLBACK_MS = 4000;
const PARENT_FALLBACK_MS = 300;

function useOpenOnce(open: OpenNotificationLink, link: NotificationLink, kind: string, fallback: string, delay: number) {
  const navigate = useNavigate();
  const done = useRef(false);
  useEffect(() => {
    if (!done.current) {
      done.current = true;
      open(link, kind);
    }
    const timer = globalThis.setTimeout(() => {
      if (globalThis.location.pathname === "/notification-open") navigate(fallback, { replace: true });
    }, delay);
    return () => globalThis.clearTimeout(timer);
  }, [open, link, kind, fallback, delay, navigate]);
}

function StaffOpen({ link, kind, fallback }: { link: NotificationLink; kind: string; fallback: string }) {
  useOpenOnce(useOpenNotificationLink({ replace: true }), link, kind, fallback, STAFF_FALLBACK_MS);
  return null;
}

function ParentOpen({ link, kind }: { link: NotificationLink; kind: string }) {
  useOpenOnce(useParentNotificationLink({ replace: true }), link, kind, ROUTES.parent.notifications, PARENT_FALLBACK_MS);
  return null;
}

function adminTarget(link: NotificationLink): string {
  const id = encodeURIComponent(link.id);
  if (link.type === "teacher") return `${ROUTES.admin.teachers}?teacher=${id}`;
  if (link.type === "support") return `${ROUTES.admin.support}?ticket=${id}`;
  if (link.type === "spam_report") return `${ROUTES.admin.reports}?report=${id}`;
  return ROUTES.admin.dashboard;
}

export function NotificationOpenPage() {
  const { t } = useTranslation("notification");
  const { user } = useAuth();
  const [params] = useSearchParams();
  const type = (params.get("type") ?? "").toLowerCase();
  const id = params.get("id") ?? "";
  const kind = params.get("kind") ?? "";
  const link = useMemo<NotificationLink>(() => ({ type, id }), [type, id]);
  const home = resolveHomeRoute(user);

  if (!user) return <LoadingFallback label={t("opening")} />;
  if (!type || !id) return <Navigate to={home} replace />;
  if (user.role === ROLES.ADMIN || user.role === ROLES.SUPER_ADMIN) return <Navigate to={adminTarget(link)} replace />;

  return (
    <>
      <LoadingFallback label={t("opening")} />
      {user.role === ROLES.PARENT ? (
        <ParentOpen link={link} kind={kind} />
      ) : (
        <StaffOpen link={link} kind={kind} fallback={home} />
      )}
    </>
  );
}
