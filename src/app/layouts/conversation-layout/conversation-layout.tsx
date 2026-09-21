import { useEffect, useState, type CSSProperties, type KeyboardEvent, type PointerEvent } from "react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Outlet, useLocation, useParams } from "react-router-dom";
import { ConversationRail, type ConversationSection } from "@/modules/conversation";
import { ConversationPanel } from "@/widgets/conversation-panel";
import { AccountMenu } from "@/widgets/account-menu";
import { STORAGE_KEYS } from "@/shared/constants";
import { storage } from "@/shared/lib";
import type { ConversationRole } from "@/shared/types";



const WIDTH_KEYS: Record<ConversationRole, string> = {
  teacher: STORAGE_KEYS.CONVERSATION_PANEL_WIDTH,
  student: STORAGE_KEYS.STUDENT_CONVERSATION_PANEL_WIDTH,
};

const MIN_WIDTH = 300;
const MAX_WIDTH = 480;
const DEFAULT_WIDTH = 368;

function sectionFromPath(pathname: string): ConversationSection {
  if (pathname.endsWith("/schedule")) return "schedule";
  if (
    pathname.endsWith("/workspace") ||
    pathname.endsWith("/quizzes") ||
    pathname.endsWith("/ai") ||
    pathname.endsWith("/analytics") ||
    pathname.endsWith("/mock-tests")
  )
    return "workspace";
  return "chat";
}

export function ConversationLayout({ role = "teacher" }: { role?: ConversationRole }) {
  const { t } = useTranslation("nav");
  const { conversationId } = useParams();
  const { pathname } = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const section = sectionFromPath(pathname);
  const wideSection = section !== "chat";
  const storageKey = WIDTH_KEYS[role] ?? WIDTH_KEYS.teacher;
  const [panelWidth, setPanelWidth] = useState(() => {
    const saved = Number(storage.get(storageKey));
    return Number.isFinite(saved) && saved >= MIN_WIDTH && saved <= MAX_WIDTH ? saved : DEFAULT_WIDTH;
  });
  const [resizing, setResizing] = useState(false);

  useEffect(() => {
    if (!resizing) return undefined;
    function handleMove(event: globalThis.PointerEvent) {
      setPanelWidth(Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, event.clientX)));
    }
    function handleUp() {
      setResizing(false);
      document.body.classList.remove("is-resizing-sidebar");
    }
    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);
    return () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
      document.body.classList.remove("is-resizing-sidebar");
    };
  }, [resizing]);

  useEffect(() => {
    storage.set(storageKey, panelWidth);
  }, [panelWidth, storageKey]);

  function startResize(event: PointerEvent<HTMLDivElement>) {
    if (window.innerWidth <= 768) return;
    event.preventDefault();
    setResizing(true);
    document.body.classList.add("is-resizing-sidebar");
  }

  function resizeWithKeyboard(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "ArrowLeft") setPanelWidth((width) => Math.max(MIN_WIDTH, width - 16));
    if (event.key === "ArrowRight") setPanelWidth((width) => Math.min(MAX_WIDTH, width + 16));
  }

  return (
    <div
      className={`teacher-shell conversation-shell conversation-shell--${role} ${resizing ? "is-resizing" : ""} ${wideSection ? "is-wide-section" : ""} ${conversationId ? "has-conversation" : ""}`}
      style={{ "--conversation-width": `${panelWidth}px` } as CSSProperties}
    >
      <ConversationRail role={role} section={section} onOpenMenu={() => setMenuOpen(true)} />
      <ConversationPanel role={role} onOpenMenu={() => setMenuOpen(true)} />
      <div
        className="conversation-resize-handle"
        role="separator"
        aria-label={t("rail.resizeHandle")}
        aria-orientation="vertical"
        tabIndex={0}
        onPointerDown={startResize}
        onDoubleClick={() => setPanelWidth(DEFAULT_WIDTH)}
        onKeyDown={resizeWithKeyboard}
      >
        <span />
      </div>
      <main
        className={`teacher-main conversation-main ${
          conversationId || wideSection ? "has-conversation" : ""
        }`}
      >
        <motion.div
          key={wideSection ? section : (conversationId ?? "empty")}
          className="route-motion"
          initial={{ opacity: 0, x: 4 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.14, ease: "easeOut" }}
        >
          <Outlet />
        </motion.div>
      </main>

      <AccountMenu
        open={menuOpen}
        onOpenChange={setMenuOpen}
        profileOpen={profileOpen}
        onProfileOpenChange={setProfileOpen}
        roleLabel={role === "teacher" ? t("roles.teacher") : t("roles.student")}
        workspaceLabel={role === "teacher" ? t("rail.teacherWorkspace") : t("rail.studentWorkspace")}
      />
    </div>
  );
}
