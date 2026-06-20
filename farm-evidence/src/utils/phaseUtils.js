import { getPhaseMultiplier } from "../engine/efficiency/phaseMultiplier";

export function getPhaseFromSeasonsElapsed(seasonsElapsed) {
  if (!seasonsElapsed) return { phi: null, phaseName: "?", description: "Adoption start season missing." };
  return getPhaseMultiplier(seasonsElapsed);
}
