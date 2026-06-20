// Collapsible sidebar for trial parameters, fully dynamic
import { useTrialConfigStore } from '../../store/trialConfigStore';
import { useState } from 'react';

export function CBATrialParametersPanel() {
  const config = useTrialConfigStore();
  const [open, setOpen] = useState(true);

  return (
    <div className="card mb-3">
      <div className="card-header d-flex justify-content-between align-items-center bg-light" style={{ cursor: 'pointer' }} onClick={() => setOpen((v) => !v)}>
        <span className="fw-bold">Trial Parameters</span>
        <span className="badge bg-secondary">{open ? 'Hide' : 'Show'}</span>
      </div>
      {open && (
        <div className="card-body p-3" style={{ maxHeight: 600, overflowY: 'auto' }}>
          <div className="mb-3">
            <label className="form-label">Trial Name / Site</label>
            <input className="form-control" value={config.trialName} onChange={e => config.updateField('trialName', e.target.value)} />
          </div>
          <div className="mb-3">
            <label className="form-label">Design</label>
            <input className="form-control" value="RCBD" readOnly />
          </div>
          <div className="mb-3 row g-2 align-items-center">
            <div className="col-6">
              <label className="form-label">Number of Treatments</label>
              <input type="number" min={2} className="form-control" value={config.treatments.length} readOnly />
            </div>
            <div className="col-6">
              <label className="form-label">Number of Replications</label>
              <input type="number" min={2} className="form-control" value={config.replications} onChange={e => config.setReplications(Number(e.target.value))} />
            </div>
          </div>
          <div className="mb-3">
            <label className="form-label">Treatment Labels</label>
            {config.treatments.map((t, i) => (
              <input key={i} className="form-control mb-1" value={t} onChange={e => {
                const next = [...config.treatments]; next[i] = e.target.value; config.setTreatments(next);
              }} />
            ))}
          </div>
          <div className="mb-3 row g-2 align-items-center">
            <div className="col-6">
              <label className="form-label">Total Plots</label>
              <input className="form-control" value={config.treatments.length * config.replications} readOnly />
            </div>
            <div className="col-6">
              <label className="form-label">Plot Size (m²)</label>
              <input type="number" className="form-control" value={config.plotSizeM2} onChange={e => config.setPlotSizeM2(Number(e.target.value))} />
            </div>
          </div>
          <div className="mb-3">
            <label className="form-label">Plot Dimensions</label>
            <input className="form-control" value={config.plotDimensions} onChange={e => config.updateField('plotDimensions', e.target.value)} />
          </div>
          <div className="mb-3">
            <label className="form-label">Buffer Zones</label>
            <input className="form-control" value={config.bufferZones} onChange={e => config.updateField('bufferZones', e.target.value)} />
          </div>
          <div className="mb-3">
            <label className="form-label">Extrapolation Factor</label>
            <input className="form-control" value={config.extrapolationFactor} readOnly />
          </div>
          <div className="mb-3">
            <label className="form-label">Crop</label>
            <input className="form-control" value={config.crop} onChange={e => config.updateField('crop', e.target.value)} />
          </div>
          <div className="mb-3">
            <label className="form-label">Variety</label>
            <input className="form-control" value={config.variety} onChange={e => config.updateField('variety', e.target.value)} />
          </div>
          <div className="mb-3">
            <label className="form-label">Planting Date</label>
            <input type="date" className="form-control" value={config.plantingDate} onChange={e => config.updateField('plantingDate', e.target.value)} />
          </div>
          <div className="mb-3">
            <label className="form-label">Previous Crop</label>
            <input className="form-control" value={config.previousCrop} onChange={e => config.updateField('previousCrop', e.target.value)} />
          </div>
          <div className="mb-3">
            <label className="form-label">Season</label>
            <input className="form-control" value={config.season} onChange={e => config.updateField('season', e.target.value)} />
          </div>
          <div className="mb-3 row g-2 align-items-center">
            <div className="col-6">
              <label className="form-label">Inter-row Spacing (cm)</label>
              <input type="number" className="form-control" value={config.interRowSpacing} onChange={e => config.updateField('interRowSpacing', Number(e.target.value))} />
            </div>
            <div className="col-6">
              <label className="form-label">Intra-row Spacing (cm)</label>
              <input type="number" className="form-control" value={config.intraRowSpacing} onChange={e => config.updateField('intraRowSpacing', Number(e.target.value))} />
            </div>
          </div>
          <div className="mb-3 row g-2 align-items-center">
            <div className="col-6">
              <label className="form-label">Seeds per Hill</label>
              <input type="number" className="form-control" value={config.seedsPerHill} onChange={e => config.updateField('seedsPerHill', Number(e.target.value))} />
            </div>
            <div className="col-6">
              <label className="form-label">Market Price (RWF/kg)</label>
              <input type="number" className="form-control" value={config.marketPrice} onChange={e => config.updateField('marketPrice', Number(e.target.value))} />
            </div>
          </div>
          <div className="mb-3 row g-2 align-items-center">
            <div className="col-6">
              <label className="form-label">Working Hours per Day</label>
              <input type="number" className="form-control" value={config.workingHoursPerDay} onChange={e => config.updateField('workingHoursPerDay', Number(e.target.value))} />
            </div>
          </div>
          <div className="mb-3 row g-2 align-items-center">
            <div className="col-6">
              <label className="form-label">Seed Rate (kg/plot)</label>
              <input type="number" className="form-control" value={config.seedRate} onChange={e => config.updateField('seedRate', Number(e.target.value))} />
            </div>
            <div className="col-6">
              <label className="form-label">Seed Price (RWF/kg)</label>
              <input type="number" className="form-control" value={config.seedPrice} onChange={e => config.updateField('seedPrice', Number(e.target.value))} />
            </div>
          </div>
          <div className="mb-3">
            <label className="form-label">Treatment Descriptions</label>
            {config.treatments.map((t, i) => (
              <div key={t} className="border rounded p-2 mb-2 bg-light">
                <div className="fw-bold mb-1">{t}</div>
                <input className="form-control mb-1" placeholder="Soil Disturbance" value={config.treatmentDescriptions?.[t]?.soilDisturbance || ''} onChange={e => config.updateTreatmentDescriptions(t, { ...config.treatmentDescriptions?.[t], soilDisturbance: e.target.value })} />
                <input className="form-control mb-1" placeholder="Soil Cover" value={config.treatmentDescriptions?.[t]?.soilCover || ''} onChange={e => config.updateTreatmentDescriptions(t, { ...config.treatmentDescriptions?.[t], soilCover: e.target.value })} />
                <input className="form-control mb-1" placeholder="Crop Rotation/Sequence" value={config.treatmentDescriptions?.[t]?.cropRotation || ''} onChange={e => config.updateTreatmentDescriptions(t, { ...config.treatmentDescriptions?.[t], cropRotation: e.target.value })} />
                <input className="form-control mb-1" placeholder="Notes" value={config.treatmentDescriptions?.[t]?.notes || ''} onChange={e => config.updateTreatmentDescriptions(t, { ...config.treatmentDescriptions?.[t], notes: e.target.value })} />
              </div>
            ))}
          </div>
          <div className="mb-3">
            <label className="form-label">Cost Classification Reference</label>
            <div className="row">
              <div className="col-6">
                <div className="fw-bold">C_SD (System-Dependent)</div>
                <ul className="mb-0 small">
                  <li>Land preparation</li>
                  <li>Mulching/Residue management</li>
                  <li>Weeding</li>
                </ul>
              </div>
              <div className="col-6">
                <div className="fw-bold">C_SI (System-Independent)</div>
                <ul className="mb-0 small">
                  <li>Seeds</li>
                  <li>Fertiliser</li>
                  <li>Planting labour</li>
                  <li>Irrigation</li>
                  <li>Pest control</li>
                  <li>Harvest labour</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
