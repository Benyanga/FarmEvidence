import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export function AdoptionTrendChart({ values = [] }) {
  const data = values.map((value, idx) => ({ season: idx + 1, adoptionCost: value }));
  return (
    <div style={{ background: "var(--fe-white)", borderRadius: "14px", border: "1px solid var(--fe-grey-200)", boxShadow: "var(--fe-shadow-surface)", padding: "18px 20px" }}>
      <h3 style={{ fontSize: "14px", fontWeight: 600, color: "var(--fe-grey-900)", marginBottom: "12px" }}>Adoption Cost Trend</h3>
      <div style={{ height: "200px" }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <XAxis dataKey="season" tick={{ fontSize: 12, fill: "var(--fe-grey-400)" }} axisLine={{ stroke: "var(--fe-grey-200)" }} tickLine={false} />
            <YAxis tick={{ fontSize: 12, fill: "var(--fe-grey-400)" }} axisLine={{ stroke: "var(--fe-grey-200)" }} tickLine={false} />
            <Tooltip />
            <Line type="linear" dataKey="adoptionCost" stroke="var(--fe-amber-400)" strokeWidth={2} dot={{ r: 4, fill: "var(--fe-amber-400)" }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
