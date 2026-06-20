import { useState, useEffect } from 'react';
import { useTrialContext } from '../../context/TrialContext';
import { updateProfile } from '../../api/auth';
import { Card } from '../../components/ui/Card';

const PREFS = [
  {
    key: 'timeBasedReminders',
    label: 'Time-based reminders',
    help: 'Reminders to check your field for weeds, pests, and soil conditions on a schedule.',
  },
  {
    key: 'weedPressureAlerts',
    label: 'Weed pressure alerts',
    help: 'Notify me when weed pressure score reaches a concerning level.',
  },
  {
    key: 'pestIncidenceAlerts',
    label: 'Pest incidence alerts',
    help: 'Notify me when pest damage exceeds 30% of plants.',
  },
  {
    key: 'bcrLossAlerts',
    label: 'Profitability alerts',
    help: 'Notify me if my Benefit-Cost Ratio drops below 1.0 (operating at a loss).',
  },
  {
    key: 'deltaCUpdates',
    label: 'Cost-efficiency updates',
    help: 'Notify me when my system\'s cost-efficiency compared to baseline changes.',
  },
  {
    key: 'emailDigest',
    label: 'Email digest',
    help: 'Receive a weekly summary email of your alerts. (Email delivery is not yet implemented — this preference is saved for when it is.)',
  },
];

function Toggle({ checked, onChange }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
        checked ? 'bg-canopy' : 'bg-ledger'
      }`}
    >
      <span
        className={`inline-block h-5 w-5 transform rounded-full bg-white transition ${
          checked ? 'translate-x-5' : 'translate-x-1'
        }`}
      />
    </button>
  );
}

export function NotificationSettings() {
  const { user, refreshUser } = useTrialContext();
  const [prefs, setPrefs] = useState(user?.notificationPrefs || {});
  const [savedKey, setSavedKey] = useState(null);

  useEffect(() => {
    setPrefs(user?.notificationPrefs || {});
  }, [user?.notificationPrefs]);

  const handleToggle = async (key, value) => {
    const nextPrefs = { ...prefs, [key]: value };
    setPrefs(nextPrefs);

    try {
      await updateProfile({ notificationPrefs: nextPrefs });
      await refreshUser();
      setSavedKey(key);
      window.setTimeout(() => setSavedKey((current) => (current === key ? null : current)), 1500);
    } catch (error) {
      console.error('Failed to update notification preference:', error);
      setPrefs(user?.notificationPrefs || {});
    }
  };

  return (
    <div className="space-y-6">
      <Card accent="none" className="space-y-6 p-6">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Notification Preferences</h2>
          <p className="mt-2 text-sm text-slate-600">Control which alerts the app shows based on your preferences.</p>
        </div>

        <div className="space-y-4">
          {PREFS.map((pref) => {
            const checked = Boolean(prefs[pref.key]);
            return (
              <div key={pref.key} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-base font-semibold text-slate-900">{pref.label}</p>
                    <p className="mt-2 text-sm text-slate-600">{pref.help}</p>
                    {savedKey === pref.key && (
                      <p className="mt-2 text-sm font-medium text-emerald-700">Saved</p>
                    )}
                  </div>
                  <Toggle checked={checked} onChange={(value) => handleToggle(pref.key, value)} />
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
