import { useRef, useEffect } from "react";
import { useSessionStore } from "../../store/sessionStore";
import { useDataStore } from "../../store/dataStore";
import { ScreenTopbar } from "../../components/shared/ScreenTopbar";
import { ReportSection } from "../../components/pdf/ReportSection";
import { ReportBuilder } from "../../components/pdf/ReportBuilder";

export function PdfScreen() {
  const reportRef = useRef(null);
  const activeFarm = useSessionStore((s) => s.activeFarm);
  const setActiveFarm = useSessionStore((s) => s.setActiveFarm);
  const farmSeasonRecords = useDataStore((s) => s.farmSeasonRecords);
  const mode = useSessionStore((s) => s.mode);
  
  // Auto-select first available trial if none selected
  useEffect(() => {
    if (!activeFarm && farmSeasonRecords) {
      const firstRecord = Object.values(farmSeasonRecords)[0];
      if (firstRecord) {
        setActiveFarm({
          recordId: firstRecord.id,
          year: firstRecord.year,
          season: firstRecord.season,
          farmName: firstRecord.farm_name || 'Farm'
        });
      }
    }
  }, [activeFarm, farmSeasonRecords, setActiveFarm]);
  
  const farmLabel = activeFarm?.farmName || 'Selected farm';
  const avatarLabel = farmLabel.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase();
  const metaLine = activeFarm ? `Season ${activeFarm.season} ${activeFarm.year} · ${farmLabel} · PDF Reports` : '';

  return (
    <div className="pdf-report" ref={reportRef} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {activeFarm && (
        <ScreenTopbar
          superText="Analysis"
          title="PDF Reports"
          meta={metaLine}
          activeFarmLabel={farmLabel}
          mode={mode}
          status="Reports available"
          avatarLabel={avatarLabel}
        />
      )}
      <ReportSection title="Season Summary">
        <p className="body-sm">Cover page, phase summary, indicators, trends, and recommendations.</p>
      </ReportSection>
      <ReportBuilder targetRef={reportRef} />
    </div>
  );
}
