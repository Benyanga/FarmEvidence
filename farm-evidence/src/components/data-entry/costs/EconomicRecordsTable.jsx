import { useEffect, useState } from 'react';
import * as api from '../../../services/api.js';
import { formatRWF } from '../../../utils/formatters.js';

const CATEGORY_OPTIONS = [
  { value: 'SDC', label: 'System Dependent' },
  { value: 'SIC', label: 'System Independent' },
];

function formatDateDDMM(date) {
  if (!date) return '';
  const d = new Date(date);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${dd}/${mm}`;
}

export default function EconomicRecordsTable({ plotId, trialSeasonId, onTotalChange }) {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(null);

  useEffect(() => {
    if (!plotId || !trialSeasonId) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plotId, trialSeasonId]);

  useEffect(() => {
    const grandTotal = records.reduce((s, r) => s + computeTotal(r), 0);
    if (onTotalChange) onTotalChange(grandTotal);
  }, [records, onTotalChange]);

  async function load() {
    setLoading(true);
    try {
      const res = await api.getEconomicRecords(plotId, trialSeasonId);
      if (res?.ok) setRecords(res.records || []);
    } finally {
      setLoading(false);
    }
  }

  function computeTotal(record) {
    const uc = Number(record.unit_cost_rwf || 0);
    const q = Number(record.quantity || 0);
    return uc * q;
  }

  const grandTotal = records.reduce((s, r) => s + computeTotal(r), 0);

  async function handleAdd() {
    const base = {
      plot_id: plotId,
      trial_season_id: trialSeasonId,
      entry_date: new Date().toISOString(),
      item_activity: '',
      category: 'SDC',
      sub_category: '',
      description: '',
      unit: '',
      quantity: 0,
      unit_cost_rwf: 0,
    };
    setEditing(base);
  }

  async function handleSave(row) {
    // If row has _id -> update, else create
    try {
      if (row._id) {
        const res = await api.updateEconomicRecord(row._id, row);
        if (res?.ok) {
          setRecords(records.map(r => (r._id === row._id ? res.data : r)));
        }
      } else {
        const res = await api.addEconomicRecord({ ...row });
        if (res?.ok) {
          // preserve order and reload
          await load();
        }
      }
      setEditing(null);
    } catch (e) {
      console.error(e);
    }
  }

  async function handleDelete(id) {
    if (!confirm('Delete record?')) return;
    await api.deleteEconomicRecord(id);
    setRecords(records.filter(r => r._id !== id));
  }

  return (
    <div className="economic-records">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-lg font-semibold">Economic Records</h3>
        <div>
          <button className="btn" onClick={handleAdd}>Add record</button>
        </div>
      </div>

      <table className="min-w-full table-auto border-collapse">
        <thead>
          <tr className="text-left bg-ca-text text-white uppercase text-xs tracking-[0.08em]">
            <th className="px-3 py-2">Date</th>
            <th className="px-3 py-2">Input</th>
            <th className="px-3 py-2">Cost Type</th>
            <th className="px-3 py-2">Quantity</th>
            <th className="px-3 py-2">Unit</th>
            <th className="px-3 py-2">Unit Cost (RWF)</th>
            <th className="px-3 py-2">Total Cost (RWF)</th>
            <th className="px-3 py-2">Notes</th>
          </tr>
        </thead>
        <tbody>
          {loading && (
            <tr><td colSpan={8}>Loading…</td></tr>
          )}
          {records.map(r => {
            const categoryLabel = CATEGORY_OPTIONS.find((o) => o.value === r.category)?.label || r.category;
            return (
              <tr key={r._id} className="border-t">
                <td className="px-3 py-2">{formatDateDDMM(r.entry_date)}</td>
                <td className="px-3 py-2">{r.item_activity}</td>
                <td className="px-3 py-2">{categoryLabel}</td>
                <td className="px-3 py-2">{r.quantity}</td>
                <td className="px-3 py-2">{r.unit}</td>
                <td className="px-3 py-2">{formatRWF(r.unit_cost_rwf)}</td>
                <td className="px-3 py-2">{formatRWF(computeTotal(r))}</td>
                <td className="px-3 py-2">
                  <div>{r.note ?? r.description ?? ''}</div>
                  <div className="flex items-center gap-2 mt-2">
                    <button className="btn-xs" onClick={() => setEditing(r)}>Edit</button>
                    <button className="btn-xs" onClick={() => handleDelete(r._id)}>Delete</button>
                  </div>
                </td>
              </tr>
            );
          })}

          {editing && (
            <tr className="border-t bg-gray-50">
              <td className="px-3 py-2">
                <input type="date" value={editing.entry_date ? new Date(editing.entry_date).toISOString().slice(0,10) : ''} onChange={e => setEditing({...editing, entry_date: e.target.value})} className="w-full" />
              </td>
              <td className="px-3 py-2">
                <input value={editing.item_activity} onChange={e => setEditing({...editing, item_activity: e.target.value})} className="w-full" />
              </td>
              <td className="px-3 py-2">
                <select value={editing.category} onChange={e => setEditing({...editing, category: e.target.value})} className="w-full">
                  {CATEGORY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </td>
              <td className="px-3 py-2">
                <input type="number" value={editing.quantity} onChange={e => setEditing({...editing, quantity: Number(e.target.value)})} className="w-full" />
              </td>
              <td className="px-3 py-2">
                <input type="text" value={editing.unit || ''} onChange={e => setEditing({...editing, unit: e.target.value})} className="w-full" />
              </td>
              <td className="px-3 py-2">
                <input type="number" value={editing.unit_cost_rwf} onChange={e => setEditing({...editing, unit_cost_rwf: Number(e.target.value)})} className="w-full" />
              </td>
              <td className="px-3 py-2">{formatRWF(computeTotal(editing))}</td>
              <td className="px-3 py-2">
                <div style={{ display: 'grid', gap: '8px' }}>
                  <input value={editing.note || editing.description || ''} onChange={e => setEditing({...editing, note: e.target.value, description: e.target.value})} className="w-full" />
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="btn-xs" onClick={() => handleSave(editing)}>Save</button>
                    <button className="btn-xs" onClick={() => setEditing(null)}>Cancel</button>
                  </div>
                </div>
              </td>
            </tr>
          )}
        </tbody>
        <tfoot>
          <tr className="border-t font-semibold">
            <td colSpan={6}>Total cost (plot)</td>
            <td>{formatRWF(grandTotal)}</td>
            <td></td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
