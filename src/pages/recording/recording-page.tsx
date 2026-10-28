import { useParams } from "react-router-dom";
import { useAuth } from "@/modules/auth";
import { LessonRatingForm, useLesson, useLessonRecording } from "@/modules/lesson";
import { ROLES } from "@/shared/constants";
import { RouteState } from "@/shared/ui/legacy";
import { useIsCompact } from "@/shared/hooks/use-media-query";
import { RecordingDesktop } from "./recording-desktop";
import { RecordingMobile } from "./recording-mobile";

export function RecordingPage() {
  const { lessonId } = useParams();
  const { user } = useAuth();
  const lesson = useLesson(lessonId ?? null);
  const recording = useLessonRecording(lessonId ?? null);
  const isCompact = useIsCompact();

  if (lesson.isLoading || (!lesson.isError && !lesson.data)) return <RecordingSkeleton />;

  if (lesson.isError)
    return (
      <RouteState
        eyebrow="DARS YOZUVI"
        title="Darsni topib bo‘lmadi"
        description={lesson.error?.message}
        actionLabel="Qayta urinish"
        onAction={lesson.refetch}
      />
    );

  const data = lesson.data!;
  const canManage = user?.role === ROLES.TEACHER;

  if (recording.isLoading) return <RecordingSkeleton />;

  if (isCompact)
    return (
      <RecordingMobile lesson={data} recording={recording.data} canManage={canManage}>
        {user?.role === ROLES.STUDENT ? (
          <div className="mt-5">
            <LessonRatingForm lesson={data} currentUserId={user?.id} />
          </div>
        ) : null}
      </RecordingMobile>
    );

  return <RecordingDesktop lesson={data} recording={recording.data} canManage={canManage} />;
}

function RecordingSkeleton() {
  const bar = "rounded-full bg-skeleton";
  return (
    <main
      className="flex h-full min-h-0 flex-col gap-5 overflow-hidden bg-canvas bg-auth-gradient px-4 pt-5 lg:bg-page-gradient lg:px-8 lg:py-7"
      aria-busy="true"
    >
      <span className="flex items-center gap-4">
        <i className="size-11 shrink-0 rounded-full bg-surface lg:hidden" />
        <span className="flex min-w-0 flex-1 flex-col gap-3 py-1">
          <i className={`${bar} hidden h-3 w-64 lg:block`} />
          <i className={`${bar} h-6 w-40 lg:h-7 lg:w-80`} />
        </span>
        <i className="hidden h-10 w-80 rounded-full bg-surface lg:block" />
        <i className="hidden size-10 rounded-full bg-surface lg:block" />
      </span>
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="flex min-w-0 flex-col gap-5">
          <i className="aspect-video w-full rounded-2xl bg-skeleton" />
          <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
            {Array.from({ length: 4 }, (_, index) => (
              <i key={index} className="h-16 rounded-lg bg-surface" />
            ))}
          </div>
        </div>
        <div className="flex min-w-0 flex-col gap-5">
          <div className="grid grid-cols-2 gap-2.5">
            <i className="h-24 rounded-lg bg-surface" />
            <i className="h-24 rounded-lg bg-surface" />
          </div>
          <i className="h-28 rounded-lg bg-surface" />
          <i className="h-11 rounded-full bg-surface" />
        </div>
      </div>
    </main>
  );
}
