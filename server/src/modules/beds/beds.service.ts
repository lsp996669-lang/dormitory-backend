import { Injectable, OnModuleInit } from '@nestjs/common';
import { getSupabaseClient } from '@/storage/database/supabase-client';

@Injectable()
export class BedsService implements OnModuleInit {
  async onModuleInit() {
    // 启动时检查并初始化床位
    await this.ensureBedsExist();
  }

  private async ensureBedsExist() {
    const client = getSupabaseClient();

    // 检查是否已有床位数据
    const { data: existingBeds, error } = await client
      .from('beds')
      .select('id')
      .limit(1);

    if (error) {
      console.error('检查床位失败:', error);
      return;
    }

    // 如果没有床位数据，自动初始化
    if (!existingBeds || existingBeds.length === 0) {
      console.log('未找到床位数据，开始初始化...');
      await this.initBeds();
    }
  }

  async initBeds() {
    const client = getSupabaseClient();

    // 检查是否已有床位
    const { data: existingBeds } = await client
      .from('beds')
      .select('id')
      .limit(1);

    if (existingBeds && existingBeds.length > 0) {
      return {
        code: 200,
        msg: '床位已存在，无需初始化',
        data: null,
      };
    }

    // 初始化4层楼的床位，每层15个床铺，每个床铺分上下铺
    const beds: Array<{
      floor: number;
      bed_number: number;
      position: string;
      status: string;
    }> = [];
    for (let floor = 1; floor <= 4; floor++) {
      for (let bedNum = 1; bedNum <= 15; bedNum++) {
        beds.push({
          floor,
          bed_number: bedNum,
          position: 'upper',
          status: 'empty',
        });
        beds.push({
          floor,
          bed_number: bedNum,
          position: 'lower',
          status: 'empty',
        });
      }
    }

    const { error } = await client.from('beds').insert(beds);

    if (error) {
      console.error('初始化床位失败:', error);
      throw new Error('初始化失败');
    }

    console.log(`成功初始化 ${beds.length} 个床位`);
    return {
      code: 200,
      msg: '初始化成功',
      data: { count: beds.length },
    };
  }

  async getBedsByFloor(floor: number) {
    const client = getSupabaseClient();

    console.log(`[BedsService] 获取${floor}楼床位数据...`);

    // 获取该楼层的所有床位
    const { data: beds, error } = await client
      .from('beds')
      .select('*')
      .eq('floor', floor)
      .order('bed_number', { ascending: true })
      .order('position', { ascending: true });

    if (error) {
      console.error('[BedsService] 获取床位失败:', error);
      throw new Error('获取床位失败');
    }

    console.log(`[BedsService] 查询到 ${beds?.length || 0} 个床位`);

    // 如果没有床位，直接返回空数组
    if (!beds || beds.length === 0) {
      return {
        code: 200,
        msg: '获取成功',
        data: [],
      };
    }

    // 获取该楼层所有入住记录
    const bedIds = beds.map(b => b.id);
    const { data: checkIns, error: checkInError } = await client
      .from('check_ins')
      .select('id, bed_id, name, id_card, phone, check_in_time')
      .in('bed_id', bedIds);

    if (checkInError) {
      console.error('[BedsService] 获取入住记录失败:', checkInError);
    }

    console.log(`[BedsService] 查询到 ${checkIns?.length || 0} 条入住记录`);

    // 组装数据
    const bedsData = beds?.map(bed => {
      const checkIn = checkIns?.find(c => c.bed_id === bed.id);
      return {
        ...bed,
        checkIn: checkIn && bed.status === 'occupied' ? checkIn : null,
      };
    });

    console.log(`[BedsService] 返回 ${bedsData?.length || 0} 条床位数据`);

    return {
      code: 200,
      msg: '获取成功',
      data: bedsData,
    };
  }

  async getFloorStats() {
    const client = getSupabaseClient();

    const stats: Array<{
      floor: number;
      totalBeds: number;
      occupiedBeds: number;
      emptyBeds: number;
    }> = [];
    for (let floor = 1; floor <= 4; floor++) {
      const { data: beds, error } = await client
        .from('beds')
        .select('status')
        .eq('floor', floor);

      if (error) {
        console.error(`获取${floor}楼统计失败:`, error);
        stats.push({
          floor,
          totalBeds: 30,
          occupiedBeds: 0,
          emptyBeds: 30,
        });
        continue;
      }

      const totalBeds = beds?.length || 30;
      const occupiedBeds = beds?.filter(b => b.status === 'occupied').length || 0;
      const emptyBeds = totalBeds - occupiedBeds;

      stats.push({
        floor,
        totalBeds,
        occupiedBeds,
        emptyBeds,
      });
    }

    return {
      code: 200,
      msg: '获取成功',
      data: stats,
    };
  }
}
