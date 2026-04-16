const XLSX = require('xlsx');

const excelPath = '/tmp/checkin.xlsx';

async function findPerson() {
  try {
    console.log('读取 Excel 文件...');
    const workbook = XLSX.readFile(excelPath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);

    console.log(`找到 ${data.length} 条记录\n`);

    // 搜索包含"慕斯塔帕"或"莫明"的记录
    const matches = data.filter(row =>
      row['姓名'] && (
        row['姓名'].includes('慕斯塔帕') ||
        row['姓名'].includes('莫明')
      )
    );

    if (matches.length > 0) {
      console.log('找到匹配的记录：\n');
      matches.forEach((row, index) => {
        console.log(`记录 ${index + 1}:`);
        console.log(`  姓名: ${row['姓名']}`);
        console.log(`  电话: ${row['电话']}`);
        console.log(`  身份证: ${row['身份证']}`);
        console.log(`  宿舍: ${row['宿舍']}`);
        console.log(`  楼层: ${row['楼层']}`);
        console.log(`  房间/床位: ${row['房间/床位']}`);
        console.log(`  入住时间: ${row['入住时间']}`);
        console.log('');
      });
    } else {
      console.log('未找到包含"慕斯塔帕"或"莫明"的记录\n');
      console.log('前10条记录的姓名：');
      data.slice(0, 10).forEach((row, index) => {
        console.log(`${index + 1}. ${row['姓名']}`);
      });
    }

  } catch (error) {
    console.error('发生错误:', error);
    process.exit(1);
  }
}

findPerson();
