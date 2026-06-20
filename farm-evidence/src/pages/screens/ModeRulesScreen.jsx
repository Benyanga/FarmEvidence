import { useSessionStore } from "../../store/sessionStore";
import HideMechanism from "../../components/shared/HideMechanism";

export function ModeRulesScreen() {
  const mode = useSessionStore((s) => s.mode);
  const isResearch = mode === "RESEARCH";

  return (
    <div className="space-y-6">
      <div className="card card--minimal p-6 space-y-4">
        <div>
          <h2 className="heading-2">Mode Rules & Workflow</h2>
          <p className="body-sm text-slate-600">
            This page explains how Farmer and Research modes differ in validation, engine behavior, and the visible app experience.
          </p>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
          <p className="body-sm text-slate-600 mb-3">Current session mode:</p>
          <div className="inline-flex items-center gap-3 rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-900">
            <span className={`h-2.5 w-2.5 rounded-full ${isResearch ? "bg-purple-600" : "bg-orange-500"}`} />
            {isResearch ? "Research Mode" : "Farmer Mode"}
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card card--minimal p-6">
          <h3 className="heading-4 mb-3">Shared requirements</h3>
          <ul className="list-disc list-inside space-y-2 body-sm text-slate-700">
            <li>Yield and selling price must be entered for the current season.</li>
            <li>At least one agronomic observation is required.</li>
            <li>All 6 CSI driver scores must be entered.</li>
            <li>All 5 labor operations must be entered; wage rates are recorded at the labor record level.</li>
            <li>All 6 system cost categories must be completed.</li>
            <li>Current season setup must be confirmed.</li>
          </ul>
        </div>

        <div className="card card--minimal p-6">
          <h3 className="heading-4 mb-3">Mode behavior</h3>
          <ul className="list-disc list-inside space-y-2 body-sm text-slate-700">
            <li><strong>Farmer mode:</strong> uses a simplified adoption cost model based on previous system transition.</li>
            <li><strong>Research mode:</strong> computes treatment mean profit and adoption cost from CA/CF system comparisons.</li>
            <li><strong>Farmer mode:</strong> disables statistical inference; statistics results remain unavailable.</li>
            <li><strong>Research mode:</strong> enables both Welch t-test and one-way ANOVA when trial data is valid.</li>
            <li><strong>Research mode:</strong> uses RCBD validation as an extra gate for replication structure.</li>
          </ul>
        </div>
      </div>

      <div className="card card--minimal p-6">
        <h3 className="heading-4 mb-3">Validation gates</h3>
        <p className="body-sm text-slate-600 mb-3">
          The active gate list is built in <code>src/utils/computationGates.js</code> by <code>getComputationGates(setup, season, mode)</code>.
        </p>
        <ul className="list-disc list-inside space-y-2 body-sm text-slate-700">
          <li>Shared gate anchors: <code>revenue-yield</code>, <code>revenue-price</code>, <code>agronomic</code>, <code>csi</code>, <code>labor-operations</code>, cost category anchors, and <code>setup</code>.</li>
          <li>Research-only gate: <code>rcbd</code> is added only when <code>mode === "RESEARCH"</code>.</li>
          <li>Research mode requires treatments and replications to produce statistical outputs; Farmer mode skips those checks.</li>
        </ul>
      </div>

      <div className="card card--minimal p-6 space-y-4">
        <h3 className="heading-4">UI changes</h3>
        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
            <h4 className="heading-6 mb-2">Farmer Mode</h4>
            <ul className="list-disc list-inside space-y-2 body-sm text-slate-700">
              <li>Statistics navigation is hidden.</li>
              <li>Mode focus is on single-system cost-benefit, trend, and risk outputs.</li>
              <li>Adoption cost only appears when system changes from prior season.</li>
            </ul>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
            <h4 className="heading-6 mb-2">Research Mode</h4>
            <ul className="list-disc list-inside space-y-2 body-sm text-slate-700">
              <li>RCBD/replication structure is required before compute is allowed.</li>
              <li>Statistics route is available and can display ANOVA / t-test results.</li>
              <li>Comparison dashboards include CA vs CF delta and expected profit analysis.</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="card card--minimal p-6">
        <h3 className="heading-4 mb-3">Screen visibility</h3>
        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
            <h4 className="heading-6 mb-2">Farmer Mode</h4>
            <ul className="list-disc list-inside space-y-2 body-sm text-slate-700">
              <li>Statistics screen is not shown in sidebar.</li>
              <li>Results, Trends, Scenario, and Explainability remain available.</li>
              <li>PDF and Alerts are still accessible.</li>
            </ul>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
            <h4 className="heading-6 mb-2">Research Mode</h4>
            <ul className="list-disc list-inside space-y-2 body-sm text-slate-700">
              <li>Statistics screen becomes available for research inference.</li>
              <li>Results include extra CA/CF and statistical analysis details.</li>
              <li>All navigation cards remain visible.</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="card card--minimal p-6">
        <h3 className="heading-4 mb-3">Engine summary</h3>
        <p className="body-sm text-slate-600">Detailed engine formulas and rules are restricted to the app owner.</p>
        <HideMechanism
          id="mode-engine-summary"
          content={JSON.stringify([
            "Both: revenue, labor cost, system cost, profit, ROI, CBR, CPU, CSI, efficiency factors, risk & scenario outputs, trends",
            "Research: treatment mean profit, adoption cost CA/CF, ΔC, ΔProfit, TTP, CNB, statistical inference",
            "Farmer: previous-season transition adoption cost, no statistical modules",
          ])}
        />
      </div>
    </div>
  );
}
