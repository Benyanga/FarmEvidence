import { assertNumber } from "../guards.js";

export const computeROI = (profit, C_system) => assertNumber("profit", profit) / assertNumber("C_system", C_system, { allowZero: false });
export const computeCBR = (revenue, C_system) => assertNumber("revenue", revenue) / assertNumber("C_system", C_system, { allowZero: false });
export const computeCPU = (C_system, yield_kg_ha) => assertNumber("C_system", C_system) / assertNumber("yield_kg_ha", yield_kg_ha, { allowZero: false });
export const computeDeltaC = (C_system_CF, C_system_CA) => assertNumber("C_system_CF", C_system_CF) - assertNumber("C_system_CA", C_system_CA);
export const computeDeltaProfit = (profit_CA, profit_CF) => assertNumber("profit_CA", profit_CA) - assertNumber("profit_CF", profit_CF);
