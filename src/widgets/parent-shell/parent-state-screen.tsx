import { formatLocalized } from "@/shared/lib";
import { useIsCompact } from "@/shared/hooks/use-media-query";
import { Icon } from "@/shared/ui/icon";
import { STATE_BUTTON } from "./parent-state-styles";

const TONES = {
  brand: { ring: "bg-brand-subtle", core: "bg-brand" },
  violet: { ring: "bg-accent-violet-bg", core: "bg-accent-violet-fg" },
  danger: { ring: "bg-danger-bg", core: "bg-danger" },
  teal: { ring: "bg-accent-teal-bg", core: "bg-accent-teal-fg" },
};

const DOTS = [
  "top-1 left-6 size-1.5 bg-brand",
  "top-7 -left-1 size-2.5 bg-saffron",
  "top-5 right-0 size-2 bg-accent-violet-fg",
  "bottom-12 right-[-14px] size-3 bg-brand",
  "bottom-9 -left-2 size-2 bg-danger",
  "bottom-1 right-6 size-1.5 bg-success",
];

export interface StateAction {
  label: string;
  onClick: () => void;
}

export function ParentStateScreen({
  icon,
  tone,
  code,
  title,
  text,
  now,
  primary,
  secondary,
}: {
  icon: string;
  tone: keyof typeof TONES;
  code?: string;
  title: string;
  text: string;
  now: number;
  primary?: StateAction;
  secondary?: StateAction;
}) {
  const colors = TONES[tone];
  const compact = useIsCompact();
  const art = (
    <>
      {code ? <strong className="font-heading text-[30px]/9 font-semibold text-brand">{code}</strong> : null}
      <span className="relative grid size-[150px] place-items-center" aria-hidden="true">
        <span className={`grid size-[150px] place-items-center rounded-full ${colors.ring}`}>
          <span className={`grid size-[88px] place-items-center rounded-full text-on-action shadow-lg ${colors.core}`}>
            <Icon name={icon} size={40} />
          </span>
        </span>
        {DOTS.map((dot) => (
          <span key={dot} className={`absolute rounded-full ${dot}`} />
        ))}
      </span>
      <h1 className="font-heading text-[26px]/9 font-semibold text-ink">{title}</h1>
      <p className="max-w-[520px] text-body text-ink-secondary">{text}</p>
    </>
  );

  if (compact)
    return (
      <div className="fixed inset-0 z-40 flex flex-col overflow-y-auto bg-canvas px-4 pt-10 pb-[max(24px,env(safe-area-inset-bottom))] text-center">
        <div className="flex flex-1 flex-col items-center justify-center gap-4">{art}</div>
        {secondary ? (
          <button type="button" className="mx-auto mb-4 h-11 px-4 text-title-sm font-semibold text-brand" onClick={secondary.onClick}>
            {secondary.label}
          </button>
        ) : null}
        {primary ? (
          <button type="button" className={`${STATE_BUTTON.primary} h-13 w-full`} onClick={primary.onClick}>
            {primary.label}
          </button>
        ) : null}
      </div>
    );

  return (
    <div className="flex min-h-full flex-col gap-6 px-8 py-7">
      <small className="text-body-xs text-ink-secondary">{formatLocalized(now, "EEEE, d-MMMM")}</small>
      <section className="flex flex-1 flex-col items-center justify-center gap-4 rounded-[28px] bg-surface px-8 py-16 text-center">
        {art}
        {primary || secondary ? (
          <div className="mt-1 flex flex-wrap items-center justify-center gap-3">
            {secondary ? (
              <button type="button" className={STATE_BUTTON.secondary} onClick={secondary.onClick}>
                {secondary.label}
              </button>
            ) : null}
            {primary ? (
              <button type="button" className={STATE_BUTTON.primary} onClick={primary.onClick}>
                {primary.label}
              </button>
            ) : null}
          </div>
        ) : null}
      </section>
    </div>
  );
}
