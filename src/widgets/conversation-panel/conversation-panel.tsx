import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Plus, RotateCcw, UserRoundPlus, X } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import {
  ConversationItem,
  matchesConversationFilter,
  NewConversationDialog,
  useConversationFilter,
  useConversations,
  useNewConversationStore,
  useRequestDirect,
  useTeachersForDirect,
  type ConversationFilter,
  type DirectTeacher,
} from "@/modules/conversation";
import { useLiveLessons } from "@/modules/lesson";
import { Avatar } from "@/shared/ui/legacy";
import { Icon } from "@/shared/ui/icon";
import { useAuth } from "@/modules/auth";
import { StudentEnrollmentDialog } from "@/modules/student";
import type { Conversation, ConversationRole } from "@/shared/types";

type GroupKey = "today" | "yesterday" | "earlier";

function useFilters(): Array<{ id: ConversationFilter; label: string }> {
  const { t } = useTranslation("chat");
  return [
    { id: "all", label: t("panel.filters.all") },
    { id: "direct", label: t("panel.filters.direct") },
    { id: "group", label: t("panel.filters.group") },
    { id: "unread", label: t("panel.filters.unread") },
  ];
}

function groupKeyOf(value: string): GroupKey {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "earlier";
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  if (date.getTime() >= start.getTime()) return "today";
  if (date.getTime() >= start.getTime() - 86_400_000) return "yesterday";
  return "earlier";
}

export interface ConversationPanelProps {
  role?: ConversationRole;
  hidden?: boolean;
}

export function ConversationPanel({ role = "teacher", hidden = false }: ConversationPanelProps) {
  const { t } = useTranslation("chat");
  const FILTERS = useFilters();
  const [search, setSearch] = useState("");
  const { filter, setFilter } = useConversationFilter();
  const dialogOpen = useNewConversationStore((state) => state.open);
  const setDialogOpen = useNewConversationStore((state) => state.setOpen);
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
    [liveLessons],
  );

  const visible = useMemo(
    () =>
      data.filter((item) => {
        const searchMatches = `${item.title} ${item.lastMessage}`
          .toLowerCase()
          .includes(search.toLowerCase());
        return searchMatches && matchesConversationFilter(item, filter);
      }),
    [data, search, filter],
  );

  const groups = useMemo(() => {
    const buckets: Array<{ key: GroupKey; items: Conversation[] }> = [
      { key: "today", items: [] },
      { key: "yesterday", items: [] },
      { key: "earlier", items: [] },
    ];
    for (const item of visible) {
      const bucket = buckets.find((entry) => entry.key === groupKeyOf(item.updatedAt));
      bucket?.items.push(item);
    }
    return buckets.filter((entry) => entry.items.length > 0);
  }, [visible]);

  const people = useMemo(() => {
    if (!peopleEnabled) return [];
    const lowered = query.toLowerCase();
    const existing = new Set(data.map((item) => item.participantId).filter(Boolean));
    return (teachers.data ?? []).filter(
      (teacher) =>
        !existing.has(teacher.id) &&
        `${teacher.name} ${teacher.username}`.toLowerCase().includes(lowered),
    );
  }, [peopleEnabled, query, data, teachers.data]);

  function startDirect(teacher: DirectTeacher) {
    if (teacher.roomId) {
      navigate(`${basePath}/${teacher.roomId}`);
      return;
    }
    requestDirect.mutate(teacher.id, {
      onSuccess: (room) => {
        toast.success(
          room.directStatus === "active" ? t("panel.directOpened") : t("panel.directRequestSent"),
        );
        setSearch("");
        if (room.directStatus === "active") navigate(`${basePath}/${room.id}`);
      },
      onError: (error: Error) => toast.error(error.message),
    });
  }

  return (
    <section
      className={`relative min-h-0 w-full shrink-0 flex-col gap-4 border-r border-line bg-surface p-5 pb-20 lg:flex lg:w-(--conversation-width) lg:pb-5 ${
        hidden ? "hidden" : "flex"
      }`}
      aria-label={t("panel.listAria")}
    >
      <label className="flex h-(--size-control-xl) shrink-0 items-center gap-3 rounded-2xl border border-line bg-surface px-4 text-ink focus-within:border-focus">
        <Icon name="search" size={20} className="shrink-0 text-ink-tertiary" />
        <input
          className="h-full min-w-0 flex-1 bg-transparent text-body text-ink outline-none placeholder:text-ink-tertiary"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder={t("panel.searchPlaceholder")}
          aria-label={t("panel.searchAria")}
        />
        {search ? (
          <button
            type="button"
            className="grid size-6 shrink-0 place-items-center rounded-full text-ink-tertiary hover:bg-subtle hover:text-ink"
            onClick={() => setSearch("")}
            aria-label={t("panel.closeSearchAria")}
          >
            <X size={15} />
          </button>
        ) : null}
      </label>

      <div
        className="flex shrink-0 items-center gap-2 overflow-x-auto"
        role="tablist"
        aria-label={t("panel.filtersAria")}
      >
        {FILTERS.map((item) => {
          const active = filter === item.id;
          return (
            <button
              key={item.id}
              role="tab"
              aria-selected={active}
              className={`flex h-10 shrink-0 items-center rounded-full border px-4 text-label-strong transition-colors ${
                active
                  ? "border-action bg-action-subtle text-action"
                  : "border-line bg-surface text-ink-secondary hover:bg-subtle hover:text-ink"
              }`}
              onClick={() => setFilter(item.id)}
            >
              {item.label}
            </button>
          );
        })}
      </div>

      <div className="-mr-2 flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto pr-2 pb-20">
        {isLoading &&
          Array.from({ length: 6 }, (_, index) => (
            <div
              key={index}
              className="flex h-[82px] shrink-0 animate-pulse items-center gap-3.5 px-1 py-4"
            >
              <span className="size-12 shrink-0 rounded-[14px] bg-muted" />
              <div className="flex min-w-0 flex-1 flex-col gap-2.5">
                <i className="h-2.5 w-2/5 rounded-full bg-muted" />
                <i className="h-2.5 w-4/5 rounded-full bg-muted" />
              </div>
            </div>
          ))}

        {isError && (
          <div className="my-auto flex flex-col items-center gap-2 px-6 text-center">
            <strong className="font-heading text-h3 text-ink">{t("panel.loadError")}</strong>
            <p className="max-w-[260px] text-body-sm text-ink-secondary">
              {t("panel.loadErrorHint")}
            </p>
            <button
              className="mt-3 flex h-12 items-center gap-2 rounded-full bg-muted px-5 text-label-strong text-ink transition-colors hover:bg-subtle"
              onClick={() => refetch()}
            >
              <RotateCcw size={17} />
              {t("panel.retry")}
            </button>
          </div>
        )}

        {!isLoading &&
          !isError &&
          groups.map((group) => (
            <div key={group.key} className="flex flex-col gap-2">
              <span className="px-1 pt-2 text-label-strong text-ink-tertiary">
                {t(`panel.groups.${group.key}`)}
              </span>
              {group.items.map((conversation) => (
                <ConversationItem
                  key={conversation.id}
                  conversation={conversation}
                  active={conversation.id === conversationId}
                  basePath={basePath}
                  live={Boolean(conversation.courseId && liveCourses.has(conversation.courseId))}
                />
              ))}
            </div>
          ))}

        {people.length ? (
          <>
            <span className="px-1 pt-2 text-label-strong text-ink-tertiary">
              {t("panel.peopleLabel")}
            </span>
            {people.map((teacher) => (
              <button
                key={teacher.id}
                type="button"
                className="flex h-[82px] shrink-0 items-center gap-3.5 rounded-xl border border-line bg-surface p-4 text-left transition-colors hover:bg-subtle disabled:opacity-60"
                disabled={requestDirect.isPending}
                onClick={() => startDirect(teacher)}
              >
                <Avatar name={teacher.name} size="lg" />
                <span className="flex min-w-0 flex-1 flex-col">
                  <strong className="truncate text-title text-ink">{teacher.name}</strong>
                  <small className="truncate text-body-sm text-ink-secondary">
                    @{teacher.username}
                  </small>
                </span>
                <UserRoundPlus size={17} className="shrink-0 text-ink-tertiary" />
              </button>
            ))}
          </>
        ) : null}

        {!isLoading && !isError && data.length > 0 && visible.length === 0 && !people.length && (
          <div className="my-auto flex flex-col items-center gap-2 px-6 text-center">
            <strong className="font-heading text-h3 text-ink">{t("panel.emptyTitle")}</strong>
            <p className="max-w-[260px] text-body-sm text-ink-secondary">{t("panel.emptyHint")}</p>
            <button
              className="mt-3 flex h-12 items-center gap-2 rounded-full bg-muted px-5 text-label-strong text-ink transition-colors hover:bg-subtle"
              onClick={() => {
                setSearch("");
                setFilter("all");
              }}
            >
              <RotateCcw size={17} />
              {t("panel.clearFilters")}
            </button>
          </div>
        )}
      </div>

      {data.length > 0 ? (
        <motion.button
          className="absolute right-5 bottom-24 grid size-14 place-items-center rounded-full bg-action text-on-action shadow-lg lg:bottom-5"
          onClick={() => setDialogOpen(true)}
          aria-label={isTeacher ? t("panel.newGroupAria") : t("panel.findTeacherAria")}
          whileHover={{ y: -3, scale: 1.03 }}
          whileTap={{ scale: 0.94 }}
        >
          <Plus size={20} />
        </motion.button>
      ) : null}

      {isTeacher ? (
        <NewConversationDialog open={dialogOpen} onOpenChange={setDialogOpen} />
      ) : (
        <StudentEnrollmentDialog open={dialogOpen} onOpenChange={setDialogOpen} />
      )}
    </section>
  );
}
