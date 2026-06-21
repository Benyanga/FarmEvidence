import AdoptionTrendChart from './AdoptionTrendChart';

function computeTrendDirection(values) {
  if (!Array.isArray(values) || values.length === 0) return { trendDirection: 'Stable', deltas: [] };
  if (values.every((v) => v === 0)) return { trendDirection: 'Zero', deltas: values.map((_, i) => (i === 0 ? null : 0)) };
  let inc = 0, dec = 0;
  const deltas = values.map((v, i) => (i === 0 ? null : v - values[i - 1]));
  for (let i = 1; i < values.length; i += 1) {
    if (values[i] > values[i - 1]) inc += 1;
    if (values[i] < values[i - 1]) dec += 1;
  }
  if (inc >= 2) return { trendDirection: 'Increasing', deltas };
  if (dec >= 2) return { trendDirection: 'Decreasing', deltas };
  return { trendDirection: 'Stable', deltas };
}

export default function AdoptionTrendPanel({ adoptionCostHistory = [] }) {
  const values = Array.isArray(adoptionCostHistory) ? adoptionCostHistory : [];
  const { trendDirection, deltas } = computeTrendDirection(values);

  // TTP: if last two seasons are zero (adoption cost == 0)
  const lastTwoZero = values.length >= 2 && values[values.length - 1] === 0 && values[values.length - 2] === 0;

  const showTTP = trendDirection === 'Zero' || lastTwoZero;
  const showAdvisory = trendDirection === 'Increasing';

  return (
    <div style={{ marginTop: 12 }}>
      <AdoptionTrendChart values={values} />
      <div style={{ marginTop: 10, display: 'flex', gap: 12 }}>
        {showTTP && (
          <div style={{ background: 'var(--fe-green-50)', borderRadius: 8, padding: 12, border: '1px solid var(--fe-green-300)' }}>
            <div style={{ fontWeight: 700, color: 'var(--fe-green-900)' }}>TTP reached</div>
            <div style={{ color: 'var(--fe-grey-600)', marginTop: 6 }}>Adoption cost has been at or near zero for recent seasons; CA has reached parity with CF.</div>
          </div>
        )}

        {showAdvisory && (
          <div style={{ background: 'var(--fe-warning-50)', borderRadius: 8, padding: 12, border: '1px solid var(--fe-amber-400)' }}>
            <div style={{ fontWeight: 700, color: 'var(--fe-amber-700)' }}>Advisory: adoption cost increasing</div>
            <div style={{ color: 'var(--fe-grey-600)', marginTop: 6 }}>
              The adoption-cost gap has increased for multiple seasons. Review potential causes: implementation fidelity, input price changes, pest/disease, or yield shocks. Consider targeted troubleshooting and cost-reduction strategies.
            </div>
          </div>
        )}

        {!showTTP && !showAdvisory && (
          <div style={{ background: 'var(--fe-white)', borderRadius: 8, padding: 12, border: '1px solid var(--fe-grey-200)' }}>
            <div style={{ fontWeight: 700, color: 'var(--fe-grey-900)' }}>Trend: {trendDirection}</div>
            <div style={{ color: 'var(--fe-grey-600)', marginTop: 6 }}>Adoption cost is {trendDirection.toLowerCase()} over recorded seasons.</div>
          </div>
        )}
      </div>
    </div>
  );
}
