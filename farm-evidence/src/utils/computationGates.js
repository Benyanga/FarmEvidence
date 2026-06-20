const COST_CATEGORIES = [
  "tillage",
  "fertilizer",
  "pesticide",
  "irrigation",
  "residue",
  "labor",
];
const COST_CATEGORY_LABELS = {
  tillage: "Tillage",
  fertilizer: "Fertilizer",
  pesticide: "Pesticide",
  irrigation: "Irrigation",
  residue: "Residue Management",
  labor: "Labor",
};
const LABOR_KEYS = ["L_LP", "L_PL", "L_WD", "L_HV", "L_RM"];

export function getCategoryStatus(season, category) {
  if (!season) return "notStarted";
  const costs = season.costs ?? {};
  const costValue = costs[category];
  const details = season.costDetails?.[category] ?? {};

  if (costValue === "N/A") return "partial";
  if (typeof costValue === "number" && !Number.isNaN(costValue)) return "complete";

  const hasDetails = Object.values(details).some((value) => value !== undefined && value !== null && value !== "" && value !== 0);
  if (hasDetails) return "partial";
  return "notStarted";
}

export function getCostCompletionCount(season) {
  if (!season) return 0;
  return COST_CATEGORIES.filter((category) => getCategoryStatus(season, category) === "complete").length;
}

export function areAllCostCategoriesComplete(season) {
  return COST_CATEGORIES.every((category) => getCategoryStatus(season, category) === "complete");
}

export function getCostCategoryGates(season) {
  return COST_CATEGORIES.map((category) => ({
    ok: getCategoryStatus(season, category) === "complete",
    label: `${COST_CATEGORY_LABELS[category] || category} cost total entered`,
    anchor: `category-${category}`,
  }));
}

export function areAllComputationGatesComplete(setup, season, mode) {
  return getComputationGates(setup, season, mode).every((gate) => gate.ok);
}

export function hasDisaggregatedLabor(laborOps) {
  if (!Array.isArray(laborOps?.operations)) return false;
  return laborOps.operations.length === 5 && laborOps.operations.every((op) =>
    op?.code && op.time !== undefined && op.time !== null && op.time !== "" &&
    op.workers !== undefined && op.workers !== null && op.workers !== "" &&
    op.wageRate !== undefined && op.wageRate !== null && op.wageRate !== ""
  );
}

export function hasAgronomicData(agronomics) {
  const values = [agronomics?.weedScore, agronomics?.soilScore, agronomics?.pestIncidence];
  return values.some((value) => value !== undefined && value !== null && value !== "" && !Number.isNaN(Number(value)));
}

export function hasCSIWeights(scores) {
  return Object.keys(scores ?? {}).length === 6 &&
    Object.values(scores).every((value) => value !== undefined && value !== null && value !== "" && !Number.isNaN(Number(value)));
}

export function isRCBDValid(setup) {
  const treatments = setup.treatments ?? [];
  const reps = Math.max(0, Number(setup.replications ?? 0));
  const matrix = setup.rcbdMatrix ?? [];
  if (treatments.length < 2 || reps < 2) return false;
  const rows = Array.from({ length: reps }, (_, rowIndex) =>
    Array.from({ length: treatments.length }, (_, colIndex) => matrix[rowIndex]?.[colIndex] ?? ""),
  );
  return rows.length > 0 && rows.every((row) =>
    row.length === treatments.length && treatments.every((t) => row.filter((cell) => cell === t).length === 1),
  );
}

export function getComputationGates(setup, season, mode) {
  const revenue = season?.revenue ?? {};
  const laborOps = season?.laborOps ?? {};
  const agronomics = season?.agronomics ?? {};
  const csiScores = season?.csiScores ?? {};
  const treatmentConfirmed = setup.setupConfirmed === true && (
    mode === "RESEARCH"
      ? Array.isArray(setup.treatments) && setup.treatments.length > 0
      : Boolean(setup.system)
  );
  const rcbdValid = isRCBDValid(setup);
  const agronomicReady = hasAgronomicData(agronomics);
  const csiReady = hasCSIWeights(csiScores);

  const gates = [
    { ok: Number(revenue.yield_kg_ha) > 0, label: "Yield recorded for this season", anchor: "revenue-yield" },
    { ok: Number(revenue.sellingPrice) > 0, label: "Selling Price entered for this season", anchor: "revenue-price" },
    { ok: agronomicReady, label: "At least one agronomic observation recorded", anchor: "agronomic" },
    { ok: csiReady, label: "All 6 CSI driver scores entered", anchor: "csi" },
    { ok: hasDisaggregatedLabor(laborOps), label: "All 5 labor operations entered (LP, PL, WD, HV, RM)", anchor: "labor-operations" },
    ...getCostCategoryGates(season),
    {
      ok: treatmentConfirmed,
      label: mode === "RESEARCH"
        ? "Treatment assignment verified"
        : "Field setup verified for current season",
      anchor: "setup",
    },
  ];

  if (mode === "RESEARCH") {
    gates.push({ ok: rcbdValid, label: "RCBD replication structure verified complete", anchor: "rcbd" });
  }

  return gates;
}

export { COST_CATEGORIES };
