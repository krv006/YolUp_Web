import { useTranslation } from "react-i18next";
import { Navigate, NavLink, useParams } from "react-router-dom";
import { ROUTES } from "@/shared/config";
import { Icon } from "@/shared/ui/icon";
import { ParentPageHeader } from "@/widgets/parent-shell";
import { SettingsInterface } from "./settings-interface";
import { SettingsNotifications } from "./settings-notifications";
import { SettingsProfile } from "./settings-profile";
import { SettingsSecurity } from "./settings-security";

const SECTIONS = [
  { id: "profile", icon: "person" },
  { id: "notifications", icon: "notifications" },
  { id: "interface", icon: "palette" },
  { id: "security", icon: "shield" },
] as const;

type Section = (typeof SECTIONS)[number]["id"];

export function ParentSettings() {
  const { t } = useTranslation("parent");
  const { section = "profile" } = useParams();
  if (!SECTIONS.some((item) => item.id === section)) return <Navigate to={ROUTES.parent.settings()} replace />;
  const active = section as Section;

  return (
    <div className="flex flex-col gap-6 px-8 py-7">
      <ParentPageHeader eyebrow={t("settings.eyebrow")} title={t("settings.title")} />
      <div className="grid grid-cols-[240px_minmax(0,1fr)] items-start gap-5">
        <nav className="flex flex-col gap-1 rounded-[24px] bg-surface p-2">
          {SECTIONS.map((item) => (
            <NavLink
              key={item.id}
              to={ROUTES.parent.settings(item.id)}
              className={({ isActive }) =>
                `flex h-11 items-center gap-3 rounded-xl px-3 text-button transition-colors ${
                  isActive || (item.id === "profile" && active === "profile")
                    ? "bg-brand-subtle text-brand"
                    : "text-ink hover:bg-subtle"
                }`
              }
            >
              <Icon name={item.icon} size={20} />
              {t(`settings.nav.${item.id}`)}
            </NavLink>
          ))}
          <NavLink
            to={ROUTES.parent.children}
            className="flex h-11 items-center gap-3 rounded-xl px-3 text-button text-ink transition-colors hover:bg-subtle"
          >
            <Icon name="group" size={20} />
            {t("settings.nav.children")}
          </NavLink>
        </nav>
        {active === "profile" ? <SettingsProfile /> : null}
        {active === "notifications" ? <SettingsNotifications /> : null}
        {active === "interface" ? <SettingsInterface /> : null}
        {active === "security" ? <SettingsSecurity /> : null}
      </div>
    </div>
  );
}
