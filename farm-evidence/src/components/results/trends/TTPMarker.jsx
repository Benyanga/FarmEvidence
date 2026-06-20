export function TTPMarker({ reached, season }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "14px 18px", borderRadius: "14px", border: "1px solid var(--fe-border-default)", boxShadow: "var(--fe-shadow-surface)", background: reached ? "var(--fe-green-100)" : "var(--fe-grey-050)" }}>
      <span style={{ borderRadius: "50%", width: "8px", height: "8px", background: reached ? "var(--fe-green-700)" : "var(--fe-grey-500)", flexShrink: 0 }} />
      <span style={{ fontSize: "13px", color: reached ? "var(--fe-green-900)" : "var(--fe-text-muted)", fontWeight: 500 }}>{reached ? `Time to profit reached — season ${season}` : "Time to profit not yet reached — continue recording"}</span>
    </div>
  );
}
