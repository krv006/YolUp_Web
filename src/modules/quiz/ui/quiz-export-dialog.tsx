import { FileSpreadsheet, FileText } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button, Dialog, DialogContent } from "@/shared/ui/legacy";
import type { QuizExportMode, QuizExportType } from "../api/quiz.api";

export interface QuizExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  /** Hozir yuklanayotgan fayl (`mode:type`) — tugma aylanib turadi. */
  pending?: string | null;
  onExport: (type: QuizExportType, mode: QuizExportMode) => void;
}

const OPTIONS: ReadonlyArray<{ mode: QuizExportMode; types: ReadonlyArray<QuizExportType> }> = [
  { mode: "student", types: ["pdf", "docx"] },
  { mode: "teacher", types: ["pdf", "docx", "xlsx"] },
];

/** Testni qog'ozga/faylga chiqarish: o'quvchiga tarqatish nusxasi (javobsiz) va o'qituvchi nusxasi (javoblar bilan). */
export function QuizExportDialog({ open, onOpenChange, title, pending = null, onExport }: QuizExportDialogProps) {
  const { t } = useTranslation("quiz");
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {open ? (
        <DialogContent title={t("exportDialog.title")} description={title}>
          <div className="group-action-form">
            {OPTIONS.map(({ mode, types }) => (
              <div key={mode} className="quiz-export-block">
                <strong>{t(`exportDialog.${mode}`)}</strong>
                <p className="ai-quiz-hint">{t(`exportDialog.${mode}Hint`)}</p>
                <div className="quiz-export-buttons">
                  {types.map((type) => (
                    <Button
                      key={type}
                      size="sm"
                      variant="secondary"
                      loading={pending === `${mode}:${type}`}
                      disabled={Boolean(pending) && pending !== `${mode}:${type}`}
                      onClick={() => onExport(type, mode)}
                    >
                      {type === "xlsx" ? <FileSpreadsheet size={15} /> : <FileText size={15} />}{" "}
                      {t(`exportDialog.type.${type}`)}
                    </Button>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="dialog-actions">
            <Button variant="secondary" onClick={() => onOpenChange(false)}>
              {t("exportDialog.close")}
            </Button>
          </div>
        </DialogContent>
      ) : null}
    </Dialog>
  );
}
