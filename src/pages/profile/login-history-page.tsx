import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { useLoginHistoryPage, useLogoutOtherSessionsMutation } from "@/modules/auth";
import { useIsCompact } from "@/shared/hooks/use-media-query";
import { AppDialog, dialogButton } from "@/shared/ui/app-dialog";
import { ConfirmDialog } from "@/shared/ui/confirm-dialog";
import { Icon } from "@/shared/ui/icon";
import { SETTINGS_TONES } from "./settings-tones";
import { ProfileSubPage, SettingsRow, SettingsSection } from "./profile-shell";

type GroupKey = "todayGroup" | "yesterdayGroup" | "earlierGroup";

const PAGE_SIZE = 10;

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

function isPhone(device: string): boolean {
  return /iphone|android|ios|mobile|yolup/i.test(device);
}

export function LoginHistoryPage() {
  const { t } = useTranslation("account");
  const isCompact = useIsCompact();
  const [page, setPage] = useState(1);
  const logins = useLoginHistoryPage(page, PAGE_SIZE);
  const logoutOthers = useLogoutOtherSessionsMutation();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const items = logins.data?.items ?? [];
  const pages = Math.max(1, logins.data?.totalPages ?? 1);
  const current = Math.min(page, pages);
  const rows = items.length > PAGE_SIZE ? items.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE) : items;
  const anyCurrent = items.some((row) => row.isCurrent);
  const groups: GroupKey[] = ["todayGroup", "yesterdayGroup", "earlierGroup"];

  function closeOthers() {
    logoutOthers.mutate(undefined, {
      onSuccess: (count) => {
        toast.success(t("page.otherSessionsClosed", { count }));
        setConfirmOpen(false);
      },
      onError: (error: Error) => toast.error(error.message),
    });
  }

  if (isCompact)
    return (
      <ProfileSubPage title={t("page.loginsTitle")}>
        {logins.isLoading ? (
          <div className="flex flex-col gap-2">
            {Array.from({ length: 4 }, (_, index) => (
              <div key={index} className="h-17.5 animate-pulse rounded-xl bg-surface motion-reduce:animate-none" />
            ))}
          </div>
        ) : null}

        {groups.map((group) => {
          const items = rows.filter((row) => groupOf(row.at) === group);
          if (!items.length) return null;
          return (
            <SettingsSection key={group} label={t(`page.${group}`)}>
              {items.map((row, index) => {
                const thisDevice = anyCurrent ? row.isCurrent : current === 1 && group === "todayGroup" && index === 0;
                return (
                  <SettingsRow
                    key={row.id}
                    icon={isPhone(row.device) ? "person" : "settings"}
                    tone={
                      thisDevice
                        ? "bg-success-bg text-ink"
                        : isPhone(row.device)
                          ? "bg-brand-subtle text-ink"
                          : SETTINGS_TONES.brand
                    }
                    title={row.device || "—"}
                    hint={[row.location, row.ip].filter(Boolean).join(" · ")}
                    right={
                      thisDevice ? (
                        <small className="shrink-0 text-caption-strong text-success-fg">{t("page.thisDevice")}</small>
                      ) : (
                        <small className="shrink-0 text-caption-strong text-ink">{clock(row.at)}</small>
                      )
                    }
                  />
                );
              })}
            </SettingsSection>
          );
        })}

        <Pager page={current} pages={pages} onChange={setPage} />

        {!logins.isLoading && !rows.length ? (
          <p className="rounded-xl bg-surface px-5 py-8 text-center text-body-sm text-ink-secondary">{t("page.noLogins")}</p>
        ) : null}

        <button
          type="button"
          className="flex h-[50px] items-center justify-center gap-2 rounded-full border border-line-strong bg-surface px-5 text-title font-semibold text-ink transition-colors hover:bg-subtle"
          onClick={() => setConfirmOpen(true)}
        >
          <Icon name="logout" size={20} />
          {t("page.logoutOthers")}
        </button>

        <ConfirmDialog
          open={confirmOpen}
          onOpenChange={setConfirmOpen}
          icon="devices"
          title={t("page.logoutOthersTitle")}
          description={t("page.logoutOthersDescription")}
          confirmLabel={t("page.logout")}
          cancelLabel={t("page.cancel")}
          pending={logoutOthers.isPending}
          onConfirm={closeOthers}
        />
      </ProfileSubPage>
    );

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
                const thisDevice = anyCurrent ? row.isCurrent : current === 1 && group === "todayGroup" && index === 0;
                return (
                  <div key={row.id} className="flex items-center gap-3 px-4 py-3.5">
                    <span
                      className={`grid size-9 shrink-0 place-items-center rounded-md ${
                        thisDevice ? SETTINGS_TONES.success : SETTINGS_TONES.brand
                      }`}
                    >
                      <Icon name={thisDevice ? "person" : "settings"} size={18} />
                    </span>

                    <span className="flex min-w-0 flex-1 flex-col">
                      <strong className="truncate text-title-sm text-ink">
                        {row.device || "—"}
                      </strong>
                      <small className="truncate text-body-xs text-ink-tertiary">
                        {[row.location, row.ip].filter(Boolean).join(" · ")}
                      </small>
                    </span>

                    {thisDevice ? (
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

      <Pager page={current} pages={pages} onChange={setPage} />

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
              onClick={closeOthers}
            >
              {t("page.logout")}
            </button>
          </>
        }
      />
    </ProfileSubPage>
  );
}

function pageList(page: number, pages: number): Array<number | "gap"> {
  const wanted = new Set([1, pages, page - 1, page, page + 1].filter((value) => value >= 1 && value <= pages));
  const sorted = [...wanted].sort((a, b) => a - b);
  return sorted.flatMap((value, index) => (index && value - sorted[index - 1] > 1 ? ["gap" as const, value] : [value]));
}

function Pager({ page, pages, onChange }: { page: number; pages: number; onChange: (page: number) => void }) {
  const { t } = useTranslation("account");
  if (pages <= 1) return null;
  const go = (value: number, target: HTMLElement) => {
    onChange(value);
    target.closest("main")?.scrollTo({ top: 0, behavior: "smooth" });
  };
  const step = "grid size-10 shrink-0 place-items-center rounded-full bg-surface text-ink transition-colors hover:bg-subtle disabled:opacity-40";
  return (
    <nav className="flex items-center justify-center gap-1.5" aria-label={t("page.pagination")}>
      <button type="button" className={step} disabled={page <= 1} aria-label={t("page.prevPage")} onClick={(event) => go(page - 1, event.currentTarget)}>
        <Icon name="chevron-left" size={20} />
      </button>
      {pageList(page, pages).map((value, index) =>
        value === "gap" ? (
          <span key={`gap-${index}`} className="w-6 text-center text-body-sm text-ink-secondary">
            …
          </span>
        ) : (
          <button
            key={value}
            type="button"
            aria-current={value === page ? "page" : undefined}
            className={`grid size-10 shrink-0 place-items-center rounded-full text-body-sm font-semibold transition-colors ${
              value === page ? "bg-brand text-ink-inverse" : "bg-surface text-ink hover:bg-subtle"
            }`}
            onClick={(event) => go(value, event.currentTarget)}
          >
            {value}
          </button>
        )
      )}
      <button type="button" className={step} disabled={page >= pages} aria-label={t("page.nextPage")} onClick={(event) => go(page + 1, event.currentTarget)}>
        <Icon name="chevron-right" size={20} />
      </button>
    </nav>
  );
}
