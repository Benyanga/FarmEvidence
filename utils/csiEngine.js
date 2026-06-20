const CSI_WEIGHTS = {
  j1: 0.25,  // Rainfall / Moisture
  j2: 0.20,  // Soil Organic Matter proxy
  j3: 0.15,  // Residue Cover Availability
  j4: 0.15,  // Weed Pressure Level
  j5: 0.15,  // Farmer Skill Level
  j6: 0.10   // Equipment Access
};

/**
 * Compute CSI from 6 driver scores (each 0.0–1.0).
 * CSI = Σ(w_j × s_j) / Σ(w_j)
 * @param {{ j1, j2, j3, j4, j5, j6 }} scores
 * @returns {number} CSI 0.0–1.0
 */
function computeCSI(scores) {
  const sumW = Object.values(CSI_WEIGHTS).reduce((a, b) => a + b, 0);
  const sumWS = Object.keys(CSI_WEIGHTS).reduce((s, key) => {
    return s + CSI_WEIGHTS[key] * (scores[key] ?? 0.5);
  }, 0);
  return sumWS / sumW;
}

/**
 * Interpret CSI band and return scenario weights + farmer message key.
 * @param {number} csi
 * @returns {{ band: string, weights: { best, normal, worst }, messageKey: string }}
 */
function interpretCSI(csi) {
  if (csi >= 0.70) {
    return {
      band: "high",
      weights: { best: 0.30, normal: 0.55, worst: 0.15 },
      messageKey: "csi_high",
    };
  }
  if (csi >= 0.40) {
    return {
      band: "moderate",
      weights: { best: 0.20, normal: 0.60, worst: 0.20 },
      messageKey: "csi_moderate",
    };
  }
  return {
    band: "low",
    weights: { best: 0.10, normal: 0.55, worst: 0.35 },
    messageKey: "csi_low",
  };
}

/**
 * Compute efficiency factor for input i at season t in context S.
 * E_i(t, S) = E_max,i × φ(t) × CSI
 * @param {number} eMax  - maximum attainable efficiency (0–1) from evidence table
 * @param {number} phi   - phase multiplier φ(t): 0.30 / 0.70 / 1.00
 * @param {number} csi   - context sensitivity index
 * @returns {number}
 */
function computeEfficiency(eMax, phi, csi) {
  return Math.min(1, eMax * phi * csi);
}

/**
 * Compute CA input quantity at season t.
 * Q_CA,i(t) = Q_CF,i × [1 − E_i(t, S)]
 * @param {number} qCF   - CF quantity for input i
 * @param {number} eff   - efficiency factor E_i(t, S)
 * @returns {number}
 */
function computeCAQuantity(qCF, eff) {
  return qCF * (1 - eff);
}

module.exports = { CSI_WEIGHTS, computeCSI, interpretCSI, computeEfficiency, computeCAQuantity };