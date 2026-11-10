import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { useAddClubMembers, useClubMembers, useRemoveClubMember, type ClubAudience } from "@/modules/course";
import { AppDialog, dialogButton } from "@/shared/ui/app-dialog";
import { Icon } from "@/shared/ui/icon";
import { Avatar } from "@/shared/ui/legacy";
import { RowSkeleton } from "@/shared/ui/row-skeleton";
import { AudiencePicker } from "@/widgets/audience-picker";
import { PanelHeading } from "./panel-heading";

const EMPTY: ClubAudience = { courseIds: [], studentIds: [] };

export function ClubMembersPanel({ clubId }: { clubId: string | null }) {
  const { t } = useTranslation("group");
  const members = useClubMembers(clubId);
  const add = useAddClubMembers();
  const remove = useRemoveClubMember();
  const [addOpen, setAddOpen] = useState(false);
  const [audience, setAudience] = useState<ClubAudience>(EMPTY);
  const list = members.data ?? [];

  function submit() {
    if (!clubId) return;
    add.mutate(
      { id: clubId, audience },
      {
        onSuccess: (count) => {
          toast.success(t("club.added", { count }));
          setAudience(EMPTY);
          setAddOpen(false);
        },
        onError: (error: Error) => toast.error(error.message),
      }
    );
  }

  return (
    <div className="flex h-full flex-col gap-4 overflow-y-auto px-4 pt-5 pb-8 lg:px-7 lg:pt-3.5">
      <div className="flex items-end gap-3">
        <PanelHeading eyebrow={t("club.eyebrow")} title={t("club.membersTitle", { count: list.length })} />
        <button
          type="button"
          className="flex h-10 shrink-0 items-center gap-1.5 rounded-full bg-brand px-4 text-button text-on-action"
          onClick={() => setAddOpen(true)}
        >
          <Icon name="person-add" size={18} />
          {t("club.add")}
        </button>
      </div>

      <ul className="flex flex-col overflow-hidden rounded-xl bg-surface">
        {members.isLoading
          ? Array.from({ length: 3 }, (_, index) => (
              <li key={index} className="flex h-16 items-center border-b border-line px-4 last:border-b-0">
                <RowSkeleton />
              </li>
            ))
          : list.map((member) => (
              <li key={member.id} className="flex items-center gap-3 border-b border-line px-4 py-3 last:border-b-0">
                <Avatar name={member.name} src={member.avatarUrl ?? undefined} size="sm" className="[&_.avatar]:size-10" />
                <span className="flex min-w-0 flex-1 flex-col">
                  <strong className="truncate text-title-sm text-ink">{member.name}</strong>
                  <small className="truncate text-body-xs text-ink-secondary">@{member.username}</small>
                </span>
                <button
                  type="button"
                  className="grid size-9 shrink-0 place-items-center rounded-full text-ink-tertiary transition-colors hover:bg-error-bg hover:text-error-text disabled:opacity-50"
                  aria-label={t("students.removeAria", { name: member.name })}
                  disabled={remove.isPending}
                  onClick={() =>
                    clubId &&
                    remove.mutate(
                      { id: clubId, studentId: member.id },
                      { onError: (error: Error) => toast.error(error.message) }
                    )
                  }
                >
                  <Icon name="close" size={18} />
                </button>
              </li>
            ))}
        {!members.isLoading && !list.length ? (
          <li className="px-4 py-6 text-center text-body-sm text-ink-secondary">{t("club.empty")}</li>
        ) : null}
      </ul>

      <AppDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        variant="adaptive"
        width="lg:max-w-120"
        title={t("club.add")}
        description={t("club.addHint")}
        footer={
          <>
            <button type="button" className={dialogButton.secondary} onClick={() => setAddOpen(false)}>
              {t("students.cancel")}
            </button>
            <button
              type="button"
              className={dialogButton.primary}
              disabled={(!audience.courseIds.length && !audience.studentIds.length) || add.isPending}
              onClick={submit}
            >
              {t("club.add")}
            </button>
          </>
        }
      >
        <AudiencePicker value={audience} onChange={setAudience} />
      </AppDialog>
    </div>
  );
}
