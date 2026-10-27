import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { ROUTES } from "@/shared/config";
import { useIsCompact } from "@/shared/hooks/use-media-query";
import { AppDialog, dialogButton } from "@/shared/ui/app-dialog";
import { Icon } from "@/shared/ui/icon";
import { DatePicker, SelectPicker } from "@/shared/ui/legacy/form-pickers";
import { MobileFieldLabel, MobilePickerField } from "@/shared/ui/mobile-fields";
import { mobileButton } from "@/shared/ui/mobile-page";
import { MobileScreenDialog } from "@/shared/ui/mobile-screen-dialog";
import { Switch } from "@/shared/ui/switch";
import type { ExamTemplate, QuizSummary } from "@/shared/types";
import type { ExamFormValues } from "../api/exam.dto";

/** IELTS shablonidagi bo'lim -> AI sahifasidagi imtihon nomi (yangi oynada oldindan tanlangan holda ochiladi). */
const AI_EXAM_FOR_SECTION: Record<string, string> = {
  listening: "IELTS Listening",
  reading: "IELTS Academic Reading",
  writing: "IELTS Writing",
};

const SECTION_ICON: Record<string, string> = {
  listening: "volume-up",
  reading: "menu-book",
  writing: "edit-note",
  speaking: "mic",
};

export interface ExamCreateDialogProps {
  open: boolean;
  pending?: boolean;
  courses: Array<{ id: string; title: string; studentCount?: number }>;
  templates: ExamTemplate[];
  quizzes: QuizSummary[];
  onOpenChange: (open: boolean) => void;
  onCreate: (values: ExamFormValues) => void;
  onCreateTemplate: () => void;
}

function totalMinutes(template: ExamTemplate): number {
  return template.items.reduce((sum, item) => sum + (item.minutes ?? 0), 0);
}

function durationLabel(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  return hours ? `${hours}s ${minutes % 60}d` : `${minutes}d`;
}

export function ExamCreateDialog({
  open,
  pending = false,
  courses,
  templates,
  quizzes,
  onOpenChange,
  onCreate,
  onCreateTemplate,
}: ExamCreateDialogProps) {
  const { t } = useTranslation("exam");
  const months = useTranslation("lesson").t("list.months", { returnObjects: true }) as string[];
  const isCompact = useIsCompact();
  const [courseId, setCourseId] = useState(courses[0]?.id ?? "");
  const [templateId, setTemplateId] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [startNow, setStartNow] = useState(false);
  const [sectionQuiz, setSectionQuiz] = useState<Record<string, string>>({});
  const [openSection, setOpenSection] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const template = templates.find((item) => item.id === templateId) ?? null;
  const sections = useMemo(
    () => (template?.items ?? []).filter((item) => item.kind === "section"),
    [template]
  );
  const usableQuizzes = useMemo(
    () => quizzes.filter((quiz) => quiz.status === "published" && quiz.questionCount > 0),
    [quizzes]
  );

  const errorCount = Object.keys(errors).length;

  function close() {
    setTemplateId("");
    setStartsAt("");
    setStartNow(false);
    setSectionQuiz({});
    setOpenSection(null);
    setErrors({});
    onOpenChange(false);
  }

  function submit() {
    const next: Record<string, string> = {};
    if (!courseId) next.course = t("createDialog.validation.chooseCourse");
    if (!template) next.template = t("createDialog.validation.chooseTemplate");
    if (!startNow && !startsAt) next.start = t("createDialog.validation.chooseStart");
    else if (!startNow && new Date(startsAt).getTime() <= Date.now())
      next.start = t("createDialog.validation.startInFuture");

    const used = new Set<string>();
    for (const section of sections) {
      const quizId = sectionQuiz[section.key];
      if (section.manual) continue;
      if (!quizId) {
        next[section.key] = t("createDialog.validation.chooseQuiz", { title: section.title });
        continue;
      }
      if (used.has(quizId)) next[section.key] = t("createDialog.validation.quizTwice");
      used.add(quizId);
    }

    setErrors(next);
    if (Object.keys(next).length || !template) return;

    onCreate({
      courseId,
      templateId: template.id,
      title: `${template.name} · ${courses.find((item) => item.id === courseId)?.title ?? ""}`.trim(),
      startsAt,
      startNow,
      sections: sections.map((section) => ({
        key: section.key,
        quizId: sectionQuiz[section.key],
      })),
    });
  }

  if (isCompact) {
    const course = courses.find((item) => item.id === (courseId || courses[0]?.id)) ?? null;
    const start = startsAt ? new Date(startsAt) : null;
    const startLabel =
      start && !Number.isNaN(start.getTime())
        ? `${start.getDate()}-${(months[start.getMonth()] ?? "").toLowerCase()}, ${startsAt.slice(11, 16)}`
        : null;
    const courseLabel = (item: { title: string; studentCount?: number }) =>
      item.studentCount === undefined ? item.title : `${item.title} · ${t("createDialog.mobile.students", { count: item.studentCount })}`;

    return (
      <MobileScreenDialog
        open={open}
        onOpenChange={(next) => (next ? onOpenChange(true) : close())}
        title={t("createDialog.title")}
        description={t("createDialog.description")}
        closeLabel={t("createDialog.cancel")}
        onClose={close}
        footer={
          <button type="button" className={mobileButton.primary} disabled={pending} onClick={submit}>
            {t("createDialog.submit")}
          </button>
        }
      >
        {errorCount ? (
          <p className="mt-4 flex h-11 items-center gap-2.5 rounded-xl bg-danger-bg px-3 text-body-sm font-medium text-error-text">
            <Icon name="warning-fill" size={20} className="shrink-0 text-danger" />
            {t("createDialog.errorSummary", { count: errorCount })}
          </p>
        ) : (
          <p className="mt-4 text-body-sm text-ink-secondary">{t("createDialog.description")}</p>
        )}

        <div className="mt-[11px] grid grid-cols-3 gap-2">
          {templates.map((item) => {
            const active = item.id === templateId;
            const minutes = totalMinutes(item);
            return (
              <button
                key={item.id}
                type="button"
                aria-pressed={active}
                className={`flex h-16 min-w-0 flex-col justify-center rounded-lg px-3 text-left transition-colors ${
                  active ? "border-[1.5px] border-brand bg-brand-subtle" : "border-[1.5px] border-transparent bg-surface"
                } ${errors.template ? "border-danger" : ""}`}
                onClick={() => {
                  setTemplateId(item.id);
                  setSectionQuiz({});
                  setErrors(({ template: _template, ...rest }) => rest);
                }}
              >
                <strong className="truncate text-title text-ink">{item.name}</strong>
                <small className="truncate text-caption font-normal tracking-tight text-ink-secondary">
                  {t("createDialog.sectionCount", { count: item.items.filter((part) => part.kind === "section").length })}
                  {minutes ? ` · ${durationLabel(minutes)}` : ""}
                </small>
              </button>
            );
          })}
        </div>

        <button
          type="button"
          className="mt-[14px] w-fit text-body-sm font-semibold text-brand transition-opacity hover:opacity-80"
          onClick={onCreateTemplate}
        >
          {t("createDialog.newTemplate")}
        </button>

        <div className="mt-[11px] flex flex-col gap-[11px]">
          <MobileFieldLabel gapClassName="gap-[7px]" label={t("createDialog.courseLabel")}>
            <MobilePickerField
              type="select"
              surface
              value={course?.id ?? ""}
              invalid={Boolean(errors.course)}
              display={course ? courseLabel(course) : <span className="text-ink-secondary">{t("createDialog.mobile.pick")}</span>}
              ariaLabel={t("createDialog.courseLabel")}
              options={courses.map((item) => ({ value: item.id, label: courseLabel(item) }))}
              onChange={(value) => {
                setCourseId(value);
                setErrors(({ course: _course, ...rest }) => rest);
              }}
            />
          </MobileFieldLabel>

          <div className="flex flex-col">
            <MobileFieldLabel gapClassName="gap-[7px]" label={t("createDialog.startLabel")}>
              <MobilePickerField
                type="datetime-local"
                surface
                value={startsAt}
                invalid={Boolean(errors.start)}
                display={startLabel ?? <span className="text-ink-secondary">{t("createDialog.mobile.pick")}</span>}
                ariaLabel={t("createDialog.startLabel")}
                onChange={(value) => {
                  setStartsAt(value);
                  setErrors(({ start: _start, ...rest }) => rest);
                }}
              />
            </MobileFieldLabel>
            {errors.start ? <small className="mt-1.5 text-caption font-normal text-error-text">{errors.start}</small> : null}
          </div>
        </div>

        <span className="mt-[13px] text-caption-strong text-ink-secondary uppercase">
          {t("createDialog.sectionsHead")} · {sections.length}
        </span>

        {template ? (
          <div className="mt-[11px] flex flex-col overflow-hidden rounded-xl bg-surface">
            {sections.map((item) => {
              const quiz = usableQuizzes.find((row) => row.id === sectionQuiz[item.key]) ?? null;
              const invalid = Boolean(errors[item.key]);
              return (
                <div
                  key={item.key}
                  className={`relative flex h-[72px] items-center gap-3 px-4 ${
                    invalid ? "mx-1 rounded-lg border-[1.5px] border-danger bg-danger-bg px-3" : ""
                  }`}
                >
                  <span className="grid size-9 shrink-0 place-items-center rounded-md bg-brand-subtle text-brand">
                    <Icon name={SECTION_ICON[item.key] ?? "description"} size={18} />
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate text-title text-ink">
                      <strong className="font-semibold">{item.title}</strong>
                      <span className="text-body-sm text-ink-secondary">
                        {" · "}
                        {item.minutes ? t("createDialog.mobile.minutes", { count: item.minutes }) : "—"}
                      </span>
                    </span>
                    <small
                      className={`truncate text-caption ${
                        invalid ? "text-error-text" : item.manual ? "font-normal text-ink-secondary" : quiz ? "text-success-fg" : "text-brand"
                      }`}
                    >
                      {invalid
                        ? errors[item.key]
                        : item.manual
                          ? item.key === "speaking"
                            ? t("createDialog.offlineSection")
                            : t("createDialog.mobile.manual")
                          : (quiz?.title ?? quiz?.topic ?? t("createDialog.pickQuiz"))}
                    </small>
                  </span>
                  {item.manual ? null : (
                    <>
                      <Icon name="chevron-right" size={20} className="shrink-0 text-icon-secondary" />
                      <select
                        className="absolute inset-0 cursor-pointer opacity-0"
                        value={sectionQuiz[item.key] ?? ""}
                        aria-label={t("createDialog.mobile.pickFor", { title: item.title })}
                        onChange={(event) => {
                          const value = event.target.value;
                          setSectionQuiz((current) => ({ ...current, [item.key]: value }));
                          setErrors(({ [item.key]: _removed, ...rest }) => rest);
                        }}
                      >
                        <option value="">{t("createDialog.pickQuiz")}</option>
                        {usableQuizzes.map((row) => (
                          <option key={row.id} value={row.id}>
                            {row.title || row.topic} · {row.questionCount}
                          </option>
                        ))}
                      </select>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <p className="mt-[13px] rounded-xl bg-surface px-4 py-6 text-center text-body-sm text-ink-secondary">
            {t("createDialog.validation.chooseTemplate")}
          </p>
        )}

        {template && !usableQuizzes.length ? (
          <div className="mt-5 flex flex-col gap-1 px-3">
            <span className="text-body-sm font-medium text-ink">{t("createDialog.noQuizzesShort")}</span>
            <a className="w-fit text-body-sm font-semibold text-brand" href={ROUTES.teacher.workspaceAi}>
              {t("createDialog.createWithAiShort")}
            </a>
          </div>
        ) : null}
      </MobileScreenDialog>
    );
  }

  return (
    <AppDialog
      open={open}
      onOpenChange={(next) => (next ? onOpenChange(true) : close())}
      variant="confirm"
      width="lg:w-204"
      icon={
        <span className="grid size-11 place-items-center rounded-md bg-accent-violet-bg text-accent-violet-fg">
          <Icon name="emoji-events" size={22} />
        </span>
      }
      title={t("createDialog.title")}
      description={
        errorCount
          ? t("createDialog.errorSummary", { count: errorCount })
          : t("createDialog.description")
      }
      footer={
        <>
          <span className="min-w-0 flex-1" />
          <button type="button" className={`${dialogButton.secondary} flex-none`} onClick={close}>
            {t("createDialog.cancel")}
          </button>
          <button
            type="button"
            className={`${dialogButton.primary} flex-none`}
            disabled={pending}
            onClick={submit}
          >
            {t("createDialog.submit")}
          </button>
        </>
      }
    >
      <div className="grid items-start gap-6 lg:grid-cols-2">
        <div className="exam-form flex min-w-0 flex-col gap-4">
          {errorCount ? (
            <p className="flex items-center gap-2.5 rounded-md bg-danger-bg px-4 py-3 text-body-sm text-danger">
              <Icon name="error" size={18} className="shrink-0" />
              {t("createDialog.errorSummary", { count: errorCount })}
            </p>
          ) : null}

          <div className="grid grid-cols-3 gap-2.5">
            {templates.map((item) => {
              const active = item.id === templateId;
              const minutes = totalMinutes(item);
              return (
                <button
                  key={item.id}
                  type="button"
                  className={`flex flex-col gap-1 rounded-md border px-4 py-3 text-left transition-colors ${
                    active ? "border-brand bg-brand-subtle" : "border-line bg-surface hover:bg-subtle"
                  }`}
                  onClick={() => {
                    setTemplateId(item.id);
                    setSectionQuiz({});
                    setOpenSection(null);
                    setErrors({});
                  }}
                >
                  <strong className="truncate text-title-sm text-ink">{item.name}</strong>
                  <small className="truncate text-caption text-ink-tertiary">
                    {t("createDialog.sectionCount", {
                      count: item.items.filter((part) => part.kind === "section").length,
                    })}
                    {minutes ? ` · ${durationLabel(minutes)}` : ""}
                  </small>
                </button>
              );
            })}
          </div>

          <button
            type="button"
            className="w-fit text-button text-brand transition-opacity hover:opacity-80"
            onClick={onCreateTemplate}
          >
            {t("createDialog.newTemplate")}
          </button>

          <SelectPicker
            label={t("createDialog.courseLabel")}
            searchable
            value={courseId}
            onChange={(value) => {
              setCourseId(value);
              setErrors(({ course: _course, ...rest }) => rest);
            }}
            options={courses.map((course) => ({ value: course.id, label: course.title }))}
          />

          {startNow ? null : (
            <div className={errors.start ? "is-field-error" : undefined}>
              <DatePicker
                label={t("createDialog.startLabel")}
                value={startsAt}
                onChange={(value) => {
                  setStartsAt(value);
                  setErrors(({ start: _start, ...rest }) => rest);
                }}
                includeTime
              />
              {errors.start ? (
                <small className="mt-1.5 block text-body-xs text-danger">{errors.start}</small>
              ) : null}
            </div>
          )}
        </div>

        <div className="flex min-w-0 flex-col gap-3">
          <span className="text-overline text-ink-tertiary uppercase">
            {t("createDialog.sectionsHead")} · {sections.length}
          </span>

          <div className="flex flex-col gap-2 rounded-md bg-subtle p-2">
            {(template?.items ?? []).map((item) => {
              if (item.kind !== "section") {
                return (
                  <span
                    key={item.key}
                    className="flex items-center gap-3 rounded-md px-3.5 py-3 text-ink-tertiary"
                  >
                    <Icon name="clock" size={18} className="shrink-0" />
                    <small className="min-w-0 flex-1 truncate text-body-xs">
                      {t("createDialog.breakMinutes", { count: item.minutes ?? 0 })}
                    </small>
                  </span>
                );
              }

              const quiz = usableQuizzes.find((row) => row.id === sectionQuiz[item.key]) ?? null;
              const invalid = Boolean(errors[item.key]);
              const expanded = openSection === item.key;

              return (
                <div key={item.key} className="flex flex-col gap-1">
                  <button
                    type="button"
                    className={`flex items-center gap-3 rounded-md border bg-surface px-3.5 py-3 text-left transition-colors ${
                      invalid ? "border-danger" : "border-transparent hover:bg-subtle"
                    }`}
                    disabled={item.manual}
                    onClick={() => setOpenSection(expanded ? null : item.key)}
                  >
                    <span className="grid size-9 shrink-0 place-items-center rounded-md bg-brand-subtle text-brand">
                      <Icon name={SECTION_ICON[item.key] ?? "description"} size={18} />
                    </span>

                    <span className="flex min-w-0 flex-1 flex-col">
                      <strong className="truncate text-title-sm text-ink">
                        {item.title}
                        {item.minutes ? ` · ${t("createDialog.defaultMinutes", { count: item.minutes })}` : " · —"}
                      </strong>
                      <small
                        className={`truncate text-body-xs ${
                          invalid
                            ? "text-danger"
                            : item.manual
                              ? "text-ink-tertiary"
                              : quiz
                                ? "text-success"
                                : "text-brand"
                        }`}
                      >
                        {invalid
                          ? errors[item.key]
                          : item.manual
                            ? item.key === "speaking"
                              ? t("createDialog.offlineSection")
                              : t("createDialog.manualSection")
                            : (quiz?.title ?? quiz?.topic ?? t("createDialog.pickQuiz"))}
                      </small>
                    </span>

                    {item.manual ? null : (
                      <Icon
                        name="chevron-right"
                        size={18}
                        className={`shrink-0 text-icon-tertiary transition-transform ${
                          expanded ? "rotate-90" : ""
                        }`}
                      />
                    )}
                  </button>

                  {expanded ? (
                    <div className="flex max-h-60 flex-col gap-0.5 overflow-y-auto rounded-md bg-surface p-1">
                      {usableQuizzes.map((row) => (
                        <button
                          key={row.id}
                          type="button"
                          className={`flex items-center gap-2 rounded-sm px-3 py-2 text-left text-body-sm transition-colors ${
                            sectionQuiz[item.key] === row.id
                              ? "bg-brand-subtle text-brand"
                              : "text-ink hover:bg-subtle"
                          }`}
                          onClick={() => {
                            setSectionQuiz((current) => ({ ...current, [item.key]: row.id }));
                            setErrors(({ [item.key]: _removed, ...rest }) => rest);
                            setOpenSection(null);
                          }}
                        >
                          <span className="min-w-0 flex-1 truncate">
                            {row.title || row.topic} · {row.questionCount}
                          </span>
                        </button>
                      ))}

                      {!usableQuizzes.length ? (
                        <p className="px-3 py-2 text-body-xs text-ink-tertiary">
                          {t("createDialog.noQuizzes")}
                        </p>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              );
            })}

            {!template ? (
              <p className="px-3.5 py-6 text-center text-body-sm text-ink-tertiary">
                {t("createDialog.validation.chooseTemplate")}
              </p>
            ) : null}
          </div>

          {template?.id === "ielts" ? (
            <div className="flex flex-col gap-1 rounded-md bg-brand-subtle px-4 py-3">
              <small className="text-body-xs text-ink-secondary">
                {t("createDialog.noQuizzesShort")}
              </small>
              <a
                className="w-fit text-button text-brand transition-opacity hover:opacity-80"
                href={`/teacher/workspace/ai?exam=${encodeURIComponent(AI_EXAM_FOR_SECTION.listening)}`}
                target="_blank"
                rel="noopener"
              >
                {t("createDialog.createWithAiShort")}
              </a>
            </div>
          ) : null}

          <span className="flex items-center gap-3 rounded-md bg-subtle px-4 py-3">
            <span className="flex min-w-0 flex-1 flex-col">
              <strong className="truncate text-title-sm text-ink">
                {t("createDialog.startNowTitle")}
              </strong>
              <small className="truncate text-body-xs text-ink-tertiary">
                {t("createDialog.startNowHint")}
              </small>
            </span>
            <Switch
              checked={startNow}
              onCheckedChange={(next) => {
                setStartNow(next);
                setErrors(({ start: _start, ...rest }) => rest);
              }}
              aria-label={t("createDialog.startNowTitle")}
            />
          </span>
        </div>
      </div>
    </AppDialog>
  );
}
