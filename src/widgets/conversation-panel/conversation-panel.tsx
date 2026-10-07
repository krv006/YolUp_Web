import { useEffect, useMemo, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { Plus, Search, UserRoundPlus, X } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import {
  ConversationItem,
  matchesConversationFilter,
  NewConversationDialog,
  useConversationFilter,
  useConversations,
  useRequestDirect,
  useTeachersForDirect,
  type ConversationFilter,
  type DirectTeacher,
} from "@/modules/conversation";
import { useLiveLessons } from "@/modules/lesson";
import { homeworkApi, homeworkKeys } from "@/modules/homework";
import { NotificationBell, type NotificationLink } from "@/modules/notification";
import { Avatar } from "@/shared/ui/legacy";
import { useAuth } from "@/modules/auth";
import { StudentEnrollmentDialog } from "@/modules/student";
import type { ConversationRole } from "@/shared/types";

function useFilters(): Array<{ id: ConversationFilter; label: string }> {
  const { t } = useTranslation("chat");
  return [
    { id: "all", label: t("panel.filters.all") },
    { id: "direct", label: t("panel.filters.direct") },
    { id: "group", label: t("panel.filters.group") },
    { id: "unread", label: t("panel.filters.unread") },
  ];
}

export interface ConversationPanelProps {
  role?: ConversationRole;
  onOpenMenu: () => void;
}

export function ConversationPanel({ role = "teacher", onOpenMenu }: ConversationPanelProps) {
  const { t } = useTranslation("chat");
  const FILTERS = useFilters();
  const [search, setSearch] = useState("");
  const { filter, setFilter } = useConversationFilter();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const { conversationId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data = [], isLoading, isError, refetch } = useConversations(role);
  const isTeacher = role === "teacher";
  const basePath = isTeacher ? "/teacher/chats" : "/student/chats";

  const query = search.trim();
  const peopleEnabled = !isTeacher && query.length >= 2;
  const teachers = useTeachersForDirect(peopleEnabled);
  const requestDirect = useRequestDirect();

  const liveLessons = useLiveLessons(Boolean(user)).data;
  const liveCourses = useMemo(
    () => new Set((liveLessons ?? []).map((lesson) => lesson.courseId)),
    [liveLessons]
  );

  const visible = useMemo(
    () =>
      data.filter((item) => {
        const searchMatches = `${item.title} ${item.lastMessage}`
          .toLowerCase()
          .includes(search.toLowerCase());
        return searchMatches && matchesConversationFilter(item, filter);
      }),
    [data, search, filter]
  );

  const people = useMemo(() => {
    if (!peopleEnabled) return [];
    const lowered = query.toLowerCase();
    const existing = new Set(data.map((item) => item.participantId).filter(Boolean));
    return (teachers.data ?? []).filter(
      (teacher) =>
        !existing.has(teacher.id) &&
        `${teacher.name} ${teacher.username}`.toLowerCase().includes(lowered)
    );
  }, [peopleEnabled, query, data, teachers.data]);

  const queryClient = useQueryClient();

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
          `${basePath}/${room.id}?tab=assignments&assignment=${submission.assignmentId}&submission=${link.id}`
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

  function startDirect(teacher: DirectTeacher) {
    if (teacher.roomId) {
      navigate(`${basePath}/${teacher.roomId}`);
      return;
    }
    requestDirect.mutate(teacher.id, {
      onSuccess: (room) => {
        toast.success(
          room.directStatus === "active"
            ? t("panel.directOpened")
            : t("panel.directRequestSent")
        );
        setSearch("");
        setSearchOpen(false);
        if (room.directStatus === "active") navigate(`${basePath}/${room.id}`);
      },
      onError: (error: Error) => toast.error(error.message),
    });
  }

  useEffect(() => {
    if (!searchOpen) return undefined;
    function closeSearch(event: PointerEvent) {
      if (searchRef.current?.contains(event.target as Node)) return;
      setSearch("");
      setSearchOpen(false);
    }
    document.addEventListener("pointerdown", closeSearch);
    return () => document.removeEventListener("pointerdown", closeSearch);
  }, [searchOpen]);

  return (
    <section
      className={`conversation-panel ${conversationId ? "has-active-chat" : ""}`}
      aria-label={t("panel.listAria")}
    >
      <div className="conversation-panel-header">
        <div className="panel-topbar">
          <div className="panel-search-zone" ref={searchRef}>
            <AnimatePresence initial={false} mode="popLayout">
              {searchOpen ? (
                <motion.label
                  key="search"
                  className="search-field panel-top-search"
                  initial={{ opacity: 0, scaleX: 0.88 }}
                  animate={{ opacity: 1, scaleX: 1 }}
                  exit={{ opacity: 0, scaleX: 0.9 }}
                  transition={{ duration: 0.18 }}
                >
                  <Search size={17} />
                  <input
                    autoFocus
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder={t("panel.searchPlaceholder")}
                    aria-label={t("panel.searchAria")}
                  />
                  <button
                    onClick={() => {
                      setSearch("");
                      setSearchOpen(false);
                    }}
                    aria-label={t("panel.closeSearchAria")}
                  >
                    <X size={15} />
                  </button>
                </motion.label>
              ) : (
                <motion.button
                  key="search-button"
                  className="panel-search-button"
                  onClick={() => setSearchOpen(true)}
                  aria-label={t("panel.openSearchAria")}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <Search size={19} />
                  <span>{t("panel.searchButton")}</span>
                </motion.button>
              )}
            </AnimatePresence>
          </div>
          <NotificationBell enabled={Boolean(user)} onOpenLink={openNotificationLink} />
          <span className="panel-role-badge">{t(`nav:roles.${role}`)}</span>
          <button className="panel-account" onClick={onOpenMenu} aria-label={t("panel.accountAria")}>
            <Avatar name={user?.name ?? t("common:portal.defaultUser")} tone="violet" size="sm" status="online" />
          </button>
        </div>

        <div className="conversation-filter-pills" role="tablist" aria-label={t("panel.filtersAria")}>
          {FILTERS.map((item) => (
            <button
              key={item.id}
              role="tab"
              aria-selected={filter === item.id}
              className={filter === item.id ? "is-active" : ""}
              onClick={() => setFilter(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className="conversation-list">
        {isLoading &&
          Array.from({ length: 6 }, (_, index) => (
            <div className="conversation-skeleton" key={index}>
              <span />
              <div>
                <i />
                <i />
              </div>
            </div>
          ))}
        {isError && (
          <div className="panel-state">
            <strong>{t("panel.loadError")}</strong>
            <p>{t("panel.loadErrorHint")}</p>
            <button onClick={() => refetch()}>{t("panel.retry")}</button>
          </div>
        )}
        {!isLoading &&
          !isError &&
          visible.map((conversation) => (
            <ConversationItem
              key={conversation.id}
              conversation={conversation}
              active={conversation.id === conversationId}
              basePath={basePath}
              live={Boolean(conversation.courseId && liveCourses.has(conversation.courseId))}
            />
          ))}
        {people.length ? (
          <>
            <span className="conversation-list-label">{t("panel.peopleLabel")}</span>
            {people.map((teacher) => (
              <button
                key={teacher.id}
                type="button"
                className="conversation-person"
                disabled={requestDirect.isPending}
                onClick={() => startDirect(teacher)}
              >
                <Avatar name={teacher.name} size="lg" />
                <span>
                  <strong>{teacher.name}</strong>
                  <small>@{teacher.username}</small>
                </span>
                <UserRoundPlus size={17} />
              </button>
            ))}
          </>
        ) : null}

        {!isLoading && !isError && visible.length === 0 && !people.length && (
          <div className="panel-state panel-state--empty">
            <span>
              <Search size={22} />
            </span>
            <strong>{t("panel.emptyTitle")}</strong>
            <p>{t("panel.emptyHint")}</p>
            <button
              onClick={() => {
                setSearch("");
                setFilter("all");
              }}
            >
              {t("panel.clearFilters")}
            </button>
          </div>
        )}
      </div>

      <motion.button
        className="new-conversation-fab"
        onClick={() => setDialogOpen(true)}
        aria-label={isTeacher ? t("panel.newGroupAria") : t("panel.findTeacherAria")}
        whileHover={{ y: -3, scale: 1.03 }}
        whileTap={{ scale: 0.94 }}
      >
        <Plus size={18} />
      </motion.button>

      {isTeacher ? (
        <NewConversationDialog open={dialogOpen} onOpenChange={setDialogOpen} />
      ) : (
        <StudentEnrollmentDialog open={dialogOpen} onOpenChange={setDialogOpen} />
      )}
    </section>
  );
}
