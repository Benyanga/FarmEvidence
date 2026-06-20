// Main entry point for CBA Data Recording & Analysis in Researcher Mode
import { useState } from 'react';
import { CBATrialParametersPanel } from './CBATrialParametersPanel';
import { CBAPerPlotEntryAccordion } from './CBAPerPlotEntryAccordion';
import { CBASummaryAccordion } from './CBASummaryAccordion';
import { useTrialConfigStore } from '../../store/trialConfigStore';

export function CBAResearcherPanel() {
  const [activeSection, setActiveSection] = useState('data');
  const trialReady = useTrialConfigStore((s) => s.treatments.length >= 2 && s.replications >= 2 && s.trialName);

  return (
    <div className="row g-4">
      <div className="col-lg-3">
        <CBATrialParametersPanel />
      </div>
      <div className="col-lg-9">
        <div className="accordion" id="cbaAccordion">
          <div className="accordion-item">
            <h2 className="accordion-header" id="headingData">
              <button className={`accordion-button${activeSection === 'data' ? '' : ' collapsed'}`} type="button" onClick={() => setActiveSection('data')}>
                Per-Plot Data Entry
              </button>
            </h2>
            <div className={`accordion-collapse collapse${activeSection === 'data' ? ' show' : ''}`}
                 aria-labelledby="headingData" data-bs-parent="var(--fe-graph-blue)ordion">
              <div className="accordion-body p-0">
                <CBAPerPlotEntryAccordion />
              </div>
            </div>
          </div>
          <div className="accordion-item">
            <h2 className="accordion-header" id="headingSummary">
              <button className={`accordion-button${activeSection === 'summary' ? '' : ' collapsed'}`} type="button" onClick={() => setActiveSection('summary')}>
                Summary & CBA Analysis
              </button>
            </h2>
            <div className={`accordion-collapse collapse${activeSection === 'summary' ? ' show' : ''}`}
                 aria-labelledby="headingSummary" data-bs-parent="var(--fe-graph-blue)ordion">
              <div className="accordion-body p-0">
                <CBASummaryAccordion />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
