export function PanelHeading({
  eyebrow,
  title,
  subtitle,
  className = "flex-1",
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
  className?: string;
}) {
  return (
    <div className={`flex min-w-0 flex-col gap-[3px] ${className}`}>
      <span className="text-caption text-ink-secondary uppercase">{eyebrow}</span>
      <h2 className="text-[24px]/[26px] font-bold text-ink">{title}</h2>
      {subtitle ? <p className="truncate text-body-sm text-ink-secondary lg:text-body-xs">{subtitle}</p> : null}
    </div>
  );
}
