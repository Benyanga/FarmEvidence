import { assertNumber } from "../guards.js";

export function getPhaseMultiplier(seasonsElapsed) {
  const s = assertNumber("seasonsElapsed", seasonsElapsed, { allowZero: false });
  if (s <= 6) {
    return { phi: 0.3, phaseName: "TRANSITION", description: "Early adaptation with higher variability." };
  }
  if (s <= 12) {
    return { phi: 0.7, phaseName: "STABILIZATION", description: "Practices are consolidating and performance improves." };
  }
  return { phi: 1, phaseName: "MATURE", description: "System reached mature operating efficiency." };
}
