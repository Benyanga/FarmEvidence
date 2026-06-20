/**
 * Convert labour time to minutes regardless of input unit.
 * Workbook logic: all time converted through minutes before cost calculation.
 * @param {number} time
 * @param {'min'|'hr'|'day'} unit
 * @param {number} workingHoursPerDay
 * @returns {number} minutes
 */
function toMinutes(time, unit, workingHoursPerDay = 8) {
  switch (unit) {
    case 'min': return time;
    case 'hr':  return time * 60;
    case 'day': return time * workingHoursPerDay * 60;
    default:    return 0;
  }
}

export { toMinutes };
