import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Navigate, useNavigate } from "react-router-dom";
import { ROUTES } from "@/shared/config";
import { Icon } from "@/shared/ui/icon";
import { MobilePageHeader } from "@/shared/ui/mobile-page";
import { subjectLook } from "../attendance/attendance-styles";
import { ChildAvatar } from "./child-avatar";
import { UnlinkChildDialog } from "./unlink-child-dialog";
import { useChildProfile } from "./use-child-profile";

export function ChildProfileMobile({ childId }: { childId: string }) {
  const { t } = useTranslation("parent");
  const navigate = useNavigate();
  const profile = useChildProfile(childId);
  const { child } = profile;
  const weekdays = t("home.hero.weekdays", { returnObjects: true }) as string[];
  const [unlinking, setUnlinking] = useState(false);
  if (!profile.loading && !child && !profile.failed) return <Navigate to={ROUTES.parent.children} replace />;

  return (
    <div className="flex flex-col gap-4 px-4 pt-5 pb-10">
      <MobilePageHeader title={t("profile.title")} backLabel={t("profile.breadcrumb")} onBack={() => navigate(ROUTES.parent.children)} />
      {!child ? (
        <div className="flex flex-col gap-4" aria-hidden="true">
          <span className="h-[216px] animate-pulse rounded-[20px] bg-surface" />
          <span className="h-[150px] animate-pulse rounded-[20px] bg-surface" />
          <span className="h-[200px] animate-pulse rounded-[20px] bg-surface" />
        </div>
      ) : (
        <>
          <section className="flex flex-col items-center gap-2 rounded-[20px] bg-surface px-4 py-5 text-center">
            <ChildAvatar child={child} size="lg" />
            <h2 className="mt-1 font-heading text-[20px]/7 font-semibold text-ink">{child.name}</h2>
            <small className="text-body-sm text-ink-secondary">
              {[child.username, child.grade || t("profile.role")].join(" · ")}
            </small>
            <span className="mt-1 flex flex-wrap justify-center gap-2">
              {child.isOnline ? (
                <span className="flex items-center gap-1.5 rounded-full bg-success-bg px-2.5 py-1 text-caption-strong text-success-text">
                  <span className="size-2 rounded-full bg-success" />
                  {t("profile.online")}
                </span>
              ) : null}
              {profile.groups.length ? (
                <span className="flex items-center gap-1 rounded-full bg-accent-blue-bg px-2.5 py-1 text-caption-strong text-accent-blue-fg">
                  <Icon name="groups" size={14} />
                  {t("profile.groupsChip", { count: profile.groups.length })}
                </span>
              ) : null}
              {profile.attendancePercent !== null ? (
                <span className="flex items-center gap-1 rounded-full bg-accent-violet-bg px-2.5 py-1 text-caption-strong text-accent-violet-fg">
                  <Icon name="trending-up" size={14} />
                  {t("profile.attendanceChip", { percent: profile.attendancePercent })}
                </span>
              ) : null}
            </span>
          </section>

          <section className="flex flex-col gap-2">
            <h3 className="px-1 font-heading text-[18px]/6 font-semibold text-ink">{t("profile.groups")}</h3>
            <ul className={`flex flex-col overflow-hidden rounded-[20px] bg-surface ${profile.sectionsLoading ? "animate-pulse" : ""}`}>
              {profile.groups.map((group) => {
                const look = subjectLook(`${group.subject} ${group.language ? "language" : ""}`);
                return (
                  <li key={group.id} className="flex items-center gap-3 border-b border-line px-4 py-3.5 last:border-b-0">
                    <span className={`grid size-11 shrink-0 place-items-center rounded-xl ${look.tone}`}>
                      <Icon name={look.icon} size={22} />
                    </span>
                    <span className="flex min-w-0 flex-1 flex-col">
                      <strong className="truncate text-title-sm text-ink">{group.title}</strong>
                      <small className="truncate text-body-xs text-ink-secondary">
                        {[group.teacher, group.schedule?.time].filter(Boolean).join(" · ")}
                      </small>
                    </span>
                    {group.schedule ? (
                      <span className="flex shrink-0 items-center gap-1 rounded-full bg-accent-teal-bg px-2 py-1 text-caption-strong text-accent-teal-fg">
                        <Icon name="schedule" size={14} />
                        {group.schedule.days.map((day) => weekdays[day] ?? "").join(", ")}
                      </span>
                    ) : null}
                  </li>
                );
              })}
              {!profile.groups.length && !profile.sectionsLoading ? (
                <li className="px-4 py-6 text-center text-body-sm text-ink-tertiary">{t("profile.noGroups")}</li>
              ) : null}
            </ul>
          </section>

          <section className="flex flex-col gap-2">
            <h3 className="px-1 font-heading text-[18px]/6 font-semibold text-ink">{t("mobile.profile.privacy")}</h3>
            <ul className="flex flex-col overflow-hidden rounded-[20px] bg-surface">
              {[
                { id: "permissions", icon: "shield", tone: "bg-accent-violet-bg text-accent-violet-fg", title: t("profile.permissions"), text: t("mobile.profile.permissionsText"), to: ROUTES.parent.childPermissions(child.id) },
                {
                  id: "logins",
                  icon: "history",
                  tone: "bg-brand-subtle text-brand",
                  title: t("profile.logins"),
                  text: profile.newDevices ? t("profile.newDevices", { count: profile.newDevices }) : t("profile.noNewDevices"),
                  to: ROUTES.parent.childLogins(child.id),
                },
                { id: "attendance", icon: "event", tone: "bg-accent-green-bg text-accent-green-fg", title: t("profile.attendance"), text: t("mobile.profile.attendanceText"), to: ROUTES.parent.attendance },
              ].map((row) => (
                <li key={row.id} className="border-b border-line last:border-b-0">
                  <button
                    type="button"
                    className="flex w-full items-center gap-3 px-4 py-3.5 text-left"
                    onClick={() => {
                      if (row.id === "attendance") profile.select();
                      navigate(row.to);
                    }}
                  >
                    <span className={`grid size-11 shrink-0 place-items-center rounded-xl ${row.tone}`}>
                      <Icon name={row.icon} size={22} />
                    </span>
                    <span className="flex min-w-0 flex-1 flex-col">
                      <strong className="text-title-sm text-ink">{row.title}</strong>
                      <small className="truncate text-body-xs text-ink-secondary">{row.text}</small>
                    </span>
                    <Icon name="chevron-right" size={20} className="shrink-0 text-icon-tertiary" />
                  </button>
                </li>
              ))}
            </ul>
          </section>

          <button
            type="button"
            className="flex h-13 items-center justify-center gap-2 rounded-[20px] bg-surface text-button text-error-text"
            onClick={() => setUnlinking(true)}
          >
            <Icon name="link-off" size={20} />
            {t("profile.unlink.action")}
          </button>
          <UnlinkChildDialog child={child} open={unlinking} onOpenChange={setUnlinking} />
        </>
      )}
    </div>
  );
}
