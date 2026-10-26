import { Check, Type } from "lucide-react";
import { useRef, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { AppDialog, dialogButton } from "@/shared/ui/app-dialog";
import type { FormulaSolutionDto } from "../api/board.dto";
import { FormulaPalette } from "./formula-palette";

export interface FormulaSolverDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  formula: string;
  onFormulaChange: (formula: string) => void;
  solution: FormulaSolutionDto | null;
  solving: boolean;
  placing: boolean;
  canPlace: boolean;
  onSolve: (event: FormEvent<HTMLFormElement>) => void;
  onPlace: () => void;
  onPlaceResultOnly: () => void;
}

export function FormulaSolverDialog({
  open,
  onOpenChange,
  formula,
  onFormulaChange,
  solution,
  solving,
  placing,
  canPlace,
  onSolve,
  onPlace,
  onPlaceResultOnly,
}: FormulaSolverDialogProps) {
  const { t } = useTranslation("board");
  const inputRef = useRef<HTMLInputElement>(null);
  const steps = solution?.steps ?? [];

  return (
    <AppDialog
      open={open}
      onOpenChange={onOpenChange}
      width="lg:w-[600px]"
      title={t("formulaDialog.title")}
      description={t("formulaDialog.description")}
      footer={
        solution ? (
          <>
            <button
              type="button"
              className={dialogButton.secondary}
              disabled={placing || !canPlace}
              onClick={onPlaceResultOnly}
            >
              {t("formulaDialog.resultOnly")}
            </button>
            <button
              type="button"
              className={dialogButton.primary}
              disabled={placing || !canPlace}
              onClick={onPlace}
            >
              {t("formulaDialog.place")}
            </button>
          </>
        ) : (
          <button
            type="submit"
            form="formula-solver-form"
            className={dialogButton.primary}
            disabled={solving || !formula.trim()}
          >
            {t("formulaDialog.solve")}
          </button>
        )
      }
    >
      <form id="formula-solver-form" className="flex flex-col gap-3" onSubmit={onSolve}>
        <label className="flex flex-col gap-1.5">
          <span className="text-body-xs text-ink-secondary">
            {t("formulaDialog.formulaLabel")}
          </span>
          <span className="flex h-13 items-center gap-2 rounded-md border border-transparent bg-subtle px-4 focus-within:border-focus focus-within:bg-surface">
            <input
              ref={inputRef}
              autoFocus
              className="h-full min-w-0 flex-1 bg-transparent font-numeric text-body text-ink outline-none placeholder:text-ink-tertiary"
              value={formula}
              placeholder={t("formulaDialog.placeholder")}
              onChange={(event) => onFormulaChange(event.target.value)}
              required
            />
            <span
              className="grid size-8 shrink-0 place-items-center rounded-lg text-ink-tertiary"
              aria-hidden="true"
            >
              <Type size={16} />
            </span>
          </span>
        </label>

        <FormulaPalette
          onInsert={(latex) => {
            onFormulaChange(`${formula}${latex}`);
            inputRef.current?.focus();
          }}
        />
      </form>

      {solution ? (
        <div className="flex flex-col gap-2.5 rounded-md bg-subtle p-4">
          <span className="text-overline text-ink-tertiary uppercase">
            {t("formulaDialog.solutionSteps", { count: steps.length })}
          </span>

          {steps.length ? (
            <ol className="flex flex-col gap-2">
              {steps.map((step, index) => (
                <li key={step} className="flex items-start gap-3">
                  <span className="w-4 shrink-0 font-numeric text-caption-strong text-brand">
                    {index + 1}
                  </span>
                  <span className="min-w-0 flex-1 font-numeric text-body-sm text-ink">{step}</span>
                </li>
              ))}
            </ol>
          ) : (
            <p className="font-numeric text-body-sm text-ink">{solution.pretty}</p>
          )}

          <p className="flex items-center gap-2 rounded-lg bg-success-bg px-3 py-2.5 font-numeric text-body-sm text-ink">
            <Check size={16} className="shrink-0 text-success-text" />
            {t("formulaDialog.answer", { value: solution.result })}
          </p>
        </div>
      ) : null}
    </AppDialog>
  );
}
