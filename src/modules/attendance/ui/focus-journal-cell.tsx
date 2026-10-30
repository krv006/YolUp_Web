import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ArrowLeftRight, Eye, LogIn, LogOut, ShieldAlert, Timer } from "lucide-react";
import { formatDateTime, formatDuration } from "@/shared/lib";
import type { FocusJournal } from "@/shared/types";
import { Dialog, DialogContent } from "@/shared/ui/legacy";

export interface FocusJournalCellProps {
  focus: FocusJournal;
  student: string;
  lesson: string;
}

export function FocusJournalCell({ focus, student, lesson }: FocusJournalCellProps) {
  const { t } = useTranslation("parent");
  const [open, setOpen] = useState(false);

  if (!focus.exits) return <span className="focus-cell focus-cell--clean">{t("focusJournal.noExits")}</span>;

  return (
    <>
      <button
        className={`focus-cell ${focus.alert ? "is-alert" : ""}`}
        type="button"
        title={focus.alert ? t("focusJournal.alertTitle") : undefined}
        onClick={() => setOpen(true)}
      >
        {focus.alert ? <ShieldAlert size={13} aria-hidden="true" /> : null}
        <strong>{t("focusJournal.exits", { count: focus.exits })}</strong>
        {focus.awaySeconds ? <small>{formatDuration(focus.awaySeconds)}</small> : null}
        <Eye size={14} aria-hidden="true" />
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        {open ? (
          <DialogContent title={t("focusJournal.title")} description={`${student} · ${lesson}`}>
            <div className="focus-journal">
              {focus.alert ? (
                <p className="focus-alert">
                  <ShieldAlert size={15} />
                  {t("focusJournal.alert")}
                </p>
              ) : null}
              <div className="focus-stats">
                <span>
                  <ArrowLeftRight size={15} />
                  <strong>{focus.exits}</strong>
                  <small>{t("focusJournal.exitsLabel")}</small>
                </span>
                <span>
                  <Timer size={15} />
                  <strong>{formatDuration(focus.awaySeconds)}</strong>
                  <small>{t("focusJournal.awayLabel")}</small>
                </span>
                <span>
                  <Timer size={15} />
                  <strong>{formatDuration(focus.longestSeconds)}</strong>
                  <small>{t("focusJournal.longestLabel")}</small>
                </span>
              </div>

              {focus.timeline.length ? (
                <ol className="focus-timeline">
                  {focus.timeline.map((exit, index) => (
                    <li key={`${exit.leftAt}-${index}`}>
                      <span className="focus-timeline-index">{index + 1}</span>
                      <div className="focus-timeline-body">
                        <p>
                          <LogOut size={13} /> {formatDateTime(exit.leftAt)}
                        </p>
                        <p>
                          <LogIn size={13} />{" "}
                          {exit.returnedAt ? formatDateTime(exit.returnedAt) : t("focusJournal.notReturned")}
                        </p>
                      </div>
                      <strong className="focus-timeline-duration">
                        {exit.seconds === null ? "—" : formatDuration(exit.seconds)}
                      </strong>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="portal-muted">
                  {t("focusJournal.noTimeline")}
                </p>
              )}
            </div>
          </DialogContent>
        ) : null}
      </Dialog>
    </>
  );
}
