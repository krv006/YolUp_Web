import { useTranslation } from "react-i18next";
import { Dropdown, DropdownContent, DropdownItem, DropdownTrigger } from "@/shared/ui/legacy";
import { GroupTile } from "@/shared/ui/group-tile";
import { Icon } from "@/shared/ui/icon";

export type TaskTone = "teal" | "brand" | "success" | "violet" | "danger";

const PILL: Record<TaskTone, string> = {
  teal: "bg-accent-teal-bg text-accent-teal-fg",
  brand: "bg-brand-subtle text-brand",
  success: "bg-success-bg text-success-fg",
  violet: "bg-accent-violet-bg text-accent-violet-fg",
  danger: "bg-danger-bg text-error-text",
};

const BAR: Record<TaskTone, string> = {
  teal: "bg-brand",
  brand: "bg-brand",
  success: "bg-success",
  violet: "bg-brand",
  danger: "bg-danger",
};

export interface TaskRow {
  id: string;
  assignmentId?: string;
  quizId?: string;
  title: string;
  meta: string;
  pill: { tone: TaskTone; icon: string; label: string };
  aside: string;
  progress: number | null;
  onOpen: () => void;
  menu: Array<{ id: string; label: string; danger?: boolean; run: () => void }>;
}

export interface TaskCardsProps {
  rows: TaskRow[];
  courseTitle: string;
  courseImage?: string | null;
  courseTone?: string;
  highlightId?: string | null;
  className?: string;
}

export function TaskCards({
  rows,
  courseTitle,
  courseImage,
  courseTone,
  highlightId = null,
  className = "flex flex-col gap-3",
}: TaskCardsProps) {
  const { t } = useTranslation("group");

  return (
    <div className={className}>
      {rows.map((row) => (
        <article
          key={row.id}
          data-assignment-id={row.assignmentId}
          data-quiz-id={row.quizId}
          role="button"
          tabIndex={0}
          className={`flex flex-col gap-3 rounded-xl bg-surface p-4 ${
            row.assignmentId && row.assignmentId === highlightId ? "ring-2 ring-brand" : ""
          }`}
          onClick={row.onOpen}
          onKeyDown={(event) => {
            if (event.key === "Enter") row.onOpen();
          }}
        >
          <div className="flex items-center gap-3">
            <GroupTile
              name={courseTitle}
              tone={courseTone}
              src={courseImage}
              className="size-11 rounded-xl bg-subtle"
            />
            <span className="flex min-w-0 flex-1 flex-col">
              <strong className="truncate text-title text-ink">{row.title}</strong>
              <small className="truncate text-body-sm text-ink-secondary">{row.meta}</small>
            </span>
            <Dropdown>
              <DropdownTrigger asChild>
                <button
                  type="button"
                  className="-mr-2 grid size-9 shrink-0 place-items-center rounded-full text-ink-secondary transition-colors hover:bg-subtle"
                  aria-label={t("mobileAssignments.menu")}
                  onClick={(event) => event.stopPropagation()}
                >
                  <Icon name="more" size={20} />
                </button>
              </DropdownTrigger>
              <DropdownContent>
                {row.menu.map((item) => (
                  <DropdownItem
                    key={item.id}
                    destructive={item.danger}
                    onClick={(event) => event.stopPropagation()}
                    onSelect={item.run}
                  >
                    {item.label}
                  </DropdownItem>
                ))}
              </DropdownContent>
            </Dropdown>
          </div>

          <div className="flex items-center gap-3">
            <span
              className={`flex h-6 shrink-0 items-center gap-1.5 rounded-full pr-2.5 pl-2 text-caption-strong ${PILL[row.pill.tone]}`}
            >
              <Icon name={row.pill.icon} size={14} />
              {row.pill.label}
            </span>
            {row.aside ? (
              <small className="ml-auto shrink-0 text-body-xs text-ink-secondary">{row.aside}</small>
            ) : null}
          </div>

          {row.progress === null ? null : (
            <span className="h-1.5 overflow-hidden rounded-full bg-subtle">
              <span
                className={`block h-full rounded-full ${BAR[row.pill.tone]}`}
                style={{ width: `${row.progress}%` }}
              />
            </span>
          )}
        </article>
      ))}
    </div>
  );
}
