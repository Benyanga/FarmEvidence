// Accordion for per-plot data entry: tabbed/card grid, one per plot, with Input Costs, Labour Costs, summary, validation
import { useState } from 'react';
import { useTrialConfigStore } from '../../store/trialConfigStore';
import { usePlotDataStore } from '../../store/plotDataStore';
import { generatePlots } from '../../utils/rcbdUtils';
import { CBAPerPlotCard } from './CBAPerPlotCard';

export function CBAPerPlotEntryAccordion() {
  const treatments = useTrialConfigStore((s) => s.treatments);
  const replications = useTrialConfigStore((s) => s.replications);
  const plotSizeM2 = useTrialConfigStore((s) => s.plotSizeM2);
  const plots = generatePlots(treatments, replications);
  const [activePlot, setActivePlot] = useState(plots[0]?.plotId || '');

  return (
    <div className="card">
      <div className="card-header bg-light border-bottom-0">
        <ul className="nav nav-tabs card-header-tabs">
          {plots.map((plot) => (
            <li className="nav-item" key={plot.plotId}>
              <button
                className={`nav-link${activePlot === plot.plotId ? ' active' : ''}`}
                style={{
                  borderBottom: activePlot === plot.plotId ? '3px solid var(--fe-ca-text)' : undefined,
                  color: plot.treatment.startsWith('CA') ? 'var(--fe-ca-text)' : plot.treatment.startsWith('CF') ? 'var(--fe-cf-border)' : 'var(--fe-grey-900)',
                  background: plot.treatment.startsWith('CA') ? 'var(--fe-ca-bg)' : plot.treatment.startsWith('CF') ? 'var(--fe-cf-bg)' : 'var(--fe-grey-050)',
                  fontWeight: 600,
                }}
                onClick={() => setActivePlot(plot.plotId)}
              >
                {plot.plotId}
              </button>
            </li>
          ))}
        </ul>
      </div>
      <div className="card-body p-0">
        {plots.map((plot) => (
          <div key={plot.plotId} style={{ display: activePlot === plot.plotId ? 'block' : 'none' }}>
            <CBAPerPlotCard plot={plot} plotSizeM2={plotSizeM2} />
          </div>
        ))}
      </div>
    </div>
  );
}
