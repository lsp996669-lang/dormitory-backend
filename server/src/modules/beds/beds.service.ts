import { Injectable, OnModuleInit } from '@nestjs/common';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// 南二巷宿舍房间配置
interface RoomConfig {
  room: string;
  bedCount: number;
  bedPositions: number[];
}

const NAN_TWO_ROOM_CONFIG: Record<number, RoomConfig[]> = {
  2: [
    { room: '201', bedCount: 2, bedPositions: [1, 2] },
    { room: '202', bedCount: 3, bedPositions: [1, 2, 3] },
    { room: '203', bedCount: 3, bedPositions: [1, 2, 3] },
    { room: '204', bedCount: 2, bedPositions: [1, 2] },
  ],
  3: [
    { room: '301', bedCount: 3, bedPositions: [1, 2, 3] },
    { room: '302', bedCount: 3, bedPositions: [1, 2, 3] },
    { room: '303', bedCount: 2, bedPositions: [1, 2] },
    { room: '304', bedCount: 3, bedPositions: [1, 2, 3] },
  ],
  4: [
    { room: '401', bedCount: 2, bedPositions: [1, 2] },
    { room: '402', bedCount: 2, bedPositions: [1, 2] },
    { room: '大厅', bedCount: 4, bedPositions: [1, 2, 3, 4] },
  ],
};

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
      dormitory: string;
      room: string;
    }> = [];
    for (let floor = 1; floor <= 4; floor++) {
      for (let bedNum = 1; bedNum <= 15; bedNum++) {
        beds.push({
          floor,
          bed_number: bedNum,
          position: 'upper',
          status: 'empty',
          dormitory: 'nansi',
          room: '',
        });
        beds.push({
          floor,
          bed_number: bedNum,
          position: 'lower',
          status: 'empty',
          dormitory: 'nansi',
          room: '',
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

    console.log(`[BedsService] 获取南四巷${floor}楼床位数据...`);

    // 获取该楼层的所有床位（仅南四巷）
    const { data: beds, error } = await client
      .from('beds')
      .select('*')
      .eq('floor', floor)
      .eq('dormitory', 'nansi')
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
      maintenanceBeds: number;
    }> = [];
    for (let floor = 1; floor <= 4; floor++) {
      const { data: beds, error } = await client
        .from('beds')
        .select('status')
        .eq('floor', floor)
        .eq('dormitory', 'nansi');

      if (error) {
        console.error(`获取${floor}楼统计失败:`, error);
        stats.push({
          floor,
          totalBeds: 30,
          occupiedBeds: 0,
          emptyBeds: 30,
          maintenanceBeds: 0,
        });
        continue;
      }

      const totalBeds = beds?.length || 30;
      const occupiedBeds = beds?.filter(b => b.status === 'occupied').length || 0;
      const maintenanceBeds = beds?.filter(b => b.status === 'maintenance').length || 0;
      const emptyBeds = totalBeds - occupiedBeds - maintenanceBeds;

      // 四楼的空床不计入统计，但保留入住功能
      const displayEmptyBeds = floor === 4 ? 0 : emptyBeds;

      stats.push({
        floor,
        totalBeds,
        occupiedBeds,
        emptyBeds: displayEmptyBeds,
        maintenanceBeds,
      });
    }

    return {
      code: 200,
      msg: '获取成功',
      data: stats,
    };
  }

  // 获取南二巷宿舍楼层列表
  async getNanTwoFloors() {
    const floors = Object.keys(NAN_TWO_ROOM_CONFIG).map(Number).sort((a, b) => a - b);
    const stats = floors.map(floor => {
      const rooms = NAN_TWO_ROOM_CONFIG[floor];
      const totalBeds = rooms.reduce((sum, r) => sum + r.bedCount * 2, 0); // 每床2个铺位
      return {
        floor,
        rooms: rooms.map(r => r.room),
        totalBeds,
      };
    });

    return {
      code: 200,
      msg: '获取成功',
      data: stats,
    };
  }

  // 获取南二巷某楼层的房间列表
  async getNanTwoRoomsByFloor(floor: number) {
    const client = getSupabaseClient();
    const rooms = NAN_TWO_ROOM_CONFIG[floor];

    if (!rooms) {
      return {
        code: 400,
        msg: '楼层不存在',
        data: null,
      };
    }

    // 从数据库查询该宿舍区域该楼层的所有床位
    const { data: beds, error } = await client
      .from('beds')
      .select('*')
      .eq('dormitory', 'nantwo')
      .eq('floor', floor);

    if (error) {
      console.error('[BedsService] 获取南二巷床位失败:', error);
    }

    // 统计每个房间的入住情况
    const roomStats = rooms.map(roomConfig => {
      const roomBeds = beds?.filter(b => b.room === roomConfig.room) || [];
      const occupiedCount = roomBeds.filter(b => b.status === 'occupied').length;
      const maintenanceCount = roomBeds.filter(b => b.status === 'maintenance').length;
      const totalPositions = roomConfig.bedCount * 2; // 上下铺
      
      return {
        room: roomConfig.room,
        bedCount: roomConfig.bedCount,
        totalBeds: totalPositions,
        occupiedBeds: occupiedCount,
        maintenanceBeds: maintenanceCount,
        emptyBeds: totalPositions - occupiedCount - maintenanceCount,
      };
    });

    return {
      code: 200,
      msg: '获取成功',
      data: roomStats,
    };
  }

  // 获取南二巷某房间的床位列表
  async getNanTwoBedsByRoom(floor: number, room: string) {
    const client = getSupabaseClient();

    const roomConfig = NAN_TWO_ROOM_CONFIG[floor]?.find(r => r.room === room);
    if (!roomConfig) {
      return {
        code: 400,
        msg: '房间不存在',
        data: null,
      };
    }

    // 查询数据库中的床位
    const { data: beds, error } = await client
      .from('beds')
      .select('*')
      .eq('dormitory', 'nantwo')
      .eq('floor', floor)
      .eq('room', room)
      .order('bed_number', { ascending: true })
      .order('position', { ascending: true });

    if (error) {
      console.error('[BedsService] 获取房间床位失败:', error);
      throw new Error('获取床位失败');
    }

    // 如果数据库中没有这个房间的床位，需要初始化
    if (!beds || beds.length === 0) {
      // 初始化该房间的床位
      const newBeds: Array<{
        floor: number;
        bed_number: number;
        position: string;
        status: string;
        dormitory: string;
        room: string;
      }> = [];

      for (const bedNum of roomConfig.bedPositions) {
        newBeds.push({
          floor,
          bed_number: bedNum,
          position: 'upper',
          status: 'empty',
          dormitory: 'nantwo',
          room,
        });
        newBeds.push({
          floor,
          bed_number: bedNum,
          position: 'lower',
          status: 'empty',
          dormitory: 'nantwo',
          room,
        });
      }

      const { error: insertError } = await client.from('beds').insert(newBeds);
      if (insertError) {
        console.error('[BedsService] 初始化房间床位失败:', insertError);
        throw new Error('初始化床位失败');
      }

      // 重新查询
      const { data: newBedsData } = await client
        .from('beds')
        .select('*')
        .eq('dormitory', 'nantwo')
        .eq('floor', floor)
        .eq('room', room)
        .order('bed_number', { ascending: true })
        .order('position', { ascending: true });

      return {
        code: 200,
        msg: '获取成功',
        data: newBedsData || [],
      };
    }

    // 获取入住记录
    const bedIds = beds.map(b => b.id);
    const { data: checkIns } = await client
      .from('check_ins')
      .select('id, bed_id, name, id_card, phone, check_in_time')
      .in('bed_id', bedIds);

    // 组装数据
    const bedsData = beds.map(bed => {
      const checkIn = checkIns?.find(c => c.bed_id === bed.id);
      return {
        ...bed,
        checkIn: checkIn && bed.status === 'occupied' ? checkIn : null,
      };
    });

    return {
      code: 200,
      msg: '获取成功',
      data: bedsData,
    };
  }

  // 获取南二巷某楼层的所有床位（用于楼层视图）
  async getNanTwoBedsByFloor(floor: number) {
    const client = getSupabaseClient();
    const rooms = NAN_TWO_ROOM_CONFIG[floor];

    if (!rooms) {
      return {
        code: 400,
        msg: '楼层不存在',
        data: null,
      };
    }

    // 查询数据库中该楼层的所有床位
    const { data: beds, error } = await client
      .from('beds')
      .select('*')
      .eq('dormitory', 'nantwo')
      .eq('floor', floor)
      .order('room', { ascending: true })
      .order('bed_number', { ascending: true })
      .order('position', { ascending: true });

    if (error) {
      console.error('[BedsService] 获取南二巷楼层床位失败:', error);
      throw new Error('获取床位失败');
    }

    // 检查是否需要初始化床位
    const existingRooms = new Set(beds?.map(b => b.room) || []);
    const missingRooms = rooms.filter(r => !existingRooms.has(r.room));

    if (missingRooms.length > 0) {
      // 初始化缺失的房间床位
      const newBeds: Array<{
        floor: number;
        bed_number: number;
        position: string;
        status: string;
        dormitory: string;
        room: string;
      }> = [];

      for (const roomConfig of missingRooms) {
        for (const bedNum of roomConfig.bedPositions) {
          newBeds.push({
            floor,
            bed_number: bedNum,
            position: 'upper',
            status: 'empty',
            dormitory: 'nantwo',
            room: roomConfig.room,
          });
          newBeds.push({
            floor,
            bed_number: bedNum,
            position: 'lower',
            status: 'empty',
            dormitory: 'nantwo',
            room: roomConfig.room,
          });
        }
      }

      const { error: insertError } = await client.from('beds').insert(newBeds);
      if (insertError) {
        console.error('[BedsService] 初始化楼层床位失败:', insertError);
      }
    }

    // 重新查询所有床位
    const { data: allBeds, error: queryError } = await client
      .from('beds')
      .select('*')
      .eq('dormitory', 'nantwo')
      .eq('floor', floor)
      .order('room', { ascending: true })
      .order('bed_number', { ascending: true })
      .order('position', { ascending: true });

    if (queryError) {
      console.error('[BedsService] 查询楼层床位失败:', queryError);
      throw new Error('获取床位失败');
    }

    // 获取入住记录
    const bedIds = allBeds?.map(b => b.id) || [];
    const { data: checkIns } = await client
      .from('check_ins')
      .select('id, bed_id, name, id_card, phone, check_in_time')
      .in('bed_id', bedIds);

    // 组装数据
    const bedsData = allBeds?.map(bed => {
      const checkIn = checkIns?.find(c => c.bed_id === bed.id);
      return {
        ...bed,
        checkIn: checkIn && bed.status === 'occupied' ? checkIn : null,
      };
    }) || [];

    return {
      code: 200,
      msg: '获取成功',
      data: bedsData,
    };
  }

  // 获取南二巷宿舍统计
  async getNanTwoStats() {
    const client = getSupabaseClient();

    // 从数据库查询南二巷所有床位
    const { data: beds, error } = await client
      .from('beds')
      .select('floor, room, status')
      .eq('dormitory', 'nantwo');

    if (error) {
      console.error('[BedsService] 获取南二巷统计失败:', error);
    }

    // 计算总床位数
    let totalBeds = 0;
    for (const floor of Object.keys(NAN_TWO_ROOM_CONFIG).map(Number)) {
      const rooms = NAN_TWO_ROOM_CONFIG[floor];
      totalBeds += rooms.reduce((sum, r) => sum + r.bedCount * 2, 0);
    }

    const occupiedBeds = beds?.filter(b => b.status === 'occupied').length || 0;
    const maintenanceBeds = beds?.filter(b => b.status === 'maintenance').length || 0;

    return {
      code: 200,
      msg: '获取成功',
      data: {
        totalBeds,
        occupiedBeds,
        emptyBeds: totalBeds - occupiedBeds - maintenanceBeds,
        maintenanceBeds,
        floors: Object.keys(NAN_TWO_ROOM_CONFIG).map(Number).sort((a, b) => a - b),
      },
    };
  }

  // 获取南二巷各楼层统计（类似南四巷格式）
  async getNanTwoFloorStats() {
    const client = getSupabaseClient();

    // 从数据库查询南二巷所有床位
    const { data: beds, error } = await client
      .from('beds')
      .select('floor, status')
      .eq('dormitory', 'nantwo');

    if (error) {
      console.error('[BedsService] 获取南二巷楼层统计失败:', error);
    }

    const stats: Array<{
      floor: number;
      totalBeds: number;
      occupiedBeds: number;
      emptyBeds: number;
      maintenanceBeds: number;
      rooms: string[];
    }> = [];

    for (const floor of Object.keys(NAN_TWO_ROOM_CONFIG).map(Number).sort((a, b) => a - b)) {
      const rooms = NAN_TWO_ROOM_CONFIG[floor];
      const totalBeds = rooms.reduce((sum, r) => sum + r.bedCount * 2, 0);
      const floorBeds = beds?.filter(b => b.floor === floor) || [];
      const occupiedBeds = floorBeds.filter(b => b.status === 'occupied').length;
      const maintenanceBeds = floorBeds.filter(b => b.status === 'maintenance').length;

      stats.push({
        floor,
        totalBeds,
        occupiedBeds,
        emptyBeds: totalBeds - occupiedBeds - maintenanceBeds,
        maintenanceBeds,
        rooms: rooms.map(r => r.room),
      });
    }

    return {
      code: 200,
      msg: '获取成功',
      data: stats,
    };
  }

  /**
   * 设置床位为维修中状态
   */
  async setMaintenance(bedId: number) {
    const client = getSupabaseClient();

    // 检查床位是否存在
    const { data: bed, error: bedError } = await client
      .from('beds')
      .select('*')
      .eq('id', bedId)
      .single();

    if (bedError || !bed) {
      throw new Error('床位不存在');
    }

    if (bed.status === 'occupied') {
      throw new Error('已入住的床位无法设置为维修中');
    }

    if (bed.status === 'maintenance') {
      return {
        code: 200,
        msg: '该床位已是维修中状态',
        data: null,
      };
    }

    // 设置为维修中
    const { error: updateError } = await client
      .from('beds')
      .update({ status: 'maintenance', updated_at: new Date().toISOString() })
      .eq('id', bedId);

    if (updateError) {
      console.error('[BedsService] 设置维修中失败:', updateError);
      throw new Error('设置维修中失败');
    }

    console.log('[BedsService] 设置维修中成功:', bedId);

    return {
      code: 200,
      msg: '已设置为维修中',
      data: { bedId, status: 'maintenance' },
    };
  }

  /**
   * 取消床位维修中状态
   */
  async cancelMaintenance(bedId: number) {
    const client = getSupabaseClient();

    // 检查床位是否存在
    const { data: bed, error: bedError } = await client
      .from('beds')
      .select('*')
      .eq('id', bedId)
      .single();

    if (bedError || !bed) {
      throw new Error('床位不存在');
    }

    if (bed.status !== 'maintenance') {
      return {
        code: 200,
        msg: '该床位不是维修中状态',
        data: null,
      };
    }

    // 取消维修中，设置为空闲
    const { error: updateError } = await client
      .from('beds')
      .update({ status: 'empty', updated_at: new Date().toISOString() })
      .eq('id', bedId);

    if (updateError) {
      console.error('[BedsService] 取消维修中失败:', updateError);
      throw new Error('取消维修中失败');
    }

    console.log('[BedsService] 取消维修中成功:', bedId);

    return {
      code: 200,
      msg: '已取消维修中',
      data: { bedId, status: 'empty' },
    };
  }

  /**
   * 获取指定宿舍的可转移床位列表（同宿舍的空闲床位）
   */
  async getTransferableBeds(bedId: number) {
    const client = getSupabaseClient();

    // 获取原床位信息
    const { data: bed, error: bedError } = await client
      .from('beds')
      .select('*')
      .eq('id', bedId)
      .single();

    if (bedError || !bed) {
      throw new Error('床位不存在');
    }

    // 获取同宿舍的空闲床位
    const { data: emptyBeds, error } = await client
      .from('beds')
      .select('id, floor, bed_number, position, room, dormitory')
      .eq('dormitory', bed.dormitory)
      .eq('status', 'empty')
      .neq('id', bedId)
      .order('floor', { ascending: true })
      .order('bed_number', { ascending: true })
      .order('position', { ascending: true });

    if (error) {
      console.error('[BedsService] 获取可转移床位失败:', error);
      throw new Error('获取可转移床位失败');
    }

    return {
      code: 200,
      msg: '获取成功',
      data: {
        dormitory: bed.dormitory,
        currentBed: {
          id: bed.id,
          floor: bed.floor,
          bedNumber: bed.bed_number,
          position: bed.position,
          room: bed.room,
        },
        transferableBeds: emptyBeds || [],
      },
    };
  }

  /**
   * 互换两个入住人员的床位（两人互换）
   * @param checkInIdA 入住记录A的ID
   * @param checkInIdB 入住记录B的ID
   */
  async swapBeds(checkInIdA: number, checkInIdB: number) {
    const client = getSupabaseClient();

    // 1. 获取两条入住记录
    const { data: checkInA, error: errorA } = await client
      .from('check_ins')
      .select('id, bed_id')
      .eq('id', checkInIdA)
      .single();

    const { data: checkInB, error: errorB } = await client
      .from('check_ins')
      .select('id, bed_id')
      .eq('id', checkInIdB)
      .single();

    if (errorA || errorB || !checkInA || !checkInB) {
      throw new Error('入住记录不存在');
    }

    // 2. 互换床位
    const { error: updateErrorA } = await client
      .from('check_ins')
      .update({ bed_id: checkInB.bed_id, updated_at: new Date().toISOString() })
      .eq('id', checkInIdA);

    const { error: updateErrorB } = await client
      .from('check_ins')
      .update({ bed_id: checkInA.bed_id, updated_at: new Date().toISOString() })
      .eq('id', checkInIdB);

    if (updateErrorA || updateErrorB) {
      console.error('互换床位失败:', updateErrorA, updateErrorB);
      throw new Error('互换床位失败');
    }

    console.log('互换床位成功:', { checkInIdA, newBedIdA: checkInB.bed_id, checkInIdB, newBedIdB: checkInA.bed_id });

    return {
      code: 200,
      msg: '互换成功',
      data: {
        checkInIdA,
        newBedIdA: checkInB.bed_id,
        checkInIdB,
        newBedIdB: checkInA.bed_id,
      },
    };
  }
}
