# FarmEvidence

FarmEvidence is a web application for farm-level and plot-level decision support, data entry, and cost-benefit analysis. It is built with React, Vite, Zustand, Node/Express, and MongoDB-compatible persistence.

## What this app does

- Supports two main workflows:
  - **Farmer mode** — farmer-centric recording of farm season details, agronomic observations, input costs, yield, and revenue for individual farms and plots.
  - **Research mode** — trial/plot-level setup, treatment recording, plot measurements, and experimental analysis for research trials.
- Captures farm season metadata, input costs, labour, agronomic measures, and harvest yield.
- Computes revenue and financial metrics for farmer decision-making and cost-benefit analysis (CBA).
- Persists data locally and syncs with remote APIs for farm seasons, agronomic records, revenue, and economic records.
- Provides dashboards, data entry navigation, and analysis screens to compare results across seasons and trials.

## Core workflow structure

### 1. App shell and routing

- `src/main.jsx` boots the React app with `BrowserRouter` and optional Clerk auth.
- `src/App.jsx` configures application routes and lazy-loads analysis pages such as statistics, explainability, and alerts.
- Analysis sections are rendered through dedicated page components under `src/pages/analysis/`.

### 2. Farmer mode workflow

Farmer mode is optimized for managing farm season data and generating farmer-friendly revenue summaries.

Key screens and components:
- `src/pages/Dashboard.jsx` — entry point for farmer records and navigation.
- `src/pages/DataEntry.jsx` — main workspace for farm season data entry.
- `src/components/data-entry/costs/EconomicRecordsPanel.jsx` — input UI for economic records and productivity/sales data.
- `src/components/plot-recording/AgronomicRecordsAccordion.jsx` — agronomic measurement entry for yields, weed pressure, and other field observations.
- `src/components/data-entry/CbaSummary.jsx` — displays financial summaries and CBA insights.

Farmer mode workflow:
1. Choose a year and season from `DataEntrySeasonSelector`.
2. Select a farm record from `DataEntryFarmList`.
3. Enter farm-level costs, labour, yield, and selling price in the economic accordion.
4. Enter agronomic harvest records in the agronomic accordion.
5. Save revenue, agronomic records, and the farm season record through remote persistence hooks.

### 3. Research mode workflow

Research mode supports structured trial and plot-level data entry.

Key screens and components:
- `src/pages/Setup.jsx` — trial setup and plot selection.
- `src/pages/DataEntry.jsx` — plot-level and trial data entry workspace.
- `src/components/data-entry/revenue/RevenueEntry.jsx` — research revenue entry UI.
- `src/components/setup/ResearchTrialForm.jsx` — trial definition and experiment setup.

Research mode workflow:
1. Set up a trial with treatment groups, replications, and plot layout.
2. Enter plot-specific agronomic and economic data.
3. Save plot records and compute trial-level insights.
4. View analysis results on the research dashboards.

### 4. Data persistence and stores

The app uses Zustand stores and local IndexedDB persistence with optional remote sync.

- `src/store/dataStore.js`
  - Central store for setup, farms, years, seasons, `farmSeasonRecords`, economic records, agronomic records, revenue records, and remote saving methods.
  - Handles payload construction and mapping for API integration.
- `src/store/plotRecordingStore.js`
  - Manages current plot context, economic records, revenue state, agronomic observations, gate checklist state, and UI accordion state.

### 5. Remote API integration

- `src/services/api.js` contains the HTTP client and endpoints used to save/load remote data.
- `src/store/dataStore.js` methods include:
  - `saveFarmSeasonRecordRemote`
  - `saveRevenueRemote`
  - `saveAgronomicRemote`
  - `loadEconomicRecords`
  - `addEconomicRecordRemote`
  - `updateEconomicRecordRemote`
  - `deleteEconomicRecordRemote`

### 6. Build, test, and development

- Run the frontend locally with Vite from `farm-evidence`:
  - `npm install`
  - `npm run dev`
- Build the app for production:
  - `npm run build`
- Run tests with Vitest:
  - `npm test`

## Project structure

- `farm-evidence/src/`
  - `components/` — reusable UI widgets and data-entry controls.
  - `pages/` — application screens, routers, and workspace pages.
  - `store/` — Zustand state stores and persistence helpers.
  - `services/` — API wrappers for backend endpoints.
  - `utils/` — formatting helpers and utilities.
- `farm-evidence/server/`
  - Express route handlers for farm setup, seasons, and trial APIs.
  - `server/index.js` registers API routes and server middleware.
- `farm-evidence/public/` — static assets and PWA manifest.

## Why FarmEvidence exists

FarmEvidence is designed to help field schools, agronomists, and farm advisers:
- collect consistent farm and trial data,
- compare costs versus revenue,
- support farmer decision-making with a simple workflow,
- and enable both farmer-focused and research-focused data entry in the same application.

## Notes

- Farmer mode is focused on individual farms and harvest-based revenue.
- Research mode is focused on trials, plots, and experiment comparisons.
- Local session data is preserved and can be synchronized with remote services when available.

## Getting started

1. Clone the repo.
2. Open `farm-evidence` and install dependencies.
3. Start the app and the API server.
4. Use the sidebar to switch between Setup, Data Entry, and Analysis.

---

For more detail on component responsibilities and workflow paths, inspect `src/App.jsx`, `src/pages/Dashboard.jsx`, and `src/store/dataStore.js`.
