import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useAssignmentAudience, useSetAssignmentAudience } from "@/modules/homework";
import { StudentChecklist } from "@/modules/quiz";
import { AppDialog, dialogButton } from "@/shared/ui/app-dialog";
import { Icon } from "@/shared/ui/icon";
import { Avatar } from "@/shared/ui/legacy";

export interface AssignmentAudienceCardProps {
  assignmentId: string;
  className?: string;
}

export function AssignmentAudienceCard({ assignmentId, className = "" }: AssignmentAudienceCardProps) {
  const { t } = useTranslation("homework");
  const audience = useAssignmentAudience(assignmentId);
  const save = useSetAssignmentAudience();
  const [editing, setEditing] = useState<Set<string> | null>(null);
  const data = audience.data;
  const students = data?.students ?? [];
  const shown = data?.restricted ? students.filter((student) => student.assigned) : students;

  function submit() {
    if (!editing) return;
    const chosen = students.filter((student) => !editing.has(student.id)).map((student) => student.id);
    save.mutate(
      { id: assignmentId, studentIds: editing.size ? chosen : [] },
      { onSuccess: () => setEditing(null) }
    );
  }

  return (
    <section className={`flex flex-col gap-3 rounded-lg bg-surface p-5 ${className}`}>
      <div className="flex items-center gap-2">
        <strong className="flex-1 text-title text-ink">{t("audience.title")}</strong>
        {students.length ? (
          <button
            type="button"
            className="flex h-8 items-center gap-1.5 rounded-full bg-brand-subtle px-3 text-caption-strong text-brand transition-colors hover:bg-tint"
            onClick={() => setEditing(new Set(students.filter((student) => !student.assigned).map((student) => student.id)))}
          >
            <Icon name="edit" size={14} />
            {t("audience.edit")}
          </button>
        ) : null}
      </div>

      {audience.isLoading ? (
        <p className="text-body-sm text-ink-secondary">{t("audience.loading")}</p>
      ) : (
        <>
          <small className="text-body-sm text-ink-secondary">
            {data?.restricted
              ? t("audience.restricted", { count: data.assignedCount, total: data.total })
              : t("audience.everyone", { count: data?.total ?? 0 })}
          </small>
          <ul className="flex max-h-72 flex-col overflow-y-auto">
            {shown.map((student) => (
              <li key={student.id} className="flex items-center gap-2.5 py-1.5">
                <Avatar name={student.name} size="sm" className="[&_.avatar]:size-8" />
                <span className="min-w-0 flex-1 truncate text-body-sm text-ink">{student.name}</span>
                <small
                  className={`shrink-0 rounded-full px-2 py-0.5 text-caption-strong ${
                    student.submitted ? "bg-success-bg text-success-fg" : "bg-subtle text-ink-secondary"
                  }`}
                >
                  {student.submitted ? t("audience.submitted") : t("audience.notSubmitted")}
                </small>
              </li>
            ))}
          </ul>
        </>
      )}

      <AppDialog
        open={Boolean(editing)}
        onOpenChange={(open) => !open && setEditing(null)}
        variant="adaptive"
        width="lg:max-w-115"
        title={t("audience.editTitle")}
        description={t("audience.editHint")}
        footer={
          <>
            <button type="button" className={dialogButton.secondary} onClick={() => setEditing(null)}>
              {t("audience.cancel")}
            </button>
            <button
              type="button"
              className={dialogButton.primary}
              disabled={save.isPending || (editing ? editing.size === students.length : true)}
              onClick={submit}
            >
              {t("audience.save")}
            </button>
          </>
        }
      >
        {editing ? (
          <StudentChecklist
            students={students.map((student) => ({
              id: student.id,
              name: student.name,
              note: student.submitted ? t("audience.submitted") : undefined,
            }))}
            excluded={editing}
            onChange={setEditing}
          />
        ) : null}
      </AppDialog>
    </section>
  );
}
