const XLSX = require('xlsx');
const { createClient } = require('@supabase/supabase-js');

// 配置
require('dotenv').config();
const supabaseUrl = process.env.COZE_SUPABASE_URL;
const supabaseKey = process.env.COZE_SUPABASE_ANON_KEY;
const excelPath = '/tmp/checkin.xlsx';

// 初始化 Supabase 客户端
const client = createClient(supabaseUrl, supabaseKey);

async function findAndUpdatePhoneNumber() {
  try {
    console.log('1. 读取 Excel 文件...');
    const workbook = XLSX.readFile(excelPath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);

    console.log(`2. 找到 ${data.length} 条记录`);

    // 查找慕斯塔帕·莫明
    const person = data.find(row => row['姓名'] === '慕斯塔帕·莫明');

    if (!person) {
      console.log('❌ 未找到慕斯塔帕·莫明');
      process.exit(1);
    }

    console.log('3. 找到人员记录：');
    console.log(`   姓名: ${person['姓名']}`);
    console.log(`   当前电话: ${person['电话']}`);
    console.log(`   身份证: ${person['身份证']}`);
    console.log(`   宿舍: ${person['宿舍']}`);
    console.log(`   楼层: ${person['楼层']}`);
    console.log(`   房间/床位: ${person['房间/床位']}`);
    console.log(`   入住时间: ${person['入住时间']}`);

    // 从数据库更新电话号码
    console.log('\n4. 从数据库更新电话号码...');
    const { data: updateResult, error } = await client
      .from('check_ins')
      .update({ phone: '18699079978' })
      .eq('id_card', person['身份证']);

    if (error) {
      console.log('❌ 更新失败:', error);
      process.exit(1);
    }

    console.log('✅ 更新成功！');
    console.log('   新电话号码: 18699079978');

    // 验证更新
    console.log('\n5. 验证更新结果...');
    const { data: verifyResult } = await client
      .from('check_ins')
      .select('name, phone')
      .eq('id_card', person['身份证'])
      .single();

    if (verifyResult) {
      console.log('✅ 验证成功！');
      console.log(`   姓名: ${verifyResult.name}`);
      console.log(`   电话: ${verifyResult.phone}`);
    } else {
      console.log('❌ 验证失败');
      process.exit(1);
    }

    console.log('\n✅✅✅ 电话号码修改完成！✅✅✅');

  } catch (error) {
    console.error('❌ 发生错误:', error);
    process.exit(1);
  }
}

findAndUpdatePhoneNumber();
