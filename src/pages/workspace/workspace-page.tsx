import { useMemo, useState } from "react";
import { BarChart3, ClipboardCheck, ClipboardList, FileQuestion, Sparkles } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/modules/auth";
import { InviteStudentsDialog, useNewConversationStore } from "@/modules/conversation";
import { useCourses } from "@/modules/course";
import { useLessons } from "@/modules/lesson";
import { ROLES } from "@/shared/constants";
import { useOnlineStatus } from "@/shared/model";
import { Icon } from "@/shared/ui/icon";

interface WorkspaceCard {
  id: string;
  icon: LucideIcon;
  to?: string;
  tone: string;
  hiddenForStudent?: boolean;
}

const CARDS: WorkspaceCard[] = [
  { id: "quizzes", icon: FileQuestion, to: "../quizzes", tone: "bg-action text-on-action" },
  {
    id: "assignments",
    icon: ClipboardList,
    to: "../assignments",
    tone: "bg-action text-on-action",
    hiddenForStudent: true,
  },
  { id: "analytics", icon: BarChart3, to: "../analytics", tone: "bg-action text-on-action" },
  { id: "ai", icon: Sparkles, to: "../ai", tone: "bg-saffron-strong text-white", hiddenForStudent: true },
  { id: "exams", icon: ClipboardCheck, to: "../exams", tone: "bg-success text-white" },
];

const QUICK = [
  { id: "homework", icon: "assign", tone: "bg-action text-on-action", to: "../quizzes" },
  { id: "attendance", icon: "check-circle", tone: "bg-success text-white", to: "../analytics" },
  { id: "grading", icon: "done-all", tone: "bg-saffron-strong text-white", to: "../quizzes" },
  { id: "materials", icon: "assign", tone: "bg-error text-white", to: "../quizzes" },
] as const;

export function WorkspacePage() {
  const { t } = useTranslation("workspace");
  const { user } = useAuth();
  const navigate = useNavigate();
  const isStudent = user?.role === ROLES.STUDENT;
  const openNewGroup = useNewConversationStore((state) => state.setOpen);
  const online = useOnlineStatus();
  const [inviteFor, setInviteFor] = useState<string | null>(null);

  const courses = useCourses();
  const lessons = useLessons({ page_size: 200 }, !isStudent);

  const cards = CARDS.filter((card) => !(card.hiddenForStudent && isStudent));
  const groups = courses.data ?? [];
  const studentTotal = groups.reduce((sum, course) => sum + (course.studentCount || 0), 0);

  const nextLessonByCourse = useMemo(() => {
    const now = Date.now();
    const map = new Map<string, string>();
    for (const item of [...(lessons.data ?? [])].sort(
      (a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime()
    )) {
      if (new Date(item.startsAt).getTime() < now || item.status === "finished") continue;
      if (!map.has(item.courseId)) map.set(item.courseId, item.startsAt);
    }
    return map;
  }, [lessons.data]);

  const monthNames = useTranslation("lesson").t("list.months", { returnObjects: true }) as string[];

  function formatNext(value: string | undefined): string | null {
    if (!value) return null;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return null;
    const time = `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
    return `${date.getDate()}-${(monthNames[date.getMonth()] ?? "").toLowerCase()}, ${time}`;
  }

  if (courses.isLoading)
    return (
      <div className="flex h-full flex-col gap-4 overflow-y-auto bg-canvas p-4 lg:p-6">
        <div className="flex flex-col gap-2">
          <span className="h-3 w-3/4 animate-pulse rounded-full bg-muted" />
          <span className="h-3 w-1/2 animate-pulse rounded-full bg-muted" />
        </div>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {Array.from({ length: 4 }, (_, index) => (
            <div key={index} className="h-40 animate-pulse rounded-2xl bg-muted" />
          ))}
        </div>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {Array.from({ length: 2 }, (_, index) => (
            <div key={index} className="h-24 animate-pulse rounded-2xl bg-muted" />
          ))}
        </div>
      </div>
    );

  return (
    <div className="flex h-full flex-col gap-6 overflow-y-auto bg-canvas p-4 lg:p-6">
      <div className="flex items-start gap-3 lg:hidden">
        <p className="flex-1 text-body-sm text-ink-secondary">{t("subtitle")}</p>
      </div>

      {online ? null : (
        <div className="flex items-center gap-3 rounded-xl bg-subtle px-4 py-3">
          <Icon name="error" size={18} className="shrink-0 text-ink-tertiary" />
          <span className="flex-1 text-body-sm text-ink-secondary">{t("offlineTitle")}</span>
          <button className="text-label-strong text-action" onClick={() => courses.refetch()}>
            {t("offlineRetry")}
          </button>
        </div>
      )}


      {!isStudent && groups.length ? (
        <div className="grid grid-cols-3 gap-2 lg:gap-3">
          {[
            { id: "groups", icon: "groups", tone: "bg-action text-on-action", value: String(groups.length), label: t("statGroups") },
            { id: "students", icon: "person", tone: "bg-success text-white", value: String(studentTotal), label: t("statStudents") },
            { id: "unchecked", icon: "assign", tone: "bg-saffron-strong text-white", value: "—", label: t("statUnchecked") },
          ].map((stat) => (
            <div
              key={stat.id}
              className="flex flex-col gap-2 rounded-2xl border border-line bg-surface p-3 lg:p-4"
            >
              <span className={`grid size-9 place-items-center rounded-lg ${stat.tone}`}>
                <Icon name={stat.icon} size={18} />
              </span>
              <strong className="font-heading text-h3 text-ink lg:text-h2">{stat.value}</strong>
              <small className="text-caption text-ink-secondary lg:text-body-sm">{stat.label}</small>
            </div>
          ))}
        </div>
      ) : null}

      <section className="flex flex-col gap-3">
        <h2 className="text-title text-ink">{t("modules")}</h2>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {cards.map((card, index) => {
            const CardIcon = card.icon;
            return (
              <motion.article
                key={card.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.04 }}
              >
                <Link
                  className="flex h-full flex-col gap-2 rounded-2xl border border-line bg-surface p-4 transition-colors hover:bg-subtle"
                  to={card.to ?? "."}
                >
                  <span className={`grid size-11 place-items-center rounded-lg ${card.tone}`}>
                    <CardIcon size={20} />
                  </span>
                  <strong className="text-title text-ink">{t(`cards.${card.id}.title`)}</strong>
                  <p className="text-body-sm text-ink-secondary">
                    {t(`cards.${card.id}.description`)}
                  </p>
                </Link>
              </motion.article>
            );
          })}
        </div>
      </section>

      {isStudent ? null : (
        <section className="flex flex-col gap-3">
          <h2 className="text-title text-ink">{t("quickActions")}</h2>
          <div className="grid gap-3 lg:grid-cols-2">
            {QUICK.map((item) => (
              <Link
                key={item.id}
                to={item.to}
                className="flex items-center gap-3 rounded-2xl border border-line bg-surface p-4 transition-colors hover:bg-subtle"
              >
                <span className={`grid size-10 shrink-0 place-items-center rounded-xl ${item.tone}`}>
                  <Icon name={item.icon} size={18} />
                </span>
                <span className="flex min-w-0 flex-col">
                  <strong className="truncate text-label-strong text-ink">
                    {t(`quick${item.id.charAt(0).toUpperCase()}${item.id.slice(1)}`)}
                  </strong>
                  <small className="truncate text-caption text-ink-tertiary">
                    {item.id === "grading"
                      ? t("quickGradingUnknown")
                      : item.id === "materials"
                        ? t("quickMaterialsUnknown")
                        : t(`quick${item.id.charAt(0).toUpperCase()}${item.id.slice(1)}Hint`)}
                  </small>
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {isStudent ? null : groups.length ? (
        <section className="flex flex-col gap-3">
          <div className="flex items-baseline gap-3">
            <h2 className="flex-1 text-title text-ink">{t("myGroups")}</h2>
            <button
              type="button"
              className="text-label-strong text-action"
              onClick={() => navigate("..")}
            >
              {t("allGroups")}
            </button>
          </div>
          <div className="grid gap-3 lg:grid-cols-2">
            {groups.slice(0, 4).map((course) => {
              const next = formatNext(nextLessonByCourse.get(course.id));
              return (
                <article
                  key={course.id}
                  className="flex flex-col gap-3 rounded-2xl border border-line bg-surface p-4"
                >
                  <div className="flex items-center gap-3">
                    <span className="grid size-11 shrink-0 place-items-center rounded-full bg-action-subtle font-heading text-label-strong text-action">
                      {course.title.slice(0, 2).toUpperCase()}
                    </span>
                    <span className="flex min-w-0 flex-1 flex-col">
                      <strong className="truncate text-title text-ink">{course.title}</strong>
                      <small className="truncate text-caption text-ink-tertiary">
                        {t("groupMeta", { count: course.studentCount ?? 0 })}
                      </small>
                    </span>
                    <button
                      type="button"
                      className="grid size-9 shrink-0 place-items-center rounded-full bg-action-subtle text-action transition-opacity hover:opacity-80"
                      onClick={() => setInviteFor(course.title)}
                      aria-label={t("createGroup")}
                    >
                      <Icon name="add" size={18} />
                    </button>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <span className="flex items-baseline gap-2">
                      <small className="flex-1 text-caption text-ink-secondary">
                        {t("groupProgress")}
                      </small>
                      <small className="font-numeric text-caption-strong text-ink">—</small>
                    </span>
                    <span className="h-1.5 w-full overflow-hidden rounded-full bg-subtle" />
                  </div>

                  <span className="flex items-center gap-2 rounded-xl bg-subtle px-3 py-2 text-caption text-ink-secondary">
                    <Icon name="clock" size={15} className="shrink-0" />
                    {next ? t("nextLesson", { value: next }) : t("noNextLesson")}
                  </span>
                </article>
              );
            })}
          </div>
        </section>
      ) : (
        <section className="flex flex-col items-center gap-3 px-6 py-10 text-center">
          <span className="grid size-16 place-items-center rounded-full bg-action-subtle text-action">
            <Icon name="groups" size={28} />
          </span>
          <strong className="font-heading text-h3 text-ink">{t("emptyTitle")}</strong>
          <p className="max-w-[420px] text-body-sm text-ink-secondary">{t("emptyDescription")}</p>
          <button
            type="button"
            className="mt-1 flex h-12 items-center gap-2 rounded-full bg-action px-5 text-label-strong text-on-action transition-colors hover:bg-action-hover"
            onClick={() => openNewGroup(true)}
          >
            <Icon name="add" size={18} /> {t("createGroup")}
          </button>
        </section>
      )}
      <InviteStudentsDialog
        open={Boolean(inviteFor)}
        onOpenChange={(next) => {
          if (!next) setInviteFor(null);
        }}
        title={inviteFor ?? ""}
      />
    </div>
  );
}
