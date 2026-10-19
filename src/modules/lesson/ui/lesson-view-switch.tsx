import { Icon } from "@/shared/ui/icon";
import { useTranslation } from "react-i18next";
import type { LessonView } from "../model/lesson-view.store";

const OPTIONS: Array<{ id: LessonView; labelKey: string; icon: string }> = [
  { id: "list", labelKey: "viewSwitch.list", icon: "done-all" },
  { id: "calendar", labelKey: "viewSwitch.calendar", icon: "nav-calendar" },
];

export interface LessonViewSwitchProps {
  view: LessonView;
  onChange: (view: LessonView) => void;
}

export function LessonViewSwitch({ view, onChange }: LessonViewSwitchProps) {
  const { t } = useTranslation("lesson");
  return (
    <div className="flex items-center gap-1 rounded-full bg-subtle p-1" role="radiogroup" aria-label={t("viewSwitch.aria")}>
      {OPTIONS.map(({ id, labelKey, icon }) => {
        const active = view === id;
        return (
          <button
            key={id}
            type="button"
            role="radio"
            aria-checked={active}
            className={`flex h-10 items-center gap-2 rounded-full px-4 text-label-strong transition-colors ${
              active ? "bg-action text-on-action" : "text-ink-secondary hover:text-ink"
            }`}
            onClick={() => onChange(id)}
          >
            <Icon name={icon} size={17} />
            <span>{t(labelKey)}</span>
          </button>
        );
      })}
    </div>
  );
}
