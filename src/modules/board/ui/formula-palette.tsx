import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { FORMULA_GROUPS, type FormulaTemplate } from "../lib/formula-palette";
import { loadLatexRenderer } from "../lib/mathlive-loader";

export interface FormulaPaletteProps {
  onInsert: (latex: string) => void;
}

type Renderer = Awaited<ReturnType<typeof loadLatexRenderer>>;

export function FormulaPalette({ onInsert }: FormulaPaletteProps) {
  const { t } = useTranslation("board");
  const [groupId, setGroupId] = useState(FORMULA_GROUPS[0].id);
  const [render, setRender] = useState<Renderer | null>(null);
  const group = FORMULA_GROUPS.find((item) => item.id === groupId) ?? FORMULA_GROUPS[0];

  useEffect(() => {
    let active = true;
    loadLatexRenderer()
      .then((renderer) => {
        if (active) setRender(() => renderer);
      })
      .catch((error) => {
        void error;
      });
    return () => {
      active = false;
    };
  }, []);

  function preview(item: FormulaTemplate) {
    if (!render) return <span className="formula-palette-raw">{item.preview}</span>;
    return (
      <span
        className="formula-palette-preview"
        dangerouslySetInnerHTML={{ __html: render(item.preview, { defaultMode: "inline-math" }) }}
      />
    );
  }

  return (
    <div className="formula-palette" onPointerDown={(event) => event.preventDefault()}>
      <div className="formula-palette-tabs" role="tablist" aria-label={t("palette.aria")}>
        {FORMULA_GROUPS.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={item.id === group.id}
            className={item.id === group.id ? "is-active" : ""}
            onClick={() => setGroupId(item.id)}
          >
            {t(`palette.groups.${item.id}`)}
          </button>
        ))}
      </div>
      <div
        className={`formula-palette-grid ${group.id === "symbol" ? "is-compact" : ""}`}
        role="tabpanel"
        aria-label={t(`palette.groups.${group.id}`)}
      >
        {group.items.map((item) => (
          <button
            key={item.insert}
            type="button"
            title={item.preview}
            aria-label={item.preview}
            onClick={() => onInsert(item.insert)}
          >
            {preview(item)}
          </button>
        ))}
      </div>
    </div>
  );
}
