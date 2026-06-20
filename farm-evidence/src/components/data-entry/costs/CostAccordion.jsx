import { useState, useEffect } from "react";
import { useDataStore } from "../../../store/dataStore";
import { useSessionStore } from "../../../store/sessionStore";
import { TillageForm } from "./TillageForm";
import { FertilizerForm } from "./FertilizerForm";
import { PesticideForm } from "./PesticideForm";
import { IrrigationForm } from "./IrrigationForm";
import { ResidueForm } from "./ResidueForm";
import { LaborForm } from "./LaborForm";
import { getCategoryStatus, getCostCompletionCount } from "../../../utils/computationGates";
import { RevenueEntry } from "../revenue/RevenueEntry";

const CATEGORY_CONFIG = [
  { id: "tillage", label: "Tillage", Component: TillageForm },
  { id: "fertilizer", label: "Fertilizer", Component: FertilizerForm },
  { id: "pesticide", label: "Pesticide", Component: PesticideForm },
  { id: "irrigation", label: "Irrigation", Component: IrrigationForm },
  { id: "residue", label: "Residue Management", Component: ResidueForm },
  { id: "labor", label: "Labor", Component: LaborForm },
];

function parseCostValue(input) {
  if (input === "" || input === undefined || input === null) return undefined;
  const parsed = Number(input);
  return Number.isNaN(parsed) ? undefined : parsed;
}

const buildInput = (value, onChange) => (
  <input
    className="field-input"
    type="number"
    value={value}
    onChange={onChange}
    style={{ width: "100%", minHeight: "40px", borderRadius: "8px", border: "1px solid var(--fe-grey-200)", padding: "0 12px", fontSize: "14px", color: "var(--fe-grey-900)", background: "var(--fe-white)", outline: "none", accentColor: "var(--fe-teal-900)" }}
  />
);

const severityClass = (status) => {
  switch (status) {
    case "complete": return "state-positive";
    case "partial":  return "state-caution";
    default:         return "state-neutral";
  }
};

// getCostFieldMessage removed (unused)

export function CostAccordion() {
  const [openItems, setOpenItems] = useState(new Set());
  const updateCosts = useDataStore((s) => s.updateCosts);
  const updateSeason = useDataStore((s) => s.updateSeason);
  const activeFarm = useSessionStore((s) => s.activeFarm);
  const seasonKey = activeFarm ? `${activeFarm.year}-${activeFarm.season}` : "season-1";
  const season = useDataStore((s) => s.seasons[seasonKey] ?? s.seasons["season-1"]);
  const costs = season?.costs ?? {};
  const completeCount = getCostCompletionCount(season);
  const autosave = useDataStore((s) => s.autosave);
  const costNotes = season?.costDetails ?? {};
  const noteValue = (category) => costNotes[category]?.note ?? "";

  const displaySeason = season || {
    costs: {},
    costDetails: {},
  };

  const toggleItem = (id) => {
    setOpenItems((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  useEffect(() => {
    const timeoutId = setTimeout(autosave, 1000);
    return () => clearTimeout(timeoutId);
  }, [season, autosave]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: "16px", fontWeight: 600, fontFamily: "var(--font-display)", color: "var(--fe-grey-900)" }}>Costs</span>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "12px", color: "var(--fe-grey-500)" }}>{completeCount}/6 recorded</span>
          <button type="button" className="btn btn-secondary btn-sm" onClick={autosave}>Save</button>
        </div>
      </div>

      {CATEGORY_CONFIG.map(({ id, label, Component }) => {
        const status = getCategoryStatus(displaySeason, id);
        const isOpen = openItems.has(id);
        const sevCls = severityClass(status);

        return (
          <div
            key={id}
            className={sevCls}
            style={{
              borderRadius: "14px",
              border: "1px solid var(--fe-grey-200)",
              background: "var(--fe-white)",
              boxShadow: "var(--fe-shadow-surface)",
              overflow: "hidden",
            }}
          >
            <button
              type="button"
              onClick={() => toggleItem(id)}
              aria-expanded={isOpen}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "14px 18px",
                background: "transparent",
                border: "none",
                cursor: "pointer",
                textAlign: "left",
              }}
            >
              <span style={{ fontSize: "14px", fontWeight: 600, color: "var(--fe-grey-900)" }}>{label}</span>
              <span
                style={{
                  fontSize: "13px",
                  color: "var(--fe-grey-500)",
                  transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
                  transition: "transform 180ms ease",
                  display: "inline-block",
                }}
              >
                ▾
              </span>
            </button>

            {isOpen && (
              <div style={{ borderTop: "1px solid var(--fe-grey-200)", padding: "16px 18px 18px" }}>
                <div style={{ display: "grid", gap: "12px", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", marginBottom: "12px" }}>
                  <div style={{ display: "grid", gap: "4px" }}>
                    <span style={{ fontSize: "11px", fontWeight: 600, color: "var(--fe-grey-400)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Category total</span>
                    {buildInput(
                      costs[id] ?? "",
                      (e) => updateCosts(seasonKey, { [id]: parseCostValue(e.target.value) }),
                    )}
                  </div>
                  <div style={{ display: "grid", gap: "4px" }}>
                    <span style={{ fontSize: "11px", fontWeight: 600, color: "var(--fe-grey-400)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Notes (optional)</span>
                    <textarea
                      className="field-input"
                      rows={2}
                      value={noteValue(id)}
                      placeholder="Notes"
                      onChange={(e) => {
                        const updatedDetails = {
                          ...(displaySeason.costDetails ?? {}),
                          [id]: { ...(displaySeason.costDetails?.[id] ?? {}), note: e.target.value },
                        };
                        updateSeason(seasonKey, { costDetails: updatedDetails });
                      }}
                      style={{ width: "100%", borderRadius: "8px", border: "1px solid var(--fe-grey-200)", padding: "8px 12px", fontSize: "14px", color: "var(--fe-grey-900)", background: "var(--fe-white)", outline: "none", resize: "vertical" }}
                    />
                  </div>
                </div>
                <Component />
              </div>
            )}
          </div>
        );
      })}

      {/* Revenue Entry Section */}
      <div style={{ borderTop: "1px solid var(--fe-grey-200)", paddingTop: "16px" }}>
        <RevenueEntry />
      </div>

      {completeCount === 6 && (
        <div style={{
          marginTop: "12px",
          padding: "16px",
          borderRadius: "14px",
          background: "var(--fe-green-100)",
          border: "1px solid var(--fe-green-100)",
          display: "flex",
          alignItems: "center",
          gap: "12px",
        }}>
          <span style={{ width: "28px", height: "28px", borderRadius: "50%", background: "var(--fe-green-100)", color: "var(--fe-green-900)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px", fontWeight: 700 }}>✓</span>
          <span style={{ fontSize: "14px", fontWeight: 600, color: "var(--fe-green-900)" }}>All cost categories complete</span>
        </div>
      )}
    </div>
  );
}
