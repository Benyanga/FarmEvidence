import { describe, expect, test, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useParams: () => ({ trialId: "test-trial" }),
  };
});

vi.mock("../../hooks/useAnalysis", () => ({
  useAnalysis: () => ({
    analysis: {
      plots: [
        { treatment: "CA", yield_kg: 10, total_cost: 5000, gross_revenue: 8000, profit: 3000, bcr: 1.6, c_sd: 2500, labour_time: 120, input_costs: [], labour_costs: [] },
        { treatment: "CF", yield_kg: 8, total_cost: 4800, gross_revenue: 7200, profit: 2400, bcr: 1.5, c_sd: 2200, labour_time: 150, input_costs: [], labour_costs: [] },
      ],
      stats: {
        yield: {
          tTest: {
            significant: true,
            pValue: 0.02,
          },
          descCA: { cv: 12.5 },
          descCF: { cv: 15.2 },
        },
      },
    },
    loading: false,
    error: null,
  }),
}));

const { Explainability } = await import("./Explainability");

describe("Explainability page", () => {
  test("renders yield significance using stats.yield.tTest.significant", async () => {
    render(<Explainability />);

    expect(await screen.findByText(/Explainability & Insights/i)).toBeTruthy();
    expect(screen.getByText(/The yield gap is statistically significant\./i)).toBeTruthy();
  });
});
