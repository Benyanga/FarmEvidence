import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { ScreenTopbar } from '../../components/shared/ScreenTopbar';
import { useTrialContext } from '../../context/TrialContext';
import { IconSprout, IconAlertTriangle, IconAlertOctagon, IconCheckCircle } from '../../components/ui/Icons';

const LABELS = {
  en: {
    title: 'Farm Alerts',
    summary: 'Stay on top of your farm tasks and observations.',
    noFarm: 'No active farm selected. Choose a farm from the sidebar to see alerts.',
    noAlerts: 'No active alerts right now. Good job keeping the farm on track.',
    refresh: 'Refresh Alerts',
    dismiss: 'Dismiss',
    markRead: 'Mark Read',
    action: 'Open data entry',
    reminder: 'Reminder',
    dataEntry: 'Go to data entry',
    sent: 'Sent',
    alertCount: 'Active alerts',
    loading: 'Loading alerts…',
    errorFetch: 'Unable to load alerts. Please try again later.',
    viewFarm: 'View farm records',
    today: 'Today',
    noData: 'No active alerts to show.',
  },
  kin: {
    title: 'Imenyesha z\'ubuhinzi',
    summary: 'Kurikirana imirimo y\'ubutaka n\'ibisabwa by\'ubumenyi.',
    noFarm: 'Nta butaka bwatoranijwe. Hitamo ubutaka mu ruhande rwa sidebar kugirango urebe imenyeza.',
    noAlerts: 'Nta menyesha y\'akazi ubu. Murakoze gukurikiza neza ubutaka.',
    refresh: 'Ongera ushakire',
    dismiss: 'Siba',
    markRead: 'Soma',
    action: 'Fungura kwinjiza amakuru',
    reminder: 'Icyibutsa',
    dataEntry: 'Jya kwinjiza amakuru',
    sent: 'Yoherejwe',
    alertCount: 'Imenyesha zikora',
    loading: 'Birimo gupakurura…',
    errorFetch: 'Ntibyakunze gupakurura imenyeza. Ongera uzagerageze nyuma.',
    viewFarm: 'Reba inyandiko z\'ubutaka',
    today: 'Uyu munsi',
    noData: 'Nta menyesha zigaragara ubu.',
  },
};

const SEVERITY_STYLES = {
  error: {
    border: 'border-l-4 border-rose-500',
    bg: 'bg-rose-50',
    icon: <IconAlertOctagon className="w-6 h-6 text-terracotta flex-shrink-0" />,
  },
  warning: {
    border: 'border-l-4 border-amber-400',
    bg: 'bg-amber-50',
    icon: <IconAlertTriangle className="w-6 h-6 text-amber flex-shrink-0" />,
  },
  info: {
    border: 'border-l-4 border-sky-500',
    bg: 'bg-sky-50',
    icon: <IconSprout className="w-6 h-6 text-sky flex-shrink-0" />,
  },
  success: {
    border: 'border-l-4 border-emerald-500',
    bg: 'bg-emerald-50',
    icon: <IconCheckCircle className="w-6 h-6 text-canopy flex-shrink-0" />,
  },
};

function formatTimeAgo(timestamp) {
  if (!timestamp) return '';
  const now = new Date();
  const then = new Date(timestamp);
  const diff = Math.max(0, now - then);
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `${minutes}m ${LABELS.en.sent}`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ${LABELS.en.sent}`;
  const days = Math.floor(hours / 24);
  return `${days}d ${LABELS.en.sent}`;
}

export default function FarmerAlerts() {
  const { activeFarm, lang } = useTrialContext();
  const labels = LABELS[lang === 'kin' ? 'kin' : 'en'];
  const farmId = activeFarm?._id ?? activeFarm?.recordId ?? activeFarm?.id;
  const farmName = activeFarm?.farmName ?? activeFarm?.farm_name ?? activeFarm?.trial_name ?? labels.dataEntry;
  const dataEntryPath = activeFarm?.year && activeFarm?.season && farmId
    ? `/data-entry/${activeFarm.year}/${activeFarm.season}/${farmId}`
    : '/data-entry';

  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const fetchAlerts = useCallback(async () => {
    if (!farmId) {
      setAlerts([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError('');
      const res = await fetch(`/api/notifications/trial/${farmId}`);
      if (!res.ok) {
        throw new Error(`${res.status}: ${res.statusText}`);
      }
      const data = await res.json();
      const list = Array.isArray(data) ? data : data.notifications ?? [];
      setAlerts(list);
    } catch (err) {
      console.error('[FarmerAlerts] fetch error', err);
      setError(labels.errorFetch);
      setAlerts([]);
    } finally {
      setLoading(false);
    }
  }, [farmId, labels.errorFetch]);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAlerts();
    setRefreshing(false);
  };

  const handleDismiss = async (alertId) => {
    try {
      await fetch(`/api/notifications/${alertId}/dismiss`, { method: 'PATCH' });
      setAlerts((prev) => prev.map((item) => (item.id === alertId ? { ...item, isDismissed: true } : item)));
    } catch (err) {
      console.error('[FarmerAlerts] dismiss error', err);
    }
  };

  const handleMarkRead = async (alertId) => {
    try {
      await fetch(`/api/notifications/${alertId}/read`, { method: 'PATCH' });
      setAlerts((prev) => prev.map((item) => (item.id === alertId ? { ...item, isRead: true } : item)));
    } catch (err) {
      console.error('[FarmerAlerts] mark read error', err);
    }
  };

  const notificationPrefs = user?.notificationPrefs ?? {
    timeBasedReminders: true,
    weedPressureAlerts: true,
    pestIncidenceAlerts: true,
    bcrLossAlerts: true,
    deltaCUpdates: true,
    emailDigest: false,
  };

  const shouldShowAlertByPrefs = (alert) => {
    const trigger = String(alert.trigger || '').toLowerCase();
    if (trigger === 'weed_pressure_high') return notificationPrefs.weedPressureAlerts;
    if (trigger === 'pest_incidence_high') return notificationPrefs.pestIncidenceAlerts;
    if (trigger === 'bcr_below_one' || trigger === 'bcr_below_one_cf') return notificationPrefs.bcrLossAlerts;
    if (trigger === 'delta_c_positive') return notificationPrefs.deltaCUpdates;
    if (trigger === 'yield_missing' || alert.isTimeBase) return notificationPrefs.timeBasedReminders;
    return notificationPrefs.timeBasedReminders;
  };

  const visibleAlerts = useMemo(
    () => alerts.filter((alert) => !alert.isDismissed).filter((alert) => shouldShowAlertByPrefs(alert)),
    [alerts, notificationPrefs]
  );
  const openAlerts = visibleAlerts.filter((alert) => !alert.isRead);

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-10">
      <ScreenTopbar
        superText={labels.title}
        title={farmName}
        meta={labels.summary}
        status={loading ? labels.loading : 'Ready'}
        statusTone={loading ? 'offline' : 'synced'}
      />

      <div className="mx-auto max-w-6xl space-y-6 pt-6">
        {!farmId ? (
          <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
            <div className="flex flex-col gap-4 text-slate-700">
              <div className="text-xl font-semibold text-slate-900">{labels.noFarm}</div>
              <p>{labels.viewFarm}</p>
              <Link to="/data-entry" className="inline-flex items-center gap-2 rounded-2xl bg-emerald-700 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-600">
                {labels.dataEntry}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-[1.5fr_0.9fr]">
            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">{labels.alertCount}</p>
                  <h2 className="mt-3 text-3xl font-semibold text-slate-900">{visibleAlerts.length}</h2>
                  <p className="mt-2 text-sm text-slate-600">{openAlerts.length} {labels.reminder.toLowerCase()}</p>
                </div>
                <button
                  type="button"
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
                >
                  {refreshing ? labels.loading : labels.refresh}
                </button>
              </div>
            </div>

            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">{labels.dataEntry}</p>
              <p className="mt-3 text-slate-700">{labels.action}</p>
              <Link to={dataEntryPath} className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-emerald-700 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-600">
                {labels.viewFarm}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        )}

        {farmId && (
          <div className="space-y-4">
            {error && (
              <div className="rounded-[2rem] border border-rose-200 bg-rose-50 p-6 text-rose-700">
                <div className="flex items-center gap-3">
                  <ShieldAlert className="h-5 w-5" />
                  <p>{error}</p>
                </div>
              </div>
            )}

            {loading && !error ? (
              <div className="rounded-[2rem] border border-slate-200 bg-white p-8 text-center text-slate-600 shadow-sm">
                <div className="mx-auto mb-5 h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-slate-900" />
                <p>{labels.loading}</p>
              </div>
            ) : visibleAlerts.length === 0 ? (
              <div className="rounded-[2rem] border border-emerald-200 bg-emerald-50 p-8 text-slate-700 shadow-sm">
                <div className="flex flex-col items-center gap-2 py-12 text-soil-faint">
                  <IconCheckCircle className="w-10 h-10 text-canopy" />
                  <p className="text-sm">Everything looks good</p>
                </div>
              </div>
            ) : (
              <div className="grid gap-4">
                {visibleAlerts.map((alert) => {
                  const severity = SEVERITY_STYLES[alert.severity] || SEVERITY_STYLES.info;
                  return (
                    <div key={alert.id} className={`${severity.border} ${severity.bg} rounded-[2rem] border p-6 shadow-sm`}>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-12 w-12 items-center justify-center rounded-3xl bg-white shadow-sm">
                            {severity.icon}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-slate-600 uppercase tracking-[0.18em]">{alert.severity || labels.reminder}</p>
                            <h3 className="mt-2 text-xl font-semibold text-slate-900">{alert.title}</h3>
                            <p className="mt-2 text-sm text-slate-700">{alert.message}</p>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-3">
                          <span className="text-xs uppercase tracking-[0.24em] text-slate-500">{alert.timestamp ? formatTimeAgo(alert.timestamp) : labels.today}</span>
                          <button
                            type="button"
                            onClick={() => handleDismiss(alert.id)}
                            className="rounded-full border border-slate-300 bg-white px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                          >
                            {labels.dismiss}
                          </button>
                        </div>
                      </div>
                      <div className="mt-4 flex flex-wrap items-center gap-3">
                        {!alert.isRead && (
                          <button
                            type="button"
                            onClick={() => handleMarkRead(alert.id)}
                            className="rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800"
                          >
                            {labels.markRead}
                          </button>
                        )}
                        <Link
                          to={dataEntryPath}
                          className="inline-flex items-center gap-2 rounded-full bg-emerald-700 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-600"
                        >
                          {labels.action}
                          <ArrowRight className="h-4 w-4" />
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
