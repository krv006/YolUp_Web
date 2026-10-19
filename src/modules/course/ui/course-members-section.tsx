import { useMemo, useState } from "react";
import { Icon } from "@/shared/ui/icon";
import { useTranslation } from "react-i18next";
import type { DomainUser } from "@/shared/types";
import { Avatar } from "@/shared/ui/legacy";
import { AppDialog, dialogButton } from "@/shared/ui/app-dialog";
import { useCourseStudents, useUnenrollStudent } from "../model/course.queries";
import { AddStudentDialog } from "./add-student-dialog";

export interface CourseMembersSectionProps {
  courseId: string | null;
  canManage: boolean;
}

const SEARCH_THRESHOLD = 8;

export function CourseMembersSection({ courseId, canManage }: CourseMembersSectionProps) {
  const { t } = useTranslation("group");
  const [search, setSearch] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<DomainUser | null>(null);
  const studentsQuery = useCourseStudents(courseId, { page_size: 100 });
  const unenroll = useUnenrollStudent();

  const all = useMemo(
    () => (studentsQuery.data?.items ?? []).map((item) => item.student),
    [studentsQuery.data]
  );
  const students = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return all;
    return all.filter((item) => `${item.name} ${item.username}`.toLowerCase().includes(query));
  }, [all, search]);

  function confirmRemove() {
    if (!removeTarget || !courseId) return;
    unenroll.mutate(
      { courseId, studentId: removeTarget.id },
      { onSuccess: () => setRemoveTarget(null) }
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline gap-3 px-1">
        <span className="flex-1 text-label-strong text-ink-tertiary">{t("students.title")}</span>
        <span className="text-caption text-ink-tertiary">
          {t("students.countSuffix", { count: studentsQuery.data?.total ?? all.length })}
        </span>
      </div>

      {all.length > SEARCH_THRESHOLD ? (
        <label className="flex h-12 items-center gap-3 rounded-xl border border-line bg-surface px-4">
          <Icon name="search" size={18} className="shrink-0 text-ink-tertiary" />
          <input
            className="h-full min-w-0 flex-1 bg-transparent text-body-sm text-ink outline-none placeholder:text-ink-tertiary"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t("students.searchPlaceholder")}
          />
        </label>
      ) : null}

      {studentsQuery.isLoading ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 3 }, (_, index) => (
            <div key={index} className="h-16 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {students.map((student) => (
            <div
              className="flex items-center gap-3 rounded-xl border border-line bg-surface px-4 py-3"
              key={student.id}
            >
              <Avatar name={student.name} tone={student.avatarTone} size="sm" />
              <span className="flex min-w-0 flex-1 flex-col">
                <strong className="truncate text-label-strong text-ink">{student.name}</strong>
                <small className="truncate text-caption text-ink-tertiary">
                  @{student.username}
                </small>
              </span>
              {canManage ? (
                <button
                  type="button"
                  className="grid size-9 shrink-0 place-items-center rounded-full text-ink-tertiary transition-colors hover:bg-error-bg hover:text-error-text"
                  aria-label={t("students.removeAria", { name: student.name })}
                  onClick={() => setRemoveTarget(student)}
                >
                  <Icon name="person" size={18} />
                </button>
              ) : null}
            </div>
          ))}
          {!students.length ? (
            <p className="px-1 text-body-sm text-ink-secondary">{t("students.empty")}</p>
          ) : null}
        </div>
      )}

      {canManage ? (
        <button
          type="button"
          className="flex h-12 items-center justify-center gap-2 rounded-xl bg-action-subtle text-label-strong text-action transition-colors hover:bg-action-subtle/70"
          onClick={() => setAddOpen(true)}
        >
          <Icon name="person" size={18} /> {t("students.addStudent")}
        </button>
      ) : null}

      {canManage ? <AddStudentDialog courseId={courseId} open={addOpen} onOpenChange={setAddOpen} /> : null}
      <AppDialog
        open={Boolean(removeTarget)}
        onOpenChange={(open) => {
          if (!open) setRemoveTarget(null);
        }}
        variant="confirm"
        title={t("students.removeConfirmTitle", { name: removeTarget?.name ?? "" })}
        description={t("students.removeDialogDescription", { name: removeTarget?.name ?? "" })}
        footer={
          <>
            <button
              type="button"
              className={dialogButton.secondary}
              onClick={() => setRemoveTarget(null)}
            >
              {t("students.cancel")}
            </button>
            <button
              type="button"
              className={dialogButton.danger}
              disabled={unenroll.isPending}
              onClick={confirmRemove}
            >
              {t("students.remove")}
            </button>
          </>
        }
      />
    </div>
  );
}
