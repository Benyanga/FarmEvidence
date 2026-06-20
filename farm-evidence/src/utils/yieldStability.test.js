import { describe, expect, it } from "vitest";
import { yieldStability } from "./yieldStability.js";

describe("yieldStability", () => {
  it("computes yield stability and risk metrics from yield and revenue series", () => {
    const yields = [10, 12, 8, 11];
    const revenues = [200, 220, 180, 210];
    const stats = yieldStability(yields, revenues);

    expect(stats.mean).toBe(10.25);
    expect(stats.min).toBe(8);
    expect(stats.max).toBe(12);
    expect(stats.sd).toBe(1.71);
    expect(stats.cv).toBeCloseTo(16.66, 2);
    expect(stats.cvClass).toBe("Moderate risk");
    expect(stats.yieldPerHa).toBe(1025);
    expect(stats.downsideRisk).toBe(78.05);
    expect(stats.probBelowAvg).toBe(0.5);
    expect(stats.revenueStats.mean).toBe(202.5);
  });

  it("returns zeroed metrics for empty input arrays", () => {
    const stats = yieldStability([], []);

    expect(stats.n).toBe(0);
    expect(stats.mean).toBe(0);
    expect(stats.sd).toBe(0);
    expect(stats.cv).toBe(0);
    expect(stats.cvClass).toBe("Low risk");
    expect(stats.yieldPerHa).toBe(0);
    expect(stats.downsideRisk).toBe(0);
    expect(stats.probBelowAvg).toBe(0);
    expect(stats.revenueStats.n).toBe(0);
  });
});
