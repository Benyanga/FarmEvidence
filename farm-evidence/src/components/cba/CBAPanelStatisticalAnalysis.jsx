import React from "react";
import { useTrialConfigStore } from "../../store/trialConfigStore";
import { usePlotDataStore } from "../../store/plotDataStore";
import { getRCBDPlotIds, getTreatmentLabels } from "../../utils/rcbdUtils";
import { Table } from "react-bootstrap";
import { anova, posthoc } from "../../engine/statistics/anova";

/**
 * Statistical Analysis Panel (ANOVA, Posthoc)
 * Mirrors the validated Excel workbook structure for RCBD trials.
 * Dynamically generates tables for any number of treatments/replications.
 *
 * Shows:
 *  - ANOVA summary table (Source, SS, df, MS, F, p)
 *  - Posthoc comparison table (if significant)
 *  - All logic is dynamic and matches workbook
 */
export function CBAPanelStatisticalAnalysis() {
  const trialConfig = useTrialConfigStore((s) => s.trialConfig);
  const plotData = usePlotDataStore((s) => s.plotData);
  if (!trialConfig) return null;

  const { treatments } = trialConfig;
  const treatmentLabels = getTreatmentLabels(trialConfig);
  const plotIds = getRCBDPlotIds(trialConfig);

  // Gather net benefit per plot for ANOVA
  const data = plotIds.map((p) => {
    const d = plotData[p.plotId] || {};
    const revenue = d.yieldRevenue ?? 0;
    const totalCost = (d.inputCost ?? 0) + (d.labourCost ?? 0);
    return {
      treatment: p.treatmentIdx,
      replication: p.replicationIdx,
      value: revenue - totalCost,
    };
  });

  // Run ANOVA (RCBD)
  let anovaResult = null;
  let posthocResult = null;
  try {
    anovaResult = anova(data, treatments.length);
    if (anovaResult?.treatment?.p < 0.05) {
      posthocResult = posthoc(data, treatments.length);
    }
  } catch (e) {
    // If not enough data or error, show nothing
    anovaResult = null;
    posthocResult = null;
  }

  return (
    <div className="cba-panel cba-panel-stats">
      <h5>Statistical Analysis (ANOVA, Posthoc)</h5>
      {anovaResult ? (
        <>
          <Table bordered size="sm" className="mb-2">
            <thead>
              <tr>
                <th>Source</th>
                <th>SS</th>
                <th>df</th>
                <th>MS</th>
                <th>F</th>
                <th>p</th>
              </tr>
            </thead>
            <tbody>
              {['treatment', 'block', 'error', 'total'].map((src) => (
                <tr key={src}>
                  <td style={{ textTransform: 'capitalize' }}>{src}</td>
                  <td>{anovaResult[src]?.SS?.toFixed(2) ?? '—'}</td>
                  <td>{anovaResult[src]?.df ?? '—'}</td>
                  <td>{anovaResult[src]?.MS?.toFixed(2) ?? '—'}</td>
                  <td>{anovaResult[src]?.F?.toFixed(2) ?? '—'}</td>
                  <td>{anovaResult[src]?.p?.toExponential(2) ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </Table>
          {anovaResult.treatment?.p < 0.05 && posthocResult && (
            <>
              <div className="fw-bold mb-1">Posthoc Comparison (Tukey HSD)</div>
              <Table bordered size="sm">
                <thead>
                  <tr>
                    <th>Comparison</th>
                    <th>Mean Diff</th>
                    <th>p</th>
                    <th>Significant?</th>
                  </tr>
                </thead>
                <tbody>
                  {posthocResult.map((row, i) => (
                    <tr key={i} style={{ background: row.significant ? 'var(--fe-green-100)' : undefined }}>
                      <td>{treatmentLabels[row.a]} vs {treatmentLabels[row.b]}</td>
                      <td>{row.diff.toFixed(2)}</td>
                      <td>{row.p.toExponential(2)}</td>
                      <td>{row.significant ? 'Yes' : 'No'}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </>
          )}
        </>
      ) : (
        <div className="text-muted">Not enough data for statistical analysis.</div>
      )}
    </div>
  );
}

export default CBAPanelStatisticalAnalysis;
