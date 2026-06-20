import { useMemo } from "react";
import { useDataStore } from "../../store/dataStore";

export function RCBDMatrix() {
  const setup = useDataStore((s) => s.setup);
  const updateSetup = useDataStore((s) => s.updateSetup);
  const treatments = setup.treatments ?? [];
  const reps = Math.max(0, Number(setup.replications ?? 0));
  const matrix = setup.rcbdMatrix ?? [];

  const rows = useMemo(
    () => Array.from({ length: reps }, (_, rowIndex) =>
      Array.from({ length: treatments.length }, (_, colIndex) => matrix[rowIndex]?.[colIndex] ?? "")
    ),
    [reps, treatments.length, matrix]
  );

  const missingCells = rows.reduce((sum, row) => sum + row.filter((cell) => !cell).length, 0);
  const invalidRows = rows.map((row) =>
    treatments.some((t) => row.filter((cell) => cell === t).length !== 1)
  );
  const updateCell = (rowIndex, colIndex, value) => {
    const next = rows.map((row, r) => row.map((cell, c) => (r === rowIndex && c === colIndex ? value : cell)));
    updateSetup({ rcbdMatrix: next });
  };

  if (!reps || treatments.length < 2) {
    return (
      <div style={{ borderRadius: "14px", border: "1px solid var(--fe-grey-200)", borderLeft: "4px solid var(--fe-amber-400)", background: "var(--fe-warning-50)", padding: "14px 20px", fontSize: "13px", color: "var(--fe-amber-700)" }}>
        RCBD matrix requires at least 2 replications and 2 selected treatments
      </div>
    );
  }

  return (
    <div id="section-rcbd" style={{ borderRadius: "14px", border: "1px solid var(--fe-grey-200)", boxShadow: "var(--fe-shadow-surface)", background: "var(--fe-white)", overflow: "hidden" }}>
      <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--fe-grey-100)", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "8px" }}>
        <div>
          <span style={{ fontSize: "14px", fontWeight: 600, color: "var(--fe-grey-900)", marginBottom: "4px", display: "block" }}>RCBD replication matrix</span>
          <span style={{ fontSize: "12px", color: "var(--fe-grey-500)" }}>Select one treatment per cell</span>
        </div>
        <div style={{ display: "inline-flex", padding: "4px 10px", borderRadius: "999px", fontSize: "11px", fontWeight: 600, background: "var(--fe-grey-050)", color: missingCells === 0 ? "var(--fe-green-900)" : "var(--fe-amber-700)", border: `1px solid ${missingCells === 0 ? "var(--fe-green-100)" : "var(--fe-amber-100)"}` }}>{missingCells === 0 ? "All cells filled" : `${missingCells} cells pending`}</div>
      </div>
      <div style={{ padding: "16px 20px", overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
          <thead>
            <tr>
              <th style={{ padding: "8px 12px", textAlign: "left", fontSize: "11px", fontWeight: 600, color: "var(--fe-grey-400)", textTransform: "uppercase", letterSpacing: "0.06em", border: "1px solid var(--fe-grey-200)" }}>Replication</th>
              {treatments.map((t) => (
                <th key={t} style={{ padding: "8px 12px", textAlign: "left", fontSize: "11px", fontWeight: 600, color: "var(--fe-grey-400)", textTransform: "uppercase", letterSpacing: "0.06em", border: "1px solid var(--fe-grey-200)" }}>{t}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIndex) => (
              <tr key={rowIndex} style={{ background: invalidRows[rowIndex] ? "var(--fe-error-bg)" : rowIndex % 2 === 0 ? "var(--fe-white)" : "var(--fe-grey-050)" }}>
                <td style={{ padding: "8px 12px", fontSize: "13px", fontWeight: 600, color: "var(--fe-grey-900)", border: "1px solid var(--fe-grey-200)" }}>Replication {rowIndex + 1}</td>
                {row.map((cell, colIndex) => (
                  <td key={colIndex} style={{ padding: "4px", border: "1px solid var(--fe-grey-200)" }}>
                    <select
                      style={{ width: "100%", padding: "6px 10px", borderRadius: "8px", border: "1px solid var(--fe-grey-200)", fontSize: "13px", color: "var(--fe-grey-900)", background: cell ? "var(--fe-ca-bg)" : "var(--fe-white)", outline: "none" }}
                      value={cell}
                      onChange={(e) => updateCell(rowIndex, colIndex, e.target.value)}
                    >
                      <option value="">—</option>
                      {treatments.map((treatment) => (
                        <option key={treatment} value={treatment}>{treatment}</option>
                      ))}
                    </select>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {invalidRows.some(Boolean) ? (
        <div style={{ padding: "10px 20px", borderTop: "1px solid var(--fe-grey-200)", fontSize: "12px", color: "var(--fe-profit-neg)" }}>Set all treatments — each must appear once per replication</div>
      ) : (
        <div style={{ padding: "10px 20px", borderTop: "1px solid var(--fe-grey-200)", fontSize: "12px", color: "var(--fe-green-900)" }}>All replications have each treatment once</div>
      )}
    </div>
  );
}
