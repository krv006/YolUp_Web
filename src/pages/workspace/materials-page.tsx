import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useIsStudent, useRoleRoutes } from "@/modules/auth";
import { useCourses } from "@/modules/course";
import { materialApi, useDeleteMaterial, useMaterials, useUploadMaterial } from "@/modules/material";
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
import { FilterChips } from "@/pages/student/workspace/filter-chips";

type KindFilter = "all" | MaterialKind;

const KINDS: KindFilter[] = ["all", "pdf", "doc", "video", "audio", "image", "other"];
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

function shortDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return `${String(date.getDate()).padStart(2, "0")}.${String(date.getMonth() + 1).padStart(2, "0")}.${date.getFullYear()}`;
}

export function MaterialsPage() {
  const { t } = useTranslation("workspace");
  const navigate = useNavigate();
  const routes = useRoleRoutes();
  const isStudent = useIsStudent();
  const isCompact = useIsCompact();
  const courses = useCourses();
  const [course, setCourse] = useState("all");
  const [kind, setKind] = useState<KindFilter>("all");
  const [search, setSearch] = useState("");
  const materials = useMaterials({ course: course === "all" ? null : course, kind: kind === "all" ? null : kind, search });
  const remove = useDeleteMaterial();
  const [uploadOpen, setUploadOpen] = useState(false);
  const [viewing, setViewing] = useState<Material | null>(null);
  const [deleting, setDeleting] = useState<Material | null>(null);
  const canManage = !isStudent;
  const items = materials.data ?? [];

  const courseOptions = [
    { value: "all", label: t("materials.allGroups") },
    ...(courses.data ?? []).map((item) => ({ value: item.id, label: item.title })),
  ];
  const chips = KINDS.map((item) => ({ id: item, label: t(`materials.kinds.${item}`) }));

  async function download(item: Material) {
    try {
      downloadBlob(await materialApi.download(item.id), item.name || item.title);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("materials.downloadFailed"));
    }
  }

  function open(item: Material) {
    if (PREVIEWABLE.includes(item.kind)) setViewing(item);
    else void download(item);
  }

  const toolbar = (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
      <label className="flex h-12 min-w-0 items-center gap-3 lg:flex-1 rounded-full border-[1.5px] border-transparent bg-surface px-4.5 transition-colors focus-within:border-focus">
        <Icon name="search" size={20} className="shrink-0 text-ink-secondary" />
        <input
          className="h-full min-w-0 flex-1 bg-transparent text-body text-ink outline-none placeholder:text-ink-secondary"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder={t("materials.searchPlaceholder")}
          aria-label={t("materials.searchPlaceholder")}
        />
      </label>
      {courseOptions.length > 2 ? (
        <div className="lg:w-64">
          <SelectPicker hideLabel label={t("materials.group")} value={course} onChange={setCourse} options={courseOptions} />
        </div>
      ) : null}
    </div>
  );

  const list = materials.isLoading ? (
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
  ) : items.length ? (
    <div className="flex flex-col gap-2">
      {items.map((item) => {
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
                    item.courseTitle,
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
      })}
    </div>
  ) : (
    <MobileEmptyCard
      icon="folder"
      title={search || kind !== "all" || course !== "all" ? t("materials.emptyFiltered") : t("materials.emptyTitle")}
      description={canManage ? t("materials.emptyHintTeacher") : t("materials.emptyHintStudent")}
    />
  );

  const dialogs = (
    <>
      {canManage ? (
        <UploadMaterialDialog
          open={uploadOpen}
          onOpenChange={setUploadOpen}
          courses={(courses.data ?? []).map((item) => ({ value: item.id, label: item.title }))}
          defaultCourse={course === "all" ? "" : course}
        />
      ) : null}
      <FileViewer
        open={Boolean(viewing)}
        onOpenChange={(next) => !next && setViewing(null)}
        name={viewing?.name || viewing?.title || ""}
        mimeType={viewing?.mimeType}
        meta={viewing ? [viewing.courseTitle, viewing.size !== null ? formatFileSize(viewing.size) : ""].filter(Boolean).join(" · ") : ""}
        load={(signal) => materialApi.download(viewing?.id ?? "", { signal })}
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

  const uploadButton = canManage ? (
    <button type="button" className={workspaceAction} onClick={() => setUploadOpen(true)}>
      <Icon name="add" size={18} />
      {t("materials.upload")}
    </button>
  ) : null;

  if (isCompact)
    return (
      <main className="flex h-full flex-col gap-4 overflow-y-auto bg-canvas bg-auth-gradient px-4 pt-5 pb-32 font-body text-ink [&>*]:shrink-0">
        <MobilePageHeader
          title={t("materials.title")}
          backLabel={t("searchBack")}
          onBack={() => navigate(routes.workspace)}
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
        {toolbar}
        <FilterChips compact items={chips} value={kind} onChange={setKind} />
        {list}
        {dialogs}
      </main>
    );

  return (
    <WorkspaceShell eyebrow={t("materials.eyebrow", { count: items.length })} title={t("materials.title")} action={uploadButton}>
      {toolbar}
      <FilterChips items={chips} value={kind} onChange={setKind} />
      {list}
      {dialogs}
    </WorkspaceShell>
  );
}

function UploadMaterialDialog({
  open,
  onOpenChange,
  courses,
  defaultCourse,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courses: Array<{ value: string; label: string }>;
  defaultCourse: string;
}) {
  const { t } = useTranslation("workspace");
  const isCompact = useIsCompact();
  const upload = useUploadMaterial();
  const inputRef = useRef<HTMLInputElement>(null);
  const [course, setCourse] = useState(defaultCourse || courses[0]?.value || "");
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [syncedOpen, setSyncedOpen] = useState(open);
  if (syncedOpen !== open) {
    setSyncedOpen(open);
    if (open) {
      setCourse(defaultCourse || courses[0]?.value || "");
      setFile(null);
      setTitle("");
    }
  }

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
    if (!file || !course) return;
    upload.mutate(
      { course, file, title },
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
            disabled={!file || !course || upload.isPending}
            onClick={submit}
          >
            {upload.isPending ? t("materials.uploading") : t("materials.upload")}
          </button>
        </>
      }
    >
      <div className="lesson-form flex flex-col gap-4">
        <SelectPicker label={t("materials.group")} searchable value={course} onChange={setCourse} options={courses} />
        <button
          type="button"
          className="flex min-h-24 flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-line-strong bg-subtle px-4 py-4 text-center transition-colors hover:border-brand"
          onClick={() => inputRef.current?.click()}
        >
          <Icon name={file ? "check-circle" : "upload"} size={24} className={file ? "text-success-fg" : "text-brand"} />
          <strong className="max-w-full truncate text-label-strong text-ink">{file ? file.name : t("materials.pickFile")}</strong>
          <small className="text-caption text-ink-tertiary">
            {file ? formatFileSize(file.size) : t("materials.fileHint")}
          </small>
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
