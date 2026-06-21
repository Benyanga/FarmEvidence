import { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Plus, X, AlertCircle, Check } from 'lucide-react';
import { useTrialContext } from '../../context/TrialContext';
import { ScreenTopbar } from '../../components/shared/ScreenTopbar';

const INPUT_ITEMS = [
  'Seeds',
  'Fertilizer (NPK)',
  'Fertilizer (Urea)',
  'Manure',
  'Herbicide',
  'Insecticide',
  'Fungicide',
  'Other Input',
];

const PRACTICES = ['Planting', 'Weeding', 'Fertilizer Application', 'Spraying', 'Harvesting', 'Other'];

const COST_TYPES = ['Material', 'Labour (hired)', 'Transport', 'Other'];

const TIME_UNITS = ['hours', 'days'];

const CROP_SUGGESTIONS = ['Beans', 'Maize', 'Irish Potato', 'Cassava', 'Sorghum'];

const LABELS = {
  en: {
    backToSetup: 'Back to Setup',
    inputCosts: 'Input Costs',
    labourCosts: 'Labour Costs',
    yield: 'Yield',
    farmConditions: 'Farm Conditions',
    summary: 'Live Summary',
    inputCostsTotal: 'Input Costs Total',
    labourCostsTotal: 'Labour Costs Total',
    totalProductionCost: 'Total Production Cost',
    yield_kg: 'Yield (kg)',
    grossRevenue: 'Gross Revenue',
    netBenefit: 'Net Benefit',
    bcr: 'BCR',
    saved: 'Saved ✓',
    viewAnalysis: 'View This Season\'s Analysis →',
  },
  kin: {
    backToSetup: 'Gusubira Mu Genamenitere',
    inputCosts: 'Ibiciro by\'Ibihogo',
    labourCosts: 'Ibiciro by\'Akazi',
    yield: 'Ubwigire',
    farmConditions: 'Uko Ubutaka Bwari',
    summary: 'Ikigisha cy\'Iki Gihe',
    inputCostsTotal: 'Ubwigire bw\'Ibihogo',
    labourCostsTotal: 'Ubwigire bw\'Akazi',
    totalProductionCost: 'Ubwigire bw\'Ubujanisha Bumwe',
    yield_kg: 'Ubwigire (kg)',
    grossRevenue: 'Inyongeragihugu',
    netBenefit: 'Inyungu Nyinshi',
    bcr: 'BCR',
    saved: 'Yabishyizweho ✓',
    viewAnalysis: 'Reba Isesengura ry\'Ihembwe →',
  },
};

function Toast({ message, visible }) {
  if (!visible) return null;
  return (
    <div className="fixed bottom-6 right-6 z-50 rounded-2xl bg-emerald-700 px-6 py-3 text-sm font-semibold text-white shadow-lg flex items-center gap-2">
      <Check className="h-4 w-4" />
      {message}
    </div>
  );
}

function ProgressDots({ data }) {
  const dots = [
    { label: 'Input Costs', has: Array.isArray(data.inputCosts) && data.inputCosts.length > 0 },
    { label: 'Labour Costs', has: Array.isArray(data.labourCosts) && data.labourCosts.length > 0 },
    { label: 'Yield', has: data.yield > 0 },
    { label: 'Agronomic', has: data.agronomicData && Object.keys(data.agronomicData).length > 0 },
  ];

  return (
    <div className="flex items-center gap-3">
      {dots.map((dot) => (
        <div key={dot.label} className="flex items-center gap-2">
          <div
            className={`h-3 w-3 rounded-full transition ${
              dot.has ? 'bg-emerald-500' : 'bg-slate-300'
            }`}
          />
          <span className="text-xs text-slate-600 hidden sm:inline">{dot.label}</span>
        </div>
      ))}
    </div>
  );
}

function SummaryPanel({ data, record }) {
  const totalInputCosts = Array.isArray(data.inputCosts)
    ? data.inputCosts.reduce((sum, ic) => sum + (ic.cost || 0), 0)
    : 0;

  const totalLabourCosts = Array.isArray(data.labourCosts)
    ? data.labourCosts.reduce((sum, lc) => sum + (lc.cost || 0), 0)
    : 0;

  const totalProductionCost = totalInputCosts + totalLabourCosts;
  const marketPrice = data.marketPriceOverride || record?.marketPriceRWF || 1200;
  const grossRevenue = (data.yield || 0) * marketPrice;
  const netBenefit = grossRevenue - totalProductionCost;
  const bcr = totalProductionCost > 0 ? grossRevenue / totalProductionCost : 0;
  const roi = totalProductionCost > 0 ? (netBenefit / totalProductionCost) * 100 : null;
  const costPerKg = data.yield > 0 ? totalProductionCost / data.yield : null;

  const format = (value) => Math.round(value).toLocaleString();

  return (
    <div className="space-y-4">
      <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
        <p className="text-xs font-semibold uppercase text-slate-500">Input Costs</p>
        <p className="mt-2 text-2xl font-bold text-slate-900">{format(totalInputCosts)} RWF</p>
      </div>

      <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
        <p className="text-xs font-semibold uppercase text-slate-500">Labour Costs</p>
        <p className="mt-2 text-2xl font-bold text-slate-900">{format(totalLabourCosts)} RWF</p>
      </div>

      <div className="rounded-[1.5rem] border border-slate-200 bg-emerald-50 p-4">
        <p className="text-xs font-semibold uppercase text-emerald-700">Total Production Cost</p>
        <p className="mt-2 text-2xl font-bold text-emerald-900">{format(totalProductionCost)} RWF</p>
      </div>

      <div
        className={`rounded-[1.5rem] border p-4 ${
          data.yield > 0
            ? 'border-emerald-200 bg-emerald-50'
            : 'border-rose-200 bg-rose-50'
        }`}
      >
        <p className="text-xs font-semibold uppercase text-slate-600">Yield</p>
        <p className={`mt-2 text-2xl font-bold ${
          data.yield > 0 ? 'text-emerald-900' : 'text-rose-900'
        }`}>
          {data.yield || '—'} kg
        </p>
      </div>

      <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
        <p className="text-xs font-semibold uppercase text-slate-500">Gross Revenue</p>
        <p className="mt-2 text-2xl font-bold text-slate-900">{format(grossRevenue)} RWF</p>
      </div>

      <div className={`rounded-[1.5rem] border p-4 ${
        netBenefit > 0
          ? 'border-emerald-200 bg-emerald-50'
          : netBenefit < 0
          ? 'border-rose-200 bg-rose-50'
          : 'border-slate-200 bg-slate-50'
      }`}>
        <p className="text-xs font-semibold uppercase text-slate-600">Net Benefit</p>
        <p className={`mt-2 text-2xl font-bold ${
          netBenefit > 0
            ? 'text-emerald-900'
            : netBenefit < 0
            ? 'text-rose-900'
            : 'text-slate-900'
        }`}>
          {format(netBenefit)} RWF
        </p>
      </div>

      <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
        <p className="text-xs font-semibold uppercase text-slate-500">BCR</p>
        <p className="mt-2 text-2xl font-bold text-slate-900">{bcr.toFixed(2)}</p>
      </div>

      <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
        <p className="text-xs font-semibold uppercase text-slate-500">ROI</p>
        <p className="mt-2 text-2xl font-bold text-slate-900">{roi != null ? `${roi.toFixed(1)}%` : '—'}</p>
      </div>

      <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
        <p className="text-xs font-semibold uppercase text-slate-500">Cost per kg</p>
        <p className="mt-2 text-2xl font-bold text-slate-900">{costPerKg != null ? `${costPerKg.toFixed(1)} RWF` : '—'}</p>
      </div>
    </div>
  );
}

function InputCostsTab({ recordId, data, onDataChange, onSave, isSaving, labels }) {
  const [form, setForm] = useState({
    date: new Date().toISOString().split('T')[0],
    item: '',
    costType: 'Material',
    quantity: '',
    unit: 'kg',
    unitCost: '',
  });

  const totalCost = form.quantity && form.unitCost ? Number(form.quantity) * Number(form.unitCost) : 0;

  const handleAddRow = async () => {
    if (!form.item || !form.quantity || !form.unitCost) return;
    const newRow = {
      date: form.date,
      item: form.item,
      costType: form.costType,
      quantity: Number(form.quantity),
      unit: form.unit,
      unitCost: Number(form.unitCost),
      cost: totalCost,
    };

    const updated = [...(data.inputCosts || []), newRow];
    onDataChange({ ...data, inputCosts: updated });

    try {
      await fetch(`/api/plots/${recordId}/inputs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRow),
      });
      onSave();
      setForm({
        date: new Date().toISOString().split('T')[0],
        item: '',
        costType: 'Material',
        quantity: '',
        unit: 'kg',
        unitCost: '',
      });
    } catch (err) {
      console.error('Failed to add input cost:', err);
    }
  };

  const handleDelete = async (index) => {
    const updated = data.inputCosts.filter((_, i) => i !== index);
    onDataChange({ ...data, inputCosts: updated });
    // TODO: Call DELETE API
  };

  return (
    <div className="space-y-6">
      <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-lg font-semibold text-slate-900">Add Input Cost</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Date</span>
            <input
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-200"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Input Item</span>
            <select
              value={form.item}
              onChange={(e) => setForm({ ...form, item: e.target.value })}
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-200"
            >
              <option value="">Select item</option>
              {INPUT_ITEMS.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Cost Type</span>
            <select
              value={form.costType}
              onChange={(e) => setForm({ ...form, costType: e.target.value })}
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-200"
            >
              {COST_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Quantity</span>
            <input
              type="number"
              value={form.quantity}
              onChange={(e) => setForm({ ...form, quantity: e.target.value })}
              min="0"
              step="0.01"
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-200"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Unit</span>
            <input
              type="text"
              value={form.unit}
              onChange={(e) => setForm({ ...form, unit: e.target.value })}
              placeholder="kg, litre, etc."
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-200"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Unit Cost (RWF)</span>
            <input
              type="number"
              value={form.unitCost}
              onChange={(e) => setForm({ ...form, unitCost: e.target.value })}
              min="0"
              step="0.01"
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-200"
            />
          </label>
        </div>
        <div className="mt-4 rounded-2xl bg-emerald-50 p-4">
          <p className="text-sm text-slate-600">Total Cost: <span className="font-bold text-slate-900">{totalCost.toLocaleString()} RWF</span></p>
        </div>
        <button
          type="button"
          onClick={handleAddRow}
          className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-emerald-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-600"
        >
          <Plus className="h-4 w-4" />
          Add Row
        </button>
      </div>

      {Array.isArray(data.inputCosts) && data.inputCosts.length > 0 && (
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="px-3 py-2 text-left font-semibold text-slate-700">Date</th>
                <th className="px-3 py-2 text-left font-semibold text-slate-700">Item</th>
                <th className="px-3 py-2 text-left font-semibold text-slate-700">Qty</th>
                <th className="px-3 py-2 text-left font-semibold text-slate-700">Unit</th>
                <th className="px-3 py-2 text-left font-semibold text-slate-700">Cost (RWF)</th>
                <th className="px-3 py-2 text-center font-semibold text-slate-700">Action</th>
              </tr>
            </thead>
            <tbody>
              {data.inputCosts.map((row, idx) => (
                <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-3 py-2">{row.date}</td>
                  <td className="px-3 py-2">{row.item}</td>
                  <td className="px-3 py-2">{row.quantity}</td>
                  <td className="px-3 py-2">{row.unit}</td>
                  <td className="px-3 py-2 font-semibold">{row.cost.toLocaleString()}</td>
                  <td className="px-3 py-2 text-center">
                    <button
                      type="button"
                      onClick={() => handleDelete(idx)}
                      className="text-rose-600 hover:text-rose-700"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function LabourCostsTab({ recordId, data, onDataChange, onSave, labels }) {
  const [form, setForm] = useState({
    date: new Date().toISOString().split('T')[0],
    practice: '',
    costType: 'Labour (hired)',
    labourers: '',
    time: '',
    timeUnit: 'hours',
    wageRate: '',
  });

  const totalCost = form.labourers && form.time && form.wageRate
    ? Number(form.labourers) * Number(form.time) * Number(form.wageRate)
    : 0;

  const handleAddRow = async () => {
    if (!form.practice || !form.labourers || !form.time || !form.wageRate) return;
    const newRow = {
      date: form.date,
      practice: form.practice,
      costType: form.costType,
      labourers: Number(form.labourers),
      time: Number(form.time),
      timeUnit: form.timeUnit,
      wageRate: Number(form.wageRate),
      cost: totalCost,
    };

    const updated = [...(data.labourCosts || []), newRow];
    onDataChange({ ...data, labourCosts: updated });

    try {
      await fetch(`/api/plots/${recordId}/labour`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRow),
      });
      onSave();
      setForm({
        date: new Date().toISOString().split('T')[0],
        practice: '',
        costType: 'Labour (hired)',
        labourers: '',
        time: '',
        timeUnit: 'hours',
        wageRate: '',
      });
    } catch (err) {
      console.error('Failed to add labour cost:', err);
    }
  };

  const handleDelete = async (index) => {
    const updated = data.labourCosts.filter((_, i) => i !== index);
    onDataChange({ ...data, labourCosts: updated });
  };

  return (
    <div className="space-y-6">
      <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-lg font-semibold text-slate-900">Add Labour Cost</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Date</span>
            <input
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-200"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Practice</span>
            <select
              value={form.practice}
              onChange={(e) => setForm({ ...form, practice: e.target.value })}
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-200"
            >
              <option value="">Select practice</option>
              {PRACTICES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Labourers</span>
            <input
              type="number"
              value={form.labourers}
              onChange={(e) => setForm({ ...form, labourers: e.target.value })}
              min="1"
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-200"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Time</span>
            <input
              type="number"
              value={form.time}
              onChange={(e) => setForm({ ...form, time: e.target.value })}
              min="0"
              step="0.5"
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-200"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Time Unit</span>
            <select
              value={form.timeUnit}
              onChange={(e) => setForm({ ...form, timeUnit: e.target.value })}
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-200"
            >
              {TIME_UNITS.map((unit) => (
                <option key={unit} value={unit}>
                  {unit}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Wage Rate (RWF/unit)</span>
            <input
              type="number"
              value={form.wageRate}
              onChange={(e) => setForm({ ...form, wageRate: e.target.value })}
              min="0"
              step="50"
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-200"
            />
          </label>
        </div>
        <div className="mt-4 rounded-2xl bg-emerald-50 p-4">
          <p className="text-sm text-slate-600">Total Cost: <span className="font-bold text-slate-900">{totalCost.toLocaleString()} RWF</span></p>
        </div>
        <button
          type="button"
          onClick={handleAddRow}
          className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-emerald-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-600"
        >
          <Plus className="h-4 w-4" />
          Add Row
        </button>
      </div>

      {Array.isArray(data.labourCosts) && data.labourCosts.length > 0 && (
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="px-3 py-2 text-left font-semibold text-slate-700">Date</th>
                <th className="px-3 py-2 text-left font-semibold text-slate-700">Practice</th>
                <th className="px-3 py-2 text-left font-semibold text-slate-700">Labourers</th>
                <th className="px-3 py-2 text-left font-semibold text-slate-700">Time</th>
                <th className="px-3 py-2 text-left font-semibold text-slate-700">Cost (RWF)</th>
                <th className="px-3 py-2 text-center font-semibold text-slate-700">Action</th>
              </tr>
            </thead>
            <tbody>
              {data.labourCosts.map((row, idx) => (
                <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-3 py-2">{row.date}</td>
                  <td className="px-3 py-2">{row.practice}</td>
                  <td className="px-3 py-2">{row.labourers}</td>
                  <td className="px-3 py-2">{row.time} {row.timeUnit}</td>
                  <td className="px-3 py-2 font-semibold">{row.cost.toLocaleString()}</td>
                  <td className="px-3 py-2 text-center">
                    <button
                      type="button"
                      onClick={() => handleDelete(idx)}
                      className="text-rose-600 hover:text-rose-700"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function YieldTab({ recordId, data, onDataChange, onSave, record, labels }) {
  const [yield_kg, setYield_kg] = useState(data.yield || '');
  const [marketPrice, setMarketPrice] = useState(data.marketPriceOverride || record?.marketPriceRWF || 1200);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await fetch(`/api/plots/${recordId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          yield: Number(yield_kg),
          marketPriceRWF: Number(marketPrice),
        }),
      });
      onDataChange({ ...data, yield: Number(yield_kg), marketPriceOverride: Number(marketPrice) });
      onSave();
    } catch (err) {
      console.error('Failed to save yield:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const grossRevenue = (yield_kg || 0) * marketPrice;

  return (
    <div className="space-y-6">
      <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="grid gap-6 md:grid-cols-2">
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Yield (kg)</span>
            <input
              type="number"
              value={yield_kg}
              onChange={(e) => setYield_kg(e.target.value)}
              min="0"
              step="0.01"
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-200"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Market Price (RWF/kg)</span>
            <input
              type="number"
              value={marketPrice}
              onChange={(e) => setMarketPrice(e.target.value)}
              min="0"
              step="50"
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-200"
            />
          </label>
        </div>

        <div className="mt-4 rounded-2xl bg-emerald-50 p-4">
          <p className="text-sm text-slate-600">
            Gross Revenue: <span className="font-bold text-slate-900">{grossRevenue.toLocaleString()} RWF</span>
          </p>
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="mt-4 rounded-2xl bg-emerald-700 px-6 py-2 text-sm font-semibold text-white transition hover:bg-emerald-600 disabled:opacity-50"
        >
          {isSaving ? 'Saving...' : 'Save Yield'}
        </button>
      </div>
    </div>
  );
}

function AgronomicTab({ recordId, data, onDataChange, onSave, labels }) {
  const [form, setForm] = useState(data.agronomicData || {});
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await fetch(`/api/plots/${recordId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agronomicData: form }),
      });
      onDataChange({ ...data, agronomicData: form });
      onSave();
    } catch (err) {
      console.error('Failed to save agronomic data:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const fields = [
    { key: 'weedProblem', label: 'Weed Problem Level (0-5)', max: 5, warning: 3 },
    { key: 'pestDamage', label: 'Pest Damage (% of plants)', max: 100, warning: 30 },
    { key: 'diseaseSeverity', label: 'Disease Severity (1-5)', max: 5, warning: null },
    { key: 'soilLife', label: 'Soil Life — earthworms visible (1-5)', max: 5, warning: null },
    { key: 'soilDarkness', label: 'Soil Darkness/Richness (1-5)', max: 5, warning: null },
    { key: 'cropVigour', label: 'Crop Health/Vigour (1-5)', max: 5, warning: null },
  ];

  return (
    <div className="space-y-6">
      <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="space-y-6">
          {fields.map(({ key, label, max, warning }) => {
            const value = form[key] || 0;
            const hasWarning = warning && value >= warning;

            return (
              <div key={key}>
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-slate-700">{label}</label>
                  <span className="text-sm font-semibold text-slate-900">{value}</span>
                </div>
                {hasWarning && (
                  <div className="mt-1 flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
                    <AlertCircle className="h-4 w-4" />
                    Alert: High {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
                  </div>
                )}
                <input
                  type="range"
                  min="0"
                  max={max}
                  step="1"
                  value={value}
                  onChange={(e) => setForm({ ...form, [key]: Number(e.target.value) })}
                  className="mt-2 w-full"
                />
                <div className="mt-1 flex justify-between text-xs text-slate-500">
                  <span>None</span>
                  <span>Severe</span>
                </div>
              </div>
            );
          })}
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="mt-6 rounded-2xl bg-emerald-700 px-6 py-2 text-sm font-semibold text-white transition hover:bg-emerald-600 disabled:opacity-50"
        >
          {isSaving ? 'Saving...' : 'Save Conditions'}
        </button>
      </div>
    </div>
  );
}

export default function FarmerDataEntry() {
  const { year, season, farmId } = useParams();
  const navigate = useNavigate();
  const { lang } = useTrialContext();
  const labels = LABELS[lang === 'kin' ? 'kin' : 'en'];

  const [record, setRecord] = useState(null);
  const [farm, setFarm] = useState(null);
  const [data, setData] = useState({
    inputCosts: [],
    labourCosts: [],
    yield: 0,
    marketPriceOverride: null,
    agronomicData: {},
  });
  const [activeTab, setActiveTab] = useState('inputCosts');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showToast, setShowToast] = useState(false);

  // Load record and farm data
  useEffect(() => {
    const load = async () => {
      try {
        // Fetch the plot record (FarmSeasonRecord)
        const recordRes = await fetch(`/api/plots/${farmId}`);
        const recordData = await recordRes.json();
        if (recordData.error) throw new Error(recordData.error);
        setRecord(recordData);

        // Fetch farm details
        const farmRes = await fetch(`/api/farms/${recordData.farmId}`);
        const farmData = await farmRes.json();
        if (farmData.error) throw new Error(farmData.error);
        setFarm(farmData);

        // Populate data from record
        setData({
          inputCosts: recordData.inputCosts || [],
          labourCosts: recordData.labourCosts || [],
          yield: recordData.yield || 0,
          marketPriceOverride: recordData.marketPriceRWF || null,
          agronomicData: recordData.agronomicData || {},
        });
      } catch (err) {
        setError(err.message || 'Failed to load data');
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [farmId]);

  const handleSave = () => {
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2000);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 p-6">
        <div className="text-center text-slate-600">Loading...</div>
      </div>
    );
  }

  if (error || !record || !farm) {
    return (
      <div className="min-h-screen bg-slate-50 p-6">
        <div className="mx-auto max-w-7xl rounded-[2rem] border border-rose-200 bg-rose-50 p-6 text-rose-700">
          <AlertCircle className="mb-2 h-5 w-5" />
          {error || 'Failed to load data entry'}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-10">
      <ScreenTopbar
        superText="Data Entry"
        title={`${farm.farmName} — Season ${season} ${year}`}
        meta={`${record.seasonCrop || 'Crop'} • ${farm.location}`}
        status="Ready"
        statusTone="synced"
      />

      <div className="mx-auto max-w-7xl space-y-8">
        {/* Header */}
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-slate-900">{farm.farmName}</h2>
              <p className="mt-1 text-sm text-slate-600">
                {farm.ownerName ? `${farm.ownerName} • ` : ''}
                {farm.location}
              </p>
            </div>
            <div className="rounded-2xl bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700">
              Season {season} {year} — {record.seasonCrop}
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <ProgressDots data={data} />
            <button
              type="button"
              onClick={() => navigate(`/setup/${year}/${season}`)}
              className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700 hover:text-slate-900"
            >
              <ChevronLeft className="h-4 w-4" />
              {labels.backToSetup}
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Summary Panel */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="mb-4 text-lg font-semibold text-slate-900">{labels.summary}</h3>
              <SummaryPanel data={data} record={record} />
            </div>
          </div>

          {/* Tabs Panel */}
          <div className="lg:col-span-2">
            <div className="rounded-[2rem] border border-slate-200 bg-white shadow-sm">
              {/* Tab Headers */}
              <div className="flex overflow-x-auto border-b border-slate-200">
                {[
                  { id: 'inputCosts', label: labels.inputCosts },
                  { id: 'labourCosts', label: labels.labourCosts },
                  { id: 'yield', label: labels.yield },
                  { id: 'farmConditions', label: labels.farmConditions },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-1 px-4 py-4 text-sm font-semibold transition ${
                      activeTab === tab.id
                        ? 'border-b-2 border-emerald-600 text-emerald-700'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              <div className="p-6">
                {activeTab === 'inputCosts' && (
                  <InputCostsTab
                    recordId={farmId}
                    data={data}
                    onDataChange={setData}
                    onSave={handleSave}
                    labels={labels}
                  />
                )}
                {activeTab === 'labourCosts' && (
                  <LabourCostsTab
                    recordId={farmId}
                    data={data}
                    onDataChange={setData}
                    onSave={handleSave}
                    labels={labels}
                  />
                )}
                {activeTab === 'yield' && (
                  <YieldTab
                    recordId={farmId}
                    data={data}
                    onDataChange={setData}
                    onSave={handleSave}
                    record={record}
                    labels={labels}
                  />
                )}
                {activeTab === 'farmConditions' && (
                  <AgronomicTab
                    recordId={farmId}
                    data={data}
                    onDataChange={setData}
                    onSave={handleSave}
                    labels={labels}
                  />
                )}
              </div>
            </div>

            {/* Analysis Button */}
            <div className="mt-6">
              <button
                type="button"
                onClick={() => navigate(`/trajectory?focus=${year}-${season}`)}
                className="w-full rounded-2xl bg-emerald-700 px-6 py-3 text-sm font-semibold text-white transition hover:bg-emerald-600"
              >
                {labels.viewAnalysis}
              </button>
            </div>
          </div>
        </div>
      </div>

      <Toast message={labels.saved} visible={showToast} />
    </div>
  );
}
