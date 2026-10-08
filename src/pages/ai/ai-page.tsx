import { useNavigate } from "react-router-dom";
import { useSubjects } from "@/modules/course";
import { AiQuizCreator } from "@/modules/quiz";
import { PageBackLink } from "@/shared/ui/legacy";

export function AiPage() {
  const navigate = useNavigate();
  const subjects = useSubjects();

  return (
    <div className="portal-page">
      <div className="portal-page-heading">
        <div>
          <PageBackLink />
          <span className="portal-eyebrow">AI</span>
          <h1>AI yordamchi</h1>
          <p>Sun’iy intellekt imkoniyatlari shu bo‘limda jamlanadi.</p>
        </div>
      </div>

      <AiQuizCreator
        subjects={subjects.data ?? []}
        onOpenQuiz={(quizId) => navigate(`../quizzes?quiz=${quizId}`)}
      />
    </div>
  );
}
