import { useState } from "react";
import { motion } from "framer-motion";
import { GraduationCap, Sparkles } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { conversationApi, conversationKeys } from "@/modules/conversation";
import { useCourseRequests, useRespondCourseRequest, useSubjects } from "@/modules/course";
import type { Conversation } from "@/shared/types";
import { Button, Dialog, DialogContent } from "@/shared/ui/legacy";
import { SelectPicker } from "@/shared/ui/legacy/form-pickers";

interface GroupDraft {
  name: string;
  subject: string;
  description: string;
}

export interface NewConversationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NewConversationDialog({ open, onOpenChange }: NewConversationDialogProps) {
  const { t } = useTranslation("chat");
  const [group, setGroup] = useState<GroupDraft>({ name: "", subject: "", description: "" });
  const navigate = useNavigate();
  const client = useQueryClient();
  const requests = useCourseRequests({ page_size: 20 }, open);
  const subjects = useSubjects(open);
  const respond = useRespondCourseRequest();
  const create = useMutation({
    mutationFn: conversationApi.createGroup.bind(conversationApi),
    onSuccess: (room: Conversation) => {
      client.invalidateQueries({ queryKey: conversationKeys.all });
      onOpenChange(false);
      setGroup({ name: "", subject: "", description: "" });
      navigate(`/teacher/chats/${room.id}`);
      toast.success(t("newDialog.createdToast"));
    },
  });

  function update(field: keyof GroupDraft, value: string) {
    setGroup((current) => ({ ...current, [field]: value }));
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {open ? (
        <DialogContent title={t("newDialog.title")} description={t("newDialog.description")}>
          <motion.div initial={{ opacity: 0, y: 7 }} animate={{ opacity: 1, y: 0 }}>
            {requests.data?.items?.length ? (
              <section className="enrollment-request-box">
                <span className="dialog-section-label">{t("newDialog.pendingEnrollments")}</span>
                {requests.data.items.map((request) => (
                  <article key={request.id}>
                    <div>
                      <strong>{request.student.name}</strong>
                      <small>
                        {request.courseTitle} · @{request.student.username}
                      </small>
                    </div>
                    <div className="inline-actions">
                      <Button
                        size="sm"
                        variant="secondary"
                        loading={respond.isPending}
                        onClick={() => respond.mutate({ enrollmentId: request.id, action: "decline" })}
                      >
                        {t("newDialog.decline")}
                      </Button>
                      <Button
                        size="sm"
                        loading={respond.isPending}
                        onClick={() => respond.mutate({ enrollmentId: request.id, action: "approve" })}
                      >
                        {t("newDialog.approve")}
                      </Button>
                    </div>
                  </article>
                ))}
              </section>
            ) : null}
            <form
              className="create-group-form"
              onSubmit={(event) => {
                event.preventDefault();
                if (group.name.trim() && group.subject.trim()) create.mutate(group);
              }}
            >
              <div className="group-create-note">
                <span>
                  <Sparkles size={17} />
                </span>
                <p>
                  <strong>{t("newDialog.noteTitle")}</strong>
                  <small>{t("newDialog.noteDescription")}</small>
                </p>
              </div>
              <label>
                {t("newDialog.courseNameLabel")}
                <input
                  autoFocus
                  value={group.name}
                  onChange={(event) => update("name", event.target.value)}
                  placeholder={t("newDialog.courseNamePlaceholder")}
                />
              </label>
              <SelectPicker
                label={t("newDialog.subjectLabel")}
                icon={GraduationCap}
                searchable
                value={group.subject}
                onChange={(value) => update("subject", value)}
                options={(subjects.data ?? []).map((item) => ({ value: item.value, label: item.label }))}
              />
              <label>
                {t("newDialog.descriptionLabel")}
                <textarea
                  rows={3}
                  value={group.description}
                  onChange={(event) => update("description", event.target.value)}
                  placeholder={t("newDialog.descriptionPlaceholder")}
                />
              </label>
              {create.isError || requests.isError ? (
                <div className="form-alert">{create.error?.message || requests.error?.message}</div>
              ) : null}
              <div className="dialog-actions">
                <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
                  {t("newDialog.cancel")}
                </Button>
                <Button
                  type="submit"
                  loading={create.isPending}
                  disabled={!group.name.trim() || !group.subject.trim()}
                >
                  {t("newDialog.create")}
                </Button>
              </div>
            </form>
          </motion.div>
        </DialogContent>
      ) : null}
    </Dialog>
  );
}
