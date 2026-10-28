import { useTranslation } from "react-i18next";
import { NavLink, useLocation } from "react-router-dom";
import logoUrl from "@/shared/assets/y-logo.svg";
import { useAuth, useIsStudent, useRoleRoutes } from "@/modules/auth";
import { useConversations } from "@/modules/conversation";
import { Avatar } from "@/shared/ui/legacy";
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

const LINK_BASE =
  "flex h-11 items-center gap-3 rounded-xl px-3 text-label-lg transition-colors";
const LINK_IDLE = "text-ink-secondary hover:bg-subtle hover:text-ink";
const LINK_ACTIVE = "bg-brand-subtle text-brand";

export function AppSidebar() {
  const { t } = useTranslation("nav");
  const { pathname } = useLocation();
  const { user } = useAuth();
  const routes = useRoleRoutes();
  const isStudent = useIsStudent();
  const conversations = useConversations(isStudent ? "student" : "teacher");
  const items: NavItem[] = [
    { id: "home", icon: "home", to: routes.dashboard },
    { id: "chat", icon: "nav-chat", to: routes.chats, end: true },
    { id: "schedule", icon: "nav-calendar", to: routes.schedule, extra: ["/recordings"] },
    { id: "workspace", icon: "nav-workspace", to: routes.workspace, extra: WORKSPACE_PATHS },
    { id: "profile", icon: "nav-profile", to: routes.profile },
  ];

  const unreadChats = (conversations.data ?? []).filter((item) => item.unreadCount > 0).length;
  const studentGroup = (conversations.data ?? []).find((item) => item.type === "group")?.title;

  return (
    <aside className="flex h-full w-(--layout-sidebar) shrink-0 flex-col gap-6 border-r border-line-subtle bg-surface px-4 pt-6 pb-5 font-body text-ink">
      <NavLink to={routes.dashboard} className="flex items-center gap-2 px-3">
        <img className="size-8" src={logoUrl} alt="" />
        <span className="font-heading text-h3 text-ink">YolUp</span>
      </NavLink>

      <nav className="-mt-0.5 flex flex-col gap-1.5" aria-label={t("rail.sectionsLabel")}>
        {items.map((item) => {
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

      <span className="min-h-0 flex-1" aria-hidden="true" />

      <NavLink
        to={routes.profile}
        className="flex items-center gap-2.5 rounded-2xl bg-subtle py-2.5 pr-[9px] pl-2.5 transition-colors hover:bg-muted"
      >
        <Avatar name={user?.name} src={user?.avatarUrl ?? undefined} size="sm" className="[&_.avatar]:size-[38px]" />
        <span className="flex min-w-0 flex-1 flex-col">
          <strong className="truncate text-body-xs font-semibold tracking-tight text-ink">{user?.name}</strong>
          <small className="truncate text-caption font-normal text-ink-secondary">
            {isStudent
              ? [t("roles.student"), studentGroup].filter(Boolean).join(" · ")
              : user?.subject
                ? t("sidebar.subjectTeacher", { subject: user.subject })
                : t("roles.teacher")}
          </small>
        </span>
        <Icon name="settings" size={18} className="-ml-1.5 shrink-0 text-icon-secondary" />
      </NavLink>
    </aside>
  );
}
