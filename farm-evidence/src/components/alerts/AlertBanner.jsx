export function AlertBanner({ title, severity = "advisory" }) {
  const severityColor = {
    critical: "var(--fe-critical)",
    positive: "var(--fe-green-500)",
    advisory: "var(--fe-amber-400)",
  }[severity] || "var(--fe-amber-400)";
  const severityBg = {
    critical: "var(--fe-error-bg)",
    positive: "var(--fe-green-100)",
    advisory: "var(--fe-warning-50)",
  }[severity] || "var(--fe-warning-50)";
  // severityText removed (unused)

  return (
    <div style={{ borderRadius: "14px", border: "1px solid var(--fe-grey-200)", boxShadow: "var(--fe-shadow-surface)", borderLeft: `4px solid ${severityColor}`, background: severityBg, padding: "14px 18px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
      <span style={{ display: "inline-flex", alignItems: "center", padding: "4px 10px", borderRadius: "999px", fontSize: "10px", fontWeight: 700, textTransform: "uppercase", background: severityColor, color: "var(--fe-white)", marginRight: "12px" }}>{severity}</span>
      <span style={{ flex: 1, fontSize: "13px", fontWeight: 600, color: "var(--fe-grey-900)" }}>{title}</span>
    </div>
  );
}
