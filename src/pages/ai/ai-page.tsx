import { useNavigate } from "react-router-dom";
import { useCourses, useSubjects } from "@/modules/course";
import { AiQuizCreator } from "@/modules/quiz";
import { PageBackLink } from "@/shared/ui/legacy";

export function AiPage() {
  const navigate = useNavigate();
  const subjects = useSubjects();
  const courses = useCourses();

  return (
    <div className="schedule-page">
      <div className="schedule-page-head">
        <div>
          <PageBackLink />
          <span className="portal-eyebrow">AI</span>
          <h1>AI bilan test yaratish</h1>
          <p>Material va imtihon turini bering. AI qoralama test tuzib beradi.</p>
        </div>
      </div>

      <AiQuizCreator
        subjects={subjects.data ?? []}
        courses={(courses.data ?? []).map((course) => ({ id: course.id, title: course.title }))}
        onOpenQuiz={(quizId) => navigate(`../quizzes?quiz=${quizId}`)}
      />
    </div>
  );
}
