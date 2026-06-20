// Per-plot card: Input Costs table, Labour Costs table, summary block, validation
import { usePlotDataStore } from '../../store/plotDataStore';
import { useTrialConfigStore } from '../../store/trialConfigStore';
import { useState } from 'react';
import { CBAPerPlotInputCostsTable } from './CBAPerPlotInputCostsTable';
import { CBAPerPlotLabourCostsTable } from './CBAPerPlotLabourCostsTable';
import { CBAPerPlotSummaryBlock } from './CBAPerPlotSummaryBlock';
import { CBAPerPlotValidation } from './CBAPerPlotValidation';

export function CBAPerPlotCard({ plot, plotSizeM2 }) {
  const { plotId, treatment, replicate } = plot;
  const plotData = usePlotDataStore((s) => s.plots[plotId] || {});
  const [tab, setTab] = useState('input');
  const treatmentColor = treatment.startsWith('CA') ? 'var(--fe-ca-text)' : treatment.startsWith('CF') ? 'var(--fe-cf-border)' : 'var(--fe-grey-900)';
  const treatmentBg = treatment.startsWith('CA') ? 'var(--fe-ca-bg)' : treatment.startsWith('CF') ? 'var(--fe-cf-bg)' : 'var(--fe-grey-050)';

  return (
    <div className="p-3" style={{ border: `2px solid ${treatmentBg}`, borderRadius: 12, marginBottom: 24 }}>
      <div className="d-flex align-items-center mb-2">
        <div className="fw-bold me-3" style={{ color: treatmentColor, fontSize: 18 }}>{plotId}</div>
        <div className="badge bg-light text-dark me-2">Treatment: {treatment}</div>
        <div className="badge bg-light text-dark">Replicate: {replicate}</div>
      </div>
      <ul className="nav nav-pills mb-3">
        <li className="nav-item">
          <button className={`nav-link${tab === 'input' ? ' active' : ''}`} onClick={() => setTab('input')}>Input Costs</button>
        </li>
        <li className="nav-item">
          <button className={`nav-link${tab === 'labour' ? ' active' : ''}`} onClick={() => setTab('labour')}>Labour Costs</button>
        </li>
      </ul>
      {tab === 'input' && <CBAPerPlotInputCostsTable plotId={plotId} />}
      {tab === 'labour' && <CBAPerPlotLabourCostsTable plotId={plotId} />}
      <CBAPerPlotSummaryBlock plotId={plotId} plotSizeM2={plotSizeM2} />
      <CBAPerPlotValidation plotId={plotId} />
    </div>
  );
}
