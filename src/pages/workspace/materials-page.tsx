import { useRef, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { useIsStudent, useRoleRoutes } from "@/modules/auth";
import {
  materialApi,
  useDeleteMaterial,
  useLessonFolder,
  useMaterialCourses,
  useMaterialLessons,
  useMaterials,
  useUploadMaterial,
} from "@/modules/material";
import { useIsCompact } from "@/shared/hooks/use-media-query";
import { downloadBlob, formatFileSize } from "@/shared/lib";
import type { Material, MaterialKind } from "@/shared/types";
import { AppDialog, dialogButton } from "@/shared/ui/app-dialog";
import { ConfirmDialog } from "@/shared/ui/confirm-dialog";
import { FileViewer } from "@/shared/ui/file-viewer";
import { Icon } from "@/shared/ui/icon";
import { SelectPicker } from "@/shared/ui/legacy/form-pickers";
import { MobileEmptyCard, MobilePageHeader } from "@/shared/ui/mobile-page";
import { WorkspaceShell, workspaceAction } from "@/widgets/workspace-shell";

const GENERAL = "general";
const MAX_SIZE = 50 * 1024 * 1024;
const ACCEPT =
  ".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.odt,.csv,.mp3,.m4a,.wav,.ogg,.mp4,.mov,.webm,.png,.jpg,.jpeg,.webp,.zip";

const KIND_LOOK: Record<MaterialKind, { icon: string; tone: string }> = {
  pdf: { icon: "description", tone: "bg-accent-red-bg text-accent-red-fg" },
  doc: { icon: "assign", tone: "bg-accent-blue-bg text-accent-blue-fg" },
  video: { icon: "videocam", tone: "bg-accent-violet-bg text-accent-violet-fg" },
  audio: { icon: "mic", tone: "bg-accent-saffron-bg text-accent-saffron-fg" },
  image: { icon: "image", tone: "bg-accent-green-bg text-accent-green-fg" },
  other: { icon: "folder", tone: "bg-subtle text-ink-secondary" },
};

const PREVIEWABLE: MaterialKind[] = ["pdf", "image", "video", "audio"];

interface Viewer {
  name: string;
  mimeType?: string;
  meta: string;
  load: (signal: AbortSignal) => Promise<Blob>;
}

function shortDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return `${String(date.getDate()).padStart(2, "0")}.${String(date.getMonth() + 1).padStart(2, "0")}.${date.getFullYear()}`;
}

function dayMonth(value: string): { day: string; month: string } {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return { day: "", month: "" };
  return { day: String(date.getDate()).padStart(2, "0"), month: String(date.getMonth() + 1).padStart(2, "0") };
}

function RowsSkeleton() {
  return (
    <div className="flex flex-col gap-2" aria-hidden="true">
      {Array.from({ length: 4 }, (_, index) => (
        <span key={index} className="flex items-center gap-3 rounded-2xl bg-surface p-4">
          <i className="size-11 shrink-0 rounded-xl bg-skeleton" />
          <span className="flex min-w-0 flex-1 flex-col gap-2">
            <i className="h-3.5 w-48 max-w-full rounded-full bg-skeleton" />
            <i className="h-3 w-32 max-w-full rounded-full bg-skeleton" />
          </span>
        </span>
      ))}
    </div>
  );
}

function FolderRow({
  icon,
  tone,
  title,
  meta,
  badge,
  onClick,
}: {
  icon: ReactNode;
  tone: string;
  title: string;
  meta: string;
  badge?: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className="flex w-full items-center gap-3 rounded-2xl bg-surface p-3 text-left transition-colors hover:bg-subtle lg:p-4"
      onClick={onClick}
    >
      <span className={`grid size-11 shrink-0 place-items-center rounded-xl ${tone}`}>{icon}</span>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="flex min-w-0 items-center gap-2">
          <strong className="truncate text-title text-ink">{title}</strong>
          {badge}
        </span>
        <small className="truncate text-body-xs text-ink-secondary">{meta}</small>
      </span>
      <Icon name="chevron-right" size={20} className="shrink-0 text-icon-secondary" />
    </button>
  );
}

export function MaterialsPage() {
  const { t } = useTranslation("workspace");
  const navigate = useNavigate();
  const routes = useRoleRoutes();
  const isStudent = useIsStudent();
  const isCompact = useIsCompact();
  const [params, setParams] = useSearchParams();
  const courseId = params.get("course");
  const lessonId = courseId ? params.get("lesson") : null;
  const level = lessonId ? "lesson" : courseId ? "course" : "root";
  const [search, setSearch] = useState("");
  const query = search.trim();
  const canManage = !isStudent;

  const folders = useMaterialCourses(level === "root");
  const searchResults = useMaterials({ search: query }, level === "root" && query.length > 0);
  const lessons = useMaterialLessons(courseId);
  const general = useMaterials({ course: courseId, lesson: GENERAL }, lessonId === GENERAL);
  const lessonFolder = useLessonFolder(lessonId && lessonId !== GENERAL ? lessonId : null);
  const remove = useDeleteMaterial();
  const [uploadOpen, setUploadOpen] = useState(false);
  const [viewer, setViewer] = useState<Viewer | null>(null);
  const [deleting, setDeleting] = useState<Material | null>(null);

  const courseTitle = lessons.data?.course.title ?? "";
  const currentLesson = lessonId && lessonId !== GENERAL ? lessons.data?.lessons.find((item) => item.id === lessonId) : null;
  const lessonTitle =
    lessonId === GENERAL ? t("materials.general") : (lessonFolder.data?.lesson.title || currentLesson?.title || "");
  const title = level === "lesson" ? lessonTitle : level === "course" ? courseTitle : t("materials.title");

  function go(next: { course?: string | null; lesson?: string | null }) {
    const values: Record<string, string> = {};
    if (next.course) values.course = next.course;
    if (next.course && next.lesson) values.lesson = next.lesson;
    setParams(values);
  }

  function back() {
    if (level === "lesson") go({ course: courseId });
    else if (level === "course") go({});
    else navigate(routes.workspace);
  }

  async function download(item: Material) {
    try {
      downloadBlob(await materialApi.download(item.id), item.name || item.title);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("materials.downloadFailed"));
    }
  }

  function open(item: Material) {
    if (!PREVIEWABLE.includes(item.kind)) {
      void download(item);
      return;
    }
    setViewer({
      name: item.name || item.title,
      mimeType: item.mimeType,
      meta: [item.courseTitle, item.size !== null ? formatFileSize(item.size) : ""].filter(Boolean).join(" · "),
      load: (signal) => materialApi.download(item.id, { signal }),
    });
  }

  function fileRows(items: Material[], showCourse: boolean) {
    return items.map((item) => {
      const look = KIND_LOOK[item.kind];
      return (
        <article key={item.id} className="flex items-center gap-3 rounded-2xl bg-surface p-3 pr-2 lg:p-4">
          <button type="button" className="flex min-w-0 flex-1 items-center gap-3 text-left" onClick={() => open(item)}>
            <span className={`grid size-11 shrink-0 place-items-center rounded-xl ${look.tone}`}>
              <Icon name={look.icon} size={22} />
            </span>
            <span className="flex min-w-0 flex-1 flex-col">
              <strong className="truncate text-title text-ink">{item.title}</strong>
              <small className="truncate text-body-xs text-ink-secondary">
                {[
                  showCourse ? item.courseTitle : "",
                  item.size !== null ? formatFileSize(item.size) : "",
                  shortDate(item.createdAt),
                  isStudent ? item.uploadedBy?.name : "",
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </small>
            </span>
          </button>
          <button
            type="button"
            className="grid size-10 shrink-0 place-items-center rounded-full text-ink-secondary transition-colors hover:bg-subtle hover:text-ink"
            aria-label={t("materials.download")}
            title={t("materials.download")}
            onClick={() => void download(item)}
          >
            <Icon name="download" size={20} />
          </button>
          {canManage ? (
            <button
              type="button"
              className="grid size-10 shrink-0 place-items-center rounded-full text-ink-secondary transition-colors hover:bg-danger-bg hover:text-error-text"
              aria-label={t("materials.delete")}
              title={t("materials.delete")}
              onClick={() => setDeleting(item)}
            >
              <Icon name="delete" size={20} />
            </button>
          ) : null}
        </article>
      );
    });
  }

  let body: ReactNode;
  if (level === "root" && query) {
    const items = searchResults.data ?? [];
    body = searchResults.isLoading ? (
      <RowsSkeleton />
    ) : items.length ? (
      <div className="flex flex-col gap-2">{fileRows(items, true)}</div>
    ) : (
      <MobileEmptyCard icon="search" title={t("materials.emptyFiltered")} description={t("materials.searchHint")} />
    );
  } else if (level === "root") {
    const items = folders.data ?? [];
    body = folders.isLoading ? (
      <RowsSkeleton />
    ) : items.length ? (
      <div className="grid gap-2 lg:grid-cols-2">
        {items.map((item) => (
          <FolderRow
            key={item.id}
            icon={<Icon name="folder" size={22} />}
            tone="bg-brand-subtle text-brand"
            title={item.title}
            meta={t("materials.filesCount", { count: item.fileCount })}
            badge={
              item.kind === "club" ? (
                <span className="inline-flex h-5 shrink-0 items-center rounded-full bg-accent-saffron-bg px-2 text-caption-strong text-accent-saffron-fg">
                  {t("materials.club")}
                </span>
              ) : null
            }
            onClick={() => go({ course: item.id })}
          />
        ))}
      </div>
    ) : (
      <MobileEmptyCard
        icon="folder"
        title={t("materials.noGroups")}
        description={canManage ? t("materials.emptyHintTeacher") : t("materials.emptyHintStudent")}
      />
    );
  } else if (level === "course") {
    const data = lessons.data;
    body = lessons.isLoading || !data ? (
      <RowsSkeleton />
    ) : (
      <div className="flex flex-col gap-2">
        <FolderRow
          icon={<Icon name="folder" size={22} />}
          tone="bg-brand-subtle text-brand"
          title={t("materials.general")}
          meta={t("materials.filesCount", { count: data.generalCount })}
          onClick={() => go({ course: courseId, lesson: GENERAL })}
        />
        {data.lessons.length ? (
          <p className="mt-3 px-1 text-label-strong text-ink-secondary">{t("materials.lessonsTitle")}</p>
        ) : null}
        {data.lessons.map((lesson) => {
          const date = dayMonth(lesson.startsAt);
          const meta = [
            t("materials.filesCount", { count: lesson.fileCount }),
            lesson.hasRecording ? t("materials.videoTag") : "",
            lesson.hasBoard ? t("materials.boardTag") : "",
          ]
            .filter(Boolean)
            .join(" · ");
          return (
            <FolderRow
              key={lesson.id}
              icon={
                <span className="flex flex-col items-center leading-none">
                  <strong className="font-numeric text-title-sm">{date.day}</strong>
                  <small className="text-caption">{date.month}</small>
                </span>
              }
              tone="bg-subtle text-ink"
              title={lesson.title}
              meta={meta}
              onClick={() => go({ course: courseId, lesson: lesson.id })}
            />
          );
        })}
        {!data.lessons.length && !data.generalCount ? (
          <MobileEmptyCard
            icon="folder"
            title={t("materials.emptyTitle")}
            description={canManage ? t("materials.emptyHintTeacher") : t("materials.emptyHintStudent")}
          />
        ) : null}
      </div>
    );
  } else if (lessonId === GENERAL) {
    const items = general.data ?? [];
    body = general.isLoading ? (
      <RowsSkeleton />
    ) : items.length ? (
      <div className="flex flex-col gap-2">{fileRows(items, false)}</div>
    ) : (
      <MobileEmptyCard
        icon="folder"
        title={t("materials.emptyTitle")}
        description={canManage ? t("materials.emptyHintTeacher") : t("materials.emptyHintStudent")}
      />
    );
  } else {
    const data = lessonFolder.data;
    const recording = data?.recordingStatus ?? null;
    body = lessonFolder.isLoading || !data ? (
      <RowsSkeleton />
    ) : (
      <div className="flex flex-col gap-2">
        {recording ? (
          <FolderRow
            icon={<Icon name="videocam" size={22} />}
            tone="bg-accent-violet-bg text-accent-violet-fg"
            title={t("materials.recording")}
            meta={recording === "converting" ? t("materials.recordingConverting") : t("materials.recordingOpen")}
            onClick={() => navigate(routes.recording(data.lesson.id))}
          />
        ) : null}
        {data.hasBoard ? (
          <FolderRow
            icon={<Icon name="board-pen" size={22} />}
            tone="bg-accent-green-bg text-accent-green-fg"
            title={t("materials.board")}
            meta={t("materials.boardHint")}
            onClick={() =>
              setViewer({
                name: `${data.lesson.title || t("materials.board")}.pdf`,
                mimeType: "application/pdf",
                meta: t("materials.board"),
                load: (signal) => materialApi.boardPdf(data.lesson.id, { signal }),
              })
            }
          />
        ) : null}
        {data.files.length ? fileRows(data.files, false) : null}
        {!recording && !data.hasBoard && !data.files.length ? (
          <MobileEmptyCard
            icon="folder"
            title={t("materials.emptyTitle")}
            description={canManage ? t("materials.emptyHintTeacher") : t("materials.emptyHintStudent")}
          />
        ) : null}
      </div>
    );
  }

  const searchBox =
    level === "root" ? (
      <label className="flex h-12 min-w-0 items-center gap-3 rounded-full border-[1.5px] border-transparent bg-surface px-4.5 transition-colors focus-within:border-focus">
        <Icon name="search" size={20} className="shrink-0 text-ink-secondary" />
        <input
          className="h-full min-w-0 flex-1 bg-transparent text-body text-ink outline-none placeholder:text-ink-secondary"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder={t("materials.searchPlaceholder")}
          aria-label={t("materials.searchPlaceholder")}
        />
      </label>
    ) : null;

  const breadcrumb =
    level === "root" ? null : (
      <nav className="flex min-w-0 flex-wrap items-center gap-1 text-body-sm text-ink-secondary" aria-label={t("materials.breadcrumb")}>
        <button type="button" className="hover:text-brand" onClick={() => go({})}>
          {t("materials.title")}
        </button>
        <Icon name="chevron-right" size={16} className="shrink-0" />
        {level === "lesson" ? (
          <>
            <button type="button" className="truncate hover:text-brand" onClick={() => go({ course: courseId })}>
              {courseTitle}
            </button>
            <Icon name="chevron-right" size={16} className="shrink-0" />
            <span className="truncate text-ink">{lessonTitle}</span>
          </>
        ) : (
          <span className="truncate text-ink">{courseTitle}</span>
        )}
      </nav>
    );

  const dialogs = (
    <>
      {canManage ? (
        <UploadMaterialDialog
          open={uploadOpen}
          onOpenChange={setUploadOpen}
          defaultCourse={courseId ?? ""}
          defaultLesson={lessonId ?? GENERAL}
        />
      ) : null}
      <FileViewer
        open={Boolean(viewer)}
        onOpenChange={(next) => !next && setViewer(null)}
        name={viewer?.name ?? ""}
        mimeType={viewer?.mimeType}
        meta={viewer?.meta ?? ""}
        load={(signal) => (viewer ? viewer.load(signal) : Promise.reject(new Error("no file")))}
      />
      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(next) => !next && setDeleting(null)}
        icon="delete"
        tone="danger"
        title={t("materials.deleteTitle")}
        description={deleting?.title ?? ""}
        confirmLabel={t("materials.delete")}
        cancelLabel={t("materials.cancel")}
        pending={remove.isPending}
        onConfirm={() => {
          if (!deleting) return;
          remove.mutate(deleting.id, {
            onSuccess: () => toast.success(t("materials.deleted")),
            onError: (error) => toast.error(error.message),
          });
          setDeleting(null);
        }}
      />
    </>
  );

  if (isCompact)
    return (
      <main className="flex h-full flex-col gap-4 overflow-y-auto bg-canvas bg-auth-gradient px-4 pt-5 pb-32 font-body text-ink [&>*]:shrink-0">
        <MobilePageHeader
          title={title}
          backLabel={t("searchBack")}
          onBack={back}
          action={
            canManage ? (
              <button
                type="button"
                className="grid size-11 shrink-0 place-items-center rounded-full bg-brand text-on-action"
                aria-label={t("materials.upload")}
                onClick={() => setUploadOpen(true)}
              >
                <Icon name="add" size={22} />
              </button>
            ) : undefined
          }
        />
        {breadcrumb}
        {searchBox}
        {body}
        {dialogs}
      </main>
    );

  return (
    <WorkspaceShell
      eyebrow={level === "root" ? t("materials.rootEyebrow") : t("materials.title")}
      title={title}
      action={
        canManage ? (
          <button type="button" className={workspaceAction} onClick={() => setUploadOpen(true)}>
            <Icon name="add" size={18} />
            {t("materials.upload")}
          </button>
        ) : null
      }
    >
      {breadcrumb}
      {searchBox}
      {body}
      {dialogs}
    </WorkspaceShell>
  );
}

function UploadMaterialDialog({
  open,
  onOpenChange,
  defaultCourse,
  defaultLesson,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultCourse: string;
  defaultLesson: string;
}) {
  const { t } = useTranslation("workspace");
  const isCompact = useIsCompact();
  const upload = useUploadMaterial();
  const folders = useMaterialCourses(open);
  const inputRef = useRef<HTMLInputElement>(null);
  const [course, setCourse] = useState(defaultCourse);
  const [lesson, setLesson] = useState(defaultLesson);
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [syncedOpen, setSyncedOpen] = useState(open);
  if (syncedOpen !== open) {
    setSyncedOpen(open);
    if (open) {
      setCourse(defaultCourse);
      setLesson(defaultLesson);
      setFile(null);
      setTitle("");
    }
  }
  const courseOptions = (folders.data ?? []).map((item) => ({ value: item.id, label: item.title }));
  const activeCourse = course || courseOptions[0]?.value || "";
  const lessons = useMaterialLessons(open ? activeCourse || null : null);
  const lessonOptions = [
    { value: GENERAL, label: t("materials.general") },
    ...(lessons.data?.lessons ?? []).map((item) => ({ value: item.id, label: `${shortDate(item.startsAt)} · ${item.title}` })),
  ];

  function pick(next: File | undefined) {
    if (!next) return;
    if (next.size > MAX_SIZE) {
      toast.error(t("materials.tooLarge"));
      return;
    }
    setFile(next);
    if (!title.trim()) setTitle(next.name.replace(/\.[^.]+$/, ""));
  }

  function submit() {
    if (!file || !activeCourse) return;
    upload.mutate(
      { course: activeCourse, lesson: lesson === GENERAL ? null : lesson, file, title },
      {
        onSuccess: () => {
          toast.success(t("materials.uploaded"));
          onOpenChange(false);
        },
        onError: (error) => toast.error(error.message),
      }
    );
  }

  return (
    <AppDialog
      open={open}
      onOpenChange={onOpenChange}
      variant={isCompact ? "adaptive" : "confirm"}
      width="lg:w-130"
      title={t("materials.uploadTitle")}
      description={t("materials.uploadHint")}
      footer={
        <>
          <button type="button" className={dialogButton.secondary} onClick={() => onOpenChange(false)}>
            {t("materials.cancel")}
          </button>
          <button
            type="button"
            className={dialogButton.primary}
            disabled={!file || !activeCourse || upload.isPending}
            onClick={submit}
          >
            {upload.isPending ? t("materials.uploading") : t("materials.upload")}
          </button>
        </>
      }
    >
      <div className="lesson-form flex flex-col gap-4">
        <SelectPicker
          label={t("materials.group")}
          searchable
          value={activeCourse}
          onChange={(value) => {
            setCourse(value);
            setLesson(GENERAL);
          }}
          options={courseOptions}
        />
        <SelectPicker label={t("materials.folder")} searchable value={lesson} onChange={setLesson} options={lessonOptions} />
        <button
          type="button"
          className="flex min-h-24 flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-line-strong bg-subtle px-4 py-4 text-center transition-colors hover:border-brand"
          onClick={() => inputRef.current?.click()}
        >
          <Icon name={file ? "check-circle" : "upload"} size={24} className={file ? "text-success-fg" : "text-brand"} />
          <strong className="max-w-full truncate text-label-strong text-ink">{file ? file.name : t("materials.pickFile")}</strong>
          <small className="text-caption text-ink-tertiary">{file ? formatFileSize(file.size) : t("materials.fileHint")}</small>
        </button>
        <input
          ref={inputRef}
          type="file"
          hidden
          accept={ACCEPT}
          onChange={(event) => {
            pick(event.target.files?.[0]);
            event.target.value = "";
          }}
        />
        <label className="flex flex-col gap-2">
          <span className="text-body-xs text-ink-secondary">{t("materials.name")}</span>
          <input
            className="h-12.5 w-full rounded-md border border-transparent bg-subtle px-4 text-body text-ink outline-none placeholder:text-ink-tertiary focus:border-focus focus:bg-surface"
            value={title}
            maxLength={200}
            placeholder={t("materials.namePlaceholder")}
            onChange={(event) => setTitle(event.target.value)}
          />
        </label>
      </div>
    </AppDialog>
  );
}
