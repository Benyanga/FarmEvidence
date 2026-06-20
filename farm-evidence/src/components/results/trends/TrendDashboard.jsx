import { TrendChart } from "./TrendChart";
import { TTPMarker } from "./TTPMarker";
import { CNBChart } from "./CNBChart";
import { computeTTP, computeCNB } from "../../../engine/efficiency/trajectory";

export function TrendDashboard({ result }) {
  const trends = result?.steps?.trends ?? {};
  const getDeltas = (metric) => trends[metric]?.deltas?.map((row) => Number(row.delta ?? 0)) ?? [];
  const getClassification = (metric) => trends[metric]?.classification ?? "Insufficient";
  const profitTrend = getDeltas("profit");
  const yieldTrend = getDeltas("yield").length ? getDeltas("yield") : profitTrend;
  const cpuTrend = getDeltas("CPU").length ? getDeltas("CPU") : profitTrend;
  const laborTrend = getDeltas("laborCost").length ? getDeltas("laborCost") : profitTrend;
  const getInterpretation = (metric) => trends[metric]?.interpretation ?? "No interpretation available.";
  const profitDelta = profitTrend.at(-1) ?? null;
  const cpuDelta = cpuTrend.at(-1) ?? null;
  const trendSummary = [
    { label: "Profit", classification: getClassification("profit"), delta: profitDelta, interpretation: getInterpretation("profit") },
    { label: "Yield", classification: getClassification("yield"), delta: yieldTrend.at(-1) ?? null, interpretation: getInterpretation("yield") },
    { label: "CPU", classification: getClassification("CPU"), delta: cpuDelta, interpretation: getInterpretation("CPU") },
    { label: "Labor Cost", classification: getClassification("laborCost"), delta: laborTrend.at(-1) ?? null, interpretation: getInterpretation("laborCost") },
  ];
  const profitCA = result?.steps?.profitCA_history ?? [];
  const profitCF = result?.steps?.profitCF_history ?? [];
  const ttp = computeTTP(profitCA, profitCF);
  const cnb = computeCNB(profitCA, profitCF);

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <TrendChart title={`Profit Trend (${getClassification("profit")})`} values={profitTrend} />
        <TrendChart title={`Yield Trend (${getClassification("yield")})`} values={yieldTrend} />
        <TrendChart title={`CPU Trend (${getClassification("CPU")})`} values={cpuTrend} />
        <TrendChart title={`Labor Cost Trend (${getClassification("laborCost")})`} values={laborTrend} />
      </div>
      <div className="grid grid-cols-2 gap-2">
        {trendSummary.map((item) => (
          <div key={item.label} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p className="font-semibold">{item.label}</p>
            <p className="body-sm text-slate-700">{item.classification}</p>
            <p className="body-sm text-slate-500">{item.interpretation}</p>
            <p className="body-sm text-slate-500 mt-2">Δ {item.delta !== null ? item.delta.toFixed(2) : "—"}</p>
          </div>
        ))}
      </div>
      <TTPMarker reached={ttp.reached} season={ttp.season} />
      <CNBChart values={cnb} />
    </div>
  );
}

