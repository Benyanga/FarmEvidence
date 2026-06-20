// Section 4: Cost-Benefit Analysis Comparison Table
import { useTrialConfigStore } from '../../store/trialConfigStore';
import { usePlotDataStore } from '../../store/plotDataStore';
import { generatePlots } from '../../utils/rcbdUtils';

function sum(arr) { return arr.reduce((a, b) => a + b, 0); }
function mean(arr) { return arr.length ? sum(arr) / arr.length : 0; }
function safeDiv(a, b) { return b ? a / b : null; }
function colorValue(val, positiveColor = undefined) {
  if (val == null || val === '' || isNaN(val)) return {};
  if (typeof val === 'number' && val < 0) return { color: 'var(--fe-profit-neg)' };
  if (positiveColor && typeof val === 'number' && val > 0) return { color: positiveColor };
  return {};
}

export function CBAPanelCBAComparison() {
  const config = useTrialConfigStore();
  const plotDataStore = usePlotDataStore();
  const plots = generatePlots(config.treatments, config.replications);

  // Group plots by treatment
  const treatmentGroups = {};
  plots.forEach(plot => {
    if (!treatmentGroups[plot.treatment]) treatmentGroups[plot.treatment] = [];
    treatmentGroups[plot.treatment].push(plot.plotId);
  });

  // Compute x̄ (mean) values for each treatment
  const treatmentStats = Object.entries(treatmentGroups).map(([treatment, plotIds]) => {
    const rows = plotIds.map(pid => {
      const data = plotDataStore.plots[pid] || {};
      const plotSizeM2 = data.plotSizeM2 ?? config.plotSizeM2;
      const plotSizeHa = plotSizeM2 > 0 ? plotSizeM2 / 10000 : null;
      const yieldKg = parseFloat(data.yield) || 0;
      const price = parseFloat(data.price) || config.marketPrice || 0;
      const grossRevenue = yieldKg * price;
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
      const totalCost = inputCosts + labourCosts;
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
        plotSizeHa,
        grossRevenue,
        totalCost,
        netBenefit: grossRevenue - totalCost,
        csd,
        csi,
        adjGrossMargin: grossRevenue - csd,
        yieldKg,
      };
    });
    const avgPlotSizeHa = mean(rows.map(r => r.plotSizeHa));
    const avgGrossRevenue = mean(rows.map(r => r.grossRevenue));
    const avgTotalCost = mean(rows.map(r => r.totalCost));
    const netBenefit = avgGrossRevenue - avgTotalCost;
    const avgCSD = mean(rows.map(r => r.csd));
    const avgCSI = mean(rows.map(r => r.csi));
    const adjGrossMargin = avgGrossRevenue - avgCSD;
    const bcr = avgTotalCost > 0 ? avgGrossRevenue / avgTotalCost : null;
    const roi = avgTotalCost > 0 ? (netBenefit / avgTotalCost) * 100 : null;
    const avgYield = mean(rows.map(r => r.yieldKg));
    const avgYieldHa = avgPlotSizeHa > 0 ? avgYield / avgPlotSizeHa : null;
    const costPerKg = avgYield > 0 ? avgTotalCost / avgYield : null;
    return {
      treatment,
      avgPlotSizeHa,
      avgGrossRevenue,
      avgTotalCost,
      netBenefit,
      avgCSD,
      avgCSI,
      adjGrossMargin,
      bcr,
      roi,
      avgYield,
      avgYieldHa,
      costPerKg,
    };
  });

  // Table rows as per spec
  const rows = [
    { label: 'Avg plot size (ha)', key: 'avgPlotSizeHa', perHa: true },
    { label: 'Avg gross revenue', key: 'avgGrossRevenue', perHa: true },
    { label: 'Avg total production cost', key: 'avgTotalCost', perHa: true },
    { label: 'Net benefit (revenue − cost)', key: 'netBenefit', perHa: true },
    { label: 'Avg C_SD cost', key: 'avgCSD', perHa: true },
    { label: 'Avg C_SI cost', key: 'avgCSI', perHa: true },
    { label: 'Adjusted gross margin (revenue − C_SD)', key: 'adjGrossMargin', perHa: true },
    { label: 'Benefit-cost ratio (BCR)', key: 'bcr', perHa: false },
    { label: 'Return on investment (%)', key: 'roi', perHa: false },
    { label: 'Avg yield (kg/plot | kg/ha)', key: 'avgYield', perHa: true, isYield: true },
    { label: 'Cost per kg produced', key: 'costPerKg', perHa: false },
  ];

  return (
    <div className="table-responsive p-3">
      <table className="table table-bordered align-middle mb-0">
        <thead className="table-light">
          <tr>
            <th></th>
            {treatmentStats.map(stat => (
              <th colSpan={2} key={stat.treatment} style={{ color: stat.treatment.startsWith('CA') ? 'var(--fe-ca-text)' : stat.treatment.startsWith('CF') ? 'var(--fe-cf-border)' : 'var(--fe-grey-900)', background: stat.treatment.startsWith('CA') ? 'var(--fe-ca-bg)' : stat.treatment.startsWith('CF') ? 'var(--fe-cf-bg)' : 'var(--fe-grey-050)', textAlign: 'center' }}>{stat.treatment}</th>
            ))}
          </tr>
          <tr>
            <th></th>
            {treatmentStats.map(stat => [<th key={stat.treatment + '-val'}>Value (RWF)</th>, <th key={stat.treatment + '-ha'}>Per ha (RWF/ha)</th>])}
          </tr>
        </thead>
        <tbody>
          {rows.map(row => (
            <tr key={row.label}>
              <td className="fw-bold">{row.label}</td>
              {treatmentStats.map(stat => {
                let val = stat[row.key];
                let perHa = row.perHa && stat.avgPlotSizeHa > 0 ? (val / stat.avgPlotSizeHa) : null;
                if (row.isYield) {
                  // Show as "kg/plot | kg/ha"
                  return [
                    <td key={stat.treatment + '-val'} style={{ color: val > 0 ? 'inherit' : 'var(--fe-grey-400)' }}>{val > 0 ? `${val.toLocaleString('en-RW', { maximumFractionDigits: 2 })} kg/plot` : '—'}</td>,
                    <td key={stat.treatment + '-ha'} style={{ color: stat.avgYieldHa > 0 ? 'inherit' : 'var(--fe-grey-400)' }}>{stat.avgYieldHa > 0 ? `${stat.avgYieldHa.toLocaleString('en-RW', { maximumFractionDigits: 0 })} kg/ha` : '—'}</td>
                  ];
                }
                if (row.key === 'bcr') {
                  return [
                    <td key={stat.treatment + '-val'} style={val != null ? (val < 1 ? { color: 'var(--fe-profit-neg)' } : val > 1 ? { color: 'var(--fe-green-900)' } : {}) : { color: 'var(--fe-grey-400)' }}>{val != null ? `${val.toFixed(2)}x` : '—'}</td>,
                    <td key={stat.treatment + '-ha'} style={{ color: 'var(--fe-grey-400)' }}>—</td>
                  ];
                }
                if (row.key === 'roi') {
                  return [
                    <td key={stat.treatment + '-val'} style={val != null ? colorValue(val) : { color: 'var(--fe-grey-400)' }}>{val != null ? `${val.toFixed(1)}%` : '—'}</td>,
                    <td key={stat.treatment + '-ha'} style={{ color: 'var(--fe-grey-400)' }}>—</td>
                  ];
                }
                if (row.key === 'costPerKg') {
                  return [
                    <td key={stat.treatment + '-val'} style={val != null ? colorValue(val) : { color: 'var(--fe-grey-400)' }}>{val != null ? val.toLocaleString('en-RW', { maximumFractionDigits: 2 }) : '—'}</td>,
                    <td key={stat.treatment + '-ha'} style={{ color: 'var(--fe-grey-400)' }}>—</td>
                  ];
                }
                return [
                  <td key={stat.treatment + '-val'} style={colorValue(val)}>{val != null ? val.toLocaleString('en-RW', { maximumFractionDigits: 0 }) : '—'}</td>,
                  <td key={stat.treatment + '-ha'} style={colorValue(perHa)}>{perHa != null ? perHa.toLocaleString('en-RW', { maximumFractionDigits: 0 }) : '—'}</td>
                ];
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="form-text mt-2">★ = Average of [R] replicates used as representative system value for CBA. Colours: [treatment colour key].</div>
    </div>
  );
}
