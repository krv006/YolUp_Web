import { useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import {
  AddStudentDialog,
  InviteLinkDialog,
  JoinRequestsDialog,
  useCourseStudentPresence,
  useCourseStudents,
  useUnenrollStudent,
} from "@/modules/course";
import { useAuth } from "@/modules/auth";
import { formatRelativeShort } from "@/shared/lib";
import type { Conversation, DomainUser } from "@/shared/types";
import { ConfirmDialog } from "@/shared/ui/confirm-dialog";
import { Dropdown, DropdownContent, DropdownItem, DropdownTrigger, Avatar } from "@/shared/ui/legacy";
import { GroupTile } from "@/shared/ui/group-tile";
import { Icon } from "@/shared/ui/icon";
import { MobileEmptyCard } from "@/shared/ui/mobile-page";
import { Switch } from "@/shared/ui/switch";
import { DialogTitle } from "@/shared/ui/dialog";

export interface MobileGroupInfoProps {
  conversation: Conversation;
  subjectLabel?: string;
  muted: boolean;
  announcement: boolean;
  requestsCount: number;
  canManage: boolean;
  imagePending: boolean;
  onBack: () => void;
  onEdit: () => void;
  onToggleMute: () => void;
  onSearch: () => void;
  onPinned: () => void;
  onAnnouncement: (value: boolean) => void;
  onImage: (file: File) => void;
  onDelete: () => void;
}

type Tab = "members" | "files" | "media";

export function MobileGroupInfo({
  conversation,
  subjectLabel,
  muted,
  announcement,
  requestsCount,
  canManage,
  imagePending,
  onBack,
  onEdit,
  onToggleMute,
  onSearch,
  onPinned,
  onAnnouncement,
  onImage,
  onDelete,
}: MobileGroupInfoProps) {
  const { t } = useTranslation("chat");
  const { t: tg } = useTranslation("group");
  const { user } = useAuth();
  const courseId = conversation.courseId;
  const [tab, setTab] = useState<Tab>("members");
  const [addOpen, setAddOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [requestsOpen, setRequestsOpen] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<DomainUser | null>(null);
  const imageRef = useRef<HTMLInputElement>(null);
  const students = useCourseStudents(courseId, { page_size: 100 });
  const presence = useCourseStudentPresence(courseId);
  const unenroll = useUnenrollStudent();

  const presenceById = useMemo(
    () => new Map((presence.data ?? []).map((item) => [item.id, item])),
    [presence.data]
  );
  const members = (students.data?.items ?? []).map((item) => item.student);
  const memberCount = students.data?.total ?? conversation.memberCount ?? members.length;
  const meta = [
    subjectLabel,
    t("info.memberCount", { count: memberCount }),
    conversation.onlineCount ? t("info.onlineCount", { count: conversation.onlineCount }) : "",
  ]
    .filter(Boolean)
    .join(" · ");

  const actions = [
    { id: "mute", icon: "notifications-off", label: muted ? t("info.muteOn") : t("info.muteOff"), run: onToggleMute },
    { id: "search", icon: "search", label: t("info.search"), run: onSearch },
    ...(canManage ? [{ id: "invite", icon: "person", label: t("info.invite"), run: () => setAddOpen(true) }] : []),
    { id: "pinned", icon: "pin", label: t("info.pinned"), run: onPinned },
  ];

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto bg-canvas bg-auth-gradient px-4 pt-5 pb-8 font-body [&>*]:shrink-0">
      <header className="flex h-11 shrink-0 items-center gap-3">
        <button
          type="button"
          className="grid size-11 shrink-0 place-items-center rounded-full bg-subtle text-ink"
          onClick={onBack}
          aria-label={t("info.backAria")}
        >
          <Icon name="chevron-left" size={22} />
        </button>
        <DialogTitle className="min-w-0 flex-1 truncate text-center text-title-lg font-semibold text-ink">
          {t("info.panelTitle")}
        </DialogTitle>
        {canManage ? (
          <button
            type="button"
            className="grid size-11 shrink-0 place-items-center rounded-full bg-subtle text-ink"
            onClick={onEdit}
            aria-label={t("info.editCourse")}
          >
            <Icon name="edit" size={22} />
          </button>
        ) : (
          <span className="size-11 shrink-0" aria-hidden="true" />
        )}
      </header>

      <section className="mt-4 flex flex-col items-center">
        <span className="relative">
          <GroupTile
            name={conversation.title}
            tone={conversation.avatarTone}
            src={conversation.imageUrl}
            className="size-22 rounded-2xl bg-surface text-h2"
          />
          {canManage ? (
            <>
              <input
                ref={imageRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                hidden
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  event.target.value = "";
                  if (file) onImage(file);
                }}
              />
              <button
                type="button"
                className="absolute -right-2.5 -bottom-2.5 grid size-11 place-items-center rounded-full bg-brand text-on-action disabled:opacity-60"
                disabled={imagePending}
                onClick={() => imageRef.current?.click()}
                aria-label={t("info.changeGroupImageAria")}
              >
                <Icon name="photo-camera-fill" size={20} />
              </button>
            </>
          ) : null}
        </span>
        <h3 className="mt-3 text-center font-heading text-h2 text-ink">{conversation.title}</h3>
        <p className="mt-1 text-center text-body-sm text-ink-secondary">{meta}</p>
      </section>

      <div className="mt-4 grid grid-cols-4 gap-2">
        {actions.map((action) => (
          <button
            key={action.id}
            type="button"
            className="flex h-16.5 flex-col items-center justify-center gap-1.5 rounded-xl bg-surface text-caption text-ink"
            onClick={action.run}
          >
            <Icon name={action.icon} size={20} className="text-brand" />
            {action.label}
          </button>
        ))}
      </div>

      {canManage ? (
        <section className="mt-4 flex flex-col overflow-hidden rounded-xl bg-surface">
          <div className="flex items-center gap-3 border-b border-line px-4 py-[15px]">
            <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-accent-saffron-bg text-accent-saffron-fg">
              <Icon name="bolt" size={20} />
            </span>
            <span className="flex min-w-0 flex-1 flex-col">
              <strong className="truncate text-title text-ink">{t("info.announcementTitle")}</strong>
              <small className="truncate text-body-sm text-ink-secondary">{t("info.announcementHint")}</small>
            </span>
            <Switch size="lg" checked={announcement} onCheckedChange={onAnnouncement} aria-label={t("info.announcementTitle")} />
          </div>
          <button
            type="button"
            className="flex items-center gap-3 px-4 py-[15px] text-left"
            onClick={() => setRequestsOpen(true)}
          >
            <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-brand-subtle text-ink">
              <Icon name="person" size={20} />
            </span>
            <span className="flex min-w-0 flex-1 flex-col">
              <strong className="truncate text-title text-ink">
                {t("info.joinRequests", { count: requestsCount })}
              </strong>
              <small className="truncate text-body-sm text-ink-secondary">{t("info.joinRequestsHint")}</small>
            </span>
            <Icon name="chevron-right" size={20} className="shrink-0 text-ink-secondary" />
          </button>
        </section>
      ) : null}

      <div className="mt-4 grid grid-cols-3 gap-2">
        {(
          [
            ["members", t("info.tabMembers", { count: memberCount })],
            ["files", t("info.tabFiles")],
            ["media", t("info.tabMedia")],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            className={`flex h-11 items-center justify-center rounded-full text-body-sm font-medium transition-colors ${
              tab === id ? "bg-brand text-on-action" : "border border-line-strong bg-surface text-ink"
            }`}
            onClick={() => setTab(id)}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="mt-4">
        {tab === "members" ? (
          <ul className="flex flex-col overflow-hidden rounded-xl bg-surface">
            {user ? (
              <li className="flex items-center gap-3 border-b border-line px-4 py-3.5">
                <Avatar name={user.name} src={user.avatarUrl ?? undefined} size="sm" className="[&_.avatar]:size-11" />
                <span className="flex min-w-0 flex-1 flex-col">
                  <strong className="truncate text-title text-ink">{user.name}</strong>
                  <small className="truncate text-body-sm text-brand">{t("info.teacherBadge")}</small>
                </span>
              </li>
            ) : null}
            {members.map((member) => {
              const state = presenceById.get(member.id);
              const status = state?.isOnline
                ? t("info.online")
                : state?.lastSeen
                  ? formatRelativeShort(state.lastSeen)
                  : "";
              return (
                <li key={member.id} className="flex items-center gap-3 border-b border-line px-4 py-3.5 last:border-b-0">
                  <Avatar
                    name={member.name}
                    tone={member.avatarTone}
                    src={state?.avatar ?? undefined}
                    size="sm"
                    className="[&_.avatar]:size-11"
                  />
                  <span className="flex min-w-0 flex-1 flex-col">
                    <strong className="truncate text-title text-ink">{member.name}</strong>
                    <small className="truncate text-body-sm text-ink-secondary">
                      @{member.username}
                      {status ? ` · ${status}` : ""}
                    </small>
                  </span>
                  {canManage ? (
                    <Dropdown>
                      <DropdownTrigger asChild>
                        <button
                          type="button"
                          className="-mr-2 grid size-9 shrink-0 place-items-center rounded-full text-ink-secondary"
                          aria-label={tg("students.removeAria", { name: member.name })}
                        >
                          <Icon name="more" size={20} />
                        </button>
                      </DropdownTrigger>
                      <DropdownContent>
                        <DropdownItem destructive onSelect={() => setRemoveTarget(member)}>
                          {tg("students.remove")}
                        </DropdownItem>
                      </DropdownContent>
                    </Dropdown>
                  ) : null}
                </li>
              );
            })}
          </ul>
        ) : (
          <MobileEmptyCard
            icon={tab === "files" ? "folder" : "photo-camera-fill"}
            title={tab === "files" ? t("info.filesEmpty") : t("info.mediaEmpty")}
            description={tab === "files" ? t("info.filesEmptyHint") : t("info.mediaEmptyHint")}
          />
        )}
      </div>

      {canManage ? (
        <button
          type="button"
          className="mt-6 flex h-13 shrink-0 items-center justify-center gap-2 rounded-full bg-danger-bg text-button text-error-text"
          onClick={onDelete}
        >
          <Icon name="trash" size={18} /> {t("info.deleteCourse")}
        </button>
      ) : null}

      {canManage ? (
        <>
          <AddStudentDialog courseId={courseId} open={addOpen} onOpenChange={setAddOpen} />
          <InviteLinkDialog courseId={courseId} open={inviteOpen} onOpenChange={setInviteOpen} />
          <JoinRequestsDialog courseId={courseId} open={requestsOpen} onOpenChange={setRequestsOpen} />
          <ConfirmDialog
            open={Boolean(removeTarget)}
            onOpenChange={(open) => {
              if (!open) setRemoveTarget(null);
            }}
            icon="person"
            title={tg("students.removeConfirmTitle", { name: removeTarget?.name ?? "" })}
            description={tg("students.removeDialogDescription", { name: removeTarget?.name ?? "" })}
            confirmLabel={tg("students.remove")}
            cancelLabel={tg("students.cancel")}
            pending={unenroll.isPending}
            onConfirm={() => {
              if (!removeTarget || !courseId) return;
              unenroll.mutate(
                { courseId, studentId: removeTarget.id },
                {
                  onSuccess: () => setRemoveTarget(null),
                  onError: (error: Error) => toast.error(error.message),
                }
              );
            }}
          />
        </>
      ) : null}
    </div>
  );
}
