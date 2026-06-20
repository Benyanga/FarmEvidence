export const BLOCKED_MESSAGES = {
  revenue: "BLOCKED Revenue: Yield or Selling Price is missing for Plot [X]. Enter both to compute revenue.",
  cSystem: "BLOCKED C_system: Cost category [name] is incomplete for [Treatment / Plot X]. All six system-driven components must be entered.",
  profit: "BLOCKED Profit: Revenue and/or system costs are incomplete. See checklist above.",
  adoption: "BLOCKED Adoption Cost: Adoption cost requires Profit to be computed for all treatments first. Complete data entry for all treatments in this season.",
  statsRcbd: "BLOCKED Statistics (RCBD invalid): Statistical analysis requires all treatments to appear in all replications. View RCBD gap report to see what is missing.",
  statsFarmer: "BLOCKED Statistics in Farmer Mode: Statistical comparison requires Research Mode. Your session is currently Farmer Mode.",
  trend: "BLOCKED Trend Analysis: Trend analysis requires data from at least 2 seasons. Record data for Season [t+1] to unlock trend charts.",
};

export const isPositive = (value) => value !== null && value !== undefined && Number(value) > 0;
