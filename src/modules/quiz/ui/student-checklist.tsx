import { useTranslation } from "react-i18next";
import { Avatar } from "@/shared/ui/legacy";

export interface ChecklistStudent {
  id: string;
  name: string;
  avatarUrl?: string | null;
  note?: string;
}

export interface StudentChecklistProps {
  students: ChecklistStudent[];
  excluded: ReadonlySet<string>;
  onChange: (excluded: Set<string>) => void;
  loading?: boolean;
}

export function StudentChecklist({ students, excluded, onChange, loading = false }: StudentChecklistProps) {
  const { t } = useTranslation("quiz");
  const selected = students.filter((student) => !excluded.has(student.id)).length;
  const allSelected = selected === students.length;

  function toggle(id: string) {
    const next = new Set(excluded);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onChange(next);
  }

  return (
    <section className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <span className="flex-1 text-body-xs text-ink-secondary">
          {t("audience.studentsLabel")} · {t("audience.selected", { count: selected, total: students.length })}
        </span>
        {students.length ? (
          <button
            type="button"
            className="h-8 rounded-full px-3 text-caption-strong text-brand transition-colors hover:bg-brand-subtle"
            onClick={() => onChange(allSelected ? new Set(students.map((student) => student.id)) : new Set())}
          >
            {allSelected ? t("audience.clearAll") : t("audience.selectAll")}
          </button>
        ) : null}
      </div>
      <ul className="flex max-h-64 flex-col overflow-y-auto rounded-xl border border-line">
        {students.map((student) => {
          const checked = !excluded.has(student.id);
          return (
            <li key={student.id} className="border-b border-line last:border-b-0">
              <label className="flex min-h-12 cursor-pointer items-center gap-3 px-3.5 py-2 has-[:checked]:bg-brand-subtle/50">
                <input
                  type="checkbox"
                  className="size-4.5 shrink-0 accent-brand"
                  checked={checked}
                  onChange={() => toggle(student.id)}
                />
                <Avatar name={student.name} src={student.avatarUrl ?? undefined} size="sm" className="[&_.avatar]:size-8" />
                <span className="min-w-0 flex-1 truncate text-body text-ink">{student.name}</span>
                {student.note ? <small className="shrink-0 text-caption text-ink-tertiary">{student.note}</small> : null}
              </label>
            </li>
          );
        })}
        {!students.length ? (
          <li className="px-4 py-4 text-body-sm text-ink-secondary">
            {loading ? t("audience.loading") : t("audience.empty")}
          </li>
        ) : null}
      </ul>
      {students.length && !selected ? <small className="text-caption text-danger">{t("audience.pickOne")}</small> : null}
    </section>
  );
}
