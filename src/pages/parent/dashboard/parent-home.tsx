import { useTranslation } from "react-i18next";
import { formatDayTime, formatLocalized } from "@/shared/lib";
import { Icon } from "@/shared/ui/icon";
import { ParentErrorBanner, ParentPageHeader } from "@/widgets/parent-shell";
import { greetingKey } from "./home-format";
import { HomeHero } from "./home-hero";
import { HomeRecent } from "./home-recent";
import { AttentionCard, ScoreCard } from "./home-side";
import { HomeSkeleton } from "./home-skeleton";
import { HomeStats } from "./home-stats";
import { ConnectChild, PendingLink } from "./home-empty";
import { useParentHome } from "./use-parent-home";

export function ParentHome() {
  const { t } = useTranslation("parent");
  const home = useParentHome();
  const { status, child, view, now } = home;
  const date = formatLocalized(now, t("home.datePattern"));
  const firstName = home.firstName;
  const childFirst = child?.name.split(" ")[0] ?? "";

  const eyebrow =
    status === "connect"
      ? t("home.connectSubtitle")
      : status === "ready" && view
        ? `${date} · ${
            view.todayCount
              ? t("home.todayLessons", { name: childFirst, count: view.todayCount })
              : t("home.noLessonsToday", { name: childFirst })
          }`
        : date;
  const title =
    status === "connect" || status === "pending"
      ? t("home.welcome", { name: firstName })
      : t(`home.greeting.${greetingKey(now)}`, { name: firstName });

  return (
    <div className="flex flex-col gap-6 px-8 py-7">
      <ParentPageHeader eyebrow={eyebrow} title={title} />

      {home.online && home.failed && (status === "ready" || status === "error") ? (
        <ParentErrorBanner onRetry={home.retry} />
      ) : null}

      {status === "connect" ? <ConnectChild /> : null}
      {status === "pending" && home.pendingLink ? <PendingLink link={home.pendingLink} /> : null}
      {status === "loading" || status === "error" || (status === "ready" && home.sectionsLoading) ? (
        <HomeSkeleton />
      ) : null}

      {status === "ready" && !home.sectionsLoading && view && child ? (
        <>
          {home.online ? null : (
            <p className="-mb-1 flex items-center gap-3 rounded-2xl bg-surface-inverse px-5 py-3.5 text-body-sm text-ink-inverse">
              <Icon name="wifi" size={20} className="shrink-0" />
              {t("home.offline", { time: formatDayTime(home.lastUpdated || now) })}
            </p>
          )}
          <div
            className={`grid grid-cols-[minmax(0,1fr)_320px] gap-5 xl:grid-cols-[minmax(0,1fr)_380px] ${
              home.online ? "" : "pointer-events-none opacity-55"
            }`}
          >
            <div className="flex min-w-0 flex-col gap-5">
              <HomeHero
                childName={child.name}
                hero={view.hero}
                week={view.week}
                todayCount={view.todayCount}
                teachers={home.teachers}
                now={now}
              />
              <HomeStats now={now} month={view.month} score={view.score} homework={view.homework} minutes={view.minutes} />
              <HomeRecent items={view.recent} now={now} />
            </div>
            <div className="flex min-w-0 flex-col gap-5">
              <AttentionCard items={view.attention} childId={child.id} now={now} />
              <ScoreCard trend={view.trend} delta={view.score.delta} />
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
