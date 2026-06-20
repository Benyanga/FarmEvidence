import { assertNumber } from "../guards.js";

export function computeRevenue(yield_kg_ha, sellingPrice_RWF_kg) {
  const y = assertNumber("yield_kg_ha", yield_kg_ha, { allowZero: false });
  const p = assertNumber("sellingPrice_RWF_kg", sellingPrice_RWF_kg, { allowZero: false });
  return y * p;
}
