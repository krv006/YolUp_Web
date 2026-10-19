import { ArrowLeft, BookOpen, CalendarDays, Clock3 } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/modules/auth";
import {
  LessonRatingForm,
  LessonRecordingPlayer,
  RatingSummary,
  useLesson,
  useLessonRecording,
} from "@/modules/lesson";
import { ROLES } from "@/shared/constants";
import { LoadingFallback, RouteState } from "@/shared/ui/legacy";
import { useIsCompact } from "@/shared/hooks/use-media-query";
import { Users } from "lucide-react";

const LESSON_DATE = new Intl.DateTimeFormat("uz-UZ", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

export function RecordingPage() {
  const { lessonId } = useParams();
  const navigate = useNavigate();
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
  const isStudent = user?.role === ROLES.STUDENT;

  if (isCompact)
    return (
      <div
        data-theme="dark"
        className="dark flex min-h-dvh flex-col bg-canvas px-4 pt-3 pb-6 text-ink"
      >
        <header className="flex h-11 shrink-0 items-center gap-2">
          <button
            type="button"
            className="-ml-2 grid size-10 place-items-center rounded-full text-ink transition-colors hover:bg-subtle"
            aria-label="Orqaga"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft size={22} />
          </button>
          <strong className="font-heading text-title text-ink">Dars yozuvi</strong>
        </header>

        <div className="-mr-4 flex shrink-0 items-center gap-2 overflow-x-auto py-3 pr-4">
          <span className="flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-subtle px-3 text-caption-strong text-ink-secondary">
            <Users size={14} /> {data.courseTitle}
          </span>
          <span className="flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-subtle px-3 text-caption-strong text-ink-secondary">
            <CalendarDays size={14} /> {data.date}
          </span>
          <span className="flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-subtle px-3 text-caption-strong text-ink-secondary">
            <Clock3 size={14} /> {data.time} · {data.durationMinutes} daqiqa
          </span>
        </div>

        <div data-theme="light" className="flex min-h-0 flex-1 flex-col gap-4">
          {recording.isLoading ? (
            <LoadingFallback label="Yozuv yuklanmoqda" />
          ) : recording.isError ? (
            <RouteState
              title="Yozuvni yuklab bo‘lmadi"
              description={recording.error?.message}
              actionLabel="Qayta urinish"
              onAction={recording.refetch}
            />
          ) : (
            <LessonRecordingPlayer
              lessonId={data.id}
              recording={recording.data}
              canDelete={user?.role === ROLES.TEACHER}
            />
          )}

          {isStudent ? <LessonRatingForm lesson={data} currentUserId={user?.id} /> : null}
        </div>
      </div>
    );

  return (
    <div className="portal-page recording-page">
      <div className="portal-page-heading">
        <div>
          <span className="portal-eyebrow">DARS YOZUVI</span>
          <h1>{data.title}</h1>
          <div className="page-meta">
            <span>
              <BookOpen size={14} /> {data.courseTitle}
            </span>
            <span>
              <CalendarDays size={14} /> {LESSON_DATE.format(new Date(data.startsAt))}
            </span>
            <span>
              <Clock3 size={14} /> {data.time} · {data.durationMinutes} daqiqa
            </span>
            <RatingSummary average={data.avgRating} count={data.ratingCount} />
          </div>
        </div>
        <button className="button button--secondary" onClick={() => navigate(-1)}>
          <ArrowLeft size={17} /> Orqaga
        </button>
      </div>

      <section className="portal-card recording-page-card">
        {recording.isLoading ? (
          <LoadingFallback label="Yozuv yuklanmoqda" />
        ) : recording.isError ? (
          <RouteState
            title="Yozuvni yuklab bo‘lmadi"
            description={recording.error?.message}
            actionLabel="Qayta urinish"
            onAction={recording.refetch}
          />
        ) : (
          <LessonRecordingPlayer
            lessonId={data.id}
            recording={recording.data}
            canDelete={user?.role === ROLES.TEACHER}
          />
        )}
      </section>

      {isStudent ? (
        <section className="portal-card recording-page-card">
          <div className="portal-section-head">
            <div>
              <span>FIKR-MULOHAZA</span>
              <h2>Darsni baholang</h2>
            </div>
          </div>
          <LessonRatingForm lesson={data} currentUserId={user?.id} />
        </section>
      ) : null}
    </div>
  );
}
