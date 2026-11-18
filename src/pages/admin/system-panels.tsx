import { useMemo, useState } from "react";
import { Activity, Gauge, HardDrive } from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  shortUserAgent,
  TrendLineChart,
  useClientHealth,
  useMonitoringCurrent,
  useMonitoringHistory,
  useTeacherVideoStats,
} from "@/modules/analytics";
import { formatDateTime } from "@/shared/lib";
import type { MonitoringSample } from "@/shared/types";
import { LoadingFallback } from "@/shared/ui/legacy";

const HOUR_OPTIONS = [6, 24, 72, 168];
const CLIENT_HOUR_OPTIONS = [24, 72, 168, 336];
const MAX_POINTS = 48;

function downsample(samples: MonitoringSample[]): MonitoringSample[] {
  if (samples.length <= MAX_POINTS) return samples;
  const bucket = Math.ceil(samples.length / MAX_POINTS);
  const out: MonitoringSample[] = [];
  for (let i = 0; i < samples.length; i += bucket) {
    const slice = samples.slice(i, i + bucket);
    const busiest = slice.reduce((top, item) => (item.cpuPercent > top.cpuPercent ? item : top), slice[0]);
    out.push(busiest);
  }
  return out;
}

export function StoragePanel() {
  const { t } = useTranslation("admin");
  const query = useTeacherVideoStats();

  return (
    <section className="portal-card admin-teacher-panel">
      <div className="portal-section-head">
        <div>
          <span>
            <HardDrive size={13} /> {t("storage.eyebrow")}
          </span>
          <h2>{t("storage.title")}</h2>
        </div>
        <strong className="storage-total">
          {t("storage.totalVideos", { count: query.data?.totalVideos ?? 0 })}
        </strong>
      </div>

      {query.isLoading ? <LoadingFallback label={t("storage.loading")} /> : null}

      {query.data?.teachers.length ? (
        <div className="analytics-table-wrap">
          <table className="analytics-table">
            <thead>
              <tr>
                <th>{t("storage.teacher")}</th>
                <th>{t("storage.videoCount")}</th>
              </tr>
            </thead>
            <tbody>
              {query.data.teachers.map((item) => (
                <tr key={item.teacherId}>
                  <td>{item.teacherName}</td>
                  <td>{item.videoCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : !query.isLoading ? (
        <p className="portal-muted">{t("storage.empty")}</p>
      ) : null}
    </section>
  );
}

export function ServerMonitoringPanel() {
  const { t } = useTranslation("admin");
  const [hours, setHours] = useState(24);
  const current = useMonitoringCurrent();
  const history = useMonitoringHistory(hours);
  const samples = useMemo(() => downsample(history.data?.samples ?? []), [history.data]);
  const cpuColor = "var(--primary)";
  const memoryColor = "var(--tone-amber-fg)";

  return (
    <section className="portal-card admin-teacher-panel">
      <div className="portal-section-head">
        <div>
          <span>
            <Activity size={13} /> {t("monitoring.eyebrow")}
          </span>
          <h2>{t("monitoring.title")}</h2>
          <p className="portal-muted monitoring-note">{t("monitoring.scopeNote")}</p>
        </div>
        <div className="monitoring-range">
          {HOUR_OPTIONS.map((value) => (
            <button
              key={value}
              type="button"
              className={value === hours ? "is-active" : ""}
              onClick={() => setHours(value)}
            >
              {t("monitoring.hours", { count: value })}
            </button>
          ))}
        </div>
      </div>

      {current.isLoading ? <LoadingFallback label={t("monitoring.loading")} /> : null}

      {current.data ? (
        <div className="teacher-stats-grid monitoring-now">
          <article>
            <strong>{current.data.cpuPercent.toFixed(1)}%</strong>
            <small>{t("monitoring.cpu")}</small>
          </article>
          <article>
            <strong>{current.data.memoryPercent.toFixed(1)}%</strong>
            <small>{t("monitoring.memory")}</small>
          </article>
          <article>
            <strong>
              {current.data.memoryUsedMb} / {current.data.memoryTotalMb} MB
            </strong>
            <small>{t("monitoring.memoryUsed")}</small>
          </article>
          <article>
            <strong>{current.data.createdAt ? formatDateTime(current.data.createdAt) : "—"}</strong>
            <small>{t("monitoring.measuredAt")}</small>
          </article>
        </div>
      ) : !current.isLoading ? (
        <p className="portal-muted">{t("monitoring.noSamples")}</p>
      ) : null}

      {samples.length ? (
        <>
          <div className="monitoring-legend">
            <span>
              <i style={{ background: cpuColor }} /> {t("monitoring.cpu")}
            </span>
            <span>
              <i style={{ background: memoryColor }} /> {t("monitoring.memory")}
            </span>
            <small>{t("monitoring.pointNote", { count: samples.length })}</small>
          </div>

          <div className="monitoring-chart">
            <TrendLineChart
              zeroBase
              unit="%"
              labels={samples.map((item) => item.createdAt.slice(11, 16))}
              series={[
                { key: "cpu", name: t("monitoring.cpu"), color: cpuColor, values: samples.map((i) => i.cpuPercent) },
                { key: "memory", name: t("monitoring.memory"), color: memoryColor, values: samples.map((i) => i.memoryPercent) },
              ]}
            />
          </div>

          {history.data?.peak ? (
            <div className="monitoring-peak">
              <span>{t("monitoring.peakLabel")}</span>
              <strong>{formatDateTime(history.data.peak.createdAt)}</strong>
              <b>CPU {history.data.peak.cpuPercent.toFixed(1)}%</b>
            </div>
          ) : null}
        </>
      ) : null}
    </section>
  );
}

export function ClientHealthPanel() {
  const { t } = useTranslation("admin");
  const [hours, setHours] = useState(24);
  const health = useClientHealth(hours);
  const data = health.data;
  const limitedShare = data?.total ? Math.round((data.cpuLimitedTotal / data.total) * 100) : 0;

  return (
    <section className="portal-card admin-teacher-panel">
      <div className="portal-section-head">
        <div>
          <span>
            <Gauge size={13} /> {t("clientHealth.eyebrow")}
          </span>
          <h2>{t("clientHealth.title")}</h2>
          <p className="portal-muted monitoring-note">{t("clientHealth.note")}</p>
        </div>
        <div className="monitoring-range">
          {CLIENT_HOUR_OPTIONS.map((value) => (
            <button
              key={value}
              type="button"
              className={value === hours ? "is-active" : ""}
              onClick={() => setHours(value)}
            >
              {value < 48 ? t("monitoring.hours", { count: value }) : t("clientHealth.days", { count: value / 24 })}
            </button>
          ))}
        </div>
      </div>

      {health.isLoading ? <LoadingFallback label={t("clientHealth.loading")} /> : null}
      {health.isError ? <p className="portal-muted">{health.error.message}</p> : null}

      {data ? (
        <>
          <div className="teacher-stats-grid monitoring-now">
            <article>
              <strong>{data.total}</strong>
              <small>{t("clientHealth.reports")}</small>
            </article>
            <article>
              <strong>
                {data.cpuLimitedTotal} · {limitedShare}%
              </strong>
              <small>{t("clientHealth.cpuLimited")}</small>
            </article>
            <article>
              <strong>{data.users.length}</strong>
              <small>{t("clientHealth.users")}</small>
            </article>
            <article>
              <strong>{data.users.filter((user) => user.cpuLimitedReports > 0).length}</strong>
              <small>{t("clientHealth.slowUsers")}</small>
            </article>
          </div>

          {data.users.length ? (
            <div className="dash-table-wrap">
              <table className="dash-table">
                <thead>
                  <tr>
                    <th>{t("clientHealth.columns.user")}</th>
                    <th>{t("clientHealth.columns.reports")}</th>
                    <th>{t("clientHealth.columns.cpu")}</th>
                    <th>{t("clientHealth.columns.network")}</th>
                    <th>{t("clientHealth.columns.minFps")}</th>
                    <th>{t("clientHealth.columns.device")}</th>
                    <th>{t("clientHealth.columns.lastAt")}</th>
                  </tr>
                </thead>
                <tbody>
                  {data.users.map((user) => (
                    <tr key={user.userId}>
                      <td className="cell-primary">
                        @{user.username || "—"}
                        <small className="portal-muted"> · {t(`clientHealth.roles.${user.role}`, { defaultValue: user.role })}</small>
                      </td>
                      <td>{user.reports}</td>
                      <td className={user.cpuLimitedReports ? "font-semibold text-error-text" : ""}>{user.cpuLimitedReports}</td>
                      <td>{user.bandwidthLimitedReports}</td>
                      <td className={user.minFps !== null && user.minFps < 10 ? "font-semibold text-error-text" : ""}>{user.minFps ?? "—"}</td>
                      <td>
                        {[
                          user.cores ? t("clientHealth.cores", { count: user.cores }) : "",
                          user.memoryGb ? t("clientHealth.memory", { value: user.memoryGb }) : "",
                          shortUserAgent(user.userAgent),
                        ]
                          .filter(Boolean)
                          .join(" · ") || "—"}
                      </td>
                      <td>{user.lastAt ? formatDateTime(user.lastAt) : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="portal-muted">{t("clientHealth.empty")}</p>
          )}
        </>
      ) : null}
    </section>
  );
}
