import { assertNumber } from "../guards.js";

/**
 * Computes total labor cost from an array of dynamic labor cost entries.
 * Each entry should contain a cost amount.
 * @param {Array} laborCosts - Array of labor cost entries, each with a cost/amount field
 * @returns {number} Total labor cost
 */
export function computeLaborCost(laborCosts) {
  if (!Array.isArray(laborCosts)) {
    return 0;
  }

  return laborCosts.reduce((sum, entry) => {
    if (!entry || typeof entry !== "object") {
      return sum;
    }
    
    const amount = entry.amount ?? entry.cost ?? entry.total ?? 0;
    const numericAmount = typeof amount === "number" && !Number.isNaN(amount) ? amount : 0;
    
    return sum + numericAmount;
  }, 0);
}

