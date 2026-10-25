import { useTranslation } from "react-i18next";
import { NavLink, useLocation } from "react-router-dom";
import logoUrl from "@/shared/assets/y-logo.svg";
import { useAuth } from "@/modules/auth";
import { useConversations, useNewConversationStore } from "@/modules/conversation";
import { useCourses } from "@/modules/course";
import { ROUTES } from "@/shared/config";
import { Avatar } from "@/shared/ui/legacy";
import { GroupTile } from "@/shared/ui/group-tile";
import { Icon } from "@/shared/ui/icon";

interface NavItem {
  id: string;
  icon: string;
  to: string;
  end?: boolean;
  /** Boshqa qatlamdagi (chat qobig'idagi) sahifalar ham shu bo'limga tegishli. */
  extra?: string[];
}

const WORKSPACE_PATHS = [
  "/workspace",
  "/quizzes",
  "/assignments",
  "/exams",
  "/analytics",
  "/ai",
  "/homework-board",
];

const ITEMS: NavItem[] = [
  { id: "home", icon: "home", to: ROUTES.teacher.dashboard },
  { id: "chat", icon: "nav-chat", to: ROUTES.teacher.chats, end: true },
  { id: "schedule", icon: "nav-calendar", to: ROUTES.teacher.schedule },
  {
    id: "workspace",
    icon: "nav-workspace",
    to: ROUTES.teacher.workspace,
    extra: WORKSPACE_PATHS,
  },
  { id: "profile", icon: "nav-profile", to: `${ROUTES.teacher.chats}/profile` },
];

const LINK_BASE =
  "flex h-11 items-center gap-3 rounded-xl px-3 text-label-lg transition-colors";
const LINK_IDLE = "text-ink-secondary hover:bg-subtle hover:text-ink";
const LINK_ACTIVE = "bg-brand-subtle text-brand";

export interface AppSidebarProps {
  onCreateCourse?: () => void;
}

export function AppSidebar({ onCreateCourse }: AppSidebarProps) {
  const { t } = useTranslation("nav");
  const { pathname } = useLocation();
  const { user } = useAuth();
  const openNewGroup = useNewConversationStore((state) => state.setOpen);
  const courses = useCourses();
  const conversations = useConversations("teacher");

  const unreadChats = (conversations.data ?? []).filter((item) => item.unreadCount > 0).length;
  const roomByCourse = new Map(
    (conversations.data ?? [])
      .filter((item) => item.courseId)
      .map((item) => [item.courseId as string, item])
  );

  return (
    <aside className="flex h-full w-(--layout-sidebar) shrink-0 flex-col gap-6 border-r border-line-subtle bg-surface px-4 py-6">
      <NavLink to={ROUTES.teacher.dashboard} className="flex items-center gap-2 px-3">
        <img className="size-8" src={logoUrl} alt="" />
        <span className="font-heading text-h3 text-ink">YolUp</span>
      </NavLink>

      <nav className="flex flex-col gap-1" aria-label={t("rail.sectionsLabel")}>
        {ITEMS.map((item) => {
          const extraActive = (item.extra ?? []).some(
            (path) => pathname.endsWith(path) || pathname.includes(`${path}/`)
          );
          return (
          <NavLink
            key={item.id}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `${LINK_BASE} ${isActive || extraActive ? LINK_ACTIVE : LINK_IDLE}`
            }
          >
            <Icon name={item.icon} size={22} className="shrink-0" />
            <span className="min-w-0 flex-1 truncate">{t(`titles.${item.id}`)}</span>
            {item.id === "chat" && unreadChats ? (
              <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-danger px-1.5 text-caption-strong text-ink-inverse">
                {unreadChats}
              </span>
            ) : null}
          </NavLink>
          );
        })}
      </nav>

      <section className="flex min-h-0 flex-1 flex-col gap-2">
        <div className="flex h-7 items-center gap-2 px-3">
          <span className="min-w-0 flex-1 truncate text-micro tracking-wide text-ink-tertiary uppercase">
            {t("sidebar.myGroups")}
          </span>
          <button
            type="button"
            className="grid size-6 shrink-0 place-items-center rounded-lg text-ink-tertiary transition-colors hover:bg-subtle hover:text-ink"
            aria-label={t("sidebar.createGroup")}
            onClick={() => (onCreateCourse ? onCreateCourse() : openNewGroup(true))}
          >
            <Icon name="add" size={18} />
          </button>
        </div>

        <div className="-mr-1 flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto pr-1">
          {courses.isLoading
            ? Array.from({ length: 4 }, (_, index) => (
                <span key={index} className="mx-3 my-1.5 h-7 animate-pulse rounded-lg bg-muted" />
              ))
            : (courses.data ?? []).map((course) => {
                const room = roomByCourse.get(course.id);
                const unread = room?.unreadCount ?? 0;
                return (
                  <NavLink
                    key={course.id}
                    to={
                      room
                        ? ROUTES.teacher.chat(room.id)
                        : `${ROUTES.teacher.chats}/workspace`
                    }
                    className={({ isActive }) =>
                      `flex h-10 items-center gap-2.5 rounded-xl px-3 text-body-sm transition-colors ${
                        isActive ? "bg-brand-subtle text-brand" : "text-ink hover:bg-subtle"
                      }`
                    }
                  >
                    <GroupTile name={course.title} tone={course.color} size="sm" />
                    <span className="min-w-0 flex-1 truncate">{course.title}</span>
                    {unread ? (
                      <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-brand px-1.5 text-caption-strong text-ink-inverse">
                        {unread}
                      </span>
                    ) : null}
                  </NavLink>
                );
              })}
        </div>
      </section>

      <NavLink
        to={`${ROUTES.teacher.chats}/profile`}
        className="flex items-center gap-2.5 rounded-2xl bg-subtle p-2.5 transition-colors hover:bg-muted"
      >
        <Avatar name={user?.name} src={user?.avatarUrl ?? undefined} size="sm" />
        <span className="flex min-w-0 flex-1 flex-col">
          <strong className="truncate text-title-sm text-ink">{user?.name}</strong>
          <small className="truncate text-caption text-ink-tertiary">
            {user?.subject
              ? t("sidebar.subjectTeacher", { subject: user.subject })
              : t("roles.teacher")}
          </small>
        </span>
        <Icon name="settings" size={16} className="shrink-0 text-icon-tertiary" />
      </NavLink>
    </aside>
  );
}
