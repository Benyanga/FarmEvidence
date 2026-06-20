import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useSessionStore } from "../../store/sessionStore";
import { useDataStore } from "../../store/dataStore";
import { ChevronRight, Beaker, Leaf, Plus } from "lucide-react";
import { SetupBreadcrumb } from "../../components/setup/SetupBreadcrumb";
import { ScreenTopbar } from "../shared/ScreenTopbar";

const TREATMENT_COLORS = {
  CA:  { border: "var(--fe-ca-bg)", bg: "var(--fe-ca-bg)", text: "var(--fe-teal-900)" },
  CF:  { border: "var(--fe-amber-400)", bg: "var(--fe-warning-50)", text: "var(--fe-amber-700)" },
  "CA+": { border: "var(--fe-green-100)", bg: "var(--fe-green-100)", text: "var(--fe-green-900)" },
  "CF+": { border: "var(--fe-t3-bg)", bg: "var(--fe-t3-bg)", text: "var(--fe-t3-text)" },
};

const STATUS_CONFIG = {
  COMPUTED:  { border: "var(--fe-green-500)", bg: "var(--fe-green-100)", pillBg: "var(--fe-green-100)", pillText: "var(--fe-green-900)" },
  DATA_ENTRY: { border: "var(--fe-amber-400)", bg: "var(--fe-warning-50)", pillBg: "var(--fe-amber-100)", pillText: "var(--fe-amber-700)" },
  CONFIGURED: { border: "var(--fe-teal-900)", bg: "var(--fe-ca-bg)", pillBg: "var(--fe-ca-bg)", pillText: "var(--fe-teal-900)" },
  default:   { border: "var(--fe-grey-200)", bg: "var(--fe-white)",   pillBg: "var(--fe-grey-100)", pillText: "var(--fe-grey-500)" },
};

export function FarmerSetupFarmList({ year, season }) {
  const navigate = useNavigate();
  const mode = useSessionStore((s) => s.mode);
  const farmSeasonRecords = useDataStore((s) => s.farmSeasonRecords);
  const farms = Object.values(farmSeasonRecords).filter((record) => {
    if (String(record.year) !== String(year) || record.season !== season) return false;
    return mode === "RESEARCH"
      ? Array.isArray(record.treatments) && record.treatments.length > 0
      : Boolean(record.farmingSystem);
  });

  const pageTitle = `Season ${season} ${year}`;
  const subtitle = mode === "RESEARCH" ? "Research Mode — trials this season" : "Farmer Mode — farms this season";
  const listTitle = mode === "RESEARCH"
    ? `Trials in season ${season} ${year}`
    : `Farms in season ${season} ${year}`;
  const buttonText = mode === "RESEARCH" ? "Create new trial" : "Create new farm";
  const emptyTitle = mode === "RESEARCH" ? "No trials yet this season" : "No farms yet this season";
  const emptyHelper = mode === "RESEARCH" ? "Create a trial to begin collecting data" : "Create a farm to begin recording season data";
  const EmptyIcon = mode === "RESEARCH" ? Beaker : Leaf;

  const formatStatus = (r) => r.status === "COMPUTED" ? "Computed" : r.status === "DATA_ENTRY" ? "Data entry" : "Setup";
  const getStatusConfig = (r) => STATUS_CONFIG[r.status] || STATUS_CONFIG.default;

  const buildMetaLine = (r) => {
    const crop = r.cropType || "Crop";
    if (mode === "RESEARCH") {
      return `${crop}  ·  ${r.plot_length_m ?? r.plotLength ?? 0}×${r.plot_width_m ?? r.plotWidth ?? 0}m`;
    }
    const area = r.plot_m2 != null ? `${r.plot_m2} m²` : "—";
    return `${crop}  ·  ${area}`;
  };

  const buildBadges = (r) => {
    if (mode === "RESEARCH") return Array.isArray(r.treatments) && r.treatments.length > 0 ? r.treatments : [];
    return r.farmingSystem ? [r.farmingSystem] : [];
  };

  const headerStatus = `${farms.length} ${mode === "RESEARCH" ? "trial" : "farm"}${farms.length !== 1 ? "s" : ""} configured`;

  return (
    <div className="setup-page animate-fade-slide">
      <SetupBreadcrumb
        items={[
          { label: "Years", to: "/setup" },
          { label: year, to: `/setup/${year}` },
          { label: `Season ${season} ${year}` },
        ]}
      />
      <ScreenTopbar
        superText="Setup"
        title={pageTitle}
        meta={subtitle}
        mode={mode}
        status={headerStatus}
      />

      <div className="create-panel">
        <span className="create-panel__title">{listTitle}</span>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => navigate(`/setup/${year}/${season}/${mode === "RESEARCH" ? "new-trial" : "new-farm"}`)}
        >
          <Plus size={14} />
          {buttonText}
        </button>
      </div>

      {farms.length === 0 ? (
        <div className="empty-state-card">
          <EmptyIcon className="empty-state-card__icon" size={32} />
          <p className="empty-state-card__title">{emptyTitle}</p>
          <p className="empty-state-card__copy">{emptyHelper}</p>
        </div>
      ) : (
        <div className="farm-list-grid">
          {farms.map((record) => {
            const sc = getStatusConfig(record);
            const badges = buildBadges(record);
            return (
              <button
                key={record.id}
                type="button"
                onClick={() => navigate(`/data-entry/${year}/${season}/${record.id}`)}
                style={{
                  width: "100%",
                  padding: "18px 20px",
                  borderRadius: "14px",
                  border: "1px solid var(--fe-grey-200)",
                  borderLeft: "4px solid",
                  borderLeftColor: sc.border,
                  background: sc.bg,
                  boxShadow: "var(--fe-shadow-surface)",
                  color: "var(--fe-grey-900)",
                  textAlign: "left",
                  cursor: "pointer",
                  transition: "transform 0.15s ease, box-shadow 0.15s ease",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "16px",
                }}
              >
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "8px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    {badges.map((treatment) => {
                      const tc = TREATMENT_COLORS[treatment] || { border: "var(--fe-grey-200)", bg: "var(--fe-white)", text: "var(--fe-grey-900)" };
                      return (
                        <span key={treatment} style={{ display: "inline-flex", alignItems: "center", padding: "3px 8px", borderRadius: "999px", fontSize: "10px", fontWeight: 700, background: tc.bg, color: tc.text, border: `1px solid ${tc.border}` }}>{treatment}</span>
                      );
                    })}
                  </div>
                  <span style={{ fontSize: "14px", fontWeight: 600, color: "var(--fe-grey-900)" }}>
                    {mode === "RESEARCH" ? record.site_name || record.siteName || record.farmName : record.farmName}
                  </span>
                  <span style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0 12px", fontSize: "12px", color: "var(--fe-grey-500)" }}>
                    <span>{buildMetaLine(record).split("  ·  ")[0] || ""}</span>
                    <span style={{ color: buildMetaLine(record).split("  ·  ")[1]?.includes("—") ? "var(--fe-grey-400)" : "var(--fe-grey-500)" }}>{buildMetaLine(record).split("  ·  ")[1] || ""}</span>
                    <span>{buildMetaLine(record).split("  ·  ")[2] || ""}</span>
                  </span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <span style={{ display: "inline-flex", alignItems: "center", padding: "3px 10px", borderRadius: "999px", fontSize: "10px", fontWeight: 700, textTransform: "uppercase", background: sc.pillBg, color: sc.pillText }}>{formatStatus(record)}</span>
                  <ChevronRight size={16} style={{ color: "var(--fe-grey-400)" }} />
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
