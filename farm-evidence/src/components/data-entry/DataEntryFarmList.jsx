import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useDataStore } from "../../store/dataStore";
import { useSessionStore } from "../../store/sessionStore";
import { ChevronRight } from "lucide-react";
import HideMechanism from "../shared/HideMechanism";
import { ScreenTopbar } from "../shared/ScreenTopbar";

const STATUS_CONFIG = {
  "Both records complete": { border: "var(--fe-green-700)", bg: "var(--fe-green-100)", pillBg: "var(--fe-green-050)", pillText: "var(--fe-green-900)" },
  "Economic: complete":   { border: "var(--fe-grey-900)", bg: "var(--fe-grey-050)", pillBg: "var(--fe-grey-100)", pillText: "var(--fe-grey-900)" },
  "Agronomic: partial":   { border: "var(--fe-amber-700)", bg: "var(--fe-amber-100)", pillBg: "var(--fe-amber-050)", pillText: "var(--fe-amber-700)" },
  "No data entered":      { border: "var(--fe-border-default)", bg: "var(--fe-white)",   pillBg: "var(--fe-grey-050)",  pillText: "var(--fe-text-muted)" },
  default:                { border: "var(--fe-border-default)", bg: "var(--fe-white)",   pillBg: "var(--fe-grey-050)",  pillText: "var(--fe-text-muted)" },
};

export function DataEntryFarmList({ year, season }) {
  const navigate = useNavigate();
  const farmSeasonRecords = useDataStore((s) => s.farmSeasonRecords);
  const economicRecords = useDataStore((s) => s.economicRecords);
  const agronomicRecords = useDataStore((s) => s.agronomicRecords);

  const mode = useSessionStore((s) => s.mode);
  const seasonRecords = useMemo(
    () => Object.values(farmSeasonRecords).filter((record) =>
      String(record.year) === String(year) &&
      record.season === season &&
      (mode === "RESEARCH" ? Array.isArray(record.randomisation_layout) : !Array.isArray(record.randomisation_layout))
    ),
    [farmSeasonRecords, year, season, mode]
  );

  const getDataStatus = (recordId) => {
    const hasEconomic = economicRecords[recordId] && Object.keys(economicRecords[recordId]).length > 0;
    const hasAgronomic = agronomicRecords[recordId] && Object.keys(agronomicRecords[recordId]).length > 0;
    if (hasEconomic && hasAgronomic) return "Both records complete";
    if (hasEconomic) return "Economic: complete";
    if (hasAgronomic) return "Agronomic: partial";
    return "No data entered";
  };

  if (seasonRecords.length === 0) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        <div>
          <h1 style={{ fontSize: "22px", fontWeight: 600, fontFamily: "var(--font-display)", color: "var(--fe-grey-900)" }}>Season {season} {year}</h1>
        </div>
        <div style={{ borderRadius: "14px", border: "1px dashed var(--fe-border-default)", background: "var(--fe-grey-050)", padding: "32px", textAlign: "center" }}>
          <p style={{ fontSize: "15px", fontWeight: 600, color: "var(--fe-grey-900)" }}>No farms configured for this season</p>
          <HideMechanism id={`farmlist-no-farms-${year}-${season}`} content="Go to Setup to add farms first" />
          <button type="button" style={{ marginTop: "12px", padding: "10px 18px", borderRadius: "10px", background: "var(--fe-grey-900)", color: "var(--fe-white)", fontSize: "14px", cursor: "pointer" }} onClick={() => navigate("/setup")}>Open Setup</button>
        </div>
      </div>
    );
  }

  const setActiveFarm = useSessionStore((s) => s.setActiveFarm);
  const seasonCountLabel = `${seasonRecords.length} farm${seasonRecords.length !== 1 ? "s" : ""} configured`;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <ScreenTopbar
        superText="Data entry"
        title={`Season ${season} ${year}`}
        meta={`${seasonRecords.length} farm${seasonRecords.length !== 1 ? "s" : ""} ready for entry`}
        mode={mode}
        status={seasonCountLabel}
      />
      <div style={{ display: "grid", gap: "12px" }}>
          {seasonRecords.map((record) => {
            const statusLabel = getDataStatus(record.id);
            const sc = STATUS_CONFIG[statusLabel] || STATUS_CONFIG.default;
          return (
            <button
              key={record.id}
              type="button"
              onClick={() => {
                setActiveFarm({
                  recordId: record.id,
                  farmId: record.farmId,
                  farmName: record.farmName,
                  year,
                  season,
                  treatment: record.farmingSystem || record.cropType || null,
                  replications: record.replications ?? null,
                });
                navigate(`/data-entry/${year}/${season}/${record.id}`);
              }}
              style={{ width: "100%", padding: "16px 20px", borderRadius: "14px", border: "1px solid var(--fe-border-default)", borderLeft: "4px solid", borderLeftColor: sc.border, background: sc.bg, boxShadow: "var(--fe-shadow-surface)", cursor: "pointer", transition: "transform 0.15s ease, box-shadow 0.15s ease", textAlign: "left", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px" }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 6px 16px var(--fe-teal-900-10)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "var(--fe-shadow-surface)"; }}
            >
              <div>
                <span style={{ fontSize: "15px", fontWeight: 600, color: "var(--fe-grey-900)" }}>
                  {mode === "RESEARCH" ? (record.site_name || record.siteName || record.farmName) : record.farmName}
                </span>
                <span style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0 16px", fontSize: "12px", color: "var(--fe-text-muted)", marginTop: "6px" }}>
                  <span>{record.cropType || "—"}</span>
                  <span>{record.farmingSystem || "—"}</span>
                  <span>{record.plot_m2 != null ? `${record.plot_m2} m²` : "—"}</span>
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ display: "inline-flex", padding: "3px 10px", borderRadius: "999px", fontSize: "10px", fontWeight: 700, textTransform: "uppercase", background: sc.pillBg, color: sc.pillText }}>{statusLabel}</span>
                <ChevronRight size={15} style={{ color: "var(--fe-text-muted)" }} />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
