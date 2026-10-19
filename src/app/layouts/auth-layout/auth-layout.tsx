import { Outlet } from "react-router-dom";
import { useIsCompact } from "@/shared/hooks/use-media-query";
import { LanguageToggle } from "@/shared/ui/legacy";

export function AuthLayout() {
  const isCompact = useIsCompact();

  return (
    <>
      {isCompact ? null : <LanguageToggle className="auth-language-toggle" />}
      <Outlet />
    </>
  );
}
