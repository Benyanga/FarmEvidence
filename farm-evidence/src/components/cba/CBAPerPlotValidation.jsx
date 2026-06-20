// Validation block for per-plot data entry
import { usePlotDataStore } from '../../store/plotDataStore';

export function CBAPerPlotValidation({ plotId }) {
  const plotData = usePlotDataStore((s) => s.plots[plotId] || {});
  const errors = [];

  // Input Costs validation
  (plotData.inputCosts || []).forEach((row, idx) => {
    if ((row.quantity && !row.unitCost) || (!row.quantity && row.unitCost)) {
      errors.push({
        label: `Input Costs row ${idx + 1}: Enter both Quantity and Unit Cost`,
        field: `inputCosts-${idx}`
      });
    }
    if (row.costType !== 'C_SD' && row.costType !== 'C_SI') {
      errors.push({
        label: `Input Costs row ${idx + 1}: Select Cost Type`,
        field: `inputCosts-costType-${idx}`
      });
    }
  });

  // Labour Costs validation
  (plotData.labourCosts || []).forEach((row, idx) => {
    if (row.time && !row.wageRate) {
      errors.push({
        label: `Labour Costs row ${idx + 1}: Enter Wage Rate`,
        field: `labourCosts-wageRate-${idx}`
      });
    }
    if (row.costType !== 'C_SD' && row.costType !== 'C_SI') {
      errors.push({
        label: `Labour Costs row ${idx + 1}: Select Cost Type`,
        field: `labourCosts-costType-${idx}`
      });
    }
  });

  if (errors.length === 0) return null;

  return (
    <div className="alert alert-warning mt-2">
      <div className="fw-bold mb-1">Validation Issues</div>
      <ul className="mb-0 small">
        {errors.map((err, i) => (
          <li key={i}><a href={`#${err.field}`}>{err.label}</a></li>
        ))}
      </ul>
    </div>
  );
}
