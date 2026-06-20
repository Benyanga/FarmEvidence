import { assertNumber } from "../guards.js";

/**
 * Computes total system cost from an array of cost entries.
 * Each cost entry should have a numeric amount. Only entries with valid amounts are summed.
 * @param {Array} costs - Array of cost entries, each with a numeric amount
 * @returns {number} Total system cost
 */
export function computeSystemCost(costs) {
  if (!Array.isArray(costs)) {
    throw new Error("Costs must be an array of cost entries.");
  }
  
  return costs.reduce((sum, cost) => {
    if (!cost || typeof cost !== "object") {
      return sum;
    }
    
    const amount = cost.amount ?? cost.cost ?? cost.total ?? 0;
    const numericAmount = typeof amount === "number" && !Number.isNaN(amount) ? amount : 0;
    
    return sum + numericAmount;
  }, 0);
}

/**
 * Computes system-dependent costs from an array of cost entries.
 * @param {Array} costs - Array of cost entries with costType classification
 * @returns {number} Total system-dependent costs (C_SD)
 */
export function computeSystemDependentCost(costs) {
  if (!Array.isArray(costs)) {
    return 0;
  }
  
  return costs.reduce((sum, cost) => {
    if (!cost || typeof cost !== "object" || cost.costType !== "C_SD") {
      return sum;
    }
    
    const amount = cost.amount ?? cost.cost ?? cost.total ?? 0;
    const numericAmount = typeof amount === "number" && !Number.isNaN(amount) ? amount : 0;
    
    return sum + numericAmount;
  }, 0);
}

/**
 * Computes system-independent costs from an array of cost entries.
 * @param {Array} costs - Array of cost entries with costType classification
 * @returns {number} Total system-independent costs (C_SI)
 */
export function computeSystemIndependentCost(costs) {
  if (!Array.isArray(costs)) {
    return 0;
  }
  
  return costs.reduce((sum, cost) => {
    if (!cost || typeof cost !== "object" || cost.costType !== "C_SI") {
      return sum;
    }
    
    const amount = cost.amount ?? cost.cost ?? cost.total ?? 0;
    const numericAmount = typeof amount === "number" && !Number.isNaN(amount) ? amount : 0;
    
    return sum + numericAmount;
  }, 0);
}
