import { mean } from "simple-statistics";
import { assertArray, requireResearchMode } from "../guards.js";

export function computeMean(observations, mode) {
  requireResearchMode(mode, "computeMean");
  assertArray("observations", observations, { minLength: 1 });
  return mean(observations);
}

export function computeTreatmentMeans(groups, mode) {
  requireResearchMode(mode, "computeTreatmentMeans");
  assertArray("groups", groups, { minLength: 1 });
  return groups.map((group) => ({
    treatmentId: group.treatmentId,
    mean: computeMean(group.observations, mode),
  }));
}
