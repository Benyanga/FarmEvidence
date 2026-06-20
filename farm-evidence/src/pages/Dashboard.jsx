import { useAnalysis } from '../hooks/useAnalysis';
import { ScreenTopbar } from '../components/shared/ScreenTopbar';
import { ValidationGate } from '../components/shared/ValidationGate';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { fmtRWF, fmtKg, fmtRatio } from '../utils/formatters';

export function Dashboard({ trialId }) {
  const { analysis, loading } = useAnalysis(trialId);
  const topbarMeta = analysis ? `${analysis.trialName ?? analysis.name ?? 'Trial'} · ${analysis.season ?? 'No season'}` : 'CA vs CF comparative summary';
  const topbarStatus = loading ? 'Loading…' : 'Ready';
  const topbarTone = loading ? 'offline' : 'synced';
  const activeFarmLabel = analysis?.trialName ?? analysis?.name;

  if (loading || !analysis) {
    return (
      <div className="min-h-[calc(100vh-80px)] bg-slate-50 p-6 md:p-10">
        <ScreenTopbar
          superText="Dashboard"
          title="Executive Dashboard"
          meta="Loading dashboard analysis…"
          status={topbarStatus}
          statusTone={topbarTone}
          activeFarmLabel={activeFarmLabel}
        />
        <div className="p-8 text-center">Loading dashboard...</div>
      </div>
    );
  }

  const { cba, stats } = analysis;
  const { ca, cf } = cba;

  // Chart data
  const yieldData   = [{ name: 'CA', value: ca.avgYield }, { name: 'CF', value: cf.avgYield }];
  const marginData  = [{ name: 'CA', value: ca.netBenefit }, { name: 'CF', value: cf.netBenefit }];
  const bcrData     = [{ name: 'CA', value: ca.bcr }, { name: 'CF', value: cf.bcr }];
  const costData    = [
    { name: 'C_SD', CA: ca.avgCSD, CF: cf.avgCSD },
    { name: 'C_SI', CA: ca.avgCSI, CF: cf.avgCSI }
  ];
  const revVsCost   = [
    { name: 'Revenue',   CA: ca.avgRevenue,  CF: cf.avgRevenue },
    { name: 'Total Cost', CA: ca.avgTPC,     CF: cf.avgTPC    },
    { name: 'Net Benefit', CA: ca.netBenefit, CF: cf.netBenefit }
  ];

  const statusIndicators = [
    { metric: 'Yield',        winner: ca.avgYield > cf.avgYield ? 'CA' : 'CF' },
    { metric: 'Gross Margin', winner: ca.netBenefit > cf.netBenefit ? 'CA' : 'CF' },
    { metric: 'BCR',          winner: ca.bcr > cf.bcr ? 'CA' : 'CF' },
    { metric: 'Cost/kg',      winner: ca.costPerKg < cf.costPerKg ? 'CA' : 'CF' },
    { metric: 'Labour Time',  winner: ca.avgLabourTime < cf.avgLabourTime ? 'CA' : 'CF' },
    { metric: 'Net Profit',   winner: ca.netBenefit > cf.netBenefit ? 'CA' : 'CF' }
  ];

  return (
    <div className="min-h-[calc(100vh-80px)] bg-slate-50 p-6 md:p-10">
      <ScreenTopbar
        superText="Dashboard"
        title="Executive Dashboard"
        meta={topbarMeta}
        status={topbarStatus}
        statusTone={topbarTone}
        activeFarmLabel={activeFarmLabel}
      />
      <div className="space-y-8">
        <ValidationGate analysis={analysis} trial={{}} plots={analysis?.plots || []} />
        <h1 className="text-2xl font-bold text-gray-800">Executive Dashboard — CA vs CF</h1>

        {/* Status row */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
        {statusIndicators.map(({ metric, winner }) => (
          <div key={metric} className="bg-white rounded-lg p-3 shadow-sm text-center">
            <p className="text-xs text-gray-500">{metric}</p>
            <p className={`font-bold mt-1 ${winner === 'CA' ? 'text-green-700' : 'text-blue-700'}`}>
              {winner} Higher
            </p>
          </div>
        ))}
      </div>

      {/* Charts grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Yield */}
        <div className="bg-white rounded-xl shadow p-4">
          <h2 className="font-semibold text-gray-700 mb-3">Avg Yield (kg/plot)</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={yieldData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={v => `${v.toFixed(2)} kg`} />
              <Bar dataKey="value" fill="#2D5016" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Gross Margin */}
        <div className="bg-white rounded-xl shadow p-4">
          <h2 className="font-semibold text-gray-700 mb-3">Net Benefit (RWF/plot)</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={marginData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={v => `${Math.round(v).toLocaleString()} RWF`} />
              <Bar dataKey="value" fill="#C8860A" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Revenue vs Cost */}
        <div className="bg-white rounded-xl shadow p-4">
          <h2 className="font-semibold text-gray-700 mb-3">Revenue vs Cost vs Net Benefit (RWF)</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={revVsCost}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={v => `${Math.round(v).toLocaleString()} RWF`} />
              <Legend />
              <Bar dataKey="CA" fill="#2D5016" radius={[4,4,0,0]} />
              <Bar dataKey="CF" fill="#4A90D9" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Cost structure */}
        <div className="bg-white rounded-xl shadow p-4">
          <h2 className="font-semibold text-gray-700 mb-3">Cost Structure: C_SD vs C_SI</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={costData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={v => `${Math.round(v).toLocaleString()} RWF`} />
              <Legend />
              <Bar dataKey="CA" fill="#2D5016" radius={[4,4,0,0]} />
              <Bar dataKey="CF" fill="#4A90D9" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Scorecard */}
      <div className="bg-white rounded-xl shadow p-4">
        <h2 className="font-semibold text-gray-700 mb-3">Key Metrics</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          {[
            ['Avg Yield CA',    fmtKg(ca.avgYield)],
            ['Avg Yield CF',    fmtKg(cf.avgYield)],
            ['BCR CA',          fmtRatio(ca.bcr)],
            ['BCR CF',          fmtRatio(cf.bcr)],
            ['Cost/kg CA',      fmtRWF(ca.costPerKg)],
            ['Cost/kg CF',      fmtRWF(cf.costPerKg)],
            ['Labour Saved',    `${cba.labourTimeDiff?.toFixed(1)} min`],
            ['CA Wins',         `${statusIndicators.filter(s => s.winner === 'CA').length}/6 criteria`]
          ].map(([label, val]) => (
            <div key={label} className="border rounded-lg p-3 text-center">
              <p className="text-xs text-gray-500">{label}</p>
              <p className="font-bold text-gray-800 mt-1">{val}</p>
            </div>
          ))}
        </div>
      </div>
      </div>
    </div>
  );
}
