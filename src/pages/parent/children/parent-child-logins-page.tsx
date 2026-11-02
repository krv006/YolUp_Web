import { Navigate, useParams } from "react-router-dom";
import { ROUTES } from "@/shared/config";
import { useIsCompact } from "@/shared/hooks/use-media-query";
import { ChildLogins } from "./child-logins";
import { ChildLoginsMobile } from "./child-logins-mobile";

export function ParentChildLoginsPage() {
  const { childId = "" } = useParams();
  const isCompact = useIsCompact();
  if (!childId) return <Navigate to={ROUTES.parent.children} replace />;
  return isCompact ? <ChildLoginsMobile key={childId} childId={childId} /> : <ChildLogins key={childId} childId={childId} />;
}
