import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "@/shared/config";
import { Icon } from "@/shared/ui/icon";
import { Dropdown, DropdownContent, DropdownItem, DropdownTrigger } from "@/shared/ui/legacy";
import {
  MobileListCard,
  MobileListRow,
  MobileSectionTitle,
  MobileStatsCard,
  MobileTitleHeader,
  mobileRoundButton,
} from "@/shared/ui/mobile-page";

const MODULES = [
  { id: "tests", icon: "quiz", tone: "bg-accent-blue-bg text-accent-blue-fg", to: ROUTES.teacher.tests },
  {
    id: "analytics",
    icon: "bar-chart",
    tone: "bg-accent-green-bg text-accent-green-fg",
    to: ROUTES.teacher.workspaceAnalytics,
  },
  {
    id: "ai",
    icon: "sparkles-fill",
    tone: "bg-accent-saffron-bg text-accent-saffron-fg",
    to: ROUTES.teacher.workspaceAi,
  },
  {
    id: "mock",
    icon: "assignment-check-fill",
    tone: "bg-accent-violet-bg text-accent-violet-fg",
    to: ROUTES.teacher.mockExams,
  },
  { id: "assignments", icon: "assign", tone: "bg-accent-red-bg text-accent-red-fg", to: ROUTES.teacher.homework },
  { id: "materials", icon: "folder", tone: "bg-accent-violet-bg text-accent-red-fg", to: ROUTES.teacher.materials },
] as const;

const CREATE = [
  { id: "test", icon: "quiz", to: `${ROUTES.teacher.tests}?new=1` },
  { id: "homework", icon: "assign", to: `${ROUTES.teacher.homework}?new=1` },
  { id: "mock", icon: "assignment-check-fill", to: `${ROUTES.teacher.mockExams}?new=1` },
  { id: "ai", icon: "sparkles-fill", to: ROUTES.teacher.workspaceAi },
] as const;

export interface MobileWorkspaceHomeProps {
  unchecked: number;
  tests: number;
  exams: number;
}

export function MobileWorkspaceHome({ unchecked, tests, exams }: MobileWorkspaceHomeProps) {
  const { t } = useTranslation("workspace");
  const navigate = useNavigate();

  return (
    <main className="flex h-full flex-col gap-5.5 overflow-y-auto bg-canvas bg-auth-gradient px-4 pt-5.5 pb-32 font-body text-ink">
      <MobileTitleHeader
        eyebrow={t("home.mobile.eyebrow")}
        title={t("title")}
        action={
          <Dropdown>
            <DropdownTrigger asChild>
              <button type="button" className={mobileRoundButton} aria-label={t("home.mobile.create")}>
                <Icon name="add" size={24} />
              </button>
            </DropdownTrigger>
            <DropdownContent align="end">
              {CREATE.map((item) => (
                <DropdownItem key={item.id} onSelect={() => navigate(item.to)}>
                  <Icon name={item.icon} size={18} />
                  {t(`home.mobile.createItems.${item.id}`)}
                </DropdownItem>
              ))}
            </DropdownContent>
          </Dropdown>
        }
      />

      <MobileStatsCard
        label={t("home.mobile.overview")}
        actionLabel={t("home.mobile.details")}
        onAction={() => navigate(ROUTES.teacher.workspaceAnalytics)}
        items={[
          { id: "unchecked", value: unchecked, label: t("home.mobile.stats.unchecked") },
          { id: "tests", value: tests, label: t("home.mobile.stats.tests") },
          { id: "mock", value: exams, label: t("home.mobile.stats.mock") },
        ]}
      />

      <section className="flex flex-col gap-3">
        <MobileSectionTitle>{t("home.modules")}</MobileSectionTitle>
        <MobileListCard>
          {MODULES.map((module) => (
            <MobileListRow
              key={module.id}
              icon={module.icon}
              tone={module.tone}
              title={t(`home.mobile.modules.${module.id}.title`)}
              subtitle={t(`home.mobile.modules.${module.id}.description`)}
              onClick={() => navigate(module.to)}
            />
          ))}
        </MobileListCard>
      </section>
    </main>
  );
}
