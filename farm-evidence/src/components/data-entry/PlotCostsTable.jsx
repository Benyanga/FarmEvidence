import { useState, useEffect } from 'react';
import schema from '../../utils/plotSchema.json';

export default function PlotCostsTable({ initialRows = [], onChange }) {
  const costTypeOptions = schema.inputCostTypeOptions || [
    { value: 'C_SD', label: 'System dependent' },
    { value: 'C_SI', label: 'System independent' },
  ];

  function emptyRow() {
    return {
      date: '',
      input: '',
      costType: costTypeOptions[0].value,
      quantity: 0,
      unit: '',
      unitCost: 0,
      total: 0,
    };
  }

  const [rows, setRows] = useState(initialRows.length ? initialRows : [emptyRow()]);

  useEffect(() => {
    if (onChange) onChange(rows);
  }, [rows, onChange]);

  function setCell(i, key, value) {
    setRows((prev) => {
      const copy = prev.map((r) => ({ ...r }));
      copy[i][key] = key === 'unitCost' || key === 'quantity' ? Number(value || 0) : value;
      copy[i].total = Number(copy[i].unitCost || 0) * Number(copy[i].quantity || 0);
      return copy;
    });
  }

  function addRow() {
    setRows((prev) => [...prev, emptyRow()]);
  }

  function removeRow(i) {
    setRows((prev) => prev.filter((_, idx) => idx !== i));
  }

  const grandTotal = rows.reduce((s, r) => s + Number(r.total || 0), 0);

  return (
    <div className="plot-costs-table-wrapper">
      <table className="dashboard-table plot-costs-table" style={{ width: '100%' }}>
        <thead>
          <tr>
            {schema.inputCostsColumns.map((c) => (
              <th key={c}>{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className={r.costType === 'C_SD' ? 'c-sd-row' : ''}>
              <td>
                <input type="date" value={r.date} onChange={(e) => setCell(i, 'date', e.target.value)} />
              </td>
              <td>
                <input value={r.input} onChange={(e) => setCell(i, 'input', e.target.value)} placeholder="Input name" />
              </td>
              <td>
                <select value={r.costType} onChange={(e) => setCell(i, 'costType', e.target.value)}>
                  {costTypeOptions.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </td>
              <td>
                <input type="number" value={r.quantity} onChange={(e) => setCell(i, 'quantity', e.target.value)} placeholder="0" />
              </td>
              <td>
                <input value={r.unit} onChange={(e) => setCell(i, 'unit', e.target.value)} placeholder="kg, days" />
              </td>
              <td>
                <input type="number" value={r.unitCost} onChange={(e) => setCell(i, 'unitCost', e.target.value)} placeholder="0" />
              </td>
              <td style={{ position: 'relative' }}>
                <div>{Number(r.total || 0).toLocaleString()}</div>
                <button type="button" className="plot-costs-table__remove" onClick={() => removeRow(i)}>
                  ×
                </button>
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan={6} style={{ textAlign: 'right', fontWeight: 700 }}>Subtotal — Input Costs</td>
            <td style={{ fontWeight: 700 }}>{grandTotal.toLocaleString()}</td>
          </tr>
        </tfoot>
      </table>

      <div style={{ marginTop: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button className="btn btn--small" onClick={addRow}>Add row</button>
        <span style={{ color: 'var(--fe-text-muted)', fontSize: '12px' }}>System-independent rows are included in analysis but excluded from systems comparison.</span>
      </div>
    </div>
  );
}
