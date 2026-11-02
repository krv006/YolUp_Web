import { Navigate, useParams } from "react-router-dom";
import { ROUTES } from "@/shared/config";
import { useIsCompact } from "@/shared/hooks/use-media-query";
import { ChildLogins } from "./child-logins";

export function ParentChildLoginsPage() {
  const { childId = "" } = useParams();
  const isCompact = useIsCompact();
  if (isCompact || !childId) return <Navigate to={ROUTES.parent.children} replace />;
  return <ChildLogins key={childId} childId={childId} />;
}
