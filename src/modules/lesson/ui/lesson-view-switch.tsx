import { CalendarDays, ListChecks } from "lucide-react";
import { useTranslation } from "react-i18next";
import { ViewSelect } from "@/shared/ui/view-select";
import type { LessonView } from "../model/lesson-view.store";

export interface LessonViewSwitchProps {
  view: LessonView;
  onChange: (view: LessonView) => void;
}

export function LessonViewSwitch({ view, onChange }: LessonViewSwitchProps) {
  const { t } = useTranslation("lesson");

  return (
    <ViewSelect<LessonView>
      className="w-[168px]"
      label={t("viewSwitch.aria")}
      value={view}
      onChange={onChange}
      options={[
        { value: "list", label: t("viewSwitch.list"), icon: ListChecks },
        { value: "calendar", label: t("viewSwitch.calendar"), icon: CalendarDays },
      ]}
    />
  );
}
