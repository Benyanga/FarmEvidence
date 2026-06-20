import { useEffect, useState } from 'react';
import * as rcbdApi from '../../services/rcbdApi';
import { useTrialConfigStore } from '../../store/trialConfigStore';

export function RCBDTrialConfigPanel() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const config = useTrialConfigStore();

  // Load config from backend on mount
  useEffect(() => {
    setLoading(true);
    rcbdApi.getTrialConfig()
      .then((data) => {
        if (data && typeof data === 'object') config.setConfig(data);
        setLoading(false);
      })
      .catch((e) => {
        setError('Failed to load trial config');
        setLoading(false);
      });
    // eslint-disable-next-line
  }, []);

  // Save config to backend
  const saveConfig = async () => {
    setLoading(true);
    setError('');
    try {
      const payload = {
        trialName: config.trialName,
        crop: config.crop,
        treatments: config.treatments,
        replications: config.replications,
        plotSizeM2: config.plotSizeM2,
        plotDimensions: config.plotDimensions,
        bufferZones: config.bufferZones,
        extrapolationFactor: config.extrapolationFactor,
        variety: config.variety,
        plantingDate: config.plantingDate,
        previousCrop: config.previousCrop,
        season: config.season,
        interRowSpacing: config.interRowSpacing,
        intraRowSpacing: config.intraRowSpacing,
        seedsPerHill: config.seedsPerHill,
        marketPrice: config.marketPrice,
        workingHoursPerDay: config.workingHoursPerDay,
        seedRate: config.seedRate,
        seedPrice: config.seedPrice,
        treatmentDescriptions: config.treatmentDescriptions,
        sharedInputs: config.sharedInputs,
      };
      await rcbdApi.setTrialConfig(payload);
    } catch (e) {
      setError('Failed to save config');
    }
    setLoading(false);
  };

  return (
    <div className="card card--minimal">
      <h2 className="heading-2 mb-2">RCBD Trial Configuration</h2>
      {error && <div className="state-caution mb-2">{error}</div>}
      <div className="grid gap-4 md:grid-cols-2 mb-6">
        <div className="field-group">
          <label className="field-label">Trial Name</label>
          <input className="field-input" value={config.trialName} onChange={e => config.updateField('trialName', e.target.value)} />
        </div>
        <div className="field-group">
          <label className="field-label">Crop</label>
          <input className="field-input" value={config.crop} onChange={e => config.updateField('crop', e.target.value)} />
        </div>
        <div className="field-group">
          <label className="field-label">Treatments (comma separated)</label>
          <input className="field-input" value={config.treatments.join(', ')} onChange={e => config.setTreatments(e.target.value.split(',').map(t => t.trim()).filter(Boolean))} />
        </div>
        <div className="field-group">
          <label className="field-label">Replications</label>
          <input className="field-input" type="number" min="2" value={config.replications} onChange={e => config.setReplications(Number(e.target.value))} />
        </div>
        <div className="field-group">
          <label className="field-label">Plot Size (m²)</label>
          <input className="field-input" type="number" value={config.plotSizeM2} onChange={e => config.setPlotSizeM2(Number(e.target.value))} />
        </div>
        <div className="field-group">
          <label className="field-label">Plot Dimensions</label>
          <input className="field-input" value={config.plotDimensions} onChange={e => config.updateField('plotDimensions', e.target.value)} />
        </div>
      </div>
      <button className="btn btn-primary" onClick={saveConfig} disabled={loading}>Save Configuration</button>
    </div>
  );
}
