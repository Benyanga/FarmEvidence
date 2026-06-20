// Section 2: Production Cost Summary (all plots, Σ and x̄ rows)
import { useTrialConfigStore } from '../../store/trialConfigStore';
import { usePlotDataStore } from '../../store/plotDataStore';
import { generatePlots } from '../../utils/rcbdUtils';

function sum(arr) { return arr.reduce((a, b) => a + b, 0); }
function mean(arr) { return arr.length ? sum(arr) / arr.length : 0; }

export function CBAPanelProductionCostSummary() {
  const config = useTrialConfigStore();
  const plotDataStore = usePlotDataStore();
  const plots = generatePlots(config.treatments, config.replications);

  // Group plots by treatment
  const treatmentGroups = {};
  plots.forEach(plot => {
    if (!treatmentGroups[plot.treatment]) treatmentGroups[plot.treatment] = [];
    treatmentGroups[plot.treatment].push(plot.plotId);
  });

  // Per-plot calculations
  const plotRows = plots.map(plot => {
    const data = plotDataStore.plots[plot.plotId] || {};
    const inputCosts = (data.inputCosts || []).reduce((sum, row) => {
      const q = parseFloat(row.quantity);
      const u = parseFloat(row.unitCost);
      return sum + (isFinite(q) && isFinite(u) ? q * u : 0);
    }, 0);
    const labourCosts = (data.labourCosts || []).reduce((sum, row) => {
      const t = parseFloat(row.time);
      const w = parseFloat(row.wageRate);
      let val = 0;
      if (isFinite(t) && isFinite(w)) {
        if (row.timeUnit === 'minutes') val = (t / (8 * 60)) * w;
        else if (row.timeUnit === 'hours') val = (t / 8) * w;
        else if (row.timeUnit === 'days') val = t * w;
      }
      return sum + val;
    }, 0);
    const labourTimeMin = (data.labourCosts || []).reduce((sum, row) => {
      const t = parseFloat(row.time);
      if (!isFinite(t)) return sum;
      if (row.timeUnit === 'minutes') return sum + t;
      if (row.timeUnit === 'hours') return sum + t * 60;
      if (row.timeUnit === 'days') return sum + t * 60 * 8;
      return sum;
    }, 0);
    const csd = [...(data.inputCosts || []), ...(data.labourCosts || [])].filter(r => r.costType === 'C_SD').reduce((sum, row) => {
      if ('quantity' in row && 'unitCost' in row) {
        const q = parseFloat(row.quantity);
        const u = parseFloat(row.unitCost);
        return sum + (isFinite(q) && isFinite(u) ? q * u : 0);
      }
      if ('time' in row && 'wageRate' in row) {
        const t = parseFloat(row.time);
        const w = parseFloat(row.wageRate);
        let val = 0;
        if (isFinite(t) && isFinite(w)) {
          if (row.timeUnit === 'minutes') val = (t / (8 * 60)) * w;
          else if (row.timeUnit === 'hours') val = (t / 8) * w;
          else if (row.timeUnit === 'days') val = t * w;
        }
        return sum + val;
      }
      return sum;
    }, 0);
    const csi = [...(data.inputCosts || []), ...(data.labourCosts || [])].filter(r => r.costType === 'C_SI').reduce((sum, row) => {
      if ('quantity' in row && 'unitCost' in row) {
        const q = parseFloat(row.quantity);
        const u = parseFloat(row.unitCost);
        return sum + (isFinite(q) && isFinite(u) ? q * u : 0);
      }
      if ('time' in row && 'wageRate' in row) {
        const t = parseFloat(row.time);
        const w = parseFloat(row.wageRate);
        let val = 0;
        if (isFinite(t) && isFinite(w)) {
          if (row.timeUnit === 'minutes') val = (t / (8 * 60)) * w;
          else if (row.timeUnit === 'hours') val = (t / 8) * w;
          else if (row.timeUnit === 'days') val = t * w;
        }
        return sum + val;
      }
      return sum;
    }, 0);
    return {
      plotId: plot.plotId,
      treatment: plot.treatment,
      inputCosts,
      labourCosts,
      labourTimeMin,
      totalCost: inputCosts + labourCosts,
      csd,
      csi,
    };
  });

  // Aggregate rows per treatment
  const aggRows = Object.entries(treatmentGroups).map(([treatment, plotIds]) => {
    const rows = plotRows.filter(r => plotIds.includes(r.plotId));
    const Σ = {
      label: `Σ Total — ${treatment} (${rows.length} plots)`,
      inputCosts: sum(rows.map(r => r.inputCosts)),
      labourCosts: sum(rows.map(r => r.labourCosts)),
      labourTimeMin: sum(rows.map(r => r.labourTimeMin)),
      totalCost: sum(rows.map(r => r.totalCost)),
      csd: sum(rows.map(r => r.csd)),
      csi: sum(rows.map(r => r.csi)),
      type: 'sum',
      treatment,
    };
    const x̄ = {
      label: `x̄ Avg per Plot — ${treatment} ★ used in CBA`,
      inputCosts: mean(rows.map(r => r.inputCosts)),
      labourCosts: mean(rows.map(r => r.labourCosts)),
      labourTimeMin: mean(rows.map(r => r.labourTimeMin)),
      totalCost: mean(rows.map(r => r.totalCost)),
      csd: mean(rows.map(r => r.csd)),
      csi: mean(rows.map(r => r.csi)),
      type: 'mean',
      treatment,
    };
    return [Σ, x̄];
  }).flat();

  return (
    <div className="table-responsive p-3">
      <table className="table table-bordered align-middle mb-0">
        <thead className="table-light">
          <tr>
            <th>Plot</th>
            <th>Input Costs (RWF)</th>
            <th>Labour Costs (RWF)</th>
            <th>Labour Time (min)</th>
            <th>TOTAL PRODUCTION COST (RWF)</th>
            <th>C_SD Total (RWF)</th>
            <th>C_SI Total (RWF)</th>
          </tr>
        </thead>
        <tbody>
          {plotRows.map(row => (
            <tr key={row.plotId}>
              <td>{row.plotId}</td>
              <td>{row.inputCosts > 0 ? row.inputCosts.toLocaleString('en-RW') : '—'}</td>
              <td>{row.labourCosts > 0 ? row.labourCosts.toLocaleString('en-RW') : '—'}</td>
              <td>{row.labourTimeMin > 0 ? row.labourTimeMin.toLocaleString('en-RW', { maximumFractionDigits: 1 }) : '—'}</td>
              <td>{row.totalCost > 0 ? row.totalCost.toLocaleString('en-RW') : '—'}</td>
              <td>{row.csd > 0 ? row.csd.toLocaleString('en-RW') : '—'}</td>
              <td>{row.csi > 0 ? row.csi.toLocaleString('en-RW') : '—'}</td>
            </tr>
          ))}
          {aggRows.map((row, i) => (
            <tr key={row.label} className={row.type === 'sum' ? (row.treatment.startsWith('CA') ? 'table-success' : 'table-warning') : (row.treatment.startsWith('CA') ? 'table-info' : 'table-danger') }>
              <td className="fw-bold">{row.label}</td>
              <td>{row.inputCosts > 0 ? row.inputCosts.toLocaleString('en-RW') : '—'}</td>
              <td>{row.labourCosts > 0 ? row.labourCosts.toLocaleString('en-RW') : '—'}</td>
              <td>{row.labourTimeMin > 0 ? row.labourTimeMin.toLocaleString('en-RW', { maximumFractionDigits: 1 }) : '—'}</td>
              <td>{row.totalCost > 0 ? row.totalCost.toLocaleString('en-RW') : '—'}</td>
              <td>{row.csd > 0 ? row.csd.toLocaleString('en-RW') : '—'}</td>
              <td>{row.csi > 0 ? row.csi.toLocaleString('en-RW') : '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="form-text mt-2">Σ rows: green (CA), amber (CF). x̄ rows: blue (CA), coral (CF). ★ = CBA input.</div>
    </div>
  );
}
