export function EffectSizeCard({ label = "Effect size", value, magnitude }) {
  const magnitudeColor = magnitude === "Large" ? "var(--fe-green-900)" : magnitude === "Medium" ? "var(--fe-amber-400)" : "var(--fe-grey-500)";
  return (
    <div style={{ background: "var(--fe-white)", borderRadius: "14px", border: "1px solid var(--fe-grey-200)", boxShadow: "var(--fe-shadow-surface)", padding: "18px 20px" }}>
      <span style={{ fontSize: "11px", fontWeight: 500, color: "var(--fe-grey-400)", textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</span>
      <div style={{ display: "flex", alignItems: "baseline", gap: "12px", marginTop: "8px" }}>
        <span style={{ fontSize: "28px", fontWeight: 700, color: "var(--fe-grey-900)" }}>{value ?? "—"}</span>
        {magnitude ? <span style={{ display: "inline-flex", alignItems: "center", padding: "3px 10px", borderRadius: "999px", fontSize: "11px", fontWeight: 700, background: magnitude === "Large" ? "var(--fe-green-100)" : magnitude === "Medium" ? "var(--fe-warning-50)" : "var(--fe-grey-100)", color: magnitudeColor }}>{magnitude}</span> : null}
      </div>
    </div>
  );
}
