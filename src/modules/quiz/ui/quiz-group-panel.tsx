import type { QuizGroup } from "@/shared/types";

export interface QuizGroupPanelProps {
  group: QuizGroup;
}

export function QuizGroupPanel({ group }: QuizGroupPanelProps) {
  return (
    <div className="quiz-group-panel">
      {group.title ? <h3>{group.title}</h3> : null}
      {group.audioUrl ? <audio src={group.audioUrl} controls preload="none" /> : null}
      {group.passage ? <div className="quiz-group-passage">{group.passage}</div> : null}
    </div>
  );
}
