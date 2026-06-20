import { useEffect, useState } from 'react';
import * as api from '../../../services/api.js';
import { formatRWF } from '../../../utils/formatters.js';

const COST_TYPE_OPTIONS = [
  { value: 'C_SD', label: 'System dependent' },
  { value: 'C_SI', label: 'System independent' },
];

const TIME_UNITS = [
  { value: 'seconds', label: 'Seconds' },
  { value: 'minutes', label: 'Minutes' },
  { value: 'hours', label: 'Hours' },
  { value: 'days', label: 'Days' },
];

function timeToDays(value, unit) {
  const v = Number(value) || 0;
  switch (unit) {
    case 'seconds': return v / (8 * 3600);
    case 'minutes': return v / (8 * 60);
    case 'hours': return v / 8;
    case 'days': return v;
    default: return v;
  }
}

export default function LabourTable({ plotId, trialSeasonId, onTotalChange }) {
  const [entries, setEntries] = useState([]);
  const [editing, setEditing] = useState(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const res = await api.getLabour(plotId, trialSeasonId);
        if (res.ok && mounted) {
          const mapped = (res.records || []).map((record) => ({
            ...record,
            practice: record.activity || '',
            costType: record.cost_type || 'C_SD',
            time: record.time_value ?? 0,
            timeUnit: record.time_unit || 'hours',
            wageRate: record.wage_per_day ?? 0,
          }));
          setEntries(mapped);
        }
      } catch (e) {
        console.warn('Failed to load labour records', e);
      }
    }
    load();
    return () => { mounted = false; };
  }, [plotId, trialSeasonId]);

  useEffect(() => {
    const total = entries.reduce((sum, entry) => sum + computeTotal(entry), 0);
    if (onTotalChange) onTotalChange(total);
  }, [entries, onTotalChange]);

  const computeTotal = (entry) => {
    const days = timeToDays(entry.time, entry.timeUnit);
    return days * Number(entry.wageRate || 0);
  };

  const subtotal = entries.reduce((sum, entry) => sum + computeTotal(entry), 0);

  const handleAdd = () => {
    setEditing({
      entry_date: new Date().toISOString().slice(0, 10),
      practice: '',
      costType: 'C_SD',
      time: 0,
      timeUnit: 'hours',
      wageRate: 0,
    });
  };

  async function saveRemote(row) {
    try {
      const payload = {
        plot_id: plotId,
        trial_season_id: trialSeasonId,
        entry_date: row.entry_date,
        activity: row.practice,
        time_value: Number(row.time || 0),
        time_unit: row.timeUnit,
        wage_per_day: Number(row.wageRate || 0),
        cost_type: row.costType,
        workers: 1,
      };
      if (row._id && !String(row._id).startsWith('tmp-')) {
        const res = await api.updateLabour(row._id, payload);
        if (res.ok) {
          setEntries(entries.map((e) => (e._id === res.data._id ? {
            ...res.data,
            practice: res.data.activity || '',
            costType: res.data.cost_type || 'C_SD',
            time: res.data.time_value ?? 0,
            timeUnit: res.data.time_unit || 'hours',
            wageRate: res.data.wage_per_day ?? 0,
          } : e)));
        }
      } else {
        const res = await api.addLabour(payload);
        if (res.ok) {
          setEntries([...entries, {
            ...res.data,
            practice: res.data.activity || '',
            costType: res.data.cost_type || 'C_SD',
            time: res.data.time_value ?? 0,
            timeUnit: res.data.time_unit || 'hours',
            wageRate: res.data.wage_per_day ?? 0,
          }]);
        }
      }
    } catch (e) {
      console.warn('Failed to save labour record', e);
    }
    setEditing(null);
  }

  async function removeRemote(id) {
    try {
      if (String(id).startsWith('tmp-')) {
        setEntries(entries.filter((entry) => entry._id !== id));
        return;
      }
      const res = await api.deleteLabour(id);
      if (res.ok) setEntries(entries.filter((entry) => entry._id !== id));
    } catch (e) {
      console.warn('Failed to delete labour record', e);
    }
  }

  return (
    <div className="labour-table mt-6">
      <h3 className="text-lg font-semibold">Labour Costs</h3>
      <div className="flex justify-between items-center mb-2">
        <div />
        <button className="btn btn--small" onClick={handleAdd}>+ Add labour row</button>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table className="dashboard-table" style={{ width: '100%' }}>
          <thead>
            <tr>
              <th>Date</th>
              <th>Practice</th>
              <th>Cost Type</th>
              <th>Time</th>
              <th>Time Unit</th>
              <th>Wage Rate (RWF/day)</th>
              <th>Total Cost (RWF)</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => (
              <tr key={entry._id || entry.practice || JSON.stringify(entry)}>
                <td>{entry.entry_date ? entry.entry_date.toString().slice(0, 10) : ''}</td>
                <td>{entry.practice}</td>
                <td>{COST_TYPE_OPTIONS.find((opt) => opt.value === entry.costType)?.label || entry.costType}</td>
                <td>{entry.time}</td>
                <td>{TIME_UNITS.find((opt) => opt.value === entry.timeUnit)?.label || entry.timeUnit}</td>
                <td>{formatRWF(entry.wageRate)}</td>
                <td>{formatRWF(computeTotal(entry))}</td>
                <td>
                  <button
                    type="button"
                    className="dashboard-table__remove"
                    onClick={() => removeRemote(entry._id)}
                    aria-label="Delete labour row"
                  >
                    ×
                  </button>
                </td>
              </tr>
            ))}

            {editing && (
              <tr className="border-t bg-gray-50">
                <td>
                  <input
                    type="date"
                    value={editing.entry_date || ''}
                    onChange={(e) => setEditing((prev) => ({ ...prev, entry_date: e.target.value }))}
                  />
                </td>
                <td>
                  <input
                    value={editing.practice}
                    onChange={(e) => setEditing((prev) => ({ ...prev, practice: e.target.value }))}
                    placeholder="Practice"
                  />
                </td>
                <td>
                  <select
                    value={editing.costType}
                    onChange={(e) => setEditing((prev) => ({ ...prev, costType: e.target.value }))}
                  >
                    {COST_TYPE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </td>
                <td>
                  <input
                    type="number"
                    value={editing.time}
                    onChange={(e) => setEditing((prev) => ({ ...prev, time: Number(e.target.value || 0) }))}
                    placeholder="0"
                  />
                </td>
                <td>
                  <select
                    value={editing.timeUnit}
                    onChange={(e) => setEditing((prev) => ({ ...prev, timeUnit: e.target.value }))}
                  >
                    {TIME_UNITS.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </td>
                <td>
                  <input
                    type="number"
                    value={editing.wageRate}
                    onChange={(e) => setEditing((prev) => ({ ...prev, wageRate: Number(e.target.value || 0) }))}
                    placeholder="0"
                  />
                </td>
                <td>{formatRWF(computeTotal(editing))}</td>
                <td style={{ display: 'flex', gap: '8px' }}>
                  <button type="button" className="btn-xs" onClick={() => saveRemote(editing)}>Save</button>
                  <button type="button" className="btn-xs" onClick={() => setEditing(null)}>Cancel</button>
                </td>
              </tr>
            )}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={7} style={{ textAlign: 'right', fontWeight: 700 }}>Subtotal — Labour Costs</td>
              <td style={{ fontWeight: 700 }}>{formatRWF(subtotal)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
