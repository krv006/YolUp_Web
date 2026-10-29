import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useCourses } from "@/modules/course";
import { useIsCompact } from "@/shared/hooks/use-media-query";
import { Icon } from "@/shared/ui/icon";
import { Avatar } from "@/shared/ui/legacy";
import { MobileEmptyCard, MobileListSkeleton } from "@/shared/ui/mobile-page";
import { useStudentAssignments } from "@/pages/student/lib/use-student-assignments";
import { ProfileSubPage } from "./profile-shell";

const DAY_MS = 86_400_000;

function Stars({ value, size }: { value: number; size: number }) {
  return (
    <span className="flex shrink-0 items-center gap-px" aria-hidden="true">
      {[1, 2, 3, 4, 5].map((star) => (
        <Icon key={star} name="star" size={size} className={star <= value ? "text-accent-saffron-fg" : "text-line-strong"} />
      ))}
    </span>
  );
}

export function StudentRatings() {
  const { t } = useTranslation("account");
  const months = useTranslation("lesson").t("list.months", { returnObjects: true }) as string[];
  const isCompact = useIsCompact();
  const courses = useCourses();
  const groups = useMemo(() => courses.data ?? [], [courses.data]);
  const assignments = useStudentAssignments(groups);
  const loading = courses.isLoading || assignments.isLoading;

  const rows = assignments.data
    .filter((item) => item.mySubmission?.status === "done" && item.mySubmission.gradeValue !== null)
    .map((item) => {
      const submission = item.mySubmission!;
      const raw = submission.gradeValue as number;
      const course = groups.find((entry) => entry.id === item.courseId);
      return {
        id: item.id,
        teacher: course?.teacher ?? "",
        teacherTone: course?.teacherUser?.avatarTone,
        course: item.courseTitle || course?.title || "",
        at: submission.checkedAt ?? submission.createdAt,
        value: raw,
        stars: Math.max(1, Math.min(5, Math.round(item.grading === "hundred" ? raw / 20 : raw))),
        text: submission.teacherComment || submission.resubmitComment || item.title,
      };
    })
    .sort((a, b) => b.at.localeCompare(a.at));

  const average = rows.length ? rows.reduce((sum, row) => sum + row.stars, 0) / rows.length : null;
  const bars = [5, 4, 3, 2, 1]
    .map((stars) => ({ stars, count: rows.filter((row) => row.stars === stars).length }))
    .filter((bar) => bar.count > 0);

  function when(value: string): string {
    const date = new Date(value);
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    if (date >= start) return t("page.mobile.today");
    if (date.getTime() >= start.getTime() - DAY_MS) return t("page.mobile.yesterday");
    return `${date.getDate()}-${(months[date.getMonth()] ?? "").toLowerCase()}`;
  }

  if (!loading && !rows.length)
    return (
      <ProfileSubPage title={t("page.ratingsTitle")}>
        <MobileEmptyCard icon="star" title={t("page.mobile.noRatingsTitle")} description={t("page.studentNoRatingsHint")} />
      </ProfileSubPage>
    );

  return (
    <ProfileSubPage title={t("page.ratingsTitle")}>
      <section className={`flex flex-col gap-3 bg-surface ${isCompact ? "rounded-xl p-4" : "rounded-2xl px-4 py-4"}`}>
        <span className="flex items-center gap-4">
          <strong className="shrink-0 font-heading text-[40px]/10 font-semibold text-ink">
            {average === null ? "—" : average.toFixed(1).replace(".", ",")}
          </strong>
          <span className="flex min-w-0 flex-col gap-1">
            <Stars value={Math.round(average ?? 0)} size={20} />
            <small className="text-caption text-ink-secondary">{t("page.ratingsCount", { count: rows.length })}</small>
          </span>
        </span>
        {bars.map((bar) => (
          <span key={bar.stars} className="flex items-center gap-3">
            <small className="w-2 shrink-0 text-caption text-ink">{bar.stars}</small>
            <span className="h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-subtle">
              <i
                className="block h-full rounded-full bg-accent-saffron-fg not-italic"
                style={{ width: `${(bar.count / rows.length) * 100}%` }}
              />
            </span>
            <small className="w-6 shrink-0 text-right text-caption text-ink-secondary">{bar.count}</small>
          </span>
        ))}
      </section>

      <section className="flex flex-col gap-3">
        <span className="text-title text-ink">{t("page.studentRatingsTitle")}</span>
        {loading ? (
          <MobileListSkeleton card rows={2} />
        ) : (
          <div className="flex flex-col divide-y divide-line overflow-hidden rounded-2xl bg-surface">
            {rows.map((row) => (
              <article key={row.id} className="flex flex-col gap-2 px-4 py-3.5">
                <span className="flex items-center gap-2.5">
                  <Avatar name={row.teacher || row.course} tone={row.teacherTone} size="sm" className="[&_.avatar]:size-8" />
                  <span className="flex min-w-0 flex-1 flex-col">
                    <strong className="truncate text-body-sm font-semibold text-ink">{row.teacher || row.course}</strong>
                    <small className="truncate text-caption text-ink-secondary">
                      {t("page.studentRatingMeta", { course: row.course, when: when(row.at), value: row.value })}
                    </small>
                  </span>
                  <Stars value={row.stars} size={14} />
                </span>
                <p className="text-body-sm text-ink">{row.text}</p>
              </article>
            ))}
          </div>
        )}
      </section>
    </ProfileSubPage>
  );
}
