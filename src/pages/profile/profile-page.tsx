import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useMyAnalytics } from "@/modules/analytics";
import { useAuth } from "@/modules/auth";
import { ROLES } from "@/shared/constants";
import { Icon } from "@/shared/ui/icon";
import {
  MobileListCard,
  MobileListRow,
  MobileSectionTitle,
  MobileStatsCard,
  MobileTitleHeader,
  mobileRoundButton,
} from "@/shared/ui/mobile-page";
import { CardsSkeleton } from "@/shared/ui/page-skeleton";
import { LogoutDialog, SwitchAccountDialog } from "./profile-dialogs";

const PAGE =
  "flex h-full flex-col gap-5.5 overflow-y-auto bg-canvas bg-auth-gradient px-4 pt-5.5 pb-32 font-body text-ink [&>*]:shrink-0";

const SETTINGS = [
  { id: "personal", icon: "person", tone: "bg-brand-subtle text-ink", to: "personal" },
  { id: "account", icon: "shield", tone: "bg-success-bg text-success", to: "account" },
  { id: "system", icon: "settings", tone: "bg-accent-saffron-bg text-accent-saffron-fg", to: "system" },
  { id: "help", icon: "help", tone: "bg-accent-violet-bg text-accent-violet-fg", to: "help" },
] as const;

export function ProfilePage() {
  const { t } = useTranslation("account");
  const { t: tn } = useTranslation("nav");
  const months = useTranslation("lesson").t("list.monthsLong", { returnObjects: true }) as string[];
  const navigate = useNavigate();
  const { user } = useAuth();
  const analytics = useMyAnalytics();
  const [switchOpen, setSwitchOpen] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);

  const attendance = useMemo(() => {
    const courses = analytics.data?.kind === "teacher" ? analytics.data.courses : [];
    const values = courses.map((course) => course.attendanceRate).filter((value): value is number => value !== null);
    return values.length ? Math.round(values.reduce((sum, value) => sum + value, 0) / values.length) : null;
  }, [analytics.data]);

  const rating = user?.avgRating ?? null;
  const ratingLabel = rating === null ? "—" : rating.toFixed(1).replace(".", ",");
  const ratingCount = user?.ratingCount ?? 0;
  const certificates = user?.certificates.length ?? 0;
  const role = user?.role === ROLES.TEACHER ? "teacher" : (user?.role?.toLowerCase() ?? "student");

  const activity = [
    {
      id: "ratings",
      icon: "star",
      tone: "bg-accent-saffron-bg text-accent-saffron-fg",
      subtitle: t("page.mobile.ratingsHint", { value: ratingLabel, count: ratingCount }),
    },
    {
      id: "certificates",
      icon: "check-circle",
      tone: "bg-success-bg text-success",
      subtitle: t("page.mobile.certificatesHint", { count: certificates }),
    },
    { id: "logins", icon: "clock", tone: "bg-brand-subtle text-brand", subtitle: t("page.loginsRowHint") },
  ];

  const eyebrow = t("page.mobile.eyebrow", { role: tn(`roles.${role}`, { defaultValue: user?.role ?? "" }) });

  if (analytics.isLoading)
    return (
      <main className={PAGE}>
        <MobileTitleHeader eyebrow={eyebrow} title={t("page.title")} />
        <CardsSkeleton />
      </main>
    );

  return (
    <main className={PAGE}>
      <MobileTitleHeader
        eyebrow={eyebrow}
        title={t("page.title")}
        action={
          <button
            type="button"
            className={mobileRoundButton}
            aria-label={t("page.systemTitle")}
            onClick={() => navigate("system")}
          >
            <Icon name="settings" size={22} />
          </button>
        }
      />

      <MobileStatsCard
        label={t("page.mobile.monthResults", { month: months[new Date().getMonth()] ?? "" })}
        actionLabel={t("page.mobile.details")}
        onAction={() => navigate("ratings")}
        items={[
          { id: "rating", value: ratingLabel, label: t("page.mobile.rating") },
          { id: "count", value: ratingCount, label: t("page.mobile.ratingCount") },
          { id: "attendance", value: attendance === null ? "—" : `${attendance}%`, label: t("page.mobile.attendance") },
        ]}
      />

      <section className="flex flex-col gap-3">
        <MobileSectionTitle>{t("page.settings")}</MobileSectionTitle>
        <MobileListCard>
          {SETTINGS.map((item) => (
            <MobileListRow
              key={item.id}
              icon={item.icon}
              tone={item.tone}
              title={t(`page.${item.id}Title`)}
              subtitle={t(`page.${item.id}Hint`)}
              onClick={() => navigate(item.to)}
            />
          ))}
        </MobileListCard>
      </section>

      <section className="flex flex-col gap-3">
        <MobileSectionTitle>{t("page.mobile.activity")}</MobileSectionTitle>
        <MobileListCard>
          {activity.map((item) => (
            <MobileListRow
              key={item.id}
              icon={item.icon}
              tone={item.tone}
              title={t(`page.${item.id}Title`)}
              subtitle={item.subtitle}
              onClick={() => navigate(item.id)}
            />
          ))}
        </MobileListCard>
      </section>

      <MobileListCard>
        <MobileListRow
          icon="groups"
          tone="bg-brand-subtle text-brand"
          title={t("page.switchAccount")}
          subtitle={t("page.switchAccountHint")}
          onClick={() => setSwitchOpen(true)}
        />
        <MobileListRow
          icon="logout"
          tone="bg-danger-bg text-error-text"
          title={t("page.logout")}
          titleClassName="text-error-text"
          chevron={false}
          onClick={() => setLogoutOpen(true)}
        />
      </MobileListCard>

      <SwitchAccountDialog open={switchOpen} onOpenChange={setSwitchOpen} />
      <LogoutDialog open={logoutOpen} onOpenChange={setLogoutOpen} />
    </main>
  );
}
