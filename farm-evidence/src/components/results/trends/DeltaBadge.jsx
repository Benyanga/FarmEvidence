export function DeltaBadge({ delta }) {
  const tone = delta > 0 ? { bg: "var(--fe-profit-pos)", text: "var(--fe-green-900)" } : delta < 0 ? { bg: "var(--fe-error-bg)", text: "var(--fe-error)" } : { bg: "var(--fe-grey-050)", text: "var(--fe-text-muted)" };
  return <span style={{ display: "inline-flex", alignItems: "center", padding: "3px 8px", borderRadius: "999px", fontSize: "11px", fontWeight: 600, background: tone.bg, color: tone.text }}>{delta >= 0 ? "+" : ""}{delta ?? "—"}</span>;
}
