import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useDataStore } from "../../store/dataStore";
import { useSessionStore } from "../../store/sessionStore";
import { useEffect } from "react";
import HideMechanism from "../shared/HideMechanism";
import { ScreenTopbar } from "../shared/ScreenTopbar";

// CROP_OPTIONS and SYSTEM_OPTIONS removed (unused)

const SEASON_DETAILS = {
  A: { range: "September to January" },
  B: { range: "February to June" },
  C: { range: "July to August" },
};

export function DataEntrySeasonSelector() {
  const navigate = useNavigate();
  const clearActiveFarm = useSessionStore((s) => s.clearActiveFarm);
  const activeFarm = useSessionStore((s) => s.activeFarm);
  const farmSeasonRecords = useDataStore((s) => s.farmSeasonRecords);

  useEffect(() => {
    if (activeFarm) clearActiveFarm();
  }, [activeFarm, clearActiveFarm]);

  const seasonSummary = useMemo(() => {
    const summary = {};
    Object.values(farmSeasonRecords).forEach((record) => {
      const key = `${record.year}-${record.season}`;
      if (!summary[key]) summary[key] = { year: record.year, season: record.season, farmCount: 0, withData: 0 };
      summary[key].farmCount += 1;
      const state = useDataStore.getState();
      const hasEconomic = !!state.economicRecords[record.id];
      const hasAgronomic = !!state.agronomicRecords[record.id];
      if (hasEconomic || hasAgronomic) summary[key].withData += 1;
    });
    return Object.values(summary).sort((a, b) => b.year - a.year || a.season.localeCompare(b.season));
  }, [farmSeasonRecords]);

  const configuredSeasons = seasonSummary.length;
  const summaryPill = configuredSeasons > 0 ? `${configuredSeasons} seasons configured` : "No seasons configured";
  const mode = useSessionStore((s) => s.mode);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <ScreenTopbar
        superText="Data entry"
        title="Select a season"
        meta="Choose the season to record economic and agronomic data"
        mode={mode}
        status={summaryPill}
      />
      {seasonSummary.length === 0 ? (
        <div style={{ borderRadius: "14px", border: "1px dashed var(--fe-grey-300)", background: "var(--fe-grey-050)", padding: "32px", textAlign: "center" }}>
          <p style={{ fontSize: "15px", fontWeight: 600, color: "var(--fe-grey-900)" }}>No seasons configured yet</p>
          <HideMechanism id="dataentry-no-seasons" content="Go to Setup to add years and farms first" />
          <button type="button" style={{ marginTop: "12px", padding: "10px 18px", borderRadius: "10px", background: "var(--fe-teal-900)", color: "var(--fe-white)", fontSize: "14px", cursor: "pointer" }} onClick={() => navigate("/setup")}>Open Setup</button>
        </div>
      ) : (
        <div style={{ display: "grid", gap: "8px" }}>
          {seasonSummary.map((item) => {
            const details = SEASON_DETAILS[item.season];
            const hasNoFarms = item.farmCount === 0;
            const dataFraction = item.farmCount > 0 ? Math.round((item.withData / item.farmCount) * 100) : 0;
            return (
              <button
                key={`${item.year}-${item.season}`}
                type="button"
                onClick={() => !hasNoFarms && navigate(`/data-entry/${item.year}/${item.season}`)}
                disabled={hasNoFarms}
                style={{ width: "100%", textAlign: "left", padding: "16px 20px", borderRadius: "14px", border: "1px solid var(--fe-grey-200)", borderLeft: "4px solid", borderLeftColor: item.season === "A" ? "var(--fe-green-500)" : item.season === "B" ? "var(--fe-amber-400)" : "var(--fe-grey-400)", background: hasNoFarms ? "var(--fe-grey-050)" : "var(--fe-white)", cursor: hasNoFarms ? "not-allowed" : "pointer", opacity: hasNoFarms ? 0.6 : 1 }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div>
                    <span style={{ fontSize: "16px", fontWeight: 600, color: "var(--fe-grey-900)" }}>Season {item.season} {item.year}</span>
                    <span style={{ fontSize: "12px", color: "var(--fe-grey-500)", display: "block", marginTop: "2px" }}>{details.range}</span>
                    <span style={{ fontSize: "12px", color: "var(--fe-grey-500)", display: "block", marginTop: "4px" }}>{item.farmCount} farm{item.farmCount !== 1 ? "s" : ""} configured  ·  {item.withData} with data</span>
                    {item.farmCount > 0 ? <div style={{ width: "100%", height: "4px", borderRadius: "2px", background: "var(--fe-grey-200)", marginTop: "8px" }}><div style={{ height: "100%", borderRadius: "2px", background: "var(--fe-teal-900)", width: `${dataFraction}%`, transition: "width 0.4s ease" }} /></div> : null}
                  </div>
                  <span style={{ display: "inline-flex", alignItems: "center", padding: "3px 10px", borderRadius: "999px", fontSize: "10px", fontWeight: 700, textTransform: "uppercase", background: hasNoFarms ? "var(--fe-grey-100)" : "var(--fe-ca-bg)", color: hasNoFarms ? "var(--fe-grey-500)" : "var(--fe-teal-900)" }}>{hasNoFarms ? "Not configured" : `${dataFraction}% complete`}</span>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
