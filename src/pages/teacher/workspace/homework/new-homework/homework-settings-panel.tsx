import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { GoogleFormField } from "@/modules/homework";
import type { GradingScale } from "@/shared/types";
import { Icon } from "@/shared/ui/icon";
import { DatePicker, SelectPicker, TimePicker } from "@/shared/ui/legacy/form-pickers";
import { Switch } from "@/shared/ui/switch";

export const BANK_VALUE = "__bank__";
const GRADINGS: GradingScale[] = ["five", "hundred", "none"];

export interface HomeworkSettings {
  group: string;
  date: string;
  time: string;
  grading: GradingScale;
  aiCheck: boolean;
  announce: boolean;
  googleFormUrl: string;
}

export interface HomeworkSettingsPanelProps {
  value: HomeworkSettings;
  onChange: (patch: Partial<HomeworkSettings>) => void;
  groups: ReadonlyArray<{ id: string; title: string; studentCount: number }>;
  /** Tahrirlashda guruh o'zgarmaydi. */
  groupLocked?: boolean;
  invalid: { group: boolean; date: boolean };
  today: string;
}

function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3 rounded-2xl border border-line bg-surface p-4">
      <h3 className="text-caption font-semibold tracking-wide text-ink-secondary uppercase">{title}</h3>
      {children}
    </section>
  );
}

function ToggleRow({ icon, tone, title, hint, checked, onChange }: {
  icon: string;
  tone: string;
  title: string;
  hint: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <span className="flex items-center gap-3">
      <span className={`grid size-9 shrink-0 place-items-center rounded-md ${tone}`}>
        <Icon name={icon} size={18} />
      </span>
      <span className="flex min-w-0 flex-1 flex-col">
        <strong className="truncate text-title-sm text-ink">{title}</strong>
        <small className="truncate text-body-xs text-ink-tertiary">{hint}</small>
      </span>
      <Switch checked={checked} onCheckedChange={onChange} aria-label={title} />
    </span>
  );
}

/** O'ng tomondagi sozlamalar: kimga, muddat, baholash, AI, chat e'loni, Google Form. */
export function HomeworkSettingsPanel({ value, onChange, groups, groupLocked = false, invalid, today }: HomeworkSettingsPanelProps) {
  const { t } = useTranslation("homework");
  const inBank = value.group === BANK_VALUE;
  const options = [
    { value: BANK_VALUE, label: t("bank.option") },
    ...groups.map((group) => ({ value: group.id, label: `${group.title} · ${t("form.students", { count: group.studentCount })}` })),
  ];

  return (
    <aside className="flex flex-col gap-3 lg:sticky lg:top-2 lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto">
      <Card title={t("newPage.side.whom")}>
        {groupLocked ? null : (
          <div className={invalid.group ? "rounded-md ring-1 ring-danger" : ""}>
            <SelectPicker label={t("form.group")} searchable value={value.group} onChange={(group) => onChange({ group })} options={options} />
          </div>
        )}
        {invalid.group ? <small className="text-body-xs text-danger">{t("newPage.errors.group")}</small> : null}
        {inBank ? (
          <p className="flex items-start gap-2.5 rounded-md bg-brand-subtle px-3 py-2.5 text-body-xs text-brand-strong">
            <Icon name="menu-book" size={16} className="mt-0.5 shrink-0" />
            {t("bank.formHint")}
          </p>
        ) : (
          <>
            <div className="grid grid-cols-2 items-start gap-3">
              <DatePicker label={t("form.due")} value={value.date} onChange={(date) => onChange({ date })} minDate={today} />
              <TimePicker label={t("form.time")} value={value.time} onChange={(time) => onChange({ time })} />
            </div>
            {invalid.date ? <small className="text-body-xs text-danger">{t("newPage.errors.date")}</small> : null}
          </>
        )}
      </Card>

      <Card title={t("newPage.side.grading")}>
        <div className="flex items-center gap-1 rounded-full bg-subtle p-1">
          {GRADINGS.map((item) => (
            <button
              key={item}
              type="button"
              className={`flex h-9 min-w-0 flex-1 items-center justify-center rounded-full text-button transition-colors ${
                value.grading === item ? "bg-brand text-ink-inverse" : "text-ink-secondary hover:text-ink"
              }`}
              onClick={() => onChange({ grading: item })}
            >
              {t(`form.gradings.${item}`)}
            </button>
          ))}
        </div>
        <ToggleRow
          icon="auto-awesome"
          tone="bg-accent-saffron-bg text-accent-saffron-fg"
          title={t("form.aiCheck")}
          hint={t("form.aiCheckHint")}
          checked={value.aiCheck}
          onChange={(aiCheck) => onChange({ aiCheck })}
        />
        {inBank ? null : (
          <ToggleRow
            icon="chat"
            tone="bg-brand-subtle text-brand"
            title={t("form.announce")}
            hint={t("form.announceHint")}
            checked={value.announce}
            onChange={(announce) => onChange({ announce })}
          />
        )}
      </Card>

      <Card title={t("newPage.side.extra")}>
        <GoogleFormField value={value.googleFormUrl} onChange={(googleFormUrl) => onChange({ googleFormUrl })} />
      </Card>
    </aside>
  );
}
