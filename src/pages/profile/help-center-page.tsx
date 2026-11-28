import { useEffect, useState } from "react";
import { Navigate, Route, Routes, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { useIsCompact } from "@/shared/hooks/use-media-query";
import { HelpActionsContext, type NewTicketPrefill } from "@/pages/help/help-actions";
import { HelpArticlePage, HelpArticlesPage, HelpCategoryPage, HelpFaqPage, HelpVideosPage } from "@/pages/help/help-article";
import { HelpHome } from "@/pages/help/help-home";
import { NewTicketDialog, NewTicketPage } from "@/pages/help/help-new-ticket";
import { HelpSearchPage } from "@/pages/help/help-search";
import { HelpTicketsPage } from "@/pages/help/help-tickets";
import { useHelpPaths } from "@/pages/help/use-help";

function NewTicketRoute({ onDesktop }: { onDesktop: (prefill: NewTicketPrefill) => void }) {
  const isCompact = useIsCompact();
  const location = useLocation();
  const navigate = useNavigate();
  const paths = useHelpPaths();
  const prefill = ((location.state as { prefill?: NewTicketPrefill } | null)?.prefill ?? {}) as NewTicketPrefill;

  useEffect(() => {
    if (isCompact) return;
    onDesktop(prefill);
    navigate(paths.home, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCompact]);

  return isCompact ? <NewTicketPage prefill={prefill} /> : null;
}

export function HelpCenterPage() {
  const isCompact = useIsCompact();
  const navigate = useNavigate();
  const paths = useHelpPaths();
  const [params] = useSearchParams();
  const legacyTicket = params.get("ticket");
  const [dialog, setDialog] = useState<{ open: boolean; prefill: NewTicketPrefill }>({ open: false, prefill: {} });

  const actions = {
    openNewTicket: (prefill: NewTicketPrefill = {}) => {
      if (isCompact) navigate(paths.newTicket, { state: { prefill } });
      else setDialog({ open: true, prefill });
    },
  };

  if (legacyTicket) return <Navigate to={paths.ticket(legacyTicket)} replace />;

  return (
    <HelpActionsContext.Provider value={actions}>
      <Routes>
        <Route index element={<HelpHome />} />
        <Route path="search" element={<HelpSearchPage />} />
        <Route path="category/:categoryId" element={<HelpCategoryPage />} />
        <Route path="articles" element={<HelpArticlesPage />} />
        <Route path="articles/:articleId" element={<HelpArticlePage />} />
        <Route path="faq/:faqId" element={<HelpFaqPage />} />
        <Route path="videos" element={<HelpVideosPage />} />
        <Route path="new" element={<NewTicketRoute onDesktop={(prefill) => setDialog({ open: true, prefill })} />} />
        <Route path="tickets" element={<HelpTicketsPage />} />
        <Route path="tickets/:ticketId" element={<HelpTicketsPage />} />
        <Route path="*" element={<Navigate to={paths.home} replace />} />
      </Routes>
      {isCompact ? null : (
        <NewTicketDialog
          open={dialog.open}
          prefill={dialog.prefill}
          onOpenChange={(open) => setDialog((current) => ({ ...current, open }))}
        />
      )}
    </HelpActionsContext.Provider>
  );
}
