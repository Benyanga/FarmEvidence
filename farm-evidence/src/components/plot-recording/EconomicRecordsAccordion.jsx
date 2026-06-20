import { useState } from "react";
import { Trash2, Plus } from "lucide-react";
import { usePlotRecordingStore } from "../../store/plotRecordingStore";

const CATEGORY_OPTIONS = [
  { value: "INPUT_COSTS", label: "Inputs Costs" },
  { value: "LABOUR_COSTS", label: "Labour Costs" },
  { value: "REVENUES", label: "Revenues" },
];

const SUB_CATEGORIES = {
  INPUT_COSTS: ["Tillage", "Fertilizer", "Pesticide", "Irrigation", "Residue management", "Other inputs"],
  LABOUR_COSTS: ["Hired labour", "Family labour", "Other labour"],
  REVENUES: ["Crop sales", "Byproduct sales", "Other revenue"],
};

const CATEGORY_LABEL = {
  INPUT_COSTS: "Inputs Costs",
  LABOUR_COSTS: "Labour Costs",
  REVENUES: "Revenues",
};

export function EconomicRecordsAccordion({ plotId, extrapolationFactor = 1 }) {
  const economicRecords = usePlotRecordingStore((s) => s.economicRecords);
  const addEconomicRecord = usePlotRecordingStore((s) => s.addEconomicRecord);
  const saveAllEconomicRecords = usePlotRecordingStore((s) => s.saveAllEconomicRecords);
  const updateEconomicRecord = usePlotRecordingStore((s) => s.updateEconomicRecord);
  const deleteEconomicRecord = usePlotRecordingStore((s) => s.deleteEconomicRecord);
  const revenue = usePlotRecordingStore((s) => s.revenue);
  const setRevenue = usePlotRecordingStore((s) => s.setRevenue);
  const updatePlotAgronomicRecord = usePlotRecordingStore((s) => s.updatePlotAgronomicRecord);
  
  const [yieldInput, setYieldInput] = useState("");
  const [priceInput, setPriceInput] = useState("");
  const [autoSaveTime, setAutoSaveTime] = useState(null);
  const [tonsInput, setTonsInput] = useState("");
  const [kgInput, setKgInput] = useState("");
  const [gramsInput, setGramsInput] = useState("");
  const [soldQtyInput, setSoldQtyInput] = useState("");

  const inputCostRecords = economicRecords.filter((r) => r.category === "INPUT_COSTS");
  const labourCostRecords = economicRecords.filter((r) => r.category === "LABOUR_COSTS");
  const revenueRecords = economicRecords.filter((r) => r.category === "REVENUES");

  const timeToDays = (timeVal = 0, unit = "hr") => {
    const v = Number(timeVal) || 0;
    // Convert any time unit to decimal days for wage/day cost calculation:
    // - days: 1 day = 1
    // - hours: 1 hour = 1 / 8 day
    // - minutes: 1 minute = 1 / 60 hour = 1 / (60 * 8) day
    // - seconds: 1 second = 1 / 3600 hour = 1 / (3600 * 8) day
    switch ((unit || "").toString().toLowerCase()) {
      case "day":
      case "days":
      case "d":
        return v;
      case "hr":
      case "hrs":
      case "hour":
      case "hours":
        return v / 8; // 8 working hours per day
      case "min":
      case "mins":
      case "minute":
      case "minutes":
        return v / 60 / 8;
      case "sec":
      case "secs":
      case "second":
      case "seconds":
        return v / 3600 / 8;
      default:
        return v / 8;
    }
  };

  const recordPlotValue = (r) => {
    if (!r) return 0;
    if (r.category === "LABOUR_COSTS") {
      const workers = Number(r.labourCount || r.labour || 1) || 1;
      const hours = Number(r.quantity) || 0;
      const wagePerDay = Number(r.unitCost) || 0;
      return Number(r.totalPlotRwf) || workers * timeToDays(hours, r.unit) * wagePerDay || 0;
    }
    return Number(r.totalPlotRwf) || (parseFloat(r.quantity) || 0) * (parseFloat(r.unitCost) || 0) || 0;
  };

  const recordHaValue = (r) => {
    if (!r) return 0;
    if (r.category === "LABOUR_COSTS") {
      return (Number(r.totalHaRwf) || 0) || (recordPlotValue(r) * (Number(r.extrapolationFactor) || extrapolationFactor));
    }
    return Number(r.totalHaRwf) || (recordPlotValue(r) * (Number(r.extrapolationFactor) || extrapolationFactor)) || 0;
  };

  const formatNumber = (value, decimals = 2) => {
    const n = Number(value) || 0;
    const formatted = n.toFixed(decimals);
    return formatted.replace(/(\.\d*?)0+$/, "$1").replace(/\.$/, "");
  };

  const inputCostTotal = inputCostRecords.reduce((sum, r) => sum + recordPlotValue(r), 0);
  const inputCostTotalHa = inputCostRecords.reduce((sum, r) => sum + recordHaValue(r), 0);
  const labourCostTotal = labourCostRecords.reduce((sum, r) => sum + recordPlotValue(r), 0);
  const labourCostTotalHa = labourCostRecords.reduce((sum, r) => sum + recordHaValue(r), 0);
  const revenueTotal = revenueRecords.reduce((sum, r) => sum + recordPlotValue(r), 0);
  const revenueTotalHa = revenueRecords.reduce((sum, r) => sum + recordHaValue(r), 0);

  const handleAddRecord = () => {
    addEconomicRecord({
      date: new Date().toISOString().split("T")[0],
      item: "",
      category: "INPUT_COSTS",
      costType: "C_SD",
      unit: "",
      quantity: 0,
      unitCost: 0,
    });
  };

  const handleSaveRevenue = () => {
    if (yieldInput && priceInput) {
      setRevenue(Number(yieldInput), Number(priceInput), extrapolationFactor);
      setAutoSaveTime(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {/* Legend */}
      <div style={{ display: "flex", gap: "16px", fontSize: "12px" }}>
        <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
          <div style={{
            width: "12px",
            height: "12px",
            borderRadius: "3px",
            background: "var(--fe-teal-900)",
          }} />
          <span style={{ color: "var(--fe-grey-700)" }}>System-dependent — enters analysis</span>
        </div>
        <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
          <div style={{
            width: "12px",
            height: "12px",
            borderRadius: "3px",
            background: "var(--fe-grey-300)",
          }} />
          <span style={{ color: "var(--fe-grey-500)" }}>System-independent — enters analysis but is excluded from systems comparison</span>
        </div>
      </div>

      {/* Inputs table */}
      <div style={{ overflowX: "auto" }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <div style={{ fontWeight: 700, background: "#e9f7f2", padding: 8, borderRadius: 4 }}>INPUT COSTS</div>
            <div>
              <button
                onClick={() => addEconomicRecord({ category: 'INPUT_COSTS', costType: 'C_SD', unit: 'kg', quantity: 0, unitCost: 0 })}
                style={{ padding: '6px 10px', borderRadius: 6, border: 'none', background: 'var(--fe-teal-900)', color: 'white', fontWeight: 600, cursor: 'pointer' }}
              >
                + Add input row
              </button>
            </div>
          </div>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px", marginBottom: 12 }}>
          <thead>
            <tr style={{ borderBottom: "2px solid var(--fe-grey-200)", background: "var(--fe-grey-050)" }}>
              <th style={{ padding: "8px", textAlign: "left", fontWeight: 600 }}>Date</th>
              <th style={{ padding: "8px", textAlign: "left", fontWeight: 600 }}>Input</th>
              <th style={{ padding: "8px", textAlign: "left", fontWeight: 600 }}>Cost Type</th>
              <th style={{ padding: "8px", textAlign: "right", fontWeight: 600 }}>Quantity</th>
              <th style={{ padding: "8px", textAlign: "left", fontWeight: 600 }}>Unit</th>
              <th style={{ padding: "8px", textAlign: "right", fontWeight: 600 }}>Unit Cost (RWF)</th>
              <th style={{ padding: "8px", textAlign: "right", fontWeight: 600 }}>Total Cost (RWF)</th>
              <th style={{ padding: "8px", textAlign: "left", fontWeight: 600 }}>Notes</th>
              <th style={{ padding: "8px", textAlign: "center", fontWeight: 600 }}>Delete</th>
            </tr>
          </thead>
          <tbody>
            {inputCostRecords.map((record) => (
              <tr key={record.id} style={{ borderBottom: "1px solid var(--fe-grey-200)", background: "var(--fe-white)" }}>
                <td style={{ padding: 8 }}>
                  <input type="date" value={record.date || ""} onChange={(e) => updateEconomicRecord(record.id, { date: e.target.value })} style={{ width: "100%", padding: 4 }} />
                </td>
                <td style={{ padding: 8 }}>
                  <input type="text" value={record.item || ""} onChange={(e) => updateEconomicRecord(record.id, { item: e.target.value })} placeholder="e.g. Seeds" style={{ width: "100%", padding: 4 }} />
                </td>
                <td style={{ padding: 8 }}>
                  <select value={record.costType || "C_SD"} onChange={(e) => updateEconomicRecord(record.id, { costType: e.target.value })} style={{ width: "100%", padding: 4 }}>
                    <option value="C_SD">C_SD — System-dependent</option>
                    <option value="C_SI">C_SI — System-independent</option>
                  </select>
                </td>
                <td style={{ padding: 8, textAlign: "right" }}>
                  <input type="number" step="any" value={record.quantity || ""} onChange={(e) => updateEconomicRecord(record.id, { quantity: e.target.value })} style={{ width: "100%", padding: 4, textAlign: "right" }} />
                </td>
                <td style={{ padding: 8 }}>
                  <input type="text" value={record.unit || ""} onChange={(e) => updateEconomicRecord(record.id, { unit: e.target.value })} placeholder="kg, bunch" style={{ width: "100%", padding: 4 }} />
                </td>
                <td style={{ padding: 8, textAlign: "right" }}>
                  <input type="number" step="any" value={record.unitCost || 0} onChange={(e) => updateEconomicRecord(record.id, { unitCost: e.target.value })} style={{ width: "100%", padding: 4, textAlign: "right" }} />
                </td>
                <td style={{ padding: 8, textAlign: "right", fontWeight: 600 }}>
                  {formatNumber(recordPlotValue(record))}
                </td>
                <td style={{ padding: 8 }}>
                  <input type="text" value={record.notes || ""} onChange={(e) => updateEconomicRecord(record.id, { notes: e.target.value })} placeholder="notes" style={{ width: "100%", padding: 4 }} />
                </td>
                <td style={{ padding: 8, textAlign: "center" }}>
                  <button
                    onClick={() => {
                      const isTemp = (record.id || '').toString().startsWith('temp-');
                      if (!isTemp) {
                        if (!window.confirm('Delete this persisted record? This action cannot be undone.')) return;
                      }
                      deleteEconomicRecord(record.id);
                    }}
                    style={{ background: "none", border: "none", color: "var(--fe-critical)", cursor: "pointer" }}
                    aria-label="Delete record"
                  >
                    <Trash2 size={14} />
                  </button>
                </td>
              </tr>
            ))}
            <tr style={{ background: "#cfeee6", fontWeight: 700 }}>
              <td colSpan={6} style={{ padding: 8, textAlign: "right" }}>Subtotal — Input Costs</td>
              <td style={{ padding: 8, textAlign: "right" }}>{inputCostTotal > 0 ? formatNumber(inputCostTotal) : "0"}</td>
              <td />
              <td />
            </tr>
          </tbody>
        </table>
      </div>

      {/* Labour table */}
      <div style={{ overflowX: "auto" }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <div>
            <div style={{ fontWeight: 700, background: "#eaf3ff", padding: 8, borderRadius: 4 }}>LABOUR COSTS</div>
            <div style={{ fontSize: 11, color: 'var(--fe-grey-600)', marginTop: 4 }}>
              Cost = workers × time (in days) × wage rate per day
            </div>
          </div>
          <div>
            <button
              onClick={() => addEconomicRecord({ category: 'LABOUR_COSTS', costType: 'C_SD', unit: 'hr', labourCount: 1, quantity: 0, unitCost: 0 })}
              style={{ padding: '6px 10px', borderRadius: 6, border: 'none', background: 'var(--fe-teal-900)', color: 'white', fontWeight: 600, cursor: 'pointer' }}
            >
              + Add labour row
            </button>
          </div>
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px", marginBottom: 12 }}>
          <thead>
            <tr style={{ borderBottom: "2px solid var(--fe-grey-200)", background: "var(--fe-grey-050)" }}>
              <th style={{ padding: 8, textAlign: "left", fontWeight: 600 }}>Date</th>
              <th style={{ padding: 8, textAlign: "left", fontWeight: 600 }}>Practice</th>
              <th style={{ padding: 8, textAlign: "left", fontWeight: 600 }}>Cost Type</th>
              <th style={{ padding: 8, textAlign: "right", fontWeight: 600 }}># Labour</th>
              <th style={{ padding: 8, textAlign: "right", fontWeight: 600 }}>Time</th>
              <th style={{ padding: 8, textAlign: "left", fontWeight: 600 }}>Time Unit</th>
              <th style={{ padding: 8, textAlign: "right", fontWeight: 600 }}>Wage Rate (RWF/day)</th>
              <th style={{ padding: 8, textAlign: "right", fontWeight: 600 }}>Total Cost (RWF)</th>
              <th style={{ padding: 8, textAlign: "left", fontWeight: 600 }}>Notes</th>
              <th style={{ padding: 8, textAlign: "center", fontWeight: 600 }}>Delete</th>
            </tr>
          </thead>
          <tbody>
            {labourCostRecords.map((record) => (
              <tr key={record.id} style={{ borderBottom: "1px solid var(--fe-grey-200)", background: "var(--fe-white)" }}>
                <td style={{ padding: 8 }}>
                  <input type="date" value={record.date || ""} onChange={(e) => updateEconomicRecord(record.id, { date: e.target.value })} style={{ width: "100%", padding: 4 }} />
                </td>
                <td style={{ padding: 8 }}>
                  <input type="text" value={record.item || ""} onChange={(e) => updateEconomicRecord(record.id, { item: e.target.value })} placeholder="e.g. Planting" style={{ width: "100%", padding: 4 }} />
                </td>
                <td style={{ padding: 8 }}>
                  <select value={record.costType || "C_SD"} onChange={(e) => updateEconomicRecord(record.id, { costType: e.target.value })} style={{ width: "100%", padding: 4 }}>
                    <option value="C_SD">C_SD — System-dependent</option>
                    <option value="C_SI">C_SI — System-independent</option>
                  </select>
                </td>
                <td style={{ padding: 8, textAlign: "right" }}>
                  <input type="number" value={record.labourCount || record.labour || ""} onChange={(e) => updateEconomicRecord(record.id, { labourCount: e.target.value })} style={{ width: "100%", padding: 4, textAlign: "right" }} />
                </td>
                <td style={{ padding: 8, textAlign: "right" }}>
                  <input type="number" step="any" value={record.quantity || ""} onChange={(e) => updateEconomicRecord(record.id, { quantity: e.target.value })} style={{ width: "100%", padding: 4, textAlign: "right" }} />
                </td>
                <td style={{ padding: 8 }}>
                  <select value={record.unit || "hr"} onChange={(e) => updateEconomicRecord(record.id, { unit: e.target.value })} style={{ width: "100%", padding: 4 }}>
                    <option value="min">min</option>
                    <option value="hr">hr</option>
                    <option value="day">day</option>
                    <option value="sec">sec</option>
                  </select>
                </td>
                <td style={{ padding: 8, textAlign: "right" }}>
                  <input type="number" step="any" value={record.unitCost || 0} onChange={(e) => updateEconomicRecord(record.id, { unitCost: e.target.value })} style={{ width: "100%", padding: 4, textAlign: "right" }} />
                </td>
                <td style={{ padding: 8, textAlign: "right", fontWeight: 600 }}>
                  {formatNumber(recordPlotValue(record))}
                </td>
                <td style={{ padding: 8 }}>
                  <input type="text" value={record.notes || ""} onChange={(e) => updateEconomicRecord(record.id, { notes: e.target.value })} placeholder="notes" style={{ width: "100%", padding: 4 }} />
                </td>
                <td style={{ padding: 8, textAlign: "center" }}>
                  <button onClick={() => deleteEconomicRecord(record.id)} style={{ background: "none", border: "none", color: "var(--fe-critical)", cursor: "pointer" }}><Trash2 size={14} /></button>
                </td>
              </tr>
            ))}
            <tr style={{ background: "#dbeeff", fontWeight: 700 }}>
              <td colSpan={7} style={{ padding: 8, textAlign: "right" }}>Subtotal — Labour Costs</td>
              <td style={{ padding: 8, textAlign: "right" }}>{labourCostTotal > 0 ? formatNumber(labourCostTotal) : "0"}</td>
              <td />
              <td />
            </tr>
          </tbody>
        </table>

        {/* Totals & extrapolation */}
        <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, marginBottom: 6 }}>TOTAL PRODUCTION COST</div>
            <div style={{ padding: 12, background: "var(--fe-white)", border: "1px solid var(--fe-grey-200)", borderRadius: 6 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <div>Subtotal inputs + labour</div>
                <div style={{ fontWeight: 700 }}>{formatNumber(inputCostTotal + labourCostTotal)} RWF</div>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <div>Cost per m²</div>
                <div>{((inputCostTotal + labourCostTotal) * extrapolationFactor / 10000).toFixed(2)} RWF/m²</div>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <div>Cost per ha (extrapolated)</div>
                <div style={{ fontWeight: 700 }}>{formatNumber((inputCostTotal + labourCostTotal) * extrapolationFactor)} RWF/ha</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Revenue Section */}
      <div style={{
        padding: "16px",
        borderRadius: "10px",
        background: "var(--fe-white)",
        border: "1px solid var(--fe-grey-200)",
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <div>
            <div style={{ fontWeight: 700, background: '#fff4e6', padding: 8, borderRadius: 4 }}>REVENUES</div>
          </div>
          <div>
            <button
              onClick={() => addEconomicRecord({
                date: new Date().toISOString().split("T")[0],
                category: 'REVENUES',
                costType: 'C_SD',
                harvestedYield: 0,
                quantity: 0,
                unitCost: 0,
              })}
              style={{
                padding: '6px 10px',
                borderRadius: 6,
                border: 'none',
                background: 'var(--fe-green-900)',
                color: 'white',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              + Add revenue row
            </button>
          </div>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px", marginBottom: 12 }}>
            <thead>
              <tr style={{ borderBottom: "2px solid var(--fe-grey-200)", background: "var(--fe-grey-050)" }}>
                <th style={{ padding: 8, textAlign: "left", fontWeight: 600 }}>Date</th>
                <th style={{ padding: 8, textAlign: "right", fontWeight: 600 }}>Total Harvested Yield (kg)</th>
                <th style={{ padding: 8, textAlign: "right", fontWeight: 600 }}>Quantity Sold (kg)</th>
                <th style={{ padding: 8, textAlign: "right", fontWeight: 600 }}>Unit Price (RWF/kg)</th>
                <th style={{ padding: 8, textAlign: "right", fontWeight: 600 }}>Total Income (RWF)</th>
                <th style={{ padding: 8, textAlign: "center", fontWeight: 600 }}>Delete</th>
              </tr>
            </thead>
            <tbody>
              {revenueRecords.map((record) => (
                <tr key={record.id} style={{ borderBottom: "1px solid var(--fe-grey-200)", background: "var(--fe-white)" }}>
                  <td style={{ padding: 8 }}>
                    <input
                      type="date"
                      value={record.date || ""}
                      onChange={(e) => updateEconomicRecord(record.id, { date: e.target.value })}
                      style={{ width: "100%", padding: 4 }}
                    />
                  </td>
                  <td style={{ padding: 8, textAlign: "right" }}>
                    <input
                      type="number"
                      step="any"
                      value={record.harvestedYield || ""}
                      onChange={(e) => updateEconomicRecord(record.id, { harvestedYield: e.target.value })}
                      style={{ width: "100%", padding: 4, textAlign: "right" }}
                    />
                  </td>
                  <td style={{ padding: 8, textAlign: "right" }}>
                    <input
                      type="number"
                      step="any"
                      value={record.quantity || ""}
                      onChange={(e) => updateEconomicRecord(record.id, { quantity: e.target.value })}
                      style={{ width: "100%", padding: 4, textAlign: "right" }}
                    />
                  </td>
                  <td style={{ padding: 8, textAlign: "right" }}>
                    <input
                      type="number"
                      step="any"
                      value={record.unitCost || 0}
                      onChange={(e) => updateEconomicRecord(record.id, { unitCost: e.target.value })}
                      style={{ width: "100%", padding: 4, textAlign: "right" }}
                    />
                  </td>
                  <td style={{ padding: 8, textAlign: "right", fontWeight: 600 }}>
                    {formatNumber(recordPlotValue(record))}
                  </td>
                  <td style={{ padding: 8, textAlign: "center" }}>
                    <button
                      onClick={() => deleteEconomicRecord(record.id)}
                      style={{ background: "none", border: "none", color: "var(--fe-critical)", cursor: "pointer" }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Save Button */}
      <button onClick={() => saveAllEconomicRecords(plotId)} style={{
        padding: "12px 16px",
        borderRadius: "8px",
        background: "var(--fe-teal-900)",
        color: "var(--fe-white)",
        border: "none",
        fontWeight: 600,
        fontSize: "13px",
        cursor: "pointer",
        width: "100%",
      }}>
        Save economic records — Plot {plotId}
      </button>

      {autoSaveTime && (
        <div style={{ fontSize: "11px", color: "var(--fe-grey-500)", textAlign: "center" }}>
          Saved {autoSaveTime}
        </div>
      )}
    </div>
  );
}
