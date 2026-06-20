export function AdoptionCostCard({ result }) {
  const adoptionCost = result?.steps?.adoptionCost;

  if (adoptionCost === null || adoptionCost === undefined) {
    return (
      <div style={{ background: "var(--fe-white)", borderRadius: "14px", border: "1px solid var(--fe-grey-200)", boxShadow: "var(--fe-shadow-surface)", padding: "18px 20px", borderLeft: "4px solid var(--fe-grey-400)" }}>
        <span style={{ fontSize: "13px", fontWeight: 500, color: "var(--fe-grey-900)" }}>No adoption cost yet</span>
        <span style={{ fontSize: "13px", color: "var(--fe-grey-500)", marginTop: "4px", display: "block" }}>System stable — not yet computed</span>
      </div>
    );
  }

  if (adoptionCost > 0) {
    return (
      <div style={{ background: "var(--fe-warning-50)", borderRadius: "14px", border: "1px solid var(--fe-amber-400)", boxShadow: "var(--fe-shadow-surface)", padding: "18px 20px", borderLeft: "4px solid var(--fe-amber-400)" }}>
        <span style={{ fontSize: "13px", fontWeight: 500, color: "var(--fe-amber-700)" }}>Adoption gap this season</span>
        <span style={{ fontSize: "22px", fontWeight: 700, color: "var(--fe-amber-700)", marginTop: "4px", display: "block" }}>{adoptionCost.toFixed(0)} RWF/ha</span>
        <span style={{ fontSize: "13px", color: "var(--fe-grey-500)", marginTop: "6px", display: "block" }}>CA is {adoptionCost.toFixed(0)} RWF/ha behind CF this season</span>
      </div>
    );
  }

  return (
    <div style={{ background: "var(--fe-green-100)", borderRadius: "14px", border: "1px solid var(--fe-green-500)", boxShadow: "var(--fe-shadow-surface)", padding: "18px 20px", borderLeft: "4px solid var(--fe-green-500)" }}>
      <span style={{ fontSize: "13px", fontWeight: 500, color: "var(--fe-green-900)" }}>CA is outperforming CF</span>
      <span style={{ fontSize: "22px", fontWeight: 700, color: "var(--fe-green-900)", marginTop: "4px", display: "block" }}>{Math.abs(adoptionCost).toFixed(0)} RWF/ha ahead</span>
      <span style={{ fontSize: "13px", color: "var(--fe-grey-500)", marginTop: "6px", display: "block" }}>CA matches or exceeds CF returns</span>
    </div>
  );
}
