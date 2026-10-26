import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import logoUrl from "@/shared/assets/y-logo.svg";

export interface AuthShellProps {
  title: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  /** Asosiy tugma (forma ichida bo'lmasa). */
  action?: ReactNode;
  /** Formadan keyingi havola (masalan "Hisobingiz yo'qmi? Ro'yxatdan o'tish"). */
  footer?: ReactNode;
  notice?: ReactNode;
}

const PILLS = ["live", "ai", "mock"] as const;

export function AuthShell({
  title,
  description,
  children,
  action,
  footer,
  notice,
}: AuthShellProps) {
  const { t } = useTranslation("auth");

  return (
    <main className="flex min-h-dvh gap-4 bg-canvas p-4">
      <aside
        className="relative hidden w-165 shrink-0 flex-col overflow-hidden rounded-[28px] px-12 py-11 lg:flex"
        style={{ background: "linear-gradient(135deg, #4566f5 0%, #7354d9 100%)" }}
      >
        <span className="flex items-center gap-2.5">
          <img className="size-8" src={logoUrl} alt="" />
          <strong className="font-heading text-h2 text-ink-inverse">YolUp</strong>
        </span>

        <h2 className="mt-14 max-w-130 font-heading text-[34px] leading-[1.3] text-ink-inverse">
          {t("shell.headline")}
        </h2>

        <span className="mt-7 flex flex-wrap items-center gap-2">
          {PILLS.map((pill) => (
            <small
              key={pill}
              className="flex h-6 items-center rounded-full bg-surface px-2 text-overline text-brand-strong"
            >
              {t(`shell.pills.${pill}`)}
            </small>
          ))}
        </span>

        <span
          className="pointer-events-none absolute -right-20 -bottom-32 size-100 rounded-full bg-surface/10"
          aria-hidden="true"
        />
        <span
          className="pointer-events-none absolute -bottom-40 left-10 size-80 rounded-full bg-surface/10"
          aria-hidden="true"
        />
      </aside>

      <div className="flex min-w-0 flex-1 items-center justify-center px-5">
        <div className="flex w-full max-w-90 flex-col gap-4">
          {notice}

          <h1 className="font-heading text-display text-ink">{title}</h1>
          {description ? <p className="text-body text-ink-secondary">{description}</p> : null}

          {children ? <div className="flex flex-col gap-4 pt-2">{children}</div> : null}

          {action ? <div className="pt-2">{action}</div> : null}

          {footer ? (
            <p className="pt-2 text-center text-body-sm text-ink-secondary">{footer}</p>
          ) : null}
        </div>
      </div>
    </main>
  );
}
