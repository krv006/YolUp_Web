import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { parentFamily, type ParentLink } from "@/modules/parent";
import { ROUTES } from "@/shared/config";
import { formatRelativeShort } from "@/shared/lib";
import { Icon } from "@/shared/ui/icon";
import { Avatar } from "@/shared/ui/legacy";
import { visitWhen } from "./family-format";
import type { FamilyChild } from "./use-parent-family";

const BUTTON =
  "flex h-11 items-center justify-center rounded-full px-4 text-button transition-colors disabled:opacity-50";

function Stat({ value, label, tone = "text-ink" }: { value: string; label: string; tone?: string }) {
  return (
    <span className="flex flex-col items-center gap-0.5">
      <strong className={`font-heading text-[20px]/7 font-semibold ${tone}`}>{value}</strong>
      <small className="text-caption text-ink-secondary">{label}</small>
    </span>
  );
}

export function ChildCard({
  row,
  selected,
  now,
  onSelect,
}: {
  row: FamilyChild;
  selected: boolean;
  now: number;
  onSelect: () => void;
}) {
  const { t } = useTranslation("parent");
  const navigate = useNavigate();
  const { child } = row;
  const tone =
    row.attendance === null
      ? "text-ink"
      : parentFamily.isGoodAttendance(row.attendance)
        ? "text-success-text"
        : "text-warning-text";

  return (
    <article
      className={`flex flex-col gap-4 rounded-[20px] border-2 bg-surface p-5 ${selected ? "border-brand" : "border-transparent"}`}
    >
      <div className="flex items-center gap-3">
        <Avatar
          name={child.name}
          src={child.avatarUrl ?? undefined}
          tone={child.avatarTone}
          size="md"
          className="shrink-0 [&_.avatar]:size-14"
        />
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <strong className="truncate text-title text-ink">{child.name}</strong>
          <small className="truncate text-body-xs text-ink-secondary">
            {child.username}
            {row.groups !== null ? ` · ${t("family.groups", { count: row.groups })}` : ""}
          </small>
        </div>
        {selected ? (
          <span className="flex shrink-0 items-center gap-1 rounded-full bg-success-bg px-2.5 py-1 text-caption-strong text-success-text">
            <Icon name="check-circle" size={14} />
            {t("family.selected")}
          </span>
        ) : null}
      </div>

      <div className={`grid grid-cols-3 rounded-2xl bg-subtle px-2 py-3 ${row.loading ? "animate-pulse" : ""}`}>
        <Stat
          value={row.attendance === null ? "—" : `${row.attendance}%`}
          label={t("family.stats.attendance")}
          tone={tone}
        />
        <Stat value={String(row.attended)} label={t("family.stats.lessons")} />
        <Stat value={row.score === null ? "—" : String(row.score)} label={t("family.stats.score")} />
      </div>

      <p className="flex min-w-0 items-center gap-2 text-body-xs text-ink-secondary">
        <Icon name="history" size={16} className="shrink-0 text-icon-tertiary" />
        <span className="truncate">
          {row.lastVisit
            ? t("family.activity", { course: row.lastVisit.course, when: visitWhen(row.lastVisit.at, now, t) })
            : t("family.noActivity")}
        </span>
      </p>

      <div className="mt-auto grid grid-cols-2 gap-3">
        <button
          type="button"
          className={`${BUTTON} border border-line-strong bg-surface text-ink hover:bg-subtle`}
          onClick={() => navigate(ROUTES.parent.child(child.id))}
        >
          {t("family.profile")}
        </button>
        <button
          type="button"
          className={`${BUTTON} bg-brand-subtle text-brand hover:opacity-85`}
          onClick={() => (selected ? navigate(ROUTES.parent.attendance) : onSelect())}
        >
          {selected ? t("family.attendance") : t("family.choose")}
        </button>
      </div>
    </article>
  );
}

export function PendingCard({ link }: { link: ParentLink }) {
  const { t } = useTranslation("parent");
  return (
    <article className="flex flex-col items-center justify-center gap-2 rounded-[20px] border-2 border-dashed border-line-strong px-5 py-6 text-center">
      <Avatar
        name={link.student.name}
        src={link.student.avatarUrl ?? undefined}
        size="md"
        className="[&_.avatar]:size-14"
      />
      <strong className="mt-1 text-title text-ink">{link.student.name}</strong>
      <small className="text-body-xs text-ink-secondary">{t("family.pending", { username: link.student.username })}</small>
      <span className="mt-1 flex items-center gap-1 rounded-full bg-accent-teal-bg px-2.5 py-1 text-caption-strong text-accent-teal-fg">
        <Icon name="schedule" size={14} />
        {t("home.pending.chip", { time: formatRelativeShort(link.createdAt) })}
      </span>
    </article>
  );
}

export function AddMoreCard({ onAdd }: { onAdd: () => void }) {
  const { t } = useTranslation("parent");
  return (
    <section className="flex items-center gap-4 rounded-[20px] border-2 border-dashed border-line-strong px-5 py-4">
      <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-brand-subtle text-brand">
        <Icon name="person-add" size={24} />
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <strong className="text-title-sm text-ink">{t("family.addMore.title")}</strong>
        <small className="text-body-sm text-ink-secondary">{t("family.addMore.description")}</small>
      </span>
      <button
        type="button"
        className="flex h-11 shrink-0 items-center gap-2 rounded-full bg-brand px-5 text-button text-on-action transition-colors hover:bg-brand-strong"
        onClick={onAdd}
      >
        <Icon name="add" size={20} />
        {t("family.addMore.action")}
      </button>
    </section>
  );
}
