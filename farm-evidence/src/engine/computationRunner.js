import { computeSystemCost } from "./formulas/costs.js";
import { computeRevenue } from "./formulas/revenue.js";
import { computeProfit, computeTreatmentMeanProfit } from "./formulas/profit.js";
import { computeLaborCost } from "./formulas/labor.js";
import { computeROI, computeCBR, computeCPU, computeDeltaC, computeDeltaProfit } from "./formulas/indicators.js";
import { computeCSI } from "./efficiency/csi.js";
import { getPhaseMultiplier } from "./efficiency/phaseMultiplier.js";
import { computeEfficiencyFactor, computeCAInputQuantity } from "./efficiency/inputQuantity.js";
import { computeTTP, computeCNB } from "./efficiency/trajectory.js";
import { computeTrendAnalysis, buildTrendMetrics } from "./trends/deltaEngine.js";
import { computeExpectedProfit, computeVariance, getCSIAdjustedProbabilities } from "./risk/expectedProfit.js";
import { computeScenarioProfits } from "./risk/scenarios.js";
import { selectStatisticalTest } from "./hypothesis/testSelector.js";
import { computeWelchTTest } from "./statistics/ttest.js";
import { computeOneWayANOVA } from "./statistics/anova.js";
import { computeAdoptionCostResearch } from "./adoption/researchAdoption.js";
import { computeAdoptionCostFarmer } from "./adoption/farmerAdoption.js";
import { computeAdoptionCostTrend } from "./adoption/adoptionTrend.js";
import { evaluateAllRules } from "./explainability/ruleEngine.js";
import {
  generateComparisonKey,
  buildLongitudinalComparison,
  buildCrossSectionalComparison,
  buildCombinedResultsMatrix,
} from "./comparisonEngine.js";

export function runFullAnalysis(sessionData, mode, onProgress = () => {}) {
  const results = { steps: {}, errors: {} };
  const emit = (step, label) => onProgress({ step, label });
  try {
    emit(1, "Computing system costs...");
    
    // Combine input costs and labour costs into a single array
    const inputCosts = Array.isArray(sessionData.inputCosts) ? sessionData.inputCosts : [];
    const labourCosts = Array.isArray(sessionData.labourCosts) ? sessionData.labourCosts : [];
    const allCosts = [...inputCosts, ...labourCosts];
    
    // Compute total cost
    results.steps.cost = computeSystemCost(allCosts);

    emit(2, "Computing revenue...");
    results.steps.revenue = computeRevenue(sessionData.revenue?.yield_kg_ha ?? 0, sessionData.revenue?.sellingPrice ?? 0);

    emit(3, "Computing profit...");
    results.steps.profit = computeProfit(results.steps.revenue, results.steps.cost);

    if (mode === "RESEARCH") {
      emit(4, "Averaging across replications...");
      results.steps.meanProfit = computeTreatmentMeanProfit(sessionData.plotProfits ?? [results.steps.profit]);
    }

    emit(5, "Computing adoption cost...");
    if (mode === "RESEARCH") {
      if (results.steps.meanProfit === undefined || sessionData.meanProfitCF === undefined) {
        throw new Error("BLOCKED Adoption Cost: Adoption cost requires Profit to be computed for all treatments first.");
      }
      results.steps.adoptionCost = computeAdoptionCostResearch(sessionData.meanProfitCF, results.steps.meanProfit);
    } else {
      results.steps.adoptionCost = sessionData.system && sessionData.previousSystem && sessionData.previousProfit !== undefined
        ? computeAdoptionCostFarmer(sessionData.system, sessionData.previousSystem, sessionData.previousProfit, results.steps.profit)
        : null;
    }

    const historicalCosts = Array.isArray(sessionData.adoptionCostHistory) ? sessionData.adoptionCostHistory : [];
    const numericHistory = historicalCosts.filter((value) => typeof value === "number" && !Number.isNaN(value));
    const history = results.steps.adoptionCost !== null && results.steps.adoptionCost !== undefined
      ? [...numericHistory, results.steps.adoptionCost]
      : numericHistory;
    if (history.length > 0) {
      results.steps.adoptionCostHistory = history;
      if (history.length > 1) {
        results.steps.adoptionTrend = computeAdoptionCostTrend(history);
      }
    }

    emit(6, "Computing indicators...");
    results.steps.indicators = {
      ROI: computeROI(results.steps.profit, results.steps.cost),
      CBR: computeCBR(results.steps.revenue, results.steps.cost),
      CPU: computeCPU(results.steps.cost, sessionData.revenue?.yield_kg_ha ?? 1),
      deltaC: computeDeltaC(sessionData.costTreatment2 ?? results.steps.cost, sessionData.costTreatment1 ?? results.steps.cost),
      deltaProfit: computeDeltaProfit(sessionData.profitTreatment1 ?? results.steps.profit, sessionData.profitTreatment2 ?? results.steps.profit),
    };

    const profitCA_history = Array.isArray(sessionData.profitCA_history) ? sessionData.profitCA_history : [];
    const profitCF_history = Array.isArray(sessionData.profitCF_history) ? sessionData.profitCF_history : [];
    results.steps.profitCA_history = profitCA_history;
    results.steps.profitCF_history = profitCF_history;
    results.steps.ttp = computeTTP(profitCA_history, profitCF_history);
    results.steps.cnb_history = computeCNB(profitCA_history, profitCF_history);

    emit(7, "Computing context index...");
    results.steps.csi = computeCSI(sessionData.csiScores);

    emit(8, "Computing efficiency factors...");
    const seasonsElapsed = sessionData.seasonsElapsed ?? 1;
    const phase = getPhaseMultiplier(seasonsElapsed);
    const efficiencyFactors = {
      tillage: computeEfficiencyFactor(0.8, phase.phi, results.steps.csi.csi),
      fertilizer: computeEfficiencyFactor(0.6, phase.phi, results.steps.csi.csi),
      pesticide: computeEfficiencyFactor(0.7, phase.phi, results.steps.csi.csi),
      irrigation: computeEfficiencyFactor(0.5, phase.phi, results.steps.csi.csi),
      residue: computeEfficiencyFactor(0.9, phase.phi, results.steps.csi.csi),
      labor: computeEfficiencyFactor(0.4, phase.phi, results.steps.csi.csi),
    };

    const cfQuantities = sessionData.cfQuantities ?? {};
    const computeCAQuantity = (key) => {
      const qcf = cfQuantities[key];
      return qcf == null ? null : computeCAInputQuantity(qcf, efficiencyFactors[key]);
    };

    results.steps.efficiency = {
      phi: phase.phi,
      phaseName: phase.phaseName,
      phaseDescription: phase.description,
      csi: results.steps.csi.csi,
      factors: efficiencyFactors,
      caInputQuantities: {
        tillage: computeCAQuantity("tillage"),
        fertilizer: computeCAQuantity("fertilizer"),
        pesticide: computeCAQuantity("pesticide"),
        irrigation: computeCAQuantity("irrigation"),
        residue: computeCAQuantity("residue"),
        labor: computeCAQuantity("labor"),
      },
    };

    emit(9, "Computing trends...");
    const trendMetrics = buildTrendMetrics(sessionData, results.steps.adoptionCost);
    if (Object.keys(trendMetrics).length === 0) {
      results.steps.trends = {};
    } else {
      results.steps.trends = computeTrendAnalysis(trendMetrics);
    }

    emit(9, "Running scenario analysis...");
    const defaultScenarioProfits = computeScenarioProfits(sessionData);
    const scenarioProfits = {
      best: sessionData.scenarioProfits?.best ?? defaultScenarioProfits.best,
      normal: sessionData.scenarioProfits?.normal ?? defaultScenarioProfits.normal,
      worst: sessionData.scenarioProfits?.worst ?? defaultScenarioProfits.worst,
    };
    const probs = getCSIAdjustedProbabilities(results.steps.csi.csi);
    const expected = computeExpectedProfit(
      scenarioProfits.best,
      scenarioProfits.normal,
      scenarioProfits.worst,
      probs.p_best,
      probs.p_normal,
      probs.p_worst,
    );
    results.steps.risk = {
      expectedProfit: expected,
      probabilities: probs,
      scenarioProfits,
      ...computeVariance(
        [scenarioProfits.best, scenarioProfits.normal, scenarioProfits.worst],
        [probs.p_best, probs.p_normal, probs.p_worst],
        expected,
      ),
    };

    emit(10, "Running statistical analysis...");
    if (mode === "RESEARCH") {
      const test = selectStatisticalTest(sessionData.treatmentCount ?? 2, sessionData.rcbdValid !== false, mode);
      if (test === "WELCH_T_TEST") {
        results.steps.statistics = computeWelchTTest(sessionData.stats.groupA, sessionData.stats.groupB, mode);
      }
      if (test === "ONE_WAY_ANOVA") {
        results.steps.statistics = computeOneWayANOVA(sessionData.stats.groups, mode);
      }
    } else {
      results.steps.statistics = null;
    }

    emit(11, "Generating insights...");
    results.steps.explainability = evaluateAllRules(sessionData, sessionData.priorSeasonData, sessionData.ruleFlags, sessionData.language);

    const comparisonKey = sessionData.comparisonKey ?? generateComparisonKey(sessionData.comparisonContext);
    results.steps.comparisonKey = comparisonKey;
    results.comparisonKey = comparisonKey;

    const longitudinalComparison = buildLongitudinalComparison(sessionData);
    const crossSectionalComparison = buildCrossSectionalComparison(sessionData);
    results.steps.comparison = {
      key: comparisonKey,
      longitudinal: longitudinalComparison,
      crossSectional: crossSectionalComparison,
      combinedMatrix: buildCombinedResultsMatrix(longitudinalComparison, crossSectionalComparison),
    };

    emit(12, "Complete.");
    results.complete = true;
    return results;
  } catch (error) {
    results.complete = false;
    results.errors.general = error.message;
    return results;
  }
}
