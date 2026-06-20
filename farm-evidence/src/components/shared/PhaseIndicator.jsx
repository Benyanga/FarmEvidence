import { getFarmerMessage } from "../../utils/messages";

function formatScore(value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return "—";
  }
  return Number(value).toFixed(2);
}

function clamp(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.min(1, Math.max(0, n));
}

function colorForValue(value) {
  const score = clamp(value);
  if (score >= 0.8) return "bg-emerald-500";
  if (score >= 0.5) return "bg-amber-500";
  return "bg-orange-500";
}

export function PhaseIndicator({
  phase,
  phi,
  csi,
  messageKey,
  messageVars = {},
  lang = "en",
  drivers = [],
}) {
  const message = messageKey ? getFarmerMessage(messageKey, lang, messageVars) : "No message available for the current phase yet.";
  const csiClassification =
    csi === null || csi === undefined || Number.isNaN(Number(csi))
      ? "Unknown"
      : Number(csi) >= 0.7
      ? "High"
      : Number(csi) >= 0.33
      ? "Moderate"
      : "Low";

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Phase indicator</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-900">{phase || "Unknown phase"}</h2>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl bg-slate-50 p-4 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">φ(t)</p>
            <p className="mt-2 text-xl font-semibold text-slate-900">{phi != null ? formatScore(phi) : "—"}</p>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">CSI</p>
            <p className="mt-2 text-xl font-semibold text-slate-900">{csi != null ? formatScore(csi) : "—"}</p>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Classification</p>
            <p className="mt-2 text-xl font-semibold text-slate-900">{csiClassification}</p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl bg-slate-50 p-5 text-sm text-slate-700">
        <p className="font-semibold text-slate-900">Farmer guidance</p>
        <p className="mt-3 leading-7">{message}</p>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-slate-900">CSI driver strength</p>
          <p className="text-sm text-slate-500">Normalized 0–1</p>
        </div>

        {drivers.length ? (
          drivers.map((driver) => {
            const driverValue = clamp(driver.value);
            return (
              <div key={driver.id || driver.label} className="space-y-2">
                <div className="flex items-center justify-between text-sm text-slate-700">
                  <span>{driver.label}</span>
                  <span className="font-semibold text-slate-900">{driver.value != null ? formatScore(driver.value) : "—"}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-200">
                  <div className={`${colorForValue(driverValue)} h-full rounded-full`} style={{ width: `${driverValue * 100}%` }} />
                </div>
              </div>
            );
          })
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
            No CSI driver data available for this season.
          </div>
        )}
      </div>
    </div>
  );
}
