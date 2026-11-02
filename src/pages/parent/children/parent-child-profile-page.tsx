import { Navigate, useParams } from "react-router-dom";
import { ROUTES } from "@/shared/config";
import { useIsCompact } from "@/shared/hooks/use-media-query";
import { ChildProfile } from "./child-profile";

export function ParentChildProfilePage() {
  const { childId = "" } = useParams();
  const isCompact = useIsCompact();
  if (isCompact || !childId) return <Navigate to={ROUTES.parent.children} replace />;
  return <ChildProfile key={childId} childId={childId} />;
}
