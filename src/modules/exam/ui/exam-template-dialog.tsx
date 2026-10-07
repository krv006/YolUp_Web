import { useRef, useState } from "react";
import { ArrowDown, ArrowUp, Coffee, Plus, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button, Dialog, DialogContent } from "@/shared/ui/legacy";
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
  const [description, setDescription] = useState("");
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

  return (
    <Dialog open={open} onOpenChange={(next) => (next ? onOpenChange(true) : close())}>
      {open ? (
        <DialogContent
          className="group-action-dialog exam-template-dialog"
          title={t("templateDialog.title")}
          description={t("templateDialog.description")}
        >
          <div className="group-action-form">
            <label className="field-group">
              <span>{t("templateDialog.nameLabel")}</span>
              <div className="input-shell">
                <input
                  autoFocus
                  value={name}
                  onChange={(event) => {
                    setName(event.target.value);
                    setError(null);
                  }}
                  placeholder={t("templateDialog.namePlaceholder")}
                />
              </div>
            </label>

            <div className="exam-template-items">
              {items.map((item, index) => (
                <div key={item.id} className={`exam-template-item is-${item.kind}`}>
                  <span className="exam-template-item-kind">
                    {item.kind === "break" ? <Coffee size={14} /> : index + 1}
                  </span>
                  <input
                    value={item.title}
                    onChange={(event) => updateItem(item.id, { title: event.target.value })}
                    placeholder={
                      item.kind === "break"
                        ? t("templateDialog.breakPlaceholder")
                        : t("templateDialog.sectionPlaceholder")
                    }
                  />
                  <label className="exam-template-minutes">
                    <input
                      type="number"
                      min={1}
                      value={item.minutes}
                      onChange={(event) => updateItem(item.id, { minutes: event.target.value })}
                      aria-label={t("templateDialog.minutesLabel")}
                    />
                    <span>{t("templateDialog.minutesShort")}</span>
                  </label>
                  {item.kind === "section" ? (
                    <label className="exam-template-minutes">
                      <input
                        type="number"
                        min={1}
                        max={10}
                        value={item.weight}
                        onChange={(event) => updateItem(item.id, { weight: event.target.value })}
                        aria-label={t("templateDialog.weightLabel")}
                      />
                      <span>{t("templateDialog.weightShort")}</span>
                    </label>
                  ) : null}
                  <button
                    type="button"
                    disabled={index === 0}
                    aria-label={t("templateDialog.moveUp")}
                    onClick={() => moveItem(index, index - 1)}
                  >
                    <ArrowUp size={14} />
                  </button>
                  <button
                    type="button"
                    disabled={index === items.length - 1}
                    aria-label={t("templateDialog.moveDown")}
                    onClick={() => moveItem(index, index + 1)}
                  >
                    <ArrowDown size={14} />
                  </button>
                  {items.length > 1 ? (
                    <button
                      type="button"
                      aria-label={t("templateDialog.removeItem")}
                      onClick={() => setItems((current) => current.filter((entry) => entry.id !== item.id))}
                    >
                      <X size={14} />
                    </button>
                  ) : null}
                </div>
              ))}

              <div className="exam-template-add">
                <button type="button" onClick={() => addItem("section")}>
                  <Plus size={14} /> {t("templateDialog.addSection")}
                </button>
                <button type="button" onClick={() => addItem("break")}>
                  <Coffee size={14} /> {t("templateDialog.addBreak")}
                </button>
                <small>{t("templateDialog.totalMinutes", { count: templateTotalMinutes(items) })}</small>
              </div>
            </div>

            <div className="form-grid-two">
              <label className="field-group">
                <span>{t("templateDialog.scaleLabel")}</span>
                <div className="input-shell">
                  <input
                    type="number"
                    min={1}
                    value={scale}
                    onChange={(event) => setScale(event.target.value)}
                  />
                </div>
              </label>
              <label className="field-group">
                <span>{t("templateDialog.passLabel")}</span>
                <div className="input-shell">
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={passPercent}
                    onChange={(event) => setPassPercent(event.target.value)}
                    placeholder={t("templateDialog.passPlaceholder")}
                  />
                </div>
              </label>
            </div>

            <label className="field-group">
              <span>{t("templateDialog.descriptionLabel")}</span>
              <textarea
                rows={2}
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder={t("templateDialog.descriptionPlaceholder")}
              />
            </label>

            {error ? <div className="form-alert">{error}</div> : null}

            <div className="dialog-actions">
              <Button type="button" variant="secondary" onClick={close}>
                {t("templateDialog.cancel")}
              </Button>
              <Button type="button" loading={pending} onClick={submit}>
                {t("templateDialog.submit")}
              </Button>
            </div>
          </div>
        </DialogContent>
      ) : null}
    </Dialog>
  );
}
