import { Card } from "../ui/Card";

export function MetricCard({ label, value, unit, delta, color, note }) {
  return (
    <Card className="metric-card">
      <div className="metric-card__label">{label}</div>
      <div className="metric-card__value" style={{ color: color || 'var(--text-primary)' }}>
        <span>{value}</span>
        {unit ? <span className="metric-card__unit">{unit}</span> : null}
      </div>
      {delta !== undefined && (
        <div className="metric-card__delta" data-positive={delta >= 0}>
          {delta >= 0 ? "▲" : "▼"} {Math.abs(delta)} {unit || ""}
        </div>
      )}
      {note ? <div className="metric-card__note">{note}</div> : null}
    </Card>
  );
}
