import { useEffect, useState } from 'react';
import * as rcbdApi from '../../services/rcbdApi';
import { usePlotDataStore } from '../../store/plotDataStore';

export function RCBDPlotEntryPanel() {
  const [plots, setPlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const plotDataStore = usePlotDataStore();

  useEffect(() => {
    setLoading(true);
    rcbdApi.getPlots()
      .then((data) => {
        setPlots(data || []);
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to load plots');
        setLoading(false);
      });
  }, []);

  const handleChange = (plotId, field, value) => {
    plotDataStore.setPlot(plotId, { [field]: value });
  };

  const handleSave = async (plotId) => {
    setLoading(true);
    setError('');
    try {
      await rcbdApi.setPlotData(plotId, plotDataStore.plots[plotId] || {});
    } catch (e) {
      setError('Failed to save plot data');
    }
    setLoading(false);
  };

  return (
    <div className="card card--minimal">
      <h2 className="heading-2 mb-2">RCBD Plot Data Entry</h2>
      {error && <div className="state-caution mb-2">{error}</div>}
      <div className="overflow-x-auto">
        <table className="table-auto w-full text-sm">
          <thead>
            <tr>
              <th>Plot ID</th>
              <th>Treatment</th>
              <th>Replicate</th>
              <th>Yield (kg)</th>
              <th>Price</th>
              <th>Notes</th>
              <th>Save</th>
            </tr>
          </thead>
          <tbody>
            {plots.map((plot) => (
              <tr key={plot.plotId}>
                <td>{plot.plotId}</td>
                <td>{plot.treatment}</td>
                <td>{plot.replicate}</td>
                <td>
                  <input type="number" value={plotDataStore.plots[plot.plotId]?.yield || ''} onChange={e => handleChange(plot.plotId, 'yield', e.target.value)} className="field-input" />
                </td>
                <td>
                  <input type="number" value={plotDataStore.plots[plot.plotId]?.price || ''} onChange={e => handleChange(plot.plotId, 'price', e.target.value)} className="field-input" />
                </td>
                <td>
                  <input value={plotDataStore.plots[plot.plotId]?.notes || ''} onChange={e => handleChange(plot.plotId, 'notes', e.target.value)} className="field-input" />
                </td>
                <td>
                  <button className="btn btn-primary btn-sm" onClick={() => handleSave(plot.plotId)} disabled={loading}>Save</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
