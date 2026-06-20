import { useCallback, useMemo, useState } from "react";
import { useDataStore } from "../../store/dataStore";
import { useSessionStore } from "../../store/sessionStore";
import { getComputationGates } from "../../utils/computationGates";

function GateItem({ ok, label, onClick }) {
  const color = ok ? "var(--fe-green-700)" : "var(--fe-error)";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 14px", borderRadius: "10px", border: "1px solid var(--fe-border-default)", background: ok ? "var(--fe-green-100)" : "var(--fe-error-bg)" }}>
      <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: color, flexShrink: 0 }} />
      <span style={{ flex: 1, fontSize: "13px", color: ok ? "var(--fe-green-900)" : "var(--fe-error)" }}>{label}</span>
      <button type="button" style={{ background: "none", border: "none", color: "var(--fe-text-muted)", cursor: "pointer", fontSize: "13px" }} onClick={onClick}></button>
    </div>
  );
}

function GateGroup({ title, items, scrollToAnchor, collapsed, onToggle }) {
  const complete = items.filter((i) => i.ok).length;
  return (
    <div style={{ borderRadius: "14px", border: "1px solid var(--fe-border-default)", boxShadow: "var(--fe-shadow-surface)", background: "var(--fe-white)", overflow: "hidden" }}>
      <button type="button" onClick={onToggle} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 18px", background: "transparent", border: "none", cursor: "pointer", textAlign: "left" }}>
        <span style={{ fontSize: "14px", fontWeight: 600, color: "var(--fe-grey-900)" }}>{title}</span>
        <span style={{ fontSize: "12px", color: "var(--fe-text-muted)" }}>{complete} of {items.length} complete</span>
      </button>
      <div style={{ maxHeight: collapsed ? 0 : 3000, overflow: "hidden", transition: "max-height 0.3s ease" }}>
        <div style={{ padding: "2px 18px 16px", display: "flex", flexDirection: "column", gap: "6px" }}>
          {items.map((gate) => <GateItem key={gate.label} ok={gate.ok} label={gate.label} anchor={gate.anchor} onClick={() => scrollToAnchor(gate.anchor)} />)}
        </div>
      </div>
    </div>
  );
}

export function GateChecklist() {
  const activeFarm = useSessionStore((s) => s.activeFarm);
  const seasonKey = activeFarm ? `${activeFarm.year}-${activeFarm.season}` : "season-1";
  const season = useDataStore((s) => s.seasons[seasonKey] ?? s.seasons["season-1"]);
  const setup = useDataStore((s) => s.setup);
  const mode = useSessionStore((s) => s.mode);
  const gates = getComputationGates(setup, season, mode);

  const scrollToAnchor = useCallback((anchor) => {
    const el = document.getElementById(`section-${anchor}`);
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
    el?.focus?.();
  }, []);

  const revenueGates = useMemo(() => gates.filter((g) => g.anchor.startsWith("revenue-") || g.anchor === "agronomic" || g.anchor === "csi"), [gates]);
  const laborGates   = useMemo(() => gates.filter((g) => g.anchor.startsWith("labor-")), [gates]);
  const costGates    = useMemo(() => gates.filter((g) => g.anchor.startsWith("category-")), [gates]);
  const otherGates   = useMemo(() => gates.filter((g) => ![...revenueGates, ...laborGates, ...costGates].includes(g)), [gates]);
  const [coll, setColl] = useState({ revenue: false, labor: true, costs: false, setup: true });

  const toggle = (k) => setColl((p) => ({ ...p, [k]: !p[k] }));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <div style={{ borderRadius: "14px", border: "1px solid var(--fe-border-default)", boxShadow: "var(--fe-shadow-surface)", background: "var(--fe-white)", padding: "16px 20px" }}>
        <span style={{ fontSize: "14px", fontWeight: 600, color: "var(--fe-grey-900)", marginBottom: "4px", display: "block" }}>Computation validation gates</span>
        <span style={{ fontSize: "12px", color: "var(--fe-text-muted)" }}>All gates must pass before data analysis begins</span>
        <div style={{ display: "flex", gap: "8px", marginTop: "12px", flexWrap: "wrap" }}>
          <button type="button" className="btn btn-primary" onClick={() => setColl({ revenue: false, labor: false, costs: false, setup: false })}>Expand all</button>
          <button type="button" className="btn btn-secondary" onClick={() => setColl({ revenue: true, labor: true, costs: true, setup: true })}>Collapse all</button>
        </div>
      </div>
      {[
        { title: "Revenue & agronomic", items: revenueGates, key: "revenue", collapsed: coll.revenue },
        { title: "Labor", items: laborGates, key: "labor", collapsed: coll.labor },
        { title: "Cost categories", items: costGates, key: "costs", collapsed: coll.costs },
        { title: "Setup & design", items: otherGates, key: "setup", collapsed: coll.setup },
      ].map((g) => (
        <GateGroup key={g.key} title={g.title} items={g.items} collapsed={g.collapsed} onToggle={() => toggle(g.key)} scrollToAnchor={scrollToAnchor} />
      ))}
    </div>
  );
}
