import { BarChart3, ClipboardCheck, FileQuestion, Sparkles } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { useAuth } from "@/modules/auth";
import { ROLES } from "@/shared/constants";

interface WorkspaceCard {
  id: string;
  icon: LucideIcon;
  to?: string;
  studentOnly?: boolean;
  hiddenForStudent?: boolean;
}

const CARDS: WorkspaceCard[] = [
  { id: "quizzes", icon: FileQuestion, to: "../quizzes" },
  { id: "analytics", icon: BarChart3, to: "../analytics" },
  { id: "ai", icon: Sparkles, to: "../ai", hiddenForStudent: true },
  { id: "mock", icon: ClipboardCheck, to: "../mock-tests", studentOnly: true },
];

export function WorkspacePage() {
  const { t } = useTranslation("workspace");
  const { user } = useAuth();
  const isStudent = user?.role === ROLES.STUDENT;
  const cards = CARDS.filter(
    (card) => (!card.studentOnly || isStudent) && !(card.hiddenForStudent && isStudent)
  );

  return (
    <div className="portal-page">
      <div className="portal-page-heading">
        <div>
          <span className="portal-eyebrow">{t("eyebrow")}</span>
          <h1>{t("title")}</h1>
          <p>{t("subtitle")}</p>
        </div>
      </div>

      <div className="workspace-grid">
        {cards.map((card, index) => {
          const Icon = card.icon;
          const body = (
            <>
              <span className="workspace-card-icon">
                <Icon size={22} />
              </span>
              <strong>{t(`cards.${card.id}.title`)}</strong>
              <p>{t(`cards.${card.id}.description`)}</p>
              {card.to ? null : <em className="workspace-card-soon">{t("soon")}</em>}
            </>
          );
          return (
            <motion.article
              key={card.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.04 }}
            >
              {card.to ? (
                <Link className="workspace-card" to={card.to}>
                  {body}
                </Link>
              ) : (
                <div className="workspace-card is-soon" aria-disabled="true">
                  {body}
                </div>
              )}
            </motion.article>
          );
        })}
      </div>
    </div>
  );
}
