import { useMemo, useState } from "react";
import { Link2, Search, UserRoundX } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { useCourseStudents, useCourseStudentPresence } from "@/modules/course";
import { useIsCompact } from "@/shared/hooks/use-media-query";
import { formatRelativeShort } from "@/shared/lib";
import { AppDialog, dialogButton } from "@/shared/ui/app-dialog";
import { Icon } from "@/shared/ui/icon";
import { Avatar } from "@/shared/ui/legacy";
import { useBanFromLesson, useInviteToLesson } from "../model/live.queries";

export interface LessonInviteDialogProps {
  lessonId: string;
  courseId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LessonInviteDialog({
  lessonId,
  courseId,
  open,
  onOpenChange,
}: LessonInviteDialogProps) {
  const { t } = useTranslation("live");
  const [search, setSearch] = useState("");
  const [invited, setInvited] = useState<string[]>([]);
  const students = useCourseStudents(courseId, { page_size: 100 }, open);
  const presence = useCourseStudentPresence(courseId, open);
  const invite = useInviteToLesson(lessonId);
  const ban = useBanFromLesson(lessonId);
  const isCompact = useIsCompact();

  const online = useMemo(
    () => new Map((presence.data ?? []).map((row) => [row.id, row])),
    [presence.data]
  );

  const visible = useMemo(() => {
    const query = search.trim().toLowerCase();
    const items = (students.data?.items ?? []).map((item) => item.student);
    if (!query) return items;
    return items.filter((student) =>
      `${student.name} ${student.username}`.toLowerCase().includes(query)
    );
  }, [students.data, search]);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(globalThis.location.href);
      toast.success(t("invite.linkCopied"));
    } catch {
      toast.error(t("invite.linkCopyFailed"));
    }
  }

  function inviteAll() {
    invite.mutate(undefined, {
      onSuccess: () => {
        setInvited(visible.map((student) => student.id));
        toast.success(t("invite.sentToAll"));
      },
    });
  }

  if (isCompact)
    return (
      <AppDialog
        open={open}
        onOpenChange={onOpenChange}
        icon={
          <span className="grid size-11 place-items-center rounded-md bg-brand-subtle text-brand">
            <Icon name="person-add" size={22} />
          </span>
        }
        titleClassName="font-heading text-h2 font-medium"
        title={t("invite.title")}
        description={t("invite.description", { count: visible.length })}
        footerClassName="px-4 pt-4 pb-7"
        footer={
          <div className="grid w-full grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-2.5">
            <button
              type="button"
              className="flex h-11 items-center justify-center gap-1.5 rounded-full bg-brand-subtle text-button text-brand"
              onClick={copyLink}
            >
              <Icon name="link" size={18} /> {t("invite.copyLink")}
            </button>
            <button
              type="button"
              className="flex h-11 items-center justify-center gap-1.5 rounded-full bg-brand text-button text-on-action disabled:opacity-60"
              disabled={invite.isPending}
              onClick={inviteAll}
            >
              <Icon name="notifications-outline" size={18} /> {t("invite.sendToAll")}
            </button>
          </div>
        }
      >
        <label className="flex h-13 shrink-0 items-center gap-2.5 rounded-xl border-[1.5px] border-transparent bg-subtle px-4 focus-within:border-focus">
          <Icon name="search" size={20} className="shrink-0 text-ink-secondary" />
          <input
            className="h-full min-w-0 flex-1 bg-transparent text-body text-ink outline-none placeholder:text-ink-secondary"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t("invite.searchPlaceholder")}
          />
        </label>

        {students.isLoading ? (
          <div className="flex flex-col gap-2">
            {Array.from({ length: 3 }, (_, index) => (
              <div key={index} className="h-14 animate-pulse rounded-xl bg-muted" />
            ))}
          </div>
        ) : (
          <div className="flex flex-col">
            {visible.map((student) => {
              const called = invited.includes(student.id);
              const state = online.get(student.id);
              const status = state?.isOnline
                ? t("invite.online").toLowerCase()
                : state?.lastSeen
                  ? formatRelativeShort(state.lastSeen)
                  : t("invite.offline");
              return (
                <article key={student.id} className="flex items-center gap-3 py-[13px]">
                  <Avatar name={student.name} tone={student.avatarTone} size="sm" className="[&_.avatar]:size-9" />
                  <span className="flex min-w-0 flex-1 flex-col">
                    <strong className="truncate text-title-sm font-semibold text-ink">{student.name}</strong>
                    <small className="truncate text-caption text-ink-secondary">
                      @{student.username} · {status}
                    </small>
                  </span>
                  {called ? (
                    <span className="flex h-10 shrink-0 items-center gap-1.5 px-4 text-button text-brand">
                      <Icon name="check" size={16} /> {t("invite.called")}
                    </span>
                  ) : (
                    <button
                      type="button"
                      className="flex h-10 shrink-0 items-center gap-1.5 rounded-full bg-brand-subtle px-4 text-button text-brand disabled:opacity-60"
                      disabled={invite.isPending}
                      onClick={() =>
                        invite.mutate(student.id, {
                          onSuccess: () => setInvited((current) => [...current, student.id]),
                        })
                      }
                    >
                      <Icon name="notifications-outline" size={16} /> {t("invite.invite")}
                    </button>
                  )}
                </article>
              );
            })}
            {!visible.length ? (
              <p className="py-4 text-center text-body-sm text-ink-secondary">{t("invite.empty")}</p>
            ) : null}
          </div>
        )}
      </AppDialog>
    );

  return (
    <AppDialog
      open={open}
      onOpenChange={onOpenChange}
      width="lg:w-[480px]"
      title={t("invite.title")}
      description={t("invite.description", { count: visible.length })}
      footer={
        <>
          <button type="button" className={dialogButton.secondary} onClick={copyLink}>
            <Link2 size={16} /> {t("invite.copyLink")}
          </button>
          <button
            type="button"
            className={dialogButton.primary}
            disabled={invite.isPending}
            onClick={inviteAll}
          >
            {t("invite.sendToAll")}
          </button>
        </>
      }
    >
      <label className="flex h-12 items-center gap-2.5 rounded-xl border border-line bg-surface px-3.5 focus-within:border-focus">
        <Search size={18} className="shrink-0 text-ink-tertiary" />
        <input
          className="h-full min-w-0 flex-1 bg-transparent text-body text-ink outline-none placeholder:text-ink-tertiary"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder={t("invite.searchPlaceholder")}
        />
      </label>

      {students.isLoading ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 3 }, (_, index) => (
            <div key={index} className="h-14 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      ) : (
        <div className="-mr-1 flex max-h-80 flex-col gap-1 overflow-y-auto pr-1">
          {visible.map((student) => {
            const called = invited.includes(student.id);
            return (
              <article key={student.id} className="group flex items-center gap-2.5 rounded-xl p-2">
                <span className="relative shrink-0">
                  <Avatar name={student.name} tone={student.avatarTone} size="sm" />
                  {online.get(student.id)?.isOnline ? (
                    <span className="absolute right-0 bottom-0 size-3 rounded-full border-2 border-surface bg-success" />
                  ) : null}
                </span>
                <span className="flex min-w-0 flex-1 flex-col">
                  <strong className="truncate text-label-strong text-ink">{student.name}</strong>
                  <small className="truncate text-caption text-ink-tertiary">
                    {called
                      ? t("invite.calledJustNow")
                      : online.get(student.id)?.isOnline
                        ? t("invite.online")
                        : `@${student.username}`}
                  </small>
                </span>

                <button
                  type="button"
                  className={`flex h-9 shrink-0 items-center rounded-full px-4 text-label-strong transition-colors disabled:opacity-60 ${
                    called
                      ? "border border-line bg-surface text-ink-tertiary"
                      : "bg-action text-on-action hover:bg-action-hover"
                  }`}
                  disabled={invite.isPending || called}
                  onClick={() =>
                    invite.mutate(student.id, {
                      onSuccess: () => setInvited((current) => [...current, student.id]),
                    })
                  }
                >
                  {called ? t("invite.called") : t("invite.invite")}
                </button>

                <button
                  type="button"
                  className="grid size-8 shrink-0 place-items-center rounded-full text-error-text opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100 disabled:opacity-40"
                  aria-label={t("invite.banAria", { name: student.name })}
                  title={t("invite.banTitle")}
                  disabled={ban.isPending}
                  onClick={() => ban.mutate(student.id)}
                >
                  <UserRoundX size={16} />
                </button>
              </article>
            );
          })}
          {!visible.length ? (
            <p className="py-4 text-center text-body-sm text-ink-tertiary">{t("invite.empty")}</p>
          ) : null}
        </div>
      )}

    </AppDialog>
  );
}
