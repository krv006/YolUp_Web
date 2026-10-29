import { useState } from "react";
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
  const [open, setOpen] = useState(false);

  if (!focus.exits) return <span className="focus-cell focus-cell--clean">Chiqmagan</span>;

  return (
    <>
      <button
        className={`focus-cell ${focus.alert ? "is-alert" : ""}`}
        type="button"
        title={focus.alert ? "Chegaradan oshgan — ota-onaga xabar berilgan" : undefined}
        onClick={() => setOpen(true)}
      >
        {focus.alert ? <ShieldAlert size={13} aria-hidden="true" /> : null}
        <strong>{focus.exits} chiqish</strong>
        {focus.awaySeconds ? <small>{formatDuration(focus.awaySeconds)}</small> : null}
        <Eye size={14} aria-hidden="true" />
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        {open ? (
          <DialogContent title="Fokus jurnali" description={`${student} · ${lesson}`}>
            <div className="focus-journal">
              {focus.alert ? (
                <p className="focus-alert">
                  <ShieldAlert size={15} />
                  Chiqishlar soni chegaradan oshgan — ota-onaga xabar yuborilgan.
                </p>
              ) : null}
              <div className="focus-stats">
                <span>
                  <ArrowLeftRight size={15} />
                  <strong>{focus.exits}</strong>
                  <small>chiqish</small>
                </span>
                <span>
                  <Timer size={15} />
                  <strong>{formatDuration(focus.awaySeconds)}</strong>
                  <small>jami yo‘q</small>
                </span>
                <span>
                  <Timer size={15} />
                  <strong>{formatDuration(focus.longestSeconds)}</strong>
                  <small>eng uzun</small>
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
                          {exit.returnedAt ? formatDateTime(exit.returnedAt) : "Qaytmagan"}
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
                  Chiqishlar soni qayd etilgan, lekin batafsil vaqt jurnali mavjud emas.
                </p>
              )}
            </div>
          </DialogContent>
        ) : null}
      </Dialog>
    </>
  );
}
