export function AnovaTable({ stats }) {
  if (!stats?.F) return null;
  const significant = stats.p_value != null && stats.p_value < 0.05;
  return (
    <div style={{ background: "var(--fe-white)", borderRadius: "14px", border: "1px solid var(--fe-grey-200)", boxShadow: "var(--fe-shadow-surface)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "14px 18px", borderBottom: "1px solid var(--fe-grey-100)" }}>
        <span style={{ fontSize: "14px", fontWeight: 600, color: "var(--fe-grey-900)" }}>ANOVA</span>
        <span style={{ display: "inline-flex", alignItems: "center", padding: "3px 8px", borderRadius: "999px", fontSize: "10px", fontWeight: 700, textTransform: "uppercase", background: significant ? "var(--fe-green-100)" : "var(--fe-warning-50)", color: significant ? "var(--fe-green-900)" : "var(--fe-amber-700)" }}>{significant ? "Significant" : "Not significant"}</span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 0 }}>
        <div style={{ padding: "12px 18px", borderBottom: "1px solid var(--fe-grey-100)", borderRight: "1px solid var(--fe-grey-100)" }}>
          <span style={{ fontSize: "11px", color: "var(--fe-grey-400)", textTransform: "uppercase", letterSpacing: "0.06em" }}>SS Treatment</span>
          <div style={{ fontSize: "15px", fontWeight: 600, color: "var(--fe-grey-900)", marginTop: "3px" }}>{stats.SS_treatment?.toFixed?.(2) ?? "—"}</div>
        </div>
        <div style={{ padding: "12px 18px", borderBottom: "1px solid var(--fe-grey-100)" }}>
          <span style={{ fontSize: "11px", color: "var(--fe-grey-400)", textTransform: "uppercase", letterSpacing: "0.06em" }}>SS Error</span>
          <div style={{ fontSize: "15px", fontWeight: 600, color: "var(--fe-grey-900)", marginTop: "3px" }}>{stats.SS_error?.toFixed?.(2) ?? "—"}</div>
        </div>
        <div style={{ padding: "12px 18px", borderBottom: "1px solid var(--fe-grey-100)", borderRight: "1px solid var(--fe-grey-100)" }}>
          <span style={{ fontSize: "11px", color: "var(--fe-grey-400)", textTransform: "uppercase", letterSpacing: "0.06em" }}>F statistic</span>
          <div style={{ fontSize: "15px", fontWeight: 600, color: "var(--fe-grey-900)", marginTop: "3px" }}>{stats.F?.toFixed?.(3) ?? "—"}</div>
        </div>
        <div style={{ padding: "12px 18px", borderBottom: "1px solid var(--fe-grey-100)" }}>
          <span style={{ fontSize: "11px", color: "var(--fe-grey-400)", textTransform: "uppercase", letterSpacing: "0.06em" }}>P value</span>
          <div style={{ fontSize: "15px", fontWeight: 600, color: "var(--fe-grey-900)", marginTop: "3px" }}>{stats.p_value?.toFixed?.(4) ?? "—"}</div>
        </div>
      </div>
    </div>
  );
}
