import { Area, AreaChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export function ConfidenceBandChart({ points = [] }) {
  const data = points.map((p, i) => ({ season: i + 1, expected: p.expected, low: p.expected - p.stdDev, high: p.expected + p.stdDev }));
  return (
    <div style={{ background: "var(--fe-white)", borderRadius: "14px", border: "1px solid var(--fe-border-default)", boxShadow: "var(--fe-shadow-surface)", padding: "18px 20px" }}>
      <h3 style={{ fontSize: "14px", fontWeight: 600, color: "var(--fe-grey-900)", marginBottom: "12px" }}>Confidence band</h3>
      <p style={{ fontSize: "11px", color: "var(--fe-text-muted)", marginBottom: "12px" }}>Shaded area shows expected profit variability</p>
      <div style={{ height: "200px" }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <XAxis dataKey="season" tick={{ fontSize: 12, fill: "var(--fe-text-muted)" }} axisLine={{ stroke: "var(--fe-border-default)" }} tickLine={false} />
            <YAxis tick={{ fontSize: 12, fill: "var(--fe-text-muted)" }} axisLine={{ stroke: "var(--fe-border-default)" }} tickLine={false} />
            <Tooltip />
            <Area type="linear" dataKey="high" stroke="transparent" fill="var(--fe-teal-100)" fillOpacity={0.35} />
            <Area type="linear" dataKey="low" stroke="transparent" fill="var(--fe-white)" />
            <Line type="linear" dataKey="expected" stroke="var(--fe-grey-900)" strokeWidth={2} dot={{ r: 4, fill: "var(--fe-grey-900)" }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
