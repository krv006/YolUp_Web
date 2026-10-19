import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  useAuth,
  useSwitchAccountMutation,
  useSwitchRoleMutation,
  useUpdateAvatarMutation,
} from "@/modules/auth";
import { useCourses } from "@/modules/course";
import { ROLES } from "@/shared/constants";
import { AppDialog, dialogButton } from "@/shared/ui/app-dialog";
import { Icon } from "@/shared/ui/icon";
import { SettingsRow } from "./profile-shell";

export function ProfilePage() {
  const { t } = useTranslation("account");
  const { t: tn } = useTranslation("nav");
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const courses = useCourses();
  const updateAvatar = useUpdateAvatarMutation();
  const fileRef = useRef<HTMLInputElement>(null);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [switchOpen, setSwitchOpen] = useState(false);
  const switchAccount = useSwitchAccountMutation();
  const switchRole = useSwitchRoleMutation();
  const linkedAccounts = user?.linkedAccounts ?? [];

  const isTeacher = user?.role === ROLES.TEACHER;
  const groups = courses.data ?? [];
  const students = groups.reduce((sum, course) => sum + (course.studentCount || 0), 0);

  const links = [
    { id: "personal", icon: "edit", tone: "bg-action text-on-action", to: "personal" },
    { id: "account", icon: "check-circle", tone: "bg-success text-white", to: "account" },
    { id: "system", icon: "more", tone: "bg-saffron-strong text-white", to: "system" },
    { id: "help", icon: "error", tone: "bg-action text-on-action", to: "system" },
  ] as const;

  if (courses.isLoading && !user)
    return (
      <div className="flex h-full flex-col gap-4 bg-canvas p-4 lg:p-6">
        <div className="h-64 animate-pulse rounded-2xl bg-muted" />
        <div className="h-24 animate-pulse rounded-2xl bg-muted" />
        <div className="h-24 animate-pulse rounded-2xl bg-muted" />
      </div>
    );

  return (
    <div className="flex h-full flex-col gap-5 overflow-y-auto bg-canvas p-4 lg:p-6">
      <div className="grid gap-5 lg:grid-cols-[minmax(0,380px)_minmax(0,1fr)] lg:items-start">
        <section className="flex flex-col items-center gap-1 rounded-2xl border border-line bg-surface p-5">
          <span className="relative">
            {user?.avatarUrl ? (
              <img className="size-24 rounded-full object-cover" src={user.avatarUrl} alt="" />
            ) : (
              <span className="grid size-24 place-items-center rounded-full bg-action-subtle font-heading text-h2 text-action">
                {(user?.name ?? "")
                  .split(" ")
                  .map((part) => part[0])
                  .filter(Boolean)
                  .slice(0, 2)
                  .join("")
                  .toUpperCase()}
              </span>
            )}
            <input
              ref={fileRef}
              type="file"
              accept="image/png,image/jpeg"
              hidden
              onChange={(event) => {
                const file = event.target.files?.[0];
                event.target.value = "";
                if (file) updateAvatar.mutate(file);
              }}
            />
            <button
              type="button"
              className="absolute right-0 bottom-0 grid size-9 place-items-center rounded-full border-2 border-surface bg-action text-on-action"
              onClick={() => fileRef.current?.click()}
              aria-label={t("page.avatarTitle")}
            >
              <Icon name="camera" size={16} />
            </button>
          </span>

          <h2 className="mt-3 text-center font-heading text-h3 text-ink">{user?.name}</h2>
          <p className="text-body-sm text-ink-tertiary">
            {isTeacher ? tn("roles.teacher") : tn("roles.student")}
          </p>

          <div className="mt-4 grid w-full grid-cols-3 divide-x divide-line rounded-xl bg-subtle py-3">
            {[
              { value: String(groups.length), label: t("page.statGroups") },
              { value: String(students), label: t("page.statStudents") },
              { value: "—", label: t("page.statYears") },
            ].map((stat) => (
              <span key={stat.label} className="flex flex-col items-center">
                <strong className="font-heading text-title text-ink">{stat.value}</strong>
                <small className="text-caption text-ink-tertiary">{stat.label}</small>
              </span>
            ))}
          </div>

          <button
            type="button"
            className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-full border border-line bg-surface text-label-strong text-ink transition-colors hover:bg-subtle"
            onClick={() => navigate("personal")}
          >
            <Icon name="edit" size={18} /> {t("page.editProfile")}
          </button>
        </section>

        <div className="flex flex-col gap-5">
          <section className="flex flex-col gap-2">
            <h3 className="px-1 text-title text-ink">{t("page.settings")}</h3>
            <div className="flex flex-col divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface">
              {links.map((link) => (
                <SettingsRow
                  key={link.id}
                  icon={link.icon}
                  tone={link.tone}
                  title={t(`page.${link.id}Title`)}
                  hint={t(`page.${link.id}Hint`)}
                  onClick={() => navigate(link.to)}
                />
              ))}
            </div>
          </section>

          <section className="flex flex-col gap-2">
            <h3 className="px-1 text-title text-ink">{t("page.contact")}</h3>
            <div className="flex flex-col divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface">
              <SettingsRow
                icon="person"
                tone="bg-ink-tertiary text-white"
                title={user?.phone ?? "—"}
                hint={t("page.phoneLabel")}
              />
              <SettingsRow
                icon="assign"
                tone="bg-ink-tertiary text-white"
                title={user?.email ?? "—"}
                hint={t("page.emailLabel")}
              />
              <SettingsRow
                icon="school"
                tone="bg-ink-tertiary text-white"
                title="—"
                hint={t("page.cityLabel")}
              />
            </div>

            <div className="overflow-hidden rounded-2xl border border-line bg-surface">
              <SettingsRow
                icon="person"
                tone="bg-action text-on-action"
                title={t("page.switchAccount")}
                hint={t("page.switchAccountHint")}
                onClick={() => setSwitchOpen(true)}
              />
            </div>

            <div className="overflow-hidden rounded-2xl border border-line bg-surface">
              <SettingsRow
                icon="trash"
                tone="bg-error text-white"
                title={t("page.logout")}
                danger
                onClick={() => setLogoutOpen(true)}
                right={<span />}
              />
            </div>
          </section>
        </div>
      </div>

      <AppDialog
        open={switchOpen}
        onOpenChange={setSwitchOpen}
        title={t("page.switchAccount")}
        description={t("page.switchAccountDescription")}
        footer={
          <button
            type="button"
            className={dialogButton.primary}
            onClick={() => setSwitchOpen(false)}
          >
            {t("page.close")}
          </button>
        }
      >
        <div className="flex flex-col gap-2">
          <div className="flex flex-col divide-y divide-line overflow-hidden rounded-2xl border border-line">
            <span className="flex items-center gap-3 px-4 py-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-full bg-action-subtle font-heading text-label-strong text-action">
                {(user?.name ?? "")
                  .split(" ")
                  .map((part) => part[0])
                  .slice(0, 2)
                  .join("")
                  .toUpperCase()}
              </span>
              <span className="flex min-w-0 flex-1 flex-col">
                <strong className="truncate text-label-strong text-ink">{user?.name}</strong>
                <small className="truncate text-caption text-success-text">
                  {`${tn(`roles.${user?.role?.toLowerCase() ?? "teacher"}`, {
                    defaultValue: user?.role ?? "",
                  })} · ${t("page.accountActive")}`}
                </small>
              </span>
              <Icon name="check-circle" size={20} className="shrink-0 text-action" />
            </span>

            {linkedAccounts.map((account) => (
              <button
                key={account.id}
                type="button"
                className="flex items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-subtle disabled:opacity-60"
                disabled={switchAccount.isPending}
                onClick={() =>
                  switchAccount.mutate(account.id, {
                    onSuccess: () => setSwitchOpen(false),
                    onError: (error: Error) => toast.error(error.message),
                  })
                }
              >
                <span className="grid size-10 shrink-0 place-items-center rounded-full bg-subtle font-heading text-label-strong text-ink-secondary">
                  {(account.name ?? account.username)
                    .split(" ")
                    .map((part) => part[0])
                    .slice(0, 2)
                    .join("")
                    .toUpperCase()}
                </span>
                <span className="flex min-w-0 flex-1 flex-col">
                  <strong className="truncate text-label-strong text-ink">
                    {account.name || account.username}
                  </strong>
                  <small className="truncate text-caption text-ink-tertiary">
                    {tn(`roles.${account.role?.toLowerCase() ?? "student"}`, {
                      defaultValue: account.role,
                    })}
                  </small>
                </span>
                <Icon name="chevron-right" size={18} className="shrink-0 text-ink-tertiary" />
              </button>
            ))}
          </div>

          <button
            type="button"
            className="flex h-11 w-fit items-center gap-2 rounded-full px-3 text-label-strong text-action transition-colors hover:bg-action-subtle disabled:opacity-60"
            disabled={switchRole.isPending}
            onClick={() => navigate("account")}
          >
            <Icon name="add" size={18} /> {t("page.addAccount")}
          </button>
        </div>
      </AppDialog>

      <AppDialog
        open={logoutOpen}
        onOpenChange={setLogoutOpen}
        variant="confirm"
        title={t("page.logoutTitle")}
        description={t("page.logoutDescription")}
        footer={
          <>
            <button
              type="button"
              className={dialogButton.secondary}
              onClick={() => setLogoutOpen(false)}
            >
              {t("page.cancel")}
            </button>
            <button
              type="button"
              className={dialogButton.danger}
              onClick={() => {
                setLogoutOpen(false);
                void logout().then(() => toast.success(t("toast.loggedOut", { defaultValue: "" })));
              }}
            >
              {t("page.logout")}
            </button>
          </>
        }
      />
    </div>
  );
}
