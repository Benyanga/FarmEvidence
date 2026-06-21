import { aggregatePlot } from './plotAggregator.js';
import { getPhase, computeSeasonIndex } from './phaseEngine.js';
import { computeCSI, interpretCSI } from './csiEngine.js';
import { computeAdoptionCost } from './adoptionCost.js';

/**
 * Build the full seasonal trajectory for a farm.
 * @param {object} farm           - Farm document
 * @param {object[]} seasonRecords - Plot documents with recordType='farm_season', sorted by year/season
 * @returns {object} { timeline, profitabilityComparisons, agronomicComparisons }
 */
function buildFarmTrajectory(farm, seasonRecords) {
  const params = {
    marketPriceRWF: farm.defaultMarketPriceRWF,
    wageRateRWF: farm.defaultWageRateRWF,
    workingHoursPerDay: farm.defaultWorkingHoursPerDay,
    plotSizeM2: farm.defaultPlotSizeM2
  };

  // Aggregate each season record using the same plot aggregator
  const timeline = seasonRecords.map((record, index) => {
    const agg = aggregatePlot(record, {
      ...params,
      plotSizeM2: record.plotSizeM2 || params.plotSizeM2,
      marketPriceRWF: record.marketPriceRWF || params.marketPriceRWF
    });

    const seasonIndex = record.seasonIndexOverride != null ? record.seasonIndexOverride : index + 1;
    const t = computeSeasonIndex(farm.adoptionStartSeason, seasonIndex);
    const { phase, phi } = getPhase(t);
    const csi = computeCSI({
      j1: farm.csi_j1, j2: farm.csi_j2, j3: farm.csi_j3,
      j4: farm.csi_j4, j5: farm.csi_j5, j6: farm.csi_j6
    });
    const csiInterpretation = interpretCSI(csi);
    const cAdopt = computeAdoptionCost(farm.adoptionCostInitial || 0, t, 0.5);

    return {
      year: record.year,
      season: record.season,
      label: `${record.season} ${record.year}`,
      crop: record.crop,
      t,
      phase,
      phi,
      csi,
      csiInterpretation,
      cAdopt,
      ...agg,
      agronomicData: record.agronomicData || {}
    };
  });

  // PROFITABILITY COMPARISONS — only between seasons with the SAME crop
  const profitabilityComparisons = [];
  for (let i = 0; i < timeline.length; i++) {
    for (let j = i + 1; j < timeline.length; j++) {
      const a = timeline[i], b = timeline[j];
      if (a.crop && b.crop && a.crop === b.crop) {
        profitabilityComparisons.push({
          crop: a.crop,
          cropName: a.crop,
          seasonA: a.label,
          seasonB: b.label,
          totalCostA: a.tpc,
          totalCostB: b.tpc,
          grossRevenueA: a.grossRev,
          grossRevenueB: b.grossRev,
          netBenefitA: a.netBenefit,
          netBenefitB: b.netBenefit,
          yieldA: a.yieldKg,
          yieldB: b.yieldKg,
          bcrA: a.bcr,
          bcrB: b.bcr,
          roiA: a.roi,
          roiB: b.roi,
          costPerKgA: a.costPerKg,
          costPerKgB: b.costPerKg,
          tpcChange: b.tpc - a.tpc,
          tpcChangePct: a.tpc > 0 ? ((b.tpc - a.tpc) / a.tpc) * 100 : null,
          revenueChange: b.grossRev - a.grossRev,
          revenueChangePct: a.grossRev > 0 ? ((b.grossRev - a.grossRev) / a.grossRev) * 100 : null,
          netBenefitChange: b.netBenefit - a.netBenefit,
          netBenefitChangePct: a.netBenefit !== 0 ? ((b.netBenefit - a.netBenefit) / Math.abs(a.netBenefit)) * 100 : null,
          yieldChange: b.yieldKg - a.yieldKg,
          yieldChangePct: a.yieldKg > 0 ? ((b.yieldKg - a.yieldKg) / a.yieldKg) * 100 : null,
          bcrChange: (b.bcr || 0) - (a.bcr || 0),
          interpretation: interpretProfitChange(a, b)
        });
      }
    }
  }

  // AGRONOMIC COMPARISONS — consecutive seasons regardless of crop
  const agronomicComparisons = [];
  for (let i = 0; i < timeline.length - 1; i++) {
    const a = timeline[i], b = timeline[i + 1];
    const aAgro = a.agronomicData || {};
    const bAgro = b.agronomicData || {};
    agronomicComparisons.push({
      seasonA: a.label,
      seasonB: b.label,
      cropA: a.crop,
      cropB: b.crop,
      cropChanged: a.crop !== b.crop,
      weedPressureChange: diffOrNull(bAgro.weedPressureScore, aAgro.weedPressureScore),
      soilFaunaChange:    diffOrNull(bAgro.soilFaunaIndex,   aAgro.soilFaunaIndex),
      soilColorChange:    diffOrNull(bAgro.soilColorScore,   aAgro.soilColorScore),
      cropVigorChange:    diffOrNull(bAgro.cropVigorScore,   aAgro.cropVigorScore),
      pestIncidenceChange: diffOrNull(bAgro.pestIncidencePct, aAgro.pestIncidencePct),
      interpretation: interpretAgronomicChange(aAgro, bAgro)
    });
  }

  return { timeline, profitabilityComparisons, agronomicComparisons };
}

function diffOrNull(b, a) {
  if (b == null || a == null) return null;
  return b - a;
}

function interpretProfitChange(a, b) {
  if (b.netBenefit > a.netBenefit) {
    const pct = a.netBenefit !== 0 ? Math.abs(((b.netBenefit - a.netBenefit) / a.netBenefit) * 100) : 0;
    return `Profitability improved by ${pct.toFixed(1)}% compared to the previous ${a.crop} season (${a.label}).`;
  } else if (b.netBenefit < a.netBenefit) {
    const pct = a.netBenefit !== 0 ? Math.abs(((b.netBenefit - a.netBenefit) / a.netBenefit) * 100) : 0;
    return `Profitability declined by ${pct.toFixed(1)}% compared to the previous ${a.crop} season (${a.label}). Review cost changes below.`;
  }
  return `Profitability was unchanged compared to ${a.label}.`;
}

function interpretAgronomicChange(aAgro, bAgro) {
  const notes = [];
  if (bAgro.soilFaunaIndex > aAgro.soilFaunaIndex) notes.push('Soil biological activity is improving.');
  if (bAgro.soilColorScore > aAgro.soilColorScore) notes.push('Soil organic matter appears to be increasing.');
  if (bAgro.weedPressureScore < aAgro.weedPressureScore) notes.push('Weed pressure has decreased.');
  if (bAgro.weedPressureScore > aAgro.weedPressureScore) notes.push('Weed pressure has increased — monitor mulch coverage.');
  if (notes.length === 0) return 'No significant change in soil or crop health indicators since the previous season.';
  return notes.join(' ');
}

export { buildFarmTrajectory };
