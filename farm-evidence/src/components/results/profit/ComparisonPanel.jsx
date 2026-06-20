export function ComparisonPanel({ result }) {
  const indicators = result?.steps?.indicators ?? {};

  const rows = [
    {
      label: "ROI",
      value: indicators.ROI != null ? `${(indicators.ROI * 100).toFixed(1)}%` : "—",
      badge: indicators.ROI != null && indicators.ROI > 1 ? { text: "IMPROVING", bg: "var(--fe-green-100)", textCol: "var(--fe-green-900)" } : { text: "RISING", bg: "var(--fe-error-bg)", textCol: "var(--fe-profit-neg)" },
    },
    {
      label: "CBR",
      value: indicators.CBR != null ? indicators.CBR.toFixed(2) : "—",
      badge: indicators.CBR != null && indicators.CBR > 1 ? { text: "PROFITABLE", bg: "var(--fe-green-100)", textCol: "var(--fe-green-900)" } : { text: "LOSS", bg: "var(--fe-error-bg)", textCol: "var(--fe-profit-neg)" },
    },
    {
      label: "CPU",
      value: indicators.CPU != null ? `${Math.round(indicators.CPU)} RWF/kg` : "—",
      badge: { text: "", bg: "", textCol: "" },
    },
    {
      label: "Delta C",
      value: indicators.deltaC != null ? `${indicators.deltaC >= 0 ? "+" : ""}${indicators.deltaC.toFixed(0)}` : "—",
      badge: { text: "", bg: "", textCol: "" },
    },
    {
      label: "Delta Profit",
      value: indicators.deltaProfit != null ? `${indicators.deltaProfit >= 0 ? "+" : ""}${indicators.deltaProfit.toFixed(0)}` : "—",
      badge: indicators.deltaProfit > 0 ? { text: "IMPROVING", bg: "var(--fe-green-100)", textCol: "var(--fe-green-900)" } : { text: "DECLINING", bg: "var(--fe-error-bg)", textCol: "var(--fe-profit-neg)" },
    },
  ];

  return (
    <div style={{ background: "var(--fe-white)", borderRadius: "14px", border: "1px solid var(--fe-grey-200)", boxShadow: "var(--fe-shadow-surface)" }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", borderBottom: "1px solid var(--fe-grey-200)" }}>
        {rows.map((row) => (
          <div key={row.label} style={{ padding: "14px 16px", borderRight: "1px solid var(--fe-grey-100)", display: "flex", flexDirection: "column", gap: "6px" }}>
            {row.badge.text ? (
              <span style={{ display: "inline-flex", alignItems: "center", alignSelf: "flex-start", padding: "3px 8px", borderRadius: "999px", fontSize: "10px", fontWeight: 700, textTransform: "uppercase", background: row.badge.bg, color: row.badge.textCol }}>{row.badge.text}</span>
            ) : (
              <span style={{ fontSize: "11px", fontWeight: 500, color: "var(--fe-grey-400)", textTransform: "uppercase", letterSpacing: "0.06em" }}>{row.label}</span>
            )}
            <span style={{ fontSize: "20px", fontWeight: 700, lineHeight: 1.2, color: row.value === "—" ? "var(--fe-grey-400)" : "var(--fe-grey-900)" }}>{row.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
