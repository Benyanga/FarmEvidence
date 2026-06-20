export function ModeBlockedScreen() {
  return (
    <div style={{ borderRadius: "14px", border: "1px solid var(--fe-amber-500)", borderLeft: "4px solid var(--fe-amber-500)", background: "var(--fe-amber-100)", boxShadow: "var(--fe-shadow-surface)", padding: "16px 20px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <span style={{ display: "inline-flex", padding: "4px 10px", borderRadius: "999px", fontSize: "11px", fontWeight: 700, textTransform: "uppercase", background: "var(--fe-amber-500)", color: "var(--fe-white)" }}>Farmer mode active</span>
        <span style={{ fontSize: "14px", fontWeight: 500, color: "var(--fe-amber-700)" }}>Statistics require research mode</span>
      </div>
    </div>
  );
}
