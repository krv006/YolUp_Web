import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { AppDialog, dialogButton } from "@/shared/ui/app-dialog";
import { Avatar } from "@/shared/ui/legacy";
import { Icon } from "@/shared/ui/icon";

export type BoardPermissionMode = "teacher" | "selected" | "everyone";

const MODES: BoardPermissionMode[] = ["teacher", "selected", "everyone"];

export interface BoardPermissionStudent {
  id: string;
  name: string;
  username: string;
}

export type BoardPermissionInput = { studentIds: string[] } | { mode: "all" | "none" };

export interface BoardPermissionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  students: BoardPermissionStudent[];
  pending: boolean;
  onSubmit: (input: BoardPermissionInput) => void;
}

export function BoardPermissionDialog({
  open,
  onOpenChange,
  students,
  pending,
  onSubmit,
}: BoardPermissionDialogProps) {
  const { t } = useTranslation("board");
  const [mode, setMode] = useState<BoardPermissionMode>("selected");
  const [allowed, setAllowed] = useState<string[]>([]);

  function save() {
    if (mode === "teacher") {
      onSubmit({ mode: "none" });
      return;
    }
    if (mode === "everyone") {
      onSubmit({ mode: "all" });
      return;
    }
    if (!allowed.length) {
      toast.info(t("permissionDialog.pickStudent"));
      return;
    }
    onSubmit({ studentIds: allowed });
  }

  return (
    <AppDialog
      open={open}
      onOpenChange={onOpenChange}
      width="lg:w-120"
      title={t("permissionDialog.title")}
      description={t("permissionDialog.description")}
      footer={
        <>
          <button
            type="button"
            className={dialogButton.secondary}
            onClick={() => onOpenChange(false)}
          >
            {t("permissionDialog.cancel")}
          </button>
          <button
            type="button"
            className={dialogButton.primary}
            disabled={pending}
            onClick={save}
          >
            {t("permissionDialog.save")}
          </button>
        </>
      }
    >
      <div className="flex flex-col gap-2" role="radiogroup">
        {MODES.map((item) => (
          <button
            key={item}
            type="button"
            role="radio"
            aria-checked={mode === item}
            className={`flex items-center gap-3 rounded-md border px-4 py-3 text-left transition-colors ${
              mode === item ? "border-brand bg-brand-subtle" : "border-line bg-surface"
            }`}
            onClick={() => setMode(item)}
          >
            <span className="flex min-w-0 flex-1 flex-col">
              <strong className="truncate text-title-sm text-ink">
                {t(`permissionDialog.modes.${item}.title`)}
              </strong>
              <small className="truncate text-body-xs text-ink-tertiary">
                {t(`permissionDialog.modes.${item}.hint`)}
              </small>
            </span>
            <span
              className={`grid size-5 shrink-0 place-items-center rounded-full border-2 ${
                mode === item ? "border-brand" : "border-line-strong"
              }`}
            >
              {mode === item ? <span className="size-2.5 rounded-full bg-brand" /> : null}
            </span>
          </button>
        ))}
      </div>

      {mode === "selected" ? (
        <>
          <span className="text-overline text-ink-tertiary uppercase">
            {t("permissionDialog.selectedCount", { count: allowed.length })}
          </span>

          <div className="flex max-h-60 flex-col overflow-y-auto rounded-md border border-line">
            {students.map((student) => {
              const on = allowed.includes(student.id);
              return (
                <button
                  key={student.id}
                  type="button"
                  role="checkbox"
                  aria-checked={on}
                  className="flex items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-subtle"
                  onClick={() =>
                    setAllowed((current) =>
                      on ? current.filter((id) => id !== student.id) : [...current, student.id]
                    )
                  }
                >
                  <Avatar name={student.name} size="xs" />
                  <span className="min-w-0 flex-1 truncate text-title-sm text-ink">
                    {student.name}
                  </span>
                  <span
                    className={`grid size-6 shrink-0 place-items-center rounded-sm border transition-colors ${
                      on ? "border-brand bg-brand text-on-action" : "border-line bg-surface"
                    }`}
                  >
                    {on ? <Icon name="check" size={16} /> : null}
                  </span>
                </button>
              );
            })}

            {students.length ? null : (
              <p className="py-5 text-center text-body-sm text-ink-tertiary">
                {t("grantDialog.noStudents")}
              </p>
            )}
          </div>
        </>
      ) : null}
    </AppDialog>
  );
}
