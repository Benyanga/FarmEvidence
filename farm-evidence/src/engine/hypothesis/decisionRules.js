export function buildHypothesisStatement(testType) {
  if (testType === "WELCH_T_TEST") {
    return {
      testType: "T-Test",
      H0: "μ_CA = μ_CF",
      H0_meaning: "No difference in treatment means",
      H1: "μ_CA ≠ μ_CF",
      H1_meaning: "A significant difference exists",
    };
  }
  if (testType === "ONE_WAY_ANOVA") {
    return {
      testType: "ANOVA",
      H0: "μ₁ = μ₂ = ... = μ_k",
      H0_meaning: "All treatment means are equal",
      H1: "At least one μ_i ≠ μ_j",
      H1_meaning: "At least one treatment mean differs",
    };
  }
  return null;
}

export function decideTTest({ p_value, effectSize, ci }) {
  const reject = p_value < 0.05;
  return {
    testType: "WELCH_T_TEST",
    hypothesis: buildHypothesisStatement("WELCH_T_TEST"),
    decision: reject ? "REJECT_H0" : "FAIL_TO_REJECT_H0",
    label: reject ? "REJECT H0" : "FAIL TO REJECT H0",
    p_value,
    effectSize,
    ci,
    confidence: 0.95,
    plainLanguage: reject
      ? "A statistically significant difference was detected at 95% confidence level."
      : "No statistically significant difference was detected. Observed data do not provide sufficient evidence of a difference.",
  };
}

export function decideANOVA({ p_value, effectSize, ci, treatmentCount }) {
  const reject = p_value < 0.05;
  return {
    testType: "ONE_WAY_ANOVA",
    hypothesis: buildHypothesisStatement("ONE_WAY_ANOVA"),
    decision: reject ? "REJECT_H0" : "FAIL_TO_REJECT_H0",
    label: reject ? "REJECT H0" : "FAIL TO REJECT H0",
    runPostHoc: reject,
    postHocType: reject ? "TUKEY_HSD" : null,
    numPairwiseComparisons: reject ? (treatmentCount * (treatmentCount - 1)) / 2 : 0,
    p_value,
    effectSize,
    ci,
    confidence: 0.95,
    plainLanguage: reject
      ? `At least one treatment mean differs significantly (p < 0.05). Tukey HSD post-hoc test will be applied to identify which treatment pairs differ.`
      : "No significant difference among treatment means was detected. Post-hoc testing is not performed.",
  };
}
