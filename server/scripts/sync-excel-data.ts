/**
 * Excel数据同步脚本
 * 将Excel中的入住和搬离数据同步到数据库
 */

import * as ExcelJS from 'exceljs';
import { createClient } from '@supabase/supabase-js';

// Supabase配置
const supabaseUrl = process.env.COZE_SUPABASE_URL!;
const supabaseKey = process.env.COZE_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ 请设置环境变量 COZE_SUPABASE_URL 和 COZE_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Excel文件路径
const EXCEL_FILE_PATH = '/workspace/projects/assets/2_南四巷住宿人员名单3月21号.xlsx';

// 楼层映射：工作表名 -> 楼层号
const FLOOR_MAP: { [key: string]: number } = {
  '二楼': 2,
  '三楼': 3,
  '四楼': 4,
};

// 铺位映射
const POSITION_MAP: { [key: string]: string } = {
  '上铺': 'upper',
  '下铺': 'lower',
};

interface CheckInData {
  name: string;
  idCard: string;
  phone: string;
  checkInTime: string;
  floor: number;
  bedNumber: number;
  position: string;
}

interface CheckOutData {
  name: string;
  idCard: string;
  phone: string;
  checkInTime: string;
  checkOutTime: string;
  floor: number;
  bedNumber: number;
  position: string;
}

/**
 * 格式化日期
 */
function formatDate(dateValue: any): string | null {
  if (!dateValue) return null;
  
  if (dateValue instanceof Date) {
    return dateValue.toISOString();
  }
  
  // 尝试解析字符串日期
  const parsed = new Date(dateValue);
  if (!isNaN(parsed.getTime())) {
    return parsed.toISOString();
  }
  
  return null;
}

/**
 * 格式化电话号码
 */
function formatPhone(phoneValue: any): string {
  if (!phoneValue) return '';
  
  // 如果是数字，转换为字符串
  if (typeof phoneValue === 'number') {
    return String(phoneValue);
  }
  
  return String(phoneValue).trim();
}

/**
 * 解析床号 (如 "1号床" -> 1)
 */
function parseBedNumber(bedStr: string): number {
  const match = bedStr?.match(/(\d+)/);
  return match ? parseInt(match[1]) : 0;
}

/**
 * 清空现有数据
 */
async function clearExistingData() {
  console.log('🗑️  清空现有数据...');
  
  // 先删除搬离记录（有外键关联）
  const { error: checkoutError } = await supabase
    .from('check_outs')
    .delete()
    .neq('id', 0);
  
  if (checkoutError) {
    console.error('清空搬离记录失败:', checkoutError);
  } else {
    console.log('  ✅ 搬离记录已清空');
  }
  
  // 再删除入住记录
  const { error: checkinError } = await supabase
    .from('check_ins')
    .delete()
    .neq('id', 0);
  
  if (checkinError) {
    console.error('清空入住记录失败:', checkinError);
  } else {
    console.log('  ✅ 入住记录已清空');
  }
  
  // 重置床位状态
  const { error: bedError } = await supabase
    .from('beds')
    .update({ status: 'empty' })
    .neq('id', 0);
  
  if (bedError) {
    console.error('重置床位状态失败:', bedError);
  } else {
    console.log('  ✅ 床位状态已重置');
  }
}

/**
 * 确保床位存在
 */
async function ensureBedsExist() {
  console.log('🛏️  检查床位数据...');
  
  // 检查是否已有床位数据
  const { data: existingBeds, error } = await supabase
    .from('beds')
    .select('id')
    .limit(1);
  
  if (error) {
    console.error('查询床位失败:', error);
    return;
  }
  
  if (existingBeds && existingBeds.length > 0) {
    console.log('  ✅ 床位数据已存在，跳过创建');
    return;
  }
  
  // 创建床位数据：2-4楼，每层15床，每床上下铺
  console.log('  📝 创建床位数据...');
  const beds: Array<{ floor: number; bed_number: number; position: string; status: string }> = [];
  
  for (let floor = 2; floor <= 4; floor++) {
    for (let bedNumber = 1; bedNumber <= 15; bedNumber++) {
      beds.push(
        { floor, bed_number: bedNumber, position: 'upper', status: 'empty' },
        { floor, bed_number: bedNumber, position: 'lower', status: 'empty' }
      );
    }
  }
  
  const { error: insertError } = await supabase
    .from('beds')
    .insert(beds);
  
  if (insertError) {
    console.error('创建床位失败:', insertError);
  } else {
    console.log(`  ✅ 创建了 ${beds.length} 个床位`);
  }
}

/**
 * 读取Excel数据
 */
async function readExcelData(): Promise<{ checkIns: CheckInData[], checkOuts: CheckOutData[] }> {
  console.log('📖 读取Excel文件...');
  
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(EXCEL_FILE_PATH);
  
  const checkIns: CheckInData[] = [];
  const checkOuts: CheckOutData[] = [];
  
  for (const [sheetName, floor] of Object.entries(FLOOR_MAP)) {
    const sheet = workbook.getWorksheet(sheetName);
    if (!sheet) {
      console.log(`  ⚠️  工作表 "${sheetName}" 不存在，跳过`);
      continue;
    }
    
    console.log(`  📄 处理工作表: ${sheetName} (楼层 ${floor})`);
    
    // 跳过前两行（标题行）
    sheet.eachRow((row, rowNum) => {
      if (rowNum <= 2) return;
      
      const values = row.values as any[];
      
      // 解析入住人员数据（列A-G）
      // A: 序号, B: 入住日期, C: 床号, D: 铺位, E: 姓名, F: 身份证, G: 电话
      const checkInDate = formatDate(values[2]);
      const bedNumber = parseBedNumber(values[3]);
      const positionText = values[4];
      const name = values[5];
      const idCard = values[6];
      const phone = formatPhone(values[7]);
      
      if (name && bedNumber > 0) {
        const position = POSITION_MAP[positionText] || 'upper';
        checkIns.push({
          name: String(name).trim(),
          idCard: idCard ? String(idCard).trim() : '',
          phone: phone,
          checkInTime: checkInDate || new Date().toISOString(),
          floor,
          bedNumber,
          position,
        });
      }
      
      // 解析搬离人员数据（列I-K）
      // I: 搬走人员姓名, J: 入住日期, K: 搬走日期
      const checkoutName = values[9];
      const checkoutCheckInDate = formatDate(values[10]);
      const checkoutDate = formatDate(values[11]);
      
      // 对于搬离人员，使用同一行的床位信息
      if (checkoutName && bedNumber > 0 && checkoutDate) {
        const position = POSITION_MAP[positionText] || 'upper';
        checkOuts.push({
          name: String(checkoutName).trim(),
          idCard: '', // 搬离人员没有身份证信息
          phone: '',
          checkInTime: checkoutCheckInDate || new Date().toISOString(),
          checkOutTime: checkoutDate,
          floor,
          bedNumber,
          position,
        });
      }
    });
  }
  
  console.log(`  ✅ 读取完成: ${checkIns.length} 条入住记录, ${checkOuts.length} 条搬离记录`);
  
  return { checkIns, checkOuts };
}

/**
 * 同步入住数据
 */
async function syncCheckIns(checkIns: CheckInData[]) {
  console.log('📥 同步入住数据...');
  
  let successCount = 0;
  let errorCount = 0;
  
  // 获取所有床位映射
  const { data: beds, error: bedsError } = await supabase
    .from('beds')
    .select('id, floor, bed_number, position');
  
  if (bedsError || !beds) {
    console.error('获取床位数据失败:', bedsError);
    return;
  }
  
  // 创建床位映射：floor_bedNumber_position -> bedId
  const bedMap = new Map<string, number>();
  beds.forEach(bed => {
    const key = `${bed.floor}_${bed.bed_number}_${bed.position}`;
    bedMap.set(key, bed.id);
  });
  
  for (const checkIn of checkIns) {
    const bedKey = `${checkIn.floor}_${checkIn.bedNumber}_${checkIn.position}`;
    const bedId = bedMap.get(bedKey);
    
    if (!bedId) {
      console.error(`  ❌ 找不到床位: ${bedKey}`);
      errorCount++;
      continue;
    }
    
    // 创建入住记录
    const { data: insertedCheckIn, error: insertError } = await supabase
      .from('check_ins')
      .insert({
        bed_id: bedId,
        name: checkIn.name,
        id_card: checkIn.idCard,
        phone: checkIn.phone,
        check_in_time: checkIn.checkInTime,
      })
      .select()
      .single();
    
    if (insertError) {
      console.error(`  ❌ 入住记录创建失败 [${checkIn.name}]:`, insertError.message);
      errorCount++;
      continue;
    }
    
    // 更新床位状态为占用
    const { error: updateError } = await supabase
      .from('beds')
      .update({ status: 'occupied' })
      .eq('id', bedId);
    
    if (updateError) {
      console.error(`  ⚠️  更新床位状态失败 [${checkIn.name}]:`, updateError.message);
    }
    
    successCount++;
  }
  
  console.log(`  ✅ 入住同步完成: 成功 ${successCount} 条, 失败 ${errorCount} 条`);
}

/**
 * 同步搬离数据
 */
async function syncCheckOuts(checkOuts: CheckOutData[]) {
  console.log('📤 同步搬离数据...');
  
  let successCount = 0;
  let errorCount = 0;
  
  // 获取所有床位映射
  const { data: beds, error: bedsError } = await supabase
    .from('beds')
    .select('id, floor, bed_number, position');
  
  if (bedsError || !beds) {
    console.error('获取床位数据失败:', bedsError);
    return;
  }
  
  // 创建床位映射
  const bedMap = new Map<string, number>();
  beds.forEach(bed => {
    const key = `${bed.floor}_${bed.bed_number}_${bed.position}`;
    bedMap.set(key, bed.id);
  });
  
  for (const checkOut of checkOuts) {
    const bedKey = `${checkOut.floor}_${checkOut.bedNumber}_${checkOut.position}`;
    const bedId = bedMap.get(bedKey);
    
    if (!bedId) {
      console.error(`  ❌ 找不到床位: ${bedKey}`);
      errorCount++;
      continue;
    }
    
    // 创建搬离记录（check_in_id 设置为0，因为是历史数据）
    const { error: insertError } = await supabase
      .from('check_outs')
      .insert({
        check_in_id: 0, // 历史数据，无关联入住记录
        bed_id: bedId,
        name: checkOut.name,
        id_card: checkOut.idCard,
        phone: checkOut.phone,
        check_in_time: checkOut.checkInTime,
        check_out_time: checkOut.checkOutTime,
      });
    
    if (insertError) {
      console.error(`  ❌ 搬离记录创建失败 [${checkOut.name}]:`, insertError.message);
      errorCount++;
      continue;
    }
    
    successCount++;
  }
  
  console.log(`  ✅ 搬离同步完成: 成功 ${successCount} 条, 失败 ${errorCount} 条`);
}

/**
 * 主函数
 */
async function main() {
  console.log('========================================');
  console.log('🚀 开始同步Excel数据到数据库');
  console.log('========================================\n');
  
  try {
    // 1. 清空现有数据
    await clearExistingData();
    console.log('');
    
    // 2. 确保床位存在
    await ensureBedsExist();
    console.log('');
    
    // 3. 读取Excel数据
    const { checkIns, checkOuts } = await readExcelData();
    console.log('');
    
    // 4. 同步入住数据
    await syncCheckIns(checkIns);
    console.log('');
    
    // 5. 同步搬离数据
    await syncCheckOuts(checkOuts);
    console.log('');
    
    console.log('========================================');
    console.log('✅ 数据同步完成！');
    console.log('========================================');
    
  } catch (error) {
    console.error('❌ 同步失败:', error);
    process.exit(1);
  }
}

main();
