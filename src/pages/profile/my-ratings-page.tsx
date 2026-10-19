import { useTranslation } from "react-i18next";
import { useAuth, useMyRatings } from "@/modules/auth";
import { Avatar } from "@/shared/ui/legacy";
import { StarRating } from "@/modules/lesson";
import { ProfileSubPage } from "./profile-shell";

export function MyRatingsPage() {
  const { t } = useTranslation("account");
  const { user } = useAuth();
  const ratings = useMyRatings(true);
  const rows = ratings.data?.items ?? [];

  const buckets = [5, 4, 3, 2, 1].map((stars) => ({
    stars,
    count: rows.filter((row) => Math.round(row.stars) === stars).length,
  }));
  const max = Math.max(1, ...buckets.map((bucket) => bucket.count));

  return (
    <ProfileSubPage title={t("page.ratingsTitle")} description={t("page.ratingsDescription")}>
      <section className="flex items-center gap-5 rounded-2xl border border-line bg-surface p-4">
        <span className="flex shrink-0 flex-col items-center gap-1">
          <strong className="font-heading text-display text-ink">
            {user?.avgRating == null ? "—" : user.avgRating.toFixed(1)}
          </strong>
          <StarRating value={Math.floor(user?.avgRating ?? 0)} readOnly size={16} />
          <small className="text-caption text-ink-tertiary">
            {t("page.ratingsCount", { count: user?.ratingCount ?? rows.length })}
          </small>
        </span>
        <span className="flex min-w-0 flex-1 flex-col gap-1.5">
          {buckets.map((bucket) => (
            <span key={bucket.stars} className="flex items-center gap-2">
              <small className="w-3 font-numeric text-caption text-ink-tertiary">{bucket.stars}</small>
              <span className="h-2 flex-1 overflow-hidden rounded-full bg-subtle">
                <span
                  className="block h-full rounded-full bg-saffron-strong"
                  style={{ width: `${(bucket.count / max) * 100}%` }}
                />
              </span>
              <small className="w-8 text-right font-numeric text-caption text-ink-tertiary">
                {bucket.count}
              </small>
            </span>
          ))}
        </span>
      </section>

      <section className="flex flex-col gap-2">
        <span className="px-1 text-caption-strong tracking-wide text-ink-tertiary uppercase">
          {t("page.recentComments")}
        </span>
        {ratings.isLoading ? (
          <div className="flex flex-col gap-2">
            {Array.from({ length: 3 }, (_, index) => (
              <div key={index} className="h-16 animate-pulse rounded-xl bg-muted" />
            ))}
          </div>
        ) : rows.length ? (
          <div className="flex flex-col divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface">
            {rows.map((row) => (
              <div key={row.id} className="flex items-start gap-3 px-4 py-3">
                <Avatar name={row.studentName} size="sm" />
                <span className="flex min-w-0 flex-1 flex-col gap-1">
                  <strong className="flex flex-wrap items-center gap-2 text-label-strong text-ink">
                    {row.studentName}
                    <StarRating value={row.stars} readOnly size={13} />
                  </strong>
                  {row.description ? (
                    <small className="text-caption text-ink-secondary">“{row.description}”</small>
                  ) : null}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="px-1 text-body-sm text-ink-tertiary">{t("page.noCertificates")}</p>
        )}
      </section>
    </ProfileSubPage>
  );
}
