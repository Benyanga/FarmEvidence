import { useAnalysis } from '../hooks/useAnalysis';
import { fmtP, sigLabel, fmtRWF, fmtKg } from '../utils/formatters';

export function StatisticalAnalysis({ trialId }) {
  const { analysis, loading } = useAnalysis(trialId);
  if (loading || !analysis) return <div className="p-8 text-center text-gray-400">Loading...</div>;

  const { stats } = analysis;
  const tests = [
    { variable: 'Yield (kg/plot)',          key: 'yield',       fmtMean: fmtKg  },
    { variable: 'Gross Margin (RWF/plot)',  key: 'grossMargin', fmtMean: fmtRWF },
    { variable: 'C_SD Cost (RWF/plot)',     key: 'csd',         fmtMean: fmtRWF }
  ];

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-xl font-bold text-gray-800">Statistical Analysis — Independent-Samples t-Test</h1>
      <p className="text-sm text-gray-500">Two-tailed, α = 0.05, df = 6, t-critical = 2.447</p>

      <div className="bg-white rounded-xl shadow overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left">Variable</th>
              <th className="px-4 py-2 text-left">Treatment</th>
              <th className="px-4 py-2 text-right">n</th>
              <th className="px-4 py-2 text-right">Mean</th>
              <th className="px-4 py-2 text-right">SD</th>
              <th className="px-4 py-2 text-right">SE</th>
              <th className="px-4 py-2 text-right">95% CI</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {tests.flatMap(({ variable, key, fmtMean }) => {
              const ca = stats[key].descCA;
              const cf = stats[key].descCF;
              const tci = stats[key].tTest;
              const ciCA_L = ca.mean - tci.tCritical * ca.se;
              const ciCA_U = ca.mean + tci.tCritical * ca.se;
              const ciCF_L = cf.mean - tci.tCritical * cf.se;
              const ciCF_U = cf.mean + tci.tCritical * cf.se;
              return [
                <tr key={`${key}-ca`} className="hover:bg-gray-50">
                  <td className="px-4 py-2 text-gray-700 font-medium" rowSpan={2}>{variable}</td>
                  <td className="px-4 py-2 text-green-700 font-semibold">CA</td>
                  <td className="px-4 py-2 text-right">{ca.n}</td>
                  <td className="px-4 py-2 text-right">{fmtMean(ca.mean)}</td>
                  <td className="px-4 py-2 text-right">{fmtMean(ca.sd)}</td>
                  <td className="px-4 py-2 text-right">{fmtMean(ca.se)}</td>
                  <td className="px-4 py-2 text-right text-xs">[{fmtMean(ciCA_L)}, {fmtMean(ciCA_U)}]</td>
                </tr>,
                <tr key={`${key}-cf`} className="hover:bg-gray-50 border-b-2 border-gray-200">
                  <td className="px-4 py-2 text-blue-700 font-semibold">CF</td>
                  <td className="px-4 py-2 text-right">{cf.n}</td>
                  <td className="px-4 py-2 text-right">{fmtMean(cf.mean)}</td>
                  <td className="px-4 py-2 text-right">{fmtMean(cf.sd)}</td>
                  <td className="px-4 py-2 text-right">{fmtMean(cf.se)}</td>
                  <td className="px-4 py-2 text-right text-xs">[{fmtMean(ciCF_L)}, {fmtMean(ciCF_U)}]</td>
                </tr>
              ];
            })}
          </tbody>
        </table>
      </div>

      <div className="bg-white rounded-xl shadow overflow-x-auto">
        <h2 className="font-semibold text-gray-700 px-4 pt-4">Hypothesis Test Results</h2>
        <table className="min-w-full text-sm mt-2">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left">Variable</th>
              <th className="px-4 py-2 text-right">Mean Diff</th>
              <th className="px-4 py-2 text-right">t-statistic</th>
              <th className="px-4 py-2 text-right">df</th>
              <th className="px-4 py-2 text-right">p-value</th>
              <th className="px-4 py-2 text-right">95% CI</th>
              <th className="px-4 py-2 text-center">Decision</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {tests.map(({ variable, key, fmtMean }) => {
              const r = stats[key].tTest;
              const sl = sigLabel(r.significant);
              return (
                <tr key={key} className="hover:bg-gray-50">
                  <td className="px-4 py-2 font-medium text-gray-700">{variable}</td>
                  <td className="px-4 py-2 text-right">{fmtMean(r.meanDiff)}</td>
                  <td className="px-4 py-2 text-right">{r.t.toFixed(3)}</td>
                  <td className="px-4 py-2 text-right">{r.df}</td>
                  <td className="px-4 py-2 text-right">{fmtP(r.pValue)}</td>
                  <td className="px-4 py-2 text-right text-xs">[{fmtMean(r.ci95Lower)}, {fmtMean(r.ci95Upper)}]</td>
                  <td className="px-4 py-2 text-center">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${sl.color}`}>{sl.text}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
