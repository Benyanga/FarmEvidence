import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export function CNBChart({ values = [] }) {
  const data = values.map((v, i) => ({ season: i + 1, cnb: v }));
  return (
    <div style={{ background: "var(--fe-white)", borderRadius: "14px", border: "1px solid var(--fe-grey-200)", boxShadow: "var(--fe-shadow-surface)", padding: "18px 20px" }}>
      <h3 style={{ fontSize: "14px", fontWeight: 600, color: "var(--fe-grey-900)", marginBottom: "12px" }}>Capital negative balance</h3>
      <div style={{ height: "200px" }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <XAxis dataKey="season" tick={{ fontSize: 12, fill: "var(--fe-grey-400)" }} axisLine={{ stroke: "var(--fe-grey-200)" }} tickLine={false} />
            <YAxis tick={{ fontSize: 12, fill: "var(--fe-grey-400)" }} axisLine={{ stroke: "var(--fe-grey-200)" }} tickLine={false} />
            <Tooltip />
            <Area type="linear" dataKey="cnb" stroke="var(--fe-green-500)" strokeWidth={2} fill="var(--fe-green-100)" dot={{ r: 4, fill: "var(--fe-green-500)" }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
