/**
 * Descriptive statistics for an array of numbers.
 * @param {number[]} arr
 * @returns {object} { n, mean, sd, se, min, max, median, variance, cv }
 */
function descStats(arr) {
  const n = arr.length;
  if (n === 0) return null;
  const mean = arr.reduce((s, v) => s + v, 0) / n;
  const variance = arr.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / (n - 1);
  const sd = Math.sqrt(variance);
  const se = sd / Math.sqrt(n);
  const sorted = [...arr].sort((a, b) => a - b);
  const min = sorted[0];
  const max = sorted[n - 1];
  const median = n % 2 === 0
    ? (sorted[n / 2 - 1] + sorted[n / 2]) / 2
    : sorted[Math.floor(n / 2)];
  const cv = mean !== 0 ? (sd / mean) * 100 : null;
  return { n, mean, variance, sd, se, min, max, median, cv };
}

/**
 * Independent-samples Welch t-test (two-tailed).
 * With equal n and assumed equal variance this matches the pooled-variance t-test
 * used in the workbook.
 *
 * Formula (pooled, equal n):
 *   sp² = ((n1-1)·s1² + (n2-1)·s2²) / (n1+n2-2)
 *   t   = (mean1 - mean2) / sqrt(sp² · (1/n1 + 1/n2))
 *   df  = n1 + n2 - 2
 *
 * @param {number[]} a  - group 1 values
 * @param {number[]} b  - group 2 values
 * @returns {object} { t, df, pValue, meanDiff, ci95Lower, ci95Upper, significant }
 */
function independentTTest(a, b, alpha = 0.05) {
  const sa = descStats(a);
  const sb = descStats(b);
  const n1 = sa.n, n2 = sb.n;
  const df = n1 + n2 - 2;

  const sp2 = ((n1 - 1) * sa.variance + (n2 - 1) * sb.variance) / df;
  const se = Math.sqrt(sp2 * (1 / n1 + 1 / n2));
  const t = (sa.mean - sb.mean) / se;

  const p = tDistPValue(Math.abs(t), df);
  const tCrit = tCritical(alpha, df);

  const meanDiff = sa.mean - sb.mean;
  return {
    t,
    df,
    pValue: p,
    meanDiff,
    se,
    ci95Lower: meanDiff - tCrit * se,
    ci95Upper: meanDiff + tCrit * se,
    significant: p <= alpha,
    tCritical: tCrit,
  };
}

/**
 * One-way ANOVA (2 groups). With 2 treatments F = t².
 * @param {number[]} a  - group 1
 * @param {number[]} b  - group 2
 */
function oneWayAnova(a, b) {
  const all = [...a, ...b];
  const sa = descStats(a);
  const sb = descStats(b);
  const N = all.length;
  const grandMean = all.reduce((s, v) => s + v, 0) / N;

  const ssTotal = all.reduce((s, v) => s + Math.pow(v - grandMean, 2), 0);
  const ssTreatment = a.length * Math.pow(sa.mean - grandMean, 2) + b.length * Math.pow(sb.mean - grandMean, 2);
  const ssError = ssTotal - ssTreatment;

  const dfTreatment = 1;
  const dfError = N - 2;
  const dfTotal = N - 1;

  const msTreatment = ssTreatment / dfTreatment;
  const msError = ssError / dfError;
  const F = msTreatment / msError;
  const pValue = fDistPValue(F, dfTreatment, dfError);

  return { ssTotal, ssTreatment, ssError, dfTreatment, dfError, dfTotal, msTreatment, msError, F, pValue };
}

/**
 * RCBD ANOVA: Yij = mu + Ti + Bj + eij
 * @param {number[][]} data  - data[i][j] = yield of treatment i, block j
 *                            data[0] = CA values, data[1] = CF values
 */
function rcbdAnova(data) {
  const t = data.length;
  const b = data[0].length;
  const N = t * b;
  const all = data.flat();
  const grandTotal = all.reduce((s, v) => s + v, 0);
  const grandMean = grandTotal / N;
  const CF = (grandTotal * grandTotal) / N;

  const ssTotal = all.reduce((s, v) => s + v * v, 0) - CF;

  let ssTreatment = 0;
  for (let i = 0; i < t; i++) {
    const Ti = data[i].reduce((s, v) => s + v, 0);
    ssTreatment += (Ti * Ti) / b;
  }
  ssTreatment -= CF;

  let ssBlock = 0;
  for (let j = 0; j < b; j++) {
    let Bj = 0;
    for (let i = 0; i < t; i++) Bj += data[i][j];
    ssBlock += (Bj * Bj) / t;
  }
  ssBlock -= CF;

  const ssError = ssTotal - ssTreatment - ssBlock;

  const dfTreatment = t - 1;
  const dfBlock = b - 1;
  const dfError = (t - 1) * (b - 1);
  const dfTotal = N - 1;

  const msTreatment = ssTreatment / dfTreatment;
  const msBlock = ssBlock / dfBlock;
  const msError = ssError / dfError;
  const fTreatment = msTreatment / msError;
  const fBlock = msBlock / msError;

  const treatmentMeans = data.map(row => row.reduce((s, v) => s + v, 0) / b);
  const treatmentEffects = treatmentMeans.map(m => m - grandMean);

  const blockMeans = [];
  for (let j = 0; j < b; j++) {
    let sum = 0;
    for (let i = 0; i < t; i++) sum += data[i][j];
    blockMeans.push(sum / t);
  }
  const blockEffects = blockMeans.map(m => m - grandMean);

  return {
    grandMean, CF, N, t, b,
    ssTotal, ssTreatment, ssBlock, ssError,
    dfTreatment, dfBlock, dfError, dfTotal,
    msTreatment, msBlock, msError,
    fTreatment, fBlock,
    pTreatment: fDistPValue(fTreatment, dfTreatment, dfError),
    pBlock: fDistPValue(fBlock, dfBlock, dfError),
    treatmentEffects,
    blockEffects,
    blockMeans,
    treatmentMeans,
  };
}

function tDistPValue(t, df) {
  const x = df / (df + t * t);
  const ibeta = incompleteBeta(df / 2, 0.5, x);
  return ibeta;
}

function fDistPValue(F, df1, df2) {
  const x = df2 / (df2 + df1 * F);
  return incompleteBeta(df2 / 2, df1 / 2, x);
}

function tCritical(alpha, df) {
  const table = {
    '0.05_6': 2.4469118511449697,
    '0.05_3': 3.1824463052828088,
    '0.05_7': 2.3646242510103185,
  };
  const key = `${alpha}_${df}`;
  if (table[key]) return table[key];
  let lo = 0, hi = 20;
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2;
    if (tDistPValue(mid, df) > alpha) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}

function incompleteBeta(a, b, x) {
  if (x < 0 || x > 1) return NaN;
  if (x === 0) return 0;
  if (x === 1) return 1;
  const lbeta = lgamma(a) + lgamma(b) - lgamma(a + b);
  const front = Math.exp(Math.log(x) * a + Math.log(1 - x) * b - lbeta) / a;
  return front * betaCF(a, b, x);
}

function betaCF(a, b, x) {
  const MAXIT = 200, EPS = 3e-7;
  let c = 1, d = 1 - (a + b) * x / (a + 1);
  if (Math.abs(d) < 1e-30) d = 1e-30;
  d = 1 / d;
  let h = d;
  for (let m = 1; m <= MAXIT; m++) {
    let aa = m * (b - m) * x / ((a + 2 * m - 1) * (a + 2 * m));
    d = 1 + aa * d; if (Math.abs(d) < 1e-30) d = 1e-30; d = 1 / d;
    c = 1 + aa / c; if (Math.abs(c) < 1e-30) c = 1e-30;
    h *= d * c;
    aa = -(a + m) * (a + b + m) * x / ((a + 2 * m) * (a + 2 * m + 1));
    d = 1 + aa * d; if (Math.abs(d) < 1e-30) d = 1e-30; d = 1 / d;
    c = 1 + aa / c; if (Math.abs(c) < 1e-30) c = 1e-30;
    const del = d * c;
    h *= del;
    if (Math.abs(del - 1) < EPS) break;
  }
  return h;
}

function lgamma(x) {
  const g = 7;
  const c = [
    0.99999999999980993, 676.5203681218851, -1259.1392167218851,
    771.32342877765313, -176.61502916214059, 12.507343278686905,
    -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7,
  ];
  if (x < 0.5) return Math.log(Math.PI / Math.sin(Math.PI * x)) - lgamma(1 - x);
  x -= 1;
  let a = c[0];
  const t = x + g + 0.5;
  for (let i = 1; i < g + 2; i++) a += c[i] / (x + i);
  return 0.5 * Math.log(2 * Math.PI) + (x + 0.5) * Math.log(t) - t + Math.log(a);
}

/**
 * Auto-select statistical test based on number of treatments.
 * Doc Section 10.1 rule:
 *   Exactly 2 treatments → independent samples t-test
 *   3 or more treatments → one-way ANOVA with post-hoc
 *
 * @param {object} treatmentData  - { [treatmentCode]: number[] }
 *   e.g. { CA: [1.2, 1.4, 1.3, 1.5], CF: [1.0, 0.9, 1.1, 1.0] }
 * @param {number} alpha
 * @returns {object} { testType, result, disabled, disabledReason }
 */
function autoSelectTest(treatmentData, alpha = 0.05) {
  const treatments = Object.keys(treatmentData);
  const n = treatments.length;

  // Validate RCBD: each treatment must have same number of observations
  const counts = treatments.map(t => treatmentData[t].length);
  const minCount = Math.min(...counts);

  if (minCount < 2) {
    return {
      testType: null,
      result: null,
      disabled: true,
      disabledReason: 'Minimum 2 replications required for statistical testing.',
    };
  }

  // Check all treatments present (complete block structure)
  if (counts.some(c => c !== counts[0])) {
    return {
      testType: null,
      result: null,
      disabled: true,
      disabledReason:
        'Unequal replication counts — RCBD structure incomplete. Balance the design before running statistics.',
    };
  }

  if (n === 2) {
    const [t1, t2] = treatments;
    const result = independentTTest(treatmentData[t1], treatmentData[t2], alpha);
    return { testType: 't-test', treatments, result, disabled: false };
  }

  if (n >= 3) {
    // One-way ANOVA across all treatment arrays
    const groups = treatments.map(t => treatmentData[t]);
    const result = oneWayAnovaMulti(groups, treatments, alpha);
    return { testType: 'ANOVA', treatments, result, disabled: false };
  }

  return {
    testType: null,
    result: null,
    disabled: true,
    disabledReason: 'Fewer than 2 treatments — statistical comparison not applicable.',
  };
}

/**
 * One-way ANOVA for k >= 3 groups.
 * @param {number[][]} groups - array of value arrays per treatment
 * @param {string[]} labels
 * @param {number} alpha
 */
function oneWayAnovaMulti(groups, labels, alpha = 0.05) {
  const k = groups.length;
  const N = groups.reduce((s, g) => s + g.length, 0);
  const all = groups.flat();
  const grandMean = all.reduce((s, v) => s + v, 0) / N;

  const ssTreatment = groups.reduce((s, g) => {
    const mean = g.reduce((a, b) => a + b, 0) / g.length;
    return s + g.length * Math.pow(mean - grandMean, 2);
  }, 0);

  const ssError = groups.reduce((s, g) => {
    const mean = g.reduce((a, b) => a + b, 0) / g.length;
    return s + g.reduce((es, v) => es + Math.pow(v - mean, 2), 0);
  }, 0);

  const dfTreatment = k - 1;
  const dfError = N - k;
  const msTreatment = ssTreatment / dfTreatment;
  const msError = ssError / dfError;
  const F = msTreatment / msError;
  const pValue = fDistPValue(F, dfTreatment, dfError);

  // Treatment means and LSD post-hoc
  const means = groups.map((g, i) => ({
    label: labels[i],
    mean: g.reduce((a, b) => a + b, 0) / g.length,
    n: g.length,
  }));

  const lsd = tCritical(alpha, dfError) * Math.sqrt((msError * 2) / groups[0].length);

  const pairwiseComparisons = [];
  for (let i = 0; i < k; i++) {
    for (let j = i + 1; j < k; j++) {
      const diff = Math.abs(means[i].mean - means[j].mean);
      pairwiseComparisons.push({
        pair: `${labels[i]} vs ${labels[j]}`,
        diff,
        significant: diff > lsd,
      });
    }
  }

  return {
    k,
    N,
    grandMean,
    ssTreatment,
    ssError,
    dfTreatment,
    dfError,
    msTreatment,
    msError,
    F,
    pValue,
    significant: pValue <= alpha,
    means,
    lsd,
    pairwiseComparisons,
    ssTotal: ssTreatment + ssError,
    dfTotal: N - 1,
  };
}

module.exports = {
  descStats,
  independentTTest,
  oneWayAnova,
  oneWayAnovaMulti,
  rcbdAnova,
  autoSelectTest,
};
