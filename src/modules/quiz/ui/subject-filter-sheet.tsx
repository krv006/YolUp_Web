import { useState } from "react";
import { Check, GraduationCap, Search } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Drawer, DrawerContent, DrawerTitle } from "@/shared/ui/drawer";

export interface SubjectFilterSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  value: string;
  options: Array<{ value: string; label: string }>;
  onChange: (value: string) => void;
}

export function SubjectFilterSheet({
  open,
  onOpenChange,
  value,
  options,
  onChange,
}: SubjectFilterSheetProps) {
  const { t } = useTranslation("quiz");
  const [query, setQuery] = useState("");
  const term = query.trim().toLowerCase();
  const visible = term
    ? options.filter((option) => option.label.toLowerCase().includes(term))
    : options;

  return (
    <Drawer
      open={open}
      onOpenChange={(next) => {
        if (!next) setQuery("");
        onOpenChange(next);
      }}
    >
      <DrawerContent className="max-h-[80dvh] px-4 pb-6">
        <DrawerTitle className="px-1 pt-2 pb-3 font-heading text-h3 text-ink">
          {t("teacherPage.subjectFilterLabel")}
        </DrawerTitle>

        <label className="mb-3 flex h-12 items-center gap-3 rounded-2xl bg-subtle px-4">
          <Search size={18} className="shrink-0 text-ink-tertiary" />
          <input
            className="h-full min-w-0 flex-1 bg-transparent text-body text-ink outline-none placeholder:text-ink-tertiary"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t("teacherPage.subjectSearch")}
            aria-label={t("teacherPage.subjectSearch")}
          />
        </label>

        <div className="-mr-1 flex min-h-0 flex-col gap-0.5 overflow-y-auto pr-1">
          {visible.map((option) => {
            const active = option.value === value;
            return (
              <button
                key={option.value || "all"}
                type="button"
                className={`flex h-12 items-center gap-3 rounded-xl px-3 text-left text-body transition-colors ${
                  active ? "bg-action-subtle text-action" : "text-ink hover:bg-subtle"
                }`}
                onClick={() => {
                  onChange(option.value);
                  onOpenChange(false);
                }}
              >
                <GraduationCap size={19} className="shrink-0" />
                <span className="min-w-0 flex-1 truncate">{option.label}</span>
                {active ? (
                  <span className="grid size-6 shrink-0 place-items-center rounded-[7px] bg-action text-on-action">
                    <Check size={15} />
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
