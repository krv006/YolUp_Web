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

  const [wasOpen, setWasOpen] = useState(open);
  if (wasOpen !== open) {
    setWasOpen(open);
    if (!open) {
      setTerm("");
      setDebounced("");
      setSelected([]);
    }
  }

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

  const empty = !tooShort && !results.isLoading && !results.isError && !items.length;

  return (
    <>
      <AppDialog
        open={open && !createOpen}
        onOpenChange={onOpenChange}
        variant="adaptive"
        icon={
          <span className="hidden size-11 place-items-center rounded-md bg-brand-subtle text-brand lg:grid">
            <Icon name="person-add" size={22} />
          </span>
        }
        title={t("addStudent.title")}
        description={t("addStudent.description")}
        footer={
          empty ? null : (
            <>
              <span className="min-w-0 flex-1 max-lg:hidden" />
              <button
                type="button"
                className="flex h-12 shrink-0 items-center justify-center rounded-full border border-line bg-surface px-5 text-button text-ink transition-colors hover:bg-subtle max-lg:h-13 max-lg:flex-1 max-lg:border-line-strong"
                onClick={() => onOpenChange(false)}
              >
                {t("addStudent.cancel")}
              </button>
              <button
                type="button"
                className="flex h-12 shrink-0 items-center justify-center rounded-full bg-brand px-5 text-button text-ink-inverse transition-colors hover:bg-brand-strong disabled:opacity-40 max-lg:h-13 max-lg:flex-1"
                disabled={!selected.length || enroll.isPending}
                onClick={addSelected}
              >
                {t("addStudent.submit", { count: selected.length })}
              </button>
            </>
          )
        }
      >
        <label className="flex h-12.5 items-center gap-3 rounded-md border border-transparent bg-subtle px-4 focus-within:border-focus focus-within:bg-surface">
          <Icon name="search" size={18} className="shrink-0 text-icon-tertiary" />
          <input
            autoFocus
            className="h-full min-w-0 flex-1 bg-transparent text-body text-ink outline-none placeholder:text-ink-tertiary"
            value={term}
            onChange={(event) => setTerm(event.target.value)}
            placeholder={t("addStudent.searchPlaceholder")}
            aria-label={t("addStudent.searchPlaceholder")}
          />
          {term ? (
            <button
              type="button"
              className="grid size-7 shrink-0 place-items-center rounded-full text-icon-tertiary transition-colors hover:bg-muted hover:text-ink"
              onClick={() => setTerm("")}
              aria-label={t("addStudent.cancel")}
            >
              <Icon name="close" size={16} />
            </button>
          ) : null}
        </label>

        {tooShort ? (
          <p className="px-1 text-body-sm text-ink-tertiary">{t("addStudent.searchHint")}</p>
        ) : results.isLoading ? (
          <div className="flex flex-col gap-2">
            {Array.from({ length: 3 }, (_, index) => (
              <div key={index} className="h-14 animate-pulse rounded-md bg-muted" />
            ))}
          </div>
        ) : results.isError ? (
          <p className="px-1 text-body-sm text-danger">{results.error.message}</p>
        ) : items.length ? (
          <ul className="flex flex-col gap-1">
            {items.map((student) => {
              const member = Boolean(student.enrollStatus) && student.enrollStatus !== "declined";
              const checked = selected.includes(student.id);
              return (
                <li key={student.id}>
                  <button
                    type="button"
                    className={`flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left transition-colors disabled:opacity-60 ${
                      checked ? "bg-brand-subtle" : "hover:bg-subtle"
                    }`}
                    disabled={member}
                    onClick={() => toggle(student.id)}
                  >
                    <Avatar name={student.name} tone={student.avatarTone} size="sm" />
                    <span className="flex min-w-0 flex-1 flex-col">
                      <strong className="truncate text-title-sm text-ink">{student.name}</strong>
                      <small className="truncate text-body-xs text-ink-tertiary">
                        {member ? t("addStudent.alreadyMember") : `@${student.username}`}
                      </small>
                    </span>
                    <span
                      className={`grid size-5.5 shrink-0 place-items-center rounded-xs ${
                        checked
                          ? "bg-brand text-ink-inverse"
                          : "border-2 border-line-strong bg-surface"
                      }`}
                    >
                      {checked ? <Icon name="check" size={14} /> : null}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="flex flex-col items-center gap-3 py-2 text-center">
            <span className="grid size-18 place-items-center rounded-full bg-brand-subtle text-brand">
              <Icon name="person" size={30} />
            </span>
            <p className="text-body-sm text-ink-secondary">{t("addStudent.notFound")}</p>
          </div>
        )}

        <div className={empty ? "flex flex-col gap-3" : "grid grid-cols-2 gap-3"}>
          <button
            type="button"
            className={
              empty
                ? "flex h-12 w-full items-center justify-center gap-2 rounded-full bg-brand text-button text-ink-inverse transition-colors hover:bg-brand-strong"
                : "flex h-12 w-full items-center justify-center gap-2 rounded-full bg-brand-subtle text-button text-brand transition-colors hover:bg-tint"
            }
            onClick={() => setCreateOpen(true)}
          >
            <Icon name="person-add" size={18} />
            {empty ? t("addStudent.createAccount") : t("addStudent.createAccountShort")}
          </button>

          <button
            type="button"
            className="flex h-12 w-full items-center justify-center gap-2 rounded-full border border-line bg-surface text-button text-ink transition-colors hover:bg-subtle"
            onClick={() => setInviteOpen(true)}
          >
            <Icon name="send" size={18} />
            {empty ? t("addStudent.shareInvite") : t("addStudent.inviteShort")}
          </button>
        </div>
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

  const [wasOpen, setWasOpen] = useState(open);
  if (wasOpen !== open) {
    setWasOpen(open);
    if (!open) {
      setFirstName("");
      setLastName("");
      setLogin("");
      setLoginEdited(false);
      setPhone("");
      setPassword(randomPassword());
    }
  }

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
      variant="adaptive"
      title={t("addStudent.createTitle")}
      description={t("addStudent.createDescription")}
      footer={
        <button
          type="submit"
          form="create-student-form"
          className={dialogButton.primary}
          disabled={!filled || createStudent.isPending}
        >
          {t("addStudent.createSubmit")}
        </button>
      }
    >
      <form id="create-student-form" className="flex flex-col gap-4" onSubmit={submit}>
        <div className="grid grid-cols-2 items-start gap-3">
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
          <span className="flex h-12.5 items-center gap-2 rounded-md bg-subtle pr-1.5 pl-4">
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
              className="grid size-9 shrink-0 place-items-center rounded-full bg-surface text-ink-secondary transition-colors hover:text-ink"
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
          <span className="flex h-12.5 items-center gap-2 rounded-md bg-subtle pr-4 pl-4">
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
              className="shrink-0 text-button text-brand transition-colors hover:text-brand-strong"
              onClick={() => {
                void navigator.clipboard.writeText(password);
                toast.success(t("addStudent.passwordCopied"));
              }}
            >
              {t("addStudent.copy")}
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

        <p className="flex items-start gap-2.5 rounded-md bg-brand-subtle px-4 py-3.5 text-body-xs text-brand-strong">
          <Icon name="bolt" size={16} className="mt-0.5 shrink-0" />
          {t("addStudent.createNote")}
        </p>

        {createStudent.isError ? (
          <p className="rounded-md bg-danger-bg px-4 py-3 text-body-sm text-danger">
            {createStudent.error.message}
          </p>
        ) : null}
      </form>
    </AppDialog>
  );
}
