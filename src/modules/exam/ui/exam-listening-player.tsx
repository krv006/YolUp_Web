import { useEffect, useMemo, useRef, useState } from "react";
import { Headphones, Play } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { ExamQuestionGroup } from "@/shared/types";

const GAP_MS = 4000;
const FIRST_DELAY_MS = 800;

const playedKey = (examId: string, groupId: string) => `exam-audio-played:${examId}:${groupId}`;

function wasPlayed(examId: string, groupId: string): boolean {
  try {
    return globalThis.localStorage.getItem(playedKey(examId, groupId)) === "1";
  } catch {
    return false;
  }
}

function markPlayed(examId: string, groupId: string) {
  try {
    globalThis.localStorage.setItem(playedKey(examId, groupId), "1");
  } catch {
    /* xotira o'chirilgan bo'lsa ham audio ishlayveradi */
  }
}

export interface ExamListeningPlayerProps {
  examId: string;
  groups: ExamQuestionGroup[];
}

/**
 * Listening pleeri: bo'limdagi audiolar (Part 1, 2, ...) tartib bilan O'ZI boshlanadi va ketma-ket eshittiriladi.
 * Faqat bir marta: to'xtatib, o'tkazib yoki qaytarib bo'lmaydi; sahifa yangilansa ham eshitilgan qism qayta chalinmaydi.
 * Brauzer ovozli avtoboshlashga ruxsat bermasa (masalan, sahifa yangilangandan keyin yoki iPhone) — "Boshlash" tugmasi chiqadi.
 */
export function ExamListeningPlayer({ examId, groups }: ExamListeningPlayerProps) {
  const queue = useMemo(() => groups.filter((group) => group.audioUrl), [groups]);
  const [finished, setFinished] = useState(0); // shu seansda tugagan qismlar soni (keyingisini tanlash uchun)
  const index = useMemo(
    () => queue.findIndex((group) => !wasPlayed(examId, group.id)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [queue, examId, finished]
  );

  if (!queue.length) return null;
  return (
    <ExamAudioPart
      key={index < 0 ? "done" : queue[index].id}
      examId={examId}
      group={index < 0 ? null : queue[index]}
      number={index < 0 ? queue.length : index + 1}
      total={queue.length}
      first={index === 0}
      onEnded={() => setFinished((value) => value + 1)}
    />
  );
}

type PartState = "gap" | "tap" | "playing";

function ExamAudioPart({
  examId,
  group,
  number,
  total,
  first,
  onEnded,
}: {
  examId: string;
  group: ExamQuestionGroup | null;
  number: number;
  total: number;
  first: boolean;
  onEnded: () => void;
}) {
  const { t } = useTranslation("exam");
  const audioRef = useRef<HTMLAudioElement>(null);
  const [state, setState] = useState<PartState>("gap");
  const [progress, setProgress] = useState(0);
  const label = group?.title || t("runner.audioPart", { number });

  useEffect(() => {
    if (!group) return undefined;
    const timer = globalThis.setTimeout(() => {
      audioRef.current?.play().catch(() => setState("tap"));
    }, first ? FIRST_DELAY_MS : GAP_MS);
    return () => globalThis.clearTimeout(timer);
  }, [group, first]);

  if (!group) {
    return (
      <div className="exam-listening">
        <Headphones size={18} />
        <div className="exam-listening-main">
          <strong>{t("runner.audioAllDone")}</strong>
          <div className="exam-listening-bar" aria-hidden="true">
            <span style={{ width: "100%" }} />
          </div>
          <small>{t("runner.audioOnce")}</small>
        </div>
      </div>
    );
  }

  return (
    <div className={`exam-listening ${state === "playing" ? "is-playing" : ""}`}>
      <audio
        ref={audioRef}
        src={group.audioUrl ?? undefined}
        preload="auto"
        onPlay={() => {
          markPlayed(examId, group.id);
          setState("playing");
        }}
        onTimeUpdate={(event) => {
          const audio = event.currentTarget;
          if (audio.duration > 0) setProgress(Math.min(100, (audio.currentTime / audio.duration) * 100));
        }}
        onEnded={onEnded}
        onError={() => setState("tap")}
        // To'xtatib bo'lmaydi: pauza bo'lsa darhol davom ettiriladi (boshqaruv tugmalari yo'q)
        onPause={(event) => {
          const audio = event.currentTarget;
          if (!audio.ended && state === "playing") void audio.play().catch(() => setState("tap"));
        }}
      />
      <Headphones size={18} />
      <div className="exam-listening-main">
        {state === "tap" ? (
          <button type="button" onClick={() => void audioRef.current?.play().catch(() => undefined)}>
            <Play size={15} /> {t("runner.audioStartPart", { label })}
          </button>
        ) : (
          <strong>{state === "playing" ? t("runner.audioPlayingPart", { label }) : t("runner.audioNext", { label })}</strong>
        )}
        <div className="exam-listening-bar" aria-hidden="true">
          <span style={{ width: `${progress}%` }} />
        </div>
        <small>
          {t("runner.audioOnce")} · {t("runner.audioPartsCount", { current: number, total })}
        </small>
      </div>
    </div>
  );
}
