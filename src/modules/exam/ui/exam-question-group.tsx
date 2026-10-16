import type { ExamQuestionGroup } from "@/shared/types";

export interface ExamGroupPanelProps {
  group: ExamQuestionGroup;
}

/** Savollar guruhi: sarlavha va matn parchasi (Reading). Audio (Listening) tepadagi pleerda eshittiriladi. */
export function ExamGroupPanel({ group }: ExamGroupPanelProps) {
  return (
    <div className="exam-group">
      {group.title ? <h3>{group.title}</h3> : null}
      {group.passage ? <div className="exam-group-passage">{group.passage}</div> : null}
    </div>
  );
}
