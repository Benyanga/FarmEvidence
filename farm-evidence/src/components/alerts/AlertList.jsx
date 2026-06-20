export function AlertList({ cards = [] }) {
  const SEVERITY_MAP = {
    positive: { color: "var(--fe-positive)", bg: "var(--fe-green-100)" },
    advisory:  { color: "var(--fe-advisory)", bg: "var(--fe-amber-100)" },
    critical:  { color: "var(--fe-error)", bg: "var(--fe-error-bg)" },
  };

  if (!cards.length) {
    return (
      <div className="card" style={{ color: "var(--fe-text-muted)", fontSize: "13px" }}>No alerts</div>
    );
  }

  return (
    <div className="card" style={{ padding: 0, overflow: "hidden" }}>
      <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--fe-grey-100)" }}>
        <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--fe-grey-900)" }}>Alerts</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column" }}>
        {cards.map((c) => {
          const sev = SEVERITY_MAP[c.severity] || SEVERITY_MAP.critical;
          return (
            <div key={c.trigger} style={{ borderLeft: `4px solid ${sev.color}`, background: sev.bg, padding: "12px 18px", display: "flex", alignItems: "center", gap: "12px", borderBottom: "1px solid var(--fe-border-default)" }}>
              <span style={{ flex: 1, fontSize: "13px", fontWeight: 600, color: "var(--fe-grey-900)" }}>{c.WHAT}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
