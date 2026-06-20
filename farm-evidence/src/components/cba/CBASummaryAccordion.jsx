// Accordion for all CBA summary and analysis tables
import { useState } from 'react';
import { CBAPanelPlotConfig } from './CBAPanelPlotConfig';
import { CBAPanelProductionCostSummary } from './CBAPanelProductionCostSummary';
import { CBAPanelYieldRevenue } from './CBAPanelYieldRevenue';
import { CBAPanelCBAComparison } from './CBAPanelCBAComparison';
import { CBAPanelLabourDifferential } from './CBAPanelLabourDifferential';
import { CBAPanelConclusion } from './CBAPanelConclusion';
import { CBAPanelStatisticalAnalysis } from './CBAPanelStatisticalAnalysis';
import { useSessionStore } from '../../store/sessionStore';

export function CBASummaryAccordion() {
  const [open, setOpen] = useState('plotConfig');
  const mode = useSessionStore((s) => s.mode);

  return (
    <div className="accordion" id="cbaSummaryAccordion">
      <div className="accordion-item">
        <h2 className="accordion-header" id="headingPlotConfig">
          <button className={`accordion-button${open === 'plotConfig' ? '' : ' collapsed'}`} type="button" onClick={() => setOpen('plotConfig')}>
            PLOT CONFIGURATION
          </button>
        </h2>
        <div className={`accordion-collapse collapse${open === 'plotConfig' ? ' show' : ''}`}
             aria-labelledby="headingPlotConfig" data-bs-parent="#cbaSummaryAccordion">
          <div className="accordion-body p-0">
            <CBAPanelPlotConfig />
          </div>
        </div>
      </div>
      <div className="accordion-item">
        <h2 className="accordion-header" id="headingCostSummary">
          <button className={`accordion-button${open === 'costSummary' ? '' : ' collapsed'}`} type="button" onClick={() => setOpen('costSummary')}>
            PRODUCTION COST SUMMARY — ALL PLOTS
          </button>
        </h2>
        <div className={`accordion-collapse collapse${open === 'costSummary' ? ' show' : ''}`}
             aria-labelledby="headingCostSummary" data-bs-parent="#cbaSummaryAccordion">
          <div className="accordion-body p-0">
            <CBAPanelProductionCostSummary />
          </div>
        </div>
      </div>
      <div className="accordion-item">
        <h2 className="accordion-header" id="headingYieldRevenue">
          <button className={`accordion-button${open === 'yieldRevenue' ? '' : ' collapsed'}`} type="button" onClick={() => setOpen('yieldRevenue')}>
            YIELD & GROSS REVENUE — INPUT TABLE
          </button>
        </h2>
        <div className={`accordion-collapse collapse${open === 'yieldRevenue' ? ' show' : ''}`}
             aria-labelledby="headingYieldRevenue" data-bs-parent="#cbaSummaryAccordion">
          <div className="accordion-body p-0">
            <CBAPanelYieldRevenue />
          </div>
        </div>
      </div>
      <div className="accordion-item">
        <h2 className="accordion-header" id="headingCBAComparison">
          <button className={`accordion-button${open === 'cbaComparison' ? '' : ' collapsed'}`} type="button" onClick={() => setOpen('cbaComparison')}>
            COST-BENEFIT ANALYSIS COMPARISON
          </button>
        </h2>
        <div className={`accordion-collapse collapse${open === 'cbaComparison' ? ' show' : ''}`}
             aria-labelledby="headingCBAComparison" data-bs-parent="#cbaSummaryAccordion">
          <div className="accordion-body p-0">
            <CBAPanelCBAComparison />
          </div>
        </div>
      </div>
      <div className="accordion-item">
        <h2 className="accordion-header" id="headingLabourDiff">
          <button className={`accordion-button${open === 'labourDiff' ? '' : ' collapsed'}`} type="button" onClick={() => setOpen('labourDiff')}>
            LABOUR COST DIFFERENTIAL
          </button>
        </h2>
        <div className={`accordion-collapse collapse${open === 'labourDiff' ? ' show' : ''}`}
             aria-labelledby="headingLabourDiff" data-bs-parent="#cbaSummaryAccordion">
          <div className="accordion-body p-0">
            <CBAPanelLabourDifferential />
          </div>
        </div>
      </div>
      <div className="accordion-item">
        <h2 className="accordion-header" id="headingConclusion">
          <button className={`accordion-button${open === 'conclusion' ? '' : ' collapsed'}`} type="button" onClick={() => setOpen('conclusion')}>
            CONCLUSION & SYSTEM COMPARISON SUMMARY
          </button>
        </h2>
        <div className={`accordion-collapse collapse${open === 'conclusion' ? ' show' : ''}`}
             aria-labelledby="headingConclusion" data-bs-parent="#cbaSummaryAccordion">
          <div className="accordion-body p-0">
            <CBAPanelConclusion />
          </div>
        </div>
      </div>
      {mode === 'RESEARCH' && (
        <div className="accordion-item">
          <h2 className="accordion-header" id="headingStats">
            <button className={`accordion-button${open === 'stats' ? '' : ' collapsed'}`} type="button" onClick={() => setOpen('stats')}>
              Statistical Analysis
            </button>
          </h2>
          <div className={`accordion-collapse collapse${open === 'stats' ? ' show' : ''}`}
               aria-labelledby="headingStats" data-bs-parent="#cbaSummaryAccordion">
            <div className="accordion-body p-0">
              <CBAPanelStatisticalAnalysis />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
