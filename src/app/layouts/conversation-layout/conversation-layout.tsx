import {
  useEffect,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent,
} from "react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Outlet, useLocation, useParams } from "react-router-dom";
import {
  ConversationRail,
  NewConversationDialog,
  useNewConversationStore,
  type ConversationSection,
} from "@/modules/conversation";
import { StudentEnrollmentDialog } from "@/modules/student";
import { ConversationPanel } from "@/widgets/conversation-panel";
import { ConversationTopbar } from "@/widgets/conversation-topbar";
import { MobileTabBar } from "@/widgets/mobile-tab-bar";
import { STORAGE_KEYS } from "@/shared/constants";
import { storage } from "@/shared/lib";
import type { ConversationRole } from "@/shared/types";

const WIDTH_KEYS: Record<ConversationRole, string> = {
  teacher: STORAGE_KEYS.CONVERSATION_PANEL_WIDTH,
  student: STORAGE_KEYS.STUDENT_CONVERSATION_PANEL_WIDTH,
};

const MIN_WIDTH = 320;
const MAX_WIDTH = 480;
const DEFAULT_WIDTH = 400;

function sectionFromPath(pathname: string): ConversationSection {
  if (pathname.endsWith("/schedule")) return "schedule";
  if (pathname.includes("/profile")) return "profile";
  if (
    pathname.endsWith("/workspace") ||
    pathname.endsWith("/search") ||
    pathname.endsWith("/notifications") ||
    pathname.endsWith("/quizzes") ||
    pathname.endsWith("/assignments") ||
    pathname.endsWith("/ai") ||
    pathname.endsWith("/analytics") ||
    pathname.includes("/exams") ||
    pathname.includes("/homework-board")
  )
    return "workspace";
  return "chat";
}

export function ConversationLayout({ role = "teacher" }: { role?: ConversationRole }) {
  const { t } = useTranslation("nav");
  const { conversationId } = useParams();
  const { pathname } = useLocation();
  const section = sectionFromPath(pathname);
  const wideSection = section !== "chat";
  const storageKey = WIDTH_KEYS[role] ?? WIDTH_KEYS.teacher;
  const [panelWidth, setPanelWidth] = useState(() => {
    const saved = Number(storage.get(storageKey));
    return Number.isFinite(saved) && saved >= MIN_WIDTH && saved <= MAX_WIDTH
      ? saved
      : DEFAULT_WIDTH;
  });
  const [resizing, setResizing] = useState(false);
  const newGroupOpen = useNewConversationStore((state) => state.open);
  const setNewGroupOpen = useNewConversationStore((state) => state.setOpen);

  useEffect(() => {
    if (!resizing) return undefined;
    function handleMove(event: globalThis.PointerEvent) {
      setPanelWidth(Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, event.clientX - 248)));
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
    if (window.innerWidth < 1024) return;
    event.preventDefault();
    setResizing(true);
    document.body.classList.add("is-resizing-sidebar");
  }

  function resizeWithKeyboard(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "ArrowLeft") setPanelWidth((width) => Math.max(MIN_WIDTH, width - 16));
    if (event.key === "ArrowRight") setPanelWidth((width) => Math.min(MAX_WIDTH, width + 16));
  }

  const mainVisible = Boolean(conversationId) || wideSection;

  return (
    <div
      className="flex h-dvh w-full bg-canvas font-body text-ink"
      style={{ "--conversation-width": `${panelWidth}px` } as CSSProperties}
    >
      <ConversationRail
        role={role}
        section={section}
        hiddenOnMobile={role === "teacher" || Boolean(conversationId)}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <ConversationTopbar
          role={role}
          section={section}
          title={
            pathname.endsWith("/assignments") ? t("titles.assignments") : t(`titles.${section}`)
          }
        />

        <div className="flex min-h-0 flex-1">
          {wideSection ? null : <ConversationPanel role={role} hidden={Boolean(conversationId)} />}
          {wideSection ? null : (
            <div
              className="group relative hidden w-1.5 shrink-0 cursor-col-resize touch-none lg:block"
              role="separator"
              aria-label={t("rail.resizeHandle")}
              aria-orientation="vertical"
              tabIndex={0}
              onPointerDown={startResize}
              onDoubleClick={() => setPanelWidth(DEFAULT_WIDTH)}
              onKeyDown={resizeWithKeyboard}
            >
              <span
                className={`absolute inset-y-0 left-1/2 w-px -translate-x-1/2 transition-all group-hover:w-[3px] group-hover:bg-action group-focus-visible:w-[3px] group-focus-visible:bg-action ${
                  resizing ? "w-[3px] bg-action" : "bg-transparent"
                }`}
              />
            </div>
          )}

          <main
            className={`relative min-w-0 flex-1 overflow-hidden bg-canvas ${
              mainVisible ? "block" : "hidden lg:block"
            } ${conversationId ? "" : "pb-[68px]"} lg:pb-0`}
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
        </div>
      </div>

      {role === "teacher" && !conversationId && section === "chat" ? <MobileTabBar /> : null}

      {role === "teacher" ? (
        <NewConversationDialog open={newGroupOpen} onOpenChange={setNewGroupOpen} />
      ) : (
        <StudentEnrollmentDialog open={newGroupOpen} onOpenChange={setNewGroupOpen} />
      )}

    </div>
  );
}
