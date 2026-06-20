import { useState, useMemo, useCallback } from "react";
import { useDataStore } from "../../../store/dataStore";
import { useSessionStore } from "../../../store/sessionStore";

const OPERATIONS = [
  { code: "LP", name: "Land preparation" },
  { code: "PL", name: "Planting" },
  { code: "WD", name: "Weeding" },
  { code: "HV", name: "Harvesting" },
  { code: "RM", name: "Residue management" },
];

const TIME_UNITS = ["seconds", "minutes", "hours", "days"];

const inputBasics = { border: "1px solid var(--fe-grey-200)", padding: "0 12px", fontSize: "14px", color: "var(--fe-grey-900)", background: "var(--fe-white)", outline: "none" };
const disabledBasics = { ...inputBasics, background: "var(--fe-grey-050)", border: "1px solid var(--fe-grey-200)", color: "var(--fe-grey-400)" };

function toDecimalDays(time, unit, workers = 1) {
  if (!time || time <= 0) return 0;
  switch (unit) {
    case "seconds": return (time / (8 * 3600)) * workers;
    case "minutes": return (time / (8 * 60)) * workers;
    case "hours":   return (time / 8) * workers;
    case "days":
    default:        return time * workers;
  }
}

function fmtRWF(amount) {
  if (amount == null || isNaN(amount)) return "—";
  return `RWF ${Math.round(amount).toLocaleString()}`;
}

export function LaborForm() {
  const activeFarm = useSessionStore((s) => s.activeFarm);
  const seasonKey = activeFarm ? `${activeFarm.year}-${activeFarm.season}` : "season-1";
  const season = useDataStore((s) => s.seasons[seasonKey] ?? s.seasons["season-1"]);
  const updateLabor = useDataStore((s) => s.updateLabor);

  const [operations, setOperations] = useState(() =>
    OPERATIONS.map((op) => {
      const existing = season?.laborOps?.operations?.find((o) => o.code === op.code);
      return {
        code: op.code,
        time: existing?.time ?? "",
        unit: existing?.unit ?? "hours",
        workers: existing?.workers ?? 1,
        wageRate: existing?.wageRate ?? "",
      };
    })
  );

  const ops = useMemo(() => operations.map((op) => {
    const time = parseFloat(op.time) || 0;
    const wageRate = parseFloat(op.wageRate) || 0;
    const dd = toDecimalDays(time, op.unit, op.workers);
    return { ...op, decimalDays: dd, wageRate, cost: dd * wageRate };
  }), [operations]);

  const totals = useMemo(() => ({
    decimalDays: ops.reduce((s, o) => s + o.decimalDays, 0),
    cost:        ops.reduce((s, o) => s + o.cost, 0),
  }), [ops]);

  const changeOp = useCallback((idx, field, value) => {
    setOperations((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: value };
      return next;
    });
  }, []);

  useMemo(() => {
    updateLabor(seasonKey, {
      operations: ops.map(({ code, time, unit, workers, wageRate }) => ({ code, time, unit, workers, wageRate })),
    });
  }, [ops, updateLabor]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {/* Header: wage rate + derived rates */}
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-end", gap: "16px" }}>
        <div style={{ flex: "1 1 280px", display: "grid", gap: "4px" }}>
          <span style={{ fontSize: "11px", fontWeight: 600, color: "var(--fe-grey-400)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Labor operations</span>
          <span style={{ fontSize: "13px", color: "var(--fe-grey-500)" }}>Enter operation time and workers only; wage rates are set per record entry.</span>
        </div>
      </div>

      {/* Operations table — 5 rows, inline card-row style */}
      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
        {ops.map((op, idx) => {
          const raw = operations[idx];
          return (
            <div key={op.code} style={{ display: "grid", alignItems: "center", gap: "8px", gridTemplateColumns: "100px 1fr 80px 130px 130px", padding: "12px 14px", borderRadius: "10px", border: "1px solid var(--fe-grey-200)", background: "var(--fe-white)" }}>
              <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--fe-grey-900)" }}>{op.code}</span>

              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <input
                  type="number"
                  min="0"
                  step="any"
                  style={{ ...inputBasics, flex: 1, minHeight: "36px", padding: "0 8px", fontSize: "13px" }}
                  value={raw.time === "" ? "" : raw.time}
                  onChange={(e) => changeOp(idx, "time", e.target.value)}
                />
                <select
                  style={{ ...inputBasics, width: "85px", minHeight: "36px", padding: "0 6px", fontSize: "12px" }}
                  value={raw.unit}
                  onChange={(e) => changeOp(idx, "unit", e.target.value)}
                >
                  {TIME_UNITS.map((u) => (
                    <option key={u} value={u}>{u}</option>
                  ))}
                </select>
              </div>

              <input
                type="number"
                min="1"
                step="1"
                style={{ ...inputBasics, minHeight: "36px", padding: "0 8px", fontSize: "13px", textAlign: "center" }}
                value={raw.workers}
                onChange={(e) => changeOp(idx, "workers", Math.max(1, parseInt(e.target.value) || 1))}
              />

              <input
                type="number"
                min="0"
                step="any"
                style={{ ...inputBasics, minHeight: "36px", padding: "0 8px", fontSize: "13px", textAlign: "center" }}
                value={raw.wageRate === "" ? "" : raw.wageRate}
                onChange={(e) => changeOp(idx, "wageRate", e.target.value)}
                placeholder="Wage"
              />

              <span style={{ textAlign: "right", fontSize: "13px", color: "var(--fe-grey-500)", fontFamily: "Menlo,monospace" }}>
                {raw.time === "" || parseFloat(raw.time) <= 0 ? "—" : op.decimalDays.toFixed(4) + " d"}
              </span>

              <span style={{ textAlign: "right", fontSize: "13px", fontWeight: 600, color: "var(--fe-grey-900)", fontFamily: "Menlo,monospace" }}>
                {raw.time === "" || parseFloat(raw.time) <= 0 || raw.wageRate === "" ? "—" : fmtRWF(op.cost)}
              </span>
            </div>
          );
        })}
      </div>

      {/* Total row */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 14px", borderTop: "2px solid var(--fe-grey-200)", fontSize: "13px" }}>
        <span style={{ fontWeight: 600, color: "var(--fe-grey-900)" }}>Total labour</span>
        <span style={{ display: "flex", gap: "24px" }}>
          <span style={{ color: "var(--fe-grey-500)" }}>{totals.decimalDays.toFixed(4)} d</span>
          <span style={{ fontWeight: 700, color: "var(--fe-grey-900)" }}>{totals.cost > 0 ? fmtRWF(totals.cost) : "—"}</span>
        </span>
      </div>
    </div>
  );
}
