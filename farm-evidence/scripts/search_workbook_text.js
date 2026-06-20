import path from 'path';
import XLSX from 'xlsx';

const workbookPath = path.resolve('../Data recording Workbook.xlsx');
const wb = XLSX.readFile(workbookPath);
const search = (patterns) => {
  const names = wb.SheetNames;
  for (const name of names) {
    const rows = XLSX.utils.sheet_to_json(wb.Sheets[name], { defval: null, raw: false });
    rows.forEach((row, idx) => {
      const values = Object.values(row).filter((v) => v !== null && v !== undefined);
      const text = values.join(' ').toLowerCase();
      if (patterns.some((pattern) => text.includes(pattern))) {
        console.log(`${name} row ${idx + 1}:`, JSON.stringify(row));
      }
    });
  }
};
search(['p-value', 'p value', 'cohen', 't-stat', 't stat', 't statistic', 'df', 'ui', 'mean diff', 'effect size']);
