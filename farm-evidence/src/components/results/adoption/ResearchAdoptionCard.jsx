export function ResearchAdoptionCard({ data }) {
  const ca = data?.adoption_costs?.CA;

  if (ca === null || ca === undefined) {
    return (
      <div style={{ background: "var(--fe-white)", borderRadius: "14px", border: "1px solid var(--fe-grey-200)", boxShadow: "var(--fe-shadow-surface)", padding: "18px 20px", borderLeft: "4px solid var(--fe-grey-400)" }}>
        <span style={{ fontSize: "13px", fontWeight: 500, color: "var(--fe-grey-900)" }}>Research adoption</span>
        <span style={{ fontSize: "13px", color: "var(--fe-grey-500)", marginTop: "4px", display: "block" }}>Not computed — need both CF and CA treatments</span>
      </div>
    );
  }

  if (ca > 0) {
    return (
      <div style={{ background: "var(--fe-warning-50)", borderRadius: "14px", border: "1px solid var(--fe-amber-400)", boxShadow: "var(--fe-shadow-surface)", padding: "18px 20px", borderLeft: "4px solid var(--fe-amber-400)" }}>
        <span style={{ fontSize: "13px", fontWeight: 500, color: "var(--fe-amber-700)" }}>Research adoption gap (CA vs CF)</span>
        <span style={{ fontSize: "22px", fontWeight: 700, color: "var(--fe-amber-700)", marginTop: "4px", display: "block" }}>{Math.round(ca)} RWF/ha</span>
        <span style={{ fontSize: "13px", color: "var(--fe-grey-500)", marginTop: "6px", display: "block" }}>CA is {Math.round(ca)} RWF/ha behind CF this season</span>
      </div>
    );
  }

  return (
    <div style={{ background: "var(--fe-green-100)", borderRadius: "14px", border: "1px solid var(--fe-green-500)", boxShadow: "var(--fe-shadow-surface)", padding: "18px 20px", borderLeft: "4px solid var(--fe-green-500)" }}>
      <span style={{ fontSize: "13px", fontWeight: 500, color: "var(--fe-green-900)" }}>No adoption gap</span>
      <span style={{ fontSize: "22px", fontWeight: 700, color: "var(--fe-green-900)", marginTop: "4px", display: "block" }}>0 RWF/ha</span>
      <span style={{ fontSize: "13px", color: "var(--fe-grey-500)", marginTop: "6px", display: "block" }}>CA matches or exceeds CF returns</span>
    </div>
  );
}

export default ResearchAdoptionCard;
