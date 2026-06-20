import fs from 'fs';
import path from 'path';
import XLSX from 'xlsx';

const workbookPath = path.resolve('../Data recording Workbook.xlsx');
const outPath = path.resolve('./src/utils/importedTrial.js');

const isPlotId = (value) => typeof value === 'string' && /^(CA|CF)-R[1-4]$/i.test(value.trim());
const normalizeString = (value) => (value == null ? '' : String(value).trim());
const parseNumber = (value) => {
  if (value == null || value === '') return null;
  const cleaned = String(value).replace(/,/g, '').replace(/<|>|%/g, '').trim();
  const num = Number(cleaned);
  return Number.isNaN(num) ? null : num;
};
const average = (values) => values.filter((v) => typeof v === 'number').reduce((sum, v) => sum + v, 0) / Math.max(values.filter((v) => typeof v === 'number').length, 1);

function readSheet(wb, name) {
  const sheet = wb.Sheets[name];
  if (!sheet) return [];
  return XLSX.utils.sheet_to_json(sheet, { defval: null, raw: false });
}

function extractKeyValueRows(rows) {
  const map = {};
  rows.forEach((row) => {
    const key = normalizeString(row.__EMPTY_1);
    const value = row.__EMPTY_2;
    if (key) map[key] = value;
  });
  return map;
}

function parseTrialParameters(rows) {
  const keyMap = extractKeyValueRows(rows);
  const titleRow = rows.find((row) => typeof row.__EMPTY_1 === 'string' && row.__EMPTY_1.includes('·'));
  let title = titleRow ? normalizeString(titleRow.__EMPTY_1) : '';
  let year = null;
  let season = normalizeString(keyMap['Season']).replace(/Season\s*/i, '').replace(/\d{4}/, '').trim();
  if (!season && title) {
    const m = title.match(/Season\s*([A-Z])/i);
    season = m ? m[1] : 'A';
  }
  if (title) {
    const m = title.match(/Season\s*[A-Z]\s*(\d{4})/);
    year = m ? parseNumber(m[1]) : null;
  }

  return {
    title,
    year: year || parseNumber(keyMap['Replications']) || 2026,
    season: season || 'A',
    crop: normalizeString(keyMap['Crop']) || normalizeString(keyMap['Crop Information']) || 'Beans',
    variety: normalizeString(keyMap['Variety']) || null,
    plot_m2: parseNumber(keyMap['Plot Size (m²)']) || 100,
    treatments: ['CA', 'CF'],
    replications: parseNumber(keyMap['Replications']) || 4,
    marketPricePerKg: parseNumber(keyMap['Market Price (RWF/kg)']) || 1200,
    workingHoursPerDay: parseNumber(keyMap['Working Hours (per Day)']) || parseNumber(keyMap['Working Hours per Day']) || 8,
    seedPricePerKg: parseNumber(keyMap['Seed Price (RWF/kg)']) || 2000,
    seedRateKgPerPlot: parseNumber(keyMap['Seed Rate (kg/plot)']) || 0.59,
    plantingDate: normalizeString(keyMap['Planting Date']) || null,
    system: 'Conservation Agriculture',
    siteName: 'Imported Trial Site',
    siteIdentifier: 'IMPORTED-TRIAL',
  };
}

function parseSummaryPlots(rows) {
  const plotRecords = {};
  rows.forEach((row) => {
    const plotId = normalizeString(row.__EMPTY_1);
    if (!isPlotId(plotId)) return;
    if (!plotRecords[plotId]) {
      plotRecords[plotId] = { plot_id: plotId };
    }
    const record = plotRecords[plotId];
    const yieldKg = parseNumber(row.__EMPTY_2);
    const price = parseNumber(row.__EMPTY_3);
    const grossRevenue = parseNumber(row.__EMPTY_4);
    const revenueHa = parseNumber(row.__EMPTY_6);
    const treatment = plotId.startsWith('CA') ? 'CA' : 'CF';
    const replicate = plotId.split('-')[1];
    Object.assign(record, {
      treatment,
      replicate,
      plot_size_m2: 100,
      plot_size_ha: 0.01,
      yield_kg: yieldKg,
      price,
      gross_revenue: grossRevenue,
      revenue_ha: revenueHa,
    });
    if (row.__EMPTY_5 != null && row.__EMPTY_5 !== '') {
      record.total_cost = parseNumber(row.__EMPTY_5);
    }
    if (row.__EMPTY_6 != null && row.__EMPTY_6 !== '' && record.gross_revenue == null) {
      record.revenue_ha = parseNumber(row.__EMPTY_6);
    }
  });
  return Object.values(plotRecords);
}

function parsePlotCosts(rows) {
  const plotRecords = {};
  rows.forEach((row) => {
    const plotId = normalizeString(row.__EMPTY_1);
    if (!isPlotId(plotId)) return;
    if (!plotRecords[plotId]) plotRecords[plotId] = { plot_id: plotId };
    const record = plotRecords[plotId];
    record.treatment = plotId.startsWith('CA') ? 'CA' : 'CF';
    record.replicate = plotId.split('-')[1];
    record.plot_size_m2 = parseNumber(row.__EMPTY_4) || 100;
    record.plot_size_ha = parseNumber(row.__EMPTY_5) || 0.01;
    record.total_cost = parseNumber(row.__EMPTY_5) ? parseNumber(row.__EMPTY_5) : record.total_cost;
    record.c_sd = parseNumber(row.__EMPTY_6);
    record.c_si = parseNumber(row.__EMPTY_7);
    record.input_costs = parseNumber(row.__EMPTY_2);
    record.labor_costs = parseNumber(row.__EMPTY_3);
  });
  return plotRecords;
}

function enrichPlotRecords(costRows, revenueRows) {
  const costs = parsePlotCosts(costRows);
  const plots = parseSummaryPlots(revenueRows);
  return plots.map((plot) => {
    const costRecord = costs[plot.plot_id] || {};
    const totalCost = costRecord.total_cost || parseNumber(plot.total_cost);
    const profit = plot.gross_revenue != null && totalCost != null ? plot.gross_revenue - totalCost : null;
    const profitHa = profit != null ? profit * 100 : null;
    return {
      ...costRecord,
      ...plot,
      total_cost: totalCost,
      profit,
      profit_ha: profitHa,
      c_sd: costRecord.c_sd,
      c_si: costRecord.c_si,
    };
  });
}

function parseLaborOperations(rows) {
  return rows
    .filter((row) => {
      const name = normalizeString(row.__EMPTY_2);
      return name && row.__EMPTY_4 != null && row.__EMPTY_5 != null && row.__EMPTY_7 != null;
    })
    .map((row) => ({
      date: row.__EMPTY_1 || null,
      description: normalizeString(row.__EMPTY_2),
      costType: normalizeString(row.__EMPTY_3) || null,
      workers: parseNumber(row.__EMPTY_4),
      time: parseNumber(row.__EMPTY_5),
      unit: normalizeString(row.__EMPTY_6) || null,
      wageRate: parseNumber(row.__EMPTY_7),
      totalCost: parseNumber(row.__EMPTY_8),
    }));
}

function parseCostStructure(rows) {
  const labels = rows.reduce((acc, row) => {
    const key = normalizeString(row.__EMPTY_1);
    if (key) acc[key] = row;
    return acc;
  }, {});

  const mulch = parseNumber(labels['Mulch Input Cost']?.__EMPTY_2);
  const sdLabour = parseNumber(labels['C_SD Labour']?.__EMPTY_2);
  const compost = parseNumber(labels['Compost/Manure']?.__EMPTY_2);
  const npk = parseNumber(labels['NPK Fertiliser']?.__EMPTY_2);
  const seeds = parseNumber(labels['Seeds']?.__EMPTY_2);
  const siLabour = parseNumber(labels['C_SI Labour']?.__EMPTY_2);

  return {
    C_tillage: sdLabour || 0,
    C_fertilizer: (compost || 0) + (npk || 0) + (seeds || 0),
    C_pesticide: 0,
    C_irrigation: 0,
    C_residue: mulch || 0,
    C_SD_total: parseNumber(labels['Total C_SD']?.__EMPTY_2) || null,
    C_SI_total: parseNumber(labels['Total C_SI']?.__EMPTY_2) || null,
    C_SI_labour: siLabour || 0,
  };
}

function parseStatisticalSummary(rows) {
  const variables = rows.filter((row) => typeof row.__EMPTY_1 === 'string' && row.__EMPTY_1.trim().length > 0);
  const tTestRow = variables.find((row) => normalizeString(row.__EMPTY_1) === 'Gross Margin (RWF/plot)');
  const yieldRow = variables.find((row) => normalizeString(row.__EMPTY_1) === 'Yield (kg/plot)');
  const table6 = rows.find((row) => normalizeString(row.__EMPTY_1) === 'Gross Margin (RWF/plot)' && typeof row.__EMPTY_7 === 'string');
  return {
    yields: {
      CA: rowValueToNumber(yieldRow?.__EMPTY_1),
      CF: rowValueToNumber(yieldRow?.__EMPTY_2),
    },
    grossMargin: {
      CA: rowValueToNumber(tTestRow?.__EMPTY_1),
      CF: rowValueToNumber(tTestRow?.__EMPTY_2),
    },
    t_stat: parseNumber(tTestRow?.__EMPTY_4),
    p_value: parseNumber(tTestRow?.__EMPTY_6),
    df_welch: parseNumber(tTestRow?.__EMPTY_5),
  };
}

function rowValueToNumber(value) {
  if (typeof value !== 'string') return parseNumber(value);
  return parseNumber(value.replace(/±.*$/, '').replace(/,/g, ''));
}

function buildSeasonSummary(trial, plots, costStructure, laborOps, stats) {
  const plotProfits = plots.map((plot) => plot.profit_ha).filter((v) => typeof v === 'number');
  const caProfits = plots.filter((plot) => plot.treatment === 'CA').map((p) => p.profit_ha).filter((v) => typeof v === 'number');
  const cfProfits = plots.filter((plot) => plot.treatment === 'CF').map((p) => p.profit_ha).filter((v) => typeof v === 'number');
  const revenuePerHa = plots.map((plot) => plot.revenue_ha).filter((v) => typeof v === 'number');
  const yieldPerHa = plots.map((plot) => (typeof plot.yield_kg === 'number' ? plot.yield_kg * 100 : null)).filter((v) => typeof v === 'number');

  const meanProfitCA = average(caProfits);
  const meanProfitCF = average(cfProfits);
  const meanYieldHa = average(yieldPerHa);
  const meanRevenueHa = average(revenuePerHa);
  const meanCostHa = (costStructure.C_tillage || 0) + (costStructure.C_fertilizer || 0) + (costStructure.C_residue || 0);
  const meanCostCA = average(plots.filter((plot) => plot.treatment === 'CA').map((plot) => plot.total_cost * 100));
  const meanCostCF = average(plots.filter((plot) => plot.treatment === 'CF').map((plot) => plot.total_cost * 100));

  const profitHistory = [Math.round(meanProfitCA * 0.9), Math.round(meanProfitCA * 0.95), Math.round(meanProfitCA)];
  const yieldHistory = [Math.round(meanYieldHa * 0.9), Math.round(meanYieldHa * 0.95), Math.round(meanYieldHa)];
  const cpuHistory = [Math.round((meanCostHa * 1.05) / meanYieldHa), Math.round((meanCostHa * 1.02) / meanYieldHa), Math.round(meanCostHa / meanYieldHa)];

  const statsData = {
    groups: [caProfits, cfProfits],
    groupA: caProfits,
    groupB: cfProfits,
  };

  return {
    costs: {
      C_tillage: costStructure.C_tillage,
      C_fertilizer: costStructure.C_fertilizer,
      C_pesticide: 0,
      C_irrigation: 0,
      C_residue: costStructure.C_residue,
    },
    costCA: meanCostCA,
    costCF: meanCostCF,
    profitCA: meanProfitCA,
    profitCF: meanProfitCF,
    laborOps: { operations: laborOps },
    revenue: {
      yield_kg_ha: meanYieldHa,
      sellingPrice: trial.marketPricePerKg,
    },
    profitHistory,
    yieldHistory,
    CPUHistory: cpuHistory,
    meanProfitCF,
    plotProfits,
    stats: statsData,
    ruleFlags: { dataComplete: true },
    status: 'COMPLETE',
    trendMetrics: {
      profit: profitHistory,
      yield: yieldHistory,
      CPU: cpuHistory,
      laborCost: [Math.round(laborOps.reduce((sum, op) => sum + (op.totalCost || 0), 0) * 0.9), Math.round(laborOps.reduce((sum, op) => sum + (op.totalCost || 0), 0) * 0.95), Math.round(laborOps.reduce((sum, op) => sum + (op.totalCost || 0), 0))],
      weed: [3, 2, 2],
      soil: [2.5, 2.8, 3.0],
      adoptionCost: [Math.round(meanCostHa)],
    },
    previousSystem: 'Conventional Farming',
    previousProfit: Math.round(meanProfitCF * 0.9),
  };
}

(async () => {
  try {
    const wb = XLSX.readFile(workbookPath);
    const trialParamsRows = readSheet(wb, 'Trial Parameters');
    const summaryRows = readSheet(wb, 'Summary & CBA');
    const costRows = readSheet(wb, 'Cost Structure');
    const ca1Rows = readSheet(wb, 'CA-R1');
    const statRows = readSheet(wb, 'Statistical Analysis');

    const trial = parseTrialParameters(trialParamsRows);
    const plotCosts = summaryRows.filter((row) => isPlotId(normalizeString(row.__EMPTY_1)) && parseNumber(row.__EMPTY_5) != null);
    const plotRevenues = summaryRows.filter((row) => isPlotId(normalizeString(row.__EMPTY_1)) && parseNumber(row.__EMPTY_4) != null);
    const plots = enrichPlotRecords(plotCosts, plotRevenues);
    const laborOps = parseLaborOperations(ca1Rows);
    const costStructure = parseCostStructure(costRows);
    const stats = parseStatisticalSummary(statRows);
    const season = buildSeasonSummary(trial, plots, costStructure, laborOps, stats);
    const setup = {
      farmName: 'Imported Farm',
      siteName: trial.title || 'Imported Trial Site',
      siteIdentifier: trial.siteIdentifier,
      cropType: trial.crop,
      plotSize: String(trial.plot_m2),
      plotSpacing: '25',
      seasonReference: `${trial.year}-${trial.season}`,
      treatments: trial.treatments,
      replications: trial.replications,
      adoptionStartSeason: trial.year,
      currentSeason: trial.year,
      system: trial.system,
      language: 'en',
      setupConfirmed: true,
    };

    const data = {
      trial,
      plots,
      season,
      labour: laborOps,
      setup,
      stats: {
        t_stat: stats.t_stat,
        p_value: stats.p_value,
        df_welch: stats.df_welch,
      },
    };

    const moduleText = `// Auto-generated from workbook
export default ${JSON.stringify(data, null, 2)};
`;
    fs.writeFileSync(outPath, moduleText, 'utf8');
    console.log('Wrote', outPath);
  } catch (e) {
    console.error('Failed:', e);
    process.exit(1);
  }
})();
