import { useEffect, useRef, useState } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { useTranslation } from "react-i18next";
import { FORMULA_GALLERY, FORMULA_TEMPLATES } from "../lib/symbols";

type MathfieldElement = HTMLElement & {
  value: string;
  insert: (latex: string, options?: { focus?: boolean; format?: string }) => boolean;
  mathVirtualKeyboardPolicy: string;
};

function loadMathlive() {
  return Promise.all([import("mathlive"), import("mathlive/static.css"), import("mathlive/fonts.css")]).then(([module]) => module);
}

function loadKatex() {
  return Promise.all([import("katex"), import("katex/dist/katex.min.css")]).then(([module]) => module.default);
}

export interface FormulaDialogProps {
  open: boolean;
  /** Mavjud formulani tahrirlashda uning LaTeX'i, yangisida `null`. */
  latex: string | null;
  onOpenChange: (open: boolean) => void;
  onSubmit: (latex: string) => void;
  onDelete?: () => void;
}

const PLACEHOLDER = /\\placeholder(\[[^\]]*\])?\{[^}]*\}/g;

/**
 * Formula oynasi: MathLive (WYSIWYG maydon) + tayyor formulalar galereyasi + ekran klaviaturasi.
 * Formula LaTeX ko'rinishida saqlanadi (`$$...$$` bilan yozilgani bilan bir xil).
 */
function FormulaContent({ latex, onOpenChange, onSubmit, onDelete }: Omit<FormulaDialogProps, "open">) {
  const { t } = useTranslation("editor");
  const mount = useRef<HTMLDivElement>(null);
  const field = useRef<MathfieldElement | null>(null);
  const [failed, setFailed] = useState(false);
  const [ready, setReady] = useState(false);
  const [raw, setRaw] = useState(latex ?? "");
  const [previews, setPreviews] = useState<Array<{ key: string; latex: string; html: string }>>([]);
  const editing = latex !== null;

  useEffect(() => {
    let cancelled = false;
    const timer = window.setTimeout(() => {
      void loadMathlive()
        .then((module) => {
          if (cancelled || !mount.current) return;
          const element = new module.MathfieldElement() as unknown as MathfieldElement;
          element.setAttribute("aria-label", t("formula.title"));
          element.mathVirtualKeyboardPolicy = "manual";
          mount.current.replaceChildren(element);
          field.current = element;
          setReady(true);
          window.setTimeout(() => {
            try {
              if (latex) element.value = latex;
              element.focus();
            } catch {
              /* maydon hali tayyor emas */
            }
          }, 120);
        })
        .catch(() => !cancelled && setFailed(true));
    }, 0);
    void loadKatex().then((katex) => {
      if (cancelled) return;
      setPreviews(
        FORMULA_GALLERY.map((item) => ({
          ...item,
          html: katex.renderToString(item.latex, { throwOnError: false }),
        }))
      );
    });
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      field.current = null;
      window.mathVirtualKeyboard?.hide();
    };
  }, [latex, t]);

  function insertTemplate(value: string) {
    const element = field.current;
    if (!element) return;
    element.insert(value, { focus: true, format: "latex" });
    element.focus();
  }

  function submit() {
    const value = (failed ? raw : (field.current?.value ?? raw)).replace(PLACEHOLDER, "").trim();
    if (value) onSubmit(value);
    else onOpenChange(false);
  }

  return (
    <>
        <DialogPrimitive.Overlay className="fixed inset-0 z-70 bg-black/40" />
        <DialogPrimitive.Content
          aria-describedby={undefined}
          onKeyDown={(event) => {
            if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) submit();
          }}
          className="fixed top-1/2 left-1/2 z-70 max-h-[92vh] w-[min(660px,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl bg-surface p-5 shadow-xl outline-none"
        >
          <DialogPrimitive.Title className="text-title-lg font-semibold">
            {editing ? t("formula.editTitle") : t("formula.title")}
          </DialogPrimitive.Title>
          <p className="mt-1 mb-3 text-body-sm text-ink-secondary">{t("formula.hint")}</p>

          {failed ? (
            <input
              className="h-12 w-full rounded-md border border-line bg-subtle px-3"
              value={raw}
              placeholder="x^2+1"
              onChange={(event) => setRaw(event.target.value)}
            />
          ) : (
            <>
              {ready ? null : <p className="text-body-sm text-ink-tertiary">{t("formula.loading")}</p>}
              <div ref={mount} className="[&>math-field]:block [&>math-field]:w-full [&>math-field]:rounded-xl [&>math-field]:border [&>math-field]:border-line-strong [&>math-field]:bg-surface [&>math-field]:p-2.5 [&>math-field]:text-2xl" />
            </>
          )}
          {failed ? <p className="mt-1 text-body-xs text-ink-tertiary">{t("formula.loadFailed")}</p> : null}

          {failed ? null : (
            <div className="my-3 flex flex-wrap gap-1.5">
              {FORMULA_TEMPLATES.map((template) => (
                <button
                  key={template.key}
                  type="button"
                  className="rounded-full border border-line px-3 py-1 text-body-xs hover:border-brand hover:text-brand"
                  onClick={() => insertTemplate(template.latex)}
                >
                  {t(`formula.templates.${template.key}`)}
                </button>
              ))}
              <button
                type="button"
                className="rounded-full border border-line px-3 py-1 text-body-xs hover:border-brand hover:text-brand"
                onClick={() => {
                  const keyboard = window.mathVirtualKeyboard;
                  if (!keyboard) return;
                  if (keyboard.visible) keyboard.hide();
                  else keyboard.show();
                }}
              >
                ⌨ {t("formula.keyboard")}
              </button>
            </div>
          )}

          {failed ? null : (
            <>
              <p className="mt-2 mb-1.5 text-body-xs font-semibold text-ink-secondary">{t("formula.gallery")}</p>
              <div className="grid grid-cols-3 gap-2">
                {previews.map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    className="flex min-h-19 flex-col items-center justify-center gap-1 rounded-lg border border-line p-2 text-lg hover:border-brand hover:bg-brand-subtle"
                    onClick={() => insertTemplate(item.latex)}
                  >
                    <span dangerouslySetInnerHTML={{ __html: item.html }} />
                    <small className="font-sans text-caption text-ink-tertiary">{t(`formula.items.${item.key}`)}</small>
                  </button>
                ))}
              </div>
            </>
          )}

          <div className="mt-4 flex items-center gap-2">
            {editing && onDelete ? (
              <button type="button" className="mr-auto h-10 rounded-full px-4 text-button text-danger-fg hover:bg-danger-bg" onClick={onDelete}>
                {t("formula.delete")}
              </button>
            ) : (
              <span className="mr-auto" />
            )}
            <button type="button" className="h-10 rounded-full border border-line px-5 text-button hover:bg-subtle" onClick={() => onOpenChange(false)}>
              {t("formula.cancel")}
            </button>
            <button type="button" className="h-10 rounded-full bg-brand px-5 text-button text-ink-inverse hover:bg-brand-strong" onClick={submit}>
              {editing ? t("formula.update") : t("formula.add")}
            </button>
          </div>
        </DialogPrimitive.Content>
    </>
  );
}

export function FormulaDialog({ open, latex, onOpenChange, onSubmit, onDelete }: FormulaDialogProps) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        {open ? <FormulaContent latex={latex} onOpenChange={onOpenChange} onSubmit={onSubmit} onDelete={onDelete} /> : null}
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
