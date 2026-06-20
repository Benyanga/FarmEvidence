import { formatRWF } from "../../../utils/formatters";

function MetricCard({ label, value }) {
  return (
    <div style={{ padding: "18px 20px", borderRadius: "14px", border: "1px solid var(--fe-grey-200)", boxShadow: "var(--fe-shadow-surface)", background: "var(--fe-white)" }}>
      <p style={{ fontSize: "11px", fontWeight: 500, color: "var(--fe-grey-400)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "8px" }}>{label}</p>
      <p style={{ fontSize: "22px", fontWeight: 700, lineHeight: 1.2, color: "var(--fe-grey-900)" }}>{value}</p>
    </div>
  );
}

export function IndicatorCards({ results }) {
  const profit = results?.steps?.profit ?? null;
  const roi = results?.steps?.indicators?.ROI ?? null;
  const cbr = results?.steps?.indicators?.CBR ?? null;
  const cpu = results?.steps?.indicators?.CPU ?? null;
  const deltaC = results?.steps?.indicators?.deltaC ?? null;
  const deltaProfit = results?.steps?.indicators?.deltaProfit ?? null;

  return (
    <div style={{ display: "grid", gap: "12px", gridTemplateColumns: "repeat(2, 1fr)" }}>
      <MetricCard label="Profit" value={profit !== null && !isNaN(profit) ? formatRWF(profit) : "—"} tone="positive" />
      <MetricCard label="Return factor (ROI)" value={roi !== null && !isNaN(roi) ? `${roi.toFixed(2)}x` : "—"} tone="neutral" />
      <MetricCard label="Profit ratio (CBR)" value={cbr !== null && !isNaN(cbr) ? `${cbr.toFixed(2)}:1` : "—"} tone="warning" />
      <MetricCard label="Cost per unit (CPU)" value={cpu !== null && !isNaN(cpu) ? `RWF ${cpu.toFixed(0)}/unit` : "—"} tone="negative" />
      <MetricCard label="Cost difference (ΔC)" value={deltaC !== null && !isNaN(deltaC) ? formatRWF(deltaC) : "—"} tone="neutral" />
      <MetricCard label="Profit difference (ΔProfit)" value={deltaProfit !== null && !isNaN(deltaProfit) ? formatRWF(deltaProfit) : "—"} tone="positive" />
    </div>
  );
}
