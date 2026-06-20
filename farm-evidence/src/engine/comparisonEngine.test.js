import { describe, it, expect } from "vitest";
import {
  generateComparisonKey,
  buildLongitudinalComparison,
  buildCrossSectionalComparison,
  buildCombinedResultsMatrix,
  annotateComparisonState,
  computeComparisonFromState,
} from "./comparisonEngine";

describe("comparisonEngine", () => {
  it("generates a stable comparison key from site and season context", () => {
    const key = generateComparisonKey({
      farmName: "Small Farm",
      siteIdentifier: "TestSite",
      seasonReference: "2025-rainy",
      seasonId: "season-1",
      system: "CA",
    });
    expect(key).toBe("testsite_small-farm_2025-rainy_season-1_ca");
  });

  it("builds a longitudinal comparison from profit history", () => {
    const output = buildLongitudinalComparison({
      profitHistory: [100, 120, 135],
      comparisonKey: "season-1_ca",
    });
    expect(output.metric).toBe("profit");
    expect(output.series).toHaveLength(3);
    expect(output.series[1].delta).toBe(20);
    expect(output.trend.classification).toBeDefined();
  });

  it("builds a cross-sectional comparison from CA and CF mean profits", () => {
    const output = buildCrossSectionalComparison({
      plotProfits: [100, 110, 120],
      meanProfitCF: 105,
      comparisonKey: "season-1_ca",
    });
    expect(output.type).toBe("research_baseline");
    expect(output.meanProfitCA).toBeCloseTo(110);
    expect(output.deltaProfit).toBeCloseTo(5);
    expect(output.preferredTreatment).toBe("CA");
  });

  it("builds a combined results matrix when both analysis types are present", () => {
    const long = buildLongitudinalComparison({ profitHistory: [100, 105] });
    const cross = buildCrossSectionalComparison({ plotProfits: [80, 100], meanProfitCF: 90 });
    const matrix = buildCombinedResultsMatrix(long, cross);
    expect(matrix.rows[1].profitDelta).toBe(5);
    expect(matrix.headers).toContain("crossSummary");
  });

  it("annotates state arrays with comparison_key and computes comparison state from saved data", () => {
    const state = {
      setup: { farmName: "Farm A", siteIdentifier: "A1", system: "CA" },
      seasons: {
        "season-1": {
          seasonReference: "2025",
          revenue: { yield_kg_ha: 1000 },
          costs: { tillage: 5000 },
          plotProfits: [95, 105, 110],
          meanProfitCF: 100,
        },
      },
      computation: {
        results: {
          "season-1": { steps: { profit: 2000 } },
        },
      },
      economic_records: [{ id: 1, farmName: "Farm A", siteIdentifier: "A1" }],
      agronomic_observations: [{ id: 1, farmName: "Farm A", siteIdentifier: "A1" }],
    };

    const annotated = annotateComparisonState(state);
    expect(annotated.seasons["season-1"].comparisonKey).toBeDefined();
    expect(annotated.computation.results["season-1"].comparisonKey).toBeDefined();
    expect(annotated.economic_records[0].comparison_key).toBeDefined();
    expect(annotated.agronomic_observations[0].comparison_key).toBeDefined();

    const comparison = computeComparisonFromState(annotated);
    expect(comparison.longitudinal).toBeTruthy();
    expect(comparison.combinedMatrix).toBeTruthy();
  });
});
