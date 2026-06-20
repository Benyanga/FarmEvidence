import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useDataStore } from "../../../store/dataStore";
import { useSessionStore } from "../../../store/sessionStore";

const CATEGORY_COLORS = {
  Tillage: "var(--fe-teal-900)",
  Fertilizer: "var(--fe-green-500)",
  Pesticide: "var(--fe-amber-400)",
  Irrigation: "var(--fe-ca-bg)",
  Residue: "var(--fe-grey-400)",
  Labor: "var(--fe-critical)",
};

export function CostBreakdownChart() {
  const activeFarm = useSessionStore((s) => s.activeFarm);
  const seasonKey = activeFarm ? `${activeFarm.year}-${activeFarm.season}` : "season-1";
  const season = useDataStore((s) => s.seasons[seasonKey] ?? s.seasons["season-1"]);
  const costs = season?.costs ?? {};
  const data = [
    { name: "Tillage", value: Number(costs.tillage) || 0 },
    { name: "Fertilizer", value: Number(costs.fertilizer) || 0 },
    { name: "Pesticide", value: Number(costs.pesticide) || 0 },
    { name: "Irrigation", value: Number(costs.irrigation) || 0 },
    { name: "Residue", value: Number(costs.residue) || 0 },
    { name: "Labor", value: Number(costs.labor) || 0 },
  ];

  return (
    <div style={{ background: "var(--fe-white)", borderRadius: "14px", border: "1px solid var(--fe-grey-200)", boxShadow: "var(--fe-shadow-surface)", padding: "18px 20px" }}>
      <h3 style={{ fontSize: "14px", fontWeight: 600, color: "var(--fe-grey-900)", marginBottom: "12px" }}>Cost Breakdown</h3>
      <div style={{ height: "220px" }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <XAxis dataKey="name" tick={{ fontSize: 12, fill: "var(--fe-grey-400)" }} axisLine={{ stroke: "var(--fe-grey-200)" }} tickLine={false} />
            <YAxis tick={{ fontSize: 12, fill: "var(--fe-grey-400)" }} axisLine={{ stroke: "var(--fe-grey-200)" }} tickLine={false} />
            <Tooltip />
            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
              {data.map((entry, i) => (
                <Bar key={i} dataKey="value" fill={CATEGORY_COLORS[entry.name] ?? "var(--fe-grey-500)"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", marginTop: "12px", paddingTop: "10px", borderTop: "1px solid var(--fe-grey-200)" }}>
        {Object.entries(CATEGORY_COLORS).map(([name, color]) => (
          <div key={name} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <div style={{ width: "10px", height: "10px", borderRadius: "3px", background: color }} />
            <span style={{ fontSize: "11px", color: "var(--fe-grey-500)" }}>{name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
