import path from 'path';
import XLSX from 'xlsx';
const workbookPath = path.resolve('../Data recording Workbook.xlsx');
const wb = XLSX.readFile(workbookPath);
const sheet = wb.Sheets['Trial Parameters'];
const rows = XLSX.utils.sheet_to_json(sheet, { defval: null, raw: false });
for (let i = 0; i < Math.min(rows.length, 40); i++) {
  console.log(i+1, JSON.stringify(rows[i]));
}
