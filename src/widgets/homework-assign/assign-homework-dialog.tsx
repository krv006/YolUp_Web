import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import type { AudienceInput } from "@/modules/conversation";
import { useCourseStudents } from "@/modules/course";
import { useAssignFromBank, useHomeworkBank } from "@/modules/homework";
import { StudentChecklist } from "@/modules/quiz";
import { AppError } from "@/shared/api";
import { useIsCompact } from "@/shared/hooks/use-media-query";
import type { Assignment } from "@/shared/types";
import { AppDialog, dialogButton } from "@/shared/ui/app-dialog";
import { DatePicker, SelectPicker, TimePicker } from "@/shared/ui/legacy/form-pickers";
import { MobileFieldLabel, MobilePickerField } from "@/shared/ui/mobile-fields";
import { Switch } from "@/shared/ui/switch";
import { AudiencePicker } from "@/widgets/audience-picker";

export interface AssignHomeworkDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assignment?: Assignment | null;
  courseId?: string | null;
  onAssigned?: (created: Assignment[]) => void;
}

function dateLabel(value: string, months: string[]): string {
  const day = new Date(`${value}T00:00`);
  return Number.isNaN(day.getTime()) ? value : `${day.getDate()}-${(months[day.getMonth()] ?? "").slice(0, 3).toLowerCase()}`;
}

function inDays(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function AssignHomeworkDialog({ open, onOpenChange, assignment = null, courseId = null, onAssigned }: AssignHomeworkDialogProps) {
  const { t } = useTranslation("homework");
  const months = useTranslation("lesson").t("list.months", { returnObjects: true }) as string[];
  const isCompact = useIsCompact();
  const assign = useAssignFromBank();
  const bank = useHomeworkBank(open && !assignment);
  const [pickedId, setPickedId] = useState("");
  const [audience, setAudience] = useState<AudienceInput>({ courseIds: [], studentIds: [] });
  const [excluded, setExcluded] = useState<Set<string>>(new Set());
  const [date, setDate] = useState(() => inDays(7));
  const [time, setTime] = useState("23:59");
  const [allowLate, setAllowLate] = useState(true);
  const [announce, setAnnounce] = useState(true);

  const source = assignment ?? bank.data?.find((item) => item.id === pickedId) ?? null;
  const enrollments = useCourseStudents(courseId, { page_size: 100 }, open && Boolean(courseId));
  const students = useMemo(
    () =>
      (enrollments.data?.items ?? [])
        .filter((item) => item.status === "approved")
        .map((item) => ({ id: item.student.id, name: item.student.name, avatarUrl: item.student.avatarUrl })),
    [enrollments.data]
  );
  const chosen = students.filter((student) => !excluded.has(student.id)).map((student) => student.id);
  const target = courseId
    ? excluded.size
      ? { courseIds: [] as string[], studentIds: chosen }
      : { courseIds: [courseId], studentIds: [] as string[] }
    : audience;
  const nobody = courseId ? students.length > 0 && chosen.length === 0 : !audience.courseIds.length && !audience.studentIds.length;

  function close() {
    setPickedId("");
    setAudience({ courseIds: [], studentIds: [] });
    setExcluded(new Set());
    onOpenChange(false);
  }

  function submit() {
    if (!source) return;
    assign.mutate(
      {
        id: source.id,
        input: { ...target, dueAt: date ? `${date}T${time || "23:59"}` : null, allowLate, announceInChat: announce },
      },
      {
        onSuccess: (created) => {
          onAssigned?.(created);
          close();
        },
        onError: (error) =>
          toast.error(
            courseId && error instanceof AppError && error.fields?.student_ids ? t("bank.ambiguous") : error.message
          ),
      }
    );
  }

  const picker = assignment ? null : isCompact ? (
    <MobileFieldLabel label={t("bank.pickLabel")}>
      <MobilePickerField
        type="select"
        value={pickedId}
        display={source ? source.title : <span className="text-ink-secondary">{t("bank.pick")}</span>}
        ariaLabel={t("bank.pickLabel")}
        options={[
          { value: "", label: t("bank.pick") },
          ...(bank.data ?? []).map((item) => ({ value: item.id, label: item.title })),
        ]}
        onChange={setPickedId}
      />
    </MobileFieldLabel>
  ) : (
    <SelectPicker
      label={t("bank.pickLabel")}
      searchable
      value={pickedId}
      onChange={setPickedId}
      options={(bank.data ?? []).map((item) => ({ value: item.id, label: item.title }))}
    />
  );

  const who = courseId ? (
    <StudentChecklist
      students={students}
      excluded={excluded}
      loading={enrollments.isLoading}
      onChange={setExcluded}
    />
  ) : (
    <AudiencePicker value={audience} onChange={setAudience} />
  );

  const due = isCompact ? (
    <div className="grid grid-cols-2 gap-3">
      <MobileFieldLabel label={t("form.due")}>
        <MobilePickerField
          type="date"
          value={date}
          display={dateLabel(date, months)}
          ariaLabel={t("form.due")}
          onChange={setDate}
        />
      </MobileFieldLabel>
      <MobileFieldLabel label={t("form.time")}>
        <MobilePickerField type="time" value={time} display={time} ariaLabel={t("form.time")} onChange={setTime} />
      </MobileFieldLabel>
    </div>
  ) : (
    <div className="grid grid-cols-2 items-start gap-3">
      <DatePicker label={t("form.due")} value={date} onChange={setDate} />
      <TimePicker label={t("form.time")} value={time} onChange={setTime} />
    </div>
  );

  const switches = (
    <div className="flex flex-col gap-3 rounded-xl bg-subtle p-4">
      <label className="flex cursor-pointer items-center gap-3">
        <span className="min-w-0 flex-1 text-body-sm text-ink">{t("bank.allowLate")}</span>
        <Switch checked={allowLate} onCheckedChange={setAllowLate} />
      </label>
      <label className="flex cursor-pointer items-center gap-3">
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="text-body-sm text-ink">{t("form.announce")}</span>
          <small className="text-caption text-ink-tertiary">{t("bank.announceHint")}</small>
        </span>
        <Switch checked={announce} onCheckedChange={setAnnounce} />
      </label>
    </div>
  );

  return (
    <AppDialog
      open={open}
      onOpenChange={(next) => (next ? onOpenChange(true) : close())}
      variant="adaptive"
      width="lg:max-w-130"
      title={t("bank.assignTitle")}
      description={assignment ? assignment.title : t("bank.assignDescription")}
      footer={
        <>
          <button type="button" className={dialogButton.secondary} onClick={close}>
            {t("bank.cancel")}
          </button>
          <button
            type="button"
            className={dialogButton.primary}
            disabled={!source || nobody || assign.isPending}
            onClick={submit}
          >
            {t("bank.assignAction")}
          </button>
        </>
      }
    >
      <div className="lesson-form flex flex-col gap-4">
        {picker}
        {who}
        {due}
        {switches}
      </div>
    </AppDialog>
  );
}
