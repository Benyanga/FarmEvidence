const XLSX = require('xlsx');
const path = require('path');

const filePath = path.resolve(__dirname, '..', 'Data Workbook.xlsx');
console.log('Reading:', filePath);
const wb = XLSX.readFile(filePath, {cellNF: false, cellDates: true});
const sheets = wb.SheetNames;
console.log('Sheets:', sheets.join(', '));

sheets.forEach((name) => {
  const ws = wb.Sheets[name];
  const json = XLSX.utils.sheet_to_json(ws, {header: 1, defval: ''});
  console.log('\n=== Sheet:', name, '===');
  if (json.length === 0) {
    console.log('(empty)');
    return;
  }
  const header = json[0];
  console.log('Header columns (count ' + header.length + '):', header.join(' | '));
  const sampleRows = json.slice(1, 6);
  console.log('Sample rows (up to 5):');
  sampleRows.forEach((r, i) => console.log(i+1, '>', r.join(' | ')));
});
