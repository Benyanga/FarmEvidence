import { useEffect, useState } from 'react';
import { useTrialContext } from '../../context/TrialContext';
import { updateProfile } from '../../api/auth';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/FormElements';
import { Button } from '../../components/ui/Button';

// NOTE: The Create Trial form (Setup.jsx) and Create Farm form (FarmerSetup.jsx)
// currently hardcode 1200/1500/8/100 in their initial form state.
// Update those forms to read defaults from useTrialContext().user when initializing
// form state so these settings actually take effect.
export function DefaultParamsSettings() {
  const { user, refreshUser } = useTrialContext();
  const [values, setValues] = useState({
    defaultMarketPriceRWF: user?.defaultMarketPriceRWF ?? 1200,
    defaultWageRateRWF: user?.defaultWageRateRWF ?? 1500,
    defaultWorkingHoursPerDay: user?.defaultWorkingHoursPerDay ?? 8,
    defaultPlotSizeM2: user?.defaultPlotSizeM2 ?? 100,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);

  useEffect(() => {
    if (!user) return;
    setValues({
      defaultMarketPriceRWF: user.defaultMarketPriceRWF ?? 1200,
      defaultWageRateRWF: user.defaultWageRateRWF ?? 1500,
      defaultWorkingHoursPerDay: user.defaultWorkingHoursPerDay ?? 8,
      defaultPlotSizeM2: user.defaultPlotSizeM2 ?? 100,
    });
  }, [user]);

  const handleChange = (key, nextValue) => {
    setValues((current) => ({
      ...current,
      [key]: nextValue,
    }));
  };

  const handleSave = async (event) => {
    event.preventDefault();
    setIsSaving(true);

    try {
      await updateProfile({
        defaultMarketPriceRWF: Number(values.defaultMarketPriceRWF),
        defaultWageRateRWF: Number(values.defaultWageRateRWF),
        defaultWorkingHoursPerDay: Number(values.defaultWorkingHoursPerDay),
        defaultPlotSizeM2: Number(values.defaultPlotSizeM2),
      });
      setToastVisible(true);
      window.setTimeout(() => setToastVisible(false), 2500);
      await refreshUser();
    } catch (error) {
      console.error('Unable to save default economic parameters:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card className="space-y-6 p-6">
      <div>
        <h2 className="text-xl font-semibold text-slate-900">Default Economic Parameters</h2>
        <p className="mt-2 text-sm text-slate-600">
          These values pre-fill whenever you create a new Trial or Farm. You can still override them per Trial/Farm during setup.
        </p>
      </div>

      <form onSubmit={handleSave} className="grid gap-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-700">Default Market Price (RWF/kg)</span>
            <Input
              type="number"
              className="font-mono"
              value={values.defaultMarketPriceRWF}
              onChange={(e) => handleChange('defaultMarketPriceRWF', e.target.value)}
              min="0"
              step="1"
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-700">Default Wage Rate (RWF/day)</span>
            <Input
              type="number"
              className="font-mono"
              value={values.defaultWageRateRWF}
              onChange={(e) => handleChange('defaultWageRateRWF', e.target.value)}
              min="0"
              step="1"
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-700">Default Working Hours/Day</span>
            <Input
              type="number"
              className="font-mono"
              value={values.defaultWorkingHoursPerDay}
              onChange={(e) => handleChange('defaultWorkingHoursPerDay', e.target.value)}
              min="0"
              step="1"
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-700">Default Plot Size (m²)</span>
            <Input
              type="number"
              className="font-mono"
              value={values.defaultPlotSizeM2}
              onChange={(e) => handleChange('defaultPlotSizeM2', e.target.value)}
              min="0"
              step="1"
            />
          </label>
        </div>

        <div className="flex items-center gap-4">
          <Button type="submit" disabled={isSaving}>
            {isSaving ? 'Saving…' : 'Save Defaults'}
          </Button>
          {toastVisible ? (
            <div className="rounded-full bg-emerald-100 px-4 py-2 text-sm font-medium text-emerald-700">
              Defaults updated
            </div>
          ) : null}
        </div>
      </form>
    </Card>
  );
}
