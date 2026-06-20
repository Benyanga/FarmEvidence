import { messageTemplates } from "./messageTemplates.js";
import { computeRevenue } from "../formulas/revenue.js";
import { computeSystemCost } from "../formulas/costs.js";
import { computeProfit } from "../formulas/profit.js";
import { computeLaborCost } from "../formulas/labor.js";
import { getPhaseMultiplier } from "../efficiency/phaseMultiplier.js";

function normalizeTemplate(msg, trigger) {
  return {
    WHAT: msg?.WHAT ?? trigger,
    WHY: msg?.WHY ?? "",
    HOW: msg?.HOW ?? "",
    RECOMMENDATION: msg?.RECOMMENDATION ?? "",
  };
}

function card(trigger, severity, lang = "en", context = {}) {
  const msg = messageTemplates[trigger]?.[lang] ?? messageTemplates[trigger]?.en ?? {};
  const normalized = normalizeTemplate(msg, trigger);
  
  if (context && Object.keys(context).length > 0) {
    return { trigger, ...normalized, ...context, severity };
  }
  return { trigger, ...normalized, severity };
}

function getCostValue(seasonData, key) {
  if (!seasonData?.costs) return null;
  return seasonData.costs[`C_${key}`] ?? seasonData.costs[key] ?? null;
}

function toDecimalDays(time, unit, workers = 1) {
  if (!time || time <= 0) return 0;
  switch (unit) {
    case "seconds": return (time / (8 * 3600)) * workers;
    case "minutes": return (time / (8 * 60)) * workers;
    case "hours": return (time / 8) * workers;
    case "days":
    default:
      return time * workers;
  }
}

function getLaborOperationDays(laborOps, code) {
  if (!laborOps || !Array.isArray(laborOps.operations)) return 0;
  const op = laborOps.operations.find((item) => item.code === code);
  if (!op) return 0;
  return toDecimalDays(Number(op.time) || 0, op.unit || "hours", Number(op.workers) || 1);
}

function getWeedingCostFromLaborOps(laborOps) {
  if (!laborOps || !Array.isArray(laborOps.operations)) return 0;
  try {
    const labor = computeLaborCost(laborOps);
    const wdOperation = labor.operations.find((op) => op.code === "WD");
    return wdOperation?.cost ?? 0;
  } catch (_) {
    return 0;
  }
}

function getLaborCostFromSeason(seasonData) {
  if (!seasonData?.laborOps || !Array.isArray(seasonData.laborOps.operations)) return null;
  try {
    return computeLaborCost(seasonData.laborOps).C_labor;
  } catch (_) {
    return null;
  }
}

function getProfitValue(season) {
  if (typeof season?.computedProfit === "number") return season.computedProfit;
  if (typeof season?.profit === "number") return season.profit;
  if (season?.revenue?.yield_kg_ha != null && season?.revenue?.sellingPrice != null && season?.costs) {
    const revenue = computeRevenue(season.revenue.yield_kg_ha, season.revenue.sellingPrice);
    const costInputs = { ...season.costs };
    if (costInputs.C_labor == null) {
      const laborCost = getLaborCostFromSeason(season);
      if (laborCost != null) {
        costInputs.C_labor = laborCost;
      }
    }
    return computeProfit(revenue, computeSystemCost(costInputs));
  }
  return 0;
}

function buildWeedChainContext(seasonData, priorSeasonData) {
  const weedCurrent = seasonData?.agronomics?.weedScore ?? 0;
  const weedPrior = priorSeasonData?.agronomics?.weedScore ?? 0;
  const yieldCurrent = seasonData?.revenue?.yield_kg_ha ?? 0;
  const yieldPrior = priorSeasonData?.revenue?.yield_kg_ha ?? 0;
  const profitCurrent = getProfitValue(seasonData);
  const profitPrior = getProfitValue(priorSeasonData);
  const residueCover = seasonData?.agronomics?.residueCover ?? 0;
  const laborWeedingCurrent = getLaborOperationDays(seasonData?.laborOps, "WD");
  const laborWeedingPrior = getLaborOperationDays(priorSeasonData?.laborOps, "WD");
  const laborWeedingCostCurrent = getWeedingCostFromLaborOps(seasonData?.laborOps);
  const laborWeedingCostPrior = getWeedingCostFromLaborOps(priorSeasonData?.laborOps);

  const weedDelta = weedCurrent - weedPrior;
  const yieldDeclinePercent = yieldPrior > 0 ? ((yieldPrior - yieldCurrent) / yieldPrior * 100).toFixed(1) : 0;
  const laborWeedingDelta = laborWeedingCurrent - laborWeedingPrior;
  const laborWeedingCostDelta = laborWeedingCostCurrent - laborWeedingCostPrior;
  const profitDelta = profitCurrent - profitPrior;
  const triggered = weedDelta >= 1 && yieldCurrent < yieldPrior && profitDelta < 0;

  return {
    triggered,
    WHAT: `Weed pressure score increased from ${weedPrior} to ${weedCurrent}. Yield declined from ${yieldPrior} kg/ha to ${yieldCurrent} kg/ha (-${yieldDeclinePercent}%). Profit declined from ${profitPrior.toFixed(0)} RWF/ha to ${profitCurrent.toFixed(0)} RWF/ha.`,
    WHY: `Increased weed pressure reduced photosynthetic capacity and nutrient availability, leading to suppressed yield and declining profitability. Weeding labor cost also increased by ${laborWeedingCostDelta.toFixed(0)} RWF/ha.`,
    HOW: `Weed competition during early vegetative stages diverts water and nutrients from the crop. CA mulch suppresses this risk only if residue cover is ≥50%. Current residue cover is ${residueCover}%. This mechanism shows the causal chain from field management to financial outcomes.`,
    RECOMMENDATION: `Increase residue cover before next planting to ≥50%. Apply spot herbicide when weed score reaches 2—before escalation to 3+. Monitor early season weeding labor intensity as a cost control lever.`,
  };
}

function buildSoilConditionContext(seasonData, priorSeasonData) {
  const soilCurrent = seasonData?.agronomics?.soilScore;
  const soilPrior = priorSeasonData?.agronomics?.soilScore;
  const improvement = typeof soilCurrent === "number" && typeof soilPrior === "number" ? soilCurrent - soilPrior : 0;
  const triggered = improvement >= 1;

  return {
    triggered,
    WHAT: `Soil condition improved from ${soilPrior} to ${soilCurrent}. Projected fertilizer efficiency gain: 5-10% next season.`,
    WHY: `Improving SOM and biological activity indicate CA residue retention is building soil carbon and biological cycling capacity.`,
    HOW: `Increasing SOM improves nitrogen mineralization, reducing the gap between fertilizer input and crop nutrient availability.`,
    RECOMMENDATION: `Reduce fertilizer 5% next season as a trial. Monitor yield response before applying larger reductions. Record j2 and fauna score each season.`,
  };
}

function buildAdoptionCostDeclineContext(seasonData, computedResults) {
  const adoptionHistory = Array.isArray(seasonData?.adoptionCostHistory) ? seasonData.adoptionCostHistory : [];
  const values = adoptionHistory.filter((value) => typeof value === "number" && !Number.isNaN(value));
  const current = values[values.length - 1];
  const prior = values[values.length - 2];
  const deltas = values.slice(1).map((value, index) => value - values[index]);
  const consecutiveDeclines = deltas.length >= 2 && deltas.slice(-2).every((delta) => delta < 0);
  const triggered = computedResults?.adoptionDeclining2 ?? consecutiveDeclines;

  return {
    triggered,
    WHAT: typeof prior === "number" && typeof current === "number"
      ? `AdoptionCost decreased from ${prior.toFixed(0)} to ${current.toFixed(0)} RWF/ha. Current gap vs CF: ${current.toFixed(0)} RWF/ha.`
      : undefined,
    WHY: `CA cost structure is improving as farmer gains experience, soil conditions improve, and system-specific efficiencies accumulate.`,
    HOW: `CA performance improves as: (1) weed suppression from mulch becomes more effective; (2) soil biological activity increases; (3) farmer skill reduces inefficiencies. These compound each season.`,
    RECOMMENDATION: `Continue monitoring. Ensure residue retention is maintained consistently as the primary driver of improvement.`,
  };
}

function buildTillageCostContext(seasonData) {
  const costCA = seasonData?.costCA?.C_tillage ?? seasonData?.costCA?.tillage ?? null;
  const costCF = seasonData?.costCF?.C_tillage ?? seasonData?.costCF?.tillage ?? null;
  const caLower = typeof costCA === "number" && typeof costCF === "number" && costCA < costCF;
  const savings = caLower ? costCF - costCA : 0;
  const reductionPercent = caLower && costCF > 0 ? ((savings / costCF) * 100).toFixed(1) : null;
  return {
    triggered: caLower,
    WHAT: caLower
      ? `CA tillage cost: ${costCA.toFixed(0)} RWF/ha. CF tillage cost: ${costCF.toFixed(0)} RWF/ha. Saving: ${savings.toFixed(0)} RWF/ha (${reductionPercent}%).`
      : undefined,
    CA_tillage: costCA,
    CF_tillage: costCF,
    saving: savings,
    reductionPercent,
  };
}

function buildPesticidePestContext(seasonData, priorSeasonData) {
  const pesticideCurrent = getCostValue(seasonData, "pesticide");
  const pesticidePrior = getCostValue(priorSeasonData, "pesticide");
  const pestIncidence = seasonData?.agronomics?.pestIncidence ?? 0;
  const triggered = typeof pesticideCurrent === "number" && typeof pesticidePrior === "number"
    && pesticideCurrent > pesticidePrior && pestIncidence >= 30;

  const currentLabel = typeof pesticideCurrent === "number" ? pesticideCurrent.toFixed(0) : "unknown";
  const priorLabel = typeof pesticidePrior === "number" ? pesticidePrior.toFixed(0) : "unknown";

  return {
    triggered,
    WHAT: `Pesticide cost increased from ${priorLabel} to ${currentLabel} RWF/ha while pest incidence reached ${pestIncidence}%.`,
    WHY: `Pest population exceeded economic injury level and pesticide use rose, indicating control efforts are not yet reducing infestation pressure.`,
    HOW: `Higher pest incidence despite increased pesticide spending suggests pests are escaping current treatment timing or resistance thresholds.`,
    RECOMMENDATION: `Review IPM strategy and apply targeted intervention before next season to break the inflection cycle.`,
  };
}

function buildFertilizerYieldContext(seasonData, priorSeasonData, computedResults) {
  const fertilizerCurrent = getCostValue(seasonData, "fertilizer");
  const fertilizerPrior = getCostValue(priorSeasonData, "fertilizer");
  const yieldCurrent = seasonData?.revenue?.yield_kg_ha;
  const yieldPrior = priorSeasonData?.revenue?.yield_kg_ha;
  const triggered = computedResults?.fertCostUpYieldFlat ?? (
    typeof fertilizerCurrent === "number" && typeof fertilizerPrior === "number"
    && fertilizerCurrent > fertilizerPrior
    && yieldCurrent != null && yieldPrior != null
    && yieldCurrent <= yieldPrior
  );

  const currentLabel = typeof fertilizerCurrent === "number" ? fertilizerCurrent.toFixed(0) : "unknown";
  const priorLabel = typeof fertilizerPrior === "number" ? fertilizerPrior.toFixed(0) : "unknown";
  const yieldCurrentLabel = yieldCurrent != null ? yieldCurrent : "unknown";
  const yieldPriorLabel = yieldPrior != null ? yieldPrior : "unknown";

  return {
    triggered,
    WHAT: `Fertilizer cost increased from ${priorLabel} to ${currentLabel} RWF/ha while yield remained flat or declined (from ${yieldPriorLabel} to ${yieldCurrentLabel} kg/ha).`,
    WHY: `Fertilizer efficiency is declining because nutrient use is not translating into higher crop output.`,
    HOW: `Possible nutrient lock-up, pH imbalance, or poor uptake is preventing additional fertilizer from boosting yield.`,
    RECOMMENDATION: `Soil test before the next application to identify limiting factors and correct fertilizer management.`,
  };
}

function buildIrrigationSoilContext(seasonData, priorSeasonData, computedResults) {
  const irrigationCurrent = getCostValue(seasonData, "irrigation");
  const irrigationPrior = getCostValue(priorSeasonData, "irrigation");
  const soilCurrent = seasonData?.agronomics?.soilScore;
  const soilPrior = priorSeasonData?.agronomics?.soilScore;
  const soilStable = soilCurrent != null && soilPrior != null && soilCurrent <= soilPrior;
  const triggered = computedResults?.irrCostUpSoilStable ?? (
    typeof irrigationCurrent === "number" && typeof irrigationPrior === "number"
    && irrigationCurrent > irrigationPrior
    && soilStable
  );

  const currentLabel = typeof irrigationCurrent === "number" ? irrigationCurrent.toFixed(0) : "unknown";
  const priorLabel = typeof irrigationPrior === "number" ? irrigationPrior.toFixed(0) : "unknown";
  const soilLabel = soilCurrent != null ? soilCurrent : "unknown";

  return {
    triggered,
    WHAT: `Irrigation cost increased from ${priorLabel} to ${currentLabel} RWF/ha while soil condition remained stable at ${soilLabel}.`,
    WHY: `Water demand rose without measurable soil improvement.`,
    HOW: `Insufficient residue cover or water management is allowing evaporation and runoff instead of boosting soil health.`,
    RECOMMENDATION: `Improve mulch and water retention practices to make irrigation more effective.`,
  };
}

function buildCALaborStabilizationContext(seasonData, priorSeasonData, computedResults) {
  const seasonCount = seasonData?.seasonsElapsed;
  let phaseName = null;
  try {
    phaseName = seasonCount ? getPhaseMultiplier(seasonCount).phaseName : null;
  } catch (_) {
    phaseName = null;
  }
  const laborCurrent = getLaborOperationDays(seasonData?.laborOps, "WD") + getLaborOperationDays(seasonData?.laborOps, "RM");
  const laborPrior = getLaborOperationDays(priorSeasonData?.laborOps, "WD") + getLaborOperationDays(priorSeasonData?.laborOps, "RM");
  const triggered = computedResults?.caLaborUpStabilization ?? (
    phaseName === "STABILIZATION" && laborCurrent > laborPrior
  );

  return {
    triggered,
    WHAT: `CA labor demand increased from ${laborPrior} to ${laborCurrent} WD while in STABILIZATION phase.`,
    WHY: `Labor is rising when it should be declining as CA practices consolidate.`,
    HOW: `Possible residue burden or weed rebound is increasing weeding and residue management effort.`,
    RECOMMENDATION: `Review WD and RM operations to reduce unnecessary labor and stabilize effort.`,
  };
}

function buildYieldProfitMismatchContext(seasonData, priorSeasonData, computedResults) {
  const yieldCurrent = seasonData?.revenue?.yield_kg_ha;
  const yieldPrior = priorSeasonData?.revenue?.yield_kg_ha;
  const profitCurrent = getProfitValue(seasonData);
  const profitPrior = getProfitValue(priorSeasonData);
  const triggered = computedResults?.yieldUpProfitDown ?? (
    yieldCurrent != null && yieldPrior != null && yieldCurrent > yieldPrior
    && profitCurrent < profitPrior
  );

  return {
    triggered,
    WHAT: `Yield rose from ${yieldPrior} to ${yieldCurrent} kg/ha, but profit fell from ${profitPrior.toFixed(0)} to ${profitCurrent.toFixed(0)} RWF/ha.`,
    WHY: `Higher output did not improve profitability because cost increases outpaced revenue gains.`,
    HOW: `Input costs increased faster than revenue, eroding margin despite higher yield.`,
    RECOMMENDATION: `Review application rates and input cost control to align yield gains with profit improvement.`,
  };
}

export function evaluateAllRules(seasonData, priorSeasonData, computedResults, lang = "en") {
  const cards = [card("rule1", "positive", lang)];
  if (computedResults?.profitDecline2Seasons) cards.push(card("rule2", "advisory", lang));
  
  const weedChain = buildWeedChainContext(seasonData, priorSeasonData);
  const weedChainEnabled = computedResults?.weedYieldChain ?? weedChain.triggered;
  if (weedChainEnabled) {
    cards.push(weedChain.triggered ? card("rule3", "critical", lang, weedChain) : card("rule3", "critical", lang));
  }
  
  const tillageContext = buildTillageCostContext(seasonData);
  const tillageEnabled = computedResults?.caTillageLower ?? tillageContext.triggered;
  if (tillageEnabled) {
    cards.push(tillageContext.triggered ? card("rule4", "positive", lang, tillageContext) : card("rule4", "positive", lang));
  }

  const soilConditionContext = buildSoilConditionContext(seasonData, priorSeasonData);
  const soilImprovedEnabled = computedResults?.soilImproved ?? soilConditionContext.triggered;
  if (soilImprovedEnabled) {
    cards.push(soilConditionContext.triggered ? card("rule5", "positive", lang, soilConditionContext) : card("rule5", "positive", lang));
  }

  const adoptionDeclineContext = buildAdoptionCostDeclineContext(seasonData, computedResults);
  if (adoptionDeclineContext.triggered) {
    cards.push(card("rule6", "positive", lang, adoptionDeclineContext));
  } else if (computedResults?.adoptionDeclining2) {
    cards.push(card("rule6", "positive", lang));
  }

  if (computedResults?.adoptionIncreasing2) cards.push(card("rule7", "advisory", lang));

  const pesticidePestContext = buildPesticidePestContext(seasonData, priorSeasonData);
  if (pesticidePestContext.triggered) {
    cards.push(card("rule8", "critical", lang, pesticidePestContext));
  } else if ((seasonData?.agronomics?.pestIncidence ?? 0) >= 30) {
    cards.push(card("rule8", "critical", lang));
  }

  const fertilizerYieldContext = buildFertilizerYieldContext(seasonData, priorSeasonData, computedResults);
  if (fertilizerYieldContext.triggered) {
    cards.push(card("rule9", "advisory", lang, fertilizerYieldContext));
  } else if (computedResults?.fertCostUpYieldFlat) {
    cards.push(card("rule9", "advisory", lang));
  }

  const irrigationSoilContext = buildIrrigationSoilContext(seasonData, priorSeasonData, computedResults);
  if (irrigationSoilContext.triggered) {
    cards.push(card("rule10", "advisory", lang, irrigationSoilContext));
  } else if (computedResults?.irrCostUpSoilStable) {
    cards.push(card("rule10", "advisory", lang));
  }

  const caLaborContext = buildCALaborStabilizationContext(seasonData, priorSeasonData, computedResults);
  if (caLaborContext.triggered) {
    cards.push(card("rule13", "advisory", lang, caLaborContext));
  }

  const yieldProfitContext = buildYieldProfitMismatchContext(seasonData, priorSeasonData, computedResults);
  if (yieldProfitContext.triggered) {
    cards.push(card("rule11", "advisory", lang, yieldProfitContext));
  } else if (computedResults?.yieldUpProfitDown) {
    cards.push(card("rule11", "advisory", lang));
  }

  if (computedResults?.ttpConfirmed) cards.push(card("rule12", "positive", lang));
  return cards;
}
