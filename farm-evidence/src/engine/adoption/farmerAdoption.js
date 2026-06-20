import { assertNumber } from "../guards.js";

export function computeAdoptionCostFarmer(system_t, system_t_minus_1, profit_prev, profit_curr) {
  if (system_t === system_t_minus_1) {
    return null;
  }
  const prev = assertNumber("profit_prev", profit_prev);
  const curr = assertNumber("profit_curr", profit_curr);
  return Math.max(0, prev - curr);
}
