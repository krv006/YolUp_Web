import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { ROUTES } from "@/shared/config";
import { useOnlineStatus } from "@/shared/model";
import { Icon } from "@/shared/ui/icon";
import { ParentErrorBanner, ParentLockedCard, ParentPageHeader } from "@/widgets/parent-shell";
import { HomeRecent } from "../dashboard/home-recent";
import { ChildAvatar } from "./child-avatar";
import { ConsentSwitches } from "./consent-switches";
import { UnlinkChildDialog } from "./unlink-child-dialog";
import { useChildProfile, type ChildGroup } from "./use-child-profile";

function groupLook(group: ChildGroup): { icon: string; tone: string } {
  if (group.language || /ingliz|english|ielts|rus|nemis|german|fransuz|french|arab|koreys|korean|turk/i.test(group.subject)) {
    return { icon: "translate", tone: "bg-accent-blue-bg text-accent-blue-fg" };
  }
  if (/mat|algebra|geometr/i.test(group.subject)) return { icon: "functions", tone: "bg-accent-green-bg text-accent-green-fg" };
  return { icon: "menu-book", tone: "bg-accent-violet-bg text-accent-violet-fg" };
}

function ProfileSkeleton() {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_340px] gap-5 xl:grid-cols-[minmax(0,1fr)_400px]" aria-hidden="true">
      <div className="flex flex-col gap-5">
        <div className="h-[136px] rounded-[20px] bg-surface" />
        <div className="h-[152px] rounded-[20px] bg-surface" />
        <div className="h-[160px] rounded-[20px] bg-surface" />
      </div>
      <div className="flex flex-col gap-5">
        <div className="h-[214px] rounded-[20px] bg-surface" />
        <div className="h-[72px] rounded-[20px] bg-surface" />
      </div>
    </div>
  );
}

export function ChildProfile({ childId }: { childId: string }) {
  const { t } = useTranslation("parent");
  const navigate = useNavigate();
  const online = useOnlineStatus();
  const profile = useChildProfile(childId);
  const { child } = profile;
  const weekdays = t("home.hero.weekdays", { returnObjects: true }) as string[];
  const [unlinking, setUnlinking] = useState(false);

  if (!profile.loading && !child && !profile.failed) return <Navigate to={ROUTES.parent.children} replace />;

  function openAttendance() {
    profile.select();
    navigate(ROUTES.parent.attendance);
  }

  return (
    <div className="flex flex-col gap-6 px-8 py-7">
      <ParentPageHeader
        eyebrow={
          <>
            <Link to={ROUTES.parent.children} className="shrink-0 transition-colors hover:text-ink">
              {t("profile.breadcrumb")}
            </Link>
            {child ? (
              <>
                <Icon name="chevron-right" size={14} className="shrink-0 text-icon-tertiary" />
                <span className="truncate text-ink">{child.name}</span>
              </>
            ) : null}
          </>
        }
        title={t("profile.title")}
      />

      {online && profile.failed ? <ParentErrorBanner onRetry={profile.retry} /> : null}

      {!child ? (
        <ProfileSkeleton />
      ) : (
        <div className="grid grid-cols-[minmax(0,1fr)_340px] items-start gap-5 xl:grid-cols-[minmax(0,1fr)_400px]">
          <div className="flex min-w-0 flex-col gap-5">
            <section className="flex items-center gap-5 rounded-[20px] bg-surface p-6">
              <ChildAvatar child={child} size="xl" />
              <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                <h2 className="truncate font-heading text-[22px]/8 font-semibold text-ink">{child.name}</h2>
                <small className="truncate text-body-sm text-ink-secondary">
                  {[child.username, child.grade || t("profile.role")].join(" · ")}
                </small>
                <span className="mt-1 flex flex-wrap gap-2">
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
              </div>
              <button
                type="button"
                className="flex h-11 shrink-0 items-center gap-2 self-start rounded-full bg-brand-subtle px-4 text-button text-brand transition-opacity hover:opacity-85"
                onClick={openAttendance}
              >
                <Icon name="event" size={20} />
                {t("profile.attendance")}
              </button>
            </section>

            <section className="flex flex-col gap-3">
              <h3 className="text-title text-ink">{t("profile.groups")}</h3>
              <ul className={`flex flex-col overflow-hidden rounded-[20px] bg-surface ${profile.sectionsLoading ? "animate-pulse" : ""}`}>
                {profile.groups.length ? (
                  profile.groups.map((group) => {
                    const look = groupLook(group);
                    return (
                      <li key={group.id} className="border-b border-line last:border-b-0">
                        <button
                          type="button"
                          className="flex w-full items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-subtle"
                          onClick={openAttendance}
                        >
                          <span className={`grid size-12 shrink-0 place-items-center rounded-2xl ${look.tone}`}>
                            <Icon name={look.icon} size={24} />
                          </span>
                          <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                            <strong className="truncate text-title-sm text-ink">{group.title}</strong>
                            <small className="truncate text-body-xs text-ink-secondary">
                              {group.students
                                ? t("profile.groupMeta", { teacher: group.teacher, count: group.students })
                                : group.teacher}
                            </small>
                          </span>
                          {group.schedule ? (
                            <span className="flex shrink-0 items-center gap-1 rounded-full bg-accent-teal-bg px-2.5 py-1 text-caption-strong text-accent-teal-fg">
                              <Icon name="schedule" size={14} />
                              {group.schedule.days.map((day) => weekdays[day] ?? "").join(", ")} · {group.schedule.time}
                            </span>
                          ) : null}
                          <Icon name="chevron-right" size={20} className="shrink-0 text-icon-tertiary" />
                        </button>
                      </li>
                    );
                  })
                ) : (
                  <li className="px-5 py-8 text-center text-body-sm text-ink-tertiary">
                    {profile.sectionsLoading ? "" : t("profile.noGroups")}
                  </li>
                )}
              </ul>
            </section>

            {profile.locked ? (
              <ParentLockedCard childId={child.id} childName={child.name} action={false} />
            ) : (
              <HomeRecent items={profile.recent} now={profile.now} onAll={profile.select} />
            )}
          </div>

          <div className="flex min-w-0 flex-col gap-5">
            <section className="flex flex-col gap-3">
              <h3 className="text-title text-ink">{t("profile.permissions")}</h3>
              <ConsentSwitches childId={child.id} childName={child.name} />
            </section>

            <section className="flex flex-col gap-3">
              <h3 className="text-title text-ink">{t("profile.security")}</h3>
              <button
                type="button"
                className="flex items-center gap-4 rounded-[20px] bg-surface px-5 py-4 text-left transition-colors hover:bg-subtle"
                onClick={() => navigate(ROUTES.parent.childLogins(child.id))}
              >
                <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-brand-subtle text-brand">
                  <Icon name="history" size={22} />
                </span>
                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <strong className="text-title-sm text-ink">{t("profile.logins")}</strong>
                  <small className={`text-body-xs ${profile.newDevices ? "text-warning-text" : "text-ink-secondary"}`}>
                    {profile.newDevices
                      ? t("profile.newDevices", { count: profile.newDevices })
                      : t("profile.noNewDevices")}
                  </small>
                </span>
                <Icon name="chevron-right" size={20} className="shrink-0 text-icon-tertiary" />
              </button>
              <button
                type="button"
                className="flex items-center gap-4 rounded-[20px] bg-surface px-5 py-4 text-left transition-colors hover:bg-danger-bg"
                onClick={() => setUnlinking(true)}
              >
                <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-danger-bg text-error-text">
                  <Icon name="link-off" size={22} />
                </span>
                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <strong className="text-title-sm text-error-text">{t("profile.unlink.action")}</strong>
                  <small className="text-body-xs text-ink-secondary">{t("profile.unlink.text")}</small>
                </span>
              </button>
            </section>
          </div>
        </div>
      )}
      {child ? <UnlinkChildDialog child={child} open={unlinking} onOpenChange={setUnlinking} /> : null}
    </div>
  );
}
