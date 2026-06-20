import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export function TrendChart({ title, values = [] }) {
  const data = values.map((value, idx) => ({ season: `Season ${String.fromCharCode(65 + (idx % 3 || 0))}`, value }));
  return (
    <div style={{ background: "var(--fe-white)", borderRadius: "14px", border: "1px solid var(--fe-border-default)", boxShadow: "var(--fe-shadow-surface)", padding: "18px 20px" }}>
      {title ? <h3 style={{ fontSize: "13px", fontWeight: 500, color: "var(--fe-text-muted)", marginBottom: "12px" }}>{title}</h3> : null}
      <div style={{ height: "180px" }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <XAxis dataKey="season" tick={{ fontSize: 11, fill: "var(--fe-text-muted)" }} axisLine={{ stroke: "var(--fe-border-default)" }} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: "var(--fe-text-muted)" }} axisLine={{ stroke: "var(--fe-border-default)" }} tickLine={false} />
            <Tooltip />
            <Line type="linear" dataKey="value" stroke="var(--fe-grey-900)" strokeWidth={2} dot={{ r: 4, fill: "var(--fe-grey-900)" }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
