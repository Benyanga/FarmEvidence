/**
 * Adoption cost at season t.
 * C_adopt(t) = C_adopt,0 × e^(−λ × t)
 * Approaches 0 by t=6 (end of Transition Phase).
 *
 * @param {number} cAdopt0  - initial adoption cost (RWF) entered by user
 * @param {number} t        - seasons since adoption start (1-indexed)
 * @param {number} lambda   - decay rate (default 0.50 per doc)
 * @returns {number} adoption cost this season
 */
function computeAdoptionCost(cAdopt0, t, lambda = 0.50) {
  return cAdopt0 * Math.exp(-lambda * t);
}

/**
 * Returns true if adoption cost has decayed to < 1% of initial value.
 */
function isAdoptionCostAbsorbed(cAdopt0, t, lambda = 0.50) {
  return computeAdoptionCost(cAdopt0, t, lambda) < cAdopt0 * 0.01;
}

export { computeAdoptionCost, isAdoptionCostAbsorbed };
