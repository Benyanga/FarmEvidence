import React from "react";
import { useTrialConfigStore } from "../../store/trialConfigStore";
import { usePlotDataStore } from "../../store/plotDataStore";
import { Table } from "react-bootstrap";
import { getRCBDPlotIds, getTreatmentLabels } from "../../utils/rcbdUtils";

/**
 * Labour Cost Differential Table
 * Mirrors the validated Excel workbook structure for RCBD trials.
 * Dynamically generates rows/columns for any number of treatments/replications.
 *
 * Shows, for each treatment:
 *  - Mean Labour Cost per Plot
 *  - Labour Cost Differential (vs. Control/Reference)
 *  - Color rules: highlight negative/positive differentials
 */
export default function CBAPanelLabourCostDifferential() {
  const trialConfig = useTrialConfigStore((s) => s.trialConfig);
  const plotData = usePlotDataStore((s) => s.plotData);
  if (!trialConfig) return null;

  const { treatments, replications, controlTreatmentIndex = 0 } = trialConfig;
  const treatmentLabels = getTreatmentLabels(trialConfig);
  const plotIds = getRCBDPlotIds(trialConfig);

  // Compute mean labour cost per treatment
  const meanLabourCosts = treatments.map((_, tIdx) => {
    const plots = plotIds.filter((p) => p.treatmentIdx === tIdx);
    const costs = plots.map((p) => plotData[p.plotId]?.labourCost ?? 0);
    if (costs.length === 0) return 0;
    return costs.reduce((a, b) => a + b, 0) / costs.length;
  });

  // Control/reference mean
  const controlMean = meanLabourCosts[controlTreatmentIndex] ?? 0;

  // Compute differentials
  const differentials = meanLabourCosts.map((mean) => mean - controlMean);

  // Color rule: negative = green (cost saving), positive = red (cost increase), zero = default
  function diffColor(val) {
    if (val < 0) return "var(--fe-green-100)"; // greenish
    if (val > 0) return "var(--fe-error-bg)"; // reddish
    return undefined;
  }

  return (
    <div className="cba-panel cba-panel-labour-diff">
      <h5>Labour Cost Differential</h5>
      <Table bordered size="sm" className="mb-0">
        <thead>
          <tr>
            <th>Treatment</th>
            <th>Mean Labour Cost per Plot</th>
            <th>Labour Cost Differential vs. {treatmentLabels[controlTreatmentIndex]}</th>
          </tr>
        </thead>
        <tbody>
          {treatments.map((_, tIdx) => (
            <tr key={tIdx} style={{ background: diffColor(differentials[tIdx]) }}>
              <td>{treatmentLabels[tIdx]}</td>
              <td>{meanLabourCosts[tIdx].toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
              <td>{differentials[tIdx] === 0 ? "—" : differentials[tIdx].toLocaleString(undefined, { signDisplay: "always", maximumFractionDigits: 2 })}</td>
            </tr>
          ))}
        </tbody>
      </Table>
      <div className="small text-muted mt-2">
        <span style={{ background: "var(--fe-green-100)", padding: "0 0.5em" }}>Green</span>: Lower labour cost than control; <span style={{ background: "var(--fe-error-bg)", padding: "0 0.5em" }}>Red</span>: Higher labour cost than control.
      </div>
    </div>
  );
}
