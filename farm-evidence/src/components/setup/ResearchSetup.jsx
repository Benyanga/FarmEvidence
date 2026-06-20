import { useMemo } from "react";
import { useDataStore } from "../../store/dataStore";
import { RCBDMatrix } from "./RCBDMatrix";
import { RCBDTrialConfigPanel } from "./RCBDTrialConfigPanel";
import { RCBDPlotEntryPanel } from "./RCBDPlotEntryPanel";

const CROP_OPTIONS = ["Maize", "Beans", "Wheat", "Sorghum", "Other"];
const TREATMENTS = ["CA", "CF", "CA+", "CF+"];

export function ResearchSetup() {
  return (
    <div className="space-y-8">
      <RCBDTrialConfigPanel />
      <RCBDPlotEntryPanel />
    </div>
  );
}

