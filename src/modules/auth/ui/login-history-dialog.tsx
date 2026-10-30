import { Globe, MonitorSmartphone, ShieldAlert } from "lucide-react";
import { useTranslation } from "react-i18next";
import { formatDateTime } from "@/shared/lib";
import { Dialog, DialogContent, LoadingFallback, RouteState } from "@/shared/ui/legacy";
import { useLoginHistory } from "../model/auth.queries";

export interface LoginHistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studentId?: string | null;
  title?: string;
  description?: string;
}

export function LoginHistoryDialog({
  open,
  onOpenChange,
  studentId = null,
  title,
  description,
}: LoginHistoryDialogProps) {
  const { t } = useTranslation("account");
  const query = useLoginHistory(studentId, open);
  const records = query.data ?? [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {open ? (
        <DialogContent title={title ?? t("loginHistory.title")} description={description ?? t("loginHistory.description")}>
          {query.isLoading ? <LoadingFallback label={t("loginHistory.loading")} /> : null}

          {query.isError ? (
            <RouteState
              title={t("loginHistory.loadError")}
              actionLabel={t("loginHistory.retry")}
              onAction={query.refetch}
            />
          ) : null}

          {query.isSuccess && !records.length ? (
            <p className="portal-muted">{t("loginHistory.empty")}</p>
          ) : null}

          {records.length ? (
            <ul className="login-history">
              {records.map((record) => (
                <li key={record.id} className={record.isNewDevice ? "is-alert" : ""}>
                  <span className="login-history-icon">
                    {record.isNewDevice || record.isNewIp ? (
                      <ShieldAlert size={17} />
                    ) : (
                      <MonitorSmartphone size={17} />
                    )}
                  </span>
                  <div className="login-history-body">
                    <strong>{record.device}</strong>
                    <small title={record.userAgent}>
                      <Globe size={12} /> {record.ip} · {formatDateTime(record.at)}
                    </small>
                  </div>
                  <div className="login-history-flags">
                    {record.isNewDevice ? <span>{t("loginHistory.newDevice")}</span> : null}
                    {record.isNewIp ? <span>{t("loginHistory.newIp")}</span> : null}
                  </div>
                </li>
              ))}
            </ul>
          ) : null}
        </DialogContent>
      ) : null}
    </Dialog>
  );
}
