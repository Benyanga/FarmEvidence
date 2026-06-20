import { useState } from 'react';
import { addInputCost, addLabourCost, updateYield } from '../../api';

const INPUT_ITEMS  = ['Seeds', 'Mulch', 'Compost / Manure', 'Inorganic fertilizers (NPK)', 'Pesticides'];
const LABOUR_PRACTICES = [
  'Land preparation (Slashing, Tilling)', 'Planting (labour)',
  'Residue management (Mulch application)', 'First weeding (labour)',
  'Second weeding (labour)', 'Irrigation (labour)',
  'Pests and Diseases control (labour)', 'Harvesting (threshing, Winnowing)',
  'Postharvest handling (Drying, Storage)'
];

export function PlotEntryForm({ plotId, onSaved }) {
  const [tab, setTab] = useState('input');
  const [inputRow, setInputRow]   = useState({ item: INPUT_ITEMS[0], costType: 'C_SI', quantity: '', unit: 'Kg', unitCostRWF: '' });
  const [labourRow, setLabourRow] = useState({ practice: LABOUR_PRACTICES[0], costType: 'C_SD', numLabourers: 1, time: '', timeUnit: 'min', wageRateRWFPerDay: 1500 });
  const [yieldKg, setYieldKg]     = useState('');
  const [saving, setSaving]       = useState(false);

  const saveInput = async () => {
    setSaving(true);
    await addInputCost(plotId, inputRow);
    onSaved && onSaved();
    setInputRow({ ...inputRow, quantity: '', unitCostRWF: '' });
    setSaving(false);
  };

  const saveLabour = async () => {
    setSaving(true);
    await addLabourCost(plotId, labourRow);
    onSaved && onSaved();
    setLabourRow({ ...labourRow, time: '' });
    setSaving(false);
  };

  const saveYield = async () => {
    setSaving(true);
    await updateYield(plotId, { yieldKg: parseFloat(yieldKg) });
    onSaved && onSaved();
    setSaving(false);
  };

  return (
    <div className="bg-white rounded-xl shadow p-6 space-y-4">
      {/* Tab switcher */}
      <div className="flex gap-2 border-b pb-2">
        {['input', 'labour', 'yield'].map(t => (
          <button key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors
              ${tab === t ? 'bg-green-700 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {tab === 'input' && (
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <label className="text-xs text-gray-500">Input Item</label>
            <select className="w-full border rounded p-2 text-sm mt-1"
              value={inputRow.item} onChange={e => setInputRow({...inputRow, item: e.target.value})}>
              {INPUT_ITEMS.map(i => <option key={i}>{i}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500">Cost Type</label>
            <select className="w-full border rounded p-2 text-sm mt-1"
              value={inputRow.costType} onChange={e => setInputRow({...inputRow, costType: e.target.value})}>
              <option value="C_SI">C_SI (System-Independent)</option>
              <option value="C_SD">C_SD (System-Dependent)</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500">Unit</label>
            <input className="w-full border rounded p-2 text-sm mt-1"
              value={inputRow.unit} onChange={e => setInputRow({...inputRow, unit: e.target.value})} />
          </div>
          <div>
            <label className="text-xs text-gray-500">Quantity</label>
            <input type="number" className="w-full border rounded p-2 text-sm mt-1"
              value={inputRow.quantity} onChange={e => setInputRow({...inputRow, quantity: e.target.value})} />
          </div>
          <div>
            <label className="text-xs text-gray-500">Unit Cost (RWF)</label>
            <input type="number" className="w-full border rounded p-2 text-sm mt-1"
              value={inputRow.unitCostRWF} onChange={e => setInputRow({...inputRow, unitCostRWF: e.target.value})} />
          </div>
          {/* Auto-computed preview */}
          <div className="col-span-2 bg-gray-50 rounded p-2 text-sm text-gray-700">
            Total Cost: <strong>{((+inputRow.quantity || 0) * (+inputRow.unitCostRWF || 0)).toLocaleString()} RWF</strong>
          </div>
          <div className="col-span-2">
            <button onClick={saveInput} disabled={saving}
              className="w-full bg-green-700 text-white rounded py-2 text-sm font-medium hover:bg-green-800 disabled:opacity-50">
              {saving ? 'Saving...' : 'Add Input Cost'}
            </button>
          </div>
        </div>
      )}

      {tab === 'labour' && (
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <label className="text-xs text-gray-500">Practice</label>
            <select className="w-full border rounded p-2 text-sm mt-1"
              value={labourRow.practice} onChange={e => setLabourRow({...labourRow, practice: e.target.value})}>
              {LABOUR_PRACTICES.map(p => <option key={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500">Cost Type</label>
            <select className="w-full border rounded p-2 text-sm mt-1"
              value={labourRow.costType} onChange={e => setLabourRow({...labourRow, costType: e.target.value})}>
              <option value="C_SD">C_SD (System-Dependent)</option>
              <option value="C_SI">C_SI (System-Independent)</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500">No. of Labourers</label>
            <input type="number" min="1" className="w-full border rounded p-2 text-sm mt-1"
              value={labourRow.numLabourers} onChange={e => setLabourRow({...labourRow, numLabourers: +e.target.value})} />
          </div>
          <div>
            <label className="text-xs text-gray-500">Time</label>
            <input type="number" className="w-full border rounded p-2 text-sm mt-1"
              value={labourRow.time} onChange={e => setLabourRow({...labourRow, time: e.target.value})} />
          </div>
          <div>
            <label className="text-xs text-gray-500">Time Unit</label>
            <select className="w-full border rounded p-2 text-sm mt-1"
              value={labourRow.timeUnit} onChange={e => setLabourRow({...labourRow, timeUnit: e.target.value})}>
              <option value="min">Minutes</option>
              <option value="hr">Hours</option>
              <option value="day">Days</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500">Wage Rate (RWF/day)</label>
            <input type="number" className="w-full border rounded p-2 text-sm mt-1"
              value={labourRow.wageRateRWFPerDay} onChange={e => setLabourRow({...labourRow, wageRateRWFPerDay: +e.target.value})} />
          </div>
          {/* Labour cost preview: numLabourers × (time_min / (8×60)) × wageRate */}
          <div className="col-span-2 bg-gray-50 rounded p-2 text-sm text-gray-700">
            Total Labour Cost: <strong>
              {(() => {
                const mins = labourRow.timeUnit === 'min' ? +labourRow.time
                           : labourRow.timeUnit === 'hr'  ? +labourRow.time * 60
                           : +labourRow.time * 8 * 60;
                const cost = (labourRow.numLabourers || 1) * (mins / (8 * 60)) * (labourRow.wageRateRWFPerDay || 1500);
                return isNaN(cost) ? '—' : `${cost.toFixed(2)} RWF`;
              })()}
            </strong>
          </div>
          <div className="col-span-2">
            <button onClick={saveLabour} disabled={saving}
              className="w-full bg-green-700 text-white rounded py-2 text-sm font-medium hover:bg-green-800 disabled:opacity-50">
              {saving ? 'Saving...' : 'Add Labour Entry'}
            </button>
          </div>
        </div>
      )}

      {tab === 'yield' && (
        <div className="space-y-3">
          <div>
            <label className="text-xs text-gray-500">Yield (kg/plot)</label>
            <input type="number" step="0.01" className="w-full border rounded p-2 text-sm mt-1"
              value={yieldKg} onChange={e => setYieldKg(e.target.value)}
              placeholder="Enter actual harvested yield" />
          </div>
          <button onClick={saveYield} disabled={saving || !yieldKg}
            className="w-full bg-green-700 text-white rounded py-2 text-sm font-medium hover:bg-green-800 disabled:opacity-50">
            {saving ? 'Saving...' : 'Save Yield'}
          </button>
        </div>
      )}
    </div>
  );
}
