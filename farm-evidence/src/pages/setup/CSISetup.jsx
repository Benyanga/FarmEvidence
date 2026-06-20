import { useEffect, useMemo, useState } from "react";

const DRIVERS = [
  {
    key: "j1",
    label: "Rainfall / Moisture",
    weight: 0.25,
    descriptions: {
      unfavourable: "Rainfall is irregular, moisture is low, and drought risk is high.",
      moderate: "Moisture conditions are unstable with occasional dry spells.",
      favourable: "Rainfall and soil moisture are adequate and well-distributed."
    }
  },
  {
    key: "j2",
    label: "Soil Organic Matter proxy",
    weight: 0.20,
    descriptions: {
      unfavourable: "Soil organic matter is low, limiting soil health and water retention.",
      moderate: "Soil shows moderate organic content but still needs improvement.",
      favourable: "Soil has strong organic matter and good structure for CA practices."
    }
  },
  {
    key: "j3",
    label: "Residue Cover Availability",
    weight: 0.15,
    descriptions: {
      unfavourable: "Residue is scarce or unavailable for mulching and cover.",
      moderate: "Some residue is available, but coverage is inconsistent.",
      favourable: "Sufficient crop residue is available for stable soil cover."
    }
  },
  {
    key: "j4",
    label: "Weed Pressure Level",
    weight: 0.15,
    descriptions: {
      unfavourable: "Weed pressure is very high, increasing management risk.",
      moderate: "Weed pressure is moderate and manageable with timely control.",
      favourable: "Weed control is effective and pressure is low."
    }
  },
  {
    key: "j5",
    label: "Farmer Skill Level",
    weight: 0.15,
    descriptions: {
      unfavourable: "Limited experience with CA methods and adaptive management.",
      moderate: "Some CA experience exists, but support is still needed.",
      favourable: "Farmer is experienced and comfortable with CA practices."
    }
  },
  {
    key: "j6",
    label: "Equipment Access",
    weight: 0.10,
    descriptions: {
      unfavourable: "Limited access to tools and equipment for CA implementation.",
      moderate: "Equipment access is partial and can constrain some operations.",
      favourable: "Necessary equipment is readily available and maintained."
    }
  }
];

const BANDS = [
  { key: "unfavourable", label: "Unfavourable", range: "0.0–0.3", className: "bg-red-50 text-red-700" },
  { key: "moderate", label: "Moderate", range: "0.4–0.7", className: "bg-amber-50 text-amber-700" },
  { key: "favourable", label: "Favourable", range: "0.8–1.0", className: "bg-emerald-50 text-emerald-700" }
];

function getBand(score) {
  if (score >= 0.8) return "favourable";
  if (score >= 0.4) return "moderate";
  return "unfavourable";
}

function scoreColor(score) {
  const band = getBand(score);
  if (band === "favourable") return "bg-emerald-500 text-white";
  if (band === "moderate") return "bg-amber-500 text-slate-900";
  return "bg-red-500 text-white";
}

function defaultScores(initialScores = {}) {
  return {
    j1: initialScores.j1 ?? 0.5,
    j2: initialScores.j2 ?? 0.5,
    j3: initialScores.j3 ?? 0.5,
    j4: initialScores.j4 ?? 0.5,
    j5: initialScores.j5 ?? 0.5,
    j6: initialScores.j6 ?? 0.5
  };
}

function computeCSI(scores) {
  const totalWeight = DRIVERS.reduce((sum, d) => sum + d.weight, 0);
  const weighted = DRIVERS.reduce((sum, d) => sum + d.weight * (scores[d.key] ?? 0.5), 0);
  return Number((weighted / totalWeight).toFixed(2));
}

function interpretCSI(csi) {
  if (csi >= 0.7) {
    return {
      label: "High CSI",
      message: "Under your current conditions, CA is expected to perform favourably from the first season. Keep recording data to confirm the trajectory.",
      weights: { best: 30, normal: 55, worst: 15 }
    };
  }
  if (csi >= 0.4) {
    return {
      label: "Moderate CSI",
      message: "Early results may vary depending on your conditions. CA benefits typically emerge by Season 3–4. Your system is on track.",
      weights: { best: 20, normal: 60, worst: 20 }
    };
  }
  return {
    label: "Low CSI",
    message: "Your current site conditions present challenges for early CA performance. Targeted support on residue management and weed control is recommended now.",
    weights: { best: 10, normal: 55, worst: 35 }
  };
}

export function CSISetup({ initialScores = {}, onChange }) {
  const [scores, setScores] = useState(defaultScores(initialScores));

  useEffect(() => {
    setScores(defaultScores(initialScores));
  }, [initialScores]);

  const csiComputed = useMemo(() => computeCSI(scores), [scores]);
  const interpretation = useMemo(() => interpretCSI(csiComputed), [csiComputed]);

  useEffect(() => {
    if (typeof onChange === "function") {
      onChange({ ...scores, csiComputed });
    }
  }, [scores, csiComputed, onChange]);

  const handleSliderChange = (key, value) => {
    setScores((current) => ({ ...current, [key]: Number(value) }));
  };

  return (
    <div className="space-y-8">
      <header className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-3xl font-semibold text-slate-900">Context Sensitivity Assessment</h1>
        <p className="mt-3 max-w-3xl text-slate-600">Score the local site context across six drivers to compute the Context Sensitivity Index and guide CA scenario expectations.</p>
      </header>

      <div className="grid gap-6">
        {DRIVERS.map((driver) => {
          const current = scores[driver.key] ?? 0.5;
          return (
            <section key={driver.key} className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-lg font-semibold text-slate-900">{driver.key} — {driver.label}</p>
                  <p className="mt-2 text-sm text-slate-500">Adjust the site driver score to reflect your current field conditions.</p>
                </div>
                <span className="inline-flex items-center rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700">Weight: {Math.round(driver.weight * 100)}%</span>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                {BANDS.map((band) => (
                  <div key={band.key} className={`rounded-2xl border px-4 py-3 ${band.className}`}>
                    <p className="text-sm font-semibold">{band.label}</p>
                    <p className="text-xs text-slate-700/80 mt-1">{band.range}</p>
                    <p className="mt-3 text-sm text-slate-700">{driver.descriptions[band.key]}</p>
                  </div>
                ))}
              </div>

              <div className="mt-6 space-y-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="space-y-2">
                    <label htmlFor={`slider-${driver.key}`} className="block text-sm font-medium text-slate-700">{driver.label} score</label>
                    <input
                      id={`slider-${driver.key}`}
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={current}
                      onChange={(event) => handleSliderChange(driver.key, event.target.value)}
                      className="w-full accent-[#2D5016]"
                    />
                  </div>
                  <div className="inline-flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-900">
                    <span className={`inline-flex h-8 min-w-[3rem] items-center justify-center rounded-full ${scoreColor(current)}`}>{current.toFixed(2)}</span>
                    <span>Live score</span>
                  </div>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                  <p className="font-semibold text-slate-900">Current band: <span className="font-medium text-slate-700">{getBand(current)}</span></p>
                </div>
              </div>
            </section>
          );
        })}
      </div>

      <section className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Computed CSI</p>
            <p className="mt-3 text-5xl font-semibold text-slate-900">{csiComputed.toFixed(2)}</p>
          </div>
          <div className="rounded-3xl bg-[#ECF4E5] px-5 py-4 text-slate-900 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-700">{interpretation.label}</p>
            <p className="mt-3 max-w-xl text-sm leading-6 text-slate-700">{interpretation.message}</p>
          </div>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4">
            <p className="text-sm text-slate-500">Best scenario</p>
            <p className="mt-2 text-3xl font-semibold text-[#2D5016]">{interpretation.weights.best}%</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4">
            <p className="text-sm text-slate-500">Normal scenario</p>
            <p className="mt-2 text-3xl font-semibold text-slate-900">{interpretation.weights.normal}%</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4">
            <p className="text-sm text-slate-500">Worst scenario</p>
            <p className="mt-2 text-3xl font-semibold text-red-700">{interpretation.weights.worst}%</p>
          </div>
        </div>
      </section>
    </div>
  );
}
