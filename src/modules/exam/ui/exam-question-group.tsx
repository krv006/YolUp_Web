import { useRef } from "react";
import { Headphones, Play } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { ExamQuestionGroup } from "@/shared/types";

export type ExamAudioState = "idle" | "playing" | "done";

export interface ExamGroupPanelProps {
  group: ExamQuestionGroup;
  audioState: ExamAudioState;
  onAudioState: (state: ExamAudioState) => void;
}

export function ExamGroupPanel({ group, audioState, onAudioState }: ExamGroupPanelProps) {
  const { t } = useTranslation("exam");
  const audioRef = useRef<HTMLAudioElement>(null);

  return (
    <div className="exam-group">
      {group.title ? <h3>{group.title}</h3> : null}

      {group.audioUrl ? (
        <div className="exam-group-audio">
          <audio
            ref={audioRef}
            src={group.audioUrl}
            onEnded={() => onAudioState("done")}
            onPlay={() => onAudioState("playing")}
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
