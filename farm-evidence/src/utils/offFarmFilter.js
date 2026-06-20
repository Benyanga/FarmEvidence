const EXCLUDED = ["transport", "storage", "taxes", "marketFees", "processing", "credit"];

export function filterOffFarmCosts(costObj) {
  const copy = { ...costObj };
  for (const key of EXCLUDED) delete copy[key];
  return copy;
}
