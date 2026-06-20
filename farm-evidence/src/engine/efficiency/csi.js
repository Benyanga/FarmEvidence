export const CSI_DRIVERS = {
  s_j1: {
    label: "Rainfall / Moisture Availability",
    weight: 0.25,
    anchors: "0.0–0.3: <500mm erratic | 0.4–0.7: 500–800mm | 0.8–1.0: >800mm well-distributed",
  },
  s_j2: {
    label: "Soil Organic Matter (proxy)",
    weight: 0.2,
    anchors: "0.0–0.3: <1.5% SOM degraded | 0.4–0.7: 1.5–2.5% | 0.8–1.0: ≥2.5% active fauna",
  },
  s_j3: {
    label: "Residue Cover Availability",
    weight: 0.15,
    anchors: "0.0–0.3: <20% cover | 0.4–0.7: 20–50% | 0.8–1.0: ≥50% fully retained",
  },
  s_j4: {
    label: "Weed Pressure Level",
    weight: 0.15,
    anchors: "0.0–0.3: Score ≥4 severe | 0.4–0.7: Score 2–3 | 0.8–1.0: Score ≤1 low",
  },
  s_j5: {
    label: "Farmer Skill Level",
    weight: 0.15,
    anchors: "0.0–0.3: First season no training | 0.4–0.7: 1–2 seasons | 0.8–1.0: 3+ seasons of experience",
  },
  s_j6: {
    label: "Equipment Access",
    weight: 0.1,
    anchors: "0.0–0.3: Hand-hoe only | 0.4–0.7: Basic + hired | 0.8–1.0: CA planter / rip-line",
  },
};

export function computeCSI(scores) {
  if (!scores || typeof scores !== "object") {
    return { csi: 0.5, classification: "MODERATE", warning: true };
  }
  const keys = Object.keys(CSI_DRIVERS);
  const missing = keys.some((k) => scores[k] === null || scores[k] === undefined);
  if (missing) {
    return { csi: 0.5, classification: "MODERATE", warning: true };
  }
  const numerator = keys.reduce((sum, key) => sum + CSI_DRIVERS[key].weight * Number(scores[key]), 0);
  const totalWeight = keys.reduce((sum, key) => sum + CSI_DRIVERS[key].weight, 0);
  const csi = numerator / totalWeight;
  const classification = csi < 0.33 ? "LOW" : csi <= 0.66 ? "MODERATE" : "HIGH";
  return { csi, classification, warning: false };
}
