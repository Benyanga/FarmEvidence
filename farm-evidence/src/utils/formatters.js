export const fmtRWF  = (v) => v == null ? '—' : `${Math.round(v).toLocaleString()} RWF`;
export const fmtKg   = (v) => v == null ? '—' : `${(+v).toFixed(2)} kg`;
export const fmtPct  = (v) => v == null ? '—' : `${(+v * 100).toFixed(1)}%`;
export const fmtRatio = (v) => v == null ? '—' : (+v).toFixed(3);
export const fmtP    = (v) => {
  if (v == null) return '—';
  if (typeof v === 'string') return v;   // handles '<0.001'
  return v < 0.001 ? '<0.001' : v.toFixed(4);
};
export const sigLabel = (significant) => significant
  ? { text: 'Significant *', color: 'text-green-700 bg-green-100' }
  : { text: 'Not significant (ns)', color: 'text-gray-600 bg-gray-100' };
