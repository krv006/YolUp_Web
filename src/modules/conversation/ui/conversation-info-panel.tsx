import { useRef, useState, type FormEvent } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { GraduationCap, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { initials, storage } from "@/shared/lib";
import { useAuth } from "@/modules/auth";
import {
  CourseMembersSection,
  JoinRequestsDialog,
  useCourse,
  useCourseRequests,
  useDeleteCourse,
  useSubjects,
  useUpdateCourse,
  useUpdateCourseAvatar,
} from "@/modules/course";
import { useChatUiStore, messageApi, messageKeys } from "@/modules/message";
import {
  DIRECT_STATUS,
  InviteStudentsDialog,
  useAnnouncementMode,
  useDirectStatusLabel,
  useRespondDirect,
  useSetRoomImage,
} from "@/modules/conversation";
import type { CourseFormInput } from "@/modules/course";
import type { Conversation } from "@/shared/types";
import { Avatar } from "@/shared/ui/legacy";
import { SelectPicker } from "@/shared/ui/legacy/form-pickers";
import { Dialog, DialogContent, DialogTitle } from "@/shared/ui/dialog";
import { AppDialog, dialogButton } from "@/shared/ui/app-dialog";
import { Icon } from "@/shared/ui/icon";
import { Switch } from "@/shared/ui/switch";
import type { DirectAction } from "../api/conversation.dto";
import { useIsCompact } from "@/shared/hooks/use-media-query";
import { MobileGroupInfo } from "./mobile-group-info";
import { MOBILE_INPUT, MobileFieldLabel, MobilePickerField } from "@/shared/ui/mobile-fields";

export interface ConversationInfoPanelProps {
  conversation: Conversation;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Renders as a fixed right column instead of a sliding sheet. */
  embedded?: boolean;
}

const TILE =
  "flex flex-col items-center justify-center gap-1.5 rounded-xl border border-line bg-surface px-2 py-3 text-caption-strong text-ink transition-colors hover:bg-subtle disabled:opacity-50";
const WIDE_ACTION =
  "flex h-[62px] flex-col items-center justify-center gap-1 rounded-xl bg-subtle px-2 text-caption-strong text-ink transition-colors hover:bg-muted disabled:opacity-50";

export function ConversationInfoPanel({
  conversation,
  open,
  onOpenChange,
  embedded = false,
}: ConversationInfoPanelProps) {
  const { t } = useTranslation("chat");
  const directStatusLabel = useDirectStatusLabel();
  const { user } = useAuth();
  const navigate = useNavigate();
  const isGroup = conversation.type === "group";
  const muteKey = `fokus_muted_${conversation.id}`;
  const [muted, setMuted] = useState(() => storage.get(muteKey) === "true");
  const [copied, setCopied] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const subjects = useSubjects(editOpen);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [requestsOpen, setRequestsOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [courseForm, setCourseForm] = useState<CourseFormInput>({
    title: "",
    subject: "",
    description: "",
  });
  const course = useCourse(open ? conversation.courseId : null);
  const respond = useRespondDirect();
  const updateCourse = useUpdateCourse();
  const deleteCourse = useDeleteCourse();
  const setRoomImage = useSetRoomImage();
  const updateCourseAvatar = useUpdateCourseAvatar();
  const openChatSearch = useChatUiStore((state) => state.setSearchOpen);
  const announcement = Boolean(conversation.announcementOnly);
  const announcementMode = useAnnouncementMode();
  const pinnedQuery = useQuery({
    queryKey: messageKeys.pinned(conversation.id),
    queryFn: ({ signal }) => messageApi.getPinned(conversation.id, { signal }),
    enabled: open && conversation.type === "group",
  });
  const pinnedMessage = (pinnedQuery.data ?? [])[0];
  const roomMembers = useQuery({
    queryKey: messageKeys.members(conversation.id, ""),
    queryFn: ({ signal }) => messageApi.getMembers(conversation.id, "", { signal }),
    enabled: open && isGroup,
  });
  const [tab, setTab] = useState<"members" | "files" | "media">("members");
  const imageRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const isCompact = useIsCompact();

  function toggleMute() {
    const next = !muted;
    setMuted(next);
    storage.set(muteKey, next);
    toast.success(next ? t("info.mutedOn") : t("info.mutedOff"));
  }

  async function copyUsername() {
    const value = conversation.participant?.username
      ? `@${conversation.participant.username}`
      : "";
    if (!value) return;
    await navigator.clipboard.writeText(value);
    setCopied(true);
    toast.success(t("info.usernameCopied"));
    setTimeout(() => setCopied(false), 1400);
  }

  function respondDirect(action: DirectAction) {
    respond.mutate(
      { roomId: conversation.id, action },
      {
        onSuccess: () => {
          toast.success(
            action === "accept" ? t("info.conversationAccepted") : t("info.conversationBlocked")
          );
          onOpenChange(false);
        },
        onError: (error: Error) => toast.error(error.message),
      }
    );
  }

  function beginEdit() {
    setCourseForm({
      title: conversation.title || "",
      subject: conversation.subject || "",
      description: conversation.description || "",
    });
    setEditOpen(true);
  }

  function saveCourse(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    updateCourse.mutate(
      { id: conversation.courseId as string, form: courseForm },
      { onSuccess: () => setEditOpen(false), onError: (error: Error) => toast.error(error.message) }
    );
  }

  function removeCourse() {
    deleteCourse.mutate(conversation.courseId as string, {
      onSuccess: () => {
        setDeleteOpen(false);
        onOpenChange(false);
        navigate("/teacher/chats", { replace: true });
      },
      onError: (error: Error) => toast.error(error.message),
    });
  }

  const teacherGroup = isGroup && user?.role === "TEACHER";
  const joinRequests = useCourseRequests({ page_size: 50 }, open && teacherGroup);
  const pendingRequests = (joinRequests.data?.items ?? []).filter(
    (item) => item.courseId === conversation.courseId
  );

  function uploadImage(file: File) {
    const done = {
      onSuccess: () => toast.success(t("info.groupImageUpdated")),
      onError: (error: Error) => toast.error(error.message),
    };
    if (conversation.courseId) updateCourseAvatar.mutate({ id: conversation.courseId, file }, done);
    else setRoomImage.mutate({ roomId: conversation.id, image: file }, done);
  }

  function togglePinned() {
    if (!pinnedMessage) {
      toast.info(t("info.pinHint"));
      return;
    }
    void messageApi
      .unpin(conversation.id, pinnedMessage.messageId)
      .then((items) => queryClient.setQueryData(messageKeys.pinned(conversation.id), items));
  }

  const groupInfo = isGroup && (embedded || isCompact);

  const body = groupInfo ? (
    <MobileGroupInfo
      variant={embedded ? "panel" : "screen"}
      conversation={conversation}
      subjectLabel={course.data?.subjectLabel}
      muted={muted}
      announcement={announcement}
      requestsCount={pendingRequests.length}
      canManage={teacherGroup}
      imagePending={setRoomImage.isPending || updateCourseAvatar.isPending}
      onBack={() => onOpenChange(false)}
      onEdit={beginEdit}
      onToggleMute={toggleMute}
      onSearch={() => {
        onOpenChange(false);
        openChatSearch(true);
      }}
      onPinned={togglePinned}
      onAnnouncement={(value) =>
        announcementMode.mutate(
          { roomId: conversation.id, enabled: value },
          { onError: (error: Error) => toast.error(error.message) }
        )
      }
      onImage={uploadImage}
      onDelete={() => setDeleteOpen(true)}
    />
  ) : (
    <>
          <header className="flex h-16 shrink-0 items-center gap-3 px-4 lg:h-[72px] lg:px-6">
            <button
              className="grid size-10 shrink-0 place-items-center rounded-full text-ink transition-colors hover:bg-subtle lg:hidden"
              onClick={() => onOpenChange(false)}
              aria-label={t("info.backAria")}
            >
              <Icon name="arrow-back" size={22} />
            </button>
            {embedded ? (
              <h2 className="min-w-0 flex-1 truncate text-title-lg text-ink">
                {t("info.panelTitle")}
              </h2>
            ) : (
              <DialogTitle className="min-w-0 flex-1 truncate font-heading text-title text-ink lg:text-h3">
                <span className="lg:hidden">{t("info.panelTitle")}</span>
                <span className="hidden lg:inline">{conversation.title}</span>
              </DialogTitle>
            )}
            {teacherGroup ? (
              <button
                className="grid size-10 shrink-0 place-items-center rounded-full text-ink-secondary transition-colors hover:bg-subtle hover:text-ink"
                onClick={beginEdit}
                aria-label={t("info.editCourse")}
              >
                <Icon name="edit" size={19} />
              </button>
            ) : null}
            <button
              className="hidden size-10 shrink-0 place-items-center rounded-full text-icon-secondary transition-colors hover:bg-subtle hover:text-ink lg:grid"
              onClick={() => onOpenChange(false)}
              aria-label={t("info.closeAria")}
            >
              <Icon name="close" size={20} />
            </button>
          </header>

          <div
            className={`flex min-h-0 flex-1 flex-col overflow-hidden px-4 pb-4 ${
              embedded ? "lg:px-5 lg:pb-5" : "lg:px-6 lg:pb-6"
            }`}
          >
           <div
             className={`flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-4 ${
               embedded ? "lg:p-0" : "rounded-2xl border border-line lg:p-5"
             }`}
           >
            <section className="flex flex-col items-center gap-1 px-1 pt-2">
              <span className="relative">
                {conversation.imageUrl ? (
                  <img
                    className="size-22 rounded-full object-cover"
                    src={conversation.imageUrl}
                    alt={conversation.title}
                  />
                ) : (
                  <span className="grid size-22 place-items-center rounded-full bg-action-subtle font-heading text-h3 text-action">
                    {initials(conversation.title)}
                  </span>
                )}
                {teacherGroup ? (
                  <>
                    <input
                      ref={imageRef}
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      hidden
                      onChange={(event) => {
                        const file = event.target.files?.[0];
                        event.target.value = "";
                        if (!file) return;
                        const done = {
                          onSuccess: () => toast.success(t("info.groupImageUpdated")),
                          onError: (error: Error) => toast.error(error.message),
                        };
                        // Guruh rasmi kursda saqlanadi — chat xonasi uni avtomatik oladi.
                        if (conversation.courseId)
                          updateCourseAvatar.mutate(
                            { id: conversation.courseId, file },
                            done
                          );
                        else setRoomImage.mutate({ roomId: conversation.id, image: file }, done);
                      }}
                    />
                    <button
                      type="button"
                      className="absolute right-1/2 bottom-0 grid size-9 translate-x-1/2 translate-y-1/3 place-items-center rounded-full border border-line bg-surface text-ink shadow-sm disabled:opacity-60"
                      aria-label={t("info.changeGroupImageAria")}
                      disabled={setRoomImage.isPending || updateCourseAvatar.isPending}
                      onClick={() => imageRef.current?.click()}
                    >
                      {setRoomImage.isPending || updateCourseAvatar.isPending ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <Icon name="camera" size={16} />
                      )}
                    </button>
                  </>
                ) : null}
              </span>

              <h3 className="mt-3 text-center font-heading text-h3 text-ink">
                {conversation.title}
              </h3>
              <p className="text-body-sm text-ink-tertiary">
                {isGroup
                  ? `${t("info.memberCount", {
                      count: roomMembers.data?.length ?? conversation.memberCount ?? 0,
                    })}${
                      conversation.onlineCount
                        ? ` · ${t("info.onlineCount", { count: conversation.onlineCount })}`
                        : ""
                    }`
                  : directStatusLabel(conversation.directStatus, t("directStatus.active"))}
              </p>

              <div className="mt-4 grid w-full grid-cols-3 gap-2 lg:hidden">
                <button
                  className={TILE}
                  onClick={() => {
                    onOpenChange(false);
                    openChatSearch(true);
                  }}
                >
                  <Icon name="search" size={20} className="text-action" />
                  {t("info.search")}
                </button>
                <button className={TILE} onClick={toggleMute}>
                  <Icon name="volume" size={20} className="text-action" />
                  {muted ? t("info.muteOn") : t("info.muteOff")}
                </button>
                {teacherGroup ? (
                  <button className={TILE} onClick={() => setInviteOpen(true)}>
                    <Icon name="add" size={20} className="text-action" />
                    {t("info.invite")}
                  </button>
                ) : null}
              </div>

              <div
                className={`mt-5 hidden w-full gap-2 lg:grid ${
                  teacherGroup ? "lg:grid-cols-4" : "lg:grid-cols-3"
                }`}
              >
                <button className={WIDE_ACTION} onClick={toggleMute}>
                  <Icon name={muted ? "notifications-off" : "volume"} size={20} />
                  {muted ? t("info.muteOn") : t("info.muteOff")}
                </button>
                <button
                  className={WIDE_ACTION}
                  onClick={() => {
                    if (!embedded) onOpenChange(false);
                    openChatSearch(true);
                  }}
                >
                  <Icon name="search" size={20} />
                  {t("info.search")}
                </button>
                {teacherGroup ? (
                  <button className={WIDE_ACTION} onClick={() => setInviteOpen(true)}>
                    <Icon name="person-add" size={20} />
                    {t("info.invite")}
                  </button>
                ) : null}
                <button
                  className={WIDE_ACTION}
                  onClick={() => {
                    if (!pinnedMessage) {
                      toast.info(t("info.pinHint"));
                      return;
                    }
                    void messageApi
                      .unpin(conversation.id, pinnedMessage.messageId)
                      .then((items) =>
                        queryClient.setQueryData(messageKeys.pinned(conversation.id), items)
                      );
                  }}
                >
                  <Icon name="pin" size={20} />
                  {t("info.pinned")}
                </button>
              </div>

              {teacherGroup ? (
                <section className="mt-4 hidden w-full items-center gap-3 rounded-lg bg-surface px-4 py-3.5 lg:flex">
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-accent-saffron-bg text-accent-saffron-fg">
                    <Icon name="bolt" size={20} />
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col">
                    <strong className="text-label-strong text-ink">
                      {t("info.announcementTitle")}
                    </strong>
                    <small className="text-caption text-ink-tertiary">
                      {t("info.announcementHint")}
                    </small>
                  </span>
                  <Switch
                    checked={announcement}
                    onCheckedChange={(value) =>
                      announcementMode.mutate(
                        { roomId: conversation.id, enabled: value },
                        { onError: (error: Error) => toast.error(error.message) }
                      )
                    }
                    aria-label={t("info.announcementTitle")}
                  />
                </section>
              ) : null}
            </section>

            {teacherGroup ? (
              <section className="flex items-center gap-3 rounded-2xl border border-line bg-surface px-4 py-3.5 lg:hidden">
                <Icon name="bell" size={20} className="shrink-0 text-ink-secondary" />
                <span className="flex min-w-0 flex-1 flex-col">
                  <strong className="text-label-strong text-ink">
                    {t("info.announcementTitle")}
                  </strong>
                  <small className="text-caption text-ink-tertiary">
                    {t("info.announcementHint")}
                  </small>
                </span>
                <Switch
                  checked={announcement}
                  onCheckedChange={(value) =>
                    announcementMode.mutate(
                      { roomId: conversation.id, enabled: value },
                      { onError: (error: Error) => toast.error(error.message) }
                    )
                  }
                  aria-label={t("info.announcementTitle")}
                />
              </section>
            ) : null}

            <section className={`flex-col gap-2 ${isGroup ? "hidden lg:flex" : "flex"}`}>
              <span className="px-1 text-label-strong text-ink">
                {isGroup ? t("info.aboutGroupPlain") : t("info.aboutDirect")}
              </span>
              {isGroup ? (
                <p className="px-1 text-caption text-ink-tertiary">
                  {conversation.description || t("info.groupDescriptionFallback")}
                </p>
              ) : (
                <button
                  className="flex items-center gap-3 rounded-xl border border-line bg-surface px-4 py-3 text-left transition-colors hover:bg-subtle"
                  onClick={copyUsername}
                >
                  <Icon name="person" size={20} className="shrink-0 text-ink-secondary" />
                  <span className="flex min-w-0 flex-1 flex-col">
                    <small className="text-caption text-ink-tertiary">
                      {t("info.usernameHint")}
                    </small>
                    <strong className="truncate text-label-strong text-ink">
                      @{conversation.participant?.username || "—"}
                    </strong>
                  </span>
                  <Icon
                    name={copied ? "check-circle" : "eye"}
                    size={18}
                    className="shrink-0 text-ink-tertiary"
                  />
                </button>
              )}
            </section>

            {teacherGroup && pendingRequests.length ? (
              <button
                type="button"
                className="flex items-center gap-3 rounded-xl border border-line bg-surface px-4 py-3 text-left transition-colors hover:bg-subtle"
                onClick={() => setRequestsOpen(true)}
              >
                <span className="grid size-9 shrink-0 place-items-center rounded-full bg-action-subtle text-action">
                  <Icon name="groups" size={18} />
                </span>
                <span className="flex min-w-0 flex-1 flex-col">
                  <strong className="truncate text-label-strong text-ink">
                    {t("info.joinRequests", { count: pendingRequests.length })}
                  </strong>
                  <small className="truncate text-caption text-ink-tertiary">
                    {t("info.joinRequestsHint")}
                  </small>
                </span>
                <Icon name="chevron-right" size={18} className="shrink-0 text-ink-tertiary" />
              </button>
            ) : null}

            {isGroup ? (
              <section className="flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  {(
                    [
                      [
                        "members",
                        t("info.tabMembers", {
                          count: roomMembers.data?.length ?? conversation.memberCount ?? 0,
                        }),
                      ],
                      ["files", t("info.tabFiles")],
                      ["media", t("info.tabMedia")],
                    ] as const
                  ).map(([id, label]) => (
                    <button
                      key={id}
                      type="button"
                      className={`h-9 rounded-full px-3.5 text-label-strong transition-colors ${
                        tab === id
                          ? "bg-action-subtle text-action"
                          : "text-ink-secondary hover:bg-subtle"
                      }`}
                      onClick={() => setTab(id)}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                {tab === "members" ? (
                  teacherGroup ? (
                    <CourseMembersSection courseId={conversation.courseId} canManage />
                  ) : (
                    <div className="flex flex-col gap-2">
                      {(roomMembers.data ?? []).map((member) => (
                        <div
                          key={member.id}
                          className="flex items-center gap-3 rounded-xl border border-line bg-surface px-4 py-3"
                        >
                          <Avatar name={member.name} src={member.avatarUrl ?? undefined} size="sm" />
                          <span className="flex min-w-0 flex-1 flex-col">
                            <strong className="truncate text-label-strong text-ink">
                              {member.name}
                            </strong>
                            <small
                              className={`truncate text-caption ${
                                member.isOnline ? "text-success-text" : "text-ink-tertiary"
                              }`}
                            >
                              {member.isOnline ? t("info.online") : `@${member.username}`}
                            </small>
                          </span>
                          {member.role === "teacher" ? (
                            <span className="shrink-0 rounded-full bg-saffron-subtle px-2.5 py-1 text-caption-strong text-saffron-strong">
                              {t("info.teacherBadge")}
                            </span>
                          ) : null}
                        </div>
                      ))}
                      {!roomMembers.data?.length ? (
                        <p className="px-1 text-body-sm text-ink-tertiary">
                          {roomMembers.isLoading ? t("info.loading") : t("info.noInfo")}
                        </p>
                      ) : null}
                    </div>
                  )
                ) : (
                  <div className="flex flex-col items-center gap-2 rounded-2xl border border-line bg-surface px-6 py-10 text-center">
                    <span className="grid size-12 place-items-center rounded-full bg-subtle text-ink-tertiary">
                      <Icon name={tab === "files" ? "assign" : "camera"} size={22} />
                    </span>
                    <strong className="text-label-strong text-ink">
                      {tab === "files" ? t("info.filesEmpty") : t("info.mediaEmpty")}
                    </strong>
                    <small className="text-caption text-ink-tertiary">
                      {t("info.sectionPending")}
                    </small>
                  </div>
                )}
              </section>
            ) : null}

            {isGroup && !teacherGroup ? (
              <section className="flex flex-col gap-2">
                <span className="px-1 text-label-strong text-ink-tertiary">
                  {t("info.teacherSection")}
                </span>
                {course.data ? (
                  <div className="flex items-center gap-3 rounded-xl border border-line bg-surface px-4 py-3">
                    <Avatar
                      name={course.data.teacher}
                      tone={course.data.teacherUser?.avatarTone}
                      size="sm"
                    />
                    <span className="flex min-w-0 flex-col">
                      <strong className="truncate text-label-strong text-ink">
                        {course.data.teacher}
                      </strong>
                      {course.data.teacherUser?.username ? (
                        <small className="truncate text-caption text-ink-tertiary">
                          @{course.data.teacherUser.username}
                        </small>
                      ) : null}
                    </span>
                  </div>
                ) : (
                  <p className="px-1 text-body-sm text-ink-secondary">
                    {course.isLoading ? t("info.loading") : t("info.noInfo")}
                  </p>
                )}
              </section>
            ) : null}

            {!isGroup &&
            user?.role === "TEACHER" &&
            conversation.directStatus === DIRECT_STATUS.PENDING ? (
              <button
                className="flex h-14 items-center justify-center gap-2 rounded-xl bg-action text-label-strong text-on-action disabled:opacity-60"
                disabled={respond.isPending}
                onClick={() => respondDirect("accept")}
              >
                <Icon name="check-circle" size={18} /> {t("info.acceptConversation")}
              </button>
            ) : null}

            {!isGroup &&
            user?.role === "TEACHER" &&
            conversation.directStatus !== DIRECT_STATUS.BLOCKED ? (
              <button
                className="flex h-14 items-center justify-center gap-2 rounded-xl bg-error-bg text-label-strong text-error-text disabled:opacity-60"
                disabled={respond.isPending}
                onClick={() => respondDirect("block")}
              >
                <Icon name="error" size={18} /> {t("info.blockUser")}
              </button>
            ) : null}
            {teacherGroup ? (
              <button
                className="mt-auto flex h-14 w-full shrink-0 items-center justify-center gap-2 rounded-xl bg-error-bg text-label-strong text-error-text transition-opacity hover:opacity-90"
                onClick={() => setDeleteOpen(true)}
              >
                <Icon name="trash" size={18} /> {t("info.deleteCourse")}
              </button>
            ) : null}
           </div>
          </div>
    </>
  );

  return (
    <>
      {embedded ? (
        <aside className="hidden h-full w-[340px] shrink-0 flex-col border-l border-line-subtle bg-surface lg:flex">
          {body}
        </aside>
      ) : (
        <Dialog open={open} onOpenChange={onOpenChange}>
          <DialogContent
            showCloseButton={false}
            className="top-0 right-0 left-auto flex h-dvh w-full max-w-full translate-x-0 translate-y-0 flex-col gap-0 rounded-none border-0 bg-surface p-0 text-ink data-[state=closed]:zoom-out-100 data-[state=open]:zoom-in-100 sm:max-w-full lg:w-[520px] lg:max-w-[520px] lg:border-l lg:border-line"
        >
            {body}
          </DialogContent>
        </Dialog>
      )}


      <InviteStudentsDialog
        open={inviteOpen}
        onOpenChange={setInviteOpen}
        title={conversation.title}
      />

      <JoinRequestsDialog
        courseId={conversation.courseId}
        open={requestsOpen}
        onOpenChange={setRequestsOpen}
      />

      <AppDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        variant="adaptive"
        title={t("info.editCourseTitle")}
        description={t("info.editCourseDescription")}
        footer={
          <>
            <button
              type="button"
              className={dialogButton.secondary}
              onClick={() => setEditOpen(false)}
            >
              {t("info.cancel")}
            </button>
            <button
              type="submit"
              form="course-edit-form"
              className={dialogButton.primary}
              disabled={updateCourse.isPending}
            >
              {t("info.save")}
            </button>
          </>
        }
      >
        <form id="course-edit-form" className="flex flex-col gap-4" onSubmit={saveCourse}>
          <label className="field-group max-lg:hidden">
            <span>{t("info.courseName")}</span>
            <input
              value={courseForm.title}
              onChange={(event) =>
                setCourseForm((value) => ({ ...value, title: event.target.value }))
              }
              required={!isCompact}
            />
          </label>
          <div className="lg:hidden">
            <MobileFieldLabel label={t("info.courseName")}>
              <input
                className={MOBILE_INPUT}
                value={courseForm.title}
                onChange={(event) => setCourseForm((value) => ({ ...value, title: event.target.value }))}
                required={isCompact}
              />
            </MobileFieldLabel>
          </div>
          <div className="lg:hidden">
            <MobileFieldLabel label={t("info.subject")}>
              <MobilePickerField
                type="select"
                value={courseForm.subject ?? ""}
                display={
                  (subjects.data ?? []).find((item) => item.value === courseForm.subject)?.label ?? "—"
                }
                options={(subjects.data ?? []).map((item) => ({ value: item.value, label: item.label }))}
                ariaLabel={t("info.subject")}
                onChange={(value) => setCourseForm((current) => ({ ...current, subject: value }))}
              />
            </MobileFieldLabel>
          </div>
          <div className="max-lg:hidden">
          <SelectPicker
            label={t("info.subject")}
            icon={GraduationCap}
            value={courseForm.subject ?? ""}
            onChange={(value) => setCourseForm((current) => ({ ...current, subject: value }))}
            options={(subjects.data ?? []).map((item) => ({
              value: item.value,
              label: item.label,
            }))}
          />
          </div>
          <div className="lg:hidden">
            <MobileFieldLabel label={t("info.descriptionShort")}>
              <textarea
                className={`${MOBILE_INPUT} h-28 resize-none py-3.5`}
                value={courseForm.description}
                onChange={(event) => setCourseForm((value) => ({ ...value, description: event.target.value }))}
              />
            </MobileFieldLabel>
          </div>
          <label className="field-group max-lg:hidden">
            <span>{t("info.descriptionOptional")}</span>
            <textarea
              value={courseForm.description}
              onChange={(event) =>
                setCourseForm((value) => ({ ...value, description: event.target.value }))
              }
              rows={4}
            />
          </label>
        </form>
      </AppDialog>

      <AppDialog
        open={deleteOpen}
        onOpenChange={(open) => {
          setDeleteOpen(open);
          if (!open) setDeleteConfirmation("");
        }}
        variant="adaptive"
        title={t("info.deleteCourseConfirmTitle", { title: conversation.title })}
        footer={
          <>
            <button
              type="button"
              className={dialogButton.secondary}
              onClick={() => {
                setDeleteOpen(false);
                setDeleteConfirmation("");
              }}
            >
              {t("info.cancel")}
            </button>
            <button
              type="button"
              className={dialogButton.danger}
              disabled={
                deleteCourse.isPending ||
                deleteConfirmation.trim() !== (conversation.title ?? "").trim()
              }
              onClick={removeCourse}
            >
              {t("info.deleteConfirm")}
            </button>
          </>
        }
      >
        <p className="flex items-start gap-2.5 rounded-md bg-danger-bg px-4 py-3.5 text-body-xs text-danger max-lg:rounded-xl max-lg:text-body-sm max-lg:text-error-text">
          <Icon name="warning" size={18} className="mt-0.5 shrink-0" />
          {t("info.deleteCourseWarning")}
        </p>
        <div className="lg:hidden">
          <MobileFieldLabel label={t("info.deleteTypeName")}>
            <input
              className={MOBILE_INPUT}
              value={deleteConfirmation}
              onChange={(event) => setDeleteConfirmation(event.target.value)}
              placeholder={conversation.title}
              autoComplete="off"
            />
          </MobileFieldLabel>
        </div>
        <label className="field-group max-lg:hidden">
          <span>{t("info.deleteTypeName")}</span>
          <input
            value={deleteConfirmation}
            onChange={(event) => setDeleteConfirmation(event.target.value)}
            placeholder={conversation.title}
            autoComplete="off"
          />
        </label>
      </AppDialog>
    </>
  );
}
