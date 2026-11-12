import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useCourses, useCourseStudents } from "@/modules/course";
import { StudentChecklist } from "@/modules/quiz";
import type { GroupPick, GroupPicks } from "./group-targets";

export interface GroupTargetsPickerProps {
  value: GroupPicks;
  onChange: (value: GroupPicks) => void;
}

const EMPTY_PICK: GroupPick = { excluded: new Set(), studentIds: [] };

export function GroupTargetsPicker({ value, onChange }: GroupTargetsPickerProps) {
  const { t } = useTranslation("homework");
  const courses = useCourses();
  const items = courses.data ?? [];

  function toggle(courseId: string) {
    const next = new Map(value);
    if (next.has(courseId)) next.delete(courseId);
    else next.set(courseId, EMPTY_PICK);
    onChange(next);
  }

  return (
    <section className="flex flex-col gap-2">
      <span className="flex flex-col">
        <span className="text-body-xs text-ink-secondary">{t("bank.groupsLabel")}</span>
        <small className="text-caption text-ink-tertiary">{t("bank.groupsHint")}</small>
      </span>
      <ul className="flex flex-col overflow-hidden rounded-xl border border-line">
        {items.map((course) => {
          const pick = value.get(course.id);
          return (
            <li key={course.id} className="border-b border-line last:border-b-0">
              <label
                className={`flex min-h-12 cursor-pointer items-center gap-3 px-4 py-2 ${pick ? "bg-brand-subtle" : ""}`}
              >
                <input
                  type="checkbox"
                  className="size-4.5 shrink-0 accent-brand"
                  checked={Boolean(pick)}
                  onChange={() => toggle(course.id)}
                />
                <span className="min-w-0 flex-1 truncate text-body text-ink">{course.title}</span>
                <small className="shrink-0 text-caption text-ink-secondary">
                  {t("bank.studentsCount", { count: course.studentCount || course.students })}
                </small>
              </label>
              {pick ? (
                <GroupStudents
                  courseId={course.id}
                  pick={pick}
                  onChange={(next) => onChange(new Map(value).set(course.id, next))}
                />
              ) : null}
            </li>
          );
        })}
        {!items.length ? (
          <li className="px-4 py-4 text-body-sm text-ink-secondary">
            {courses.isLoading ? t("bank.loading") : t("bank.noGroups")}
          </li>
        ) : null}
      </ul>
    </section>
  );
}

function GroupStudents({
  courseId,
  pick,
  onChange,
}: {
  courseId: string;
  pick: GroupPick;
  onChange: (pick: GroupPick) => void;
}) {
  const enrollments = useCourseStudents(courseId, { page_size: 100 });
  const students = useMemo(
    () =>
      (enrollments.data?.items ?? [])
        .filter((item) => item.status === "approved")
        .map((item) => ({ id: item.student.id, name: item.student.name, avatarUrl: item.student.avatarUrl })),
    [enrollments.data]
  );

  return (
    <div className="px-3 pt-1 pb-3">
      <StudentChecklist
        students={students}
        excluded={pick.excluded}
        loading={enrollments.isLoading}
        onChange={(excluded) => onChange({ excluded, studentIds: students.map((student) => student.id) })}
      />
    </div>
  );
}
