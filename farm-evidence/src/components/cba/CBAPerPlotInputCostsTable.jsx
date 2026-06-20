// Input Costs Table for a single plot
import { usePlotDataStore } from '../../store/plotDataStore';
import { useState } from 'react';

const INPUT_OPTIONS = [
  'Seeds',
  'Mulch',
  'Compost/Manure',
  'Inorganic fertilizers (NPK)',
  'Pesticides',
  'Custom...'
];
const COST_TYPE_OPTIONS = ['C_SD', 'C_SI'];

export function CBAPerPlotInputCostsTable({ plotId }) {
  const plotDataStore = usePlotDataStore();
  const plotData = plotDataStore.plots[plotId] || { inputCosts: [] };
  const [editRows, setEditRows] = useState(plotData.inputCosts.length || 1);

  const handleChange = (idx, field, value) => {
    const next = plotData.inputCosts ? [...plotData.inputCosts] : [];
    next[idx] = { ...next[idx], [field]: value };
    plotDataStore.setPlot(plotId, { inputCosts: next });
  };

  const addRow = () => {
    plotDataStore.setPlot(plotId, { inputCosts: [...(plotData.inputCosts || []), {}] });
    setEditRows(editRows + 1);
  };

  const removeRow = (idx) => {
    const next = (plotData.inputCosts || []).filter((_, i) => i !== idx);
    plotDataStore.setPlot(plotId, { inputCosts: next });
    setEditRows(Math.max(1, editRows - 1));
  };

  const getTotalCost = (row) => {
    const q = parseFloat(row.quantity);
    const u = parseFloat(row.unitCost);
    if (!isFinite(q) || !isFinite(u)) return '';
    return q * u;
  };

  const subtotal = (plotData.inputCosts || []).reduce((sum, row) => {
    const val = getTotalCost(row);
    return sum + (isFinite(val) ? val : 0);
  }, 0);

  return (
    <div className="table-responsive mb-3">
      <table className="table table-bordered align-middle mb-0">
        <thead className="table-light">
          <tr>
            <th>Date</th>
            <th>Input</th>
            <th>Cost Type</th>
            <th>Quantity</th>
            <th>Unit</th>
            <th>Unit Cost (RWF)</th>
            <th>Total Cost (RWF)</th>
            <th>Notes</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {(plotData.inputCosts || [{}]).map((row, idx) => (
            <tr key={idx}>
              <td><input type="date" className="form-control" value={row.date || ''} onChange={e => handleChange(idx, 'date', e.target.value)} /></td>
              <td>
                <select className="form-select" value={row.input || ''} onChange={e => handleChange(idx, 'input', e.target.value)}>
                  <option value="">Select</option>
                  {INPUT_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </td>
              <td>
                <select className="form-select" value={row.costType || ''} onChange={e => handleChange(idx, 'costType', e.target.value)}>
                  <option value="">Select</option>
                  {COST_TYPE_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </td>
              <td><input type="number" className="form-control" value={row.quantity || ''} onChange={e => handleChange(idx, 'quantity', e.target.value)} /></td>
              <td><input className="form-control" value={row.unit || ''} onChange={e => handleChange(idx, 'unit', e.target.value)} /></td>
              <td><input type="number" className="form-control" value={row.unitCost || ''} onChange={e => handleChange(idx, 'unitCost', e.target.value)} /></td>
              <td className="bg-light fw-bold">{getTotalCost(row)?.toLocaleString('en-RW') || '—'}</td>
              <td><input className="form-control" value={row.notes || ''} onChange={e => handleChange(idx, 'notes', e.target.value)} /></td>
              <td>
                <button className="btn btn-sm btn-outline-danger" onClick={() => removeRow(idx)} disabled={plotData.inputCosts.length <= 1}>×</button>
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="table-secondary">
            <td colSpan={6} className="text-end fw-bold">Subtotal — Input Costs</td>
            <td className="fw-bold">{isFinite(subtotal) && subtotal > 0 ? subtotal.toLocaleString('en-RW') : '—'}</td>
            <td colSpan={2}></td>
          </tr>
        </tfoot>
      </table>
      <button className="btn btn-sm btn-outline-primary mt-2" onClick={addRow}>+ Add Row</button>
    </div>
  );
}
