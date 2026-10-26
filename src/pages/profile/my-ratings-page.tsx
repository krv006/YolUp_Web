import { useTranslation } from "react-i18next";
import { useAuth, useMyRatings } from "@/modules/auth";
import { StarRating } from "@/modules/lesson";
import { formatDayTime } from "@/shared/lib";
import { Avatar } from "@/shared/ui/legacy";
import { ProfileSubPage } from "./profile-shell";

export function MyRatingsPage() {
  const { t } = useTranslation("account");
  const { user } = useAuth();
  const ratings = useMyRatings(true);
  const rows = ratings.data?.items ?? [];

  const buckets = [5, 4, 3, 2, 1]
    .map((stars) => ({
      stars,
      count: rows.filter((row) => Math.round(row.stars) === stars).length,
    }))
    .filter((bucket) => bucket.count > 0);
  const max = Math.max(1, ...buckets.map((bucket) => bucket.count));

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
                  <Avatar name={row.studentName} size="sm" />
                  <span className="flex min-w-0 flex-1 flex-col">
                    <strong className="truncate text-title-sm text-ink">{row.studentName}</strong>
                    <small className="truncate text-body-xs text-ink-tertiary">
                      {row.createdAt ? formatDayTime(row.createdAt) : ""}
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
