import {
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ComponentType,
  type ReactNode,
  type RefObject,
  type TouchEvent as ReactTouchEvent,
  type WheelEvent as ReactWheelEvent,
} from "react";
import { createPortal } from "react-dom";
import { FocusScope } from "@radix-ui/react-focus-scope";
import { AnimatePresence, motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import {
  CalendarDays,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Hourglass,
  Clock3,
  Search,
} from "lucide-react";

type IconComponent = ComponentType<{ size?: number | string; className?: string }>;
type AnchorRef = RefObject<HTMLElement | null>;

const TIME_PRESETS = ["09:00", "14:00", "18:30", "20:00"];

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

function toDateValue(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function parseDateValue(value: string | null | undefined): Date | null {
  const datePart = value?.split("T")[0];
  if (!datePart) return null;
  const [year, month, day] = datePart.split("-").map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
}

function formatDateValue(value: string | null | undefined, months: string[]): string {
  const date = parseDateValue(value);
  if (!date) return "";
  return `${date.getDate()} ${months[date.getMonth()].toLowerCase()}, ${date.getFullYear()}`;
}

function getTimeValue(value: string | null | undefined, fallback = "18:30"): string {
  const time = value?.includes("T") ? value.split("T")[1] : value;
  return /^\d{2}:\d{2}$/.test(time ?? "") ? (time as string) : fallback;
}

interface PanelPosition {
  left: number;
  top: number;
  width: number;
  maxHeight: number;
  origin: "top" | "bottom";
}

interface FloatingPickerProps {
  open: boolean;
  onClose: () => void;
  anchorRef: AnchorRef;
  children: ReactNode;
  labelledBy?: string;
  className?: string;
}

function findScroller(from: Element | null, limit: HTMLElement): HTMLElement | null {
  let node: Element | null = from;
  while (node && node !== limit.parentElement) {
    if (node instanceof HTMLElement) {
      const overflow = getComputedStyle(node).overflowY;
      if ((overflow === "auto" || overflow === "scroll") && node.scrollHeight > node.clientHeight) {
        return node;
      }
    }
    node = node.parentElement;
  }
  return null;
}

function FloatingPicker({ open, onClose, anchorRef, children, labelledBy, className = "" }: FloatingPickerProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const touchYRef = useRef<number | null>(null);
  const [position, setPosition] = useState<PanelPosition>({ left: 12, top: 12, width: 320, maxHeight: 390, origin: "top" });

  useLayoutEffect(() => {
    if (!open || !anchorRef.current) return undefined;

    function placePanel() {
      const anchor = anchorRef.current?.getBoundingClientRect();
      if (!anchor) return;
      const viewportPadding = 12;
      const gap = 8;
      const minPanel = 220;
      const width = Math.min(Math.max(anchor.width, 310), window.innerWidth - viewportPadding * 2);
      const left = Math.min(Math.max(viewportPadding, anchor.left), window.innerWidth - width - viewportPadding);

      const roomBelow = window.innerHeight - anchor.bottom - gap - viewportPadding;
      const roomAbove = anchor.top - gap - viewportPadding;
      const placeAbove = roomBelow < minPanel && roomAbove > roomBelow;

      const room = Math.max(placeAbove ? roomAbove : roomBelow, minPanel);
      const maxHeight = Math.min(room, window.innerHeight - viewportPadding * 2);
      const rawTop = placeAbove ? anchor.top - gap - maxHeight : anchor.bottom + gap;
      const top = Math.min(
        Math.max(viewportPadding, rawTop),
        Math.max(viewportPadding, window.innerHeight - viewportPadding - maxHeight)
      );

      setPosition({ left, top, width, maxHeight, origin: placeAbove ? "bottom" : "top" });
    }

    placePanel();
    const frame = requestAnimationFrame(placePanel);
    window.addEventListener("resize", placePanel);
    window.addEventListener("scroll", placePanel, true);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", placePanel);
      window.removeEventListener("scroll", placePanel, true);
    };
  }, [anchorRef, open]);

  useEffect(() => {
    if (!open) return undefined;
    function handlePointerDown(event: PointerEvent) {
      const target = event.target as Node;
      if (panelRef.current?.contains(target) || anchorRef.current?.contains(target)) return;
      onClose();
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.stopPropagation();
        onClose();
        anchorRef.current?.focus();
      }
    }
    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [anchorRef, onClose, open]);

  function isScrollLocked() {
    return document.body.hasAttribute("data-scroll-locked");
  }

  function handleWheel(event: ReactWheelEvent<HTMLDivElement>) {
    if (!panelRef.current || !isScrollLocked()) return;
    const scroller = findScroller(event.target as Element, panelRef.current);
    if (!scroller) return;
    scroller.scrollTop += event.deltaY;
    event.preventDefault();
  }

  function handleTouchStart(event: ReactTouchEvent<HTMLDivElement>) {
    touchYRef.current = event.touches[0]?.clientY ?? null;
  }

  function handleTouchMove(event: ReactTouchEvent<HTMLDivElement>) {
    const start = touchYRef.current;
    const current = event.touches[0]?.clientY;
    if (start === null || current === undefined || !panelRef.current || !isScrollLocked()) return;
    const scroller = findScroller(event.target as Element, panelRef.current);
    if (!scroller) return;
    scroller.scrollTop += start - current;
    touchYRef.current = current;
  }

  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {open ? (
        <FocusScope
          asChild
          trapped
          onMountAutoFocus={(event) => event.preventDefault()}
          onUnmountAutoFocus={(event) => event.preventDefault()}
        >
        <motion.div
          ref={panelRef}
          className={`form-picker-popover ${className}`}
          role="dialog"
          aria-labelledby={labelledBy}
          onWheel={handleWheel}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          style={{
            left: position.left,
            top: position.top,
            width: position.width,
            maxHeight: position.maxHeight,
            transformOrigin: position.origin,
          }}
          initial={{ opacity: 0, y: position.origin === "top" ? -8 : 8, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: position.origin === "top" ? -5 : 5, scale: 0.97 }}
          transition={{ type: "spring", stiffness: 430, damping: 32, mass: 0.75 }}
        >
          {children}
        </motion.div>
        </FocusScope>
      ) : null}
    </AnimatePresence>,
    document.body
  );
}

interface PickerTriggerProps {
  anchorRef: RefObject<HTMLButtonElement | null>;
  open: boolean;
  onClick: () => void;
  icon: IconComponent;
  value: string;
  placeholder: string;
  labelledBy?: string;
}

function PickerTrigger({ anchorRef, open, onClick, icon: Icon, value, placeholder, labelledBy }: PickerTriggerProps) {
  return (
    <button
      ref={anchorRef}
      type="button"
      className={`form-picker-trigger${open ? " is-open" : ""}${value ? " has-value" : ""}`}
      onClick={onClick}
      aria-expanded={open}
      aria-haspopup="dialog"
      aria-labelledby={labelledBy}
    >
      <span className="form-picker-trigger-icon"><Icon size={17} /></span>
      <span className="form-picker-trigger-value">{value || placeholder}</span>
      <ChevronDown className="form-picker-chevron" size={16} />
    </button>
  );
}

function FieldShell({
  label,
  icon: Icon,
  children,
  labelId,
  hideLabel = false,
}: {
  label: string;
  icon?: IconComponent;
  children: ReactNode;
  labelId: string;
  hideLabel?: boolean;
}) {
  return (
    <div className="form-picker-field">
      <span
        id={labelId}
        className={`form-picker-label ${hideLabel ? "is-visually-hidden" : ""}`}
      >
        {Icon && !hideLabel ? <Icon size={14} /> : null}
        {label}
      </span>
      {children}
    </div>
  );
}

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectPickerProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<SelectOption | string>;
  icon?: IconComponent;
  hideLabel?: boolean;
  searchable?: boolean;
}

export function SelectPicker({ label, value, onChange, options, icon, hideLabel, searchable }: SelectPickerProps) {
  const { t } = useTranslation("common");
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const anchorRef = useRef<HTMLButtonElement>(null);
  const labelId = useId();
  const normalizedOptions = useMemo<SelectOption[]>(
    () => options.map((option) => (typeof option === "string" ? { value: option, label: option } : option)),
    [options]
  );
  const selected = normalizedOptions.find((option) => option.value === value);
  const search = query.trim().toLowerCase();
  const visibleOptions = search
    ? normalizedOptions.filter((option) => option.label.toLowerCase().includes(search))
    : normalizedOptions;

  function close() {
    setOpen(false);
    setQuery("");
  }

  function pick(optionValue: string) {
    onChange(optionValue);
    close();
    requestAnimationFrame(() => anchorRef.current?.focus());
  }

  return (
    <FieldShell label={label} icon={icon} labelId={labelId} hideLabel={hideLabel}>
      <PickerTrigger
        anchorRef={anchorRef}
        open={open}
        onClick={() => (open ? close() : setOpen(true))}
        icon={icon ?? ChevronDown}
        value={selected?.label ?? ""}
        placeholder={t("formPickers.selectPlaceholder")}
        labelledBy={labelId}
      />
      <FloatingPicker open={open} onClose={close} anchorRef={anchorRef} labelledBy={labelId} className="select-picker-popover">
        <div className="picker-mini-heading"><span>{t("formPickers.selectHeading")}</span><strong>{label}</strong></div>
        {searchable ? (
          <div className="select-picker-search">
            <Search size={15} />
            <input
              autoFocus
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t("formPickers.searchPlaceholder")}
              aria-label={t("formPickers.searchPlaceholder")}
              onKeyDown={(event) => {
                if (event.key === "Enter" && visibleOptions.length) {
                  event.preventDefault();
                  pick(visibleOptions[0].value);
                }
              }}
            />
          </div>
        ) : null}
        <div className="select-picker-options" role="listbox" aria-labelledby={labelId}>
          {visibleOptions.map((option) => {
            const active = option.value === value;
            return (
              <motion.button
                key={option.value}
                type="button"
                role="option"
                aria-selected={active}
                className={active ? "is-selected" : ""}
                onClick={() => pick(option.value)}
                whileTap={{ scale: 0.98 }}
              >
                <span>{option.label}</span>
                {active ? (
                  <motion.span layoutId={`${labelId}-check`} className="select-picker-check">
                    <Check size={15} />
                  </motion.span>
                ) : null}
              </motion.button>
            );
          })}
          {searchable && !visibleOptions.length ? (
            <p className="select-picker-empty">{t("formPickers.searchEmpty")}</p>
          ) : null}
        </div>
      </FloatingPicker>
    </FieldShell>
  );
}

interface CalendarGridProps {
  value: string;
  onChange: (dateValue: string) => void;
  viewDate: Date;
  onViewDateChange: (date: Date) => void;
  minDate?: string;
  maxDate?: string;
}

function CalendarGrid({
  value,
  onChange,
  viewDate,
  onViewDateChange,
  minDate,
  maxDate,
}: CalendarGridProps) {
  const { t } = useTranslation("common");
  const months = t("formPickers.months", { returnObjects: true }) as string[];
  const weekdays = t("formPickers.weekdays", { returnObjects: true }) as string[];
  const selected = parseDateValue(value);
  const todayValue = toDateValue(new Date());
  const cells = useMemo(() => {
    const first = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1);
    const mondayOffset = (first.getDay() + 6) % 7;
    return Array.from(
      { length: 42 },
      (_, index) => new Date(viewDate.getFullYear(), viewDate.getMonth(), index - mondayOffset + 1)
    );
  }, [viewDate]);

  return (
    <div className="calendar-picker">
      <div className="calendar-picker-head">
        <button
          type="button"
          onClick={() => onViewDateChange(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))}
          aria-label={t("formPickers.prevMonth")}
        >
          <ChevronLeft size={18} />
        </button>
        <motion.strong
          key={`${viewDate.getFullYear()}-${viewDate.getMonth()}`}
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {months[viewDate.getMonth()]} {viewDate.getFullYear()}
        </motion.strong>
        <button
          type="button"
          onClick={() => onViewDateChange(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))}
          aria-label={t("formPickers.nextMonth")}
        >
          <ChevronRight size={18} />
        </button>
      </div>
      <div className="calendar-weekdays" aria-hidden="true">
        {weekdays.map((day, index) => <span key={index}>{day}</span>)}
      </div>
      <div className="calendar-days">
        {cells.map((date) => {
          const dateValue = toDateValue(date);
          const inMonth = date.getMonth() === viewDate.getMonth();
          const isSelected = selected ? dateValue === toDateValue(selected) : false;
          const isToday = dateValue === todayValue;
          const blocked = Boolean((minDate && dateValue < minDate) || (maxDate && dateValue > maxDate));
          return (
            <motion.button
              key={dateValue}
              type="button"
              disabled={blocked}
              className={`${inMonth ? "" : "is-outside"}${isSelected ? " is-selected" : ""}${isToday ? " is-today" : ""}${blocked ? " is-blocked" : ""}`}
              onClick={() => onChange(dateValue)}
              aria-label={`${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`}
              aria-pressed={isSelected}
              whileTap={{ scale: 0.86 }}
            >
              {isSelected ? <motion.span layoutId="selected-calendar-day" className="calendar-selected-day" /> : null}
              <span>{date.getDate()}</span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

interface TimeControlProps {
  value: string;
  onChange: (time: string) => void;
  compact?: boolean;
}

function TimeField({
  value,
  max,
  label,
  onCommit,
}: {
  value: number;
  max: number;
  label: string;
  onCommit: (next: number) => void;
}) {
  const [draft, setDraft] = useState<string | null>(null);

  function commit() {
    if (draft === null) return;
    const parsed = Number.parseInt(draft, 10);
    setDraft(null);
    if (!Number.isFinite(parsed)) return;
    onCommit(Math.min(max, Math.max(0, parsed)));
  }

  return (
    <input
      className="time-field"
      inputMode="numeric"
      maxLength={2}
      aria-label={label}
      value={draft ?? pad(value)}
      onFocus={(event) => {
        setDraft(pad(value));
        event.target.select();
      }}
      onChange={(event) => setDraft(event.target.value.replace(/\D/g, "").slice(0, 2))}
      onBlur={commit}
      onKeyDown={(event) => {
        if (event.key !== "Enter") return;
        event.preventDefault();
        commit();
        event.currentTarget.blur();
      }}
    />
  );
}

function TimeControl({ value, onChange, compact = false }: TimeControlProps) {
  const { t } = useTranslation("common");
  const time = getTimeValue(value);
  const [hour, minute] = time.split(":").map(Number);

  function updateTime(nextHour: number, nextMinute: number) {
    onChange(`${pad((nextHour + 24) % 24)}:${pad((nextMinute + 60) % 60)}`);
  }

  function shiftMinute(amount: number) {
    const total = hour * 60 + minute + amount;
    const normalized = (total + 24 * 60) % (24 * 60);
    updateTime(Math.floor(normalized / 60), normalized % 60);
  }

  return (
    <div className={`time-control${compact ? " is-compact" : ""}`}>
      <div className="time-stepper" aria-label={t("formPickers.adjustTimeAria")}>
        <div>
          <button type="button" onClick={() => updateTime(hour + 1, minute)} aria-label={t("formPickers.increaseHourAria")}>
            <ChevronUp size={17} />
          </button>
          <TimeField value={hour} max={23} label={t("formPickers.hourLabel")} onCommit={(next) => updateTime(next, minute)} />
          <button type="button" onClick={() => updateTime(hour - 1, minute)} aria-label={t("formPickers.decreaseHourAria")}>
            <ChevronDown size={17} />
          </button>
        </div>
        <span>:</span>
        <div>
          <button type="button" onClick={() => shiftMinute(5)} aria-label={t("formPickers.increaseMinuteAria")}>
            <ChevronUp size={17} />
          </button>
          <TimeField value={minute} max={59} label={t("formPickers.minuteLabel")} onCommit={(next) => updateTime(hour, next)} />
          <button type="button" onClick={() => shiftMinute(-5)} aria-label={t("formPickers.decreaseMinuteAria")}>
            <ChevronDown size={17} />
          </button>
        </div>
      </div>
      <div className="time-presets" aria-label={t("formPickers.presetTimesAria")}>
        {TIME_PRESETS.map((preset) => (
          <button
            key={preset}
            type="button"
            className={time === preset ? "is-selected" : ""}
            onClick={() => onChange(preset)}
          >
            {preset}
          </button>
        ))}
      </div>
    </div>
  );
}

export interface DurationPickerProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  icon?: IconComponent;
  options?: readonly number[];
  min?: number;
  max?: number;
}

const DEFAULT_DURATIONS = [30, 45, 60, 90] as const;

export function DurationPicker({
  label,
  value,
  onChange,
  icon: Icon = Hourglass,
  options = DEFAULT_DURATIONS,
  min = 5,
  max = 480,
}: DurationPickerProps) {
  const { t } = useTranslation("common");
  const [open, setOpen] = useState(false);
  const anchorRef = useRef<HTMLDivElement>(null);
  const labelId = useId();

  function commit() {
    const parsed = Number.parseInt(value, 10);
    if (!Number.isFinite(parsed)) {
      onChange(String(options[0] ?? min));
      return;
    }
    const clamped = String(Math.min(max, Math.max(min, parsed)));
    if (clamped !== value) onChange(clamped);
  }

  return (
    <FieldShell label={label} icon={Icon} labelId={labelId}>
      <div
        ref={anchorRef}
        className={`form-picker-trigger duration-picker${open ? " is-open" : ""}${value ? " has-value" : ""}`}
      >
        <span className="form-picker-trigger-icon">
          <Icon size={17} />
        </span>
        <input
          className="duration-picker-input"
          inputMode="numeric"
          aria-labelledby={labelId}
          value={value}
          onChange={(event) => onChange(event.target.value.replace(/\D/g, ""))}
          onBlur={commit}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              commit();
            }
          }}
        />
        <span className="duration-picker-unit">{t("formPickers.minuteUnit")}</span>
        <button
          type="button"
          className="duration-picker-toggle"
          aria-label={t("formPickers.presetDurationsAria")}
          aria-expanded={open}
          aria-haspopup="dialog"
          onClick={() => setOpen((current) => !current)}
        >
          <ChevronDown className="form-picker-chevron" size={16} />
        </button>
      </div>

      <FloatingPicker
        open={open}
        onClose={() => setOpen(false)}
        anchorRef={anchorRef}
        labelledBy={labelId}
        className="select-picker-popover"
      >
        <div className="picker-mini-heading">
          <span>{t("formPickers.selectHeading")}</span>
          <strong>{label}</strong>
        </div>
        <div className="select-picker-options" role="listbox" aria-labelledby={labelId}>
          {options.map((minutes, index) => {
            const active = String(minutes) === value;
            return (
              <motion.button
                key={minutes}
                type="button"
                role="option"
                aria-selected={active}
                className={active ? "is-selected" : ""}
                onClick={() => {
                  onChange(String(minutes));
                  setOpen(false);
                }}
                initial={{ opacity: 0, x: -5 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.025 }}
              >
                <span>{minutes} {t("formPickers.minuteUnit")}</span>
                {active ? (
                  <i>
                    <Check size={14} />
                  </i>
                ) : null}
              </motion.button>
            );
          })}
        </div>
      </FloatingPicker>
    </FieldShell>
  );
}

export interface DatePickerProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  includeTime?: boolean;
  optional?: boolean;
  minDate?: string;
  maxDate?: string;
}

export function DatePicker({
  label,
  value,
  onChange,
  includeTime = false,
  optional = false,
  minDate,
  maxDate,
}: DatePickerProps) {
  const { t } = useTranslation("common");
  const months = t("formPickers.months", { returnObjects: true }) as string[];
  const [open, setOpen] = useState(false);
  const anchorRef = useRef<HTMLButtonElement>(null);
  const labelId = useId();
  const selectedDate = parseDateValue(value);
  const [viewDate, setViewDate] = useState<Date>(() => selectedDate ?? new Date());
  const timeValue = getTimeValue(value);
  const displayValue = selectedDate
    ? `${formatDateValue(value, months)}${includeTime ? ` · ${timeValue}` : ""}`
    : "";

  function selectDate(dateValue: string) {
    onChange(includeTime ? `${dateValue}T${timeValue}` : dateValue);
  }

  function selectTime(time: string) {
    const dateValue = selectedDate ? toDateValue(selectedDate) : toDateValue(new Date());
    onChange(`${dateValue}T${time}`);
  }

  return (
    <FieldShell label={label} icon={CalendarDays} labelId={labelId}>
      <PickerTrigger
        anchorRef={anchorRef}
        open={open}
        onClick={() => {
          setViewDate(selectedDate ?? new Date());
          setOpen((current) => !current);
        }}
        icon={includeTime ? Clock3 : CalendarDays}
        value={displayValue}
        placeholder={includeTime ? t("formPickers.chooseDateTime") : t("formPickers.chooseDate")}
        labelledBy={labelId}
      />
      <FloatingPicker
        open={open}
        onClose={() => setOpen(false)}
        anchorRef={anchorRef}
        labelledBy={labelId}
        className={includeTime ? "datetime-picker-popover" : "date-picker-popover"}
      >
        <CalendarGrid
          value={value}
          onChange={selectDate}
          viewDate={viewDate}
          onViewDateChange={setViewDate}
          minDate={minDate}
          maxDate={maxDate}
        />
        {includeTime ? (
          <div className="datetime-time-section">
            <div className="picker-section-title">
              <Clock3 size={15} />
              <span>{t("formPickers.dueTimeSection")}</span>
            </div>
            <TimeControl value={timeValue} onChange={selectTime} compact />
          </div>
        ) : null}
        <div className="picker-footer">
          {optional ? (
            <button
              type="button"
              className="picker-clear"
              onClick={() => {
                onChange("");
                setOpen(false);
              }}
            >
              {t("formPickers.clear")}
            </button>
          ) : (
            <span />
          )}
          <button
            type="button"
            className="picker-today"
            disabled={Boolean(
              (minDate && toDateValue(new Date()) < minDate) ||
                (maxDate && toDateValue(new Date()) > maxDate)
            )}
            onClick={() => {
              selectDate(toDateValue(new Date()));
              setViewDate(new Date());
            }}
          >
            {t("formPickers.today")}
          </button>
          <button type="button" className="picker-done" onClick={() => setOpen(false)}>
            {t("formPickers.done")}
          </button>
        </div>
      </FloatingPicker>
    </FieldShell>
  );
}

export interface TimePickerProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
}

export function TimePicker({ label, value, onChange }: TimePickerProps) {
  const { t } = useTranslation("common");
  const [open, setOpen] = useState(false);
  const anchorRef = useRef<HTMLButtonElement>(null);
  const labelId = useId();
  return (
    <FieldShell label={label} icon={Clock3} labelId={labelId}>
      <PickerTrigger
        anchorRef={anchorRef}
        open={open}
        onClick={() => setOpen((current) => !current)}
        icon={Clock3}
        value={value}
        placeholder={t("formPickers.chooseTime")}
        labelledBy={labelId}
      />
      <FloatingPicker open={open} onClose={() => setOpen(false)} anchorRef={anchorRef} labelledBy={labelId} className="time-picker-popover">
        <div className="picker-mini-heading"><span>{t("formPickers.schedule")}</span><strong>{label}</strong></div>
        <TimeControl value={value} onChange={onChange} />
        <div className="picker-footer picker-footer--end">
          <button type="button" className="picker-done" onClick={() => setOpen(false)}>
            {t("formPickers.done")}
          </button>
        </div>
      </FloatingPicker>
    </FieldShell>
  );
}
