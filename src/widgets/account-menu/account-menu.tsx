import { useEffect, useRef, useState, type FormEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Award,
  Bell,
  Camera,
  ChevronRight,
  Copy,
  FileText,
  History,
  Loader2,
  LogOut,
  Phone,
  Plus,
  Settings,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  UserRound,
  X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import {
  LoginHistoryDialog,
  resolveHomeRoute,
  useAuth,
  useDeleteCertificate,
  useSwitchAccountMutation,
  useSwitchRoleMutation,
  useUpdateAvatarMutation,
  useUpdateProfileMutation,
  useUploadCertificate,
  type ProfileFormValues,
} from "@/modules/auth";
import { NotificationInboxDialog } from "@/modules/notification";
import { NotificationSettings } from "./notification-settings";
import { ROLES, type Role } from "@/shared/constants";
import { useLanguageStore } from "@/shared/model";
import type { AuthUser, LinkedAccount } from "@/shared/types";
import { Avatar, Button, Dialog, DialogContent, LanguageToggle, ThemeToggle } from "@/shared/ui/legacy";

const ROLE_I18N_KEY: Partial<Record<Role, string>> = {
  [ROLES.TEACHER]: "nav:roles.teacher",
  [ROLES.STUDENT]: "nav:roles.student",
  [ROLES.PARENT]: "nav:roles.parent",
};

const SELF_SERVICE_ROLES: Role[] = [ROLES.TEACHER, ROLES.PARENT, ROLES.STUDENT];

type MenuItemId = "profile" | "logins" | "notifications" | "settings";

function useMenuItems(): Array<{
  id: MenuItemId;
  label: string;
  description: string;
  icon: typeof UserRound;
}> {
  const { t } = useTranslation("account");
  return [
    { id: "profile", label: t("menu.profile.label"), description: t("menu.profile.description"), icon: UserRound },
    { id: "logins", label: t("menu.logins.label"), description: t("menu.logins.description"), icon: History },
    { id: "notifications", label: t("menu.notifications.label"), description: t("menu.notifications.description"), icon: Bell },
    { id: "settings", label: t("menu.settings.label"), description: t("menu.settings.description"), icon: Settings },
  ];
}

export interface AccountMenuProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profileOpen: boolean;
  onProfileOpenChange: (open: boolean) => void;
  roleLabel?: string;
  workspaceLabel?: string;
}

export function AccountMenu({
  open,
  onOpenChange,
  profileOpen,
  onProfileOpenChange,
  roleLabel,
  workspaceLabel,
}: AccountMenuProps) {
  const { t } = useTranslation("account");
  const resolvedRoleLabel = roleLabel ?? t("roleFallback");
  const resolvedWorkspaceLabel = workspaceLabel ?? t("workspaceFallback");
  const { user, logout } = useAuth();
  const menuItems = useMenuItems();
  const navigate = useNavigate();
  const switchAccount = useSwitchAccountMutation();
  const switchRole = useSwitchRoleMutation();
  const updateProfile = useUpdateProfileMutation();
  const updateAvatar = useUpdateAvatarMutation();
  const uploadCertificate = useUploadCertificate();
  const deleteCertificate = useDeleteCertificate();
  const avatarRef = useRef<HTMLInputElement>(null);
  const certificateRef = useRef<HTMLInputElement>(null);
  const [editing, setEditing] = useState(false);
  const [loginsOpen, setLoginsOpen] = useState(false);
  const [inboxOpen, setInboxOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [draft, setDraft] = useState<ProfileFormValues>({
    firstName: "",
    lastName: "",
    phone: "",
    username: "",
  });

  const profileRowRef = useRef<HTMLDivElement>(null);
  const roleFlyoutRef = useRef<HTMLDivElement>(null);
  const closeFlyoutTimerRef = useRef<number | null>(null);
  const [roleFlyoutOpen, setRoleFlyoutOpen] = useState(false);
  const [flyoutPosition, setFlyoutPosition] = useState<{ top: number; left: number } | null>(null);
  const linkedAccounts = user?.linkedAccounts ?? [];
  const missingRoles =
    user && user.role !== ROLES.STUDENT
      ? SELF_SERVICE_ROLES.filter(
          (role) => role !== user.role && !linkedAccounts.some((account) => account.role === role)
        )
      : [];
  const hasRoleSwitcher = linkedAccounts.length > 0 || missingRoles.length > 0;

  async function finishSwitch(request: Promise<AuthUser>) {
    try {
      const nextUser = await request;
      setRoleFlyoutOpen(false);
      navigate(resolveHomeRoute(nextUser), { replace: true });
      toast.success(t("roleSwitcher.switched", { name: nextUser.name }));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("roleSwitcher.failed"));
    }
  }

  function switchToAccount(account: LinkedAccount) {
    if (switchAccount.isPending || switchRole.isPending) return;
    void finishSwitch(switchAccount.mutateAsync(account.id));
  }

  function switchToRole(role: Role) {
    if (switchAccount.isPending || switchRole.isPending) return;
    void finishSwitch(switchRole.mutateAsync(role.toLowerCase()));
  }

  function cancelFlyoutClose() {
    if (closeFlyoutTimerRef.current !== null) {
      window.clearTimeout(closeFlyoutTimerRef.current);
      closeFlyoutTimerRef.current = null;
    }
  }

  function scheduleFlyoutClose() {
    cancelFlyoutClose();
    closeFlyoutTimerRef.current = window.setTimeout(() => setRoleFlyoutOpen(false), 150);
  }

  function openRoleFlyout() {
    const rect = profileRowRef.current?.getBoundingClientRect();
    if (rect) setFlyoutPosition({ top: rect.top, left: rect.right + 10 });
    setRoleFlyoutOpen(true);
  }

  function toggleRoleFlyout() {
    if (roleFlyoutOpen) {
      setRoleFlyoutOpen(false);
    } else {
      openRoleFlyout();
    }
  }

  useEffect(() => {
    if (!roleFlyoutOpen) return undefined;
    function handleOutside(event: PointerEvent) {
      const target = event.target as Node;
      if (profileRowRef.current?.contains(target) || roleFlyoutRef.current?.contains(target)) return;
      setRoleFlyoutOpen(false);
    }
    document.addEventListener("pointerdown", handleOutside);
    return () => document.removeEventListener("pointerdown", handleOutside);
  }, [roleFlyoutOpen]);

  const language = useLanguageStore((state) => state.language);
  const previousLanguageRef = useRef(language);
  useEffect(() => {
    if (previousLanguageRef.current !== language) {
      previousLanguageRef.current = language;
      setSettingsOpen(false);
    }
  }, [language]);

  function closeDrawer() {
    setRoleFlyoutOpen(false);
    onOpenChange(false);
  }

  function selectItem(id: MenuItemId) {
    if (id === "profile") {
      closeDrawer();
      onProfileOpenChange(true);
      return;
    }
    if (id === "logins") {
      closeDrawer();
      setLoginsOpen(true);
      return;
    }
    if (id === "notifications") {
      closeDrawer();
      setInboxOpen(true);
      return;
    }
    closeDrawer();
    setSettingsOpen(true);
  }

  async function handleLogout() {
    await logout();
    navigate("/login", { replace: true });
  }

  async function copyValue(label: string, value: string | null | undefined) {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      toast.success(t("toast.copied", { label }));
    } catch {
      toast.error(t("toast.copyFailed"));
    }
  }

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      await updateProfile.mutateAsync(draft);
      setEditing(false);
      toast.success(t("toast.profileUpdated"));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("toast.profileSaveFailed"));
    }
  }

  return (
    <>
      <AnimatePresence>
        {open && (
          <>
            <motion.button
              className="teacher-menu-overlay"
              aria-label={t("closeMenuAria")}
              onClick={closeDrawer}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />
            <motion.aside
              className="teacher-menu-drawer"
              initial={{ x: -28, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -20, opacity: 0 }}
              transition={{ type: "spring", stiffness: 360, damping: 32 }}
              aria-label={t("menuAria", { role: resolvedRoleLabel })}
            >
              <div className="teacher-menu-top">
                <button className="icon-button" onClick={closeDrawer} aria-label={t("closeAria")}>
                  <X size={19} />
                </button>
              </div>
              <div
                className="teacher-menu-profile-wrap"
                ref={profileRowRef}
                onMouseEnter={() => {
                  if (!hasRoleSwitcher) return;
                  cancelFlyoutClose();
                  openRoleFlyout();
                }}
                onMouseLeave={scheduleFlyoutClose}
              >
                <button className="teacher-menu-profile" onClick={() => selectItem("profile")}>
                  <Avatar name={user?.name ?? resolvedRoleLabel} tone="violet" size="lg" status="online" src={user?.avatarUrl} />
                  <span>
                    <strong>{user?.name}</strong>
                    <small>{resolvedRoleLabel} · {t("online")}</small>
                  </span>
                </button>
                {hasRoleSwitcher ? (
                  <button
                    type="button"
                    className={`teacher-menu-role-trigger ${roleFlyoutOpen ? "is-open" : ""}`}
                    aria-label={t("roleSwitcher.triggerAria")}
                    aria-expanded={roleFlyoutOpen}
                    onClick={(event) => {
                      event.stopPropagation();
                      toggleRoleFlyout();
                    }}
                  >
                    <ChevronRight size={18} />
                  </button>
                ) : null}
              </div>
              <div className="teacher-menu-status">
                <ShieldCheck size={17} />
                <span>
                  <strong>{resolvedWorkspaceLabel}</strong>
                  <small>{t("sessionSecure")}</small>
                </span>
              </div>
              <nav className="teacher-menu-links" aria-label={t("sectionsAria")}>
                {menuItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button key={item.id} onClick={() => selectItem(item.id)}>
                      <span className="teacher-menu-item-icon">
                        <Icon size={19} />
                      </span>
                      <span>
                        <strong>{item.label}</strong>
                        <small>{item.description}</small>
                      </span>
                      <ChevronRight size={17} />
                    </button>
                  );
                })}
              </nav>
              <button className="teacher-menu-logout" onClick={handleLogout}>
                <LogOut size={18} /> {t("logout")}
              </button>
              <p className="teacher-menu-version">{t("version")}</p>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {open && roleFlyoutOpen && flyoutPosition && hasRoleSwitcher ? (
          <motion.div
            ref={roleFlyoutRef}
            className="teacher-menu-role-flyout"
            style={{ top: flyoutPosition.top, left: flyoutPosition.left }}
            aria-label={t("roleSwitcher.panelAria")}
            initial={{ opacity: 0, x: -6, scale: 0.97 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -6, scale: 0.97 }}
            transition={{ duration: 0.14 }}
            onMouseEnter={cancelFlyoutClose}
            onMouseLeave={scheduleFlyoutClose}
          >
            {linkedAccounts.length ? (
              <>
                <span className="teacher-menu-role-flyout-label">{t("roleSwitcher.otherAccounts")}</span>
                {linkedAccounts.map((account) => (
                  <button
                    key={account.id}
                    type="button"
                    disabled={switchAccount.isPending}
                    onClick={() => switchToAccount(account)}
                  >
                    <span>
                      <strong>{account.name}</strong>
                      <small>
                        {t(ROLE_I18N_KEY[account.role] ?? "")} · @{account.username}
                      </small>
                    </span>
                    {switchAccount.isPending && switchAccount.variables === account.id ? (
                      <Loader2 size={14} className="spin" />
                    ) : null}
                  </button>
                ))}
              </>
            ) : null}
            {missingRoles.length ? (
              <>
                <span className="teacher-menu-role-flyout-label">{t("roleSwitcher.openRoles")}</span>
                {missingRoles.map((role) => (
                  <button
                    key={role}
                    type="button"
                    disabled={switchRole.isPending}
                    onClick={() => switchToRole(role)}
                  >
                    <span>
                      <strong>{t(ROLE_I18N_KEY[role] ?? "")}</strong>
                      <small>{t("roleSwitcher.openHint")}</small>
                    </span>
                    {switchRole.isPending && switchRole.variables === role.toLowerCase() ? (
                      <Loader2 size={14} className="spin" />
                    ) : (
                      <Plus size={14} />
                    )}
                  </button>
                ))}
              </>
            ) : null}
            <p className="teacher-menu-role-flyout-note">{t("roleSwitcher.switchHint")}</p>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <Dialog
        open={profileOpen}
        onOpenChange={(value) => {
          onProfileOpenChange(value);
          if (!value) setEditing(false);
        }}
      >
        {profileOpen && (
          <DialogContent
            className="teacher-profile-dialog"
            title={t("profileDialog.title", { role: resolvedRoleLabel })}
            description={t("profileDialog.description")}
          >
            <motion.div
              className="teacher-profile-hero"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <span className="info-avatar-slot">
                <Avatar
                  name={user?.name ?? resolvedRoleLabel}
                  tone="violet"
                  size="lg"
                  status="online"
                  src={user?.avatarUrl}
                />
                <input
                  ref={avatarRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  hidden
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    event.target.value = "";
                    if (!file) return;
                    updateAvatar.mutate(file, {
                      onSuccess: () => toast.success(t("toast.avatarUpdated")),
                      onError: (error: Error) => toast.error(error.message),
                    });
                  }}
                />
                <button
                  type="button"
                  className="info-avatar-edit"
                  aria-label={t("profileDialog.changeAvatarAria")}
                  disabled={updateAvatar.isPending}
                  onClick={() => avatarRef.current?.click()}
                >
                  {updateAvatar.isPending ? (
                    <Loader2 size={14} className="spin" />
                  ) : (
                    <Camera size={14} />
                  )}
                </button>
              </span>
              <h3>{user?.name}</h3>
              <p>{resolvedRoleLabel}</p>
              <span className="teacher-profile-verified">
                <ShieldCheck size={14} /> {t("profileDialog.verified")}
              </span>
            </motion.div>

            {editing ? (
              <form className="dialog-form" onSubmit={saveProfile}>
                <div className="register-name-grid">
                  <label className="field-group">
                    <span>{t("profileDialog.firstName")}</span>
                    <div className="input-shell">
                      <input
                        value={draft.firstName}
                        onChange={(event) => setDraft((value) => ({ ...value, firstName: event.target.value }))}
                        required
                      />
                    </div>
                  </label>
                  <label className="field-group">
                    <span>{t("profileDialog.lastName")}</span>
                    <div className="input-shell">
                      <input
                        value={draft.lastName}
                        onChange={(event) => setDraft((value) => ({ ...value, lastName: event.target.value }))}
                        required
                      />
                    </div>
                  </label>
                </div>
                <label className="field-group">
                  <span>{t("profileDialog.username")}</span>
                  <div className="input-shell">
                    <input
                      value={draft.username}
                      autoComplete="off"
                      onChange={(event) => setDraft((value) => ({ ...value, username: event.target.value }))}
                      required
                    />
                  </div>
                </label>
                <p className="portal-muted">{t("profileDialog.usernameNote")}</p>
                <label className="field-group">
                  <span>{t("profileDialog.phone")}</span>
                  <div className="input-shell">
                    <input
                      type="tel"
                      value={draft.phone}
                      onChange={(event) => setDraft((value) => ({ ...value, phone: event.target.value }))}
                    />
                  </div>
                </label>
                {updateProfile.isError ? (
                  <div className="form-alert">{updateProfile.error.message}</div>
                ) : null}
                <div className="dialog-actions">
                  <Button type="button" variant="secondary" onClick={() => setEditing(false)}>
                    {t("profileDialog.cancel")}
                  </Button>
                  <Button type="submit" loading={updateProfile.isPending}>
                    {t("profileDialog.save")}
                  </Button>
                </div>
              </form>
            ) : (
              <>
                <div className="teacher-profile-details">
                  <button onClick={() => copyValue(t("toast.usernameLabelShort"), `@${user?.username}`)}>
                    <UserRound size={18} />
                    <span>
                      <small>{t("profileDialog.usernameLabel")}</small>
                      <strong>@{user?.username}</strong>
                    </span>
                    <Copy size={15} />
                  </button>
                  {user?.phone ? (
                    <button onClick={() => copyValue(t("toast.phoneLabelShort"), user.phone)}>
                      <Phone size={18} />
                      <span>
                        <small>{t("profileDialog.phoneLabel")}</small>
                        <strong>{user.phone}</strong>
                      </span>
                      <Copy size={15} />
                    </button>
                  ) : null}
                </div>

                {user?.role === ROLES.TEACHER ? (
                  <div className="teacher-profile-certificates">
                    {user.isApproved === false ? (
                      <div className="form-alert">
                        <ShieldAlert size={15} /> {t("profileDialog.notApproved")}
                      </div>
                    ) : null}
                    <div className="teacher-profile-certificates-head">
                      <span>{t("profileDialog.certificates")}</span>
                      <button
                        type="button"
                        disabled={uploadCertificate.isPending}
                        onClick={() => certificateRef.current?.click()}
                      >
                        {uploadCertificate.isPending ? (
                          <Loader2 size={14} className="spin" />
                        ) : (
                          <Award size={14} />
                        )}
                        {t("profileDialog.upload")}
                      </button>
                      <input
                        ref={certificateRef}
                        type="file"
                        accept="image/*,application/pdf"
                        hidden
                        onChange={(event) => {
                          const file = event.target.files?.[0];
                          event.target.value = "";
                          if (!file) return;
                          uploadCertificate.mutate({ file });
                        }}
                      />
                    </div>
                    <div className="teacher-profile-certificate-list">
                      {user.certificates.map((certificate) => (
                        <div key={certificate.id} className="teacher-profile-certificate">
                          <a href={certificate.file} target="_blank" rel="noreferrer">
                            <FileText size={16} />
                            <span>{certificate.title || t("profileDialog.certificateFallback")}</span>
                          </a>
                          <button
                            type="button"
                            aria-label={t("profileDialog.deleteCertificateAria", {
                              title: certificate.title || t("profileDialog.certificateFallback"),
                            })}
                            disabled={deleteCertificate.isPending}
                            onClick={() => deleteCertificate.mutate(certificate.id)}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}
                      {!user.certificates.length ? (
                        <p className="portal-muted">{t("profileDialog.noCertificates")}</p>
                      ) : null}
                    </div>
                  </div>
                ) : null}

                <Button
                  className="teacher-profile-action"
                  onClick={() => {
                    setDraft({
                      firstName: user?.firstName || "",
                      lastName: user?.lastName || "",
                      phone: user?.phone || "",
                      username: user?.username || "",
                    });
                    setEditing(true);
                  }}
                >
                  {t("profileDialog.editButton")}
                </Button>
              </>
            )}
          </DialogContent>
        )}
      </Dialog>

      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        {settingsOpen && (
          <DialogContent
            className="account-settings-dialog"
            title={t("settingsDialog.title")}
            description={t("settingsDialog.description")}
          >
            <div className="account-settings-list">
              <div className="account-settings-row">
                <span>{t("settingsDialog.languageLabel")}</span>
                <LanguageToggle />
              </div>
              <div className="account-settings-row">
                <span>{t("settingsDialog.themeLabel")}</span>
                <ThemeToggle />
              </div>
              <NotificationSettings />
            </div>
          </DialogContent>
        )}
      </Dialog>

      <LoginHistoryDialog open={loginsOpen} onOpenChange={setLoginsOpen} />
      <NotificationInboxDialog open={inboxOpen} onOpenChange={setInboxOpen} />
    </>
  );
}
