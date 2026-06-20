import { useAnalysis } from '../hooks/useAnalysis';
import { KPICard } from '../components/shared/KPICard';
import { fmtRWF, fmtKg, fmtRatio, fmtPct } from '../utils/formatters';

export function Summary({ trialId }) {
  const { analysis, loading } = useAnalysis(trialId);
  if (loading || !analysis) return <div className="p-8 text-center text-gray-400">Loading analysis...</div>;

  const { cba } = analysis;
  const { ca, cf } = cba;

  const indicators = [
    { label: 'Avg Gross Revenue (RWF/plot)', caV: ca.avgRevenue,    cfV: cf.avgRevenue,    fmt: fmtRWF,   adv: ca.avgRevenue > cf.avgRevenue ? 'CA' : 'CF' },
    { label: 'Avg Total Production Cost',   caV: ca.avgTPC,        cfV: cf.avgTPC,        fmt: fmtRWF,   adv: ca.avgTPC < cf.avgTPC ? 'CA' : 'CF' },
    { label: 'Net Benefit (RWF/plot)',      caV: ca.netBenefit,    cfV: cf.netBenefit,    fmt: fmtRWF,   adv: ca.netBenefit > cf.netBenefit ? 'CA' : 'CF' },
    { label: 'Benefit-Cost Ratio',          caV: ca.bcr,           cfV: cf.bcr,           fmt: fmtRatio, adv: ca.bcr > cf.bcr ? 'CA' : 'CF' },
    { label: 'ROI (%)',                     caV: ca.roi,           cfV: cf.roi,           fmt: v => `${(+v).toFixed(1)}%`, adv: ca.roi > cf.roi ? 'CA' : 'CF' },
    { label: 'Avg Yield (kg/plot)',         caV: ca.avgYield,      cfV: cf.avgYield,      fmt: fmtKg,    adv: ca.avgYield > cf.avgYield ? 'CA' : 'CF' },
    { label: 'Cost per kg (RWF/kg)',        caV: ca.costPerKg,     cfV: cf.costPerKg,     fmt: fmtRWF,   adv: ca.costPerKg < cf.costPerKg ? 'CA' : 'CF' },
    { label: 'Avg C_SD Cost (RWF)',         caV: ca.avgCSD,        cfV: cf.avgCSD,        fmt: fmtRWF,   adv: null },
    { label: 'Avg C_SI Cost (RWF)',         caV: ca.avgCSI,        cfV: cf.avgCSI,        fmt: fmtRWF,   adv: null }
  ];

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-xl font-bold text-gray-800">Cost-Benefit Analysis — CA vs CF</h1>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {indicators.map(ind => (
          <KPICard key={ind.label} label={ind.label}
            caValue={ind.caV} cfValue={ind.cfV}
            format={ind.fmt} advantage={ind.adv} />
        ))}
      </div>

      <div className="bg-white rounded-xl shadow p-4">
        <h2 className="font-semibold text-gray-700 mb-3">Labour Differential</h2>
        <div className="flex gap-8 text-sm flex-wrap">
          <div><span className="text-gray-500">Avg Labour Time CA:</span> <strong>{ca.avgLabourTime?.toFixed(0)} min</strong></div>
          <div><span className="text-gray-500">Avg Labour Time CF:</span> <strong>{cf.avgLabourTime?.toFixed(0)} min</strong></div>
          <div><span className="text-gray-500">Time Saved (CF−CA):</span> <strong className="text-green-700">{cba.labourTimeDiff?.toFixed(2)} min</strong></div>
        </div>
      </div>

      <div className="overflow-x-auto bg-white rounded-xl shadow">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left text-gray-600">Indicator</th>
              <th className="px-4 py-2 text-right text-green-700">CA/plot</th>
              <th className="px-4 py-2 text-right text-green-600">CA/ha</th>
              <th className="px-4 py-2 text-right text-blue-700">CF/plot</th>
              <th className="px-4 py-2 text-right text-blue-600">CF/ha</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {[
              ['Gross Revenue',      fmtRWF, 'avgRevenue',  'revenue'],
              ['Total Cost',         fmtRWF, 'avgTPC',      'tpc'],
              ['Net Benefit',        fmtRWF, 'netBenefit',  'netBenefit'],
              ['Avg Yield',          fmtKg,  'avgYield',    'yield']
            ].map(([label, fmt, plotKey, haKey]) => (
              <tr key={label} className="hover:bg-gray-50">
                <td className="px-4 py-2 text-gray-700">{label}</td>
                <td className="px-4 py-2 text-right">{fmt(ca[plotKey])}</td>
                <td className="px-4 py-2 text-right text-gray-500">{fmt(ca.perHa?.[haKey])}</td>
                <td className="px-4 py-2 text-right">{fmt(cf[plotKey])}</td>
                <td className="px-4 py-2 text-right text-gray-500">{fmt(cf.perHa?.[haKey])}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
