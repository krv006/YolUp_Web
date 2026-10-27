import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useIsCompact } from "@/shared/hooks/use-media-query";
import { Icon } from "@/shared/ui/icon";
import { MobileActionBar, MobilePageHeader } from "@/shared/ui/mobile-page";
import { SETTINGS_TONES } from "./settings-tones";

export function ProfileSubPage({
  title,
  description,
  children,
  footer,
  footerNote,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  footerNote?: ReactNode;
}) {
  const navigate = useNavigate();
  const { t } = useTranslation("account");
  const isCompact = useIsCompact();

  if (!isCompact) {
    return (
      <div className="flex min-w-0 flex-col gap-4">
        {description ? <p className="text-body-sm text-ink-secondary">{description}</p> : null}
        {children}
        {footer ? <div className="flex items-center justify-end gap-3">{footer}</div> : null}
      </div>
    );
  }

  return (
    <div className="relative flex h-full min-h-0 flex-col bg-canvas bg-auth-gradient font-body text-ink">
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-4 pt-5 pb-6 [&>*]:shrink-0">
        <MobilePageHeader title={title} backLabel={t("page.back")} onBack={() => navigate("..")} />
        {description ? <p className="mt-5 text-body-sm text-ink-secondary">{description}</p> : null}
        <div className={`${description ? "mt-3.5" : "mt-5"} flex flex-col gap-5`}>{children}</div>
      </div>

      {footer ? (
        <div className="relative shrink-0">
          {footerNote ? <div className="absolute inset-x-4 bottom-full mb-3">{footerNote}</div> : null}
          <MobileActionBar>{footer}</MobileActionBar>
        </div>
      ) : null}
    </div>
  );
}

export function SettingsSection({ label, children }: { label: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3 max-lg:gap-[13px]">
      <span className="text-title text-ink max-lg:leading-5 max-lg:font-normal">{label}</span>
      <div className="flex flex-col divide-y divide-line-subtle overflow-hidden rounded-lg bg-surface max-lg:divide-line max-lg:rounded-xl">
        {children}
      </div>
    </section>
  );
}

export function SettingsRow({
  icon,
  tone = SETTINGS_TONES.brand,
  title,
  hint,
  value,
  right,
  onClick,
  danger = false,
}: {
  icon: string;
  tone?: string;
  title: string;
  hint?: ReactNode;
  value?: ReactNode;
  right?: ReactNode;
  onClick?: () => void;
  danger?: boolean;
}) {
  const content = (
    <>
      <span className={`grid size-9 shrink-0 place-items-center rounded-md max-lg:size-10 ${tone}`}>
        <Icon name={icon} size={18} className="max-lg:size-5" />
      </span>

      <span className="flex min-w-0 flex-1 flex-col text-left">
        <strong
          className={`truncate text-title-sm max-lg:text-title ${danger ? "text-danger max-lg:text-error-text" : "text-ink"}`}
        >
          {title}
        </strong>
        {hint ? (
          <small className="truncate text-body-xs text-ink-tertiary max-lg:text-body-sm max-lg:leading-[22px] max-lg:text-ink-secondary">
            {hint}
          </small>
        ) : null}
      </span>

      {value ? (
        <small className="shrink-0 truncate text-body-sm text-ink-secondary max-lg:text-body-xs max-lg:text-ink">
          {value}
        </small>
      ) : null}

      {right}

      {onClick && !right ? (
        <Icon name="chevron-right" size={18} className="shrink-0 text-icon-tertiary max-lg:size-5 max-lg:text-icon-secondary" />
      ) : null}
    </>
  );

  const box = "flex items-center gap-3 px-4 py-4 max-lg:min-h-[68px] max-lg:py-[14px]";

  if (!onClick) return <div className={box}>{content}</div>;

  return (
    <button type="button" className={`${box} text-left transition-colors hover:bg-subtle`} onClick={onClick}>
      {content}
    </button>
  );
}
