import { Navigate, useParams } from "react-router-dom";
import { ROUTES } from "@/shared/config";
import { useIsCompact } from "@/shared/hooks/use-media-query";
import { ChildProfile } from "./child-profile";
import { ChildProfileMobile } from "./child-profile-mobile";

export function ParentChildProfilePage() {
  const { childId = "" } = useParams();
  const isCompact = useIsCompact();
  if (!childId) return <Navigate to={ROUTES.parent.children} replace />;
  return isCompact ? <ChildProfileMobile key={childId} childId={childId} /> : <ChildProfile key={childId} childId={childId} />;
}
