import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/modules/auth";
import {
  LessonCreateDialog,
  LessonDetailDialog,
  RateLessonDialog,
  ScheduleDay,
  ScheduleEmpty,
  ScheduleList,
  ScheduleMonth,
  ScheduleSidebar,
  ScheduleSkeleton,
  ScheduleWeek,
  useLessons,
  useScheduleStore,
} from "@/modules/lesson";
import { ROLES } from "@/shared/constants";
import { ROUTES } from "@/shared/config";
import { useOnlineStatus } from "@/shared/model";
import type { Lesson } from "@/shared/types";
import { Icon } from "@/shared/ui/icon";
import {
  addDays,
  addMonths,
  endOfDay,
  endOfMonth,
  isSameDay,
  isSameMonth,
  isWithinInterval,
  startOfDay,
  startOfMonth,
} from "date-fns";

export function SchedulePage() {
  const { t } = useTranslation("lesson");
  const navigate = useNavigate();
  const { user } = useAuth();
  const online = useOnlineStatus();
  const lessons = useLessons({ page_size: 200 });
  const view = useScheduleStore((state) => state.view);
  const anchorValue = useScheduleStore((state) => state.anchor);
  const setAnchor = useScheduleStore((state) => state.setAnchor);
  const createOpen = useScheduleStore((state) => state.createOpen);
  const setCreateOpen = useScheduleStore((state) => state.setCreateOpen);
  const [detail, setDetail] = useState<Lesson | null>(null);
  const [editing, setEditing] = useState<Lesson | null>(null);
  const [rateTarget, setRateTarget] = useState<Lesson | null>(null);

  const anchor = new Date(anchorValue);
  const isStudent = user?.role === ROLES.STUDENT;
  const canManage = !isStudent;
  const items = lessons.data ?? [];

  const inRange = items.filter((lesson) => {
    const date = new Date(lesson.startsAt);
    if (view === "day") return isSameDay(date, anchor);
    if (view === "week")
      return isWithinInterval(date, {
        start: startOfDay(addDays(anchor, -3)),
        end: endOfDay(addDays(anchor, 3)),
      });
    if (view === "list")
      return isWithinInterval(date, {
        start: startOfDay(anchor),
        end: endOfDay(addDays(anchor, 6)),
      });
    return isSameMonth(date, anchor);
  });

  function openAttendance(lesson: Lesson) {
    setDetail(null);
    navigate(isStudent ? ROUTES.student.schedule : ROUTES.teacher.attendance, {
      state: { lessonId: lesson.id },
    });
  }

  function openHomework(lesson: Lesson) {
    setDetail(null);
    navigate(isStudent ? ROUTES.student.chats : `${ROUTES.teacher.chats}/assignments`, {
      state: { courseId: lesson.courseId },
    });
  }

  const emptyTitle =
    view === "list"
      ? t("schedule.emptyWeek")
      : view === "day"
      ? t("schedule.emptyDay")
      : view === "week"
        ? t("schedule.emptyWeek")
        : t("schedule.emptyMonth");

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-canvas lg:flex-row">
      <ScheduleSidebar
        anchor={anchor}
        rangeStart={
          view === "day"
            ? anchor
            : view === "month"
              ? startOfMonth(anchor)
              : view === "list"
                ? anchor
                : addDays(anchor, -3)
        }
        rangeEnd={
          view === "day"
            ? anchor
            : view === "month"
              ? endOfMonth(anchor)
              : addDays(anchor, view === "list" ? 6 : 3)
        }
        lessons={items}
        onSelectDay={(date) => setAnchor(date)}
        onAttendance={openAttendance}
        onMonthStep={(direction) => setAnchor(addMonths(anchor, direction))}
      />

      <section className="flex min-h-0 flex-1 flex-col overflow-hidden">
        {online ? null : (
          <div className="flex shrink-0 items-center gap-2.5 border-b border-line bg-subtle px-4 py-2.5 lg:px-6">
            <Icon name="error" size={17} className="shrink-0 text-ink-tertiary" />
            <span className="flex-1 text-body-sm text-ink-secondary">{t("schedule.offline")}</span>
            <button
              type="button"
              className="text-label-strong text-action"
              onClick={() => lessons.refetch()}
            >
              {t("schedule.retry")}
            </button>
          </div>
        )}

        {lessons.isLoading ? (
          <ScheduleSkeleton />
        ) : !inRange.length ? (
          <ScheduleEmpty
            title={emptyTitle}
            canCreate={canManage}
            onCreate={() => setCreateOpen(true)}
          />
        ) : view === "list" ? (
          <ScheduleList
            anchor={anchor}
            lessons={inRange}
            onSelect={setDetail}
            onSelectDay={(date) => setAnchor(startOfDay(date))}
          />
        ) : view === "day" ? (
          <ScheduleDay anchor={anchor} lessons={inRange} onSelect={setDetail} />
        ) : view === "week" ? (
          <ScheduleWeek
            anchor={anchor}
            lessons={inRange}
            onSelect={setDetail}
            onSelectDay={(date) => setAnchor(startOfDay(date))}
          />
        ) : (
          <ScheduleMonth
            anchor={anchor}
            lessons={inRange}
            onSelect={setDetail}
            onSelectDay={(date) => setAnchor(startOfDay(date))}
          />
        )}
      </section>

      <LessonDetailDialog
        lesson={detail}
        open={Boolean(detail)}
        onOpenChange={(open) => !open && setDetail(null)}
        canManage={canManage}
        onAttendance={openAttendance}
        onHomework={openHomework}
        onEdit={(lesson) => {
          setDetail(null);
          setEditing(lesson);
        }}
        onRate={(lesson) => {
          setDetail(null);
          setRateTarget(lesson);
        }}
      />

      <LessonCreateDialog
        open={createOpen || Boolean(editing)}
        onOpenChange={(open) => {
          if (open) return;
          setCreateOpen(false);
          setEditing(null);
        }}
        date={anchor}
        lesson={editing}
      />

      <RateLessonDialog
        lesson={rateTarget}
        currentUserId={user?.id}
        onOpenChange={(open) => !open && setRateTarget(null)}
      />
    </div>
  );
}
