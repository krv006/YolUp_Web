import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { AppDialog, dialogButton } from "@/shared/ui/app-dialog";
import { Avatar } from "@/shared/ui/legacy";
import { Switch } from "@/shared/ui/switch";

export type BoardPermissionMode = "teacher" | "selected" | "everyone";

const MODES: BoardPermissionMode[] = ["teacher", "selected", "everyone"];

export interface BoardPermissionStudent {
  id: string;
  name: string;
  username: string;
}

export interface BoardPermissionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  students: BoardPermissionStudent[];
  pending: boolean;
  onGrant: (studentIds: string[]) => void;
}

export function BoardPermissionDialog({
  open,
  onOpenChange,
  students,
  pending,
  onGrant,
}: BoardPermissionDialogProps) {
  const { t } = useTranslation("board");
  const [mode, setMode] = useState<BoardPermissionMode>("selected");
  const [allowed, setAllowed] = useState<string[]>([]);

  function save() {
    if (mode === "teacher") {
      toast.info(t("permissionDialog.revokeUnavailable"));
      return;
    }
    const ids = mode === "everyone" ? students.map((student) => student.id) : allowed;
    if (!ids.length) {
      toast.info(t("permissionDialog.pickStudent"));
      return;
    }
    onGrant(ids);
  }

  return (
    <AppDialog
      open={open}
      onOpenChange={onOpenChange}
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
            className={`flex items-center gap-3 rounded-xl border px-3.5 py-3 text-left transition-colors ${
              mode === item ? "border-action bg-action-subtle" : "border-line bg-surface"
            }`}
            onClick={() => setMode(item)}
          >
            <span
              className={`grid size-5 shrink-0 place-items-center rounded-full border-2 ${
                mode === item ? "border-action" : "border-line"
              }`}
            >
              {mode === item ? <span className="size-2.5 rounded-full bg-action" /> : null}
            </span>
            <span className="flex min-w-0 flex-col">
              <strong className="text-label-strong text-ink">
                {t(`permissionDialog.modes.${item}.title`)}
              </strong>
              <small className="text-caption text-ink-tertiary">
                {t(`permissionDialog.modes.${item}.hint`)}
              </small>
            </span>
          </button>
        ))}
      </div>

      {mode === "selected" ? (
        <div className="-mr-1 flex max-h-72 flex-col gap-1 overflow-y-auto pr-1">
          {students.map((student) => {
            const on = allowed.includes(student.id);
            return (
              <label key={student.id} className="flex items-center gap-3 rounded-xl px-1 py-2">
                <Avatar name={student.name} size="sm" />
                <span className="min-w-0 flex-1 truncate text-label-strong text-ink">
                  {student.name}
                </span>
                <Switch
                  checked={on}
                  onCheckedChange={(next) =>
                    setAllowed((current) =>
                      next
                        ? [...current, student.id]
                        : current.filter((id) => id !== student.id)
                    )
                  }
                  aria-label={student.name}
                />
              </label>
            );
          })}
          {students.length ? null : (
            <p className="py-3 text-center text-body-sm text-ink-tertiary">
              {t("grantDialog.noStudents")}
            </p>
          )}
        </div>
      ) : null}
    </AppDialog>
  );
}
