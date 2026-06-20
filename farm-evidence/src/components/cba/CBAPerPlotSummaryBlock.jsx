// Plot summary block: calculated, read-only, auto-updating
import { usePlotDataStore } from '../../store/plotDataStore';
import { useTrialConfigStore } from '../../store/trialConfigStore';

export function CBAPerPlotSummaryBlock({ plotId, plotSizeM2 }) {
  const plotData = usePlotDataStore((s) => s.plots[plotId] || {});
  const inputSubtotal = (plotData.inputCosts || []).reduce((sum, row) => {
    const q = parseFloat(row.quantity);
    const u = parseFloat(row.unitCost);
    const val = isFinite(q) && isFinite(u) ? q * u : 0;
    return sum + val;
  }, 0);
  const labourSubtotal = (plotData.labourCosts || []).reduce((sum, row) => {
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
  const totalCost = inputSubtotal + labourSubtotal;
  const csdTotal = [
    ...(plotData.inputCosts || []),
    ...(plotData.labourCosts || [])
  ].filter(row => row.costType === 'C_SD').reduce((sum, row) => {
    if ('quantity' in row && 'unitCost' in row) {
      const q = parseFloat(row.quantity);
      const u = parseFloat(row.unitCost);
      const val = isFinite(q) && isFinite(u) ? q * u : 0;
      return sum + val;
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
  const csiTotal = [
    ...(plotData.inputCosts || []),
    ...(plotData.labourCosts || [])
  ].filter(row => row.costType === 'C_SI').reduce((sum, row) => {
    if ('quantity' in row && 'unitCost' in row) {
      const q = parseFloat(row.quantity);
      const u = parseFloat(row.unitCost);
      const val = isFinite(q) && isFinite(u) ? q * u : 0;
      return sum + val;
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
  const costPerM2 = plotSizeM2 > 0 ? totalCost / plotSizeM2 : null;
  const costPerHa = costPerM2 != null ? costPerM2 * 10000 : null;

  return (
    <div className="row g-2 mt-2 mb-2">
      <div className="col-6 col-md-4 small">TOTAL PRODUCTION COST<br /><span className="fw-bold">{totalCost > 0 ? totalCost.toLocaleString('en-RW') : '—'} RWF</span></div>
      <div className="col-6 col-md-4 small">C_SD Total<br /><span className="fw-bold">{csdTotal > 0 ? csdTotal.toLocaleString('en-RW') : '—'} RWF</span></div>
      <div className="col-6 col-md-4 small">C_SI Total<br /><span className="fw-bold">{csiTotal > 0 ? csiTotal.toLocaleString('en-RW') : '—'} RWF</span></div>
      <div className="col-6 col-md-4 small">Cost per m²<br /><span className="fw-bold">{costPerM2 > 0 ? costPerM2.toLocaleString('en-RW', { maximumFractionDigits: 2 }) : '—'} RWF</span></div>
      <div className="col-6 col-md-4 small">Cost per ha (extrapolated)<br /><span className="fw-bold">{costPerHa > 0 ? costPerHa.toLocaleString('en-RW', { maximumFractionDigits: 0 }) : '—'} RWF</span></div>
    </div>
  );
}
