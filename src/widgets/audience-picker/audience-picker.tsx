import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useCourses } from "@/modules/course";
import type { AudienceInput } from "@/modules/conversation";
import { useUserSearch } from "@/modules/notification";
import { Icon } from "@/shared/ui/icon";
import { Avatar } from "@/shared/ui/legacy";

export interface AudiencePickerProps {
  value: AudienceInput;
  onChange: (value: AudienceInput) => void;
  excludeCourseIds?: string[];
}

function toggle(list: string[], id: string): string[] {
  return list.includes(id) ? list.filter((item) => item !== id) : [...list, id];
}

export function AudiencePicker({ value, onChange, excludeCourseIds = [] }: AudiencePickerProps) {
  const { t } = useTranslation("chat");
  const courses = useCourses();
  const [query, setQuery] = useState("");
  const [names, setNames] = useState<Record<string, string>>({});
  const search = useUserSearch(query.trim());
  const students = (search.data ?? []).filter((person) => person.role === "student");
  const courseItems = (courses.data ?? []).filter((course) => !excludeCourseIds.includes(course.id));

  return (
    <div className="flex flex-col gap-4">
      <section className="flex flex-col gap-2">
        <span className="text-body-xs text-ink-secondary">{t("audience.groups")}</span>
        <ul className="flex max-h-52 flex-col overflow-y-auto rounded-xl border border-line">
          {courseItems.map((course) => (
            <li key={course.id} className="border-b border-line last:border-b-0">
              <label className="flex min-h-12 cursor-pointer items-center gap-3 px-4 py-2 has-[:checked]:bg-brand-subtle">
                <input
                  type="checkbox"
                  className="size-4.5 shrink-0 accent-brand"
                  checked={value.courseIds.includes(course.id)}
                  onChange={() => onChange({ ...value, courseIds: toggle(value.courseIds, course.id) })}
                />
                <span className="min-w-0 flex-1 truncate text-body text-ink">{course.title}</span>
                <small className="shrink-0 text-caption text-ink-secondary">
                  {t("audience.studentsCount", { count: course.studentCount || course.students })}
                </small>
              </label>
            </li>
          ))}
          {!courseItems.length ? (
            <li className="px-4 py-4 text-body-sm text-ink-secondary">
              {courses.isLoading ? t("audience.loading") : t("audience.noGroups")}
            </li>
          ) : null}
        </ul>
      </section>

      <section className="flex flex-col gap-2">
        <span className="text-body-xs text-ink-secondary">{t("audience.students")}</span>
        {value.studentIds.length ? (
          <div className="flex flex-wrap gap-2">
            {value.studentIds.map((id) => (
              <button
                key={id}
                type="button"
                className="flex h-8 items-center gap-1.5 rounded-full bg-brand-subtle pr-2 pl-3 text-caption-strong text-brand"
                aria-label={t("audience.removeStudent", { name: names[id] ?? "" })}
                onClick={() => onChange({ ...value, studentIds: value.studentIds.filter((item) => item !== id) })}
              >
                {names[id] ?? id}
                <Icon name="close" size={14} />
              </button>
            ))}
          </div>
        ) : null}
        <label className="flex h-12 items-center gap-3 rounded-full border border-line bg-surface px-4">
          <Icon name="search" size={18} className="shrink-0 text-icon-secondary" />
          <input
            className="h-full min-w-0 flex-1 bg-transparent text-body text-ink outline-none placeholder:text-ink-tertiary"
            value={query}
            placeholder={t("audience.searchPlaceholder")}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
        {query.trim().length >= 2 ? (
          <ul className="flex max-h-52 flex-col overflow-y-auto rounded-xl border border-line">
            {students.map((person) => {
              const picked = value.studentIds.includes(person.id);
              return (
                <li key={person.id} className="border-b border-line last:border-b-0">
                  <button
                    type="button"
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-subtle"
                    onClick={() => {
                      setNames((current) => ({ ...current, [person.id]: person.name }));
                      onChange({ ...value, studentIds: toggle(value.studentIds, person.id) });
                    }}
                  >
                    <Avatar name={person.name} src={person.avatar ?? undefined} size="sm" className="[&_.avatar]:size-9" />
                    <span className="flex min-w-0 flex-1 flex-col">
                      <strong className="truncate text-title-sm text-ink">{person.name}</strong>
                      <small className="truncate text-body-xs text-ink-secondary">@{person.username}</small>
                    </span>
                    <Icon
                      name={picked ? "check-box-fill" : "check-box"}
                      size={20}
                      className={picked ? "shrink-0 text-brand" : "shrink-0 text-icon-secondary"}
                    />
                  </button>
                </li>
              );
            })}
            {!students.length ? (
              <li className="px-4 py-4 text-body-sm text-ink-secondary">
                {search.isLoading ? t("audience.loading") : t("audience.noStudents")}
              </li>
            ) : null}
          </ul>
        ) : null}
      </section>
    </div>
  );
}
