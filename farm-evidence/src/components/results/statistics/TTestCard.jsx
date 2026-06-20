export function TTestCard({ stats }) {
  if (!stats) return null;
  const significant = stats.p_value != null && stats.p_value < 0.05;
  return (
    <div style={{ background: "var(--fe-white)", borderRadius: "14px", border: "1px solid var(--fe-grey-200)", boxShadow: "var(--fe-shadow-surface)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "10px", borderBottom: "1px solid var(--fe-grey-100)", padding: "14px 18px" }}>
        <span style={{ fontSize: "14px", fontWeight: 600, color: "var(--fe-grey-900)" }}>Welch t-test</span>
        <span style={{ display: "inline-flex", alignItems: "center", padding: "3px 8px", borderRadius: "999px", fontSize: "10px", fontWeight: 700, textTransform: "uppercase", background: significant ? "var(--fe-green-100)" : "var(--fe-warning-50)", color: significant ? "var(--fe-green-900)" : "var(--fe-amber-700)" }}>{significant ? "Significant" : "Not significant"}</span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0 }}>
        <div style={{ padding: "12px 18px", borderBottom: "1px solid var(--fe-grey-100)", borderRight: "1px solid var(--fe-grey-100)" }}>
          <span style={{ fontSize: "11px", color: "var(--fe-grey-400)", textTransform: "uppercase", letterSpacing: "0.06em" }}>T-statistic</span>
          <div style={{ fontSize: "16px", fontWeight: 600, color: "var(--fe-grey-900)", marginTop: "4px" }}>{stats.t_stat?.toFixed?.(2) ?? "—"}</div>
        </div>
        <div style={{ padding: "12px 18px", borderBottom: "1px solid var(--fe-grey-100)" }}>
          <span style={{ fontSize: "11px", color: "var(--fe-grey-400)", textTransform: "uppercase", letterSpacing: "0.06em" }}>P value</span>
          <div style={{ fontSize: "16px", fontWeight: 600, color: "var(--fe-grey-900)", marginTop: "4px" }}>{stats.p_value?.toFixed?.(4) ?? "—"}</div>
        </div>
      </div>
    </div>
  );
}
