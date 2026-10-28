import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth, useIsStudent } from "@/modules/auth";
import { ROUTES } from "@/shared/config";
import { useIsCompact } from "@/shared/hooks/use-media-query";
import { storage } from "@/shared/lib";
import { MobileListCard, MobileListRow, MobileSearchField, MobileSectionTitle } from "@/shared/ui/mobile-page";
import { ProfileSubPage } from "./profile-shell";
import { SETTINGS_TONES } from "./settings-tones";

const FAQ_TONE = "bg-brand-subtle text-ink";

interface HelpItem {
  id: string;
  icon: string;
  tone: string;
  action: () => void;
}

export function HelpCenterPage() {
  const { t } = useTranslation("account");
  const navigate = useNavigate();
  const { user } = useAuth();
  const student = useIsStudent();
  const isCompact = useIsCompact();
  const [query, setQuery] = useState("");
  const soon = () => toast.info(t("help.soon"));

  const sections: Array<{ id: string; items: HelpItem[] }> = [
    {
      id: "faq",
      items: student
        ? [
            { id: "joinLesson", icon: "help", tone: FAQ_TONE, action: () => navigate(ROUTES.student.schedule) },
            { id: "joinGroup", icon: "person-add", tone: FAQ_TONE, action: () => navigate(ROUTES.student.chats) },
            { id: "submitHomework", icon: "task-alt", tone: FAQ_TONE, action: () => navigate(ROUTES.student.homework) },
            { id: "takeTest", icon: "quiz", tone: FAQ_TONE, action: () => navigate(ROUTES.student.tests) },
          ]
        : [
            { id: "startLesson", icon: "help", tone: FAQ_TONE, action: () => navigate(ROUTES.teacher.dashboard) },
            { id: "addStudent", icon: "person-add", tone: FAQ_TONE, action: () => navigate(ROUTES.teacher.chats) },
            { id: "checkHomework", icon: "task-alt", tone: FAQ_TONE, action: () => navigate(ROUTES.teacher.homework) },
          ],
    },
    {
      id: "videos",
      items: [{ id: "intro", icon: "play-circle-fill", tone: SETTINGS_TONES.violet, action: soon }],
    },
    {
      id: "contact",
      items: [
        { id: "support", icon: "forum", tone: SETTINGS_TONES.success, action: soon },
        ...(student
          ? []
          : [
              {
                id: "tour",
                icon: "school",
                tone: SETTINGS_TONES.success,
                action: () => {
                  if (!isCompact) return soon();
                  storage.remove(`yolup:onboarding:${user?.id ?? ""}`);
                  navigate(ROUTES.teacher.dashboard);
                },
              },
            ]),
      ],
    },
  ];

  const term = query.trim().toLowerCase();
  const visible = sections
    .map((section) => ({
      ...section,
      items: section.items.filter(
        (item) =>
          !term ||
          `${t(`help.items.${item.id}.title`)} ${t(`help.items.${item.id}.hint`)}`.toLowerCase().includes(term)
      ),
    }))
    .filter((section) => section.items.length);

  return (
    <ProfileSubPage title={t("page.helpTitle")}>
      <div className="flex flex-col gap-5">
        <MobileSearchField
          value={query}
          onChange={setQuery}
          placeholder={t("help.search")}
          clearLabel={t("page.cancel")}
        />

        {visible.map((section) => (
          <section key={section.id} className="flex flex-col gap-3.5">
            <MobileSectionTitle>{t(`help.sections.${section.id}`)}</MobileSectionTitle>
            <MobileListCard>
              {section.items.map((item) => (
                <MobileListRow
                  key={item.id}
                  icon={item.icon}
                  tone={item.tone}
                  title={t(`help.items.${item.id}.title`)}
                  subtitle={t(`help.items.${item.id}.hint`)}
                  onClick={item.action}
                />
              ))}
            </MobileListCard>
          </section>
        ))}

        {visible.length ? null : (
          <p className="rounded-xl bg-surface px-4 py-6 text-center text-body-sm text-ink-secondary">{t("help.empty")}</p>
        )}
      </div>
    </ProfileSubPage>
  );
}
