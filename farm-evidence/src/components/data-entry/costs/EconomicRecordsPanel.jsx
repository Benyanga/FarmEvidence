import { useState, useEffect } from 'react';
import ProductivitySales from './ProductivitySales';

const COLORS = {
  plotHeader: 'var(--fe-cf-border)',
  sectionHeader: 'var(--fe-green-800)',
  tableHeader: 'var(--fe-profit-pos)',
  dataRows: 'var(--fe-warning-50)',
  subtotalRows: 'var(--fe-amber-700)',
  totalProductionCost: 'var(--fe-teal-900)',
  extrapolationHeader: 'var(--fe-teal-900)',
  borders: 'var(--fe-grey-300)',
  plotSizeValue: 'var(--fe-ca-border)',
};

const INPUT_OPTIONS = [
  { value: 'Seeds', label: 'Seeds' },
  { value: 'Mulch', label: 'Mulch' },
  { value: 'Compost/Manure', label: 'Compost/Manure' },
  { value: 'Inorganic fertilizers (NPK)', label: 'Inorganic fertilizers (NPK)' },
  { value: 'Pesticides', label: 'Pesticides' },
];

const PRACTICE_OPTIONS = [
  { value: 'Land preparation (Slashing/Tilling)', label: 'Land preparation (Slashing/Tilling)', defaultType: 'C_SD' },
  { value: 'Planting', label: 'Planting', defaultType: 'C_SI' },
  { value: 'Residue management (Mulch application)', label: 'Residue management (Mulch application)', defaultType: 'C_SD' },
  { value: 'First weeding', label: 'First weeding', defaultType: 'C_SD' },
  { value: 'Second weeding', label: 'Second weeding', defaultType: 'C_SD' },
  { value: 'Irrigation', label: 'Irrigation', defaultType: 'C_SI' },
  { value: 'Pest & Disease control', label: 'Pest & Disease control', defaultType: 'C_SI' },
  { value: 'Harvesting (threshing/winnowing)', label: 'Harvesting (threshing/winnowing)', defaultType: 'C_SI' },
  { value: 'Postharvest handling (Drying/Storage)', label: 'Postharvest handling (Drying/Storage)', defaultType: 'C_SI' },
];

const COST_TYPE_OPTIONS = [
  { value: 'C_SD', label: 'System Dependent' },
  { value: 'C_SI', label: 'System Independent' },
];

const TIME_UNIT_OPTIONS = [
  { value: 'seconds', label: 'Seconds' },
  { value: 'minutes', label: 'Minutes' },
  { value: 'hours', label: 'Hours' },
  { value: 'days', label: 'Days' },
];

const tableStyles = {
  wrapper: {
    marginBottom: '24px',
    overflow: 'auto',
  },
  sectionHeader: {
    backgroundColor: COLORS.sectionHeader,
    color: 'white',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    padding: '12px 16px',
    marginBottom: '0',
    fontSize: '12px',
    letterSpacing: '0.05em',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    backgroundColor: 'white',
  },
  thead: {
    backgroundColor: COLORS.tableHeader,
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  th: {
    padding: '10px 8px',
    textAlign: 'center',
    fontSize: '12px',
    fontWeight: 'bold',
    border: `0.5px solid ${COLORS.borders}`,
  },
  td: {
    padding: '8px',
    border: `0.5px solid ${COLORS.borders}`,
    fontSize: '13px',
  },
  dataRow: {
    backgroundColor: COLORS.dataRows,
  },
  dataRowHover: {
    backgroundColor: 'var(--fe-warning-100)',
  },
  subtotalRow: {
    backgroundColor: COLORS.subtotalRows,
    color: 'white',
    fontWeight: 'bold',
  },
  input: {
    width: '100%',
    padding: '6px 4px',
    border: `1px solid ${COLORS.borders}`,
    borderRadius: '3px',
    fontSize: '13px',
    fontFamily: 'inherit',
  },
  select: {
    width: '100%',
    padding: '6px 4px',
    border: `1px solid ${COLORS.borders}`,
    borderRadius: '3px',
    fontSize: '13px',
    fontFamily: 'inherit',
  },
  numberCell: {
    textAlign: 'right',
    paddingRight: '12px',
  },
  labelCell: {
    textAlign: 'left',
  },
};

function computeTimeToWage(time, timeUnit, wagePerDay, workingHoursPerDay = 8) {
  const t = Number(time) || 0;
  const w = Number(wagePerDay) || 0;
  if (!w) return 0;

  switch (timeUnit) {
    case 'seconds':
      return (t / (workingHoursPerDay * 3600)) * w;
    case 'minutes':
      return (t / (workingHoursPerDay * 60)) * w;
    case 'hours':
      return (t / workingHoursPerDay) * w;
    case 'days':
      return t * w;
    default:
      return 0;
  }
}

function InputCostsTable({ onTotalChange }) {
  const [nextId, setNextId] = useState(8);
  const createRow = (id) => ({
    _id: `tmp-${id}`,
    date: '',
    input: '',
    costType: 'C_SD',
    quantity: '',
    unit: '',
    unitCost: '',
    totalCost: 0,
  });

  const [rows, setRows] = useState(() => Array.from({ length: 7 }, (_, index) => createRow(index + 1)));

  const computeTotal = (quantity, unitCost) => {
    const q = Number(quantity) || 0;
    const u = Number(unitCost) || 0;
    return q * u;
  };

  const subtotal = rows.reduce((sum, row) => sum + (row.totalCost || 0), 0);

  useEffect(() => {
    if (onTotalChange) onTotalChange(subtotal);
  }, [subtotal, onTotalChange]);

  const handleCellChange = (rowId, field, value) => {
    setRows(prevRows => prevRows.map(row => {
      if (row._id !== rowId) return row;
      const updated = { ...row, [field]: value };
      if (field === 'quantity' || field === 'unitCost') {
        updated.totalCost = computeTotal(updated.quantity, updated.unitCost);
      }
      return updated;
    }));
  };

  const handleAddRow = () => {
    setRows((prev) => [...prev, createRow(nextId)]);
    setNextId((prev) => prev + 1);
  };

  const handleDeleteRow = (rowId) => {
    setRows(prev => prev.filter(r => r._id !== rowId));
  };

  return (
    <div style={tableStyles.wrapper}>
      <div style={tableStyles.sectionHeader}>INPUT COSTS</div>
      <table style={tableStyles.table}>
        <thead style={tableStyles.thead}>
          <tr>
            <th style={tableStyles.th}>Date</th>
            <th style={tableStyles.th}>Input</th>
            <th style={tableStyles.th}>Cost Type</th>
            <th style={tableStyles.th}>Quantity</th>
            <th style={tableStyles.th}>Unit</th>
            <th style={tableStyles.th}>Unit Cost (RWF)</th>
            <th style={tableStyles.th}>Total Cost (RWF)</th>
            <th style={{ ...tableStyles.th, width: '30px' }}>Del</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row._id} style={tableStyles.dataRow} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = tableStyles.dataRowHover.backgroundColor} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = tableStyles.dataRow.backgroundColor}>
              <td style={{...tableStyles.td, ...tableStyles.labelCell}}>
                <input type="date" value={row.date} onChange={(e) => handleCellChange(row._id, 'date', e.target.value)} style={tableStyles.input} />
              </td>
              <td style={{...tableStyles.td, ...tableStyles.labelCell}}>
                <select value={row.input} onChange={(e) => handleCellChange(row._id, 'input', e.target.value)} style={tableStyles.select}>
                  <option value="">—</option>
                  {INPUT_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
              </td>
              <td style={{...tableStyles.td, ...tableStyles.labelCell}}>
                <select value={row.costType} onChange={(e) => handleCellChange(row._id, 'costType', e.target.value)} style={tableStyles.select}>
                  {COST_TYPE_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
              </td>
              <td style={{...tableStyles.td, ...tableStyles.numberCell}}>
                <input type="number" value={row.quantity} onChange={(e) => handleCellChange(row._id, 'quantity', e.target.value)} style={tableStyles.input} />
              </td>
              <td style={{...tableStyles.td, ...tableStyles.labelCell}}>
                <input type="text" value={row.unit} onChange={(e) => handleCellChange(row._id, 'unit', e.target.value)} placeholder="kg, L, bags" style={tableStyles.input} />
              </td>
              <td style={{...tableStyles.td, ...tableStyles.numberCell}}>
                <input type="number" value={row.unitCost} onChange={(e) => handleCellChange(row._id, 'unitCost', e.target.value)} style={tableStyles.input} />
              </td>
              <td style={{...tableStyles.td, ...tableStyles.numberCell}}>
                {(row.totalCost || 0).toLocaleString('en-RW', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </td>
              <td style={{...tableStyles.td, textAlign: 'center', width: '30px'}}>
                <button onClick={() => handleDeleteRow(row._id)} style={{ background: 'var(--fe-error-bg)', color: 'var(--fe-profit-neg)', border: 'none', borderRadius: '4px', width: '24px', height: '24px', cursor: 'pointer', fontWeight: 'bold' }}>×</button>
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr style={tableStyles.subtotalRow}>
            <td colSpan="6" style={{...tableStyles.td, ...tableStyles.labelCell}}>Subtotal — Input Costs</td>
            <td style={{...tableStyles.td, ...tableStyles.numberCell}}>
              {subtotal.toLocaleString('en-RW', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </td>
            <td style={tableStyles.td}></td>
          </tr>
        </tfoot>
      </table>
      <div style={{ marginTop: '8px' }}>
        <button onClick={handleAddRow} style={{ background: 'none', border: 'none', color: 'var(--fe-ca-border)', cursor: 'pointer', textDecoration: 'underline', fontSize: '12px', fontWeight: 600 }}>+ Add row</button>
      </div>
    </div>
  );
}

function LabourCostsTable({ workingHoursPerDay = 8, onTotalChange }) {
  const [nextId, setNextId] = useState(11);
  const createRow = (id) => ({
    _id: `tmp-${id}`,
    date: '',
    practice: '',
    costType: 'C_SD',
    time: '',
    timeUnit: 'hours',
    wageRate: '',
    totalCost: 0,
  });

  const [rows, setRows] = useState(() => Array.from({ length: 10 }, (_, index) => createRow(index + 1)));

  const computeTotal = (time, timeUnit, wageRate) => {
    return computeTimeToWage(time, timeUnit, wageRate, workingHoursPerDay);
  };

  const subtotal = rows.reduce((sum, row) => sum + (row.totalCost || 0), 0);

  useEffect(() => {
    if (onTotalChange) onTotalChange(subtotal);
  }, [subtotal, onTotalChange]);

  const handleCellChange = (rowId, field, value) => {
    setRows(prevRows => prevRows.map(row => {
      if (row._id !== rowId) return row;
      const updated = { ...row, [field]: value };
      if (field === 'time' || field === 'timeUnit' || field === 'wageRate') {
        updated.totalCost = computeTotal(updated.time, updated.timeUnit, updated.wageRate);
      }
      if (field === 'practice') {
        const practice = PRACTICE_OPTIONS.find(p => p.value === value);
        if (practice && !row.costType) {
          updated.costType = practice.defaultType;
        }
      }
      return updated;
    }));
  };

  const handleAddRow = () => {
    setRows((prev) => [...prev, createRow(nextId)]);
    setNextId((prev) => prev + 1);
  };

  const handleDeleteRow = (rowId) => {
    setRows(prev => prev.filter(r => r._id !== rowId));
  };

  return (
    <div style={tableStyles.wrapper}>
      <div style={tableStyles.sectionHeader}>LABOUR COSTS</div>
      <table style={tableStyles.table}>
        <thead style={tableStyles.thead}>
          <tr>
            <th style={tableStyles.th}>Date</th>
            <th style={tableStyles.th}>Practice</th>
            <th style={tableStyles.th}>Cost Type</th>
            <th style={tableStyles.th}>Time</th>
            <th style={tableStyles.th}>Time Unit</th>
            <th style={tableStyles.th}>Wage Rate (RWF/day)</th>
            <th style={tableStyles.th}>Total Cost (RWF)</th>
            <th style={{ ...tableStyles.th, width: '30px' }}>Del</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row._id} style={tableStyles.dataRow} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = tableStyles.dataRowHover.backgroundColor} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = tableStyles.dataRow.backgroundColor}>
              <td style={{...tableStyles.td, ...tableStyles.labelCell}}>
                <input type="date" value={row.date} onChange={(e) => handleCellChange(row._id, 'date', e.target.value)} style={tableStyles.input} />
              </td>
              <td style={{...tableStyles.td, ...tableStyles.labelCell}}>
                <select value={row.practice} onChange={(e) => handleCellChange(row._id, 'practice', e.target.value)} style={tableStyles.select}>
                  <option value="">—</option>
                  {PRACTICE_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
              </td>
              <td style={{...tableStyles.td, ...tableStyles.labelCell}}>
                <select value={row.costType} onChange={(e) => handleCellChange(row._id, 'costType', e.target.value)} style={tableStyles.select}>
                  {COST_TYPE_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
              </td>
              <td style={{...tableStyles.td, ...tableStyles.numberCell}}>
                <input type="number" value={row.time} onChange={(e) => handleCellChange(row._id, 'time', e.target.value)} style={tableStyles.input} />
              </td>
              <td style={{...tableStyles.td, ...tableStyles.labelCell}}>
                <select value={row.timeUnit} onChange={(e) => handleCellChange(row._id, 'timeUnit', e.target.value)} style={tableStyles.select}>
                  {TIME_UNIT_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
              </td>
              <td style={{...tableStyles.td, ...tableStyles.numberCell}}>
                <input type="number" value={row.wageRate} onChange={(e) => handleCellChange(row._id, 'wageRate', e.target.value)} style={tableStyles.input} />
              </td>
              <td style={{...tableStyles.td, ...tableStyles.numberCell}}>
                {(row.totalCost || 0).toLocaleString('en-RW', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </td>
              <td style={{...tableStyles.td, textAlign: 'center', width: '30px'}}>
                <button onClick={() => handleDeleteRow(row._id)} style={{ background: 'var(--fe-error-bg)', color: 'var(--fe-profit-neg)', border: 'none', borderRadius: '4px', width: '24px', height: '24px', cursor: 'pointer', fontWeight: 'bold' }}>×</button>
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr style={tableStyles.subtotalRow}>
            <td colSpan="6" style={{...tableStyles.td, ...tableStyles.labelCell}}>Subtotal — Labour Costs</td>
            <td style={{...tableStyles.td, ...tableStyles.numberCell}}>
              {subtotal.toLocaleString('en-RW', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </td>
            <td style={tableStyles.td}></td>
          </tr>
        </tfoot>
      </table>
      <div style={{ marginTop: '8px' }}>
        <button onClick={handleAddRow} style={{ background: 'none', border: 'none', color: 'var(--fe-ca-border)', cursor: 'pointer', textDecoration: 'underline', fontSize: '12px', fontWeight: 600 }}>+ Add row</button>
      </div>
    </div>
  );
}

export default function EconomicRecordsPanel({ 
  plotId, 
  plotSizeM2 = 100,
  onPlotSizeChange,
  workingHoursPerDay = 8,
}) {
  const [plotSize, setPlotSize] = useState(plotSizeM2);
  const [inputTotal, setInputTotal] = useState(0);
  const [labourTotal, setLabourTotal] = useState(0);

  const handlePlotSizeChange = (newSize) => {
    setPlotSize(newSize);
    if (onPlotSizeChange) onPlotSizeChange(newSize);
  };

  // Reactive calculations from source values
  const plotSizeHa = plotSize > 0 ? plotSize / 10000 : 0;
  const totalProductionCost = inputTotal + labourTotal;
  
  // Cost extrapolation formulas — IFERROR equivalent (show 0.00 on division by zero)
  const costPerM2 = plotSize > 0 ? totalProductionCost / plotSize : 0;
  const costPerHa = plotSizeHa > 0 ? totalProductionCost / plotSizeHa : 0;

  return (
    <div style={{ display: 'grid', gap: '16px' }}>
      {/* Plot Size Section */}
      <div style={{ display: 'flex', gap: '24px', alignItems: 'center', padding: '12px', backgroundColor: 'var(--fe-grey-050)', borderRadius: '4px' }}>
        <div>
          <span style={{ fontSize: '12px', color: 'var(--fe-grey-500)', fontWeight: 600 }}>Plot Size (m²):</span>
          <input 
            type="number" 
            value={plotSize} 
            onChange={(e) => handlePlotSizeChange(Number(e.target.value))} 
            style={{
              ...tableStyles.input,
              color: COLORS.plotSizeValue,
              fontWeight: 'bold',
              fontSize: '14px',
              width: '120px',
              marginLeft: '8px',
            }}
          />
        </div>
        <div>
          <span style={{ fontSize: '12px', color: 'var(--fe-grey-500)', fontWeight: 600 }}>Plot Size (ha):</span>
          <span style={{ ...tableStyles.input, display: 'inline-block', marginLeft: '8px', backgroundColor: 'var(--fe-grey-100)', cursor: 'default', width: '120px', textAlign: 'right', color: 'var(--fe-grey-900)' }}>
            {plotSizeHa.toFixed(4)}
          </span>
        </div>
      </div>

      {/* Tables */}
      <InputCostsTable onTotalChange={setInputTotal} />
      <LabourCostsTable workingHoursPerDay={workingHoursPerDay} onTotalChange={setLabourTotal} />

      {/* Total Production Cost Bar */}
      <div style={{
        backgroundColor: COLORS.totalProductionCost,
        color: 'white',
        padding: '12px 16px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontWeight: 'bold',
      }}>
        <span>TOTAL PRODUCTION COST</span>
        <span style={{ fontSize: '18px' }}>
          {totalProductionCost.toLocaleString('en-RW', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
      </div>

      {/* Cost Extrapolation Section */}
      <div style={{
        backgroundColor: COLORS.extrapolationHeader,
        color: 'white',
        padding: '12px 16px',
        fontWeight: 'bold',
        marginTop: '12px',
      }}>
        COST EXTRAPOLATION
      </div>
      <div style={{ display: 'grid', gap: '8px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 16px', backgroundColor: 'white', border: `0.5px solid ${COLORS.borders}` }}>
          <span style={{ color: 'var(--fe-grey-900)' }}>Cost per m²</span>
          <span style={{ color: 'var(--fe-grey-900)', textAlign: 'right' }}>
            {costPerM2.toLocaleString('en-RW', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} RWF/m²
          </span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 16px', backgroundColor: 'white', border: `0.5px solid ${COLORS.borders}` }}>
          <span style={{ color: 'var(--fe-grey-900)' }}>Cost per ha (extrapolated)</span>
          <span style={{ color: 'var(--fe-grey-900)', textAlign: 'right' }}>
            {costPerHa.toLocaleString('en-RW', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} RWF/ha
          </span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 16px', backgroundColor: 'white', border: `0.5px solid ${COLORS.borders}` }}>
          <span style={{ color: 'var(--fe-grey-900)' }}>Total Production Cost</span>
          <span style={{ color: 'var(--fe-grey-900)', textAlign: 'right', fontWeight: 'bold' }}>
            {totalProductionCost.toLocaleString('en-RW', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} RWF
          </span>
        </div>
      </div>
      {/* Productivity & Sales - record total yield and sales */}
      <ProductivitySales plotId={plotId} extrapolationFactor={plotSize > 0 ? 10000 / plotSize : 1} />
    </div>
  );
}

