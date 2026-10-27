import { useParams } from "react-router-dom";
import { useAuth } from "@/modules/auth";
import { LessonRatingForm, useLesson, useLessonRecording } from "@/modules/lesson";
import { ROLES } from "@/shared/constants";
import { LoadingFallback, RouteState } from "@/shared/ui/legacy";
import { useIsCompact } from "@/shared/hooks/use-media-query";
import { RecordingDesktop } from "./recording-desktop";
import { RecordingMobile } from "./recording-mobile";

export function RecordingPage() {
  const { lessonId } = useParams();
  const { user } = useAuth();
  const lesson = useLesson(lessonId ?? null);
  const recording = useLessonRecording(lessonId ?? null);
  const isCompact = useIsCompact();

  if (lesson.isLoading || (!lesson.isError && !lesson.data))
    return <LoadingFallback label="Dars yuklanmoqda" />;

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

  if (recording.isLoading) return <LoadingFallback label="Yozuv yuklanmoqda" />;

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
