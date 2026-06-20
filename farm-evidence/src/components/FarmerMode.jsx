// FarmerMode.jsx
// Main entry for Farmer Mode UI
// Clean, seasonal farm profitability tracker — NO system/treatment logic, NO RCBD, NO stats, NO forbidden fields

import React from "react";
import FarmerSetup from "./farmer-mode/FarmerSetup";
import SeasonList from "./farmer-mode/SeasonList";
import SeasonEntry from "./farmer-mode/SeasonEntry";
import ResultsDashboard from "./farmer-mode/ResultsDashboard";

// TODO: Add routing and state logic for Farmer Mode

const FarmerMode = () => {
  // Placeholder: will add routing and state
  return (
    <div className="farmer-mode-root">
      {/* Render setup, season list, entry, or results as needed */}
      <FarmerSetup />
      {/* <SeasonList /> */}
      {/* <SeasonEntry /> */}
      {/* <ResultsDashboard /> */}
    </div>
  );
};

export default FarmerMode;
