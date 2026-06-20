export function StatTestBanner({ mode, treatmentCount, rcbdValid }) {
  if (mode === "FARMER") return null;
  if (!rcbdValid) {
    return (
      <div style={{ background: "var(--fe-error-bg)", borderRadius: "14px", border: "1px solid var(--fe-critical)", boxShadow: "var(--fe-shadow-surface)", padding: "14px 18px" }}>
        <span style={{ fontSize: "13px", fontWeight: 500, color: "var(--fe-profit-neg)" }}>RCBD structure incomplete — statistical tests blocked</span>
      </div>
    );
  }
  return (
    <div style={{ background: "var(--fe-green-100)", borderRadius: "14px", border: "1px solid var(--fe-green-500)", boxShadow: "var(--fe-shadow-surface)", padding: "14px 18px" }}>
      <span style={{ fontSize: "13px", fontWeight: 500, color: "var(--fe-green-900)" }}>
        {treatmentCount === 2
          ? "Welch t-test applied — 2 treatments detected"
          : `One-way ANOVA applied — ${treatmentCount} treatments detected`}
      </span>
    </div>
  );
}
