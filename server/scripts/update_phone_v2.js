const { createClient } = require('@supabase/supabase-js');

// 配置
require('dotenv').config();
const supabaseUrl = process.env.COZE_SUPABASE_URL;
const supabaseKey = process.env.COZE_SUPABASE_ANON_KEY;

// 初始化 Supabase 客户端
const client = createClient(supabaseUrl, supabaseKey);

async function updatePhoneNumber() {
  try {
    const name = '穆斯塔帕·莫明';
    const newPhone = '18699079978';

    console.log('1. 查找人员：穆斯塔帕·莫明\n');

    // 查找记录
    const { data: records, error: searchError } = await client
      .from('check_ins')
      .select('*')
      .eq('name', name);

    if (searchError) {
      console.log('❌ 查找失败:', searchError);
      process.exit(1);
    }

    if (!records || records.length === 0) {
      console.log('❌ 未找到穆斯塔帕·莫明');
      process.exit(1);
    }

    console.log(`找到 ${records.length} 条记录：\n`);

    records.forEach((record, index) => {
      console.log(`记录 ${index + 1}:`);
      console.log(`  ID: ${record.id}`);
      console.log(`  姓名: ${record.name}`);
      console.log(`  当前电话: ${record.phone || '未设置'}`);
      console.log(`  身份证: ${record.id_card || '未设置'}`);
      console.log(`  入住时间: ${record.check_in_time}`);
      console.log('');
    });

    // 更新所有匹配记录的电话号码
    console.log('2. 更新电话号码...\n');

    const { data: updateResult, error: updateError } = await client
      .from('check_ins')
      .update({ phone: newPhone })
      .eq('name', name);

    if (updateError) {
      console.log('❌ 更新失败:', updateError);
      process.exit(1);
    }

    console.log('✅ 更新成功！');
    console.log(`   更新了 ${records.length} 条记录`);
    console.log(`   新电话号码: ${newPhone}\n`);

    // 验证更新
    console.log('3. 验证更新结果...\n');

    const { data: verifyResult } = await client
      .from('check_ins')
      .select('name, phone')
      .eq('name', name);

    if (verifyResult) {
      console.log('✅ 验证成功！\n');
      verifyResult.forEach((record, index) => {
        console.log(`记录 ${index + 1}:`);
        console.log(`  姓名: ${record.name}`);
        console.log(`  电话: ${record.phone}`);
      });
    } else {
      console.log('❌ 验证失败');
      process.exit(1);
    }

    console.log('\n✅✅✅ 电话号码修改完成！✅✅✅');
    console.log('\n修改摘要：');
    console.log(`  姓名: 穆斯塔帕·莫明`);
    console.log(`  新电话号码: 18699079978`);
    console.log(`  修改记录数: ${records.length}`);

  } catch (error) {
    console.error('❌ 发生错误:', error);
    process.exit(1);
  }
}

updatePhoneNumber();
