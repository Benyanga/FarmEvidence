// Section 1: Plot Configuration Table
import { useTrialConfigStore } from '../../store/trialConfigStore';
import { usePlotDataStore } from '../../store/plotDataStore';
import { generatePlots } from '../../utils/rcbdUtils';

export function CBAPanelPlotConfig() {
  const config = useTrialConfigStore();
  const plotDataStore = usePlotDataStore();
  const plots = generatePlots(config.treatments, config.replications);

  const handlePlotSizeChange = (plotId, value) => {
    plotDataStore.setPlot(plotId, { plotSizeM2: value });
  };

  return (
    <div className="table-responsive p-3">
      <table className="table table-bordered align-middle mb-0">
        <thead className="table-light">
          <tr>
            <th>Plot ID</th>
            <th>Treatment</th>
            <th>Replicate</th>
            <th className="bg-warning">Plot Size (m²)</th>
            <th>Plot Size (ha)</th>
          </tr>
        </thead>
        <tbody>
          {plots.map((plot) => {
            const plotSizeM2 = plotDataStore.plots[plot.plotId]?.plotSizeM2 ?? config.plotSizeM2;
            const plotSizeHa = plotSizeM2 > 0 ? plotSizeM2 / 10000 : '';
            return (
              <tr key={plot.plotId}>
                <td>{plot.plotId}</td>
                <td>{plot.treatment}</td>
                <td>{plot.replicate}</td>
                <td className="bg-warning">
                  <input
                    type="number"
                    className="form-control form-control-sm"
                    value={plotSizeM2}
                    onChange={e => handlePlotSizeChange(plot.plotId, Number(e.target.value))}
                  />
                </td>
                <td>{plotSizeHa ? plotSizeHa.toLocaleString('en-RW', { maximumFractionDigits: 4 }) : '—'}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <div className="form-text mt-2">Edit m² values directly — ha and all extrapolation figures update automatically.</div>
    </div>
  );
}
