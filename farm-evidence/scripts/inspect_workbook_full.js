import path from 'path';
import XLSX from 'xlsx';

const workbookPath = path.resolve('../Data recording Workbook.xlsx');
const wb = XLSX.readFile(workbookPath);
const printRows = (name, max) => {
  const sheet = wb.Sheets[name];
  if (!sheet) {
    console.log(`Sheet missing: ${name}`);
    return;
  }
  const rows = XLSX.utils.sheet_to_json(sheet, { defval: null });
  console.log('\n---', name, 'rows:', rows.length);
  rows.slice(0, max).forEach((row, index) => console.log(index + 1, JSON.stringify(row)));
};

printRows('Trial Parameters', 20);
printRows('CA-R1', 30);
printRows('CA-R2', 30);
printRows('CA-R3', 30);
printRows('CA-R4', 30);
printRows('CF-R1', 30);
printRows('CF-R2', 30);
printRows('CF-R3', 30);
printRows('CF-R4', 30);
printRows('Summary & CBA', 40);
printRows('Cost Structure', 40);
printRows('Statistical Analysis', 40);
printRows('RCBD Analysis', 40);
printRows('Yield Stability & Risk', 40);
printRows('Dashboard', 40);
