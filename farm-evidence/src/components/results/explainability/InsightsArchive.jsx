export function InsightsArchive({ cards = [] }) {
  return (
    <div className="card">
      <span style={{ fontSize: "14px", fontWeight: 600, color: "var(--fe-grey-900)", marginBottom: "12px", display: "block" }}>Insights archive</span>
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        {cards.map((c) => (
          <div key={c.trigger} style={{ padding: "12px 16px", borderRadius: "10px", border: "1px solid var(--fe-border-default)", background: "var(--fe-grey-050)", display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "11px", color: "var(--fe-text-muted)", textTransform: "uppercase", fontWeight: 600 }}>{c.WHAT}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
