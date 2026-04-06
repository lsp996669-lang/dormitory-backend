const ExcelJS = require('exceljs');
const fs = require('fs');

async function analyze() {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile('/workspace/projects/人员列表.xlsx');

  const worksheet = workbook.getWorksheet(1);
  const names = [];

  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber > 1) {
      const name = row.getCell(1).value;
      if (name) {
        names.push(String(name).trim());
      }
    }
  });

  console.log('=== 人员名称列表 ===');
  console.log('总人数:', names.length);
  names.sort().forEach(n => console.log(n));

  fs.writeFileSync('/tmp/name_list.json', JSON.stringify(names.sort(), null, 2));
}

analyze().catch(console.error);
