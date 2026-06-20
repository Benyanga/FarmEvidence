import { computeTreatmentMeanProfit } from "./formulas/profit.js";
import { computeTrendAnalysis } from "./trends/deltaEngine.js";

const normalizeKeyPart = (value) => {
  const raw = String(value ?? "").trim().toLowerCase();
  return raw
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
};

export function generateComparisonKey(context = {}) {
  const parts = [
    context.siteIdentifier,
    context.farmName,
    context.seasonReference,
    context.seasonId,
    context.system,
    context.treatmentId,
    context.plotId,
  ]
    .filter((value) => value !== undefined && value !== null && String(value).trim() !== "")
    .map(normalizeKeyPart);

  return parts.length > 0 ? parts.join("_") : "comparison_unknown";
}

export function annotateRecordsWithComparisonKey(records, context = {}) {
  if (!Array.isArray(records)) return records;
  return records.map((record) => ({
    ...record,
    comparison_key: record.comparison_key ?? generateComparisonKey({ ...context, ...record }),
  }));
}

export function buildLongitudinalComparison(sessionData = {}) {
  const profitSeries = Array.isArray(sessionData.profitHistory)
    ? sessionData.profitHistory
    : Array.isArray(sessionData.trendMetrics?.profit)
    ? sessionData.trendMetrics.profit
    : [];

  if (!Array.isArray(profitSeries) || profitSeries.length === 0) {
    return null;
  }

  const trend = computeTrendAnalysis({ profit: profitSeries }).profit;
  const series = profitSeries.map((value, index) => ({
    seasonIndex: index + 1,
    periodLabel: `T${index + 1}`,
    value,
    delta: index === 0 ? null : value - profitSeries[index - 1],
  }));

  return {
    comparisonKey: sessionData.comparisonKey,
    metric: "profit",
    series,
    trend,
  };
}

function computeGroupMeans(groups = []) {
  if (!Array.isArray(groups) || groups.length === 0) return null;
  return groups.map((group) => {
    const values = Array.isArray(group.values) ? group.values : group;
    const mean = values.reduce((sum, x) => sum + Number(x), 0) / values.length;
    return {
      treatmentId: group.treatmentId ?? group.name ?? `T${Math.random().toString(36).slice(2, 5)}`,
      mean,
      count: values.length,
    };
  });
}

export function buildCrossSectionalComparison(sessionData = {}) {
  const statsGroups = Array.isArray(sessionData.stats?.groups)
    ? sessionData.stats.groups
    : null;

  const plotProfits = Array.isArray(sessionData.plotProfits) ? sessionData.plotProfits : null;
  const meanProfitCF = typeof sessionData.meanProfitCF === "number" ? sessionData.meanProfitCF : null;

  if (statsGroups && statsGroups.length > 0) {
    const treatmentMeans = computeGroupMeans(statsGroups);
    const bestTreatment = treatmentMeans.reduce((best, current) =>
      current.mean > best.mean ? current : best,
    treatmentMeans[0]);
    const comparisons = treatmentMeans.map((row) => ({
      treatmentId: row.treatmentId,
      meanProfit: row.mean,
      deltaFromBest: bestTreatment.mean - row.mean,
    }));

    return {
      comparisonKey: sessionData.comparisonKey,
      type: "treatment_means",
      treatmentMeans,
      bestTreatment: bestTreatment.treatmentId,
      comparisons,
    };
  }

  if (plotProfits && meanProfitCF !== null) {
    const meanProfitCA = computeTreatmentMeanProfit(plotProfits);
    return {
      comparisonKey: sessionData.comparisonKey,
      type: "research_baseline",
      meanProfitCA,
      meanProfitCF,
      deltaProfit: meanProfitCA - meanProfitCF,
      preferredTreatment: meanProfitCA >= meanProfitCF ? "CA" : "CF",
    };
  }

  return null;
}

export function buildCombinedResultsMatrix(longitudinal, crossSectional) {
  if (!longitudinal || !crossSectional) return null;

  const rows = longitudinal.series.map((row) => ({
    seasonIndex: row.seasonIndex,
    periodLabel: row.periodLabel,
    profit: row.value,
    profitDelta: row.delta,
    crossComparison: crossSectional.type,
    crossSummary:
      crossSectional.type === "research_baseline"
        ? `ΔProfit ${crossSectional.deltaProfit.toFixed(2)} (${crossSectional.preferredTreatment})`
        : `Best ${crossSectional.bestTreatment}`,
  }));

  return {
    comparisonKey: longitudinal.comparisonKey ?? crossSectional.comparisonKey,
    headers: ["periodLabel", "profit", "profitDelta", "crossComparison", "crossSummary"],
    rows,
  };
}

export function annotateComparisonState(state = {}) {
  const setup = state.setup ?? {};
  const defaultContext = {
    farmName: setup.farmName,
    siteIdentifier: setup.siteIdentifier,
    system: setup.system,
  };

  const seasons = state.seasons ?? {};
  const annotatedSeasons = Object.entries(seasons).reduce((acc, [seasonId, season]) => {
    const context = {
      ...defaultContext,
      ...season,
      seasonId,
      seasonReference: season.seasonReference ?? setup.seasonReference,
      system: season.system ?? setup.system,
    };
    acc[seasonId] = {
      ...season,
      comparisonKey: season.comparisonKey ?? generateComparisonKey(context),
    };
    return acc;
  }, {});

  const computation = state.computation ?? {};
  const results = computation.results ?? {};
  const annotatedResults = Object.entries(results).reduce((acc, [seasonId, result]) => {
    const comparisonKey = annotatedSeasons[seasonId]?.comparisonKey ?? generateComparisonKey({
      ...defaultContext,
      seasonId,
      seasonReference: annotatedSeasons[seasonId]?.seasonReference,
    });
    acc[seasonId] = {
      ...result,
      comparisonKey,
    };
    return acc;
  }, {});

  return {
    ...state,
    seasons: annotatedSeasons,
    computation: {
      ...computation,
      results: annotatedResults,
    },
    economic_records: annotateRecordsWithComparisonKey(state.economic_records, defaultContext),
    agronomic_observations: annotateRecordsWithComparisonKey(state.agronomic_observations, defaultContext),
  };
}

export function computeComparisonFromState(state = {}) {
  const seasons = state.seasons ?? {};
  const results = state.computation?.results ?? {};
  const seasonOrder = Object.keys(seasons).sort((a, b) => {
    const aRef = String(seasons[a].seasonReference ?? a).localeCompare(String(seasons[b].seasonReference ?? b));
    if (aRef !== 0) return aRef;
    return String(a).localeCompare(String(b));
  });

  const series = seasonOrder
    .map((seasonId) => {
      const season = seasons[seasonId] ?? {};
      const result = results[seasonId] ?? {};
      const profit = result?.steps?.profit;
      if (typeof profit !== "number") return null;
      return {
        seasonId,
        label: season.seasonReference ?? seasonId,
        profit,
        comparisonKey: result.comparisonKey ?? season.comparisonKey,
      };
    })
    .filter(Boolean);

  const longitudinal = series.length
    ? {
        metric: "profit",
        series: series.map((point, index) => ({
          seasonId: point.seasonId,
          label: point.label,
          value: point.profit,
          delta: index === 0 ? null : point.profit - series[index - 1].profit,
          comparisonKey: point.comparisonKey,
        })),
      }
    : null;

  const latestSeasonId = seasonOrder[seasonOrder.length - 1];
  const latestSeason = seasons[latestSeasonId] ?? {};
  const crossSectional = buildCrossSectionalComparison(latestSeason);

  return {
    longitudinal,
    crossSectional,
    combinedMatrix: buildCombinedResultsMatrix(longitudinal, crossSectional),
  };
}
