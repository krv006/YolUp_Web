import { Navigate } from "react-router-dom";
import { ROUTES } from "@/shared/config";
import { useIsCompact } from "@/shared/hooks/use-media-query";
import { ProfileHubMobile } from "./settings-mobile-profile";

export function ParentProfilePage() {
  return useIsCompact() ? <ProfileHubMobile /> : <Navigate to={ROUTES.parent.settings("profile")} replace />;
}
