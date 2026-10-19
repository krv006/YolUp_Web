import { useTranslation } from "react-i18next";
import { useLoginHistory } from "@/modules/auth";
import { Icon } from "@/shared/ui/icon";
import { ProfileSubPage } from "./profile-shell";

export function LoginHistoryPage() {
  const { t } = useTranslation("account");
  const logins = useLoginHistory(null, true);
  const rows = logins.data ?? [];

  return (
    <ProfileSubPage title={t("page.loginsTitle")} description={t("page.loginsDescription")}>
      {logins.isLoading ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 4 }, (_, index) => (
            <div key={index} className="h-16 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      ) : rows.length ? (
        <div className="flex flex-col divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface">
          {rows.map((row, index) => (
            <div key={row.id} className="flex items-center gap-3 px-4 py-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-full bg-ink-tertiary text-white">
                <Icon name="eye" size={18} />
              </span>
              <span className="flex min-w-0 flex-1 flex-col">
                <strong className="truncate text-label-strong text-ink">{row.device || "—"}</strong>
                <small className="truncate text-caption text-ink-tertiary">
                  {row.ip} · {row.at}
                </small>
              </span>
              {index === 0 ? (
                <span className="flex h-7 shrink-0 items-center rounded-full bg-action-subtle px-2.5 text-caption-strong text-action">
                  {t("page.thisDevice")}
                </span>
              ) : row.isNewIp ? (
                <span className="flex h-7 shrink-0 items-center rounded-full bg-saffron-subtle px-2.5 text-caption-strong text-saffron-strong">
                  IP
                </span>
              ) : null}
            </div>
          ))}
        </div>
      ) : (
        <p className="px-1 text-body-sm text-ink-tertiary">{t("page.noCertificates")}</p>
      )}
    </ProfileSubPage>
  );
}
