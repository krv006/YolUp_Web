import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { conversationApi, conversationKeys } from "@/modules/conversation";
import { useSubjects } from "@/modules/course";
import type { Conversation } from "@/shared/types";
import { AppDialog, dialogButton } from "@/shared/ui/app-dialog";
import { SelectPicker } from "@/shared/ui/legacy/form-pickers";

interface GroupDraft {
  name: string;
  subject: string;
  lessonsPerWeek: string;
  fee: string;
}

const EMPTY: GroupDraft = { name: "", subject: "", lessonsPerWeek: "3", fee: "" };

export interface NewConversationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NewConversationDialog({ open, onOpenChange }: NewConversationDialogProps) {
  const { t } = useTranslation("chat");
  const [group, setGroup] = useState<GroupDraft>(EMPTY);
  const navigate = useNavigate();
  const client = useQueryClient();
  const subjects = useSubjects(open);
  const create = useMutation({
    mutationFn: conversationApi.createGroup.bind(conversationApi),
    onSuccess: (room: Conversation) => {
      client.invalidateQueries({ queryKey: conversationKeys.all });
      onOpenChange(false);
      setGroup(EMPTY);
      navigate(`/teacher/chats/${room.id}`);
      toast.success(t("newDialog.createdToast"));
    },
  });

  function update(field: keyof GroupDraft, value: string) {
    setGroup((current) => ({ ...current, [field]: value }));
  }

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!group.name.trim() || !group.subject.trim()) return;
    const fee = Number(group.fee.replace(/\s/g, ""));
    create.mutate({
      name: group.name,
      subject: group.subject,
      description: "",
      lessonsPerWeek: group.lessonsPerWeek ? Number(group.lessonsPerWeek) : null,
      monthlyFee: Number.isFinite(fee) && fee > 0 ? fee : null,
    });
  }

  return (
    <AppDialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (!next) setGroup(EMPTY);
      }}
      title={t("newDialog.title")}
      footer={
        <>
          <button
            type="button"
            className={dialogButton.secondary}
            onClick={() => onOpenChange(false)}
          >
            {t("newDialog.cancel")}
          </button>
          <button
            type="submit"
            form="new-group-form"
            className={dialogButton.primary}
            disabled={!group.name.trim() || !group.subject.trim() || create.isPending}
          >
            {t("newDialog.create")}
          </button>
        </>
      }
    >
      <form id="new-group-form" className="flex flex-col gap-4" onSubmit={submit}>
        <label className="field-group">
          <span>{t("newDialog.courseNameLabel")}</span>
          <input
            autoFocus
            value={group.name}
            onChange={(event) => update("name", event.target.value)}
            placeholder={t("newDialog.courseNamePlaceholder")}
          />
        </label>

        <div className="grid gap-3 sm:grid-cols-2">
          <SelectPicker
            label={t("newDialog.subjectLabel")}
            searchable
            value={group.subject}
            onChange={(value) => update("subject", value)}
            options={(subjects.data ?? []).map((item) => ({
              value: item.value,
              label: item.label,
            }))}
          />
          <SelectPicker
            label={t("newDialog.lessonsPerWeekLabel")}
            value={group.lessonsPerWeek}
            onChange={(value) => update("lessonsPerWeek", value)}
            options={[1, 2, 3, 4, 5, 6, 7].map((count) => ({
              value: String(count),
              label: t("newDialog.lessonsPerWeekValue", { count }),
            }))}
          />
        </div>

        <label className="field-group">
          <span>{t("newDialog.feeLabel")}</span>
          <input
            value={group.fee}
            onChange={(event) => update("fee", event.target.value)}
            placeholder={t("newDialog.feePlaceholder")}
            inputMode="numeric"
          />
        </label>

        {create.isError ? (
          <p className="rounded-xl bg-error-bg px-4 py-3 text-body-sm text-error-text">
            {create.error.message}
          </p>
        ) : null}
      </form>
    </AppDialog>
  );
}
