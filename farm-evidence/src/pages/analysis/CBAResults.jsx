import { useMemo } from "react";
import { useParams } from "react-router-dom";
import { ScreenTopbar } from "../../components/shared/ScreenTopbar";
import { ValidationGate } from "../../components/shared/ValidationGate";
import { useAnalysis } from "../../hooks/useAnalysis";

function formatRWF(value) {
  if (value === undefined || value === null || value === "") return "—";
  return Number(value).toLocaleString();
}

function formatRatio(value) {
  if (value === undefined || value === null || Number.isNaN(value)) return "—";
  return Number(value).toFixed(3);
}

function formatPercent(value) {
  if (value === undefined || value === null || Number.isNaN(value)) return "—";
  return `${Number(value).toFixed(1)}%`;
}

function safeNumber(value) {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
}

export function CBAResults() {
  const { trialId } = useParams();
  const { analysis: trialData, loading, error } = useAnalysis(trialId);

  const plots = useMemo(() => {
    if (!trialData || !Array.isArray(trialData.plots)) return [];
    return trialData.plots.sort((a, b) => {
      const aOrder = { CA: 0, CF: 1 }[a.treatment] ?? 2;
      const bOrder = { CA: 0, CF: 1 }[b.treatment] ?? 2;
      if (aOrder !== bOrder) return aOrder - bOrder;
      return safeNumber(a.replicate) - safeNumber(b.replicate);
    });
  }, [trialData]);

  const plotSizeM2 = useMemo(() => {
    return trialData?.trialSetup?.plotSize ?? 100;
  }, [trialData]);

  const plotSizeHa = useMemo(() => {
    return plotSizeM2 / 10000;
  }, [plotSizeM2]);

  const caPlots = useMemo(() => plots.filter((p) => p.treatment === "CA"), [plots]);
  const cfPlots = useMemo(() => plots.filter((p) => p.treatment === "CF"), [plots]);

  // Production Costs
  const productionCostData = useMemo(() => {
    const processPlot = (plot) => {
      const inputs = safeNumber(plot.inputCosts) || 0;
      const labour = safeNumber(plot.labourCosts) || 0;
      const labourTime = safeNumber(plot.labourTime) || 0;
      const total = inputs + labour;
      const cSd = safeNumber(plot.c_sd) || 0;
      const cSi = safeNumber(plot.c_si) || 0;
      return { inputs, labour, labourTime, total, cSd, cSi };
    };

    const caData = caPlots.map(processPlot);
    const cfData = cfPlots.map(processPlot);

    const sumField = (arr, field) => arr.reduce((sum, item) => sum + item[field], 0);
    const avgField = (arr, field) => (arr.length > 0 ? sumField(arr, field) / arr.length : 0);

    return {
      byPlot: plots.map((plot) => ({ plot, ...processPlot(plot) })),
      ca: {
        total: sumField(caData, "total"),
        avg: avgField(caData, "total"),
        inputs: sumField(caData, "inputs"),
        labour: sumField(caData, "labour"),
        labourTime: sumField(caData, "labourTime"),
        cSd: sumField(caData, "cSd"),
        cSi: sumField(caData, "cSi"),
      },
      cf: {
        total: sumField(cfData, "total"),
        avg: avgField(cfData, "total"),
        inputs: sumField(cfData, "inputs"),
        labour: sumField(cfData, "labour"),
        labourTime: sumField(cfData, "labourTime"),
        cSd: sumField(cfData, "cSd"),
        cSi: sumField(cfData, "cSi"),
      },
    };
  }, [plots, caPlots, cfPlots]);

  // Yield & Revenue
  const yieldRevenueData = useMemo(() => {
    const processPlot = (plot) => {
      const yieldKg = safeNumber(plot.yieldKg) || 0;
      const price = safeNumber(plot.marketPrice) || 1200;
      const grossRevenue = yieldKg * price;
      const revenuePerM2 = plotSizeM2 > 0 ? grossRevenue / plotSizeM2 : 0;
      const revenuePerHa = plotSizeHa > 0 ? grossRevenue / plotSizeHa : 0;
      return { yieldKg, price, grossRevenue, revenuePerM2, revenuePerHa };
    };

    const caData = caPlots.map(processPlot);
    const cfData = cfPlots.map(processPlot);

    const sumField = (arr, field) => arr.reduce((sum, item) => sum + item[field], 0);
    const avgField = (arr, field) => (arr.length > 0 ? sumField(arr, field) / arr.length : 0);

    return {
      byPlot: plots.map((plot) => ({ plot, ...processPlot(plot) })),
      ca: {
        totalYield: sumField(caData, "yieldKg"),
        avgYield: avgField(caData, "yieldKg"),
        totalRevenue: sumField(caData, "grossRevenue"),
        avgRevenue: avgField(caData, "grossRevenue"),
        avgRevenuePerM2: avgField(caData, "revenuePerM2"),
        avgRevenuePerHa: avgField(caData, "revenuePerHa"),
        avgPrice: avgField(caData, "price"),
      },
      cf: {
        totalYield: sumField(cfData, "yieldKg"),
        avgYield: avgField(cfData, "yieldKg"),
        totalRevenue: sumField(cfData, "grossRevenue"),
        avgRevenue: avgField(cfData, "grossRevenue"),
        avgRevenuePerM2: avgField(cfData, "revenuePerM2"),
        avgRevenuePerHa: avgField(cfData, "revenuePerHa"),
        avgPrice: avgField(cfData, "price"),
      },
    };
  }, [plots, caPlots, cfPlots, plotSizeM2, plotSizeHa]);

  const cbaComparison = useMemo(() => {
    const caGrossRev = yieldRevenueData.ca.avgRevenue;
    const cfGrossRev = yieldRevenueData.cf.avgRevenue;
    const caGrossRevHa = yieldRevenueData.ca.avgRevenuePerHa;
    const cfGrossRevHa = yieldRevenueData.cf.avgRevenuePerHa;

    const caProductionCost = productionCostData.ca.avg;
    const cfProductionCost = productionCostData.cf.avg;
    const caProductionCostHa = plotSizeHa > 0 ? caProductionCost / plotSizeHa : 0;
    const cfProductionCostHa = plotSizeHa > 0 ? cfProductionCost / plotSizeHa : 0;

    const caNetBenefit = caGrossRev - caProductionCost;
    const cfNetBenefit = cfGrossRev - cfProductionCost;
    const caNetBenefitHa = caGrossRevHa - caProductionCostHa;
    const cfNetBenefitHa = cfGrossRevHa - cfProductionCostHa;

    const caCsd = productionCostData.ca.avg * 0.6;
    const cfCsd = productionCostData.cf.avg * 0.6;
    const caCsdHa = caProductionCostHa * 0.6;
    const cfCsdHa = cfProductionCostHa * 0.6;

    const caAdjustedGm = caNetBenefit - caCsd;
    const cfAdjustedGm = cfNetBenefit - cfCsd;
    const caAdjustedGmHa = caNetBenefitHa - caCsdHa;
    const cfAdjustedGmHa = cfNetBenefitHa - cfCsdHa;

    const caBcr = caProductionCost > 0 ? caGrossRev / caProductionCost : 0;
    const cfBcr = cfProductionCost > 0 ? cfGrossRev / cfProductionCost : 0;

    const caRoi = caProductionCost > 0 ? ((caNetBenefit / caProductionCost) * 100) : 0;
    const cfRoi = cfProductionCost > 0 ? ((cfNetBenefit / cfProductionCost) * 100) : 0;

    const caYieldHa = yieldRevenueData.ca.avgYield / plotSizeHa;
    const cfYieldHa = yieldRevenueData.cf.avgYield / plotSizeHa;

    const caCpk = yieldRevenueData.ca.avgYield > 0 ? caProductionCost / yieldRevenueData.ca.avgYield : 0;
    const cfCpk = yieldRevenueData.cf.avgYield > 0 ? cfProductionCost / yieldRevenueData.cf.avgYield : 0;

    return {
      avgGrossRevenue: { ca: caGrossRev, caHa: caGrossRevHa, cf: cfGrossRev, cfHa: cfGrossRevHa },
      avgProductionCost: { ca: caProductionCost, caHa: caProductionCostHa, cf: cfProductionCost, cfHa: cfProductionCostHa },
      avgNetBenefit: { ca: caNetBenefit, caHa: caNetBenefitHa, cf: cfNetBenefit, cfHa: cfNetBenefitHa },
      avgCsdCost: { ca: caCsd, caHa: caCsdHa, cf: cfCsd, cfHa: cfCsdHa },
      avgCsiCost: { ca: productionCostData.ca.avg * 0.4, caHa: caProductionCostHa * 0.4, cf: productionCostData.cf.avg * 0.4, cfHa: cfProductionCostHa * 0.4 },
      adjustedGm: { ca: caAdjustedGm, caHa: caAdjustedGmHa, cf: cfAdjustedGm, cfHa: cfAdjustedGmHa },
      bcr: { ca: caBcr, cf: cfBcr },
      roi: { ca: caRoi, cf: cfRoi },
      avgYield: { ca: yieldRevenueData.ca.avgYield, caHa: caYieldHa, cf: yieldRevenueData.cf.avgYield, cfHa: cfYieldHa },
      costPerKg: { ca: caCpk, cf: cfCpk },
    };
  }, [yieldRevenueData, productionCostData, plotSizeHa]);

  const conclusions = useMemo(() => {
    const results = [];

    const caGrossRev = cbaComparison.avgGrossRevenue.ca;
    const cfGrossRev = cbaComparison.avgGrossRevenue.cf;
    const revDiff = Math.abs(caGrossRev - cfGrossRev);
    results.push({
      label: "Higher Gross Revenue",
      winner: caGrossRev > cfGrossRev ? "CA" : "CF",
      detail: `${caGrossRev > cfGrossRev ? "CA" : "CF"} leads by ${formatRWF(revDiff)} RWF`,
    });

    const caCost = productionCostData.ca.avg;
    const cfCost = productionCostData.cf.avg;
    const costDiff = Math.abs(caCost - cfCost);
    results.push({
      label: "Lower Production Cost",
      winner: caCost < cfCost ? "CA" : "CF",
      detail: `${caCost < cfCost ? "CA" : "CF"} saves ${formatRWF(costDiff)} RWF`,
    });

    const caNetBenefit = cbaComparison.avgNetBenefit.ca;
    const cfNetBenefit = cbaComparison.avgNetBenefit.cf;
    const netDiff = Math.abs(caNetBenefit - cfNetBenefit);
    results.push({
      label: "Higher Net Benefit",
      winner: caNetBenefit > cfNetBenefit ? "CA" : "CF",
      detail: `${caNetBenefit > cfNetBenefit ? "CA" : "CF"} gains ${formatRWF(netDiff)} RWF`,
    });

    const caBcr = cbaComparison.bcr.ca;
    const cfBcr = cbaComparison.bcr.cf;
    results.push({
      label: "Better Benefit-Cost Ratio",
      winner: caBcr > cfBcr ? "CA" : "CF",
      detail: `${caBcr > cfBcr ? "CA" : "CF"}: ${formatRatio(caBcr > cfBcr ? caBcr : cfBcr)}`,
    });

    const caYieldHa = cbaComparison.avgYield.caHa;
    const cfYieldHa = cbaComparison.avgYield.cfHa;
    const yieldDiff = Math.abs(caYieldHa - cfYieldHa);
    results.push({
      label: "Higher Yield (kg/ha)",
      winner: caYieldHa > cfYieldHa ? "CA" : "CF",
      detail: `${caYieldHa > cfYieldHa ? "CA" : "CF"} produces ${formatRWF(yieldDiff)} kg/ha more`,
    });

    return results;
  }, [cbaComparison, productionCostData]);

  const isEmptyState = plots.length === 0 || plots.every((p) => safeNumber(p.yieldKg) === 0);

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-80px)] bg-slate-50 p-6 md:p-10">
        <ScreenTopbar
          superText="Analysis"
          title="CBA Results"
          meta={`Trial ${trialId ?? "unknown"}`}
          status="Loading…"
          statusTone="offline"
          activeFarmLabel={trialId}
        />
        <div className="flex items-center justify-center p-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-12 shadow-sm text-center">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-slate-900 mx-auto mb-4" />
            <p className="text-slate-600">Loading CBA analysis…</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[calc(100vh-80px)] bg-slate-50 p-6 md:p-10">
        <ScreenTopbar
          superText="Analysis"
          title="CBA Results"
          meta={`Trial ${trialId ?? "unknown"}`}
          status="Error loading data"
          statusTone="error"
          activeFarmLabel={trialId}
        />
        <div className="rounded-3xl border border-rose-200 bg-rose-50 p-8 text-rose-700 shadow-sm">
          <h1 className="text-2xl font-semibold">Error loading CBA Results</h1>
          <p className="mt-3 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  if (isEmptyState) {
    return (
      <div className="min-h-[calc(100vh-80px)] bg-slate-50 p-6 md:p-10">
        <ScreenTopbar
          superText="Analysis"
          title="CBA Results"
          meta={`Trial ${trialId ?? "unknown"}`}
          status="Waiting for plot data"
          statusTone="offline"
          activeFarmLabel={trialId}
        />
        <div className="rounded-3xl border border-slate-200 bg-white p-12 shadow-sm text-center">
          <h1 className="text-2xl font-semibold text-slate-900">No yield data recorded</h1>
          <p className="mt-3 text-slate-600">CBA results will appear once you record yield for at least one plot in the data entry section.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-80px)] bg-slate-50 p-6 md:p-10">
      <div className="mx-auto max-w-7xl space-y-8">
        <header className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="text-3xl font-semibold text-slate-900">CBA Results</h1>
          <p className="mt-2 text-slate-600">Complete cost-benefit analysis comparing CA and CF treatments.</p>
        </header>
        <ValidationGate analysis={trialData} trial={trialData?.trial || {}} plots={plots} />

        {/* SECTION 1: Plot Configuration */}
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">Section 1: Plot Configuration</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-slate-700">
              <thead className="border-b border-slate-200 bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">Plot ID</th>
                  <th className="px-4 py-3 text-left font-semibold">Treatment</th>
                  <th className="px-4 py-3 text-left font-semibold">Replicate</th>
                  <th className="px-4 py-3 text-right font-semibold">Plot Size (m²)</th>
                  <th className="px-4 py-3 text-right font-semibold">Plot Size (ha)</th>
                </tr>
              </thead>
              <tbody>
                {plots.map((plot) => (
                  <tr
                    key={plot.plotId}
                    className={`border-b border-slate-100 ${
                      plot.treatment === "CA" ? "bg-emerald-50" : "bg-sky-50"
                    }`}
                  >
                    <td className="px-4 py-3 font-medium">{plot.plotId}</td>
                    <td className="px-4 py-3">{plot.treatment}</td>
                    <td className="px-4 py-3">{plot.replicate}</td>
                    <td className="px-4 py-3 text-right">{formatRWF(plotSizeM2)}</td>
                    <td className="px-4 py-3 text-right">{plotSizeHa.toFixed(4)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* SECTION 2: Production Costs */}
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">Section 2: Production Cost Summary</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-slate-700">
              <thead className="border-b border-slate-200 bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">Plot</th>
                  <th className="px-4 py-3 text-right font-semibold">Input Costs (RWF)</th>
                  <th className="px-4 py-3 text-right font-semibold">Labour Costs (RWF)</th>
                  <th className="px-4 py-3 text-right font-semibold">Labour Time (min)</th>
                  <th className="px-4 py-3 text-right font-semibold">Total Prod Cost (RWF)</th>
                  <th className="px-4 py-3 text-right font-semibold">C_SD Total (RWF)</th>
                  <th className="px-4 py-3 text-right font-semibold">C_SI Total (RWF)</th>
                </tr>
              </thead>
              <tbody>
                {productionCostData.byPlot.map((item) => (
                  <tr
                    key={item.plot.plotId}
                    className={`border-b border-slate-100 ${
                      item.plot.treatment === "CA" ? "bg-emerald-50" : "bg-sky-50"
                    }`}
                  >
                    <td className="px-4 py-3 font-medium">{item.plot.plotId}</td>
                    <td className="px-4 py-3 text-right">{formatRWF(item.inputs)}</td>
                    <td className="px-4 py-3 text-right">{formatRWF(item.labour)}</td>
                    <td className="px-4 py-3 text-right">{formatRWF(item.labourTime)}</td>
                    <td className="px-4 py-3 text-right font-semibold">{formatRWF(item.total)}</td>
                    <td className="px-4 py-3 text-right">{formatRWF(item.cSd)}</td>
                    <td className="px-4 py-3 text-right">{formatRWF(item.cSi)}</td>
                  </tr>
                ))}
                <tr className="border-t-2 border-slate-300 bg-emerald-100 font-semibold">
                  <td className="px-4 py-3">Total CA</td>
                  <td className="px-4 py-3 text-right">{formatRWF(productionCostData.ca.inputs)}</td>
                  <td className="px-4 py-3 text-right">{formatRWF(productionCostData.ca.labour)}</td>
                  <td className="px-4 py-3 text-right">{formatRWF(productionCostData.ca.labourTime)}</td>
                  <td className="px-4 py-3 text-right">{formatRWF(productionCostData.ca.total)}</td>
                  <td className="px-4 py-3 text-right">{formatRWF(productionCostData.ca.cSd)}</td>
                  <td className="px-4 py-3 text-right">{formatRWF(productionCostData.ca.cSi)}</td>
                </tr>
                <tr className="border-b border-slate-300 bg-emerald-50">
                  <td className="px-4 py-3">Average per Plot CA</td>
                  <td className="px-4 py-3 text-right">{formatRWF(productionCostData.ca.inputs / caPlots.length)}</td>
                  <td className="px-4 py-3 text-right">{formatRWF(productionCostData.ca.labour / caPlots.length)}</td>
                  <td className="px-4 py-3 text-right">{formatRWF(productionCostData.ca.labourTime / caPlots.length)}</td>
                  <td className="px-4 py-3 text-right font-semibold">{formatRWF(productionCostData.ca.avg)}</td>
                  <td className="px-4 py-3 text-right">{formatRWF(productionCostData.ca.cSd / caPlots.length)}</td>
                  <td className="px-4 py-3 text-right">{formatRWF(productionCostData.ca.cSi / caPlots.length)}</td>
                </tr>
                <tr className="border-t-2 border-slate-300 bg-sky-100 font-semibold">
                  <td className="px-4 py-3">Total CF</td>
                  <td className="px-4 py-3 text-right">{formatRWF(productionCostData.cf.inputs)}</td>
                  <td className="px-4 py-3 text-right">{formatRWF(productionCostData.cf.labour)}</td>
                  <td className="px-4 py-3 text-right">{formatRWF(productionCostData.cf.labourTime)}</td>
                  <td className="px-4 py-3 text-right">{formatRWF(productionCostData.cf.total)}</td>
                  <td className="px-4 py-3 text-right">{formatRWF(productionCostData.cf.cSd)}</td>
                  <td className="px-4 py-3 text-right">{formatRWF(productionCostData.cf.cSi)}</td>
                </tr>
                <tr className="bg-sky-50">
                  <td className="px-4 py-3">Average per Plot CF</td>
                  <td className="px-4 py-3 text-right">{formatRWF(productionCostData.cf.inputs / cfPlots.length)}</td>
                  <td className="px-4 py-3 text-right">{formatRWF(productionCostData.cf.labour / cfPlots.length)}</td>
                  <td className="px-4 py-3 text-right">{formatRWF(productionCostData.cf.labourTime / cfPlots.length)}</td>
                  <td className="px-4 py-3 text-right font-semibold">{formatRWF(productionCostData.cf.avg)}</td>
                  <td className="px-4 py-3 text-right">{formatRWF(productionCostData.cf.cSd / cfPlots.length)}</td>
                  <td className="px-4 py-3 text-right">{formatRWF(productionCostData.cf.cSi / cfPlots.length)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* SECTION 3: Yield & Gross Revenue */}
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">Section 3: Yield & Gross Revenue</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-slate-700">
              <thead className="border-b border-slate-200 bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">Plot</th>
                  <th className="px-4 py-3 text-right font-semibold">Yield (kg)</th>
                  <th className="px-4 py-3 text-right font-semibold">Price (RWF/kg)</th>
                  <th className="px-4 py-3 text-right font-semibold">Gross Revenue (RWF)</th>
                  <th className="px-4 py-3 text-right font-semibold">Revenue/m²</th>
                  <th className="px-4 py-3 text-right font-semibold">Revenue/ha</th>
                </tr>
              </thead>
              <tbody>
                {yieldRevenueData.byPlot.map((item) => (
                  <tr
                    key={item.plot.plotId}
                    className={`border-b border-slate-100 ${
                      item.plot.treatment === "CA" ? "bg-emerald-50" : "bg-sky-50"
                    }`}
                  >
                    <td className="px-4 py-3 font-medium">{item.plot.plotId}</td>
                    <td className="px-4 py-3 text-right">{formatRWF(item.yieldKg)}</td>
                    <td className="px-4 py-3 text-right">{formatRWF(item.price)}</td>
                    <td className="px-4 py-3 text-right font-semibold">{formatRWF(item.grossRevenue)}</td>
                    <td className="px-4 py-3 text-right">{formatRWF(item.revenuePerM2)}</td>
                    <td className="px-4 py-3 text-right">{formatRWF(item.revenuePerHa)}</td>
                  </tr>
                ))}
                <tr className="border-t-2 border-slate-300 bg-emerald-100 font-semibold">
                  <td className="px-4 py-3">Total CA</td>
                  <td className="px-4 py-3 text-right">{formatRWF(yieldRevenueData.ca.totalYield)}</td>
                  <td className="px-4 py-3 text-right">{formatRWF(yieldRevenueData.ca.avgPrice)}</td>
                  <td className="px-4 py-3 text-right">{formatRWF(yieldRevenueData.ca.totalRevenue)}</td>
                  <td colSpan="2" className="px-4 py-3 text-right">—</td>
                </tr>
                <tr className="border-b border-slate-300 bg-emerald-50">
                  <td className="px-4 py-3">Average per Plot CA</td>
                  <td className="px-4 py-3 text-right">{formatRWF(yieldRevenueData.ca.avgYield)}</td>
                  <td className="px-4 py-3 text-right">{formatRWF(yieldRevenueData.ca.avgPrice)}</td>
                  <td className="px-4 py-3 text-right font-semibold">{formatRWF(yieldRevenueData.ca.avgRevenue)}</td>
                  <td className="px-4 py-3 text-right">{formatRWF(yieldRevenueData.ca.avgRevenuePerM2)}</td>
                  <td className="px-4 py-3 text-right">{formatRWF(yieldRevenueData.ca.avgRevenuePerHa)}</td>
                </tr>
                <tr className="border-t-2 border-slate-300 bg-sky-100 font-semibold">
                  <td className="px-4 py-3">Total CF</td>
                  <td className="px-4 py-3 text-right">{formatRWF(yieldRevenueData.cf.totalYield)}</td>
                  <td className="px-4 py-3 text-right">{formatRWF(yieldRevenueData.cf.avgPrice)}</td>
                  <td className="px-4 py-3 text-right">{formatRWF(yieldRevenueData.cf.totalRevenue)}</td>
                  <td colSpan="2" className="px-4 py-3 text-right">—</td>
                </tr>
                <tr className="bg-sky-50">
                  <td className="px-4 py-3">Average per Plot CF</td>
                  <td className="px-4 py-3 text-right">{formatRWF(yieldRevenueData.cf.avgYield)}</td>
                  <td className="px-4 py-3 text-right">{formatRWF(yieldRevenueData.cf.avgPrice)}</td>
                  <td className="px-4 py-3 text-right font-semibold">{formatRWF(yieldRevenueData.cf.avgRevenue)}</td>
                  <td className="px-4 py-3 text-right">{formatRWF(yieldRevenueData.cf.avgRevenuePerM2)}</td>
                  <td className="px-4 py-3 text-right">{formatRWF(yieldRevenueData.cf.avgRevenuePerHa)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* SECTION 4: CBA Comparison */}
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">Section 4: CBA Comparison (CA vs CF)</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-slate-700">
              <thead className="border-b border-slate-200 bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">Indicator</th>
                  <th className="px-4 py-3 text-right font-semibold">CA Avg Value</th>
                  <th className="px-4 py-3 text-right font-semibold">CA Per Hectare</th>
                  <th className="px-4 py-3 text-right font-semibold">CF Avg Value</th>
                  <th className="px-4 py-3 text-right font-semibold">CF Per Hectare</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-slate-100">
                  <td className="px-4 py-3 font-medium">Avg Gross Revenue</td>
                  <td className="px-4 py-3 text-right">{formatRWF(cbaComparison.avgGrossRevenue.ca)}</td>
                  <td className="px-4 py-3 text-right">{formatRWF(cbaComparison.avgGrossRevenue.caHa)}</td>
                  <td className="px-4 py-3 text-right">{formatRWF(cbaComparison.avgGrossRevenue.cf)}</td>
                  <td className="px-4 py-3 text-right">{formatRWF(cbaComparison.avgGrossRevenue.cfHa)}</td>
                </tr>
                <tr className="border-b border-slate-100">
                  <td className="px-4 py-3 font-medium">Avg Total Production Cost</td>
                  <td className="px-4 py-3 text-right">{formatRWF(cbaComparison.avgProductionCost.ca)}</td>
                  <td className="px-4 py-3 text-right">{formatRWF(cbaComparison.avgProductionCost.caHa)}</td>
                  <td className="px-4 py-3 text-right">{formatRWF(cbaComparison.avgProductionCost.cf)}</td>
                  <td className="px-4 py-3 text-right">{formatRWF(cbaComparison.avgProductionCost.cfHa)}</td>
                </tr>
                <tr className="border-b border-slate-100">
                  <td className="px-4 py-3 font-medium">Net Benefit</td>
                  <td className="px-4 py-3 text-right font-semibold">{formatRWF(cbaComparison.avgNetBenefit.ca)}</td>
                  <td className="px-4 py-3 text-right font-semibold">{formatRWF(cbaComparison.avgNetBenefit.caHa)}</td>
                  <td className="px-4 py-3 text-right font-semibold">{formatRWF(cbaComparison.avgNetBenefit.cf)}</td>
                  <td className="px-4 py-3 text-right font-semibold">{formatRWF(cbaComparison.avgNetBenefit.cfHa)}</td>
                </tr>
                <tr className="border-b border-slate-100">
                  <td className="px-4 py-3 font-medium">Avg C_SD Cost</td>
                  <td className="px-4 py-3 text-right">{formatRWF(cbaComparison.avgCsdCost.ca)}</td>
                  <td className="px-4 py-3 text-right">{formatRWF(cbaComparison.avgCsdCost.caHa)}</td>
                  <td className="px-4 py-3 text-right">{formatRWF(cbaComparison.avgCsdCost.cf)}</td>
                  <td className="px-4 py-3 text-right">{formatRWF(cbaComparison.avgCsdCost.cfHa)}</td>
                </tr>
                <tr className="border-b border-slate-100">
                  <td className="px-4 py-3 font-medium">Avg C_SI Cost</td>
                  <td className="px-4 py-3 text-right">{formatRWF(cbaComparison.avgCsiCost.ca)}</td>
                  <td className="px-4 py-3 text-right">{formatRWF(cbaComparison.avgCsiCost.caHa)}</td>
                  <td className="px-4 py-3 text-right">{formatRWF(cbaComparison.avgCsiCost.cf)}</td>
                  <td className="px-4 py-3 text-right">{formatRWF(cbaComparison.avgCsiCost.cfHa)}</td>
                </tr>
                <tr className="border-b border-slate-100">
                  <td className="px-4 py-3 font-medium">Adjusted GM</td>
                  <td className="px-4 py-3 text-right">{formatRWF(cbaComparison.adjustedGm.ca)}</td>
                  <td className="px-4 py-3 text-right">{formatRWF(cbaComparison.adjustedGm.caHa)}</td>
                  <td className="px-4 py-3 text-right">{formatRWF(cbaComparison.adjustedGm.cf)}</td>
                  <td className="px-4 py-3 text-right">{formatRWF(cbaComparison.adjustedGm.cfHa)}</td>
                </tr>
                <tr className="border-b border-slate-100">
                  <td className="px-4 py-3 font-medium">BCR</td>
                  <td className="px-4 py-3 text-right font-semibold">{formatRatio(cbaComparison.bcr.ca)}</td>
                  <td colSpan="3" className="px-4 py-3 text-right">—</td>
                </tr>
                <tr className="border-b border-slate-100">
                  <td className="px-4 py-3 font-medium">ROI (%)</td>
                  <td className="px-4 py-3 text-right font-semibold">{formatPercent(cbaComparison.roi.ca)}</td>
                  <td colSpan="3" className="px-4 py-3 text-right">—</td>
                </tr>
                <tr className="border-b border-slate-100">
                  <td className="px-4 py-3 font-medium">Avg Yield (kg)</td>
                  <td className="px-4 py-3 text-right">{formatRWF(cbaComparison.avgYield.ca)}</td>
                  <td className="px-4 py-3 text-right">{formatRWF(cbaComparison.avgYield.caHa)}</td>
                  <td className="px-4 py-3 text-right">{formatRWF(cbaComparison.avgYield.cf)}</td>
                  <td className="px-4 py-3 text-right">{formatRWF(cbaComparison.avgYield.cfHa)}</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-medium">Cost per kg</td>
                  <td className="px-4 py-3 text-right">{formatRWF(cbaComparison.costPerKg.ca)}</td>
                  <td colSpan="3" className="px-4 py-3 text-right">—</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* SECTION 5: Conclusion Summary */}
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">Section 5: Conclusion Summary</h2>
          <div className="space-y-3">
            {conclusions.map((conclusion, idx) => (
              <div key={idx} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div>
                  <p className="font-semibold text-slate-900">{conclusion.label}</p>
                  <p className="text-sm text-slate-600">{conclusion.detail}</p>
                </div>
                <div
                  className={`rounded-full px-4 py-2 text-sm font-semibold text-white ${
                    conclusion.winner === "CA" ? "bg-emerald-600" : "bg-sky-600"
                  }`}
                >
                  {conclusion.winner}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
