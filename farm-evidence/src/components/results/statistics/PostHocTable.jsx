export function PostHocTable({ rows = [] }) {
  if (!rows.length) return null;
  return (
    <div style={{ background: "var(--fe-white)", borderRadius: "14px", border: "1px solid var(--fe-grey-200)", boxShadow: "var(--fe-shadow-surface)", overflow: "hidden" }}>
      <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--fe-grey-900)", padding: "14px 18px", borderBottom: "1px solid var(--fe-grey-100)" }}>Post hoc comparisons</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0 }}>
        {rows.map((r, idx) => (
          <div key={idx} style={{ padding: "12px 18px", display: "flex", flexDirection: "column", gap: "2px", borderBottom: "1px solid var(--fe-grey-100)", borderRight: idx % 2 === 0 ? "1px solid var(--fe-grey-100)" : "none", background: r.significant ? "var(--fe-green-100)" : "var(--fe-white)" }}>
            <span style={{ fontSize: "11px", color: "var(--fe-grey-400)" }}>{r.treatment_A} vs {r.treatment_B}</span>
            <span style={{ fontSize: "13px", fontWeight: 600, color: r.significant ? "var(--fe-green-900)" : "var(--fe-grey-500)" }}>{r.significant ? "Significant" : "Not significant"}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
