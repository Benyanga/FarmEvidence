import path from 'path';
import XLSX from 'xlsx';
const workbookPath = path.resolve('../Data recording Workbook.xlsx');
const wb = XLSX.readFile(workbookPath);
const sheet = wb.Sheets['Statistical Analysis'];
if (!sheet) {
  console.error('Sheet missing');
  process.exit(1);
}
const rows = XLSX.utils.sheet_to_json(sheet, { defval: null, raw: false });
for (let i = 54; i <= 75 && i < rows.length; i++) {
  console.log(i+1, JSON.stringify(rows[i]));
}
