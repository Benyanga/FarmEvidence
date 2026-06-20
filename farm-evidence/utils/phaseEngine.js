/**
 * Assigns phase and φ(t) multiplier from season index t.
 * t = seasons since adoption start (1-indexed).
 */
function getPhase(t) {
  if (t <= 6) return { phase: "Transition", phi: 0.30 };
  if (t <= 12) return { phase: "Stabilization", phi: 0.70 };
  return { phase: "Mature", phi: 1.00 };
}

/**
 * Current season index t from adoptionStartSeason and currentSeasonIndex.
 * Both are 1-indexed integers representing sequential seasons.
 */
function computeSeasonIndex(adoptionStartSeason, currentSeasonIndex) {
  return Math.max(1, currentSeasonIndex - adoptionStartSeason + 1);
}

export { getPhase, computeSeasonIndex };
