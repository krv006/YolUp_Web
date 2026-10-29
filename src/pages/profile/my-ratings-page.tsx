import { useTranslation } from "react-i18next";
import { useMyAnalytics } from "@/modules/analytics";
import { useAuth, useIsStudent, useMyRatings } from "@/modules/auth";
import { StarRating } from "@/modules/lesson";
import { useIsCompact } from "@/shared/hooks/use-media-query";
import { formatDayTime } from "@/shared/lib";
import { Icon } from "@/shared/ui/icon";
import { Avatar } from "@/shared/ui/legacy";
import { MobileEmptyCard, MobileListSkeleton } from "@/shared/ui/mobile-page";
import { ProfileSubPage } from "./profile-shell";
import { StudentRatings } from "./student-ratings";

function Stars({ value, size }: { value: number; size: number }) {
  const filled = Math.round(value);
  return (
    <span className="flex shrink-0 items-center gap-px" aria-hidden="true">
      {[1, 2, 3, 4, 5].map((star) => (
        <Icon
          key={star}
          name="star"
          size={size}
          className={star <= filled ? "text-accent-saffron-fg" : "text-line-strong"}
        />
      ))}
    </span>
  );
}

function relativeDay(value: string, labels: { today: string; yesterday: string }): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  if (date >= start) return labels.today;
  if (date.getTime() >= start.getTime() - 86_400_000) return labels.yesterday;
  return formatDayTime(value);
}

export function MyRatingsPage() {
  return useIsStudent() ? <StudentRatings /> : <TeacherRatings />;
}

function TeacherRatings() {
  const { t } = useTranslation("account");
  const { user } = useAuth();
  const isCompact = useIsCompact();
  const ratings = useMyRatings(true);
  const analytics = useMyAnalytics();
  const rows = ratings.data?.items ?? [];

  const buckets = [5, 4, 3, 2, 1]
    .map((stars) => ({
      stars,
      count: rows.filter((row) => Math.round(row.stars) === stars).length,
    }))
    .filter((bucket) => bucket.count > 0);
  const max = Math.max(1, ...buckets.map((bucket) => bucket.count));

  if (isCompact) {
    const breakdown = analytics.data?.kind === "teacher" ? analytics.data.overall.ratingBreakdown : {};
    const bars = [5, 4, 3, 2, 1]
      .map((stars) => ({ stars, count: Number(breakdown[String(stars)] ?? 0) || rows.filter((row) => Math.round(row.stars) === stars).length }))
      .filter((bar) => bar.count > 0);
    const total = user?.ratingCount ?? rows.length;
    const top = Math.max(1, ...bars.map((bar) => bar.count));
    const empty = !ratings.isLoading && !rows.length && !total;

    return (
      <ProfileSubPage title={t("page.ratingsTitle")}>
        {empty ? (
          <MobileEmptyCard
            icon="star"
            title={t("page.mobile.noRatingsTitle")}
            description={t("page.mobile.noRatingsHint")}
          />
        ) : (
          <>
            <section className="flex flex-col rounded-xl bg-surface p-4">
              <span className="flex items-center gap-4">
                <strong className="font-heading text-[40px] leading-10 font-semibold text-ink">
                  {user?.avgRating == null ? "—" : user.avgRating.toFixed(1).replace(".", ",")}
                </strong>
                <span className="flex min-w-0 flex-col gap-1">
                  <Stars value={user?.avgRating ?? 0} size={22} />
                  <small className="text-caption font-normal text-ink-secondary">
                    {t("page.ratingsCount", { count: total })}
                  </small>
                </span>
              </span>
              <div className="mt-[14px] flex flex-col gap-2">
                {bars.map((bar) => (
                  <span key={bar.stars} className="flex items-center gap-3">
                    <small className="w-2 shrink-0 text-caption-strong text-ink">{bar.stars}</small>
                    <span className="h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-subtle">
                      <i
                        className="block h-full rounded-full bg-accent-saffron-fg not-italic"
                        style={{ width: `${(bar.count / Math.max(total, top)) * 100}%` }}
                      />
                    </span>
                    <small className="w-6 shrink-0 text-right text-caption font-normal text-ink-secondary">
                      {bar.count}
                    </small>
                  </span>
                ))}
              </div>
            </section>

            <section className="flex flex-col gap-[13px]">
              <span className="text-title leading-5 font-normal text-ink">{t("page.recentCommentsTitle")}</span>
              {ratings.isLoading ? (
                <MobileListSkeleton card rows={2} />
              ) : (
                <div className="flex flex-col divide-y divide-line overflow-hidden rounded-xl bg-surface py-1">
                  {rows.map((row) => (
                    <article key={row.id} className="flex flex-col px-4 py-3">
                      <span className="flex items-center gap-2.5">
                        <Avatar name={row.studentName} src={row.studentAvatar ?? undefined} size="sm" className="[&_.avatar]:size-8" />
                        <span className="flex min-w-0 flex-1 flex-col">
                          <strong className="truncate text-title-sm text-ink">{row.studentName}</strong>
                          <small className="truncate text-caption font-normal text-ink-secondary">
                            {[
                              row.courseTitle,
                              row.createdAt
                                ? relativeDay(row.createdAt, { today: t("page.mobile.today"), yesterday: t("page.mobile.yesterday") })
                                : "",
                            ]
                              .filter(Boolean)
                              .join(" · ")}
                          </small>
                        </span>
                        <Stars value={row.stars} size={14} />
                      </span>
                      {row.description ? <p className="mt-2 text-body-xs text-ink">{row.description}</p> : null}
                    </article>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </ProfileSubPage>
    );
  }

  if (!ratings.isLoading && !rows.length && !(user?.ratingCount ?? 0))
    return (
      <ProfileSubPage title={t("page.ratingsTitle")}>
        <MobileEmptyCard icon="star" title={t("page.mobile.noRatingsTitle")} description={t("page.mobile.noRatingsHint")} />
      </ProfileSubPage>
    );

  return (
    <ProfileSubPage title={t("page.ratingsTitle")}>
      <section className="flex flex-col gap-3 rounded-lg bg-surface px-5 py-4">
        <span className="flex items-center gap-5">
          <strong className="shrink-0 font-heading text-display text-ink">
            {user?.avgRating == null ? "—" : user.avgRating.toFixed(1).replace(".", ",")}
          </strong>
          <span className="flex min-w-0 flex-1 flex-col gap-1">
            <StarRating value={Math.round(user?.avgRating ?? 0)} readOnly size={18} />
            <small className="truncate text-body-xs text-ink-tertiary">
              {t("page.ratingsCount", { count: user?.ratingCount ?? rows.length })}
            </small>
          </span>
        </span>

        {buckets.map((bucket) => (
          <span key={bucket.stars} className="flex items-center gap-3">
            <small className="w-2 shrink-0 text-body-xs text-ink-tertiary">{bucket.stars}</small>
            <span className="h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-subtle">
              <span
                className="block h-full rounded-full bg-warning-fg"
                style={{ width: `${(bucket.count / max) * 100}%` }}
              />
            </span>
            <small className="w-8 shrink-0 text-right text-body-xs text-ink-tertiary">
              {bucket.count}
            </small>
          </span>
        ))}
      </section>

      <section className="flex flex-col gap-3">
        <span className="text-title text-ink">{t("page.recentCommentsTitle")}</span>

        {ratings.isLoading ? (
          <div className="flex flex-col gap-2">
            {Array.from({ length: 3 }, (_, index) => (
              <div key={index} className="h-20 animate-pulse rounded-lg bg-subtle" />
            ))}
          </div>
        ) : rows.length ? (
          <div className="flex flex-col divide-y divide-line-subtle overflow-hidden rounded-lg bg-surface">
            {rows.map((row) => (
              <article key={row.id} className="flex flex-col gap-2 px-4 py-3.5">
                <span className="flex items-center gap-3">
                  <Avatar name={row.studentName} src={row.studentAvatar ?? undefined} size="sm" />
                  <span className="flex min-w-0 flex-1 flex-col">
                    <strong className="truncate text-title-sm text-ink">{row.studentName}</strong>
                    <small className="truncate text-body-xs text-ink-tertiary">
                      {[row.courseTitle, row.lessonTitle, row.createdAt ? formatDayTime(row.createdAt) : ""]
                        .filter(Boolean)
                        .join(" · ")}
                    </small>
                  </span>
                  <StarRating value={row.stars} readOnly size={14} />
                </span>

                {row.description ? (
                  <p className="text-body-sm text-ink">{row.description}</p>
                ) : null}
              </article>
            ))}
          </div>
        ) : (
          <p className="rounded-lg bg-surface px-5 py-8 text-center text-body-sm text-ink-tertiary">
            {t("page.noRatings")}
          </p>
        )}
      </section>
    </ProfileSubPage>
  );
}
