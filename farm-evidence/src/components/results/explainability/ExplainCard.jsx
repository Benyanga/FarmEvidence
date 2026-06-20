export function ExplainCard({ card }) {
  if (!card) return null;

  const severityColor = {
    positive: "var(--fe-positive)",
    advisory: "var(--fe-advisory)",
    critical: "var(--fe-error)",
    neutral: "var(--fe-grey-900)",
  }[card.severity] || "var(--fe-grey-900)";

  const severityBg = {
    positive: "var(--fe-profit-pos)",
    advisory: "var(--fe-advisory)",
    critical: "var(--fe-error-bg)",
    neutral: "var(--fe-grey-050)",
  }[card.severity] || "var(--fe-grey-050)";

  return (
    <div style={{ borderRadius: "14px", border: "1px solid var(--fe-border-default)", boxShadow: "var(--fe-shadow-surface)", borderLeft: `4px solid ${severityColor}`, background: severityBg, padding: "18px 20px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
        <span style={{ fontSize: "14px", fontWeight: 600, color: "var(--fe-grey-900)" }}>{card.trigger}</span>
        <button style={{ background: "none", border: "none", color: "var(--fe-text-muted)", cursor: "pointer", fontSize: "14px", lineHeight: 1, padding: 0, fontWeight: 600 }}>✕</button>
      </div>

      {[
        { label: "WHAT", text: card.WHAT, pillBg: "var(--fe-ca-bg)", pillText: "var(--fe-teal-900)" },
        { label: "WHY", text: card.WHY, pillBg: "var(--fe-ca-bg)", pillText: "var(--fe-amber-400)" },
        { label: "HOW", text: card.HOW, pillBg: "var(--fe-ca-bg)", pillText: "var(--fe-amber-400)" },
      ].map((section) => (
        <div key={section.label} style={{ marginBottom: "10px" }}>
          <span style={{ display: "inline-flex", alignItems: "center", padding: "3px 8px", borderRadius: "999px", fontSize: "10px", fontWeight: 700, textTransform: "uppercase", background: section.pillBg, color: section.pillText, marginBottom: "6px" }}>{section.label}</span>
          <p style={{ fontSize: "13px", color: "var(--fe-grey-700)", lineHeight: 1.5 }}>{section.text}</p>
        </div>
      ))}

      <div style={{ marginTop: "14px", padding: "12px 16px", borderRadius: "8px", background: "var(--fe-teal-900)" }}>
        <span style={{ fontSize: "13px", fontWeight: 500, color: "var(--fe-white)" }}>Next season: {card.RECOMMENDATION}</span>
      </div>
    </div>
  );
}
