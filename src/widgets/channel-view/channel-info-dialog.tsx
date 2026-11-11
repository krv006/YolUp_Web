import { useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import {
  ChannelAvatar,
  useAddChannelMembers,
  useDeleteChannel,
  useRemoveChannelMember,
  useRemoveRoomImage,
  useSetRoomImage,
  useUpdateChannel,
  type AudienceInput,
} from "@/modules/conversation";
import { messageApi, messageKeys } from "@/modules/message";
import type { Conversation } from "@/shared/types";
import { AppDialog, dialogButton } from "@/shared/ui/app-dialog";
import { ConfirmDialog } from "@/shared/ui/confirm-dialog";
import { Icon } from "@/shared/ui/icon";
import { Avatar } from "@/shared/ui/legacy";
import { RoleTag } from "@/shared/ui/role-tag";
import { AudiencePicker } from "@/widgets/audience-picker";

const FIELD =
  "w-full rounded-md border border-transparent bg-subtle px-4 text-body text-ink outline-none placeholder:text-ink-tertiary focus:border-focus focus:bg-surface";

export interface ChannelInfoDialogProps {
  conversation: Conversation;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  manage: boolean;
  currentUserId: string | null;
  afterDelete: string;
}

export function ChannelInfoDialog({ conversation, open, onOpenChange, manage, currentUserId, afterDelete }: ChannelInfoDialogProps) {
  const { t } = useTranslation("chat");
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(conversation.title);
  const [description, setDescription] = useState(conversation.description ?? "");
  const [addOpen, setAddOpen] = useState(false);
  const [audience, setAudience] = useState<AudienceInput>({ courseIds: [], studentIds: [] });
  const [deleteOpen, setDeleteOpen] = useState(false);
  const members = useQuery({
    queryKey: messageKeys.members(conversation.id, ""),
    queryFn: ({ signal }) => messageApi.getMembers(conversation.id, "", { signal }),
    enabled: open,
  });
  const update = useUpdateChannel();
  const remove = useDeleteChannel();
  const addMembers = useAddChannelMembers();
  const removeMember = useRemoveChannelMember();
  const setImage = useSetRoomImage();
  const removeImage = useRemoveRoomImage();
  const imageRef = useRef<HTMLInputElement>(null);
  const imageBusy = setImage.isPending || removeImage.isPending;
  const linkedCourses = conversation.linkedCourses ?? [];

  function uploadImage(file: File) {
    setImage.mutate(
      { roomId: conversation.id, image: file },
      {
        onSuccess: () => toast.success(t("channel.imageUpdated")),
        onError: (error: Error) => toast.error(error.message),
      }
    );
  }

  function dropImage() {
    removeImage.mutate(conversation.id, {
      onSuccess: () => toast.success(t("channel.imageRemoved")),
      onError: (error: Error) => toast.error(error.message),
    });
  }

  function save() {
    update.mutate(
      { id: conversation.id, title: title.trim(), description: description.trim() },
      {
        onSuccess: () => {
          setEditing(false);
          toast.success(t("channel.saved"));
        },
        onError: (error: Error) => toast.error(error.message),
      }
    );
  }

  function add() {
    addMembers.mutate(
      { id: conversation.id, audience },
      {
        onSuccess: (count) => {
          toast.success(t("channel.membersAdded", { count }));
          setAudience({ courseIds: [], studentIds: [] });
          setAddOpen(false);
          void members.refetch();
        },
        onError: (error: Error) => toast.error(error.message),
      }
    );
  }

  const list = members.data ?? [];

  return (
    <>
      <AppDialog
        open={open}
        onOpenChange={onOpenChange}
        variant="adaptive"
        width="lg:max-w-120"
        title={t("channel.infoTitle")}
      >
        <div className="flex flex-col gap-4">
          <section className="flex flex-col items-center gap-2 text-center">
            <span className="relative">
              <ChannelAvatar src={conversation.imageUrl} className="size-18 rounded-2xl" iconSize={32} />
              {manage ? (
                <>
                  <input
                    ref={imageRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    hidden
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      event.target.value = "";
                      if (file) uploadImage(file);
                    }}
                  />
                  <button
                    type="button"
                    className="absolute -right-2 -bottom-2 grid size-8 place-items-center rounded-full border border-line bg-surface text-ink shadow-sm transition-colors hover:bg-subtle disabled:opacity-60"
                    aria-label={conversation.imageUrl ? t("channel.changeImage") : t("channel.addImage")}
                    disabled={imageBusy}
                    onClick={() => imageRef.current?.click()}
                  >
                    {imageBusy ? <Loader2 size={14} className="animate-spin" /> : <Icon name="camera" size={16} />}
                  </button>
                </>
              ) : null}
            </span>
            {manage && conversation.imageUrl ? (
              <button
                type="button"
                className="mt-1 text-caption-strong text-error-text transition-opacity hover:opacity-80 disabled:opacity-50"
                disabled={imageBusy}
                onClick={dropImage}
              >
                {t("channel.removeImage")}
              </button>
            ) : null}
            {editing ? (
              <div className="flex w-full flex-col gap-2">
                <input
                  className={`${FIELD} h-12`}
                  value={title}
                  maxLength={120}
                  aria-label={t("channel.titleLabel")}
                  onChange={(event) => setTitle(event.target.value)}
                />
                <textarea
                  rows={3}
                  className={`${FIELD} resize-none py-3`}
                  value={description}
                  maxLength={1000}
                  aria-label={t("channel.descriptionLabel")}
                  placeholder={t("channel.descriptionPlaceholder")}
                  onChange={(event) => setDescription(event.target.value)}
                />
                <div className="flex gap-2">
                  <button type="button" className={dialogButton.secondary} onClick={() => setEditing(false)}>
                    {t("channel.cancel")}
                  </button>
                  <button
                    type="button"
                    className={dialogButton.primary}
                    disabled={!title.trim() || update.isPending}
                    onClick={save}
                  >
                    {t("channel.save")}
                  </button>
                </div>
              </div>
            ) : (
              <>
                <h3 className="font-heading text-h3 text-ink">{conversation.title}</h3>
                <p className="text-body-sm text-ink-secondary">
                  {conversation.description || t("channel.noDescription")}
                </p>
                <small className="text-caption text-ink-tertiary">
                  {t("channel.members", { count: list.length || conversation.memberCount })}
                </small>
                {manage ? (
                  <button
                    type="button"
                    className="mt-1 flex h-9 items-center gap-1.5 rounded-full bg-subtle px-4 text-caption-strong text-ink transition-colors hover:bg-muted"
                    onClick={() => {
                      setTitle(conversation.title);
                      setDescription(conversation.description ?? "");
                      setEditing(true);
                    }}
                  >
                    <Icon name="edit" size={16} />
                    {t("channel.edit")}
                  </button>
                ) : null}
              </>
            )}
          </section>

          {linkedCourses.length ? (
            <section className="flex flex-col gap-2">
              <strong className="text-title-sm text-ink">{t("channel.linkedGroups")}</strong>
              <ul className="flex flex-wrap gap-2">
                {linkedCourses.map((course) => (
                  <li
                    key={course.id}
                    className="flex h-8 max-w-full items-center gap-1.5 rounded-full bg-subtle px-3 text-caption-strong text-ink"
                  >
                    <Icon name="groups" size={16} className="shrink-0 text-ink-secondary" />
                    <span className="truncate">{course.title || t("channel.groupFallback")}</span>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <section className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <strong className="flex-1 text-title-sm text-ink">{t("channel.membersTitle")}</strong>
              {manage ? (
                <button
                  type="button"
                  className="flex h-9 items-center gap-1.5 rounded-full bg-brand-subtle px-3 text-caption-strong text-brand"
                  onClick={() => setAddOpen(true)}
                >
                  <Icon name="person-add" size={16} />
                  {t("channel.addMembers")}
                </button>
              ) : null}
            </div>
            <ul className="flex max-h-80 flex-col overflow-y-auto rounded-xl border border-line">
              {list.map((member) => (
                <li key={member.id} className="flex items-center gap-3 border-b border-line px-4 py-2.5 last:border-b-0">
                  <Avatar name={member.name} src={member.avatarUrl ?? undefined} size="sm" className="[&_.avatar]:size-9" />
                  <span className="flex min-w-0 flex-1 flex-col">
                    <strong className="truncate text-title-sm text-ink">{member.name}</strong>
                    <small className="truncate text-body-xs text-ink-secondary">@{member.username}</small>
                  </span>
                  <RoleTag role={member.role.toLowerCase()} />
                  {manage && member.id !== currentUserId && member.role.toLowerCase() !== "teacher" ? (
                    <button
                      type="button"
                      className="grid size-8 shrink-0 place-items-center rounded-full text-ink-tertiary transition-colors hover:bg-error-bg hover:text-error-text disabled:opacity-50"
                      aria-label={t("channel.removeMember", { name: member.name })}
                      disabled={removeMember.isPending}
                      onClick={() =>
                        removeMember.mutate(
                          { id: conversation.id, userId: member.id },
                          {
                            onSuccess: () => void members.refetch(),
                            onError: (error: Error) => toast.error(error.message),
                          }
                        )
                      }
                    >
                      <Icon name="close" size={16} />
                    </button>
                  ) : null}
                </li>
              ))}
              {!list.length ? (
                <li className="px-4 py-4 text-body-sm text-ink-secondary">
                  {members.isLoading ? t("channel.loading") : t("channel.noMembers")}
                </li>
              ) : null}
            </ul>
          </section>

          {manage ? (
            <button
              type="button"
              className="flex h-12 items-center justify-center gap-2 rounded-xl bg-error-bg text-label-strong text-error-text"
              onClick={() => setDeleteOpen(true)}
            >
              <Icon name="trash" size={18} /> {t("channel.delete")}
            </button>
          ) : null}
        </div>
      </AppDialog>

      <AppDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        variant="adaptive"
        width="lg:max-w-120"
        title={t("channel.addMembers")}
        description={t("channel.addMembersHint")}
        footer={
          <>
            <button type="button" className={dialogButton.secondary} onClick={() => setAddOpen(false)}>
              {t("channel.cancel")}
            </button>
            <button
              type="button"
              className={dialogButton.primary}
              disabled={(!audience.courseIds.length && !audience.studentIds.length) || addMembers.isPending}
              onClick={add}
            >
              {t("channel.add")}
            </button>
          </>
        }
      >
        <AudiencePicker value={audience} onChange={setAudience} />
      </AppDialog>

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        icon="trash"
        title={t("channel.deleteTitle")}
        description={t("channel.deleteHint", { title: conversation.title })}
        confirmLabel={t("channel.delete")}
        cancelLabel={t("channel.cancel")}
        pending={remove.isPending}
        onConfirm={() =>
          remove.mutate(conversation.id, {
            onSuccess: () => {
              setDeleteOpen(false);
              onOpenChange(false);
              navigate(afterDelete, { replace: true });
            },
            onError: (error: Error) => toast.error(error.message),
          })
        }
      />
    </>
  );
}
