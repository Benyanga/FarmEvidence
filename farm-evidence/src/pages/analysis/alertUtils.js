function safeNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function formatNumber(value, digits = 2) {
  const number = Number(value);
  return Number.isFinite(number) ? number.toFixed(digits) : "0.00";
}

function plotKey(plot, index) {
  return plot.plotId ?? plot.id ?? plot.plot_id ?? `plot-${index + 1}`;
}

export function getAnalysisAlerts(analysis) {
  if (!analysis) return [];

  const plots = Array.isArray(analysis.plots) ? analysis.plots : [];
  const stats = analysis.stats ?? {};
  const breakEven = analysis.breakEven ?? {};
  const stability = analysis.stability ?? {};

  const plotAlerts = plots.flatMap((plot, index) => {
    const yieldKg = plot.yieldKg ?? plot.yield_kg ?? plot.yield ?? null;
    if (yieldKg === null || yieldKg === undefined || Number(yieldKg) === 0) {
      return [
        {
          id: `missing-yield-${plotKey(plot, index)}`,
          severity: "error",
          title: "Missing yield data",
          description: `Plot ${plotKey(plot, index)}: No yield recorded`,
          timestamp: Date.now(),
        },
      ];
    }
    return [];
  });

  const makeTreatmentAlert = (treatment) => {
    const summary = {
      breakEvenYield:
        safeNumber(breakEven[treatment]?.yield?.breakEvenYield) ||
        safeNumber(breakEven[treatment]?.yield?.break_even_yield) ||
        null,
      actualYield:
        safeNumber(breakEven[treatment]?.yield?.actualYield) ||
        safeNumber(breakEven[treatment]?.yield?.actual_yield) ||
        null,
      bcr:
        safeNumber(breakEven[treatment]?.BCR) ||
        safeNumber(breakEven[treatment]?.bcr) ||
        safeNumber(breakEven[treatment]?.bcrValue) ||
        null,
      cv:
        safeNumber(stability[treatment]?.cv) ||
        safeNumber(stats.yield?.[`desc${treatment}`]?.cv) ||
        null,
    };

    const alerts = [];
    if (summary.breakEvenYield > 0 && summary.actualYield > 0 && summary.actualYield < summary.breakEvenYield) {
      alerts.push({
        id: `break-even-${treatment}`,
        severity: "warning",
        title: `${treatment} below break-even yield`,
        description: `${treatment} actual yield (${formatNumber(summary.actualYield, 1)} kg) is below break-even yield (${formatNumber(
          summary.breakEvenYield,
          1,
        )} kg).`,
        timestamp: Date.now(),
      });
    }

    if (summary.bcr > 0 && summary.bcr < 1) {
      alerts.push({
        id: `bcr-${treatment}`,
        severity: "error",
        title: `${treatment} profitability alert`,
        description: `${treatment} is operating at a loss (BCR = ${formatNumber(summary.bcr, 2)})`,
        timestamp: Date.now(),
      });
    }

    if (summary.cv > 20) {
      alerts.push({
        id: `cv-${treatment}`,
        severity: "warning",
        title: `${treatment} yield variability`,
        description: `${treatment} yield is highly variable (CV = ${formatNumber(summary.cv, 1)}%)`,
        timestamp: Date.now(),
      });
    }

    return alerts;
  };

  const treatmentAlerts = ["CA", "CF"].flatMap(makeTreatmentAlert);

  const yieldPT =
    safeNumber(stats.yield?.tTest?.pValue) ||
    safeNumber(stats.yield?.anova?.pValue) ||
    safeNumber(stats.yield?.tTest?.p_value) ||
    safeNumber(stats.yield?.anova?.p_value);

  const caCsdCost = safeNumber(stats.csd?.descCA?.mean) || safeNumber(stats.csd?.descCA?.avg) || 0;
  const cfCsdCost = safeNumber(stats.csd?.descCF?.mean) || safeNumber(stats.csd?.descCF?.avg) || 0;

  const csdPValue =
    safeNumber(stats.csd?.tTest?.pValue) ||
    safeNumber(stats.csd?.anova?.pValue) ||
    safeNumber(stats.csd?.tTest?.p_value) ||
    safeNumber(stats.csd?.anova?.p_value);

  const semanticAlerts = [];
  if (yieldPT >= 0 && yieldPT >= 0.05 && caCsdCost > cfCsdCost) {
    semanticAlerts.push({
      id: "yield-non-significant-cost-gap",
      severity: "info",
      title: "Cost gap with non-significant yield difference",
      description:
        "CA has higher C_SD costs but yield difference is not statistically significant — consider multi-season validation.",
      timestamp: Date.now(),
    });
  }

  if (csdPValue > 0 && csdPValue < 0.05) {
    semanticAlerts.push({
      id: "csd-significance",
      severity: "info",
      title: "C_SD cost difference is significant",
      description:
        csdPValue < 0.001
          ? "C_SD cost difference is statistically significant (p < 0.001)."
          : `C_SD cost difference is statistically significant (p = ${formatNumber(csdPValue, 3)}).`,
      timestamp: Date.now(),
    });
  }

  const allPlotsComplete = plots.length > 0 && plots.every((plot) => {
    const yieldKg = plot.yieldKg ?? plot.yield_kg ?? plot.yield ?? null;
    return yieldKg !== null && yieldKg !== undefined && Number(yieldKg) !== 0;
  });

  if (allPlotsComplete) {
    semanticAlerts.push({
      id: "all-plots-complete",
      severity: "success",
      title: "All plots complete",
      description: `All ${plots.length} plots have complete data`,
      timestamp: Date.now(),
    });
  }

  return [...plotAlerts, ...treatmentAlerts, ...semanticAlerts];
}

export function getAlertCount(analysis) {
  return getAnalysisAlerts(analysis).length;
}
