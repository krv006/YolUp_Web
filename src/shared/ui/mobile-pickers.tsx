import { useMemo, useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useTranslation } from "react-i18next";
import { AppDialog } from "@/shared/ui/app-dialog";
import { Icon } from "@/shared/ui/icon";
import { mobileButton } from "@/shared/ui/mobile-page";

const TIME_PRESETS = ["09:00", "14:00", "18:00", "19:30"];

const pad = (value: number) => String(value).padStart(2, "0");

const toDateValue = (date: Date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

function parseDate(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  return match ? new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3])) : null;
}

function parseTime(value: string): [number, number] {
  const match = /^(\d{1,2}):(\d{2})/.exec(value);
  return match ? [Number(match[1]) % 24, Number(match[2]) % 60] : [18, 0];
}

export interface MobileDateSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  value: string;
  min?: string;
  onChange: (value: string) => void;
}

export function MobileDateSheet({ open, onOpenChange, value, min, onChange }: MobileDateSheetProps) {
  const { t } = useTranslation("common");
  const months = t("formPickers.months", { returnObjects: true }) as string[];
  const weekdays = t("formPickers.weekdays", { returnObjects: true }) as string[];
  const [draft, setDraft] = useState(value);
  const [view, setView] = useState(() => parseDate(value) ?? new Date());
  const [shown, setShown] = useState(open);
  const today = toDateValue(new Date());

  if (open !== shown) {
    setShown(open);
    if (open) {
      setDraft(value);
      setView(parseDate(value) ?? new Date());
    }
  }

  const cells = useMemo(() => {
    const first = new Date(view.getFullYear(), view.getMonth(), 1);
    const offset = (first.getDay() + 6) % 7;
    const days = new Date(view.getFullYear(), view.getMonth() + 1, 0).getDate();
    return Array.from({ length: Math.ceil((offset + days) / 7) * 7 }, (_, index) => {
      const day = index - offset + 1;
      return day >= 1 && day <= days ? new Date(view.getFullYear(), view.getMonth(), day) : null;
    });
  }, [view]);

  function shiftMonth(amount: number) {
    setView((current) => new Date(current.getFullYear(), current.getMonth() + amount, 1));
  }

  return (
    <AppDialog
      open={open}
      onOpenChange={onOpenChange}
      titleClassName="text-title-lg font-semibold"
      footerClassName="px-4 pt-5 pb-6"
      title={t("formPickers.chooseDateTitle")}
      footer={
        <>
          <button type="button" className={mobileButton.secondary} onClick={() => setDraft("")}>
            {t("formPickers.clear")}
          </button>
          <button
            type="button"
            className={mobileButton.primary}
            disabled={!draft}
            onClick={() => {
              onChange(draft);
              onOpenChange(false);
            }}
          >
            {t("formPickers.choose")}
          </button>
        </>
      }
    >
      <div className="-mx-1 -mt-0.5 flex flex-col">
        <div className="grid h-10 grid-cols-7 items-center">
          <button
            type="button"
            className="mx-auto grid size-10 place-items-center rounded-full text-ink"
            aria-label={t("formPickers.prevMonth")}
            onClick={() => shiftMonth(-1)}
          >
            <Icon name="chevron-left" size={20} />
          </button>
          <strong className="col-span-5 text-center text-title text-ink">
            {months[view.getMonth()]} {view.getFullYear()}
          </strong>
          <button
            type="button"
            className="mx-auto grid size-10 place-items-center rounded-full text-ink"
            aria-label={t("formPickers.nextMonth")}
            onClick={() => shiftMonth(1)}
          >
            <Icon name="chevron-right" size={20} />
          </button>
        </div>

        <div className="mt-3 grid grid-cols-7 text-center text-caption leading-[18px] text-ink-secondary" aria-hidden="true">
          {weekdays.map((day) => (
            <span key={day}>{day}</span>
          ))}
        </div>

        <div className="grid grid-cols-7">
          {cells.map((date, index) => {
            if (!date) return <span key={`empty-${index}`} className="h-[46px]" aria-hidden="true" />;
            const dateValue = toDateValue(date);
            const selected = dateValue === draft;
            const blocked = Boolean(min && dateValue < min);
            const weekend = date.getDay() === 0 || date.getDay() === 6;
            const tone = selected
              ? "bg-brand font-semibold text-on-action"
              : dateValue <= today
                ? `text-brand-strong ${dateValue === today ? "font-bold" : ""}`
                : weekend
                  ? "text-error-text"
                  : "text-ink";
            return (
              <button
                key={dateValue}
                type="button"
                className="grid h-[46px] place-items-center disabled:cursor-not-allowed disabled:opacity-100"
                disabled={blocked}
                aria-pressed={selected}
                aria-label={`${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`}
                onClick={() => setDraft(dateValue)}
              >
                <span className={`grid size-[38px] place-items-center rounded-full text-body-sm font-medium ${tone}`}>
                  {date.getDate()}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </AppDialog>
  );
}

export interface MobileTimeSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  value: string;
  onChange: (value: string) => void;
  duration?: {
    value: number;
    options: readonly number[];
    onChange: (value: number) => void;
  };
}

export function MobileTimeSheet({ open, onOpenChange, value, onChange, duration }: MobileTimeSheetProps) {
  const { t } = useTranslation("common");
  const [draft, setDraft] = useState(() => parseTime(value));
  const [length, setLength] = useState(duration?.value ?? 0);
  const [active, setActive] = useState<"hour" | "minute">("hour");
  const [shown, setShown] = useState(open);
  const [hour, minute] = draft;

  if (open !== shown) {
    setShown(open);
    if (open) {
      setDraft(parseTime(value));
      setLength(duration?.value ?? 0);
      setActive("hour");
    }
  }
  const time = `${pad(hour)}:${pad(minute)}`;

  function shift(part: "hour" | "minute", amount: number) {
    setActive(part);
    setDraft(([h, m]) => {
      if (part === "hour") return [(h + amount + 24) % 24, m];
      const total = (h * 60 + m + amount + 24 * 60) % (24 * 60);
      return [Math.floor(total / 60), total % 60];
    });
  }

  const column = (part: "hour" | "minute", label: string) => (
    <div className="flex flex-col items-center">
      <button
        type="button"
        className="grid h-7 w-24 place-items-center text-ink"
        aria-label={t(part === "hour" ? "formPickers.increaseHourAria" : "formPickers.increaseMinuteAria")}
        onClick={() => shift(part, part === "hour" ? 1 : 5)}
      >
        <ChevronUp size={24} strokeWidth={1.75} />
      </button>
      <button
        type="button"
        className={`mt-4 grid h-[74px] w-24 place-items-center rounded-lg border-[1.5px] font-heading text-[40px] font-bold text-ink ${
          active === part ? "border-brand bg-brand-subtle" : "border-transparent bg-subtle"
        }`}
        aria-label={label}
        onClick={() => setActive(part)}
      >
        {pad(part === "hour" ? hour : minute)}
      </button>
      <button
        type="button"
        className="mt-3.5 grid h-7 w-24 place-items-center text-ink"
        aria-label={t(part === "hour" ? "formPickers.decreaseHourAria" : "formPickers.decreaseMinuteAria")}
        onClick={() => shift(part, part === "hour" ? -1 : -5)}
      >
        <ChevronDown size={24} strokeWidth={1.75} />
      </button>
    </div>
  );

  const chip = (selected: boolean, height: string) =>
    `flex ${height} items-center rounded-full px-[9px] text-caption transition-colors ${
      selected ? "bg-brand text-on-action" : "bg-subtle text-ink"
    }`;

  return (
    <AppDialog
      open={open}
      onOpenChange={onOpenChange}
      titleClassName="text-title-lg font-semibold"
      footerClassName="px-4 pt-5 pb-6"
      title={t("formPickers.chooseTimeTitle")}
      footer={
        <>
          <button type="button" className={mobileButton.secondary} onClick={() => onOpenChange(false)}>
            {t("formPickers.cancel")}
          </button>
          <button
            type="button"
            className={mobileButton.primary}
            onClick={() => {
              onChange(time);
              if (duration && length) duration.onChange(length);
              onOpenChange(false);
            }}
          >
            {t("formPickers.choose")}
          </button>
        </>
      }
    >
      <div className="mt-1 flex flex-col">
        <div className="flex items-center justify-center gap-3.5" aria-label={t("formPickers.adjustTimeAria")}>
          {column("hour", t("formPickers.hourLabel"))}
          <span className="font-heading text-[40px] font-bold text-ink" aria-hidden="true">
            :
          </span>
          {column("minute", t("formPickers.minuteLabel"))}
        </div>

        <span className="mt-[23px] text-caption-strong text-ink-secondary uppercase">{t("formPickers.presetSection")}</span>
        <div className="mt-3.5 flex flex-wrap gap-2" aria-label={t("formPickers.presetTimesAria")}>
          {TIME_PRESETS.map((preset) => (
            <button
              key={preset}
              type="button"
              className={chip(time === preset, "h-[27px]")}
              onClick={() => setDraft(parseTime(preset))}
            >
              {preset}
            </button>
          ))}
        </div>

        {duration ? (
          <>
            <span className="mt-3.5 text-caption-strong text-ink-secondary uppercase">{t("formPickers.durationSection")}</span>
            <div className="mt-3.5 flex flex-wrap gap-2" aria-label={t("formPickers.presetDurationsAria")}>
              {duration.options.map((option) => (
                <button
                  key={option}
                  type="button"
                  className={chip(length === option, "h-[22px]")}
                  onClick={() => setLength(option)}
                >
                  {option} {t("formPickers.minuteShort")}
                </button>
              ))}
            </div>
          </>
        ) : null}
      </div>
    </AppDialog>
  );
}
