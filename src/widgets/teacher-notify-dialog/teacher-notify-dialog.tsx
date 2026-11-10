import { useMemo, useState, type FormEvent } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { useCourseStudents, useCourses } from "@/modules/course";
import { notificationApi, notificationKeys } from "@/modules/notification";
import { AppDialog } from "@/shared/ui/app-dialog";
import { Avatar } from "@/shared/ui/legacy";

export interface TeacherNotifyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courseId?: string | null;
}

type Audience = "all" | "selected";

const FORM_ID = "teacher-notify";
const MAX_LENGTH = 1000;
const FIELD =
  "w-full rounded-md border border-transparent bg-subtle px-4 text-body text-ink outline-none placeholder:text-ink-tertiary focus:border-focus focus:bg-surface";

function escapeHtml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function toHtml(text: string): string {
  return text
    .trim()
    .split(/\n{2,}/)
    .map((block) => `<p>${escapeHtml(block).replace(/\n/g, "<br />")}</p>`)
    .join("");
}

export function TeacherNotifyDialog({ open, onOpenChange, courseId = null }: TeacherNotifyDialogProps) {
  const { t } = useTranslation("notification");
  const client = useQueryClient();
  const courses = useCourses();
  const [pickedCourse, setPickedCourse] = useState<string | null>(null);
  const [audience, setAudience] = useState<Audience>("all");
  const [picked, setPicked] = useState<Set<string>>(() => new Set());
  const [parents, setParents] = useState(false);
  const [text, setText] = useState("");

  const activeCourse = courseId ?? pickedCourse;
  const enrollments = useCourseStudents(open ? activeCourse : null, { page_size: 100 });
  const students = useMemo(
    () => (enrollments.data?.items ?? []).filter((item) => item.status === "approved").map((item) => item.student),
    [enrollments.data]
  );
  const recipients = audience === "all" ? students.map((student) => student.id) : [...picked];

  const send = useMutation({
    mutationFn: async () => {
      const description = toHtml(text);
      if (audience === "all" && activeCourse) {
        await notificationApi.send({ description, targetType: "course", courseId: activeCourse, includeParents: parents });
        return;
      }
      await notificationApi.send({ description, targetType: "users", userIds: recipients });
      if (parents) await notificationApi.send({ description, targetType: "parents_of", userIds: recipients });
    },
    onSuccess: () => {
      client.invalidateQueries({ queryKey: notificationKeys.all });
      toast.success(t("teacherSend.sent", { count: recipients.length }));
      close();
    },
    onError: (error) => toast.error(error.message),
  });

  function reset() {
    setPickedCourse(null);
    setAudience("all");
    setPicked(new Set());
    setParents(false);
    setText("");
  }

  function close() {
    reset();
    onOpenChange(false);
  }

  function toggle(id: string) {
    setPicked((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (canSend) send.mutate();
  }

  const canSend = Boolean(activeCourse && text.trim() && recipients.length && !send.isPending);

  return (
    <AppDialog
      open={open}
      onOpenChange={(value) => (value ? onOpenChange(true) : close())}
      variant="adaptive"
      width="lg:max-w-130"
      title={t("teacherSend.title")}
      description={t("teacherSend.description")}
      footerClassName="justify-end px-4 pt-4 pb-[max(16px,env(safe-area-inset-bottom))] lg:px-6 lg:pb-6"
      footer={
        <>
          <button
            type="button"
            className="flex h-11 flex-1 items-center justify-center rounded-full border border-line-strong bg-surface px-5 text-button text-ink transition-colors hover:bg-subtle lg:flex-none"
            onClick={close}
          >
            {t("teacherSend.cancel")}
          </button>
          <button
            type="submit"
            form={FORM_ID}
            disabled={!canSend}
            className="flex h-11 flex-1 items-center justify-center rounded-full bg-brand px-5 text-button text-on-action transition-colors hover:bg-brand-strong disabled:opacity-60 lg:flex-none"
          >
            {t("teacherSend.submit")}
          </button>
        </>
      }
    >
      <form id={FORM_ID} className="flex flex-col gap-4 pb-1" onSubmit={submit}>
        {courseId ? null : (
          <label className="flex flex-col gap-2">
            <span className="text-body-xs text-ink-secondary">{t("teacherSend.group")}</span>
            <select
              className={`${FIELD} h-12.5`}
              value={pickedCourse ?? ""}
              onChange={(event) => {
                setPickedCourse(event.target.value || null);
                setPicked(new Set());
              }}
            >
              <option value="">{t("teacherSend.groupPlaceholder")}</option>
              {(courses.data ?? []).map((course) => (
                <option key={course.id} value={course.id}>
                  {course.title}
                </option>
              ))}
            </select>
          </label>
        )}

        {activeCourse ? (
          <div className="flex flex-col gap-2">
            <span className="text-body-xs text-ink-secondary">{t("teacherSend.audience")}</span>
            <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label={t("teacherSend.audience")}>
              {(["all", "selected"] as const).map((item) => (
                <button
                  key={item}
                  type="button"
                  role="radio"
                  aria-checked={audience === item}
                  className={`flex h-11 items-center justify-center rounded-full px-3 text-body-sm font-medium transition-colors ${
                    audience === item ? "bg-brand text-on-action" : "bg-subtle text-ink hover:bg-muted"
                  }`}
                  onClick={() => setAudience(item)}
                >
                  {item === "all"
                    ? t("teacherSend.audienceAll", { count: students.length })
                    : t("teacherSend.audienceSelected")}
                </button>
              ))}
            </div>

            {enrollments.isSuccess && !students.length ? (
              <p className="rounded-md bg-subtle px-4 py-3 text-body-sm text-ink-secondary">
                {t("teacherSend.noStudents")}
              </p>
            ) : null}

            {audience === "selected" && students.length ? (
              <div className="flex max-h-56 flex-col overflow-y-auto rounded-md border border-line">
                {students.map((student) => (
                  <label
                    key={student.id}
                    className="flex cursor-pointer items-center gap-3 border-b border-line px-3 py-2.5 last:border-b-0 hover:bg-subtle"
                  >
                    <input
                      type="checkbox"
                      className="size-4.5 shrink-0 accent-brand"
                      checked={picked.has(student.id)}
                      onChange={() => toggle(student.id)}
                    />
                    <Avatar name={student.name} size="sm" className="[&_.avatar]:size-8" />
                    <span className="min-w-0 flex-1 truncate text-body-sm text-ink">{student.name}</span>
                  </label>
                ))}
              </div>
            ) : null}
            {audience === "selected" && students.length ? (
              <small className="text-caption text-ink-secondary">
                {t("teacherSend.selectedCount", { count: picked.size })}
              </small>
            ) : null}
          </div>
        ) : null}

        <label className="flex items-start gap-3 rounded-md bg-subtle px-4 py-3">
          <input
            type="checkbox"
            className="mt-0.5 size-4.5 shrink-0 accent-brand"
            checked={parents}
            onChange={(event) => setParents(event.target.checked)}
          />
          <span className="flex min-w-0 flex-col">
            <span className="text-body-sm font-medium text-ink">{t("teacherSend.parents")}</span>
            <small className="text-caption text-ink-secondary">{t("teacherSend.parentsHint")}</small>
          </span>
        </label>

        <label className="flex flex-col gap-2">
          <span className="text-body-xs text-ink-secondary">{t("teacherSend.text")}</span>
          <textarea
            rows={4}
            maxLength={MAX_LENGTH}
            className={`${FIELD} resize-none py-3`}
            value={text}
            placeholder={t("teacherSend.textPlaceholder")}
            onChange={(event) => setText(event.target.value)}
          />
        </label>
      </form>
    </AppDialog>
  );
}
