import { useParams } from "react-router-dom";
import { useIsCompact } from "@/shared/hooks/use-media-query";
import { ParentSettings } from "./parent-settings";
import { ProfileEditMobile, ProfileInfoMobile } from "./settings-mobile-profile";
import { PasswordMobile, SecurityMobile, SettingsMobile } from "./settings-mobile-system";

export function ParentSettingsPage() {
  const { section } = useParams();
  if (!useIsCompact()) return <ParentSettings />;
  if (section === "profile") return <ProfileInfoMobile />;
  if (section === "edit") return <ProfileEditMobile />;
  if (section === "security") return <SecurityMobile />;
  if (section === "password") return <PasswordMobile />;
  return <SettingsMobile />;
}
