export function selectStatisticalTest(treatmentCount, rcbdValid, mode) {
  if (mode === "FARMER") return null;
  if (!rcbdValid) return null;
  if (treatmentCount === 2) return "WELCH_T_TEST";
  if (treatmentCount >= 3) return "ONE_WAY_ANOVA";
  return null;
}
