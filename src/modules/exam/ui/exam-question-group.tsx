import { useRef } from "react";
import { Headphones, Play } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { ExamQuestionGroup } from "@/shared/types";

export type ExamAudioState = "idle" | "playing" | "done";

export interface ExamGroupPanelProps {
  group: ExamQuestionGroup;
  /** Audio shu brauzerda allaqachon boshlangan bo'lsa (sahifa yangilangandan keyin ham) qayta eshittirilmaydi. */
  examId: string;
  audioState: ExamAudioState;
  onAudioState: (state: ExamAudioState) => void;
}

const playedKey = (examId: string, groupId: string) => `exam-audio-played:${examId}:${groupId}`;

function wasPlayed(key: string): boolean {
  try {
    return globalThis.localStorage.getItem(key) === "1";
  } catch {
    return false;
  }
}

export function ExamGroupPanel({ group, examId, audioState: liveState, onAudioState }: ExamGroupPanelProps) {
  const { t } = useTranslation("exam");
  const audioRef = useRef<HTMLAudioElement>(null);
  const key = playedKey(examId, group.id);
  const audioState: ExamAudioState = liveState === "idle" && wasPlayed(key) ? "done" : liveState;

  return (
    <div className="exam-group">
      {group.title ? <h3>{group.title}</h3> : null}

      {group.audioUrl ? (
        <div className="exam-group-audio">
          <audio
            ref={audioRef}
            src={group.audioUrl}
            onEnded={() => onAudioState("done")}
            onPlay={() => {
              try {
                globalThis.localStorage.setItem(key, "1");
              } catch {
                /* xotira o'chirilgan bo'lsa ham audio ishlayveradi */
              }
              onAudioState("playing");
            }}
          />
          {audioState === "idle" ? (
            <button type="button" onClick={() => void audioRef.current?.play()}>
              <Play size={15} /> {t("runner.audioStart")}
            </button>
          ) : (
            <span className={`exam-group-audio-state ${audioState === "playing" ? "is-playing" : ""}`}>
              <Headphones size={15} />
              {audioState === "playing" ? t("runner.audioPlaying") : t("runner.audioPlayed")}
            </span>
          )}
          <small>{t("runner.audioOnce")}</small>
        </div>
      ) : null}

      {group.passage ? <div className="exam-group-passage">{group.passage}</div> : null}
    </div>
  );
}
