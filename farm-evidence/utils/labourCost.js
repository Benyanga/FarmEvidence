import { toMinutes } from './timeConverter.js';

/**
 * Workbook formula:
 *   totalLabourCost = numLabourers × (timeMinutes / (workingHoursPerDay × 60)) × wageRatePerDay
 *
 * i.e. convert time to fraction of a day, then multiply by day wage and number of workers.
 *
 * @param {object} row  - LabourCost document
 * @param {number} workingHoursPerDay
 * @returns {number} RWF
 */
function calcLabourRowCost(row, workingHoursPerDay = 8) {
  if (!row.time || !row.timeUnit || !row.wageRateRWFPerDay) return 0;
  const mins = toMinutes(row.time, row.timeUnit, workingHoursPerDay);
  const dayFraction = mins / (workingHoursPerDay * 60);
  return row.numLabourers * dayFraction * row.wageRateRWFPerDay;
}

export { calcLabourRowCost };
