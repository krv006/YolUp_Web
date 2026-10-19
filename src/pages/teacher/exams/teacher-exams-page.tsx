import { useMemo, useState } from "react";
import { ClipboardCheck } from "lucide-react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useCourses } from "@/modules/course";
import { useQuizzes } from "@/modules/quiz";
import {
  ExamCreateDialog,
  ExamScoreDialog,
  ExamTemplateDialog,
  ExamWritingReview,
  useCreateExam,
  useCreateExamTemplate,
  useDeleteExam,
  useExamResults,
  useExamTemplates,
  useExams,
  useSaveManualScores,
  useUpdateExam,
} from "@/modules/exam";
import type { ExamStudentResult, ExamSummary } from "@/shared/types";
import { usePageCreateStore } from "@/shared/model";
import { AppDialog, dialogButton } from "@/shared/ui/app-dialog";
import { Avatar } from "@/shared/ui/legacy";
import { DatePicker } from "@/shared/ui/legacy/form-pickers";
import { Icon } from "@/shared/ui/icon";

type Filter = "all" | "ielts" | "sat" | "cert" | "custom";

const STATE_TONE: Record<string, string> = {
  upcoming: "bg-saffron-strong text-white",
  running: "bg-action text-on-action",
  finished: "bg-success text-white",
};

const STATE_BADGE: Record<string, string> = {
  upcoming: "bg-saffron-subtle text-saffron-strong",
  running: "bg-action-subtle text-action",
  finished: "bg-success-bg text-success-text",
};

function matchesFilter(exam: ExamSummary, filter: Filter): boolean {
  if (filter === "all") return true;
  const key = `${exam.templateKey} ${exam.title}`.toLowerCase();
  if (filter === "ielts") return key.includes("ielts");
  if (filter === "sat") return key.includes("sat");
  if (filter === "cert") return key.includes("cert") || key.includes("sertifikat");
  return !/ielts|sat|cert|sertifikat/.test(key);
}

export function TeacherExamsPage() {
  const { t } = useTranslation("exam");
  const months = useTranslation("lesson").t("list.months", { returnObjects: true }) as string[];
  const courses = useCourses();
  const exams = useExams(null);
  const templates = useExamTemplates();
  const quizzes = useQuizzes(null);
  const create = useCreateExam();
  const createTemplate = useCreateExamTemplate();
  const update = useUpdateExam();
  const remove = useDeleteExam();

  const createOpen = usePageCreateStore((state) => state.open.exam);
  const setCreateOpen = (value: boolean) => usePageCreateStore.getState().setOpen("exam", value);

  const [filter, setFilter] = useState<Filter>("all");
  const [templateOpen, setTemplateOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editTarget, setEditTarget] = useState<ExamSummary | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ExamSummary | null>(null);
  const [essayStudent, setEssayStudent] = useState<ExamStudentResult | null>(null);
  const [scoreStudent, setScoreStudent] = useState<ExamStudentResult | null>(null);

  const list = (exams.data ?? []).filter((exam) => matchesFilter(exam, filter));
  const selected = list.find((exam) => exam.id === selectedId) ?? list[0] ?? null;
  const results = useExamResults(selected?.id ?? null, Boolean(selected));
  const saveScores = useSaveManualScores(selected?.id ?? "");
  const courseOptions = (courses.data ?? []).map((course) => ({ id: course.id, title: course.title }));

  const rows = useMemo(() => results.data?.results ?? [], [results.data]);
  const submitted = rows.filter((row) => row.participated);
  const bands = submitted
    .map((row) => row.total?.score)
    .filter((value): value is number => typeof value === "number");
  const average = bands.length
    ? (bands.reduce((sum, value) => sum + value, 0) / bands.length).toFixed(1)
    : "—";
  const top = bands.length ? Math.max(...bands).toFixed(1) : "—";

  const sectionAverages = useMemo(() => {
    const map = new Map<string, { title: string; values: number[] }>();
    for (const row of submitted) {
      for (const section of row.sections) {
        const entry = map.get(section.key) ?? { title: section.title, values: [] };
        if (typeof section.score === "number") entry.values.push(section.score);
        map.set(section.key, entry);
      }
    }
    return [...map.entries()].map(([key, value]) => ({
      key,
      title: value.title,
      score: value.values.length
        ? value.values.reduce((sum, item) => sum + item, 0) / value.values.length
        : null,
    }));
  }, [submitted]);

  function formatDate(value: string, withTime = true): string {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "—";
    const day = `${date.getDate()}-${(months[date.getMonth()] ?? "").toLowerCase()}, ${date.getFullYear()}`;
    if (!withTime) return day;
    const time = `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
    return `${day} · ${time}`;
  }

  function duration(minutes: number): string {
    if (minutes < 60) return t("mock.minutesOnly", { count: minutes });
    const rest = minutes % 60;
    return rest
      ? t("mock.durationValue", { hours: Math.floor(minutes / 60), minutes: rest })
      : t("mock.hoursOnly", { count: Math.floor(minutes / 60) });
  }

  function downloadResults() {
    if (!selected || !rows.length) return;
    const header = ["O'quvchi", "Band", ...sectionAverages.map((item) => item.title)];
    const lines = rows.map((row) => [
      row.studentName,
      row.total?.score ?? "",
      ...sectionAverages.map(
        (item) => row.sections.find((section) => section.key === item.key)?.score ?? ""
      ),
    ]);
    const csv = [header, ...lines]
      .map((cells) => cells.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const url = URL.createObjectURL(new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `${selected.title}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  if (exams.isLoading)
    return (
      <div className="flex h-full flex-col gap-3 bg-canvas p-4 lg:p-6">
        {Array.from({ length: 3 }, (_, index) => (
          <div key={index} className="h-40 animate-pulse rounded-2xl bg-muted" />
        ))}
      </div>
    );

  if (!list.length)
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 bg-canvas px-6 text-center">
        <span className="grid size-16 place-items-center rounded-full bg-action-subtle text-action">
          <ClipboardCheck size={28} />
        </span>
        <strong className="font-heading text-h3 text-ink">{t("teacherList.empty")}</strong>
        {courseOptions.length ? (
          <button
            type="button"
            className="mt-1 flex h-12 items-center rounded-full bg-action px-5 text-label-strong text-on-action transition-colors hover:bg-action-hover"
            onClick={() => setCreateOpen(true)}
          >
            {t("teacherList.createFirst")}
          </button>
        ) : (
          <p className="text-body-sm text-ink-tertiary">{t("teacherList.needCourse")}</p>
        )}

        <ExamCreateDialog
          open={createOpen}
          pending={create.isPending}
          courses={courseOptions}
          templates={templates.data ?? []}
          quizzes={quizzes.data ?? []}
          onOpenChange={setCreateOpen}
          onCreateTemplate={() => setTemplateOpen(true)}
          onCreate={(values) => create.mutateAsync(values).then(() => setCreateOpen(false))}
        />
      </div>
    );

  const examCards = (
    <>
      <div className="flex flex-wrap items-center gap-2">
        {(
          [
            ["ielts", t("mock.filterIelts")],
            ["sat", t("mock.filterSat")],
            ["cert", t("mock.filterCert")],
            ["custom", t("mock.filterCustom")],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            className={`h-10 rounded-full px-4 text-label-strong transition-colors ${
              filter === id
                ? "bg-action-subtle text-action"
                : "border border-line bg-surface text-ink-secondary hover:bg-subtle"
            }`}
            onClick={() => setFilter(filter === id ? "all" : id)}
          >
            {label}
          </button>
        ))}
      </div>

      {list.map((exam) => {
        const examRows = exam.id === selected?.id ? rows : [];
        const done = examRows.filter((row) => row.participated).length;
        const total = examRows.length;
        const progress = total ? Math.round((done / total) * 100) : 0;
        return (
          <motion.article
            key={exam.id}
            className={`flex flex-col gap-3 rounded-2xl border bg-surface p-4 ${
              exam.id === selected?.id ? "border-action" : "border-line"
            }`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-start gap-3">
              <span
                className={`grid size-10 shrink-0 place-items-center rounded-xl ${
                  STATE_TONE[exam.state] ?? STATE_TONE.upcoming
                }`}
              >
                <ClipboardCheck size={18} />
              </span>
              <span className="flex min-w-0 flex-1 flex-col gap-1">
                <strong className="truncate text-title text-ink">{exam.title}</strong>
                <span
                  className={`w-fit rounded-full px-2.5 py-0.5 text-caption-strong ${
                    STATE_BADGE[exam.state] ?? STATE_BADGE.upcoming
                  }`}
                >
                  {exam.state === "upcoming"
                    ? t("mock.stateScheduled")
                    : exam.state === "running"
                      ? t("mock.stateRunning")
                      : t("mock.stateFinished")}
                </span>
              </span>
              <button
                type="button"
                className="grid size-9 shrink-0 place-items-center rounded-full text-ink-tertiary transition-colors hover:bg-subtle hover:text-ink"
                onClick={() => setDeleteTarget(exam)}
                aria-label={t("teacherList.deleteAria")}
              >
                <Icon name="more" size={18} />
              </button>
            </div>

            <div className="flex flex-col gap-1.5 text-caption text-ink-secondary">
              <span className="flex items-center gap-2">
                <Icon name="nav-calendar" size={15} className="shrink-0 text-ink-tertiary" />
                {formatDate(exam.startsAt)}
              </span>
              <span className="flex items-center gap-2">
                <Icon name="groups" size={15} className="shrink-0 text-ink-tertiary" />
                {exam.courseTitle}
              </span>
              <span className="flex items-center gap-2">
                <Icon name="assign" size={15} className="shrink-0 text-ink-tertiary" />
                {duration(exam.totalMinutes)}
              </span>
            </div>

            {exam.state === "running" && total ? (
              <div className="flex flex-col gap-1.5">
                <span className="flex items-baseline gap-2">
                  <small className="flex-1 text-caption text-ink-secondary">
                    {t("mock.submittedOf", { done, total })}
                  </small>
                  <small className="font-numeric text-caption-strong text-ink">{progress}%</small>
                </span>
                <span className="h-1.5 w-full overflow-hidden rounded-full bg-subtle">
                  <span className="block h-full rounded-full bg-action" style={{ width: `${progress}%` }} />
                </span>
              </div>
            ) : null}

            <button
              type="button"
              className="flex h-12 items-center justify-center rounded-xl border border-line bg-surface text-label-strong text-ink transition-colors hover:bg-subtle"
              onClick={() => {
                if (exam.state === "upcoming") {
                  setEditTarget(exam);
                  return;
                }
                setSelectedId(exam.id);
                setEssayStudent(null);
              }}
            >
              {exam.state === "upcoming"
                ? t("mock.edit")
                : exam.state === "running"
                  ? t("mock.watch")
                  : t("mock.results")}
            </button>
          </motion.article>
        );
      })}
    </>
  );

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-canvas lg:flex-row">
      <aside className="flex w-full shrink-0 flex-col gap-3 overflow-y-auto border-line p-4 lg:w-[380px] lg:border-r lg:p-5">
        {essayStudent ? (
          <section className="flex flex-col overflow-hidden rounded-2xl border border-line bg-surface">
            <span className="flex items-center gap-3 border-b border-line px-4 py-3">
              <strong className="flex-1 text-label-strong text-ink">
                {t("mock.studentsTitle")}
              </strong>
              <small className="text-caption text-ink-tertiary">{t("mock.byBand")}</small>
            </span>
            {[...rows]
              .sort((a, b) => (b.total?.score ?? -1) - (a.total?.score ?? -1))
              .map((row) => (
                <button
                  key={row.studentId}
                  type="button"
                  className={`flex items-center gap-3 border-b border-line px-4 py-3 text-left transition-colors last:border-b-0 ${
                    row.studentId === essayStudent.studentId ? "bg-action-subtle/50" : "hover:bg-subtle"
                  }`}
                  onClick={() => row.participated && setEssayStudent(row)}
                >
                  <Avatar name={row.studentName} size="sm" />
                  <span className="flex min-w-0 flex-1 flex-col">
                    <strong className="truncate text-label-strong text-ink">
                      {row.studentName}
                    </strong>
                    <small className="truncate text-caption text-ink-tertiary">
                      {row.participated
                        ? row.sections
                            .map(
                              (section) =>
                                `${section.title.slice(0, 1)} ${section.score === null ? "—" : section.score}`
                            )
                            .join(" · ")
                        : t("mock.notEntered")}
                    </small>
                  </span>
                  {row.participated ? (
                    <span className="shrink-0 rounded-full bg-success-bg px-2.5 py-1 font-numeric text-caption-strong text-success-text">
                      {row.total?.score == null ? "—" : row.total.score.toFixed(1)}
                    </span>
                  ) : (
                    <span className="shrink-0 rounded-full bg-error-bg px-2.5 py-1 text-caption-strong text-error-text">
                      {t("mock.notSubmitted")}
                    </span>
                  )}
                </button>
              ))}
          </section>
        ) : (
          examCards
        )}
      </aside>

      <section className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-4 lg:p-6">
        {!selected ? (
          <p className="text-body-sm text-ink-tertiary">{t("mock.pickExam")}</p>
        ) : essayStudent ? (
          <>
            <div className="flex items-center gap-3">
              <button
                type="button"
                className="grid size-10 shrink-0 place-items-center rounded-full border border-line bg-surface text-ink transition-colors hover:bg-subtle"
                onClick={() => setEssayStudent(null)}
                aria-label={t("mock.backToResults")}
              >
                <Icon name="arrow-back" size={19} />
              </button>
              <span className="flex min-w-0 flex-1 flex-col">
                <strong className="truncate font-heading text-h3 text-ink">
                  {essayStudent.studentName}
                </strong>
                <small className="truncate text-caption text-ink-tertiary">
                  {t("mock.essaysHeader", {
                    exam: selected.title,
                    date: formatDate(selected.startsAt, false),
                    count: essayStudent.sections.filter((section) => section.manual).length,
                  })}
                </small>
              </span>
              <button
                type="button"
                className="flex h-11 shrink-0 items-center gap-2 rounded-full bg-action px-4 text-label-strong text-on-action transition-colors hover:bg-action-hover"
                onClick={() => setScoreStudent(essayStudent)}
              >
                <Icon name="add" size={18} /> {t("result.manualScores")}
              </button>
            </div>

            <ExamWritingReview examId={selected.id} studentId={essayStudent.studentId} />
          </>
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-3">
              <p className="min-w-0 flex-1 text-body-sm text-ink-secondary">
                {t("mock.resultsHeader", {
                  date: formatDate(selected.startsAt, false),
                  course: selected.courseTitle,
                })}
              </p>
              <button
                type="button"
                className="flex h-11 shrink-0 items-center gap-2 rounded-full border border-line bg-surface px-4 text-label-strong text-ink transition-colors hover:bg-subtle"
                onClick={downloadResults}
                disabled={!rows.length}
              >
                <Icon name="download" size={17} /> {t("mock.download")}
              </button>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {(
                [
                  [`${submitted.length}/${rows.length || 0}`, t("mock.statSubmitted")],
                  [average, t("mock.statAvg")],
                  [top, t("mock.statTop")],
                ] as const
              ).map(([value, label]) => (
                <div
                  key={label}
                  className="flex flex-col gap-1 rounded-2xl border border-line bg-surface p-4"
                >
                  <strong className="font-heading text-h1 text-ink">{value}</strong>
                  <small className="text-caption text-ink-secondary">{label}</small>
                </div>
              ))}
            </div>

            {sectionAverages.length ? (
              <section className="flex flex-col gap-3 rounded-2xl border border-line bg-surface p-4">
                <strong className="text-label-strong text-ink">{t("mock.sectionAverages")}</strong>
                {sectionAverages.map((section) => (
                  <span key={section.key} className="flex items-center gap-3">
                    <small className="w-24 shrink-0 text-body-sm text-ink-secondary">
                      {section.title}
                    </small>
                    <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-subtle">
                      <span
                        className="block h-full rounded-full bg-action"
                        style={{ width: `${((section.score ?? 0) / 9) * 100}%` }}
                      />
                    </span>
                    <small className="w-10 shrink-0 text-right font-numeric text-label-strong text-ink">
                      {section.score === null ? "—" : section.score.toFixed(1)}
                    </small>
                  </span>
                ))}
              </section>
            ) : null}

            <section className="flex flex-col overflow-hidden rounded-2xl border border-line bg-surface">
              <span className="flex items-center gap-3 border-b border-line px-4 py-3">
                <strong className="flex-1 text-label-strong text-ink">
                  {t("mock.studentsTitle")}
                </strong>
                <small className="text-caption text-ink-tertiary">{t("mock.byBand")}</small>
              </span>

              {results.isLoading ? (
                <p className="px-4 py-8 text-center text-body-sm text-ink-tertiary">
                  {t("result.loading")}
                </p>
              ) : rows.length ? (
                [...rows]
                  .sort((a, b) => (b.total?.score ?? -1) - (a.total?.score ?? -1))
                  .map((row) => (
                    <button
                      key={row.studentId}
                      type="button"
                      className="flex items-center gap-3 border-b border-line px-4 py-3 text-left transition-colors last:border-b-0 hover:bg-subtle"
                      onClick={() => row.participated && setEssayStudent(row)}
                    >
                      <Avatar name={row.studentName} size="sm" />
                      <span className="flex min-w-0 flex-1 flex-col">
                        <strong className="truncate text-label-strong text-ink">
                          {row.studentName}
                        </strong>
                        <small className="truncate text-caption text-ink-tertiary">
                          {row.participated
                            ? row.sections
                                .map(
                                  (section) =>
                                    `${section.title.slice(0, 1)} ${section.score === null ? "—" : section.score}`
                                )
                                .join(" · ")
                            : t("mock.notEntered")}
                        </small>
                      </span>
                      {row.participated ? (
                        <span className="shrink-0 rounded-full bg-success-bg px-2.5 py-1 font-numeric text-caption-strong text-success-text">
                          {row.total?.score === null || row.total?.score === undefined
                            ? "—"
                            : row.total.score.toFixed(1)}
                        </span>
                      ) : (
                        <span className="shrink-0 rounded-full bg-error-bg px-2.5 py-1 text-caption-strong text-error-text">
                          {t("mock.notSubmitted")}
                        </span>
                      )}
                    </button>
                  ))
              ) : (
                <p className="px-4 py-8 text-center text-body-sm text-ink-tertiary">
                  {t("mock.noResults")}
                </p>
              )}
            </section>
          </>
        )}
      </section>

      <ExamScoreDialog
        open={Boolean(scoreStudent)}
        onOpenChange={(open) => !open && setScoreStudent(null)}
        result={scoreStudent}
        pending={saveScores.isPending}
        onSave={(scores) => {
          if (!scoreStudent) return;
          saveScores
            .mutateAsync({ studentId: scoreStudent.studentId, scores })
            .then(() => setScoreStudent(null))
            .catch((error: Error) => toast.error(error.message));
        }}
      />

      <ExamCreateDialog
        open={createOpen}
        pending={create.isPending}
        courses={courseOptions}
        templates={templates.data ?? []}
        quizzes={quizzes.data ?? []}
        onOpenChange={setCreateOpen}
        onCreateTemplate={() => setTemplateOpen(true)}
        onCreate={(values) => create.mutateAsync(values).then(() => setCreateOpen(false))}
      />

      <ExamTemplateDialog
        open={templateOpen}
        pending={createTemplate.isPending}
        onOpenChange={setTemplateOpen}
        onCreate={(values) => createTemplate.mutateAsync(values).then(() => setTemplateOpen(false))}
      />

      <AppDialog
        open={Boolean(editTarget)}
        onOpenChange={(open) => !open && setEditTarget(null)}
        title={t("teacherList.editTitle")}
        description={t("teacherList.editDescription")}
        footer={
          <>
            <button
              type="button"
              className={dialogButton.secondary}
              onClick={() => setEditTarget(null)}
            >
              {t("teacherList.cancel")}
            </button>
            <button
              type="button"
              className={dialogButton.primary}
              disabled={update.isPending}
              onClick={() => {
                if (!editTarget) return;
                update
                  .mutateAsync({
                    id: editTarget.id,
                    values: { title: editTarget.title, startsAt: editTarget.startsAt },
                  })
                  .then(() => setEditTarget(null))
                  .catch((error: Error) => toast.error(error.message));
              }}
            >
              {t("teacherList.save")}
            </button>
          </>
        }
      >
        {editTarget ? (
          <div className="flex flex-col gap-4">
            <label className="field-group">
              <span>{t("createDialog.titleLabel")}</span>
              <input
                value={editTarget.title}
                onChange={(event) =>
                  setEditTarget({ ...editTarget, title: event.target.value })
                }
              />
            </label>
            <DatePicker
              label={t("createDialog.startsAtLabel")}
              includeTime
              value={editTarget.startsAt.slice(0, 16)}
              onChange={(value) => setEditTarget({ ...editTarget, startsAt: value })}
            />
          </div>
        ) : null}
      </AppDialog>

      <AppDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        variant="confirm"
        icon={
          <span className="grid size-11 place-items-center rounded-full bg-error-bg text-error-text">
            <Icon name="trash" size={20} />
          </span>
        }
        title={t("teacherList.deleteTitle")}
        description={t("teacherList.deleteDescription", { title: deleteTarget?.title ?? "" })}
        footer={
          <>
            <button
              type="button"
              className={dialogButton.secondary}
              onClick={() => setDeleteTarget(null)}
            >
              {t("teacherList.cancel")}
            </button>
            <button
              type="button"
              className={dialogButton.danger}
              disabled={remove.isPending}
              onClick={() => {
                if (!deleteTarget) return;
                remove
                  .mutateAsync(deleteTarget.id)
                  .then(() => setDeleteTarget(null))
                  .catch((error: Error) => toast.error(error.message));
              }}
            >
              {t("teacherList.delete")}
            </button>
          </>
        }
      />

    </div>
  );
}
