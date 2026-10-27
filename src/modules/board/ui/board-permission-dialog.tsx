import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { useIsCompact } from "@/shared/hooks/use-media-query";
import { AppDialog, dialogButton } from "@/shared/ui/app-dialog";
import { Avatar } from "@/shared/ui/legacy";
import { Icon } from "@/shared/ui/icon";
import { MobileRadio } from "@/shared/ui/mobile-fields";
import { mobileButton } from "@/shared/ui/mobile-page";

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
  const isCompact = useIsCompact();
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
      titleClassName={isCompact ? "text-title-lg font-semibold" : undefined}
      footerClassName={isCompact ? "px-4 pt-5 pb-[27px]" : undefined}
      title={t("permissionDialog.title")}
      description={t("permissionDialog.description")}
      footer={
        <>
          <button
            type="button"
            className={isCompact ? mobileButton.secondary : dialogButton.secondary}
            onClick={() => onOpenChange(false)}
          >
            {t("permissionDialog.cancel")}
          </button>
          <button
            type="button"
            className={isCompact ? mobileButton.primary : dialogButton.primary}
            disabled={pending}
            onClick={save}
          >
            {t("permissionDialog.save")}
          </button>
        </>
      }
    >
      <div className="flex flex-col gap-2 max-lg:-mt-0.5 max-lg:gap-2.5" role="radiogroup">
        {MODES.map((item) => (
          <button
            key={item}
            type="button"
            role="radio"
            aria-checked={mode === item}
            className={`flex items-center gap-3 rounded-md border px-4 py-3 text-left transition-colors max-lg:h-[74px] max-lg:rounded-xl max-lg:py-0 max-lg:pr-[25px] max-lg:pl-3.5 ${
              mode === item ? "border-brand bg-brand-subtle max-lg:border-[1.5px]" : "border-line bg-surface"
            }`}
            onClick={() => setMode(item)}
          >
            <span className="flex min-w-0 flex-1 flex-col">
              <strong className="truncate text-title-sm text-ink max-lg:text-title">
                {t(isCompact && item === "teacher" ? "permissionDialog.teacherOnly" : `permissionDialog.modes.${item}.title`)}
              </strong>
              <small className="truncate text-body-xs text-ink-tertiary max-lg:text-body-sm max-lg:text-ink-secondary">
                {t(`permissionDialog.modes.${item}.hint`)}
              </small>
            </span>
            {isCompact ? (
              <MobileRadio checked={mode === item} />
            ) : (
              <span
                className={`grid size-5 shrink-0 place-items-center rounded-full border-2 ${
                  mode === item ? "border-brand" : "border-line-strong"
                }`}
              >
                {mode === item ? <span className="size-2.5 rounded-full bg-brand" /> : null}
              </span>
            )}
          </button>
        ))}
      </div>

      {mode === "selected" ? (
        <>
          <span className="text-overline text-ink-tertiary uppercase max-lg:-mt-1.5 max-lg:text-caption-strong max-lg:text-ink-secondary">
            {t("permissionDialog.selectedCount", { count: allowed.length })}
          </span>

          <div className="flex max-h-60 flex-col overflow-y-auto rounded-md border border-line max-lg:-mt-1.5 max-lg:max-h-none max-lg:rounded-xl max-lg:border-0 max-lg:ring-1 max-lg:ring-line max-lg:ring-inset">
            {students.map((student) => {
              const on = allowed.includes(student.id);
              return (
                <button
                  key={student.id}
                  type="button"
                  role="checkbox"
                  aria-checked={on}
                  className="flex items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-subtle max-lg:h-[74px] max-lg:shrink-0 max-lg:py-0 max-lg:pr-[28px]"
                  onClick={() =>
                    setAllowed((current) =>
                      on ? current.filter((id) => id !== student.id) : [...current, student.id]
                    )
                  }
                >
                  <Avatar name={student.name} size={isCompact ? "sm" : "xs"} className="max-lg:[&_.avatar]:size-8" />
                  <span className="min-w-0 flex-1 truncate text-title-sm text-ink max-lg:text-title max-lg:font-medium">
                    {student.name}
                  </span>
                  <span
                    className={`grid size-6 shrink-0 place-items-center rounded-sm border transition-colors max-lg:size-[22px] max-lg:rounded-[6px] ${
                      on
                        ? "border-brand bg-brand text-on-action"
                        : "border-line bg-surface max-lg:border-[1.5px] max-lg:border-line-strong"
                    }`}
                  >
                    {on ? <Icon name="check" size={isCompact ? 14 : 16} /> : null}
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
