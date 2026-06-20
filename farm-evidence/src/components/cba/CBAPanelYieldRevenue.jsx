// Section 3: Yield & Gross Revenue Input Table
import { useTrialConfigStore } from '../../store/trialConfigStore';
import { usePlotDataStore } from '../../store/plotDataStore';
import { generatePlots } from '../../utils/rcbdUtils';

function sum(arr) { return arr.reduce((a, b) => a + b, 0); }
function mean(arr) { return arr.length ? sum(arr) / arr.length : 0; }

export function CBAPanelYieldRevenue() {
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
    const plotSizeM2 = data.plotSizeM2 ?? config.plotSizeM2;
    const yieldKg = parseFloat(data.yield) || 0;
    const price = parseFloat(data.price) || config.marketPrice || 0;
    const grossRevenue = yieldKg * price;
    const revenueM2 = plotSizeM2 > 0 ? grossRevenue / plotSizeM2 : 0;
    const revenueHa = revenueM2 * 10000;
    return {
      plotId: plot.plotId,
      treatment: plot.treatment,
      yieldKg,
      price,
      grossRevenue,
      revenueM2,
      revenueHa,
      plotSizeM2,
    };
  });

  // Aggregate rows per treatment
  const aggRows = Object.entries(treatmentGroups).map(([treatment, plotIds]) => {
    const rows = plotRows.filter(r => plotIds.includes(r.plotId));
    const Σ = {
      label: `Σ Total — ${treatment} (${rows.length} plots)`,
      yieldKg: sum(rows.map(r => r.yieldKg)),
      price: mean(rows.map(r => r.price)),
      grossRevenue: sum(rows.map(r => r.grossRevenue)),
      revenueM2: sum(rows.map(r => r.revenueM2)),
      revenueHa: sum(rows.map(r => r.revenueHa)),
      type: 'sum',
      treatment,
    };
    const x̄ = {
      label: `x̄ Avg per Plot — ${treatment} ★ used in CBA`,
      yieldKg: mean(rows.map(r => r.yieldKg)),
      price: mean(rows.map(r => r.price)),
      grossRevenue: mean(rows.map(r => r.grossRevenue)),
      revenueM2: mean(rows.map(r => r.revenueM2)),
      revenueHa: mean(rows.map(r => r.revenueHa)),
      type: 'mean',
      treatment,
    };
    return [Σ, x̄];
  }).flat();

  const handleChange = (plotId, field, value) => {
    plotDataStore.setPlot(plotId, { [field]: value });
  };

  return (
    <div className="table-responsive p-3">
      <table className="table table-bordered align-middle mb-0">
        <thead className="table-light">
          <tr>
            <th>Plot</th>
            <th className="bg-warning">Yield (kg)</th>
            <th className="bg-warning">Price (RWF/kg)</th>
            <th>Gross Revenue (RWF)</th>
            <th>Revenue/m²</th>
            <th>Revenue/ha</th>
          </tr>
        </thead>
        <tbody>
          {plotRows.map(row => (
            <tr key={row.plotId}>
              <td>{row.plotId}</td>
              <td className="bg-warning">
                <input type="number" className="form-control form-control-sm" value={row.yieldKg || ''} onChange={e => handleChange(row.plotId, 'yield', e.target.value)} />
              </td>
              <td className="bg-warning">
                <input type="number" className="form-control form-control-sm" value={row.price || ''} onChange={e => handleChange(row.plotId, 'price', e.target.value)} />
              </td>
              <td>{row.grossRevenue > 0 ? row.grossRevenue.toLocaleString('en-RW') : '—'}</td>
              <td>{row.revenueM2 > 0 ? row.revenueM2.toLocaleString('en-RW', { maximumFractionDigits: 2 }) : '—'}</td>
              <td>{row.revenueHa > 0 ? row.revenueHa.toLocaleString('en-RW', { maximumFractionDigits: 0 }) : '—'}</td>
            </tr>
          ))}
          {aggRows.map((row, i) => (
            <tr key={row.label} className={row.type === 'sum' ? (row.treatment.startsWith('CA') ? 'table-success' : 'table-warning') : (row.treatment.startsWith('CA') ? 'table-info' : 'table-danger') }>
              <td className="fw-bold">{row.label}</td>
              <td>{row.yieldKg > 0 ? row.yieldKg.toLocaleString('en-RW', { maximumFractionDigits: 2 }) : '—'}</td>
              <td>{row.price > 0 ? row.price.toLocaleString('en-RW', { maximumFractionDigits: 0 }) : '—'}</td>
              <td>{row.grossRevenue > 0 ? row.grossRevenue.toLocaleString('en-RW') : '—'}</td>
              <td>{row.revenueM2 > 0 ? row.revenueM2.toLocaleString('en-RW', { maximumFractionDigits: 2 }) : '—'}</td>
              <td>{row.revenueHa > 0 ? row.revenueHa.toLocaleString('en-RW', { maximumFractionDigits: 0 }) : '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="form-text mt-2">Σ rows: green (CA), amber (CF). x̄ rows: blue (CA), coral (CF). ★ = CBA input.</div>
    </div>
  );
}
