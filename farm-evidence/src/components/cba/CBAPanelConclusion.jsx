import React from "react";
import { useTrialConfigStore } from "../../store/trialConfigStore";
import { usePlotDataStore } from "../../store/plotDataStore";
import { getRCBDPlotIds, getTreatmentLabels } from "../../utils/rcbdUtils";
import { Table } from "react-bootstrap";

/**
 * Conclusion & System Comparison Summary
 * Mirrors the validated Excel workbook structure for RCBD trials.
 * Dynamically generates rows/columns for any number of treatments.
 *
 * Shows, for each treatment:
 *  - Mean Net Benefit (Yield Revenue - Total Cost)
 *  - Rank (descending by mean net benefit)
 *  - Color rules: highlight best/worst
 *  - Summary statement: which system is most/least profitable
 */
export function CBAPanelConclusion() {
  const trialConfig = useTrialConfigStore((s) => s.trialConfig);
  const plotData = usePlotDataStore((s) => s.plotData);
  if (!trialConfig) return null;

  const { treatments } = trialConfig;
  const treatmentLabels = getTreatmentLabels(trialConfig);
  const plotIds = getRCBDPlotIds(trialConfig);

  // Compute mean net benefit per treatment
  const meanNetBenefits = treatments.map((_, tIdx) => {
    const plots = plotIds.filter((p) => p.treatmentIdx === tIdx);
    const netBenefits = plots.map((p) => {
      const d = plotData[p.plotId] || {};
      const revenue = d.yieldRevenue ?? 0;
      const totalCost = (d.inputCost ?? 0) + (d.labourCost ?? 0);
      return revenue - totalCost;
    });
    if (netBenefits.length === 0) return 0;
    return netBenefits.reduce((a, b) => a + b, 0) / netBenefits.length;
  });

  // Rank treatments by mean net benefit (descending)
  const sorted = meanNetBenefits
    .map((val, idx) => ({ idx, val }))
    .sort((a, b) => b.val - a.val);
  const ranks = Array(treatments.length);
  sorted.forEach((item, i) => {
    ranks[item.idx] = i + 1;
  });

  // Color rule: best = gold, worst = light red, others = default
  function rowColor(rank) {
    if (rank === 1) return "var(--fe-amber-100)"; // gold
    if (rank === treatments.length) return "var(--fe-error-bg)"; // red
    return undefined;
  }

  // Summary statement
  const bestIdx = sorted[0]?.idx;
  const worstIdx = sorted[sorted.length - 1]?.idx;

  return (
    <div className="cba-panel cba-panel-conclusion">
      <h5>Conclusion & System Comparison</h5>
      <Table bordered size="sm" className="mb-0">
        <thead>
          <tr>
            <th>Treatment</th>
            <th>Mean Net Benefit</th>
            <th>Rank</th>
          </tr>
        </thead>
        <tbody>
          {treatments.map((_, tIdx) => (
            <tr key={tIdx} style={{ background: rowColor(ranks[tIdx]) }}>
              <td>{treatmentLabels[tIdx]}</td>
              <td>{meanNetBenefits[tIdx].toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
              <td>{ranks[tIdx]}</td>
            </tr>
          ))}
        </tbody>
      </Table>
      <div className="small text-muted mt-2">
        <span style={{ background: "var(--fe-amber-100)", padding: "0 0.5em" }}>Gold</span>: Most profitable system; <span style={{ background: "var(--fe-error-bg)", padding: "0 0.5em" }}>Red</span>: Least profitable system.
      </div>
      <div className="mt-3 fw-bold">
        {typeof bestIdx === "number" && typeof worstIdx === "number" && (
          <>
            <span>{treatmentLabels[bestIdx]}</span> is the most profitable system, while <span>{treatmentLabels[worstIdx]}</span> is the least profitable.
          </>
        )}
      </div>
    </div>
  );
}

export default CBAPanelConclusion;
