import { selectStatisticalTest } from "./testSelector";
import { computeWelchTTest } from "../statistics/ttest";
import { computeOneWayANOVA } from "../statistics/anova";
import { computeCohenD, computeEtaSquared } from "../statistics/effectSize";
import { computeTukeyHSD } from "../statistics/posthoc";
import { decideTTest, decideANOVA } from "./decisionRules";
import { mean, sampleVariance } from "simple-statistics";

export function getDecisionFlow(mode, treatmentCount, rcbdValid) {
  if (mode === "FARMER" || !rcbdValid) return "NO_STATISTICS";
  if (treatmentCount === 2) return "WELCH_T_TEST";
  if (treatmentCount >= 3) return "ONE_WAY_ANOVA";
  return "NO_STATISTICS";
}

export function runStatisticalFlowchart(groups, mode, options = {}) {
  const result = {
    step1_treatmentCount: null,
    step2_rcbdValid: null,
    step3_researchMode: null,
    step4_selectedTest: null,
    step5_plotData: null,
    step6_testStatistic: null,
    step7_criticalValue: null,
    step8_pValue: null,
    step9_decision: null,
    step10_postHoc: null,
    step11_output: null,
    error: null,
  };

  try {
    // Step 1: Count active treatments
    const treatmentCount = groups.length;
    result.step1_treatmentCount = treatmentCount;
    if (treatmentCount < 2) {
      result.error = "Step 1: At least 2 treatments required";
      return result;
    }

    // Step 2: Check RCBD validity (all treatments in all replications)
    const rcbdValid = options.rcbdValid !== false;
    result.step2_rcbdValid = rcbdValid;
    if (!rcbdValid) {
      result.error = "Step 2: RCBD validity check failed";
      return result;
    }

    // Step 3: Verify Research Mode
    const isResearchMode = mode === "RESEARCH";
    result.step3_researchMode = isResearchMode;
    if (!isResearchMode) {
      result.error = "Step 3: Research mode required for statistical analysis";
      return result;
    }

    // Step 4: Select test
    const testType = selectStatisticalTest(treatmentCount, rcbdValid, mode);
    result.step4_selectedTest = testType;
    if (!testType || testType === "NO_STATISTICS") {
      result.error = "Step 4: No applicable test selected";
      return result;
    }

    // Step 5: Compute from plot-level data
    const plotData = groups.map((g) => ({
      treatmentId: g.treatmentId,
      observations: g.observations,
      n: g.observations.length,
    }));
    result.step5_plotData = plotData;

    // Steps 6-8: Compute test statistic, critical value, and p-value
    let testResult;
    if (testType === "WELCH_T_TEST") {
      testResult = computeWelchTTest(groups[0].observations, groups[1].observations, mode);
      result.step6_testStatistic = { t_stat: testResult.t_stat, df: testResult.df };
      result.step7_criticalValue = 1.96;
      result.step8_pValue = testResult.p_value;
    } else if (testType === "ONE_WAY_ANOVA") {
      testResult = computeOneWayANOVA(groups, mode);
      result.step6_testStatistic = { F: testResult.F, df_treatment: testResult.df_treatment, df_error: testResult.df_error };
      result.step7_criticalValue = 3.89;
      result.step8_pValue = testResult.p_value;
    }

    // Step 9: Decide
    let decision;
    if (testType === "WELCH_T_TEST") {
      const meanA = mean(groups[0].observations);
      const meanB = mean(groups[1].observations);
      const vA = sampleVariance(groups[0].observations);
      const vB = sampleVariance(groups[1].observations);
      const sA = Math.sqrt(vA);
      const sB = Math.sqrt(vB);
      const nA = groups[0].observations.length;
      const nB = groups[1].observations.length;
      const effectSize = computeCohenD(meanA, meanB, sA, nA, sB, nB, mode);
      const ci = { lower: meanA - meanB - 1.96 * testResult.se_diff, upper: meanA - meanB + 1.96 * testResult.se_diff }; // approximate CI for difference
      decision = decideTTest({ p_value: testResult.p_value, effectSize, ci });
    } else if (testType === "ONE_WAY_ANOVA") {
      const effectSize = computeEtaSquared(testResult.SS_treatment, testResult.SS_total, mode);
      const ci = { lower: null, upper: null };
      decision = decideANOVA({ p_value: testResult.p_value, effectSize, ci, treatmentCount });
    }
    result.step9_decision = decision;

    // Step 10: Post-hoc
    if (decision.runPostHoc) {
      const postHocResults = computeTukeyHSD(groups, testResult.MS_error, testResult.df_error, mode);
      result.step10_postHoc = {
        test: "TUKEY_HSD",
        results: postHocResults,
      };
    }

    // Step 11: Output
    result.step11_output = {
      p_value: decision.p_value,
      effectSize: decision.effectSize,
      ci: decision.ci,
      confidence: decision.confidence,
      plainLanguage: decision.plainLanguage,
      hypothesis: decision.hypothesis,
      postHocSummary: result.step10_postHoc ? `${result.step10_postHoc.results.length} pairwise comparisons performed` : null,
    };
  } catch (err) {
    result.error = `Flowchart error: ${err.message}`;
  }

  return result;
}
