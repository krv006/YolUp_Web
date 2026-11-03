import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Navigate, useNavigate } from "react-router-dom";
import { useLoginHistory } from "@/modules/auth";
import { isConsentRequired, parentLogins, useSelectedChild, type DeviceKind, type LoginEntry, type LoginPeriod, type LoginTab } from "@/modules/parent";
import { ROUTES } from "@/shared/config";
import { formatLocalized, formatMessageTime } from "@/shared/lib";
import { AppDialog } from "@/shared/ui/app-dialog";
import { Icon } from "@/shared/ui/icon";
import { MobileChoiceChips } from "@/shared/ui/mobile-fields";
import { MobilePageHeader, mobileButton, mobileRoundButton } from "@/shared/ui/mobile-page";
import { ParentLockedCard } from "@/widgets/parent-shell";
import { LoginDetail } from "./child-logins";
import { ChildSessions } from "./child-sessions";
import { kindIcon } from "./login-format";

type Device = "all" | "phone" | "computer";
type Status = "all" | "suspicious";
const RADIUS = 24;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const KINDS: Record<Device, DeviceKind[]> = { all: ["phone", "tablet", "computer"], phone: ["phone", "tablet"], computer: ["computer"] };

export function ChildLoginsMobile({ childId }: { childId: string }) {
  const { t } = useTranslation("parent");
  const navigate = useNavigate();
  const { children, childrenQuery } = useSelectedChild();
  const child = children.find((item) => item.id === childId) ?? null;
  const history = useLoginHistory(childId, Boolean(child));
  const [now] = useState(() => Date.now());
  const [filter, setFilter] = useState<{ period: LoginPeriod; device: Device; status: Status }>({ period: "week", device: "all", status: "all" });
  const [draft, setDraft] = useState(filter);
  const [filterOpen, setFilterOpen] = useState(false);
  const [opened, setOpened] = useState<LoginEntry | null>(null);
  if (!childrenQuery.isLoading && !child && !childrenQuery.isError) return <Navigate to={ROUTES.parent.children} replace />;

  const logins: LoginEntry[] = history.data ?? [];
  const locked = isConsentRequired(history.error);
  const tab: LoginTab = filter.status === "suspicious" ? "suspicious" : filter.device === "all" ? "all" : filter.device;
  const visible = parentLogins.filterLogins(logins, { period: filter.period, tab, kinds: new Set(KINDS[filter.device]) }, now);
  const summary = parentLogins.loginSummary(logins, filter.period, now);
  const ok = summary.suspicious === 0;
  const today = new Date(now).toDateString();
  const yesterday = new Date(now - 86_400_000).toDateString();
  const groups = new Map<string, LoginEntry[]>();
  for (const entry of visible) {
    const key = new Date(entry.at).toDateString();
    groups.set(key, [...(groups.get(key) ?? []), entry]);
  }

  return (
    <div className="flex flex-col gap-4 px-4 pt-5 pb-10">
      <MobilePageHeader
        title={t("logins.title")}
        backLabel={t("profile.title")}
        onBack={() => navigate(ROUTES.parent.child(childId))}
        action={
          logins.length ? (
            <button
              type="button"
              className={mobileRoundButton}
              aria-label={t("logins.filter.title")}
              onClick={() => {
                setDraft(filter);
                setFilterOpen(true);
              }}
            >
              <Icon name="filter-list" size={22} />
            </button>
          ) : undefined
        }
      />

      {history.isLoading ? <span className="h-64 animate-pulse rounded-[20px] bg-surface" aria-hidden="true" /> : null}

      {locked && child ? <ParentLockedCard childId={child.id} childName={child.name} /> : null}

      {!history.isLoading && !logins.length && !locked ? (
        <div className="flex flex-col items-center gap-3 px-6 pt-24 text-center">
          <span className="grid size-18 place-items-center rounded-full bg-brand-subtle text-brand">
            <Icon name="devices" size={30} />
          </span>
          <strong className="font-heading text-[18px]/6 font-semibold text-ink">{t("logins.empty.title")}</strong>
          <p className="text-body-sm text-ink-secondary">{t("logins.empty.text")}</p>
        </div>
      ) : null}

      {logins.length ? (
        <>
          <section className="flex items-center gap-4 rounded-[20px] bg-surface px-4 py-4">
            <span className="relative grid size-14 shrink-0 place-items-center">
              <svg viewBox="0 0 56 56" className="absolute inset-0 -rotate-90" aria-hidden="true">
                <circle cx="28" cy="28" r={RADIUS} fill="none" strokeWidth="5" className={ok ? "stroke-success" : "stroke-warning-bg"} />
                {ok ? null : (
                  <circle
                    cx="28"
                    cy="28"
                    r={RADIUS}
                    fill="none"
                    strokeWidth="5"
                    strokeLinecap="round"
                    className="stroke-saffron"
                    strokeDasharray={`${Math.min(1, summary.suspicious / Math.max(summary.count, 1)) * CIRCUMFERENCE + 18} ${CIRCUMFERENCE}`}
                  />
                )}
              </svg>
              <strong className={`text-title ${ok ? "text-success-text" : "text-warning-text"}`}>{summary.suspicious}</strong>
            </span>
            <span className="flex min-w-0 flex-col">
              <strong className="text-title text-ink">
                {ok ? t("logins.summary.ok") : t("logins.summary.suspicious", { count: summary.suspicious })}
              </strong>
              <small className="text-body-xs text-ink-secondary">
                {t("logins.summary.stats", { period: t(`logins.periods.${filter.period}`), count: summary.count, devices: summary.devices })}
              </small>
            </span>
          </section>

          {child ? <ChildSessions childId={child.id} childName={child.name} enabled={!locked} /> : null}

          {[...groups.entries()].map(([key, entries]) => (
            <section key={key} className="flex flex-col gap-2">
              <small className="px-1 text-body-sm text-ink-secondary">
                {key === today ? t("logins.mobile.today") : key === yesterday ? t("logins.mobile.yesterday") : formatLocalized(entries[0].at, t("family.datePattern"))}
              </small>
              <ul className="flex flex-col overflow-hidden rounded-[20px] bg-surface">
                {entries.map((entry) => (
                  <li key={entry.id} className="border-b border-line last:border-b-0">
                    <button
                      type="button"
                      className={`flex w-full items-center gap-3 px-4 py-3.5 text-left ${entry.isNewDevice ? "bg-danger-bg" : ""}`}
                      onClick={() => setOpened(entry)}
                    >
                      <span className={`grid size-11 shrink-0 place-items-center rounded-xl ${entry.isNewDevice ? "text-error-text" : "bg-subtle text-icon-secondary"}`}>
                        <Icon name={kindIcon(entry)} size={22} />
                      </span>
                      <span className="flex min-w-0 flex-1 flex-col">
                        <strong className="truncate text-title-sm text-ink">{entry.device}</strong>
                        <small className="truncate text-body-xs text-ink-secondary">
                          {[entry.ip, entry.location, formatMessageTime(entry.at)].filter(Boolean).join(" · ")}
                        </small>
                      </span>
                      {entry.isNewDevice ? (
                        <span className="flex shrink-0 items-center gap-1 text-caption-strong text-error-text">
                          <Icon name="warning-fill" size={14} />
                          {t("logins.status.newDevice")}
                        </span>
                      ) : (
                        <small className="shrink-0 text-caption text-ink-tertiary">{formatMessageTime(entry.at)}</small>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          ))}
          {!visible.length ? <p className="rounded-[20px] bg-surface px-4 py-8 text-center text-body-sm text-ink-tertiary">{t("logins.filtered.text")}</p> : null}
        </>
      ) : null}

      <AppDialog
        open={filterOpen}
        onOpenChange={setFilterOpen}
        variant="sheet"
        title={t("logins.filter.title")}
        description={t("logins.mobile.filterHint")}
        footer={
          <>
            <button type="button" className={mobileButton.secondary} onClick={() => setDraft({ period: "week", device: "all", status: "all" })}>
              {t("logins.filter.clear")}
            </button>
            <button
              type="button"
              className={mobileButton.primary}
              onClick={() => {
                setFilter(draft);
                setFilterOpen(false);
              }}
            >
              {t("logins.filter.apply")}
            </button>
          </>
        }
      >
        <div className="flex flex-col gap-4 pb-2">
          <section className="flex flex-col gap-2">
            <small className="text-body-sm font-medium text-ink">{t("logins.filter.period")}</small>
            <MobileChoiceChips
              items={["today", "week", "month"] as const}
              render={(id) => t(`logins.filter.periodShort.${id}`)}
              value={draft.period}
              onChange={(period) => setDraft((current) => ({ ...current, period }))}
            />
          </section>
          <section className="flex flex-col gap-2">
            <small className="text-body-sm font-medium text-ink">{t("logins.filter.kinds")}</small>
            <MobileChoiceChips
              items={["all", "phone", "computer"] as const}
              render={(id) => (id === "all" ? t("logins.tabs.all") : t(`logins.filter.kind.${id}`))}
              value={draft.device}
              onChange={(device) => setDraft((current) => ({ ...current, device }))}
            />
          </section>
          <section className="flex flex-col gap-2">
            <small className="text-body-sm font-medium text-ink">{t("logins.columns.status")}</small>
            <MobileChoiceChips
              items={["all", "suspicious"] as const}
              render={(id) => t(`logins.tabs.${id}`)}
              value={draft.status}
              onChange={(status) => setDraft((current) => ({ ...current, status }))}
            />
          </section>
        </div>
      </AppDialog>
      <LoginDetail entry={opened} childId={childId} childName={child?.name ?? ""} onClose={() => setOpened(null)} />
    </div>
  );
}
