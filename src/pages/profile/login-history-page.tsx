import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { useLoginHistory, useLogoutOtherSessionsMutation } from "@/modules/auth";
import { AppDialog, dialogButton } from "@/shared/ui/app-dialog";
import { Icon } from "@/shared/ui/icon";
import { SETTINGS_TONES } from "./settings-tones";
import { ProfileSubPage } from "./profile-shell";

type GroupKey = "todayGroup" | "yesterdayGroup" | "earlierGroup";

function groupOf(value: string): GroupKey {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "earlierGroup";
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  if (date.getTime() >= start.getTime()) return "todayGroup";
  if (date.getTime() >= start.getTime() - 86_400_000) return "yesterdayGroup";
  return "earlierGroup";
}

function clock(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

export function LoginHistoryPage() {
  const { t } = useTranslation("account");
  const logins = useLoginHistory(null, true);
  const logoutOthers = useLogoutOtherSessionsMutation();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const rows = logins.data ?? [];
  const groups: GroupKey[] = ["todayGroup", "yesterdayGroup", "earlierGroup"];

  return (
    <ProfileSubPage title={t("page.loginsTitle")}>
      {logins.isLoading ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 4 }, (_, index) => (
            <div key={index} className="h-17 animate-pulse rounded-lg bg-surface" />
          ))}
        </div>
      ) : null}

      {groups.map((group) => {
        const items = rows.filter((row) => groupOf(row.at) === group);
        if (!items.length) return null;

        return (
          <section key={group} className="flex flex-col gap-3">
            <span className="text-title text-ink">{t(`page.${group}`)}</span>

            <div className="flex flex-col divide-y divide-line-subtle overflow-hidden rounded-lg bg-surface">
              {items.map((row, index) => {
                const current = group === "todayGroup" && index === 0;
                return (
                  <div key={row.id} className="flex items-center gap-3 px-4 py-3.5">
                    <span
                      className={`grid size-9 shrink-0 place-items-center rounded-md ${
                        current ? SETTINGS_TONES.success : SETTINGS_TONES.brand
                      }`}
                    >
                      <Icon name={current ? "person" : "settings"} size={18} />
                    </span>

                    <span className="flex min-w-0 flex-1 flex-col">
                      <strong className="truncate text-title-sm text-ink">
                        {row.device || "—"}
                      </strong>
                      <small className="truncate text-body-xs text-ink-tertiary">{row.ip}</small>
                    </span>

                    {current ? (
                      <small className="shrink-0 text-body-xs text-success">
                        {t("page.thisDevice")}
                      </small>
                    ) : (
                      <small className="shrink-0 text-body-xs text-ink-tertiary">
                        {clock(row.at)}
                      </small>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}

      {!logins.isLoading && !rows.length ? (
        <p className="rounded-lg bg-surface px-5 py-8 text-center text-body-sm text-ink-tertiary">
          {t("page.noLogins")}
        </p>
      ) : null}

      <button
        type="button"
        className="flex h-12 items-center justify-center gap-2 rounded-full border border-line bg-surface px-5 text-button text-ink transition-colors hover:bg-subtle"
        onClick={() => setConfirmOpen(true)}
      >
        <Icon name="logout" size={18} />
        {t("page.logoutOthers")}
      </button>

      <AppDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        variant="confirm"
        width="lg:w-120"
        title={t("page.logoutOthersTitle")}
        description={t("page.logoutOthersDescription")}
        footer={
          <>
            <button
              type="button"
              className={dialogButton.secondary}
              onClick={() => setConfirmOpen(false)}
            >
              {t("page.cancel")}
            </button>
            <button
              type="button"
              className={dialogButton.danger}
              disabled={logoutOthers.isPending}
              onClick={() =>
                logoutOthers.mutate(undefined, {
                  onSuccess: (count) => {
                    toast.success(t("page.otherSessionsClosed", { count }));
                    setConfirmOpen(false);
                  },
                  onError: (error: Error) => toast.error(error.message),
                })
              }
            >
              {t("page.logout")}
            </button>
          </>
        }
      />
    </ProfileSubPage>
  );
}
