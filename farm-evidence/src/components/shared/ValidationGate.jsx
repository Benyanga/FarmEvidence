import { useMemo } from "react";
import { IconCheckCircle, IconAlertTriangle } from '../ui/Icons';

/**
 * ValidationGate: Model Validity Conditions display (Section 16)
 * 
 * Shows green badge if all 7 conditions pass, or amber banner listing failures.
 * Props: { analysis, trial, plots }
 */
export function ValidationGate({ analysis = {}, trial = {}, plots = [] }) {
  const failures = useMemo(() => {
    const failMessages = [];

    // 1. Phase Assignment: trial.adoptionStartSeason must exist
    if (!trial.adoptionStartSeason) {
      failMessages.push(
        "Adoption start season not set — Phase defaults to Transition. TTP projection disabled."
      );
    }

    // 2. CSI Assessment: all 6 j-scores must be present
    const jScores = [
      analysis.j1,
      analysis.j2,
      analysis.j3,
      analysis.j4,
      analysis.j5,
      analysis.j6,
    ];
    if (jScores.some((score) => score === null || score === undefined)) {
      failMessages.push(
        "CSI driver scores incomplete — CSI defaulted to 0.50 (moderate). Full site assessment recommended."
      );
    }

    // 3. RCBD Completeness: every replication must contain all treatments
    const replicates = new Map();
    plots.forEach((plot) => {
      const rep = plot.replicate || "default";
      if (!replicates.has(rep)) {
        replicates.set(rep, new Set());
      }
      replicates.get(rep).add(plot.treatment);
    });

    let rcbdIncomplete = false;
    replicates.forEach((treatments) => {
      // Check if all expected treatments present (assumes CA and CF at minimum)
      const hasCA = treatments.has("CA") || treatments.has("ca");
      const hasCF = treatments.has("CF") || treatments.has("cf");
      if (!hasCA || !hasCF) {
        rcbdIncomplete = true;
      }
    });

    if (rcbdIncomplete) {
      failMessages.push(
        "RCBD structure incomplete — statistical analysis disabled."
      );
    }

    // 4. Minimum Dataset: each plot needs ≥1 yield + ≥3 cost records
    plots.forEach((plot) => {
      const yieldCount = (plot.yieldRecords || []).length;
      const costCount = (plot.costRecords || []).length;

      if (yieldCount < 1 || costCount < 3) {
        failMessages.push(
          `Plot ${plot.label || plot.id}: insufficient data for season close (needs yield + 3 cost records).`
        );
      }
    });

    // 5. Labour Disaggregation: all 5 operation fields > 0 for each plot
    const labourOps = ["landPreparation", "planting", "weeding", "harvesting", "residueManagement"];
    plots.forEach((plot) => {
      const labour = plot.labourDisaggregated || {};
      const missingOps = labourOps.filter(
        (op) => labour[op] === null || labour[op] === undefined || labour[op] <= 0
      );

      if (missingOps.length > 0) {
        failMessages.push(
          `Plot ${plot.label || plot.id}: disaggregated labour not fully entered — full CBA engine requires 5-operation labour.`
        );
      }
    });

    // 6. Adoption Cost Declaration: trial.adoptionCostInitial must be defined (can be 0)
    if (trial.adoptionCostInitial === null || trial.adoptionCostInitial === undefined) {
      failMessages.push(
        "Adoption cost not declared — shown as 'No transition cost declared' on report."
      );
    }

    // 7. Efficiency Factor Ranges: any E_max value outside 0–1 range
    const efficiencyFactors = analysis.efficiencyFactors || {};
    const outOfRange = Object.entries(efficiencyFactors).filter(
      ([_, value]) => value < 0 || value > 1
    );

    if (outOfRange.length > 0) {
      failMessages.push(
        "One or more efficiency factors outside valid range (0–1)."
      );
    }

    return failMessages;
  }, [analysis, trial, plots]);

  // All conditions pass
  if (failures.length === 0) {
    return (
      <div className="mb-4">
        <span className="inline-flex items-center gap-1.5 text-xs bg-canopy-pale text-canopy px-2 py-1 rounded-full">
          <IconCheckCircle className="w-3.5 h-3.5" />
          Model Valid — All 7 conditions met
        </span>
      </div>
    );
  }

  // Some conditions failed
  return (
    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
      <p className="font-semibold text-amber-800 flex items-center gap-1.5">
        <IconAlertTriangle className="w-4 h-4 flex-shrink-0" />
        Model validity warnings ({failures.length} of 7 conditions unmet)
      </p>
      <ul className="mt-2 space-y-1 text-sm text-amber-700">
        {failures.map((message, idx) => (
          <li key={idx}>• {message}</li>
        ))}
      </ul>
      <p className="text-xs mt-2 text-amber-600">
        Analysis continues with available data. Resolve warnings for full model fidelity.
      </p>
    </div>
  );
}
