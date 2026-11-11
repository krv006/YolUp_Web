import { useEffect, useState, type ReactNode } from "react";
import { ArrowLeft, BarChart3, ShieldCheck, Users } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { useApproveTeacher, usePendingTeachers, useSetTeacherTestAccess, useTeachers } from "@/modules/auth";
import { RatingSummary } from "@/modules/lesson";
import { ROUTES } from "@/shared/config";
import type { AuthUser } from "@/shared/types";
import { Avatar, Button, LoadingFallback } from "@/shared/ui/legacy";
import { SelectPicker } from "@/shared/ui/legacy/form-pickers";
import { Switch } from "@/shared/ui/switch";
import { TeacherStatsDialog } from "./teacher-stats-dialog";

type TeacherView = "pending" | "all";

function useTeacherHighlight(teacherId: string | null, ready: boolean) {
  useEffect(() => {
    if (!teacherId || !ready) return;
    document
      .querySelector(`[data-teacher-id="${CSS.escape(teacherId)}"]`)
      ?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [teacherId, ready]);
}

function TeacherRow({
  teacher,
  action,
  onStats,
  onTestAccess,
}: {
  teacher: AuthUser;
  action?: ReactNode;
  onStats?: (teacher: AuthUser) => void;
  onTestAccess?: (teacher: AuthUser, enabled: boolean) => void;
}) {
  const { t } = useTranslation("admin");
  return (
    <article className="admin-teacher-row" data-teacher-id={teacher.id}>
      <Avatar name={teacher.name} src={teacher.avatarUrl} size="sm" />
      <div>
        <strong>{teacher.name}</strong>
        <small>@{teacher.username}</small>
      </div>
      <RatingSummary average={teacher.avgRating} count={teacher.ratingCount ?? 0} compact />
      {onTestAccess ? (
        <label className="flex shrink-0 cursor-pointer items-center gap-2 text-body-xs text-ink-secondary">
          <span className="max-sm:sr-only">{t("teachers.testAccess")}</span>
          <Switch
            checked={teacher.canCreateTests !== false}
            onCheckedChange={(enabled) => onTestAccess(teacher, enabled)}
            aria-label={t("teachers.testAccessAria", { name: teacher.name })}
          />
        </label>
      ) : null}
      {onStats ? (
        <button
          className="icon-button"
          onClick={() => onStats(teacher)}
          aria-label={t("stats.openAria", { name: teacher.name })}
          title={t("stats.open")}
        >
          <BarChart3 size={16} />
        </button>
      ) : null}
      {action}
    </article>
  );
}

export function AdminTeachersPage() {
  const { t } = useTranslation("admin");
  const pending = usePendingTeachers();
  const teachers = useTeachers();
  const approve = useApproveTeacher();
  const testAccess = useSetTeacherTestAccess();
  const [statsTarget, setStatsTarget] = useState<AuthUser | null>(null);
  const [params] = useSearchParams();
  const highlightId = params.get("teacher");
  const [view, setView] = useState<TeacherView>("pending");
  const query = view === "pending" ? pending : teachers;
  useTeacherHighlight(highlightId, (query.data?.length ?? 0) > 0);

  return (
    <main className="portal-page admin-page">
      <div className="portal-page-heading">
        <div>
          <span className="portal-eyebrow">
            <ShieldCheck size={14} /> {t("teachers.eyebrow")}
          </span>
          <h1>{t("teachers.title")}</h1>
          <p>{t("teachers.subtitle")}</p>
        </div>
        <Link className="portal-primary-link" to={ROUTES.admin.dashboard}>
          <ArrowLeft size={15} /> {t("teachers.backToDashboard")}
        </Link>
      </div>

      <section className="portal-card admin-teacher-panel">
        <div className="portal-section-head">
          <div>
            <span>
              {view === "pending" ? <ShieldCheck size={13} /> : <Users size={13} />}{" "}
              {view === "pending" ? t("teachers.pendingEyebrow") : t("teachers.allEyebrow")}
            </span>
            <h2>{view === "pending" ? t("teachers.pendingTitle") : t("teachers.allTitle")}</h2>
          </div>
          <div className="admin-teacher-filter">
            <SelectPicker
              hideLabel
              label={t("teachers.viewLabel")}
              icon={view === "pending" ? ShieldCheck : Users}
              value={view}
              onChange={(value) => setView(value as TeacherView)}
              options={[
                {
                  value: "pending",
                  label: t("teachers.viewPending", { count: pending.data?.length ?? 0 }),
                },
                {
                  value: "all",
                  label: t("teachers.viewAll", { count: teachers.data?.length ?? 0 }),
                },
              ]}
            />
          </div>
        </div>

        {query.isLoading ? <LoadingFallback label={t("teachers.loading")} /> : null}

        <div className="admin-teacher-list">
          {(query.data ?? []).map((teacher) => (
            <TeacherRow
              key={teacher.id}
              teacher={teacher}
              onStats={setStatsTarget}
              onTestAccess={
                view === "all"
                  ? (row, enabled) =>
                      testAccess.mutate(
                        { id: row.id, enabled },
                        {
                          onSuccess: () =>
                            toast.success(
                              t(enabled ? "teachers.testAccessOn" : "teachers.testAccessOff", { name: row.name })
                            ),
                        }
                      )
                  : undefined
              }
              action={
                view === "pending" ? (
                  <Button
                    size="sm"
                    loading={approve.isPending && approve.variables === teacher.id}
                    onClick={() => approve.mutate(teacher.id)}
                  >
                    {t("teachers.approve")}
                  </Button>
                ) : undefined
              }
            />
          ))}
          {!query.isLoading && !query.data?.length ? (
            <p className="portal-muted">
              {view === "pending" ? t("teachers.noPending") : t("teachers.noTeachers")}
            </p>
          ) : null}
        </div>
      </section>

      <TeacherStatsDialog teacher={statsTarget} onClose={() => setStatsTarget(null)} />
    </main>
  );
}
