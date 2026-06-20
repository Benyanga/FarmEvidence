import { useEffect, useState } from 'react';
import { useTrialContext } from '../../context/TrialContext';
import { updateProfile } from '../../api/auth';
import { Card } from '../../components/ui/Card';

const LANGUAGE_OPTIONS = [
  { key: 'en', label: 'English', description: 'Display app labels and text in English.' },
  { key: 'kin', label: 'Kinyarwanda', description: 'Display app labels and text in Kinyarwanda where available.' },
];

const DATE_FORMAT_OPTIONS = [
  { key: 'DD/MM/YYYY', label: 'DD/MM/YYYY', description: 'Day first format used in Rwanda.' },
  { key: 'MM/DD/YYYY', label: 'MM/DD/YYYY', description: 'Month first format common in the US.' },
];

export function LanguageSettings() {
  const { user, setLang, refreshUser } = useTrialContext();
  const [selectedLanguage, setSelectedLanguage] = useState(user?.language || 'en');
  const [selectedDateFormat, setSelectedDateFormat] = useState(user?.dateFormat || 'DD/MM/YYYY');
  const [savingLanguage, setSavingLanguage] = useState(false);
  const [savingDateFormat, setSavingDateFormat] = useState(false);

  useEffect(() => {
    if (user) {
      setSelectedLanguage(user.language || 'en');
      setSelectedDateFormat(user.dateFormat || 'DD/MM/YYYY');
    }
  }, [user]);

  const handleLanguageSelect = async (language) => {
    setSelectedLanguage(language);
    setSavingLanguage(true);
    try {
      await updateProfile({ language });
      setLang(language);
      await refreshUser();
    } catch (error) {
      console.error('Failed to save language:', error);
    } finally {
      setSavingLanguage(false);
    }
  };

  const handleDateFormatSelect = async (dateFormat) => {
    setSelectedDateFormat(dateFormat);
    setSavingDateFormat(true);
    try {
      await updateProfile({ dateFormat });
      await refreshUser();
    } catch (error) {
      console.error('Failed to save date format:', error);
    } finally {
      setSavingDateFormat(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card accent="none" className="space-y-6 p-6">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Display Language</h2>
          <p className="mt-2 text-sm text-slate-600">Choose the language used for app labels and navigation.</p>
          {selectedLanguage === 'kin' && user?.mode === 'researcher' ? (
            <div className="mt-4 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
              Kinyarwanda translation for Researcher Mode is limited — most pages will display in English.
            </div>
          ) : null}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {LANGUAGE_OPTIONS.map((option) => {
            const selected = selectedLanguage === option.key;
            return (
              <Card
                key={option.key}
                accent="none"
                className={`cursor-pointer rounded-3xl border p-5 transition ${selected ? 'border-canopy shadow-sm' : 'border-slate-200 hover:border-slate-400'}`}
                onClick={() => handleLanguageSelect(option.key)}
              >
                <h3 className="text-base font-semibold text-slate-900">{option.label}</h3>
                <p className="mt-2 text-sm text-slate-600">{option.description}</p>
                {selected ? <div className="mt-4 inline-flex rounded-full bg-canopy-pale px-3 py-1 text-sm font-medium text-canopy">Selected</div> : null}
              </Card>
            );
          })}
        </div>
      </Card>

      <Card accent="none" className="p-6">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Currency Display</h2>
          <p className="mt-2 text-sm text-slate-600">Currently fixed to Rwandan Francs (RWF). Multi-currency support is planned for future regions.</p>
          <div className="mt-4 inline-flex rounded-full bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-900">RWF</div>
        </div>
      </Card>

      <Card accent="none" className="space-y-6 p-6">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Date Format</h2>
          <p className="mt-2 text-sm text-slate-600">Choose how dates are displayed throughout the app.</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {DATE_FORMAT_OPTIONS.map((option) => {
            const selected = selectedDateFormat === option.key;
            return (
              <Card
                key={option.key}
                accent="none"
                className={`cursor-pointer rounded-3xl border p-5 transition ${selected ? 'border-canopy shadow-sm' : 'border-slate-200 hover:border-slate-400'}`}
                onClick={() => handleDateFormatSelect(option.key)}
              >
                <h3 className="text-base font-semibold text-slate-900">{option.label}</h3>
                <p className="mt-2 text-sm text-slate-600">{option.description}</p>
                {selected ? <div className="mt-4 inline-flex rounded-full bg-canopy-pale px-3 py-1 text-sm font-medium text-canopy">Selected</div> : null}
              </Card>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
