import { getSupabaseClient } from '../src/storage/database/supabase-client';

async function deleteNansiFloor1() {
  const client = getSupabaseClient();

  // 1. 获取南四巷一楼的床位ID
  const { data: floor1Beds, error: bedsError } = await client
    .from('beds')
    .select('id')
    .eq('dormitory', 'nansi')
    .eq('floor', 1);

  if (bedsError) {
    console.error('查询床位失败:', bedsError);
    return;
  }

  const bedIds = floor1Beds?.map((b: any) => b.id) || [];
  console.log(`找到 ${bedIds.length} 个一楼床位`);

  if (bedIds.length === 0) {
    console.log('南四巷一楼没有数据，无需删除');
    return;
  }

  // 2. 删除关联的入住记录
  const { error: checkInError } = await client
    .from('check_ins')
    .delete()
    .in('bed_id', bedIds);

  if (checkInError) {
    console.error('删除入住记录失败:', checkInError);
  } else {
    console.log('已删除一楼入住记录');
  }

  // 3. 删除关联的搬离记录
  const { error: checkOutError } = await client
    .from('check_outs')
    .delete()
    .in('bed_id', bedIds);

  if (checkOutError) {
    console.error('删除搬离记录失败:', checkOutError);
  } else {
    console.log('已删除一楼搬离记录');
  }

  // 4. 删除床位
  const { error: deleteBedsError } = await client
    .from('beds')
    .delete()
    .eq('dormitory', 'nansi')
    .eq('floor', 1);

  if (deleteBedsError) {
    console.error('删除床位失败:', deleteBedsError);
  } else {
    console.log('已删除一楼所有床位');
  }

  console.log('✅ 南四巷一楼数据删除完成');
}

deleteNansiFloor1().catch(console.error);
