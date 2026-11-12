import { useRef, useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth, useRemoveAvatarMutation, useUpdateAvatarMutation, useUpdateProfileMutation } from "@/modules/auth";
import { useSelectedChild } from "@/modules/parent";
import { AppError } from "@/shared/api";
import { ROUTES } from "@/shared/config";
import { Icon } from "@/shared/ui/icon";
import { Avatar } from "@/shared/ui/legacy";
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/ui/popover";

const INPUT =
  "h-13 w-full rounded-2xl border border-transparent bg-subtle px-4 text-body text-ink outline-none placeholder:text-ink-tertiary focus:border-focus focus:bg-surface";
const INPUT_ERROR = "border-line-danger bg-error-bg pr-12 focus:border-line-danger";
const PHONE = /^\+998\s?\d{2}\s?\d{3}\s?\d{2}\s?\d{2}$/;

type Field = "firstName" | "lastName" | "username" | "phone";
type PhotoAction = "upload" | "camera" | "remove";

const PHOTO_ACTIONS: Array<{ key: PhotoAction; icon: string }> = [
  { key: "upload", icon: "upload" },
  { key: "camera", icon: "photo-camera-fill" },
  { key: "remove", icon: "delete-fill" },
];

function fieldError(error: unknown, key: string): string {
  const value = error instanceof AppError ? error.fields?.[key] : undefined;
  return Array.isArray(value) ? value.join(" ") : value ? String(value) : "";
}

export function SettingsProfile({ startEditing = false }: { startEditing?: boolean }) {
  const { t } = useTranslation("parent");
  const navigate = useNavigate();
  const { user } = useAuth();
  const { children } = useSelectedChild();
  const update = useUpdateProfileMutation();
  const uploadAvatar = useUpdateAvatarMutation();
  const removeAvatar = useRemoveAvatarMutation();
  const fileRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const [editing, setEditing] = useState(startEditing);
  const [photoOpen, setPhotoOpen] = useState(false);
  const [draft, setDraft] = useState<Record<Field, string>>(() => ({
    firstName: user?.firstName ?? "",
    lastName: user?.lastName ?? "",
    username: user?.username ?? "",
    phone: user?.phone ?? "",
  }));
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});

  if (!user) return null;
  const subtitle = [user.username ? `@${user.username}` : "", t("shell.role"), t("settings.profile.children", { count: children.length })]
    .filter(Boolean)
    .join(" · ");

  function startEdit() {
    setDraft({
      firstName: user?.firstName ?? "",
      lastName: user?.lastName ?? "",
      username: user?.username ?? "",
      phone: user?.phone ?? "",
    });
    setErrors({});
    setEditing(true);
  }

  function stopEditing() {
    setEditing(false);
    if (startEditing) navigate(ROUTES.parent.settings("profile"), { replace: true });
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const local: Partial<Record<Field, string>> = {};
    if (!draft.firstName.trim()) local.firstName = t("settings.profile.required");
    if (!draft.username.trim()) local.username = t("settings.profile.required");
    if (draft.phone.trim() && !PHONE.test(draft.phone.trim())) local.phone = t("settings.profile.phoneInvalid");
    setErrors(local);
    if (Object.keys(local).length) return;
    update.mutate(
      { firstName: draft.firstName, lastName: draft.lastName, username: draft.username, phone: draft.phone },
      {
        onSuccess: () => {
          stopEditing();
          toast.success(t("settings.profile.saved"));
        },
        onError: (error) => {
          const server: Partial<Record<Field, string>> = {
            firstName: fieldError(error, "first_name"),
            lastName: fieldError(error, "last_name"),
            username: fieldError(error, "username"),
            phone: fieldError(error, "phone"),
          };
          const next = Object.fromEntries(Object.entries(server).filter(([, value]) => value)) as Partial<Record<Field, string>>;
          setErrors(next);
          if (!Object.keys(next).length) toast.error(error.message);
        },
      }
    );
  }

  function photoAction(key: PhotoAction) {
    if (key === "upload") fileRef.current?.click();
    if (key === "camera") cameraRef.current?.click();
    if (key === "remove") removeAvatar.mutate(undefined, { onSuccess: () => toast.success(t("settings.profile.photoRemoved")) });
  }

  function pickFile(file: File | undefined) {
    if (!file) return;
    uploadAvatar.mutate(file, {
      onSuccess: () => toast.success(t("settings.profile.photoSaved")),
      onError: (error: Error) => toast.error(error.message),
    });
  }

  const errorCount = Object.values(errors).filter(Boolean).length;
  const fields: Array<{ key: Field; icon: string; label: string; value: string; hint?: string; type?: string }> = [
    { key: "firstName", icon: "person", label: t("settings.profile.firstName"), value: user.firstName ?? "" },
    { key: "lastName", icon: "person", label: t("settings.profile.lastName"), value: user.lastName ?? "" },
    { key: "username", icon: "alternate-email", label: t("settings.profile.username"), value: user.username ? `@${user.username}` : "", hint: t("settings.profile.usernameHint") },
    { key: "phone", icon: "call", label: t("settings.profile.phone"), value: user.phone ?? "", type: "tel" },
  ];

  return (
    <form className="flex min-h-[560px] flex-col gap-6 rounded-[24px] bg-surface p-7" onSubmit={submit} noValidate>
      <div className="flex items-center gap-5 border-b border-line pb-6">
        <span className="relative shrink-0">
          <Avatar name={user.name} src={user.avatarUrl ?? undefined} size="xl" className="[&_.avatar]:size-24" />
          <Popover open={photoOpen} onOpenChange={setPhotoOpen}>
            <PopoverTrigger asChild>
              <button
                type="button"
                className="absolute right-0 bottom-0 grid size-9 place-items-center rounded-full border-[3px] border-surface bg-brand text-on-action transition-colors hover:bg-brand-strong disabled:opacity-60"
                aria-label={t("settings.profile.photo")}
                disabled={uploadAvatar.isPending || removeAvatar.isPending}
              >
                <Icon name="photo-camera-fill" size={16} />
              </button>
            </PopoverTrigger>
            <PopoverContent align="start" sideOffset={8} className="w-64 rounded-2xl border border-line bg-surface p-2 text-ink shadow-xl">
              {PHOTO_ACTIONS.filter((item) => item.key !== "remove" || user.avatarUrl).map((item) => (
                <button
                  key={item.key}
                  type="button"
                  className={`flex h-12 w-full items-center gap-3 rounded-xl px-3 text-left text-body transition-colors hover:bg-subtle ${
                    item.key === "remove" ? "text-error-text" : "text-ink"
                  }`}
                  onClick={() => {
                    setPhotoOpen(false);
                    photoAction(item.key);
                  }}
                >
                  <Icon name={item.icon} size={20} />
                  {t(`settings.profile.photoMenu.${item.key}`)}
                </button>
              ))}
            </PopoverContent>
          </Popover>
          <input ref={fileRef} type="file" accept="image/*" hidden onChange={(event) => pickFile(event.target.files?.[0])} />
          <input ref={cameraRef} type="file" accept="image/*" capture="user" hidden onChange={(event) => pickFile(event.target.files?.[0])} />
        </span>
        <span className="flex min-w-0 flex-1 flex-col gap-1">
          <h2 className="truncate font-heading text-[22px]/8 font-semibold text-ink">{user.name}</h2>
          <small className="truncate text-body-sm text-ink-secondary">{subtitle}</small>
        </span>
        {editing ? null : (
          <button
            type="button"
            className="flex h-11 shrink-0 items-center gap-2 rounded-full border border-line-strong bg-surface px-4 text-button text-ink transition-colors hover:bg-subtle"
            onClick={startEdit}
          >
            <Icon name="edit" size={18} />
            {t("settings.profile.edit")}
          </button>
        )}
      </div>

      {editing ? (
        <>
          <div className="grid grid-cols-2 gap-x-4 gap-y-5">
            {fields.map((field) => (
              <label key={field.key} className="flex flex-col gap-2">
                <span className="text-body-sm font-medium text-ink">{field.label}</span>
                <span className="relative">
                  <input
                    className={`${INPUT} ${errors[field.key] ? INPUT_ERROR : ""}`}
                    type={field.type ?? "text"}
                    value={draft[field.key]}
                    autoCapitalize={field.key === "username" ? "none" : undefined}
                    aria-invalid={Boolean(errors[field.key])}
                    placeholder={field.key === "phone" ? "+998 90 123 45 67" : undefined}
                    onChange={(event) => {
                      const value = event.target.value;
                      setDraft((current) => ({ ...current, [field.key]: value }));
                      setErrors((current) => ({ ...current, [field.key]: "" }));
                    }}
                  />
                  {errors[field.key] ? (
                    <Icon name="warning-fill" size={20} className="absolute top-1/2 right-4 -translate-y-1/2 text-error-text" />
                  ) : null}
                </span>
                {errors[field.key] ? (
                  <small className="text-body-xs text-error-text">{errors[field.key]}</small>
                ) : field.hint ? (
                  <small className="text-body-xs text-ink-tertiary">{field.hint}</small>
                ) : null}
              </label>
            ))}
          </div>
          {errorCount ? (
            <p className="flex items-center gap-3 rounded-2xl bg-danger-bg px-4 py-3 text-body-sm text-error-text">
              <Icon name="warning-fill" size={20} className="shrink-0" />
              {t("settings.profile.errors", { count: errorCount })}
            </p>
          ) : null}
          <span className="mt-auto flex justify-end gap-3">
            <button
              type="button"
              className="flex h-11 items-center rounded-full border border-line-strong bg-surface px-5 text-button text-ink transition-colors hover:bg-subtle"
              onClick={stopEditing}
            >
              {t("settings.profile.cancel")}
            </button>
            <button
              type="submit"
              className="flex h-11 items-center rounded-full bg-brand px-5 text-button text-on-action transition-colors hover:bg-brand-strong disabled:opacity-50"
              disabled={update.isPending}
            >
              {t("settings.profile.save")}
            </button>
          </span>
        </>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {fields.map((field) => (
            <span key={field.key} className="flex items-center gap-3 rounded-2xl bg-subtle px-4 py-3.5">
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-surface text-icon-secondary">
                <Icon name={field.icon} size={20} />
              </span>
              <span className="flex min-w-0 flex-col">
                <small className="text-caption text-ink-secondary">{field.label}</small>
                <strong className="truncate text-title-sm text-ink">{field.value || "—"}</strong>
              </span>
            </span>
          ))}
        </div>
      )}
    </form>
  );
}
