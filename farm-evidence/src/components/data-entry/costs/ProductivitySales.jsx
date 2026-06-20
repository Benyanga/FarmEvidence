import { useEffect, useMemo, useState } from 'react';
import { usePlotRecordingStore } from '../../../store/plotRecordingStore';

export default function ProductivitySales({ plotId, extrapolationFactor = 1 }) {
  const setRevenue = usePlotRecordingStore((s) => s.setRevenue);
  const updatePlotAgronomicRecord = usePlotRecordingStore((s) => s.updatePlotAgronomicRecord);

  const [tons, setTons] = useState('');
  const [kgs, setKgs] = useState('');
  const [grams, setGrams] = useState('');
  const [soldQty, setSoldQty] = useState('');
  const [price, setPrice] = useState('');

  const totalKg = useMemo(() => {
    const t = Number(tons) || 0;
    const k = Number(kgs) || 0;
    const g = Number(grams) || 0;
    return t * 1000 + k + g / 1000;
  }, [tons, kgs, grams]);

  const numericPrice = Number(price) || 0;
  const remaining = Math.max(totalKg - (Number(soldQty) || 0), 0);
  const revenue = (Number(soldQty) || 0) * numericPrice;
  const numericFactor = Number(extrapolationFactor) || 1;

  useEffect(() => {
    const hasInputs = tons !== '' || kgs !== '' || grams !== '' || soldQty !== '' || price !== '';
    if (!hasInputs) {
      return;
    }

    setRevenue(totalKg, numericPrice, numericFactor);
    updatePlotAgronomicRecord(plotId, {
      yield_kg: totalKg,
      yield_kg_ha: totalKg * numericFactor,
    });
  }, [plotId, totalKg, numericPrice, numericFactor, price, tons, kgs, grams, soldQty, setRevenue, updatePlotAgronomicRecord]);

  return (
    <div style={{ padding: '12px', borderRadius: '8px', background: 'var(--fe-white)', border: '1px solid var(--fe-grey-200)' }}>
      <div style={{ fontWeight: 600, marginBottom: 8 }}>Productivity & Sales</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div>
          <div style={{ fontSize: 12, color: 'var(--fe-grey-700)' }}>Total yield</div>
          <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
            <input
              type="number"
              min="0"
              value={tons}
              onChange={(e) => setTons(e.target.value)}
              placeholder="t"
              style={{ width: 60, padding: 6 }}
            />
            <input
              type="number"
              min="0"
              value={kgs}
              onChange={(e) => setKgs(e.target.value)}
              placeholder="kg"
              style={{ width: 80, padding: 6 }}
            />
            <input
              type="number"
              min="0"
              value={grams}
              onChange={(e) => setGrams(e.target.value)}
              placeholder="g"
              style={{ width: 80, padding: 6 }}
            />
          </div>
        </div>

        <div>
          <div style={{ fontSize: 12, color: 'var(--fe-grey-700)' }}>Sales</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 6 }}>
            <input
              type="number"
              min="0"
              value={soldQty}
              onChange={(e) => setSoldQty(e.target.value)}
              placeholder="sold kg"
              style={{ padding: 6 }}
            />
            <input
              type="number"
              min="0"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="price/kg"
              style={{ padding: 6 }}
            />
          </div>
          <div style={{ display: 'flex', gap: 12, marginTop: 8, alignItems: 'center' }}>
            <div style={{ fontSize: 12, color: 'var(--fe-grey-600)' }}>Remaining (kg)</div>
            <div style={{ fontWeight: 700 }}>{remaining.toFixed(1)}</div>
            <div style={{ fontSize: 12, color: 'var(--fe-grey-600)' }}>Revenue</div>
            <div style={{ fontWeight: 700 }}>{revenue.toFixed(0)} RWF</div>
          </div>
        </div>
      </div>
    </div>
  );
}
