// Labour Costs Table for a single plot
import { usePlotDataStore } from '../../store/plotDataStore';
import { useTrialConfigStore } from '../../store/trialConfigStore';
import { useState } from 'react';

const PRACTICE_OPTIONS = [
  'Land preparation (Slashing/Tilling)',
  'Planting',
  'Residue management (Mulch application)',
  'First weeding',
  'Second weeding',
  'Irrigation',
  'Pest & Disease control',
  'Harvesting (threshing/winnowing)',
  'Postharvest handling (Drying/Storage)',
  'Custom...'
];
const COST_TYPE_OPTIONS = ['C_SD', 'C_SI'];
const TIME_UNIT_OPTIONS = ['minutes', 'hours', 'days'];

export function CBAPerPlotLabourCostsTable({ plotId }) {
  const plotDataStore = usePlotDataStore();
  const plotData = plotDataStore.plots[plotId] || { labourCosts: [] };
  const workingHoursPerDay = useTrialConfigStore((s) => s.workingHoursPerDay) || 8;
  const [editRows, setEditRows] = useState(plotData.labourCosts.length || 1);

  const handleChange = (idx, field, value) => {
    const next = plotData.labourCosts ? [...plotData.labourCosts] : [];
    next[idx] = { ...next[idx], [field]: value };
    plotDataStore.setPlot(plotId, { labourCosts: next });
  };

  const addRow = () => {
    plotDataStore.setPlot(plotId, { labourCosts: [...(plotData.labourCosts || []), {}] });
    setEditRows(editRows + 1);
  };

  const removeRow = (idx) => {
    const next = (plotData.labourCosts || []).filter((_, i) => i !== idx);
    plotDataStore.setPlot(plotId, { labourCosts: next });
    setEditRows(Math.max(1, editRows - 1));
  };

  const getTotalCost = (row) => {
    const t = parseFloat(row.time);
    const w = parseFloat(row.wageRate);
    if (!isFinite(t) || !isFinite(w)) return '';
    if (row.timeUnit === 'minutes') return (t / (workingHoursPerDay * 60)) * w;
    if (row.timeUnit === 'hours') return (t / workingHoursPerDay) * w;
    if (row.timeUnit === 'days') return t * w;
    return '';
  };

  const subtotal = (plotData.labourCosts || []).reduce((sum, row) => {
    const val = getTotalCost(row);
    return sum + (isFinite(val) ? val : 0);
  }, 0);

  return (
    <div className="table-responsive mb-3">
      <table className="table table-bordered align-middle mb-0">
        <thead className="table-light">
          <tr>
            <th>Date</th>
            <th>Practice</th>
            <th>Cost Type</th>
            <th>Time</th>
            <th>Time Unit</th>
            <th>Wage Rate (RWF/day)</th>
            <th>Total Cost (RWF)</th>
            <th>Notes</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {(plotData.labourCosts || [{}]).map((row, idx) => (
            <tr key={idx}>
              <td><input type="date" className="form-control" value={row.date || ''} onChange={e => handleChange(idx, 'date', e.target.value)} /></td>
              <td>
                <select className="form-select" value={row.practice || ''} onChange={e => handleChange(idx, 'practice', e.target.value)}>
                  <option value="">Select</option>
                  {PRACTICE_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </td>
              <td>
                <select className="form-select" value={row.costType || ''} onChange={e => handleChange(idx, 'costType', e.target.value)}>
                  <option value="">Select</option>
                  {COST_TYPE_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </td>
              <td><input type="number" className="form-control" value={row.time || ''} onChange={e => handleChange(idx, 'time', e.target.value)} /></td>
              <td>
                <select className="form-select" value={row.timeUnit || ''} onChange={e => handleChange(idx, 'timeUnit', e.target.value)}>
                  <option value="">Select</option>
                  {TIME_UNIT_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </td>
              <td><input type="number" className="form-control" value={row.wageRate ?? ''} onChange={e => handleChange(idx, 'wageRate', e.target.value)} /></td>
              <td className="bg-light fw-bold">{getTotalCost(row)?.toLocaleString('en-RW') || '—'}</td>
              <td><input className="form-control" value={row.notes || ''} onChange={e => handleChange(idx, 'notes', e.target.value)} /></td>
              <td>
                <button className="btn btn-sm btn-outline-danger" onClick={() => removeRow(idx)} disabled={plotData.labourCosts.length <= 1}>×</button>
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="table-secondary">
            <td colSpan={6} className="text-end fw-bold">Subtotal — Labour Costs</td>
            <td className="fw-bold">{isFinite(subtotal) && subtotal > 0 ? subtotal.toLocaleString('en-RW') : '—'}</td>
            <td colSpan={2}></td>
          </tr>
        </tfoot>
      </table>
      <button className="btn btn-sm btn-outline-primary mt-2" onClick={addRow}>+ Add Row</button>
    </div>
  );
}
