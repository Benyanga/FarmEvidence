import { computeLaborCost } from "../formulas/labor.js";
import { computeProfit } from "../formulas/profit.js";
import { computeRevenue } from "../formulas/revenue.js";
import { assertNumber } from "../guards.js";

export function applyScenarioAdjustments(baseData, scenario) {
  const data = structuredClone(baseData);
  if (scenario === "best") {
    data.yield *= 1.2;
    data.inputCosts *= 0.9;
    data.weedingCost *= 0.75;
  }
  if (scenario === "worst") {
    data.yield *= 0.7;
    data.inputCosts *= 1.2;
    data.herbicideCost *= 1.15;
  }
  return data;
}

export function buildScenarioBaseData(sessionData) {
  const revenue = sessionData.revenue || {};
  const costs = sessionData.costs || {};
  const laborOps = sessionData.laborOps || {};

  const yieldKgHa = assertNumber("yield_kg_ha", revenue.yield_kg_ha, { allowZero: false });
  const sellingPrice = assertNumber("sellingPrice_RWF_kg", revenue.sellingPrice, { allowZero: false });
  const C_tillage = assertNumber("C_tillage", costs.C_tillage);
  const C_fertilizer = assertNumber("C_fertilizer", costs.C_fertilizer);
  const C_pesticide = assertNumber("C_pesticide", costs.C_pesticide);
  const C_irrigation = assertNumber("C_irrigation", costs.C_irrigation);
  const C_residue = assertNumber("C_residue", costs.C_residue);

  let L_WD;
  let labor;
  let weedingCost = 0;

  if (!Array.isArray(laborOps.operations)) {
    throw new Error("BLOCKED Risk scenario: disaggregated labor operations are required.");
  }
  labor = computeLaborCost(laborOps);
  const wdOperation = labor.operations.find((op) => op.code === "WD");
  L_WD = wdOperation?.decimal_days ?? 0;
  weedingCost = wdOperation?.cost ?? 0;

  const nonWeedingLaborCost = labor.C_labor - weedingCost;
  const inputCosts = C_tillage + C_fertilizer + C_irrigation + C_residue + nonWeedingLaborCost;

  return {
    yield: yieldKgHa,
    sellingPrice,
    inputCosts,
    herbicideCost: C_pesticide,
    weedingCost,
  };
}

export function computeScenarioProfit(scenarioData) {
  const revenue = computeRevenue(scenarioData.yield, scenarioData.sellingPrice);
  return computeProfit(revenue, scenarioData.inputCosts + scenarioData.herbicideCost + scenarioData.weedingCost);
}

export function computeScenarioProfits(sessionData) {
  const baseData = buildScenarioBaseData(sessionData);
  return {
    normal: computeScenarioProfit(baseData),
    best: computeScenarioProfit(applyScenarioAdjustments(baseData, "best")),
    worst: computeScenarioProfit(applyScenarioAdjustments(baseData, "worst")),
  };
}
