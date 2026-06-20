import { useMemo, useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import { useTrialContext } from "../../context/TrialContext";
import { IconXCircle, IconAlertTriangle, IconInfoCircle, IconCheckCircle } from "../../components/ui/Icons";

const SEVERITY_MAP = {
  error: { label: "Errors", badge: "bg-red-100 text-red-800", border: "border-l-red-500" },
  warning: { label: "Warnings", badge: "bg-amber-100 text-amber-800", border: "border-l-amber-500" },
  info: { label: "Info", badge: "bg-blue-100 text-blue-800", border: "border-l-blue-500" },
  success: { label: "Success", badge: "bg-emerald-100 text-emerald-800", border: "border-l-emerald-500" },
};

function formatTimeAgo(timestamp) {
  const now = new Date();
  const then = new Date(timestamp);
  const seconds = Math.floor((now - then) / 1000);

  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

// Time-based alert templates
function generateTimeBasedAlerts(trial) {
  const alerts = [];
  if (!trial) return alerts;

  const now = new Date();
  const lastActivityDate = new Date(trial.lastActivityDate || trial.createdAt);
  const daysSinceLastActivity = Math.floor((now - lastActivityDate) / (1000 * 60 * 60 * 24));

  // Weed score reminder (7 days since planting)
  if (daysSinceLastActivity >= 7) {
    alerts.push({
      id: `time-weeds-${trial.id}`,
      severity: "warning",
      title: "Weed Emergence Check",
      message: `It has been ${daysSinceLastActivity} days since planting at ${trial.name || "your trial"}. Please visit the field to check for weed emergence and record your weed pressure score.`,
      isTimeBase: true,
      timestamp: new Date(),
    });
  }

  // General observation reminder (14 days)
  if (daysSinceLastActivity >= 14) {
    alerts.push({
      id: `time-obs-${trial.id}`,
      severity: "warning",
      title: "Field Observation Due",
      message: "It has been 14+ days since last field observation. Please assess crop vigor and pest presence and update your records.",
      isTimeBase: true,
      timestamp: new Date(),
    });
  }

  // Soil score reminder
  if (!trial.soilScoreRecorded) {
    alerts.push({
      id: `time-soil-${trial.id}`,
      severity: "info",
      title: "Soil Condition Update Needed",
      message: "Please update soil condition indicators (color score, fauna count, moisture) to track soil health progression and enable SOM-linked fertilizer projections.",
      isTimeBase: true,
      timestamp: new Date(),
    });
  }

  return alerts;
}

function shouldShowAlertByPrefs(alert, prefs) {
  const trigger = String(alert.trigger || '').toLowerCase();
  if (trigger === 'weed_pressure_high') return prefs.weedPressureAlerts;
  if (trigger === 'pest_incidence_high') return prefs.pestIncidenceAlerts;
  if (trigger === 'bcr_below_one' || trigger === 'bcr_below_one_cf') return prefs.bcrLossAlerts;
  if (trigger === 'delta_c_positive') return prefs.deltaCUpdates;
  if (trigger === 'yield_missing' || alert.isTimeBase) return prefs.timeBasedReminders;
  return prefs.timeBasedReminders;
}

export function AlertsPage() {
  const { trialId } = useParams();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeFilter, setActiveFilter] = useState("All");
  const [showDismissed, setShowDismissed] = useState(false);
  const [timeBasedExpanded, setTimeBasedExpanded] = useState(true);
  const [trial, setTrial] = useState(null);
  const [checking, setChecking] = useState(false);

  // Fetch notifications and trial data
  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const [notifRes, countRes, trialRes] = await Promise.all([
        fetch(`/api/notifications/trial/${trialId}`),
        fetch(`/api/notifications/trial/${trialId}/count`),
        fetch(`/api/trials/${trialId}`),
      ]);

      if (notifRes.ok) {
        const notifData = await notifRes.json();
        setNotifications(Array.isArray(notifData) ? notifData : []);
      }
      if (countRes.ok) {
        const countData = await countRes.json();
        setUnreadCount(countData.unreadCount || 0);
      }
      if (trialRes.ok) {
        const trialData = await trialRes.json();
        setTrial(trialData);
      }
    } catch (err) {
      console.error("[Alerts] Fetch error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [trialId]);

  // Initial fetch
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Poll for updates every 60 seconds
  useEffect(() => {
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Handle run check
  const handleRunCheck = async () => {
    try {
      setChecking(true);
      const res = await fetch(`/api/notifications/check/${trialId}`, { method: "POST" });
      if (res.ok) {
        // Refresh after check completes
        await fetchNotifications();
      }
    } catch (err) {
      console.error("[Alerts] Check error:", err);
    } finally {
      setChecking(false);
    }
  };

  // Handle mark read
  const handleMarkRead = async (notificationId) => {
    try {
      await fetch(`/api/notifications/${notificationId}/read`, { method: "PATCH" });
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, isRead: true } : n))
      );
    } catch (err) {
      console.error("[Alerts] Mark read error:", err);
    }
  };

  // Handle dismiss
  const handleDismiss = async (notificationId) => {
    try {
      await fetch(`/api/notifications/${notificationId}/dismiss`, { method: "PATCH" });
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, isDismissed: true } : n))
      );
    } catch (err) {
      console.error("[Alerts] Dismiss error:", err);
    }
  };

  // Combine time-based and API notifications
  const timeBasedAlerts = useMemo(() => generateTimeBasedAlerts(trial), [trial]);
  const allAlerts = useMemo(() => [...notifications, ...timeBasedAlerts], [notifications, timeBasedAlerts]);

  // Filter logic
  const visibleAlerts = useMemo(() => {
    return allAlerts.filter((alert) => !showDismissed ? !alert.isDismissed : true);
  }, [allAlerts, showDismissed]);

  const { user } = useTrialContext();
  const notificationPrefs = user?.notificationPrefs ?? {
    timeBasedReminders: true,
    weedPressureAlerts: true,
    pestIncidenceAlerts: true,
    bcrLossAlerts: true,
    deltaCUpdates: true,
    emailDigest: false,
  };

  const SEVERITY_ICON = {
    error: <IconXCircle className="w-5 h-5 text-terracotta flex-shrink-0" />,
    warning: <IconAlertTriangle className="w-5 h-5 text-amber flex-shrink-0" />,
    info: <IconInfoCircle className="w-5 h-5 text-sky flex-shrink-0" />,
    success: <IconCheckCircle className="w-5 h-5 text-canopy flex-shrink-0" />,
  };

  const visibleAlerts = useMemo(() => {
    const filtered = allAlerts.filter((alert) => (!showDismissed ? !alert.isDismissed : true));
    return filtered.filter((alert) => shouldShowAlertByPrefs(alert, notificationPrefs));
  }, [allAlerts, showDismissed, notificationPrefs]);

  const filteredAlerts = useMemo(() => {
    let filtered = visibleAlerts;

    // Severity filter
    if (activeFilter !== "All" && activeFilter !== "Unread only") {
      const severity = activeFilter.toLowerCase();
      filtered = filtered.filter((a) => a.severity === severity);
    }

    // Unread filter
    if (activeFilter === "Unread only") {
      filtered = filtered.filter((a) => !a.isRead);
    }

    return filtered;
  }, [visibleAlerts, activeFilter]);

  // Count summary
  const counts = useMemo(() => {
    const summary = { total: visibleAlerts.length, error: 0, warning: 0, info: 0, success: 0 };
    visibleAlerts.forEach((alert) => {
      summary[alert.severity]++;
    });
    return summary;
  }, [visibleAlerts]);

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-80px)] bg-slate-50 p-6 md:p-10 flex items-center justify-center">
        <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-slate-900 mx-auto mb-4" />
          <p className="text-slate-600">Loading alerts…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-80px)] bg-slate-50 p-6 md:p-10">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* HEADER ROW */}
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-semibold text-slate-900">Advisory Alerts</h1>
          <button
            type="button"
            disabled={checking}
            onClick={handleRunCheck}
            className="rounded-2xl bg-emerald-600 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:bg-slate-400"
          >
            {checking ? "Checking…" : "Run Check"}
          </button>
        </div>

        {/* SUMMARY BADGES ROW */}
        <div className="grid gap-4 md:grid-cols-5">
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-sm font-semibold text-slate-600">Total</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">{counts.total}</p>
          </div>
          {Object.entries(SEVERITY_MAP).map(([severity, config]) => (
            <div
              key={severity}
              className={`rounded-2xl border border-slate-200 ${config.badge} p-4`}
            >
              <p className="text-sm font-semibold">{config.label}</p>
              <p className="mt-2 text-3xl font-bold">{counts[severity]}</p>
            </div>
          ))}
        </div>

        {/* FILTER BAR */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="flex flex-wrap gap-2">
            {["All", "Errors", "Warnings", "Info", "Success", "Unread only"].map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  activeFilter === filter
                    ? "bg-slate-900 text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        {/* EMPTY STATE */}
        {allAlerts.length === 0 && (
          <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-6">
            <p className="text-sm font-semibold text-emerald-900">
              ✓ All systems nominal — no active alerts
            </p>
          </div>
        )}

        {/* TIME-BASED ALERT SECTION */}
        {timeBasedAlerts.length > 0 && (
          <div className="rounded-3xl border border-slate-200 bg-white overflow-hidden">
            <button
              type="button"
              onClick={() => setTimeBasedExpanded(!timeBasedExpanded)}
              className="w-full px-6 py-4 bg-slate-50 hover:bg-slate-100 border-b border-slate-200 flex items-center justify-between"
            >
              <h2 className="text-lg font-semibold text-slate-900">
                Scheduled Monitoring Reminders
              </h2>
              <span className="text-sm text-slate-600">
                {timeBasedExpanded ? "▼" : "▶"}
              </span>
            </button>

            {timeBasedExpanded && (
              <div className="divide-y divide-slate-200">
                {timeBasedAlerts.map((alert) => {
                  const config = SEVERITY_MAP[alert.severity] || SEVERITY_MAP.info;
                  return (
                    <div
                      key={alert.id}
                      className={`border-l-4 ${config.border} p-4 hover:bg-slate-50 transition`}
                    >
                      <div className="flex gap-3">
                        {SEVERITY_ICON[alert.severity] || SEVERITY_ICON.info}
                        <div className="flex-1">
                          <h3 className="font-semibold text-slate-900">{alert.title}</h3>
                          <p className="mt-1 text-sm text-slate-600">{alert.message}</p>
                          <p className="mt-2 text-xs text-slate-500">{formatTimeAgo(alert.timestamp)}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* CONDITION-BASED ALERT SECTION */}
        {notifications.length > 0 && (
          <div className="rounded-3xl border border-slate-200 bg-white overflow-hidden">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200">
              <h2 className="text-lg font-semibold text-slate-900">
                Field Condition Alerts
              </h2>
            </div>

            {filteredAlerts.length === 0 ? (
              <div className="p-6 text-center text-slate-600">
                <p className="text-sm">No alerts match the selected filter.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-200">
                {filteredAlerts.map((alert) => {
                  const config = SEVERITY_MAP[alert.severity] || SEVERITY_MAP.error;
                  return (
                    <div
                      key={alert.id}
                      className={`border-l-4 ${config.border} p-4 hover:bg-slate-50 transition ${
                        alert.isRead ? "opacity-75" : ""
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {SEVERITY_ICON[alert.severity] || SEVERITY_ICON.info}
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-slate-900">
                              {alert.title}
                            </h3>
                            {alert.plotId && (
                              <span className="text-xs font-semibold px-2 py-1 rounded bg-slate-100 text-slate-700">
                                {alert.plotId}
                              </span>
                            )}
                            {alert.isRead && (
                              <span className="text-xs font-semibold px-2 py-1 rounded bg-slate-100 text-slate-600">
                                Read
                              </span>
                            )}
                          </div>
                          <p className="mt-2 text-sm text-slate-700">{alert.message}</p>
                          <p className="mt-2 text-xs text-slate-500">
                            Triggered {formatTimeAgo(alert.timestamp)}
                          </p>
                        </div>
                        <div className="flex flex-col gap-2 flex-shrink-0">
                          {!alert.isRead && (
                            <button
                              type="button"
                              onClick={() => handleMarkRead(alert.id)}
                              className="text-xs font-semibold px-3 py-1 rounded-full bg-blue-100 text-blue-800 hover:bg-blue-200"
                            >
                              Mark Read
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleDismiss(alert.id)}
                            className="text-xs font-semibold px-3 py-1 rounded-full bg-slate-100 text-slate-800 hover:bg-slate-200"
                          >
                            Dismiss
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* SHOW DISMISSED TOGGLE */}
        {notifications.some((n) => n.isDismissed) && (
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={showDismissed}
              onChange={(e) => setShowDismissed(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-slate-900"
            />
            <label className="text-sm font-medium text-slate-700">Show dismissed</label>
          </div>
        )}
      </div>
    </div>
  );
}
