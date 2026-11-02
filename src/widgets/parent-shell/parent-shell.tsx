import { Suspense } from "react";
import { Outlet } from "react-router-dom";
import { PageSkeleton } from "@/shared/ui/page-skeleton";
import { ParentSidebar } from "./parent-sidebar";

export function ParentShell() {
  return (
    <div className="flex h-dvh min-h-0 overflow-hidden bg-canvas font-body text-ink">
      <ParentSidebar />
      <main className="min-w-0 flex-1 overflow-y-auto bg-page-gradient dark:bg-auth-gradient">
        <Suspense fallback={<PageSkeleton />}>
          <Outlet />
        </Suspense>
      </main>
    </div>
  );
}
