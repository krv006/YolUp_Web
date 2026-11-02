import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { CreateChildDialog, LinkChildDialog, AddChildDialog, type ParentLink } from "@/modules/parent";
import { ROUTES } from "@/shared/config";
import { formatDayTime, formatLocalized, formatRelativeShort } from "@/shared/lib";
import { Icon } from "@/shared/ui/icon";
import { Avatar } from "@/shared/ui/legacy";
import { ChildChips, ParentErrorBanner, ParentMobileHeader } from "@/widgets/parent-shell";
import { HomeHero } from "./home-hero";
import { HomeRecent } from "./home-recent";
import { AttentionCard } from "./home-side";
import { useParentHome } from "./use-parent-home";

const RADIUS = 52;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const BLOCK = "rounded-full bg-skeleton";

function Delta({ value, suffix = "" }: { value: number | null; suffix?: string }) {
  if (!value) return null;
  return (
    <span className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-caption-strong ${value > 0 ? "bg-success-bg text-success-text" : "bg-danger-bg text-error-text"}`}>
      <Icon name="trending-up" size={14} />
      {value > 0 ? "+" : ""}
      {value}
      {suffix}
    </span>
  );
}

function MobileStats({ view, now }: { view: NonNullable<ReturnType<typeof useParentHome>["view"]>; now: number }) {
  const { t } = useTranslation("parent");
  const percent = view.month.percent;
  return (
    <div className="grid grid-cols-2 gap-3">
      <Link to={ROUTES.parent.attendance} className="row-span-2 flex flex-col gap-3 rounded-[20px] bg-surface p-4">
        <span className="flex items-center justify-between gap-2">
          <strong className="text-title-sm text-ink">{t("home.stats.attendance")}</strong>
          <Delta value={view.month.delta} suffix="%" />
        </span>
        <span className="relative mx-auto grid size-[124px] place-items-center">
          <svg viewBox="0 0 124 124" className="absolute inset-0 -rotate-90" aria-hidden="true">
            <circle cx="62" cy="62" r={RADIUS} fill="none" strokeWidth="12" className="stroke-success-bg" />
            {percent !== null ? (
              <circle
                cx="62"
                cy="62"
                r={RADIUS}
                fill="none"
                strokeWidth="12"
                strokeLinecap="round"
                className="stroke-success"
                strokeDasharray={`${(percent / 100) * CIRCUMFERENCE} ${CIRCUMFERENCE}`}
              />
            ) : null}
          </svg>
          <strong className="font-heading text-[26px]/8 font-semibold text-ink">{percent === null ? "—" : `${percent}%`}</strong>
        </span>
        <small className="text-center text-caption text-ink-secondary">
          {formatLocalized(now, t("home.monthPattern"))} · {t("mobile.stats.lessons", { attended: view.month.attended, total: view.month.total })}
        </small>
      </Link>
      <Link to={ROUTES.parent.grades} className="flex flex-col gap-2 rounded-[20px] bg-surface p-4">
        <span className="flex items-center justify-between">
          <span className="grid size-9 place-items-center rounded-xl bg-accent-violet-bg text-accent-violet-fg">
            <Icon name="emoji-events" size={20} />
          </span>
          <Delta value={view.score.delta} />
        </span>
        <strong className="font-heading text-[22px]/7 font-semibold text-ink">{view.score.average ?? "—"}</strong>
        <small className="text-caption text-ink-secondary">{t("home.stats.score")}</small>
      </Link>
      <Link to={ROUTES.parent.homework} className="flex flex-col gap-2 rounded-[20px] bg-surface p-4">
        <span className="flex items-center justify-between">
          <span className="grid size-9 place-items-center rounded-xl bg-accent-saffron-bg text-accent-saffron-fg">
            <Icon name="assignment" size={20} />
          </span>
          {view.homework.remaining ? (
            <span className="rounded-full bg-warning-bg px-2 py-0.5 text-caption-strong text-warning-text">
              {t("home.stats.homeworkLeft", { count: view.homework.remaining })}
            </span>
          ) : null}
        </span>
        <strong className="font-heading text-[22px]/7 font-semibold text-ink">
          {view.homework.submitted} / {view.homework.total}
        </strong>
        <small className="text-caption text-ink-secondary">{t("home.stats.homework")}</small>
      </Link>
    </div>
  );
}

function MobileSkeleton() {
  return (
    <div className="flex flex-col gap-4" aria-hidden="true">
      <div className="flex gap-2">
        <span className="h-11 w-30 rounded-full bg-skeleton" />
        <span className="h-11 w-26 rounded-full bg-skeleton" />
        <span className="size-11 rounded-full bg-skeleton" />
      </div>
      <div className="flex flex-col gap-3 rounded-3xl bg-surface p-5">
        <span className={`h-6 w-28 ${BLOCK}`} />
        <span className={`h-5 w-4/5 ${BLOCK}`} />
        <span className={`h-4 w-3/5 ${BLOCK}`} />
        <span className="grid grid-cols-7 gap-2">
          {Array.from({ length: 7 }, (_, index) => (
            <span key={index} className="h-12 rounded-xl bg-skeleton" />
          ))}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <span className="row-span-2 h-[230px] rounded-[20px] bg-surface" />
        <span className="h-[110px] rounded-[20px] bg-surface" />
        <span className="h-[110px] rounded-[20px] bg-surface" />
      </div>
    </div>
  );
}

export function MobileConnect() {
  const { t } = useTranslation("parent");
  const [dialog, setDialog] = useState<"link" | "create" | null>(null);
  const steps = t("home.connect.steps", { returnObjects: true }) as Array<{ title: string; description: string }>;
  return (
    <div className="flex flex-col gap-3">
      <section className="flex flex-col items-center gap-3 rounded-3xl bg-surface px-5 py-6 text-center">
        <span className="relative grid size-28 place-items-center rounded-full bg-brand-subtle">
          <span className="grid size-18 place-items-center rounded-full bg-gradient-to-b from-line-strong to-ink-tertiary font-heading text-[28px] font-bold text-on-action">?</span>
          <span className="absolute -right-1 bottom-1 grid size-11 place-items-center rounded-full border-4 border-surface bg-brand text-on-action">
            <Icon name="person-add" size={20} />
          </span>
        </span>
        <h2 className="font-heading text-[20px]/7 font-semibold text-ink">{t("home.connect.title")}</h2>
        <p className="text-body-sm text-ink-secondary">{t("home.connect.description")}</p>
      </section>
      {(["link", "create"] as const).map((kind) => (
        <button
          key={kind}
          type="button"
          className="flex items-center gap-3 rounded-[20px] bg-surface px-4 py-4 text-left"
          onClick={() => setDialog(kind)}
        >
          <span className={`grid size-12 shrink-0 place-items-center rounded-2xl ${kind === "link" ? "bg-brand-subtle text-brand" : "bg-accent-green-bg text-accent-green-fg"}`}>
            <Icon name={kind === "link" ? "link" : "person-add"} size={24} />
          </span>
          <span className="flex min-w-0 flex-1 flex-col">
            <strong className="text-title text-ink">{t(`addChild.${kind}Title`)}</strong>
            <small className="text-body-xs text-ink-secondary">{t(`mobile.connect.${kind}`)}</small>
          </span>
          <Icon name="chevron-right" size={20} className="shrink-0 text-icon-tertiary" />
        </button>
      ))}
      <section className="flex flex-col gap-3 rounded-[20px] bg-surface px-4 py-4">
        <strong className="text-title-sm text-ink">{t("mobile.connect.how")}</strong>
        {steps.slice(0, 2).map((step, index) => (
          <span key={step.title} className="flex items-start gap-3">
            <span className="grid size-7 shrink-0 place-items-center rounded-full bg-brand-subtle text-caption-strong text-brand">{index + 1}</span>
            <span className="flex flex-col">
              <strong className="text-title-sm text-ink">{step.title}</strong>
              <small className="text-body-xs text-ink-secondary">{step.description}</small>
            </span>
          </span>
        ))}
      </section>
      <LinkChildDialog open={dialog === "link"} onOpenChange={(open) => setDialog(open ? "link" : null)} />
      <CreateChildDialog open={dialog === "create"} onOpenChange={(open) => setDialog(open ? "create" : null)} />
    </div>
  );
}

function MobilePending({ link }: { link: ParentLink }) {
  const { t } = useTranslation("parent");
  const [adding, setAdding] = useState(false);
  return (
    <div className="flex flex-col gap-3">
      <section className="flex flex-col items-center gap-3 rounded-3xl bg-surface px-5 py-6 text-center">
        <span className="flex items-center gap-2">
          <Avatar name={link.parent.name} src={link.parent.avatarUrl ?? undefined} size="lg" className="[&_.avatar]:size-14" />
          <span className="h-px w-4 border-t-2 border-dashed border-line-strong" />
          <span className="grid size-8 place-items-center rounded-full bg-accent-teal-bg text-accent-teal-fg">
            <Icon name="hourglass-empty" size={16} />
          </span>
          <span className="h-px w-4 border-t-2 border-dashed border-line-strong" />
          <Avatar name={link.student.name} src={link.student.avatarUrl ?? undefined} size="lg" className="[&_.avatar]:size-14" />
        </span>
        <h2 className="font-heading text-[20px]/7 font-semibold text-ink">{t("mobile.pending.title")}</h2>
        <p className="text-body-sm text-ink-secondary">{t("mobile.pending.text", { username: link.student.username, name: link.student.name })}</p>
        <span className="flex items-center gap-1 rounded-full bg-accent-teal-bg px-2.5 py-1 text-caption-strong text-accent-teal-fg">
          <Icon name="schedule" size={14} />
          {t("home.pending.chip", { time: formatRelativeShort(link.createdAt) })}
        </span>
      </section>
      <button type="button" className="flex items-center gap-3 rounded-[20px] bg-surface px-4 py-4 text-left" onClick={() => setAdding(true)}>
        <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-accent-green-bg text-accent-green-fg">
          <Icon name="person-add" size={24} />
        </span>
        <span className="flex min-w-0 flex-1 flex-col">
          <strong className="text-title text-ink">{t("home.pending.addAnother")}</strong>
          <small className="text-body-xs text-ink-secondary">{t("home.pending.addAnotherHint")}</small>
        </span>
        <Icon name="chevron-right" size={20} className="shrink-0 text-icon-tertiary" />
      </button>
      <AddChildDialog open={adding} onOpenChange={setAdding} />
    </div>
  );
}

export function ParentHomeMobile() {
  const { t } = useTranslation("parent");
  const home = useParentHome();
  const { status, child, view, now } = home;
  const ready = status === "ready" && !home.sectionsLoading && view && child;

  return (
    <div className="flex flex-col gap-4 px-4 pt-5">
      <ParentMobileHeader />
      {home.online && home.failed && (status === "ready" || status === "error") ? <ParentErrorBanner onRetry={home.retry} /> : null}
      {!home.online && status === "ready" ? (
        <p className="flex items-center gap-3 rounded-2xl bg-surface-inverse px-4 py-3 text-body-sm text-ink-inverse">
          <Icon name="wifi" size={20} className="shrink-0" />
          <span className="min-w-0 flex-1">{t("mobile.offline", { time: formatDayTime(home.lastUpdated || now) })}</span>
        </p>
      ) : null}
      {status === "ready" && home.online ? <ChildChips /> : null}
      {status === "connect" ? <MobileConnect /> : null}
      {status === "pending" && home.pendingLink ? <MobilePending link={home.pendingLink} /> : null}
      {status === "loading" || status === "error" || (status === "ready" && home.sectionsLoading) ? <MobileSkeleton /> : null}
      {ready ? (
        <div className={`flex flex-col gap-4 ${home.online ? "" : "pointer-events-none opacity-55"}`}>
          <HomeHero childName={child.name} hero={view.hero} week={view.week} todayCount={view.todayCount} teachers={home.teachers} now={now} compact />
          <MobileStats view={view} now={now} />
          <AttentionCard items={view.attention} childId={child.id} now={now} />
          <HomeRecent items={view.recent} now={now} />
        </div>
      ) : null}
    </div>
  );
}
