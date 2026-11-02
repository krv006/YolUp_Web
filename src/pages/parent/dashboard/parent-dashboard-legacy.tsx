import { motion } from "framer-motion";
import { ArrowRight, CalendarCheck2, CheckCircle2, Clock3, Hourglass, Timer, UsersRound } from "lucide-react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/modules/auth";
import { ROUTES } from "@/shared/config";
import { useAttendance } from "@/modules/attendance";
import { useParentDashboard, useSelectedChild } from "@/modules/parent";
import { LoadingFallback, RouteState } from "@/shared/ui/legacy";

const metricIcons: Record<string, typeof UsersRound> = { children: UsersRound, requests: Hourglass, lessons: CheckCircle2, minutes: Timer };
export function ParentDashboardPage() {
  const { t } = useTranslation("parent");
  const { user } = useAuth(); const { selectedChildId, selectedChild, children, childrenQuery } = useSelectedChild(); const dashboard = useParentDashboard(selectedChildId);
  const attendance = useAttendance(selectedChildId ? { student: selectedChildId } : {}, Boolean(selectedChildId));
  if (childrenQuery.isLoading || dashboard.isLoading || attendance.isLoading) return <LoadingFallback label={t("dashboard.loading")} />;
  if (!childrenQuery.isError && !children.length)
    return <RouteState eyebrow={t("dashboard.eyebrow")} title={t("dashboard.noChildTitle")} description={t("dashboard.noChildDescription")} action={<Link className="button button--primary" to={ROUTES.parent.children}>{t("dashboard.noChildAction")}</Link>} />;
  if (childrenQuery.isError || dashboard.isError || attendance.isError) return <RouteState title={t("dashboard.loadError")} actionLabel={t("dashboard.retry")} onAction={() => { childrenQuery.refetch(); dashboard.refetch(); attendance.refetch(); }} />;
  return <div className="portal-page"><section className="portal-welcome parent-welcome"><div><span className="portal-eyebrow">{t("dashboard.eyebrow")}</span><h1>{t("dashboard.greeting", { name: user?.name?.split(" ")[0] })}</h1><p>{selectedChild ? t("dashboard.subtitleWithChild", { name: selectedChild.name }) : t("dashboard.subtitleNoChild")}</p></div><div className="welcome-orbit"><UsersRound size={29} /></div></section>
    <section className="portal-metric-grid">{(dashboard.data?.metrics ?? []).map((metric, index) => { const Icon = metricIcons[metric.id]; return <motion.article className={`portal-metric portal-metric--${["violet", "amber", "emerald", "rose"][index]}`} key={metric.id} initial={{ opacity: 0, y: 9 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}><span><Icon size={20} /></span><div><strong>{metric.value}</strong><small>{metric.label}</small></div></motion.article>; })}</section>
    <section className="portal-card parent-recent-card"><div className="portal-section-head"><div><span>{t("dashboard.recentActivityEyebrow")}</span><h2>{t("dashboard.attendanceTitle")}</h2></div><Link to={ROUTES.parent.attendance}>{t("dashboard.allAttendance")} <ArrowRight size={15} /></Link></div><div className="parent-activity-list">{(attendance.data ?? []).slice(0, 5).map((item) => <article key={item.id}><span><CalendarCheck2 size={18} /></span><div><strong>{item.lesson}</strong><small>{item.child} · {item.entered}</small></div><time><Clock3 size={14} /> {item.duration}</time></article>)}{!attendance.data?.length ? <p className="portal-muted">{t("dashboard.emptyAttendance")}</p> : null}</div></section>
  </div>;
}
