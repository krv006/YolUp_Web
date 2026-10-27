import { useTranslation } from "react-i18next";
import type { TeacherCourseAnalytics } from "@/shared/types";
import { GroupTile } from "@/shared/ui/group-tile";
import { Icon } from "@/shared/ui/icon";
import {
  MobileEmptyCard,
  MobileListCard,
  MobileListRow,
  MobileListSkeleton,
  MobileSectionTitle,
  MobileStatsCard,
  MobileTitleHeader,
  mobileRoundButton,
} from "@/shared/ui/mobile-page";

export interface MobileAnalyticsProps {
  loading: boolean;
  empty: boolean;
  avgRating: number | null;
  ratingCount: number;
  reliability: number | null;
  courses: TeacherCourseAnalytics[];
  avatars: Map<string, { src: string | null; tone: string }>;
  onSettings: () => void;
  onDetails: () => void;
  onOpenCourse: (courseId: string) => void;
}

function percent(value: number | null): string {
  return value === null ? "—" : `${Math.round(value)}%`;
}

export function MobileAnalytics(props: MobileAnalyticsProps) {
  const { t } = useTranslation("workspace");
  const months = useTranslation("lesson").t("list.monthsLong", { returnObjects: true }) as string[];
  const month = months[new Date().getMonth()] ?? "";

  return (
    <main className="flex h-full flex-col gap-5.5 overflow-y-auto bg-canvas bg-auth-gradient px-4 pt-5.5 pb-8 font-body text-ink [&>*]:shrink-0">
      <MobileTitleHeader
        eyebrow={t("analytics.mobile.eyebrow")}
        title={t("analytics.title")}
        action={
          props.empty ? (
            <span className="size-11 shrink-0" aria-hidden="true" />
          ) : (
            <button type="button" className={mobileRoundButton} aria-label={t("analytics.mobile.settings")} onClick={props.onSettings}>
              <Icon name="settings" size={22} />
            </button>
          )
        }
      />

      {props.loading ? (
        <MobileListSkeleton card rows={3} />
      ) : props.empty ? (
        <MobileEmptyCard icon="bar-chart" title={t("analytics.emptyTitle")} description={t("analytics.emptyDescription")} />
      ) : (
        <>
          <MobileStatsCard
            label={month}
            actionLabel={t("home.mobile.details")}
            onAction={props.onDetails}
            items={[
              {
                id: "rating",
                value: props.avgRating === null ? "—" : props.avgRating.toFixed(1).replace(".", ","),
                label: t("analytics.avgRating"),
              },
              { id: "count", value: props.ratingCount, label: t("analytics.mobile.ratings") },
              { id: "reliability", value: percent(props.reliability), label: t("analytics.reliability") },
            ]}
          />

          <section className="flex flex-col gap-3">
            <MobileSectionTitle>{t("analytics.byCourse")}</MobileSectionTitle>
            {props.courses.length ? (
              <MobileListCard>
                {props.courses.map((course) => {
                  const look = props.avatars.get(course.courseId);
                  return (
                    <MobileListRow
                      key={course.courseId}
                      leading={
                        <GroupTile
                          name={course.courseTitle}
                          src={look?.src}
                          tone={look?.tone}
                          className="size-11 rounded-md text-title-sm"
                        />
                      }
                      title={course.courseTitle}
                      subtitle={
                        <span className="flex gap-3 text-body-xs leading-5 font-semibold">
                          <span className="text-brand-strong">
                            {t("analytics.mobile.test", { value: percent(course.quizAvgPercentage) })}
                          </span>
                          <span className="text-success-fg">
                            {t("analytics.mobile.attendance", { value: percent(course.attendanceRate) })}
                          </span>
                        </span>
                      }
                      onClick={() => props.onOpenCourse(course.courseId)}
                    />
                  );
                })}
              </MobileListCard>
            ) : (
              <p className="rounded-xl bg-surface px-5 py-8 text-center text-body-sm text-ink-secondary">
                {t("analytics.noCourses")}
              </p>
            )}
          </section>
        </>
      )}
    </main>
  );
}
