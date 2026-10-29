import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { useAuth, useIsStudent } from "@/modules/auth";
import { SupportDialog, useHelpFaq, useHelpVideos, type FaqItem } from "@/modules/support";
import { ROUTES } from "@/shared/config";
import { useIsCompact } from "@/shared/hooks/use-media-query";
import { storage } from "@/shared/lib";
import { AppDialog } from "@/shared/ui/app-dialog";
import { MobileListCard, MobileListRow, MobileSearchField, MobileSectionTitle } from "@/shared/ui/mobile-page";
import { ProfileSubPage } from "./profile-shell";
import { SETTINGS_TONES } from "./settings-tones";

const FAQ_TONE = "bg-brand-subtle text-ink";

interface HelpItem {
  id: string;
  icon: string;
  tone: string;
  title: string;
  hint: string;
  action: () => void;
}

function duration(seconds: number | null): string {
  if (!seconds) return "";
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

export function HelpCenterPage() {
  const { t } = useTranslation("account");
  const navigate = useNavigate();
  const { user } = useAuth();
  const student = useIsStudent();
  const isCompact = useIsCompact();
  const [params, setParams] = useSearchParams();
  const [query, setQuery] = useState("");
  const [faq, setFaq] = useState<FaqItem | null>(null);
  const [supportOpen, setSupportOpen] = useState(false);
  const faqItems = useHelpFaq();
  const videos = useHelpVideos();
  const ticketId = params.get("ticket");
  const soon = () => toast.info(t("help.soon"));
  const item = (id: string, icon: string, tone: string, action: () => void): HelpItem => ({
    id,
    icon,
    tone,
    title: t(`help.items.${id}.title`),
    hint: t(`help.items.${id}.hint`),
    action,
  });

  const guides: HelpItem[] = student
    ? [
        item("joinLesson", "help", FAQ_TONE, () => navigate(ROUTES.student.schedule)),
        item("joinGroup", "person-add", FAQ_TONE, () => navigate(ROUTES.student.chats)),
        item("submitHomework", "task-alt", FAQ_TONE, () => navigate(ROUTES.student.homework)),
        item("takeTest", "quiz", FAQ_TONE, () => navigate(ROUTES.student.tests)),
      ]
    : [
        item("startLesson", "help", FAQ_TONE, () => navigate(ROUTES.teacher.dashboard)),
        item("addStudent", "person-add", FAQ_TONE, () => navigate(ROUTES.teacher.chats)),
        item("checkHomework", "task-alt", FAQ_TONE, () => navigate(ROUTES.teacher.homework)),
      ];

  const remoteFaq: HelpItem[] = (faqItems.data ?? []).map((entry) => ({
    id: `faq-${entry.id}`,
    icon: "help",
    tone: FAQ_TONE,
    title: entry.question,
    hint: entry.answer.replace(/\s+/g, " ").slice(0, 90),
    action: () => setFaq(entry),
  }));

  const videoItems: HelpItem[] = (videos.data ?? []).map((entry) => ({
    id: `video-${entry.id}`,
    icon: "play-circle-fill",
    tone: SETTINGS_TONES.violet,
    title: entry.title,
    hint: duration(entry.durationSeconds) || t("help.videoHint"),
    action: () => window.open(entry.url, "_blank", "noopener,noreferrer"),
  }));

  const sections: Array<{ id: string; items: HelpItem[] }> = [
    { id: "faq", items: [...remoteFaq, ...guides] },
    { id: "videos", items: videoItems },
    {
      id: "contact",
      items: [
        item("support", "forum", SETTINGS_TONES.success, () => setSupportOpen(true)),
        ...(student
          ? []
          : [
              item("tour", "school", SETTINGS_TONES.success, () => {
                if (!isCompact) return soon();
                storage.remove(`yolup:onboarding:${user?.id ?? ""}`);
                navigate(ROUTES.teacher.dashboard);
              }),
            ]),
      ],
    },
  ];

  const term = query.trim().toLowerCase();
  const visible = sections
    .map((section) => ({
      ...section,
      items: section.items.filter((entry) => !term || `${entry.title} ${entry.hint}`.toLowerCase().includes(term)),
    }))
    .filter((section) => section.items.length);

  function closeSupport(open: boolean) {
    if (open) return;
    setSupportOpen(false);
    if (ticketId) {
      const next = new URLSearchParams(params);
      next.delete("ticket");
      setParams(next, { replace: true });
    }
  }

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
              {section.items.map((entry) => (
                <MobileListRow
                  key={entry.id}
                  icon={entry.icon}
                  tone={entry.tone}
                  title={entry.title}
                  subtitle={entry.hint}
                  onClick={entry.action}
                />
              ))}
            </MobileListCard>
          </section>
        ))}

        {visible.length ? null : (
          <p className="rounded-xl bg-surface px-4 py-6 text-center text-body-sm text-ink-secondary">{t("help.empty")}</p>
        )}
      </div>

      <AppDialog
        open={Boolean(faq)}
        onOpenChange={(open) => !open && setFaq(null)}
        variant={isCompact ? "adaptive" : "confirm"}
        width="lg:w-130"
        title={faq?.question ?? ""}
      >
        <p className="text-body-sm whitespace-pre-line text-ink">{faq?.answer}</p>
      </AppDialog>

      <SupportDialog open={supportOpen || Boolean(ticketId)} onOpenChange={closeSupport} ticketId={ticketId} />
    </ProfileSubPage>
  );
}
