import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { AppDialog, dialogButton } from "@/shared/ui/app-dialog";
import { Icon } from "@/shared/ui/icon";
import type { ExamTemplateFormValues } from "../api/exam.dto";
import {
  templateToForm,
  templateTotalMinutes,
  validateTemplate,
  type TemplateItemDraft,
} from "../lib/template-draft";

export interface ExamTemplateDialogProps {
  open: boolean;
  pending?: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (values: ExamTemplateFormValues) => void;
}

export function ExamTemplateDialog({ open, pending = false, onOpenChange, onCreate }: ExamTemplateDialogProps) {
  const { t } = useTranslation("exam");
  const nextId = useRef(0);
  function newId() {
    nextId.current += 1;
    return `i${nextId.current}`;
  }

  const [name, setName] = useState("");
  const description = "";
  const [scale, setScale] = useState("100");
  const [passPercent, setPassPercent] = useState("");
  const [items, setItems] = useState<TemplateItemDraft[]>(() => [
    { id: "i0", kind: "section", title: "", minutes: "60", weight: "1" },
  ]);
  const [error, setError] = useState<string | null>(null);

  function close() {
    onOpenChange(false);
  }

  function addItem(kind: "section" | "break") {
    setItems((current) => [
      ...current,
      {
        id: newId(),
        kind,
        title: kind === "break" ? t("templateDialog.breakDefaultTitle") : "",
        minutes: kind === "break" ? "10" : "60",
        weight: "1",
      },
    ]);
  }

  function updateItem(id: string, patch: Partial<TemplateItemDraft>) {
    setItems((current) => current.map((item) => (item.id === id ? { ...item, ...patch } : item)));
    setError(null);
  }

  function moveItem(index: number, to: number) {
    if (to < 0 || to >= items.length) return;
    setItems((current) => {
      const next = [...current];
      const [item] = next.splice(index, 1);
      next.splice(to, 0, item);
      return next;
    });
  }

  function submit() {
    const failure = validateTemplate(name, items, scale, passPercent);
    if (failure) {
      setError(t(`templateDialog.validation.${failure}`));
      return;
    }
    onCreate(templateToForm(name, description, items, scale, passPercent));
  }

  const total = templateTotalMinutes(items);
  const hours = Math.floor(total / 60);

  return (
    <AppDialog
      open={open}
      onOpenChange={(next) => (next ? onOpenChange(true) : close())}
      variant="confirm"
      width="lg:w-204"
      icon={
        <span className="grid size-11 place-items-center rounded-md bg-brand-subtle text-brand">
          <Icon name="tune" size={22} />
        </span>
      }
      title={t("templateDialog.title")}
      description={t("templateDialog.description")}
      footer={
        <>
          <span className="min-w-0 flex-1" />
          <button type="button" className={`${dialogButton.secondary} flex-none`} onClick={close}>
            {t("templateDialog.cancel")}
          </button>
          <button
            type="button"
            className={`${dialogButton.primary} flex-none`}
            disabled={pending}
            onClick={submit}
          >
            {t("templateDialog.submit")}
          </button>
        </>
      }
    >
      <div className="grid items-start gap-6 lg:grid-cols-2">
        <div className="flex min-w-0 flex-col gap-4">
          <label className="flex flex-col gap-2">
            <span className="text-body-sm text-ink-secondary">{t("templateDialog.nameLabel")}</span>
            <input
              autoFocus
              className="h-13 w-full rounded-md border border-transparent bg-subtle px-4 text-body text-ink outline-none placeholder:text-ink-tertiary focus:border-focus focus:bg-surface"
              value={name}
              placeholder={t("templateDialog.namePlaceholder")}
              onChange={(event) => {
                setName(event.target.value);
                setError(null);
              }}
            />
          </label>

          <span className="text-overline text-ink-tertiary uppercase">
            {t("templateDialog.orderHead")} ·{" "}
            {hours
              ? t("templateDialog.totalHours", { hours, count: total % 60 })
              : t("templateDialog.totalMinutes", { count: total })}
          </span>

          {error ? (
            <p className="flex items-center gap-2.5 rounded-md bg-danger-bg px-4 py-3 text-body-sm text-danger">
              <Icon name="error" size={18} className="shrink-0" />
              {error}
            </p>
          ) : null}
        </div>

        <div className="flex min-w-0 flex-col gap-3">
          <div className="flex flex-col gap-2 rounded-md bg-subtle p-2">
            {items.map((item, index) => (
              <div
                key={item.id}
                className={`flex items-center gap-2 rounded-md px-3 py-2.5 ${
                  item.kind === "break" ? "bg-warning-bg" : "bg-surface"
                }`}
              >
                <Icon name="drag-indicator" size={18} className="shrink-0 text-icon-tertiary" />

                <span className="flex min-w-0 flex-1 flex-col">
                  <input
                    className={`w-full bg-transparent text-title-sm outline-none placeholder:text-ink-tertiary ${
                      item.kind === "break" ? "text-warning-fg" : "text-ink"
                    }`}
                    value={item.title}
                    placeholder={
                      item.kind === "break"
                        ? t("templateDialog.breakPlaceholder")
                        : t("templateDialog.sectionPlaceholder")
                    }
                    onChange={(event) => updateItem(item.id, { title: event.target.value })}
                  />
                  <span className="flex items-center gap-1 text-body-xs text-ink-tertiary">
                    <input
                      type="number"
                      min={1}
                      className="w-8 bg-transparent text-right outline-none"
                      value={item.minutes}
                      aria-label={t("templateDialog.minutesLabel")}
                      onChange={(event) => updateItem(item.id, { minutes: event.target.value })}
                    />
                    {t("templateDialog.minutesShort")}
                    {item.kind === "section" ? (
                      <>
                        {" · "}
                        {t("templateDialog.weightShort")}
                        <input
                          type="number"
                          min={1}
                          max={10}
                          className="w-7 bg-transparent outline-none"
                          value={item.weight}
                          aria-label={t("templateDialog.weightLabel")}
                          onChange={(event) => updateItem(item.id, { weight: event.target.value })}
                        />
                      </>
                    ) : null}
                  </span>
                </span>

                <button
                  type="button"
                  className="grid size-7 shrink-0 place-items-center rounded-sm text-icon-tertiary transition-colors hover:bg-subtle hover:text-ink disabled:opacity-40"
                  disabled={index === 0}
                  aria-label={t("templateDialog.moveUp")}
                  onClick={() => moveItem(index, index - 1)}
                >
                  <Icon name="expand-less" size={18} />
                </button>
                <button
                  type="button"
                  className="grid size-7 shrink-0 place-items-center rounded-sm text-icon-tertiary transition-colors hover:bg-subtle hover:text-ink disabled:opacity-40"
                  disabled={index === items.length - 1}
                  aria-label={t("templateDialog.moveDown")}
                  onClick={() => moveItem(index, index + 1)}
                >
                  <Icon name="expand-more" size={18} />
                </button>
                <button
                  type="button"
                  className="grid size-7 shrink-0 place-items-center rounded-sm text-danger transition-colors hover:bg-danger-bg disabled:opacity-40"
                  disabled={items.length <= 1}
                  aria-label={t("templateDialog.removeItem")}
                  onClick={() => setItems((current) => current.filter((entry) => entry.id !== item.id))}
                >
                  <Icon name="delete" size={18} />
                </button>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              className="flex h-11 items-center justify-center rounded-full bg-brand-subtle text-button text-brand transition-opacity hover:opacity-85"
              onClick={() => addItem("section")}
            >
              + {t("templateDialog.addSection")}
            </button>
            <button
              type="button"
              className="flex h-11 items-center justify-center rounded-full border border-line bg-surface text-button text-ink transition-colors hover:bg-subtle"
              onClick={() => addItem("break")}
            >
              + {t("templateDialog.addBreak")}
            </button>
          </div>

          <div className="grid grid-cols-2 items-start gap-2.5">
            <label className="flex flex-col gap-2">
              <span className="text-body-sm text-ink-secondary">
                {t("templateDialog.scaleLabel")}
              </span>
              <input
                type="number"
                min={1}
                className="h-13 w-full rounded-md border border-transparent bg-subtle px-4 text-body text-ink outline-none focus:border-focus focus:bg-surface"
                value={scale}
                onChange={(event) => setScale(event.target.value)}
              />
            </label>

            <label className="flex flex-col gap-2">
              <span className="text-body-sm text-ink-secondary">
                {t("templateDialog.passLabel")}
              </span>
              <input
                type="number"
                min={0}
                max={100}
                className="h-13 w-full rounded-md border border-transparent bg-subtle px-4 text-body text-ink outline-none placeholder:text-ink-tertiary focus:border-focus focus:bg-surface"
                value={passPercent}
                placeholder={t("templateDialog.passPlaceholder")}
                onChange={(event) => setPassPercent(event.target.value)}
              />
            </label>
          </div>
        </div>
      </div>
    </AppDialog>
  );
}
