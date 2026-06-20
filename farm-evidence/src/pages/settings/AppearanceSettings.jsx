import { useState, useEffect } from 'react';
import { useTrialContext } from '../../context/TrialContext';
import { updateProfile } from '../../api/auth';
import { Card } from '../../components/ui/Card';

const THEMES = [
  { key: 'light', label: 'Light', description: 'Bright interface with light backgrounds.' },
  { key: 'dark', label: 'Dark', description: 'Dark interface using dark-mode tokens.' },
  { key: 'system', label: 'System', description: 'Match your operating system preference.' },
];

const swatchClasses = {
  light: 'bg-mist border border-slate-200',
  dark: 'bg-slate-950 border border-slate-700',
  system: 'bg-gradient-to-br from-mist via-paper to-soil border border-slate-200',
};

export function AppearanceSettings() {
  const { user, refreshUser } = useTrialContext();
  const [selectedTheme, setSelectedTheme] = useState(user?.theme || 'system');
  const [systemPrefersDark, setSystemPrefersDark] = useState(
    typeof window !== 'undefined' && window.matchMedia
      ? window.matchMedia('(prefers-color-scheme: dark)').matches
      : false
  );
  const [saving, setSaving] = useState(false);

  const applyTheme = (theme, prefersDark) => {
    const useDark = theme === 'dark' || (theme === 'system' && prefersDark);
    document.documentElement.classList.toggle('dark', useDark);
  };

  useEffect(() => {
    applyTheme(selectedTheme, systemPrefersDark);
  }, [selectedTheme, systemPrefersDark]);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (event) => setSystemPrefersDark(event.matches);
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  useEffect(() => {
    if (user?.theme) {
      setSelectedTheme(user.theme);
    }
  }, [user?.theme]);

  const handleSelectTheme = async (theme) => {
    setSelectedTheme(theme);
    setSaving(true);
    try {
      await updateProfile({ theme });
      await refreshUser();
    } catch (error) {
      console.error('Failed to save theme:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card accent="none" className="space-y-6 p-6">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Appearance Settings</h2>
          <p className="mt-2 text-sm text-slate-600">Activate the app theme across reloads and follow OS preferences if desired.</p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {THEMES.map((theme) => {
            const isSelected = theme.key === selectedTheme;
            return (
              <Card
                key={theme.key}
                accent="none"
                className={`cursor-pointer border ${isSelected ? 'border-canopy shadow-sm' : 'border-slate-200'} p-5 transition hover:border-canopy`}
                onClick={() => handleSelectTheme(theme.key)}
              >
                <div className="mb-4 flex h-28 items-center justify-center rounded-3xl shadow-inner">
                  <div className={`h-24 w-24 rounded-3xl ${swatchClasses[theme.key]}`} />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-slate-900">{theme.label}</h3>
                  <p className="mt-2 text-sm text-slate-600">{theme.description}</p>
                </div>
                {isSelected ? (
                  <div className="mt-4 inline-flex rounded-full bg-canopy-pale px-3 py-1 text-sm font-medium text-canopy">
                    Selected
                  </div>
                ) : null}
              </Card>
            );
          })}
        </div>

        <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
          <p className="font-medium text-slate-900">Note</p>
          <p className="mt-2">
            The dark mode style flips the app colors using the existing <code className="rounded bg-slate-100 px-1 py-0.5">.dark</code> CSS variables.
          </p>
        </div>
      </Card>
    </div>
  );
}
