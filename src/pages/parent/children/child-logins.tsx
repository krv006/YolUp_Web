import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, Navigate } from "react-router-dom";
import { useLoginHistory } from "@/modules/auth";
import {
  parentLogins,
  useSelectedChild,
  type DeviceKind,
  type LoginEntry,
  type LoginPeriod,
  type LoginTab,
} from "@/modules/parent";
import { ROUTES } from "@/shared/config";
import { formatDayTime } from "@/shared/lib";
import { useOnlineStatus } from "@/shared/model";
import { AppDialog } from "@/shared/ui/app-dialog";
import { Icon } from "@/shared/ui/icon";
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/ui/popover";
import { ParentErrorBanner, ParentPageHeader } from "@/widgets/parent-shell";
import { visitWhen } from "./family-format";

const TABS: LoginTab[] = ["all", "phone", "computer", "suspicious"];
const PERIODS: LoginPeriod[] = ["today", "week", "month"];
const KINDS: DeviceKind[] = ["phone", "computer", "tablet"];
const HEAD = "px-3 pb-3 text-left text-caption-strong tracking-wide text-ink-tertiary uppercase first:pl-5";
const RADIUS = 40;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function kindIcon(entry: LoginEntry): string {
  return parentLogins.deviceKind(entry.userAgent) === "computer" ? "laptop" : "smartphone";
}

function StatusCell({ entry }: { entry: LoginEntry }) {
  const { t } = useTranslation("parent");
  if (entry.isNewDevice)
    return (
      <span className="inline-flex items-center gap-1 text-caption-strong text-error-text">
        <Icon name="warning-fill" size={14} />
        {t("logins.status.newDevice")}
      </span>
    );
  if (entry.isNewIp)
    return (
      <span className="inline-flex rounded-full bg-warning-bg px-2.5 py-1 text-caption-strong text-warning-text">
        {t("logins.status.newIp")}
      </span>
    );
  return (
    <span className="inline-flex rounded-full bg-subtle px-2.5 py-1 text-caption-strong text-ink-secondary">
      {t("logins.status.known")}
    </span>
  );
}

function FilterPopover({
  period,
  kinds,
  onApply,
}: {
  period: LoginPeriod;
  kinds: Set<DeviceKind>;
  onApply: (period: LoginPeriod, kinds: Set<DeviceKind>) => void;
}) {
  const { t } = useTranslation("parent");
  const [open, setOpen] = useState(false);
  const [draftPeriod, setDraftPeriod] = useState(period);
  const [draftKinds, setDraftKinds] = useState(kinds);

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        if (next) {
          setDraftPeriod(period);
          setDraftKinds(new Set(kinds));
        }
        setOpen(next);
      }}
    >
      <PopoverTrigger asChild>
        <button
          type="button"
          className={`flex h-11 shrink-0 items-center gap-2 rounded-full border px-4 text-button transition-colors ${
            kinds.size < KINDS.length ? "border-brand bg-brand-subtle text-brand" : "border-line-strong bg-surface text-ink hover:bg-subtle"
          }`}
        >
          <Icon name="filter-list" size={18} />
          {t("logins.filter.title")}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" sideOffset={8} className="w-[300px] rounded-3xl border border-line bg-surface p-5 text-ink shadow-xl">
        <div className="flex flex-col gap-4">
          <section className="flex flex-col gap-2">
            <small className="text-caption-strong tracking-wide text-ink-tertiary uppercase">{t("logins.filter.period")}</small>
            <div className="grid grid-cols-3 gap-2">
              {PERIODS.map((item) => (
                <button
                  key={item}
                  type="button"
                  className={`flex h-10 items-center justify-center rounded-full border text-body-sm font-medium transition-colors ${
                    draftPeriod === item ? "border-brand bg-brand text-on-action" : "border-line-strong text-ink hover:bg-subtle"
                  }`}
                  onClick={() => setDraftPeriod(item)}
                >
                  {t(`logins.filter.periodShort.${item}`)}
                </button>
              ))}
            </div>
          </section>
          <section className="flex flex-col gap-1">
            <small className="text-caption-strong tracking-wide text-ink-tertiary uppercase">{t("logins.filter.kinds")}</small>
            {KINDS.map((kind) => {
              const checked = draftKinds.has(kind);
              return (
                <button
                  key={kind}
                  type="button"
                  role="checkbox"
                  aria-checked={checked}
                  className="flex h-11 items-center gap-3 rounded-xl px-1 text-left text-body-sm text-ink transition-colors hover:bg-subtle"
                  onClick={() =>
                    setDraftKinds((current) => {
                      const next = new Set(current);
                      if (next.has(kind)) next.delete(kind);
                      else next.add(kind);
                      return next;
                    })
                  }
                >
                  <span
                    className={`grid size-5 place-items-center rounded-md border-2 ${
                      checked ? "border-brand bg-brand text-on-action" : "border-line-strong"
                    }`}
                  >
                    {checked ? <Icon name="check" size={14} /> : null}
                  </span>
                  {t(`logins.filter.kind.${kind}`)}
                </button>
              );
            })}
          </section>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              className="flex h-11 items-center justify-center rounded-full text-button text-brand transition-colors hover:bg-brand-subtle"
              onClick={() => {
                setDraftPeriod("week");
                setDraftKinds(new Set(KINDS));
              }}
            >
              {t("logins.filter.clear")}
            </button>
            <button
              type="button"
              className="flex h-11 items-center justify-center rounded-full bg-brand text-button text-on-action transition-colors hover:bg-brand-strong disabled:opacity-40"
              disabled={!draftKinds.size}
              onClick={() => {
                onApply(draftPeriod, draftKinds);
                setOpen(false);
              }}
            >
              {t("logins.filter.apply")}
            </button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function LoginDetail({ entry, childName, onClose }: { entry: LoginEntry | null; childName: string; onClose: () => void }) {
  const { t } = useTranslation("parent");
  const [browser, system] = (entry?.device ?? "").split(" · ");
  const first = childName.split(" ")[0] || childName;
  const rows = entry
    ? [
        { label: t("logins.detail.device"), value: system || entry.device },
        { label: t("logins.detail.browser"), value: system ? browser : "—" },
        { label: t("logins.detail.ip"), value: entry.ip || "—" },
        { label: t("logins.detail.location"), value: entry.location || "—" },
        { label: t("logins.detail.time"), value: formatDayTime(entry.at) },
      ]
    : [];

  return (
    <AppDialog
      open={Boolean(entry)}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      variant="panel"
      width="lg:w-115"
      icon={
        <span
          className={`grid size-12 place-items-center rounded-2xl ${
            entry?.isNewDevice ? "bg-danger-bg text-error-text" : "bg-brand-subtle text-brand"
          }`}
        >
          <Icon name={entry ? kindIcon(entry) : "smartphone"} size={24} />
        </span>
      }
      title={entry?.isNewDevice ? t("logins.detail.newTitle") : t("logins.detail.title")}
      description={entry ? t("logins.detail.subtitle", { name: first, when: formatDayTime(entry.at) }) : ""}
      titleClassName="font-heading text-[20px]/7 font-semibold"
      footerClassName="justify-end px-5 pt-4 pb-5"
      footer={
        <button
          type="button"
          className="flex h-11 items-center rounded-full border border-line-strong bg-surface px-5 text-button text-ink transition-colors hover:bg-subtle"
          onClick={onClose}
        >
          {t("logins.detail.close")}
        </button>
      }
    >
      {entry ? (
        <div className="flex flex-col gap-4 pb-2">
          <section className="flex h-[140px] flex-col items-center justify-center gap-2 rounded-2xl bg-page-gradient text-center">
            <span className="grid size-10 place-items-center rounded-full bg-surface text-error-text shadow-sm">
              <Icon name="location-on" size={22} />
            </span>
            <small className="text-caption text-ink-secondary">{entry.location || t("logins.detail.unknownLocation")}</small>
          </section>
          <dl className="flex flex-col gap-3 rounded-2xl bg-subtle px-4 py-4">
            {rows.map((row) => (
              <div key={row.label} className="flex items-center justify-between gap-4">
                <dt className="text-body-sm text-ink-secondary">{row.label}</dt>
                <dd className="truncate text-body-sm font-medium text-ink">{row.value}</dd>
              </div>
            ))}
          </dl>
          {entry.isNewDevice ? (
            <p className="flex items-start gap-3 rounded-2xl bg-danger-bg px-4 py-3 text-body-sm text-error-text">
              <Icon name="shield" size={20} className="mt-px shrink-0" />
              {t("logins.detail.warning", { name: first })}
            </p>
          ) : null}
        </div>
      ) : null}
    </AppDialog>
  );
}

export function ChildLogins({ childId }: { childId: string }) {
  const { t } = useTranslation("parent");
  const online = useOnlineStatus();
  const { children, childrenQuery } = useSelectedChild();
  const child = children.find((item) => item.id === childId) ?? null;
  const history = useLoginHistory(childId, Boolean(child));
  const [now] = useState(() => Date.now());
  const [tab, setTab] = useState<LoginTab>("all");
  const [period, setPeriod] = useState<LoginPeriod>("week");
  const [kinds, setKinds] = useState<Set<DeviceKind>>(() => new Set(KINDS));
  const [opened, setOpened] = useState<LoginEntry | null>(null);

  if (!childrenQuery.isLoading && !child && !childrenQuery.isError) return <Navigate to={ROUTES.parent.children} replace />;

  const logins: LoginEntry[] = history.data ?? [];
  const visible = parentLogins.filterLogins(logins, { period, tab, kinds }, now);
  const summary = parentLogins.loginSummary(logins, period, now);
  const ok = summary.suspicious === 0;
  const ring = ok ? 1 : Math.min(1, summary.suspicious / Math.max(summary.count, 1));

  return (
    <div className="flex flex-col gap-6 px-8 py-7">
      <ParentPageHeader
        eyebrow={
          <>
            <Link to={ROUTES.parent.children} className="shrink-0 transition-colors hover:text-ink">
              {t("profile.breadcrumb")}
            </Link>
            {child ? (
              <>
                <Icon name="chevron-right" size={14} className="shrink-0 text-icon-tertiary" />
                <Link to={ROUTES.parent.child(child.id)} className="truncate text-ink transition-colors hover:text-brand">
                  {child.name}
                </Link>
              </>
            ) : null}
          </>
        }
        title={t("logins.title")}
      />

      {online && history.isError ? <ParentErrorBanner onRetry={() => void history.refetch()} /> : null}

      <div className="grid grid-cols-[minmax(0,1fr)_320px] items-start gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="flex min-w-0 flex-col gap-4">
          <div className="flex items-center gap-2">
            {TABS.map((item) => (
              <button
                key={item}
                type="button"
                className={`flex h-11 shrink-0 items-center rounded-full border px-5 text-button transition-colors ${
                  tab === item ? "border-brand bg-brand text-on-action" : "border-line-strong bg-surface text-ink hover:bg-subtle"
                }`}
                onClick={() => setTab(item)}
              >
                {t(`logins.tabs.${item}`)}
              </button>
            ))}
            <span className="flex-1" />
            <span className="flex h-11 shrink-0 items-center gap-2 rounded-full border border-line-strong bg-surface px-4 text-button text-ink">
              <Icon name="calendar-month" size={18} />
              {t(`logins.periods.${period}`)}
            </span>
            <FilterPopover
              period={period}
              kinds={kinds}
              onApply={(nextPeriod, nextKinds) => {
                setPeriod(nextPeriod);
                setKinds(nextKinds);
              }}
            />
          </div>

          <section className={`overflow-hidden rounded-[20px] bg-surface pt-5 ${history.isLoading ? "animate-pulse" : ""}`}>
            <table className="w-full table-fixed border-collapse">
              <colgroup>
                <col className="w-[29%]" />
                <col className="w-[17%]" />
                <col className="w-[15%]" />
                <col className="w-[21%]" />
                <col />
              </colgroup>
              <thead>
                <tr className="border-b border-line">
                  {(["device", "ip", "location", "time", "status"] as const).map((column) => (
                    <th key={column} className={HEAD}>
                      {t(`logins.columns.${column}`)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visible.map((entry) => (
                  <tr
                    key={entry.id}
                    tabIndex={0}
                    className={`cursor-pointer border-b border-line transition-colors last:border-b-0 focus-visible:outline-none ${
                      entry.isNewDevice ? "bg-danger-bg hover:opacity-90" : "hover:bg-subtle focus-visible:bg-subtle"
                    }`}
                    onClick={() => setOpened(entry)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        setOpened(entry);
                      }
                    }}
                  >
                    <td className="py-3.5 pr-3 pl-5">
                      <span className="flex min-w-0 items-center gap-3">
                        <span
                          className={`grid size-9 shrink-0 place-items-center rounded-lg ${
                            entry.isNewDevice ? "text-error-text" : "bg-subtle text-icon-secondary"
                          }`}
                        >
                          <Icon name={kindIcon(entry)} size={20} />
                        </span>
                        <strong className="truncate text-title-sm text-ink">{entry.device}</strong>
                      </span>
                    </td>
                    <td className="truncate px-3 text-body-sm text-ink">{entry.ip || "—"}</td>
                    <td className="truncate px-3 text-body-sm text-ink">{entry.location || "—"}</td>
                    <td className="truncate px-3 text-body-sm text-ink">{visitWhen(entry.at, now, t, true)}</td>
                    <td className="px-3">
                      <StatusCell entry={entry} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!history.isLoading && !visible.length ? (
              <div className="flex flex-col items-center gap-3 px-6 pt-8 pb-12 text-center">
                <span className="grid size-16 place-items-center rounded-full bg-brand-subtle text-brand">
                  <Icon name="devices" size={30} />
                </span>
                <strong className="font-heading text-[18px]/6 font-semibold text-ink">
                  {logins.length ? t("logins.filtered.title") : t("logins.empty.title")}
                </strong>
                <p className="max-w-[300px] text-body-sm text-ink-secondary">
                  {logins.length ? t("logins.filtered.text") : t("logins.empty.text")}
                </p>
              </div>
            ) : null}
          </section>
        </div>

        <div className="flex min-w-0 flex-col gap-5">
          <section className="flex flex-col items-center gap-3 rounded-[20px] bg-surface p-6 text-center">
            <span className="relative grid size-24 place-items-center">
              <svg viewBox="0 0 96 96" className="absolute inset-0 -rotate-90" aria-hidden="true">
                <circle cx="48" cy="48" r={RADIUS} fill="none" strokeWidth="8" className={ok ? "stroke-success" : "stroke-danger-bg"} />
                {ok ? null : (
                  <circle
                    cx="48"
                    cy="48"
                    r={RADIUS}
                    fill="none"
                    strokeWidth="8"
                    strokeLinecap="round"
                    className="stroke-danger"
                    strokeDasharray={`${ring * CIRCUMFERENCE} ${CIRCUMFERENCE}`}
                  />
                )}
              </svg>
              <strong className={`font-heading text-[26px]/8 font-semibold ${ok ? "text-success-text" : "text-error-text"}`}>
                {summary.suspicious}
              </strong>
            </span>
            <strong className="text-title text-ink">
              {ok ? t("logins.summary.ok") : t("logins.summary.suspicious", { count: summary.suspicious })}
            </strong>
            <small className="text-body-sm text-ink-secondary">
              {t("logins.summary.stats", {
                period: t(`logins.periods.${period}`),
                count: summary.count,
                devices: summary.devices,
              })}
            </small>
            {ok ? null : (
              <button
                type="button"
                className="mt-1 flex h-11 w-full items-center justify-center gap-2 rounded-full bg-danger-bg text-button text-error-text transition-opacity hover:opacity-85"
                onClick={() => setTab("suspicious")}
              >
                <Icon name="shield" size={18} />
                {t("logins.summary.show")}
              </button>
            )}
          </section>
          <section className="flex flex-col gap-1 rounded-[20px] bg-brand-subtle px-5 py-4">
            <strong className="text-title-sm text-brand">{t("logins.tip.title")}</strong>
            <small className="text-body-sm text-brand">{t("logins.tip.text")}</small>
          </section>
        </div>
      </div>

      <LoginDetail entry={opened} childName={child?.name ?? ""} onClose={() => setOpened(null)} />
    </div>
  );
}
