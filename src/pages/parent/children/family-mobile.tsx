import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { AddChildDialog, parentFamily } from "@/modules/parent";
import { ROUTES } from "@/shared/config";
import { formatRelativeShort } from "@/shared/lib";
import { useOnlineStatus } from "@/shared/model";
import { Icon } from "@/shared/ui/icon";
import { Avatar } from "@/shared/ui/legacy";
import { MobileTitleHeader, mobileRoundButton } from "@/shared/ui/mobile-page";
import { ParentErrorBanner } from "@/widgets/parent-shell";
import { MobileConnect } from "../dashboard/parent-home-mobile";
import { visitWhen } from "./family-format";
import { useParentFamily } from "./use-parent-family";

export function FamilyMobile() {
  const { t } = useTranslation("parent");
  const navigate = useNavigate();
  const online = useOnlineStatus();
  const family = useParentFamily("month");
  const [adding, setAdding] = useState(false);
  const empty = !family.loading && !family.rows.length && !family.pending.length && !family.failed;

  return (
    <div className="flex flex-col gap-4 px-4 pt-5">
      <MobileTitleHeader
        eyebrow={t("family.eyebrowBase")}
        title={t("family.title")}
        action={
          <button type="button" className={`${mobileRoundButton} bg-surface`} aria-label={t("switcher.add")} onClick={() => setAdding(true)}>
            <Icon name="person-add" size={22} />
          </button>
        }
      />
      {online && family.failed ? <ParentErrorBanner onRetry={family.retry} /> : null}
      {family.loading ? (
        <div className="flex flex-col gap-3" aria-hidden="true">
          {[0, 1].map((item) => (
            <span key={item} className="h-[172px] animate-pulse rounded-[20px] bg-surface" />
          ))}
        </div>
      ) : empty ? (
        <MobileConnect />
      ) : (
        <>
          {family.rows.map((row) => {
            const selected = row.child.id === family.selectedChildId;
            const tone =
              row.attendance === null ? "text-ink" : parentFamily.isGoodAttendance(row.attendance) ? "text-success-text" : "text-warning-text";
            return (
              <button
                key={row.child.id}
                type="button"
                className={`flex flex-col gap-3 rounded-[20px] border-2 bg-surface p-4 text-left ${selected ? "border-brand" : "border-transparent"}`}
                onClick={() => navigate(ROUTES.parent.child(row.child.id))}
              >
                <span className="flex items-center gap-3">
                  <Avatar name={row.child.name} src={row.child.avatarUrl ?? undefined} tone={row.child.avatarTone} size="md" className="shrink-0 [&_.avatar]:size-13" />
                  <span className="flex min-w-0 flex-1 flex-col">
                    <strong className="truncate text-title text-ink">{row.child.name}</strong>
                    <small className="truncate text-body-xs text-ink-secondary">{row.child.username}</small>
                  </span>
                  {selected ? (
                    <span className="flex shrink-0 items-center gap-1 rounded-full bg-success-bg px-2.5 py-1 text-caption-strong text-success-text">
                      <Icon name="check-circle" size={14} />
                      {t("family.selected")}
                    </span>
                  ) : (
                    <Icon name="chevron-right" size={20} className="shrink-0 text-icon-tertiary" />
                  )}
                </span>
                <span className={`grid grid-cols-3 rounded-2xl bg-subtle px-2 py-3 text-center ${row.loading ? "animate-pulse" : ""}`}>
                  {[
                    { value: row.attendance === null ? "—" : `${row.attendance}%`, label: t("family.stats.attendance"), tone },
                    { value: String(row.attended), label: t("family.stats.lessons"), tone: "text-ink" },
                    { value: row.score === null ? "—" : String(row.score), label: t("family.stats.score"), tone: "text-ink" },
                  ].map((stat) => (
                    <span key={stat.label} className="flex flex-col">
                      <strong className={`font-heading text-[20px]/7 font-semibold ${stat.tone}`}>{stat.value}</strong>
                      <small className="text-caption text-ink-secondary">{stat.label}</small>
                    </span>
                  ))}
                </span>
                {selected ? (
                  <small className="flex min-w-0 items-center gap-2 text-body-xs text-ink-secondary">
                    <Icon name="history" size={16} className="shrink-0 text-icon-tertiary" />
                    <span className="truncate">
                      {row.lastVisit
                        ? t("family.activity", { course: row.lastVisit.course, when: visitWhen(row.lastVisit.at, family.now, t) })
                        : t("family.noActivity")}
                    </span>
                  </small>
                ) : null}
              </button>
            );
          })}
          {family.pending.map((link) => (
            <span key={link.id} className="flex items-center gap-3 rounded-[20px] border-2 border-dashed border-line-strong px-4 py-4">
              <Avatar name={link.student.name} src={link.student.avatarUrl ?? undefined} size="md" className="shrink-0 [&_.avatar]:size-11" />
              <span className="flex min-w-0 flex-1 flex-col">
                <strong className="truncate text-title-sm text-ink">{link.student.name}</strong>
                <small className="truncate text-body-xs text-ink-secondary">{t("family.pending", { username: link.student.username })}</small>
              </span>
              <span className="flex shrink-0 items-center gap-1 rounded-full bg-accent-teal-bg px-2.5 py-1 text-caption-strong text-accent-teal-fg" title={formatRelativeShort(link.createdAt)}>
                <Icon name="schedule" size={14} />
                {t("switcher.pending")}
              </span>
            </span>
          ))}
        </>
      )}
      <AddChildDialog open={adding} onOpenChange={setAdding} />
    </div>
  );
}
