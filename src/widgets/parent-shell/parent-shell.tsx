import { Suspense } from "react";
import { useTranslation } from "react-i18next";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { ROUTES } from "@/shared/config";
import { PageSkeleton } from "@/shared/ui/page-skeleton";
import { ParentBell } from "./parent-bell";
import { ParentSidebar } from "./parent-sidebar";

const RESULTS = [ROUTES.parent.grades, ROUTES.parent.exams];

export function ParentShell() {
  const { t } = useTranslation("parent");
  const { pathname } = useLocation();
  const home = pathname.replace(/\/$/, "") === ROUTES.parent.dashboard;
  const results = RESULTS.some((path) => pathname.startsWith(path));

  return (
    <div className="flex h-dvh min-h-0 overflow-hidden bg-canvas font-body text-ink">
      <ParentSidebar />
      <main className="min-w-0 flex-1 overflow-y-auto bg-page-gradient dark:bg-auth-gradient">
        {home ? null : (
          <div className="flex items-center gap-3 px-8 pt-7">
            {results ? (
              <nav className="flex w-fit items-center gap-1 rounded-full bg-surface p-1">
                {RESULTS.map((path) => (
                  <NavLink
                    key={path}
                    to={path}
                    className={({ isActive }) =>
                      `flex h-9 items-center rounded-full px-4 text-button transition-colors ${
                        isActive ? "bg-brand text-ink-inverse" : "text-ink-secondary hover:text-ink"
                      }`
                    }
                  >
                    {t(path === ROUTES.parent.grades ? "shell.resultsTabs.grades" : "shell.resultsTabs.exams")}
                  </NavLink>
                ))}
              </nav>
            ) : null}
            <span className="flex-1" />
            <ParentBell />
          </div>
        )}
        <Suspense fallback={<PageSkeleton />}>
          <Outlet />
        </Suspense>
      </main>
    </div>
  );
}
