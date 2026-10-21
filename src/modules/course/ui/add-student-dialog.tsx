import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Avatar } from "@/shared/ui/legacy";
import { AppDialog, dialogButton } from "@/shared/ui/app-dialog";
import { Icon } from "@/shared/ui/icon";
import type { CreateChildRequestDto } from "@/modules/auth";
import {
  useCreateCourseStudent,
  useEnrollStudent,
  useSearchCourseStudents,
} from "../model/course.queries";
import { InviteLinkDialog } from "./invite-link-dialog";

export type StudentDialogTab = "search" | "create";

export interface AddStudentDialogProps {
  courseId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialTab?: StudentDialogTab;
}

const LATIN: Record<string, string> = {
  а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "yo", ж: "j", з: "z", и: "i",
  й: "y", к: "k", л: "l", м: "m", н: "n", о: "o", п: "p", р: "r", с: "s", т: "t",
  у: "u", ф: "f", х: "h", ц: "s", ч: "ch", ш: "sh", щ: "sh", ъ: "", ы: "i", ь: "",
  э: "e", ю: "yu", я: "ya", ʻ: "", "'": "", "’": "",
};

function slug(value: string): string {
  return value
    .toLowerCase()
    .split("")
    .map((char) => LATIN[char] ?? char)
    .join("")
    .replace(/[^a-z0-9]+/g, "")
    .slice(0, 16);
}

function buildLogin(first: string, last: string): string {
  const parts = [slug(first), slug(last)].filter(Boolean);
  if (!parts.length) return "";
  return parts.join(".");
}

function randomPassword(): string {
  const letters = "abcdefghijkmnpqrstuvwxyz";
  const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const digits = "23456789";
  const pick = (source: string, count: number) =>
    Array.from({ length: count }, () => source[Math.floor(Math.random() * source.length)]).join("");
  return `${pick(upper, 1)}${pick(digits, 1)}${pick(letters, 1)}-${pick(digits, 2)}${pick(letters, 1)}${pick(upper, 1)}`;
}

export function AddStudentDialog({
  courseId,
  open,
  onOpenChange,
  initialTab = "search",
}: AddStudentDialogProps) {
  const { t } = useTranslation("group");
  const [term, setTerm] = useState("");
  const [debounced, setDebounced] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [createOpen, setCreateOpen] = useState(initialTab === "create");
  const [inviteOpen, setInviteOpen] = useState(false);
  const results = useSearchCourseStudents(courseId, debounced);
  const enroll = useEnrollStudent();

  useEffect(() => {
    const id = globalThis.setTimeout(() => setDebounced(term), 350);
    return () => globalThis.clearTimeout(id);
  }, [term]);

  useEffect(() => {
    if (!open) {
      setTerm("");
      setDebounced("");
      setSelected([]);
    }
  }, [open]);

  const items = results.data ?? [];
  const tooShort = debounced.trim().length < 2;

  function toggle(studentId: string) {
    setSelected((current) =>
      current.includes(studentId)
        ? current.filter((id) => id !== studentId)
        : [...current, studentId]
    );
  }

  async function addSelected() {
    if (!courseId || !selected.length) return;
    await Promise.allSettled(
      selected.map((studentId) => enroll.mutateAsync({ courseId, studentId }))
    );
    toast.success(t("addStudent.added", { count: selected.length }));
    setSelected([]);
    onOpenChange(false);
  }

  return (
    <>
      <AppDialog
        open={open && !createOpen}
        onOpenChange={onOpenChange}
        title={t("addStudent.title")}
        description={t("addStudent.description")}
        footer={
          <>
            <button
              type="button"
              className={dialogButton.secondary}
              onClick={() => onOpenChange(false)}
            >
              {t("addStudent.cancel")}
            </button>
            <button
              type="button"
              className={dialogButton.primary}
              disabled={!selected.length || enroll.isPending}
              onClick={addSelected}
            >
              {t("addStudent.submit", { count: selected.length })}
            </button>
          </>
        }
      >
        <label className="flex h-13 items-center gap-3 rounded-xl bg-subtle px-4">
          <Icon name="search" size={18} className="shrink-0 text-ink-tertiary" />
          <input
            autoFocus
            className="h-full min-w-0 flex-1 bg-transparent text-body text-ink outline-none placeholder:text-ink-tertiary"
            value={term}
            onChange={(event) => setTerm(event.target.value)}
            placeholder={t("addStudent.searchPlaceholder")}
            aria-label={t("addStudent.searchPlaceholder")}
          />
        </label>

        {tooShort ? (
          <p className="px-1 text-body-sm text-ink-tertiary">{t("addStudent.searchHint")}</p>
        ) : results.isLoading ? (
          <div className="flex flex-col gap-2">
            {Array.from({ length: 3 }, (_, index) => (
              <div key={index} className="h-16 animate-pulse rounded-xl bg-muted" />
            ))}
          </div>
        ) : results.isError ? (
          <p className="px-1 text-body-sm text-error-text">{results.error.message}</p>
        ) : items.length ? (
          <ul className="flex flex-col divide-y divide-line overflow-hidden rounded-xl border border-line">
            {items.map((student) => {
              const member = Boolean(student.enrollStatus) && student.enrollStatus !== "declined";
              const checked = selected.includes(student.id);
              return (
                <li key={student.id}>
                  <button
                    type="button"
                    className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-subtle disabled:opacity-60 disabled:hover:bg-transparent"
                    disabled={member}
                    onClick={() => toggle(student.id)}
                  >
                    <Avatar name={student.name} tone={student.avatarTone} size="sm" />
                    <span className="flex min-w-0 flex-1 flex-col">
                      <strong className="truncate text-label-strong text-ink">
                        {student.name}
                      </strong>
                      <small className="truncate text-caption text-ink-tertiary">
                        {member ? t("addStudent.alreadyMember") : `@${student.username}`}
                      </small>
                    </span>
                    {member ? (
                      <Icon name="groups" size={20} className="shrink-0 text-ink-tertiary" />
                    ) : checked ? (
                      <Icon name="check-circle" size={22} className="shrink-0 text-action" />
                    ) : (
                      <span className="size-5 shrink-0 rounded-full border border-line" />
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="px-1 text-body-sm text-ink-tertiary">{t("addStudent.notFound")}</p>
        )}

        <button
          type="button"
          className="flex items-center gap-2 px-1 text-label-strong text-action"
          onClick={() => setCreateOpen(true)}
        >
          <Icon name="add" size={18} /> {t("addStudent.createAccount")}
        </button>

        <button
          type="button"
          className="flex items-center gap-2 px-1 text-label-strong text-action"
          onClick={() => setInviteOpen(true)}
        >
          <Icon name="assign" size={18} /> {t("addStudent.shareInvite")}
        </button>
      </AppDialog>

      <InviteLinkDialog courseId={courseId} open={inviteOpen} onOpenChange={setInviteOpen} />

      <CreateStudentDialog
        courseId={courseId}
        open={open && createOpen}
        onOpenChange={(next) => {
          setCreateOpen(next);
          if (!next && initialTab === "create") onOpenChange(false);
        }}
      />
    </>
  );
}

function CreateStudentDialog({
  courseId,
  open,
  onOpenChange,
}: {
  courseId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { t } = useTranslation("group");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [loginEdited, setLoginEdited] = useState(false);
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState(() => randomPassword());
  const [phone, setPhone] = useState("");
  const createStudent = useCreateCourseStudent();

  const suggested = useMemo(() => buildLogin(firstName, lastName), [firstName, lastName]);
  const username = loginEdited ? login : suggested;

  useEffect(() => {
    if (!open) {
      setFirstName("");
      setLastName("");
      setLogin("");
      setLoginEdited(false);
      setPhone("");
      setPassword(randomPassword());
    }
  }, [open]);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!courseId) return;
    const payload: CreateChildRequestDto = {
      username: username.trim(),
      password,
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      ...(phone.trim() ? { parent_phone: phone.trim() } : {}),
      course_id: courseId,
    };
    createStudent.mutate(
      { courseId, form: payload },
      { onSuccess: () => onOpenChange(false) }
    );
  }

  const filled = Boolean(firstName.trim() && lastName.trim() && username.trim() && courseId);

  return (
    <AppDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t("addStudent.createTitle")}
      description={t("addStudent.createDescription")}
      footer={
        <>
          <button
            type="button"
            className={dialogButton.secondary}
            onClick={() => onOpenChange(false)}
          >
            {t("addStudent.cancel")}
          </button>
          <button
            type="submit"
            form="create-student-form"
            className={dialogButton.primary}
            disabled={!filled || createStudent.isPending}
          >
            {t("addStudent.createSubmit")}
          </button>
        </>
      }
    >
      <form id="create-student-form" className="flex flex-col gap-4" onSubmit={submit}>
        <div className="grid grid-cols-2 gap-3">
          <label className="field-group">
            <span>{t("addStudent.firstName")}</span>
            <input value={firstName} onChange={(event) => setFirstName(event.target.value)} required />
          </label>
          <label className="field-group">
            <span>{t("addStudent.lastName")}</span>
            <input value={lastName} onChange={(event) => setLastName(event.target.value)} required />
          </label>
        </div>

        <label className="field-group">
          <span>{t("addStudent.login")}</span>
          <span className="flex h-13 items-center gap-2 rounded-xl bg-subtle px-4">
            <input
              className="h-full min-w-0 flex-1 bg-transparent text-body text-ink outline-none"
              value={username}
              onChange={(event) => {
                setLoginEdited(true);
                setLogin(event.target.value);
              }}
              autoComplete="off"
              required
            />
            <button
              type="button"
              className="grid size-8 shrink-0 place-items-center rounded-full text-ink-tertiary hover:text-ink"
              onClick={() => {
                setLoginEdited(false);
                setLogin("");
              }}
              aria-label={t("addStudent.regenerate")}
            >
              <Icon name="refresh" size={18} />
            </button>
          </span>
        </label>

        <label className="field-group">
          <span>{t("addStudent.password")}</span>
          <span className="flex h-13 items-center gap-2 rounded-xl bg-subtle px-4">
            <input
              className="h-full min-w-0 flex-1 bg-transparent font-numeric text-body text-ink outline-none"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="off"
              minLength={8}
              required
            />
            <button
              type="button"
              className="grid size-8 shrink-0 place-items-center rounded-full text-ink-tertiary hover:text-ink"
              onClick={() => {
                void navigator.clipboard.writeText(password);
                toast.success(t("addStudent.passwordCopied"));
              }}
              aria-label={t("addStudent.copyPassword")}
            >
              <Icon name="assign" size={18} />
            </button>
          </span>
        </label>

        <label className="field-group">
          <span>{t("addStudent.parentPhone")}</span>
          <input
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            placeholder="+998 90 123 45 67"
            inputMode="tel"
          />
        </label>

        <p className="flex items-start gap-2 rounded-xl bg-action-subtle px-4 py-3 text-body-sm text-action">
          <Icon name="error" size={18} className="mt-0.5 shrink-0" />
          {t("addStudent.createNote")}
        </p>

        {createStudent.isError ? (
          <p className="rounded-xl bg-error-bg px-4 py-3 text-body-sm text-error-text">
            {createStudent.error.message}
          </p>
        ) : null}
      </form>
    </AppDialog>
  );
}
