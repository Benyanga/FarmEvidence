import * as XLSX from 'xlsx';

export function exportToXlsx(filename = 'cba-summary.xlsx', sheetName = 'CBA', columns = [], rows = []) {
  // Build AOA (array of arrays) with header row from columns
  const aoa = [];
  aoa.push(columns);
  rows.forEach(row => {
    const r = columns.map(col => row[col] !== undefined && row[col] !== null ? row[col] : '');
    aoa.push(r);
  });

  const ws = XLSX.utils.aoa_to_sheet(aoa);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, filename);
}
