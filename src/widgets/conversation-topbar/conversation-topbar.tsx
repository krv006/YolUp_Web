import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import logoUrl from "@/shared/assets/y-logo.svg";
import { useAuth } from "@/modules/auth";
import { useNewConversationStore } from "@/modules/conversation";
import { useScheduleStore } from "@/modules/lesson";
import { useAssignmentCreateStore } from "@/widgets/homework-workspace";
import { usePageCreateStore } from "@/shared/model";
import { GlobalSearchDialog } from "@/widgets/global-search";
import { Icon } from "@/shared/ui/icon";
import { useConversations } from "@/modules/conversation";
import { homeworkApi, homeworkKeys } from "@/modules/homework";
import { NotificationBell, type NotificationLink } from "@/modules/notification";
import type { ConversationRole } from "@/shared/types";

export interface ConversationTopbarProps {
  role: ConversationRole;
  title: string;
  section?: "chat" | "schedule" | "workspace" | "profile";
}

export function ConversationTopbar({ role, title, section = "chat" }: ConversationTopbarProps) {
  const { t } = useTranslation("chat");
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { data = [] } = useConversations(role);
  const openNewGroup = useNewConversationStore((state) => state.setOpen);
  const workspace = section === "workspace";
  const schedule = section === "schedule";
  const { pathname } = useLocation();
  const assignments = pathname.endsWith("/assignments");
  const openAssignment = useAssignmentCreateStore((state) => state.setOpen);
  const openPageCreate = usePageCreateStore((state) => state.setOpen);
  const quizzes = pathname.endsWith("/quizzes");
  const exams = pathname.endsWith("/exams");
  const isSubPage = workspace && !pathname.endsWith("/workspace");
  const quizT = useTranslation("quiz").t;
  const [searchOpen, setSearchOpen] = useState(false);
  const lessonT = useTranslation("lesson").t;
  const view = useScheduleStore((state) => state.view);
  const anchor = useScheduleStore((state) => state.anchor);
  const setView = useScheduleStore((state) => state.setView);
  const step = useScheduleStore((state) => state.step);
  const goToday = useScheduleStore((state) => state.goToday);
  const setCreateOpen = useScheduleStore((state) => state.setCreateOpen);
  const months = lessonT("list.months", { returnObjects: true }) as string[];
  const monthsLong = lessonT("list.monthsLong", { returnObjects: true }) as string[];

  function monthName(index: number): string {
    return (monthsLong[index] ?? "").toLowerCase();
  }

  function rangeLabel(): string {
    const date = new Date(anchor);
    if (view === "month") return `${monthsLong[date.getMonth()]}, ${date.getFullYear()}`;
    if (view === "list") {
      const end = new Date(date);
      end.setDate(date.getDate() + 6);
      return date.getMonth() === end.getMonth()
        ? `${date.getDate()} – ${end.getDate()} ${monthName(date.getMonth())}, ${date.getFullYear()}`
        : `${date.getDate()} ${months[date.getMonth()]} – ${end.getDate()} ${months[end.getMonth()]}, ${end.getFullYear()}`;
    }
    if (view === "day")
      return `${date.getDate()} ${monthName(date.getMonth())}, ${date.getFullYear()}`;
    const start = new Date(date);
    start.setDate(date.getDate() - 3);
    const end = new Date(date);
    end.setDate(date.getDate() + 3);
    const sameMonth = start.getMonth() === end.getMonth();
    return sameMonth
      ? `${start.getDate()} – ${end.getDate()} ${monthName(start.getMonth())}, ${start.getFullYear()}`
      : `${start.getDate()} ${months[start.getMonth()]} – ${end.getDate()} ${months[end.getMonth()]}, ${end.getFullYear()}`;
  }
  const basePath = role === "teacher" ? "/teacher/chats" : "/student/chats";

  async function openNotificationLink(link: NotificationLink) {
    if (link.type === "assignment") {
      try {
        const assignment = await queryClient.fetchQuery({
          queryKey: homeworkKeys.assignment(link.id),
          queryFn: ({ signal }) => homeworkApi.getAssignment(link.id, { signal }),
        });
        const room = data.find((item) => item.courseId === assignment.courseId);
        if (!room) {
          toast.error(t("panel.assignmentGroupNotFound"));
          return;
        }
        navigate(`${basePath}/${room.id}?tab=assignments&assignment=${link.id}`);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : t("panel.assignmentOpenFailed"));
      }
      return;
    }
    if (link.type === "submission") {
      try {
        const submission = await queryClient.fetchQuery({
          queryKey: homeworkKeys.submission(link.id),
          queryFn: ({ signal }) => homeworkApi.getSubmission(link.id, { signal }),
        });
        if (!submission) {
          toast.error(t("panel.assignmentOpenFailed"));
          return;
        }
        const assignment = await queryClient.fetchQuery({
          queryKey: homeworkKeys.assignment(submission.assignmentId),
          queryFn: ({ signal }) => homeworkApi.getAssignment(submission.assignmentId, { signal }),
        });
        const room = data.find((item) => item.courseId === assignment.courseId);
        if (!room) {
          toast.error(t("panel.assignmentGroupNotFound"));
          return;
        }
        navigate(
          `${basePath}/${room.id}?tab=assignments&assignment=${submission.assignmentId}&submission=${link.id}`,
        );
      } catch (error) {
        toast.error(error instanceof Error ? error.message : t("panel.assignmentOpenFailed"));
      }
      return;
    }
    if (link.type === "quiz") {
      navigate(`${basePath}/quizzes?quiz=${link.id}`);
      return;
    }
    if (link.type === "exam") {
      navigate(`${basePath}/exams/${link.id}`);
    }
  }

  return (
    <>
    <header className="flex h-16 shrink-0 items-center gap-3 border-b border-line bg-canvas px-4 lg:px-5 lg:h-(--layout-topbar) lg:gap-4 lg:border-line lg:bg-surface lg:px-8">
      {section === "chat" ? (
        <img className="size-8 shrink-0 lg:hidden" src={logoUrl} alt="YolUp" />
      ) : null}
      {isSubPage ? (
        <button
          type="button"
          className="-ml-2 grid size-10 shrink-0 place-items-center rounded-full text-ink transition-colors hover:bg-subtle lg:hidden"
          onClick={() => navigate(-1)}
          aria-label={t("searchBack")}
        >
          <Icon name="arrow-back" size={22} />
        </button>
      ) : null}
      <h1
        className={`min-w-0 truncate font-heading text-h2 text-ink ${
          schedule ? "shrink-0" : "flex-1"
        } ${section === "chat" ? "hidden lg:block" : ""}`}
      >
        {title}
      </h1>
      {section === "chat" ? <span className="flex-1 lg:hidden" /> : null}

      {schedule ? (
        <>
          <span className="hidden shrink-0 items-center gap-2 lg:flex">
            <button
              type="button"
              className="flex h-10 items-center rounded-full border border-line bg-surface px-4 text-label-strong text-ink transition-colors hover:bg-subtle"
              onClick={goToday}
            >
              {lessonT("schedule.today")}
            </button>
            <button
              type="button"
              className="grid size-9 place-items-center rounded-full border border-line bg-surface text-ink-secondary transition-colors hover:bg-subtle"
              onClick={() => step(-1)}
              aria-label={lessonT("calendar.prevMonth")}
            >
              <Icon name="chevron-left" size={18} />
            </button>
            <button
              type="button"
              className="grid size-9 place-items-center rounded-full border border-line bg-surface text-ink-secondary transition-colors hover:bg-subtle"
              onClick={() => step(1)}
              aria-label={lessonT("calendar.nextMonth")}
            >
              <Icon name="chevron-right" size={18} />
            </button>
            <span className="truncate text-body-sm text-ink-secondary">{rangeLabel()}</span>
          </span>

          <span className="ml-auto hidden shrink-0 items-center gap-1 rounded-full bg-subtle p-1 lg:flex">
            {(["list", "day", "week", "month"] as const).map((item) => (
              <button
                key={item}
                type="button"
                className={`h-9 rounded-full px-3 text-label-strong transition-colors ${
                  view === item ? "bg-surface text-ink shadow-xs" : "text-ink-secondary"
                }`}
                onClick={() => setView(item)}
              >
                {lessonT(`schedule.${item}`)}
              </button>
            ))}
          </span>

          {role === "teacher" ? (
            <>
              <button
                type="button"
                className="ml-auto grid size-11 shrink-0 place-items-center rounded-full bg-action text-on-action transition-colors hover:bg-action-hover lg:hidden"
                onClick={() => setCreateOpen(true)}
                aria-label={lessonT("schedule.addLesson")}
              >
                <Icon name="add" size={20} />
              </button>
              <button
                type="button"
                className="hidden h-11 shrink-0 items-center gap-2 rounded-full bg-action px-4 text-label-strong text-on-action transition-colors hover:bg-action-hover lg:flex"
                onClick={() => setCreateOpen(true)}
              >
                <Icon name="add" size={18} /> {lessonT("schedule.addLesson")}
              </button>
            </>
          ) : null}
        </>
      ) : null}

      {workspace ? (
        <button
          type="button"
          className="grid size-11 shrink-0 place-items-center rounded-full border border-line bg-surface text-ink transition-colors hover:bg-subtle"
          onClick={() => setSearchOpen(true)}
          aria-label={t("workspace:searchAria")}
        >
          <Icon name="search" size={19} />
        </button>
      ) : null}

      {assignments && role === "teacher" ? (
        <button
          type="button"
          className="flex h-11 shrink-0 items-center gap-2 rounded-full bg-action px-4 text-label-strong text-on-action transition-colors hover:bg-action-hover"
          onClick={() => openAssignment(true)}
        >
          <Icon name="add" size={18} /> {t("homework:form.title")}
        </button>
      ) : null}

      {(quizzes || exams) && role === "teacher" ? (
        <button
          type="button"
          className="flex h-11 shrink-0 items-center gap-2 rounded-full bg-action px-4 text-label-strong text-on-action transition-colors hover:bg-action-hover"
          onClick={() => openPageCreate(quizzes ? "quiz" : "exam", true)}
        >
          <Icon name="add" size={18} />
          {quizzes ? quizT("teacherPage.createButton") : t("exam:teacherList.createButton")}
        </button>
      ) : null}

      {workspace && !assignments && !quizzes && !exams && role === "teacher" ? (
        <button
          type="button"
          className="hidden h-11 shrink-0 items-center gap-2 rounded-full bg-action px-4 text-label-strong text-on-action transition-colors hover:bg-action-hover lg:flex"
          onClick={() => openNewGroup(true)}
        >
          <Icon name="add" size={18} /> {t("workspace:createGroup")}
        </button>
      ) : null}

      <NotificationBell
        enabled={Boolean(user)}
        pageHref={`${basePath}/notifications`}
        className="relative grid size-11 shrink-0 place-items-center rounded-full border border-line bg-surface text-ink transition-colors hover:bg-subtle"
        onOpenLink={openNotificationLink}
      />

      <GlobalSearchDialog open={searchOpen} onOpenChange={setSearchOpen} />
    </header>

    {schedule ? (
      <div className="flex shrink-0 flex-col gap-2.5 border-b border-line bg-canvas px-4 pb-3 lg:hidden">
        <span className="flex items-center gap-1 rounded-full bg-subtle p-1">
          {(["list", "day", "week", "month"] as const).map((item) => (
            <button
              key={item}
              type="button"
              className={`h-10 flex-1 rounded-full text-label-strong transition-colors ${
                view === item ? "bg-surface text-ink shadow-xs" : "text-ink-secondary"
              }`}
              onClick={() => setView(item)}
            >
              {lessonT(`schedule.${item}`)}
            </button>
          ))}
        </span>

        <div className="flex items-center gap-2">
          <button
            type="button"
            className="grid size-10 shrink-0 place-items-center rounded-full border border-line bg-surface text-ink-secondary"
            onClick={() => step(-1)}
            aria-label={lessonT("calendar.prevMonth")}
          >
            <Icon name="chevron-left" size={18} />
          </button>
          <span className="min-w-0 flex-1 truncate text-center text-label-strong text-ink">
            {rangeLabel()}
          </span>
          <button
            type="button"
            className="grid size-10 shrink-0 place-items-center rounded-full border border-line bg-surface text-ink-secondary"
            onClick={() => step(1)}
            aria-label={lessonT("calendar.nextMonth")}
          >
            <Icon name="chevron-right" size={18} />
          </button>
          <button
            type="button"
            className="h-10 shrink-0 rounded-full border border-line bg-surface px-4 text-label-strong text-ink"
            onClick={goToday}
          >
            {lessonT("schedule.today")}
          </button>
        </div>
      </div>
    ) : null}
    </>
  );
}
