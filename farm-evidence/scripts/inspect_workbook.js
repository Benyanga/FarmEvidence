import path from 'path';
import XLSX from 'xlsx';

const workbookPath = path.resolve('../Data recording Workbook.xlsx');
console.log('Reading', workbookPath);
const wb = XLSX.readFile(workbookPath);
console.log('Sheets:', wb.SheetNames);
for (const name of wb.SheetNames) {
  const rows = XLSX.utils.sheet_to_json(wb.Sheets[name], { defval: null });
  console.log(`--- Sheet: ${name} rows: ${rows.length}`);
  console.log(rows.slice(0,3));
}
