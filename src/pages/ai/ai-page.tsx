import { Sparkles } from "lucide-react";
import { PageBackLink } from "@/shared/ui/legacy";

export function AiPage() {
  return (
    <div className="schedule-page">
      <div className="schedule-page-head">
        <div>
          <PageBackLink />
          <span className="portal-eyebrow">AI</span>
          <h1>AI yordamchi</h1>
          <p>Sun’iy intellekt imkoniyatlari shu bo‘limda jamlanadi.</p>
        </div>
      </div>

      <div className="lesson-empty">
        <Sparkles size={26} />
        <p>Bu bo‘lim hozircha tayyorlanmoqda.</p>
      </div>
    </div>
  );
}
