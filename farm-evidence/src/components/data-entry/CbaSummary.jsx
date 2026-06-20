
import { useEffect, useState } from 'react';
import { useComputationStore } from '../../store/computationStore';
import { useSessionStore } from '../../store/sessionStore';
import { ScreenTopbar } from '../../components/shared/ScreenTopbar';
import schema from '../../utils/plotSchema.json';
import { exportToXlsx } from '../../utils/cbaExport';

export default function CbaSummary({ mode = 'FARMER', id }) {
  const activeFarm = useSessionStore((s) => s.activeFarm);
  const localResults = useComputationStore((s) => s.results);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [remoteData, setRemoteData] = useState(null);
  const local = localResults?.[id];
  const data = mode === 'FARMER' && local ? local : remoteData;

  useEffect(() => {
    if (!id) return;
    if (mode === 'FARMER' && local) return;

    const url = mode === 'RESEARCH' ? `/api/trial-results/${id}` : `/api/computation-results/${id}`;
    let mounted = true;
    (async () => {
      Promise.resolve().then(() => { if (mounted) setLoading(true); });
      setError(null);
      try {
        const r = await fetch(url, { method: 'GET' });
        const j = await r.json();
        if (!mounted) return;
        if (!j.ok) throw new Error(j.error || j.message || 'API error');
        setRemoteData(j.data);
      } catch (e) {
        if (mounted) setError(e.message);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [mode, id, local]);

  if (!id) return null;
  if (loading) return <div className="dashboard-panel__content">Loading CBA summary…</div>;
  if (error) return <div className="dashboard-panel__content" style={{ color: 'var(--fe-profit-neg)' }}>Error: {error}</div>;
  if (!data) return null;

  const activeFarmLabel = activeFarm?.farmName || activeFarm?.farm_name || activeFarm?.trial_name || activeFarm?.site_name || null;
  const topbarTitle = mode === 'RESEARCH' ? 'CBA Results' : 'CBA Summary';
  const topbarMeta = `Record ${id}`;
  const topbarStatus = 'Ready';

  if (mode === 'RESEARCH') {
    // Prefer per-plot rows when available (detailed export); otherwise fall back to per-treatment summary
    // Prefer per-plot rows when available (detailed export); otherwise fall back to per-treatment summary
    const plotRowsRaw = data.plots || null;
    let rows = [];
    if (Array.isArray(plotRowsRaw) && plotRowsRaw.length > 0) {
      rows = plotRowsRaw.map(p => ({
        'Plot ID': p.plotId || '',
        'Treatment': p.treatment || '',
        'Replicate': p.replicate || '',
        'Plot Size (m²)': p.plot_size_m2 || '',
        'Plot Size (ha)': p.plot_size_ha || '',
        'Total Input Cost': p.total_input_cost || '',
        'Total Labour Cost': p.total_labour_cost || '',
        'Total Cost': p.total_cost || '',
        'Yield (kg/plot)': p.yield_kg_plot || '',
        'Yield (kg/ha)': p.yield_kg_ha || '',
        'Value (RWF/ha)': p.value_rwf_ha || '',
        'Net Benefit': p.net_benefit || ''
      }));
    } else {
      const treatments = data.treatments || [];
      rows = treatments.map(t => ({
        'Plot ID': t,
        'Treatment': t,
        'Replicate': '',
        'Plot Size (m²)': '',
        'Plot Size (ha)': '',
        'Total Input Cost': data.c_system_ha?.[t] || '',
        'Total Labour Cost': '',
        'Total Cost': data.c_system_ha?.[t] || '',
        'Yield (kg/plot)': '',
        'Yield (kg/ha)': '',
        'Value (RWF/ha)': data.revenue_ha?.[t] || '',
        'Net Benefit': data.profit_ha?.[t] || ''
      }));
    }

    return (
      <>
        <ScreenTopbar
          superText="Cost-Benefit Analysis"
          title={topbarTitle}
          meta={topbarMeta}
          mode={mode}
          status={topbarStatus}
          activeFarmLabel={activeFarmLabel}
        />
        <div className="dashboard-panel">
          <div className="dashboard-panel__header">
            <div className="dashboard-panel__icon dashboard-panel__icon--info" />
            <div>
              <div className="dashboard-panel__title">CBA Summary (Research)</div>
              <div className="dashboard-panel__subtitle">Per-treatment / per-plot summary</div>
            </div>
          </div>
          <div className="dashboard-panel__content">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div />
              <div>
                <button className="btn btn--small" onClick={() => exportToXlsx('trial-cba.xlsx', 'CBA', schema.cbaSummaryColumns, rows)}>Export XLSX</button>
              </div>
            </div>
            <table className="dashboard-table" style={{ marginTop: 8 }}>
              <thead>
                <tr>
                  {schema.cbaSummaryColumns.map(col => <th key={col}>{col}</th>)}
                </tr>
              </thead>
              <tbody>
                {rows.map((r, idx) => (
                  <tr key={idx}>
                    {schema.cbaSummaryColumns.map((col) => <td key={col}>{r[col] !== undefined ? r[col] : ''}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ marginTop: 8 }}>
              <div>p-value: {data.p_value}</div>
              <div>Cohen's d: {data.cohens_d}</div>
            </div>
          </div>
        </div>
      </>
    );
  }

  // FARMER mode: single aggregated set
  const costPerHa = data.sessionData?.inputCosts?.reduce((sum, c) => sum + c.amount, 0) || 0;
  const labourPerHa = data.sessionData?.labourCosts?.reduce((sum, c) => sum + c.amount, 0) || 0;
  const farmerRow = {
    'Plot ID': data.season_id || id,
    'Treatment': data.season_id || id,
    'Replicate': '',
    'Plot Size (m²)': '',
    'Plot Size (ha)': '',
    'Total Input Cost': costPerHa || '',
    'Total Labour Cost': labourPerHa || '',
    'Total Cost': (costPerHa + labourPerHa) || data.c_system_ha || '',
    'Yield (kg/plot)': data.yield_kg_plot || '',
    'Yield (kg/ha)': data.yield_kg_ha || data.sessionData?.revenue?.yield_kg_ha || '',
    'Value (RWF/ha)': data.revenue_ha || data.steps?.revenue || '',
    'Net Benefit': data.profit_ha || data.steps?.profit || ''
  };

  return (
    <>
      <ScreenTopbar
        superText="Cost-Benefit Analysis"
        title={topbarTitle}
        meta={topbarMeta}
        mode={mode}
        status={topbarStatus}
        activeFarmLabel={activeFarmLabel}
      />
      <div className="dashboard-panel">
        <div className="dashboard-panel__header">
          <div className="dashboard-panel__icon dashboard-panel__icon--neutral" />
          <div>
            <div className="dashboard-panel__title">CBA Summary (Farmer)</div>
            <div className="dashboard-panel__subtitle">Season summary per ha</div>
          </div>
        </div>
        <div className="dashboard-panel__content">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div />
            <div>
              <button className="btn btn--small" onClick={() => exportToXlsx('farm-cba.xlsx', 'CBA', schema.cbaSummaryColumns, [farmerRow])}>Export XLSX</button>
            </div>
          </div>
          <table className="dashboard-table" style={{ marginTop: 8 }}>
            <thead>
              <tr>{schema.cbaSummaryColumns.map(c => <th key={c}>{c}</th>)}</tr>
            </thead>
            <tbody>
              <tr>{schema.cbaSummaryColumns.map(c => <td key={c}>{farmerRow[c]}</td>)}</tr>
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
