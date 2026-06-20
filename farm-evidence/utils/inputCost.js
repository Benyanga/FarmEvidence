/**
 * Workbook formula: totalInputCost = quantity × unitCostRWF
 */
function calcInputRowCost(row) {
  return (row.quantity || 0) * (row.unitCostRWF || 0);
}

export { calcInputRowCost };
