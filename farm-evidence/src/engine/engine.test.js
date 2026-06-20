import { describe, expect, test } from "vitest";
import { computeAdoptionCostResearch } from "./adoption/researchAdoption";
import { computeAdoptionCostTrend } from "./adoption/adoptionTrend";
import { computeLaborCost } from "./formulas/labor";
import { computeSystemCost } from "./formulas/costs";
import { computeRevenue } from "./formulas/revenue";
import { computeProfit } from "./formulas/profit";
import { computeROI, computeCBR, computeCPU, computeDeltaC, computeDeltaProfit } from "./formulas/indicators";
import { computeWelchTTest, computeWelchStandardError, computeWelchDF } from "./statistics/ttest";
import { computeOneWayANOVA } from "./statistics/anova";
import { computeMean, computeTreatmentMeans } from "./statistics/treatmentMean";
import { computeSampleVariance, computeStdDev } from "./statistics/variance";
import { computeCV } from "./statistics/cv";
import { computeCI95 } from "./statistics/ci";
import { computeCohenD, computePooledStdDev, computeEtaSquared } from "./statistics/effectSize";
import { computeTukeyHSD, computeFisherLSD, computeTukeyQCritical } from "./statistics/posthoc";
import { runFullAnalysis } from "./computationRunner";
import { selectStatisticalTest } from "./hypothesis/testSelector";
import { buildHypothesisStatement, decideTTest, decideANOVA } from "./hypothesis/decisionRules";
import { getDecisionFlow, runStatisticalFlowchart } from "./hypothesis/flowchart";
import { computeCSI, CSI_DRIVERS } from "./efficiency/csi";
import { computeExpectedProfit, computeVariance, getCSIAdjustedProbabilities } from "./risk/expectedProfit";
import { applyScenarioAdjustments } from "./risk/scenarios";

function createLaborOps({ L_LP = 0, L_PL = 0, L_WD = 0, L_HV = 0, L_RM = 0, wageRate = 3500 } = {}) {
  return {
    operations: [
      { code: "LP", time: L_LP, unit: "days", workers: 1, wageRate },
      { code: "PL", time: L_PL, unit: "days", workers: 1, wageRate },
      { code: "WD", time: L_WD, unit: "days", workers: 1, wageRate },
      { code: "HV", time: L_HV, unit: "days", workers: 1, wageRate },
      { code: "RM", time: L_RM, unit: "days", workers: 1, wageRate },
    ],
  };
}
import { computeTrendAnalysis, buildTrendMetrics } from "./trends/deltaEngine";
import { computeCAInputQuantity } from "./efficiency/inputQuantity";
import { computeTTP, computeCNB } from "./efficiency/trajectory";
import { classifyTrend } from "./trends/trendClassifier";
import { evaluateAllRules } from "./explainability/ruleEngine";
import { getComputationGates, areAllComputationGatesComplete } from "../utils/computationGates";

describe("engine priority requirements", () => {
  test("computeAdoptionCost requires profit values", () => {
    expect(() => computeAdoptionCostResearch(undefined, 100)).toThrow();
  });

  test("computeAdoptionCost follows max(0, Profit_CF - Profit_CA) and never declines", () => {
    expect(computeAdoptionCostResearch(200000, 150000)).toBe(50000);
    expect(computeAdoptionCostResearch(180000, 220000)).toBe(0);
  });

  test("computeAdoptionCostTrend calculates delta and direction", () => {
    const trend = computeAdoptionCostTrend([40000, 35000, 30000]);
    expect(trend.delta).toEqual([null, -5000, -5000]);
    expect(trend.trendDirection).toBe("Decreasing");
  });

  test("computeLaborCost requires all labor operations and a wage rate per operation or season", () => {
    expect(() => computeLaborCost({ operations: [
      { code: "LP", time: 2, unit: "days", workers: 1 },
      { code: "PL", time: 1, unit: "days", workers: 1 },
      { code: "WD", time: 2, unit: "days", workers: 1 },
      { code: "HV", time: 1, unit: "days", workers: 1 }
    ], wageRate: 3500 })).toThrow();
    expect(() => computeLaborCost({ operations: [
      { code: "LP", time: 2, unit: "days", workers: 1 },
      { code: "PL", time: 1, unit: "days", workers: 1 },
      { code: "WD", time: 2, unit: "days", workers: 1 },
      { code: "HV", time: 1, unit: "days", workers: 1 },
      { code: "RM", time: 1, unit: "days", workers: 1 }
    ] })).toThrow();
    const out = computeLaborCost({ operations: [
      { code: "LP", time: 2, unit: "days", workers: 1, wageRate: 3500 },
      { code: "PL", time: 1, unit: "days", workers: 1, wageRate: 3500 },
      { code: "WD", time: 2, unit: "days", workers: 1, wageRate: 3500 },
      { code: "HV", time: 1, unit: "days", workers: 1, wageRate: 3500 },
      { code: "RM", time: 1, unit: "days", workers: 1, wageRate: 3500 }
    ], wageRate: 3500 });
    expect(out.totalDecimalDays).toBe(7);
    expect(out.C_labor).toBe(24500);
  });

  test("computeLaborCost formula matches A2 definition", () => {
    const laborData = {
      operations: [
        { code: "LP", time: 2, unit: "days", workers: 1, wageRate: 3000 },
        { code: "PL", time: 2, unit: "days", workers: 1, wageRate: 3000 },
        { code: "WD", time: 1, unit: "days", workers: 1, wageRate: 3000 },
        { code: "HV", time: 3, unit: "days", workers: 1, wageRate: 3000 },
        { code: "RM", time: 4, unit: "days", workers: 1, wageRate: 3000 }
      ]
    };
    const out = computeLaborCost(laborData);
    expect(out.totalDecimalDays).toBe(12);
    expect(out.C_labor).toBe(36000);
  });

  test("computeSystemCost excludes off-farm boundary categories", () => {
    const costs = {
      C_tillage: 10000,
      C_fertilizer: 8000,
      C_pesticide: 3000,
      C_irrigation: 2000,
      C_residue: 1500,
      C_labor: 21000,
      transport: 5000,
      storage: 2500,
      taxes: 1000,
      fees: 500,
      credit: 750,
      processing: 2000,
    };
    expect(computeSystemCost(costs)).toBe(10000 + 8000 + 3000 + 2000 + 1500 + 21000);
  });

  test("computeSystemCost blocks C_system when a category is marked N/A", () => {
    expect(() => computeSystemCost({
      C_tillage: 10000,
      C_fertilizer: 8000,
      C_pesticide: 3000,
      C_irrigation: 2000,
      C_residue: 1500,
      C_labor: "N/A",
    })).toThrow(/BLOCKED C_system/);
  });

  test("runFullAnalysis blocks revenue if selling price is missing", () => {
    const out = runFullAnalysis(
      {
        costs: { C_tillage: 10000, C_fertilizer: 10000, C_pesticide: 5000, C_irrigation: 0, C_residue: 2000 },
        laborOps: createLaborOps({ L_LP: 2, L_PL: 1, L_WD: 2, L_HV: 1, L_RM: 1, wageRate: 3500 }),
        revenue: { yield_kg_ha: 1000, sellingPrice: undefined },
        csiScores: { s_j1: 1, s_j2: 1, s_j3: 1, s_j4: 1, s_j5: 1, s_j6: 1 },
        plotProfits: [150000],
      },
      "FARMER",
    );
    expect(out.complete).toBe(false);
    expect(out.errors.general).toMatch(/sellingPrice_RWF_kg is required/);
  });

  test("getComputationGates includes all B4 validation requirements and returns all ok only when ready", () => {
    const setup = { setupConfirmed: true, treatments: ["CA", "CF"], replications: 2, rcbdMatrix: [["CA", "CF"], ["CF", "CA"]] };
    const season = {
      revenue: { yield_kg_ha: 1200, sellingPrice: 400 },
      agronomics: { weedScore: 1 },
      csiScores: { s_j1: 1, s_j2: 1, s_j3: 1, s_j4: 1, s_j5: 1, s_j6: 1 },
      laborOps: createLaborOps({ L_LP: 2, L_PL: 1, L_WD: 2, L_HV: 1, L_RM: 1, wageRate: 3500 }),
      costs: { tillage: 10000, fertilizer: 8000, pesticide: 3000, irrigation: 2000, residue: 1500, labor: 21000 },
    };
    const gates = getComputationGates(setup, season, "RESEARCH");
    expect(areAllComputationGatesComplete(setup, season, "RESEARCH")).toBe(true);
    expect(gates.find((gate) => gate.anchor === "setup").label).toMatch(/Treatment assignment verified/);
    expect(gates.find((gate) => gate.anchor === "rcbd").ok).toBe(true);
  });

  test("getComputationGates reports incomplete when treatment assignment is missing", () => {
    const setup = { setupConfirmed: false, treatments: [], replications: 2, rcbdMatrix: [["CA", "CF"], ["CF", "CA"]] };
    const season = {
      revenue: { yield_kg_ha: 1200, sellingPrice: 400 },
      agronomics: { weedScore: 1 },
      csiScores: { s_j1: 1, s_j2: 1, s_j3: 1, s_j4: 1, s_j5: 1, s_j6: 1 },
      laborOps: createLaborOps({ L_LP: 2, L_PL: 1, L_WD: 2, L_HV: 1, L_RM: 1, wageRate: 3500 }),
      costs: { tillage: 10000, fertilizer: 8000, pesticide: 3000, irrigation: 2000, residue: 1500, labor: 21000 },
    };
    expect(areAllComputationGatesComplete(setup, season, "RESEARCH")).toBe(false);
  });

  test("runFullAnalysis blocks revenue if yield is missing", () => {
    const out = runFullAnalysis(
      {
        costs: { C_tillage: 10000, C_fertilizer: 10000, C_pesticide: 5000, C_irrigation: 0, C_residue: 2000 },
        laborOps: createLaborOps({ L_LP: 2, L_PL: 1, L_WD: 2, L_HV: 1, L_RM: 1, wageRate: 3500 }),
        revenue: { yield_kg_ha: undefined, sellingPrice: 300 },
        csiScores: { s_j1: 1, s_j2: 1, s_j3: 1, s_j4: 1, s_j5: 1, s_j6: 1 },
        plotProfits: [150000],
      },
      "FARMER",
    );
    expect(out.complete).toBe(false);
    expect(out.errors.general).toMatch(/yield_kg_ha is required/);
  });

  test("computeRevenue multiplies yield by selling price", () => {
    expect(computeRevenue(1200, 250)).toBe(300000);
  });

  test("computeProfit uses revenue minus total system cost", () => {
    expect(computeProfit(300000, 120000)).toBe(180000);
  });

  test("computeCAInputQuantity reduces CF input by efficiency factor and bounds by CF quantity", () => {
    expect(computeCAInputQuantity(100, 0.2)).toBe(80);
    expect(computeCAInputQuantity(100, 0)).toBe(100);
    expect(computeCAInputQuantity(100, 1)).toBe(0);
  });

  test("computeTTP returns the earliest season when CA profit exceeds CF profit", () => {
    expect(computeTTP([100, 200, 250], [120, 150, 240])).toEqual({ reached: true, season: 2 });
    expect(computeTTP([100, 120], [110, 130])).toEqual({ reached: false, season: null });
  });

  test("computeCNB returns cumulative net benefit history from CA and CF profits", () => {
    expect(computeCNB([100, 200, 250], [120, 150, 240])).toEqual([-20, 30, 40]);
    expect(computeCNB([100, 90], [80, 95])).toEqual([20, 15]);
  });

  test("computeExpectedProfit uses probability-weighted scenario outcomes", () => {
    expect(computeExpectedProfit(200, 190, 150, 0.2, 0.5, 0.3)).toBeCloseTo(180);
    expect(() => computeExpectedProfit(200, 190, 150, 0.3, 0.3, 0.3)).toThrow(/must sum to 1/);
  });

  test("applyScenarioAdjustments modifies scenario parameters for best and worst outcomes", () => {
    const base = { yield: 1000, sellingPrice: 300, inputCosts: 40000, herbicideCost: 5000, weedingCost: 2000 };
    expect(applyScenarioAdjustments(base, "best")).toEqual({
      yield: 1200,
      sellingPrice: 300,
      inputCosts: 36000,
      herbicideCost: 5000,
      weedingCost: 1500,
    });
    expect(applyScenarioAdjustments(base, "worst")).toEqual({
      yield: 700,
      sellingPrice: 300,
      inputCosts: 48000,
      herbicideCost: 5750,
      weedingCost: 2000,
    });
  });

  test("runFullAnalysis derives F3 scenario profits from parameter adjustments when explicit values are absent", () => {
    const out = runFullAnalysis(
      {
        costs: { C_tillage: 10000, C_fertilizer: 10000, C_pesticide: 5000, C_irrigation: 0, C_residue: 2000 },
        laborOps: createLaborOps({ L_LP: 2, L_PL: 1, L_WD: 2, L_HV: 1, L_RM: 1, wageRate: 3500 }),
        revenue: { yield_kg_ha: 1000, sellingPrice: 300 },
        csiScores: { s_j1: 1, s_j2: 1, s_j3: 1, s_j4: 1, s_j5: 1, s_j6: 1 },
      },
      "FARMER",
    );

    expect(out.complete).toBe(true);
    expect(out.steps.risk.scenarioProfits.normal).toBeCloseTo(out.steps.profit);
    expect(out.steps.risk.scenarioProfits.best).toBeCloseTo(314200);
    expect(out.steps.risk.scenarioProfits.worst).toBeCloseTo(149850);
  });

  test("computeTrendAnalysis returns metric-specific deltas and classification", () => {
    const trends = computeTrendAnalysis({
      profit: [100, 110, 125],
      yield: [1000, 1050, 1100],
      CPU: [120, 115, 110],
      laborCost: [32000, 30000, 28000],
    });
    expect(trends.profit.deltas).toEqual([
      { season: 1, delta: null },
      { season: 2, delta: 10 },
      { season: 3, delta: 15 },
    ]);
    expect(trends.profit.classification).toBe("Improving");
    expect(trends.yield.classification).toBe("Improving");
    expect(trends.profit.interpretation).toBe("Profit is improving.");
    expect(trends.CPU.interpretation).toBe("CPU is improving efficiency per unit. Keep monitoring input intensity.");
    expect(trends.laborCost.interpretation).toBe("Labor cost is declining, which can reflect skill or mechanization maturity.");
  });

  test("buildTrendMetrics assembles named indicator series from session data", () => {
    const sessionData = {
      trendValues: [100, 110],
      yieldHistory: [1000, 950],
      weedHistory: [2, 3],
      soilHistory: [3, 3.2],
      CPUHistory: [120, 115],
      laborCostHistory: [32000, 30000],
      adoptionCostHistory: [25000],
    };
    const metrics = buildTrendMetrics(sessionData, 22000);
    expect(metrics.profit).toEqual([100, 110]);
    expect(metrics.yield).toEqual([1000, 950]);
    expect(metrics.weed).toEqual([2, 3]);
    expect(metrics.soil).toEqual([3, 3.2]);
    expect(metrics.CPU).toEqual([120, 115]);
    expect(metrics.laborCost).toEqual([32000, 30000]);
    expect(metrics.adoptionCost).toEqual([25000, 22000]);
  });

  test("evaluateAllRules returns explainability cards with fully structured H1 fields", () => {
    const cards = evaluateAllRules({ agronomics: {} }, { agronomics: {} }, { profitDecline2Seasons: true }, "en");
    expect(Array.isArray(cards)).toBe(true);
    cards.forEach((card) => {
      expect(card).toHaveProperty("WHAT");
      expect(card).toHaveProperty("WHY");
      expect(card).toHaveProperty("HOW");
      expect(card).toHaveProperty("RECOMMENDATION");
      expect(typeof card.WHAT).toBe("string");
      expect(typeof card.WHY).toBe("string");
      expect(typeof card.HOW).toBe("string");
      expect(typeof card.RECOMMENDATION).toBe("string");
    });
  });

  test("evaluateAllRules produces H2 weed-pressure chain output with injected values", () => {
    const seasonData = {
      agronomics: { weedScore: 3, residueCover: 35 },
      revenue: { yield_kg_ha: 950, sellingPrice: 400 },
      costs: { C_tillage: 10000, C_fertilizer: 8000, C_pesticide: 3000, C_irrigation: 0, C_residue: 2000, C_labor: 14000 },
      laborOps: createLaborOps({ L_WD: 4, wageRate: 3500 }),
    };
    const priorSeasonData = {
      agronomics: { weedScore: 1, residueCover: 60 },
      revenue: { yield_kg_ha: 1100, sellingPrice: 400 },
      costs: { C_tillage: 10000, C_fertilizer: 8000, C_pesticide: 3000, C_irrigation: 0, C_residue: 2000, C_labor: 10500 },
      laborOps: createLaborOps({ L_WD: 3, wageRate: 3500 }),
    };
    const cards = evaluateAllRules(seasonData, priorSeasonData, { weedYieldChain: true }, "en");
    const weedCard = cards.find((card) => card.trigger === "rule3");
    expect(weedCard).toBeDefined();
    expect(weedCard.WHAT).toContain("Weed pressure score increased from 1 to 3");
    expect(weedCard.WHAT).toContain("Yield declined from 1100 kg/ha to 950 kg/ha");
    expect(weedCard.WHAT).toContain("Profit declined from");
    expect(weedCard.HOW).toContain("≥50%");
    expect(weedCard.RECOMMENDATION).toContain("Apply spot herbicide when weed score reaches 2");
  });

  test("evaluateAllRules produces H3 tillage cost reduction output with injected values", () => {
    const seasonData = {
      costCA: { C_tillage: 8000 },
      costCF: { C_tillage: 12000 },
    };
    const cards = evaluateAllRules(seasonData, {}, { caTillageLower: true }, "en");
    const tillageCard = cards.find((card) => card.trigger === "rule4");
    expect(tillageCard).toBeDefined();
    expect(tillageCard.WHAT).toContain("CA tillage cost: 8000 RWF/ha");
    expect(tillageCard.WHAT).toContain("CF tillage cost: 12000 RWF/ha");
    expect(tillageCard.WHAT).toContain("Saving: 4000 RWF/ha");
    expect(tillageCard.WHAT).toContain("%");
  });

  test("evaluateAllRules produces H4 soil condition improvement output with injected values", () => {
    const seasonData = {
      agronomics: { soilScore: 4 },
    };
    const priorSeasonData = {
      agronomics: { soilScore: 2 },
    };
    const cards = evaluateAllRules(seasonData, priorSeasonData, {}, "en");
    const soilCard = cards.find((card) => card.trigger === "rule5");
    expect(soilCard).toBeDefined();
    expect(soilCard.WHAT).toContain("Soil condition improved from 2 to 4");
    expect(soilCard.WHAT).toContain("Projected fertilizer efficiency gain: 5-10% next season.");
    expect(soilCard.HOW).toContain("Increasing SOM improves nitrogen mineralization");
    expect(soilCard.RECOMMENDATION).toContain("Reduce fertilizer 5% next season as a trial");
  });

  test("evaluateAllRules produces H5 adoption cost decline output with injected values", () => {
    const seasonData = {
      adoptionCostHistory: [120000, 100000, 70000],
    };
    const cards = evaluateAllRules(seasonData, {}, {}, "en");
    const adoptionCard = cards.find((card) => card.trigger === "rule6");
    expect(adoptionCard).toBeDefined();
    expect(adoptionCard.WHAT).toContain("AdoptionCost decreased from 100000 to 70000 RWF/ha");
    expect(adoptionCard.WHAT).toContain("Current gap vs CF: 70000 RWF/ha");
    expect(adoptionCard.HOW).toContain("weed suppression from mulch becomes more effective");
    expect(adoptionCard.RECOMMENDATION).toContain("Continue monitoring. Ensure residue retention is maintained consistently");
  });

  test("evaluateAllRules produces H6 pesticide pest trigger output with injected values", () => {
    const seasonData = {
      agronomics: { pestIncidence: 35 },
      costs: { C_pesticide: 5500 },
    };
    const priorSeasonData = {
      costs: { C_pesticide: 3000 },
    };
    const cards = evaluateAllRules(seasonData, priorSeasonData, {}, "en");
    const pestCard = cards.find((card) => card.trigger === "rule8");
    expect(pestCard).toBeDefined();
    expect(pestCard.WHAT).toContain("Pesticide cost increased from 3000 to 5500 RWF/ha");
    expect(pestCard.WHAT).toContain("pest incidence reached 35%");
    expect(pestCard.RECOMMENDATION).toContain("Review IPM strategy");
  });

  test("evaluateAllRules produces H6 fertilizer yield trigger output with injected values", () => {
    const seasonData = {
      revenue: { yield_kg_ha: 950 },
      costs: { C_fertilizer: 9000 },
    };
    const priorSeasonData = {
      revenue: { yield_kg_ha: 1000 },
      costs: { C_fertilizer: 8000 },
    };
    const cards = evaluateAllRules(seasonData, priorSeasonData, {}, "en");
    const fertCard = cards.find((card) => card.trigger === "rule9");
    expect(fertCard).toBeDefined();
    expect(fertCard.WHAT).toContain("Fertilizer cost increased from 8000 to 9000 RWF/ha");
    expect(fertCard.WHAT).toContain("yield remained flat or declined");
    expect(fertCard.RECOMMENDATION).toContain("Soil test before the next application");
  });

  test("evaluateAllRules produces H6 irrigation soil trigger output with injected values", () => {
    const seasonData = {
      agronomics: { soilScore: 3 },
      costs: { C_irrigation: 4000 },
    };
    const priorSeasonData = {
      agronomics: { soilScore: 3 },
      costs: { C_irrigation: 2500 },
    };
    const cards = evaluateAllRules(seasonData, priorSeasonData, {}, "en");
    const irrCard = cards.find((card) => card.trigger === "rule10");
    expect(irrCard).toBeDefined();
    expect(irrCard.WHAT).toContain("Irrigation cost increased from 2500 to 4000 RWF/ha");
    expect(irrCard.WHAT).toContain("soil condition remained stable at 3");
    expect(irrCard.RECOMMENDATION).toContain("Improve mulch and water retention practices");
  });

  test("evaluateAllRules produces H6 CA labor stabilization trigger output with injected values", () => {
    const seasonData = {
      seasonsElapsed: 8,
      laborOps: createLaborOps({ L_WD: 3, L_RM: 2 }),
    };
    const priorSeasonData = {
      laborOps: createLaborOps({ L_WD: 2, L_RM: 1 }),
    };
    const cards = evaluateAllRules(seasonData, priorSeasonData, {}, "en");
    const laborCard = cards.find((card) => card.trigger === "rule13");
    expect(laborCard).toBeDefined();
    expect(laborCard.WHAT).toContain("CA labor demand increased from 3 to 5 WD");
    expect(laborCard.WHY).toContain("Labor is rising when it should be declining");
    expect(laborCard.RECOMMENDATION).toContain("Review WD and RM operations");
  });

  test("evaluateAllRules produces H6 yield up profit down trigger output with injected values", () => {
    const seasonData = {
      revenue: { yield_kg_ha: 1100, sellingPrice: 300 },
      costs: { C_tillage: 10000, C_fertilizer: 8000, C_pesticide: 3000, C_irrigation: 0, C_residue: 2000, C_labor: 90000 },
    };
    const priorSeasonData = {
      revenue: { yield_kg_ha: 1000, sellingPrice: 300 },
      costs: { C_tillage: 9000, C_fertilizer: 8000, C_pesticide: 3000, C_irrigation: 0, C_residue: 2000, C_labor: 19000 },
    };
    const cards = evaluateAllRules(seasonData, priorSeasonData, {}, "en");
    const yieldProfitCard = cards.find((card) => card.trigger === "rule11");
    expect(yieldProfitCard).toBeDefined();
    expect(yieldProfitCard.WHAT).toContain("Yield rose from 1000 to 1100 kg/ha");
    expect(yieldProfitCard.WHAT).toContain("but profit fell");
    expect(yieldProfitCard.RECOMMENDATION).toContain("Review application rates and input cost control");
  });

  test("runFullAnalysis stores trend analysis under steps.trends using profit fallback", () => {
    const out = runFullAnalysis(
      {
        costs: { C_tillage: 10000, C_fertilizer: 10000, C_pesticide: 5000, C_irrigation: 0, C_residue: 2000 },
        laborOps: createLaborOps({ L_LP: 2, L_PL: 1, L_WD: 2, L_HV: 1, L_RM: 1, wageRate: 3500 }),
        revenue: { yield_kg_ha: 1000, sellingPrice: 300 },
        csiScores: { s_j1: 1, s_j2: 1, s_j3: 1, s_j4: 1, s_j5: 1, s_j6: 1 },
        trendValues: [100000, 120000, 140000],
      },
      "FARMER",
    );
    expect(out.complete).toBe(true);
    expect(out.steps.trends.profit.deltas.length).toBe(3);
    expect(out.steps.trends.profit.classification).toBe("Improving");
  });

  test("computeVariance returns variance and standard deviation", () => {
    const expected = 180;
    const out = computeVariance([200, 190, 150], [0.2, 0.5, 0.3], expected);
    expect(out.variance).toBeCloseTo(400);
    expect(out.stdDev).toBeCloseTo(20);
  });

  test("getCSIAdjustedProbabilities produces CSI-weighted scenario shares", () => {
    const probs = getCSIAdjustedProbabilities(0.72);
    expect(probs.p_best).toBeCloseTo(0.388);
    expect(probs.p_normal).toBeCloseTo(0.4);
    expect(probs.p_worst).toBeCloseTo(0.212);
    const edgeProbs = getCSIAdjustedProbabilities(0);
    expect(edgeProbs.p_best).toBeCloseTo(0.1);
    expect(edgeProbs.p_normal).toBeCloseTo(0.4);
    expect(edgeProbs.p_worst).toBeCloseTo(0.5);
  });

  test("runFullAnalysis computes D3 TTP when CA and CF profit histories are provided", () => {
    const out = runFullAnalysis(
      {
        costs: { C_tillage: 10000, C_fertilizer: 10000, C_pesticide: 5000, C_irrigation: 0, C_residue: 2000 },
        laborOps: createLaborOps({ L_LP: 2, L_PL: 1, L_WD: 2, L_HV: 1, L_RM: 1, wageRate: 3500 }),
        revenue: { yield_kg_ha: 1000, sellingPrice: 300 },
        csiScores: { s_j1: 1, s_j2: 1, s_j3: 1, s_j4: 1, s_j5: 1, s_j6: 1 },
        profitCA_history: [100000, 120000, 140000],
        profitCF_history: [110000, 115000, 130000],
      },
      "FARMER",
    );
    expect(out.complete).toBe(true);
    expect(out.steps.ttp).toEqual({ reached: true, season: 2 });
    expect(out.steps.cnb_history).toEqual([-10000, -5000, 5000]);
  });

  test("runFullAnalysis computes D2 CA input quantities when CF quantities are provided", () => {
    const out = runFullAnalysis(
      {
        costs: { C_tillage: 10000, C_fertilizer: 10000, C_pesticide: 5000, C_irrigation: 0, C_residue: 2000 },
        laborOps: createLaborOps({ L_LP: 2, L_PL: 1, L_WD: 2, L_HV: 1, L_RM: 1, wageRate: 3500 }),
        revenue: { yield_kg_ha: 1000, sellingPrice: 300 },
        csiScores: { s_j1: 1, s_j2: 1, s_j3: 1, s_j4: 1, s_j5: 1, s_j6: 1 },
        cfQuantities: { tillage: 100, fertilizer: 80, pesticide: 50, irrigation: 20, residue: 10, labor: 40 },
      },
      "FARMER",
    );
    expect(out.complete).toBe(true);
    expect(out.steps.efficiency.caInputQuantities.tillage).toBeCloseTo(76);
    expect(out.steps.efficiency.caInputQuantities.fertilizer).toBeCloseTo(65.6);
    expect(out.steps.efficiency.caInputQuantities.pesticide).toBeCloseTo(39.5);
    expect(out.steps.efficiency.caInputQuantities.irrigation).toBeCloseTo(17);
    expect(out.steps.efficiency.caInputQuantities.residue).toBeCloseTo(7.3);
    expect(out.steps.efficiency.caInputQuantities.labor).toBeCloseTo(35.2);
  });

  test("computeROI, CBR, and CPU follow derived indicator formulas", () => {
    expect(computeROI(180000, 120000)).toBeCloseTo(1.5);
    expect(computeCBR(300000, 120000)).toBeCloseTo(2.5);
    expect(computeCPU(120000, 1000)).toBeCloseTo(120);
  });

  test("computeDeltaC calculates C_system differences with CF - CA direction", () => {
    expect(computeDeltaC(140000, 120000)).toBe(20000);
  });

  test("computeDeltaC is negative when CA is more expensive", () => {
    expect(computeDeltaC(110000, 130000)).toBe(-20000);
  });

  test("computeDeltaProfit calculates profit differences", () => {
    expect(computeDeltaProfit(180000, 150000)).toBe(30000);
  });

  test("computeSystemCost blocks if labor cost is not derived from labor operations", () => {
    const out = runFullAnalysis(
      {
        costs: { C_tillage: 10000, C_fertilizer: 10000, C_pesticide: 5000, C_irrigation: 0, C_residue: 2000 },
        revenue: { yield_kg_ha: 1000, sellingPrice: 300 },
        csiScores: { s_j1: 1, s_j2: 1, s_j3: 1, s_j4: 1, s_j5: 1, s_j6: 1 },
        plotProfits: [150000],
      },
      "FARMER",
    );
    expect(out.complete).toBe(false);
    expect(out.errors.general).toMatch(/disaggregated labor operations are required/);
  });

  test("Farmer mode adoption cost computes only on system transition", () => {
    const out = runFullAnalysis(
      {
        costs: { C_tillage: 10000, C_fertilizer: 8000, C_pesticide: 3000, C_irrigation: 2000, C_residue: 1500 },
        laborOps: createLaborOps({ L_LP: 2, L_PL: 1, L_WD: 2, L_HV: 1, L_RM: 1, wageRate: 3500 }),
        revenue: { yield_kg_ha: 1200, sellingPrice: 400 },
        csiScores: { s_j1: 1, s_j2: 1, s_j3: 1, s_j4: 1, s_j5: 1, s_j6: 1 },
        system: "CA",
        previousSystem: "CF",
        previousProfit: 180000,
        seasonsElapsed: 5,
      },
      "FARMER",
    );
    expect(out.complete).toBe(true);
    expect(out.steps.adoptionCost).toBeGreaterThanOrEqual(0);
    expect(out.steps.adoptionCost).toBe(0); // with current costs this example should be non-negative and valid
  });

  test("runFullAnalysis computes adoption trend when prior adoption cost history is provided", () => {
    const out = runFullAnalysis(
      {
        costs: { C_tillage: 10000, C_fertilizer: 10000, C_pesticide: 10000, C_irrigation: 0, C_residue: 0 },
        laborOps: createLaborOps({ L_LP: 1, L_PL: 1, L_WD: 1, L_HV: 1, L_RM: 1, wageRate: 2000 }),
        revenue: { yield_kg_ha: 1000, sellingPrice: 150 },
        csiScores: { s_j1: 1, s_j2: 1, s_j3: 1, s_j4: 1, s_j5: 1, s_j6: 1 },
        system: "CA",
        previousSystem: "CF",
        previousProfit: 180000,
        adoptionCostHistory: [120000, 100000],
        seasonsElapsed: 5,
      },
      "FARMER",
    );
    expect(out.complete).toBe(true);
    expect(out.steps.adoptionCostHistory).toEqual([120000, 100000, 70000]);
    expect(out.steps.adoptionTrend.trendDirection).toBe("Decreasing");
  });

  test("Farmer mode adoption cost is null when the system remains stable", () => {
    const out = runFullAnalysis(
      {
        costs: { C_tillage: 10000, C_fertilizer: 8000, C_pesticide: 3000, C_irrigation: 2000, C_residue: 1500 },
        laborOps: createLaborOps({ L_LP: 2, L_PL: 1, L_WD: 2, L_HV: 1, L_RM: 1, wageRate: 3500 }),
        revenue: { yield_kg_ha: 1200, sellingPrice: 400 },
        csiScores: { s_j1: 1, s_j2: 1, s_j3: 1, s_j4: 1, s_j5: 1, s_j6: 1 },
        system: "CA",
        previousSystem: "CA",
        previousProfit: 180000,
        seasonsElapsed: 5,
      },
      "FARMER",
    );
    expect(out.complete).toBe(true);
    expect(out.steps.adoptionCost).toBeNull();
  });

  test("computeWelchTTest uses Welch formula and rounds df down", () => {
    const groupA = [12, 13, 14, 20];
    const groupB = [9, 10, 11, 12];
    const out = computeWelchTTest(groupA, groupB, "RESEARCH");
    expect(out.df).toBe(3);
    expect(out.t_stat).toBeCloseTo(2.2258, 3);
  });

  test("computeWelchStandardError and computeWelchDF implement I5 formula", () => {
    const vA = 12.916666666666666;
    const vB = 1.6666666666666667;
    const nA = 4;
    const nB = 4;
    expect(computeWelchStandardError(vA, nA, vB, nB)).toBeCloseTo(1.909, 3);
    expect(computeWelchDF(vA, nA, vB, nB)).toBe(3);
  });

  test("computePooledStdDev implements I6 pooled standard deviation", () => {
    const s_A = 3.592;
    const s_B = 1.291;
    const n_A = 4;
    const n_B = 4;
    const pooled = computePooledStdDev(s_A, n_A, s_B, n_B);
    expect(pooled).toBeCloseTo(2.699, 3);
  });

  test("computeCohenD calculates effect size and classifies magnitude", () => {
    const mean_A = 14.75;
    const mean_B = 9.5;
    const s_A = 3.592;
    const s_B = 1.291;
    const n_A = 4;
    const n_B = 4;
    const result = computeCohenD(mean_A, mean_B, s_A, n_A, s_B, n_B, "RESEARCH");
    expect(result.d).toBeCloseTo(1.945, 3);
    expect(result.magnitude).toBe("Large");
  });

  test("computeCohenD classifies magnitude correctly for different effect sizes", () => {
    const test_cases = [
      { d: 0.1, expected: "Negligible" },
      { d: 0.35, expected: "Small" },
      { d: 0.65, expected: "Medium" },
      { d: -1.2, expected: "Large" },
    ];
    test_cases.forEach(({ d, expected }) => {
      const result = computeCohenD(d, 0, 1, 4, 1, 4, "RESEARCH");
      expect(result.magnitude).toBe(expected);
    });
  });

  test("computeEtaSquared calculates effect size for ANOVA", () => {
    const SS_treatment = 18;
    const SS_total = 30;
    const result = computeEtaSquared(SS_treatment, SS_total, "RESEARCH");
    expect(result.etaSquared).toBeCloseTo(0.6, 1);
    expect(result.magnitude).toBe("Large");
  });

  test("computeEtaSquared classifies magnitude correctly for all ranges", () => {
    const test_cases = [
      { SS_treatment: 3, SS_total: 60, expected: "Small" },
      { SS_treatment: 12, SS_total: 100, expected: "Medium" },
      { SS_treatment: 20, SS_total: 100, expected: "Large" },
    ];
    test_cases.forEach(({ SS_treatment, SS_total, expected }) => {
      const result = computeEtaSquared(SS_treatment, SS_total, "RESEARCH");
      expect(result.magnitude).toBe(expected);
    });
  });

  test("computeTukeyQCritical returns appropriate critical values", () => {
    expect(computeTukeyQCritical(0.05, 3, 6)).toBe(3.559);
    expect(computeTukeyQCritical(0.05, 3, 9)).toBe(3.398);
    expect(computeTukeyQCritical(0.05, 4, 6)).toBe(4.18);
  });

  test("computeTukeyHSD identifies significant and non-significant pairs", () => {
    const groups = [
      { treatmentId: "A", observations: [1, 2, 3] },
      { treatmentId: "B", observations: [2, 3, 4] },
      { treatmentId: "C", observations: [10, 11, 12] },
    ];
    const results = computeTukeyHSD(groups, 1, 6, "RESEARCH");
    expect(results.length).toBe(3);
    expect(results.some((r) => r.treatment_A === "A" && r.treatment_B === "C" && r.significant)).toBe(true);
    expect(results.some((r) => r.treatment_A === "A" && r.treatment_B === "B" && !r.significant)).toBe(true);
  });

  test("computeFisherLSD computes t-critical threshold correctly", () => {
    const groups = [
      { treatmentId: "A", observations: [10, 11, 12] },
      { treatmentId: "B", observations: [7, 8, 9] },
      { treatmentId: "C", observations: [12, 13, 14] },
    ];
    const results = computeFisherLSD(groups, 1, 6, "RESEARCH");
    expect(results.length).toBe(3);
    expect(results.every((r) => r.threshold > 0)).toBe(true);
    expect(results.every((r) => typeof r.significant === "boolean")).toBe(true);
  });

  test("ANOVA SS_treatment + SS_error = SS_total", () => {
    const out = computeOneWayANOVA(
      [
        { treatmentId: "CA", observations: [10, 11, 12] },
        { treatmentId: "CF", observations: [7, 8, 9] },
        { treatmentId: "CA+", observations: [12, 13, 14] },
      ],
      "RESEARCH",
    );
    expect(out.SS_treatment + out.SS_error).toBeCloseTo(out.SS_total, 8);
  });

  test("ANOVA computes df_treatment = k-1 and df_error = N-k", () => {
    const out = computeOneWayANOVA(
      [
        { treatmentId: "CA", observations: [10, 11, 12] },
        { treatmentId: "CF", observations: [7, 8, 9] },
        { treatmentId: "CA+", observations: [12, 13, 14] },
      ],
      "RESEARCH",
    );
    expect(out.df_treatment).toBe(2);
    expect(out.df_error).toBe(6);
  });

  test("ANOVA computes MS_treatment and MS_error correctly", () => {
    const out = computeOneWayANOVA(
      [
        { treatmentId: "CA", observations: [10, 11, 12] },
        { treatmentId: "CF", observations: [7, 8, 9] },
        { treatmentId: "CA+", observations: [12, 13, 14] },
      ],
      "RESEARCH",
    );
    expect(out.MS_treatment).toBeCloseTo(out.SS_treatment / out.df_treatment, 8);
    expect(out.MS_error).toBeCloseTo(out.SS_error / out.df_error, 8);
  });

  test("ANOVA F-statistic is MS_treatment / MS_error", () => {
    const out = computeOneWayANOVA(
      [
        { treatmentId: "CA", observations: [10, 11, 12] },
        { treatmentId: "CF", observations: [7, 8, 9] },
        { treatmentId: "CA+", observations: [12, 13, 14] },
      ],
      "RESEARCH",
    );
    expect(out.F).toBeCloseTo(out.MS_treatment / out.MS_error, 8);
    expect(out.F).toBeGreaterThan(0);
  });

  test("ANOVA with high treatment variance rejects H0", () => {
    const out = computeOneWayANOVA(
      [
        { treatmentId: "A", observations: [1, 2, 3] },
        { treatmentId: "B", observations: [10, 11, 12] },
        { treatmentId: "C", observations: [20, 21, 22] },
      ],
      "RESEARCH",
    );
    expect(out.reject_H0).toBe(true);
    expect(out.p_value).toBeLessThan(0.05);
  });

  test("computeMean calculates treatment mean in research mode", () => {
    expect(computeMean([10, 12, 14], "RESEARCH")).toBeCloseTo(12);
  });

  test("computeTreatmentMeans returns mean per treatment", () => {
    const groups = [
      { treatmentId: "CA", observations: [10, 11, 12] },
      { treatmentId: "CF", observations: [8, 9, 10] },
    ];
    const result = computeTreatmentMeans(groups, "RESEARCH");
    expect(result).toEqual([
      { treatmentId: "CA", mean: 11 },
      { treatmentId: "CF", mean: 9 },
    ]);
  });

  test("computeSampleVariance and computeStdDev match expected formulas", () => {
    const data = [10, 12, 14, 16];
    const variance = computeSampleVariance(data, null, "RESEARCH");
    expect(variance).toBeCloseTo(6.6666666667, 8);
    expect(computeStdDev(variance, "RESEARCH")).toBeCloseTo(2.581989, 6);
  });

  test("computeCV returns percentage and warns when high", () => {
    const result = computeCV(20, 80, "RESEARCH");
    expect(result.cv).toBeCloseTo(25);
    expect(result.warning).toBe("HIGH experimental noise");
  });

  test("computeCI95 returns the correct confidence interval", () => {
    const result = computeCI95(100, 10, 5, "RESEARCH");
    expect(result.lower).toBeLessThan(100);
    expect(result.upper).toBeGreaterThan(100);
    expect(result.upper - result.lower).toBeGreaterThan(0);
  });

  test("runFullAnalysis blocks step 5 before prerequisites", () => {
    const out = runFullAnalysis(
      {
        costs: { C_tillage: 10, C_fertilizer: 10, C_pesticide: 10, C_irrigation: 10, C_residue: 10 },
        laborOps: createLaborOps({ L_LP: 2, L_PL: 1, L_WD: 1, L_HV: 1, L_RM: 1, wageRate: 2500 }),
        revenue: { yield_kg_ha: 100, sellingPrice: 20 },
        csiScores: { s_j1: 1, s_j2: 1, s_j3: 1, s_j4: 1, s_j5: 1, s_j6: 1 },
        trendValues: [10, 12],
        treatmentCount: 2,
        rcbdValid: true,
        stats: { groupA: [10, 11], groupB: [9, 8] }
      },
      "RESEARCH",
    );
    expect(out.complete).toBe(false);
    expect(out.errors.general).toMatch(/BLOCKED Adoption Cost/);
  });

  test("selectStatisticalTest returns null in farmer mode", () => {
    expect(selectStatisticalTest(2, true, "FARMER")).toBeNull();
  });

  test("buildHypothesisStatement generates T-Test hypotheses (J1)", () => {
    const h = buildHypothesisStatement("WELCH_T_TEST");
    expect(h.testType).toBe("T-Test");
    expect(h.H0).toBe("μ_CA = μ_CF");
    expect(h.H1).toBe("μ_CA ≠ μ_CF");
    expect(h.H0_meaning).toContain("No difference");
    expect(h.H1_meaning).toContain("significant difference");
  });

  test("buildHypothesisStatement generates ANOVA hypotheses (J1)", () => {
    const h = buildHypothesisStatement("ONE_WAY_ANOVA");
    expect(h.testType).toBe("ANOVA");
    expect(h.H0).toContain("μ₁ = μ₂");
    expect(h.H1).toContain("At least one");
    expect(h.H0_meaning).toContain("All treatment means");
    expect(h.H1_meaning.toLowerCase()).toContain("at least one treatment");
  });

  test("decideTTest rejects H0 when p < 0.05 (J2)", () => {
    const result = decideTTest({
      p_value: 0.03,
      effectSize: { d: 1.5, magnitude: "Large" },
      ci: { lower: 2.1, upper: 5.3 },
    });
    expect(result.decision).toBe("REJECT_H0");
    expect(result.label).toBe("REJECT H0");
    expect(result.plainLanguage).toContain("statistically significant difference");
    expect(result.hypothesis).toBeDefined();
    expect(result.confidence).toBe(0.95);
  });

  test("decideTTest fails to reject H0 when p >= 0.05 (J2)", () => {
    const result = decideTTest({
      p_value: 0.08,
      effectSize: { d: 0.4, magnitude: "Small" },
      ci: { lower: -0.5, upper: 2.8 },
    });
    expect(result.decision).toBe("FAIL_TO_REJECT_H0");
    expect(result.label).toBe("FAIL TO REJECT H0");
    expect(result.plainLanguage).toContain("No statistically significant difference");
    expect(result.p_value).toBe(0.08);
    expect(result.effectSize).toBeDefined();
    expect(result.ci).toBeDefined();
  });

  test("decideANOVA runs post-hoc when p < 0.05 (J2)", () => {
    const result = decideANOVA({
      p_value: 0.02,
      effectSize: { etaSquared: 0.18, magnitude: "Large" },
      ci: { lower: 1.2, upper: 8.9 },
      treatmentCount: 4,
    });
    expect(result.decision).toBe("REJECT_H0");
    expect(result.runPostHoc).toBe(true);
    expect(result.postHocType).toBe("TUKEY_HSD");
    expect(result.numPairwiseComparisons).toBe(6);
    expect(result.plainLanguage).toContain("At least one treatment mean differs");
    expect(result.plainLanguage).toContain("Tukey HSD");
  });

  test("decideANOVA does NOT run post-hoc when p >= 0.05 (J2)", () => {
    const result = decideANOVA({
      p_value: 0.12,
      effectSize: { etaSquared: 0.08, magnitude: "Small" },
      ci: { lower: -0.5, upper: 3.2 },
      treatmentCount: 3,
    });
    expect(result.decision).toBe("FAIL_TO_REJECT_H0");
    expect(result.runPostHoc).toBe(false);
    expect(result.postHocType).toBeNull();
    expect(result.numPairwiseComparisons).toBe(0);
    expect(result.plainLanguage).toContain("No significant difference");
    expect(result.plainLanguage).toContain("not performed");
  });

  test("decideANOVA computes correct number of pairwise comparisons", () => {
    const result3 = decideANOVA({
      p_value: 0.01,
      effectSize: { etaSquared: 0.25, magnitude: "Large" },
      ci: { lower: 1, upper: 5 },
      treatmentCount: 3,
    });
    expect(result3.numPairwiseComparisons).toBe(3);

    const result5 = decideANOVA({
      p_value: 0.01,
      effectSize: { etaSquared: 0.25, magnitude: "Large" },
      ci: { lower: 1, upper: 5 },
      treatmentCount: 5,
    });
    expect(result5.numPairwiseComparisons).toBe(10);
  });

  test("getDecisionFlow routes to correct test based on treatment count and mode", () => {
    expect(getDecisionFlow("RESEARCH", 2, true)).toBe("WELCH_T_TEST");
    expect(getDecisionFlow("RESEARCH", 3, true)).toBe("ONE_WAY_ANOVA");
    expect(getDecisionFlow("RESEARCH", 4, true)).toBe("ONE_WAY_ANOVA");
    expect(getDecisionFlow("FARMER", 2, true)).toBe("NO_STATISTICS");
    expect(getDecisionFlow("RESEARCH", 2, false)).toBe("NO_STATISTICS");
  });

  test("runStatisticalFlowchart completes all 11 steps for T-Test (J3)", () => {
    const groups = [
      { treatmentId: "CA", observations: [12, 13, 14, 20] },
      { treatmentId: "CF", observations: [9, 10, 11, 12] },
    ];
    const result = runStatisticalFlowchart(groups, "RESEARCH", { rcbdValid: true });
    expect(result.step1_treatmentCount).toBe(2);
    expect(result.step2_rcbdValid).toBe(true);
    expect(result.step3_researchMode).toBe(true);
    expect(result.step4_selectedTest).toBe("WELCH_T_TEST");
    expect(result.step5_plotData).toHaveLength(2);
    expect(result.step6_testStatistic).toBeDefined();
    expect(result.step7_criticalValue).toBeDefined();
    expect(result.step8_pValue).toBeDefined();
    expect(result.step9_decision).toBeDefined();
    expect(result.step11_output).toBeDefined();
    expect(result.error).toBeNull();
  });

  test("runStatisticalFlowchart completes all 11 steps for ANOVA (J3)", () => {
    const groups = [
      { treatmentId: "CA", observations: [10, 11, 12] },
      { treatmentId: "CF", observations: [7, 8, 9] },
      { treatmentId: "CA+", observations: [12, 13, 14] },
    ];
    const result = runStatisticalFlowchart(groups, "RESEARCH", { rcbdValid: true });
    expect(result.step1_treatmentCount).toBe(3);
    expect(result.step2_rcbdValid).toBe(true);
    expect(result.step3_researchMode).toBe(true);
    expect(result.step4_selectedTest).toBe("ONE_WAY_ANOVA");
    expect(result.step5_plotData).toHaveLength(3);
    expect(result.step6_testStatistic).toBeDefined();
    expect(result.step8_pValue).toBeDefined();
    expect(result.step9_decision).toBeDefined();
    expect(result.step11_output).toBeDefined();
    expect(result.error).toBeNull();
  });

  test("runStatisticalFlowchart halts at Step 2 when RCBD is invalid", () => {
    const groups = [
      { treatmentId: "CA", observations: [1, 2] },
      { treatmentId: "CF", observations: [3, 4] },
    ];
    const result = runStatisticalFlowchart(groups, "RESEARCH", { rcbdValid: false });
    expect(result.step2_rcbdValid).toBe(false);
    expect(result.error).toContain("Step 2");
    expect(result.step4_selectedTest).toBeNull();
  });

  test("runStatisticalFlowchart halts at Step 3 when not in Research mode", () => {
    const groups = [
      { treatmentId: "CA", observations: [1, 2] },
      { treatmentId: "CF", observations: [3, 4] },
    ];
    const result = runStatisticalFlowchart(groups, "FARMER", { rcbdValid: true });
    expect(result.step3_researchMode).toBe(false);
    expect(result.error).toContain("Step 3");
    expect(result.step4_selectedTest).toBeNull();
  });

  test("runStatisticalFlowchart Step 11 output includes all required reporting fields", () => {
    const groups = [
      { treatmentId: "A", observations: [1, 2, 3] },
      { treatmentId: "B", observations: [10, 11, 12] },
    ];
    const result = runStatisticalFlowchart(groups, "RESEARCH", { rcbdValid: true });
    expect(result.step11_output).toHaveProperty("p_value");
    expect(result.step11_output).toHaveProperty("effectSize");
    expect(result.step11_output).toHaveProperty("ci");
    expect(result.step11_output).toHaveProperty("confidence");
    expect(result.step11_output).toHaveProperty("plainLanguage");
    expect(result.step11_output).toHaveProperty("hypothesis");
  });

  test("CSI driver metadata includes all six weighted drivers", () => {
    const keys = Object.keys(CSI_DRIVERS);
    expect(keys).toEqual(["s_j1", "s_j2", "s_j3", "s_j4", "s_j5", "s_j6"]);
    const totalWeight = keys.reduce((sum, key) => sum + CSI_DRIVERS[key].weight, 0);
    expect(totalWeight).toBeCloseTo(1);
  });

  test("computeCSI computes weighted average and classification", () => {
    const out = computeCSI({ s_j1: 1, s_j2: 1, s_j3: 0, s_j4: 0, s_j5: 0, s_j6: 0 });
    expect(out.csi).toBeCloseTo(0.45);
    expect(out.classification).toBe("MODERATE");
    expect(out.warning).toBe(false);
  });

  test("computeCSI returns high classification for dominant favorable context", () => {
    const out = computeCSI({ s_j1: 1, s_j2: 1, s_j3: 1, s_j4: 1, s_j5: 1, s_j6: 1 });
    expect(out.csi).toBeCloseTo(1);
    expect(out.classification).toBe("HIGH");
    expect(out.warning).toBe(false);
  });

  test("computeCSI defaults when missing", () => {
    const out = computeCSI({ s_j1: 0.8 });
    expect(out.csi).toBe(0.5);
    expect(out.warning).toBe(true);
  });

  test("classifyTrend covers key classes", () => {
    expect(classifyTrend([null, 1, 2])).toBe("Improving");
    expect(classifyTrend([null, -1, -2])).toBe("Declining");
    expect(classifyTrend([null, 1, -1, 1])).toBe("Volatile");
    expect(classifyTrend([null, -1, 1])).toBe("Volatile");
    expect(classifyTrend([null, 0.00001, -0.00001])).toBe("Stable");
    expect(classifyTrend([null])).toBe("Insufficient");
  });

  test("evaluateAllRules can trigger all 12", () => {
    const cards = evaluateAllRules(
      { agronomics: { pestIncidence: 35 } },
      {},
      {
        profitDecline2Seasons: true,
        weedYieldChain: true,
        caTillageLower: true,
        soilImproved: true,
        adoptionDeclining2: true,
        adoptionIncreasing2: true,
        fertCostUpYieldFlat: true,
        irrCostUpSoilStable: true,
        yieldUpProfitDown: true,
        ttpConfirmed: true,
      },
      "en",
    );
    expect(cards.length).toBe(12);
  });
});
