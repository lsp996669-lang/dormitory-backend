import { Injectable } from '@nestjs/common';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { NotificationService } from '../notification/notification.service';

@Injectable()
export class CheckInService {
  constructor(private readonly notificationService: NotificationService) {}

  async checkIn(bedId: number, name: string, idCard: string, phone: string, checkInDate?: string) {
    const client = getSupabaseClient();

    // 检查床位是否存在且为空
    const { data: bed, error: bedError } = await client
      .from('beds')
      .select('*')
      .eq('id', bedId)
      .single();

    if (bedError || !bed) {
      throw new Error('床位不存在');
    }

    if (bed.status === 'occupied') {
      throw new Error('该床位已被占用');
    }

    if (bed.status === 'maintenance') {
      throw new Error('该床位正在维修中，无法入住');
    }

    // 处理入住日期
    const checkInTime = checkInDate ? new Date(checkInDate).toISOString() : new Date().toISOString();

    // 创建入住记录
    const { data: checkIn, error: checkInError } = await client
      .from('check_ins')
      .insert({
        bed_id: bedId,
        name,
        id_card: idCard,
        phone,
        check_in_time: checkInTime,
      })
      .select()
      .single();

    if (checkInError) {
      console.error('创建入住记录失败:', checkInError);
      throw new Error('入住登记失败');
    }

    // 更新床位状态
    const { error: updateError } = await client
      .from('beds')
      .update({ status: 'occupied', updated_at: new Date().toISOString() })
      .eq('id', bedId);

    if (updateError) {
      console.error('更新床位状态失败:', updateError);
      // 回滚入住记录
      await client.from('check_ins').delete().eq('id', checkIn.id);
      throw new Error('入住登记失败');
    }

    // 创建入住通知（仅2楼及以上楼层）
    if (bed.floor >= 2) {
      await this.notificationService.createCheckInNotification({
        floor: bed.floor,
        bedNumber: bed.bed_number,
        position: bed.position,
        name,
        dormitory: bed.dormitory,
      });
    }

    console.log('入住登记成功:', checkIn);
    return {
      code: 200,
      msg: '入住成功',
      data: checkIn,
    };
  }

  /**
   * 转移床位：将入住记录从一个床位转移到另一个床位
   * @param checkInId 入住记录ID
   * @param targetBedId 目标床位ID
   */
  async transferBed(checkInId: number, targetBedId: number) {
    const client = getSupabaseClient();

    console.log('转移床位请求:', { checkInId, targetBedId });

    // 1. 获取入住记录（不使用JOIN，简化查询）
    const { data: checkIn, error: checkInError } = await client
      .from('check_ins')
      .select('*')
      .eq('id', checkInId)
      .single();

    console.log('查询入住记录结果:', { checkIn, checkInError });

    if (checkInError) {
      console.error('入住记录查询失败:', JSON.stringify(checkInError, null, 2));
    }

    if (checkInError || !checkIn) {
      throw new Error('入住记录不存在');
    }

    // 检查是否已搬离
    if (checkIn.check_out_time) {
      throw new Error('该人员已搬离，无法转移');
    }

    const oldBedId = checkIn.bed_id;

    // 如果目标床位和当前床位相同，直接返回成功
    if (oldBedId === targetBedId) {
      return {
        code: 200,
        msg: '床位未发生变化',
        data: checkIn,
      };
    }

    // 2. 获取原床位信息（用于验证宿舍）
    const { data: oldBed, error: oldBedError } = await client
      .from('beds')
      .select('*')
      .eq('id', oldBedId)
      .single();

    if (oldBedError || !oldBed) {
      throw new Error('原床位不存在');
    }

    // 3. 检查目标床位是否存在且为空
    const { data: targetBed, error: targetBedError } = await client
      .from('beds')
      .select('*')
      .eq('id', targetBedId)
      .single();

    if (targetBedError || !targetBed) {
      throw new Error('目标床位不存在');
    }

    // 4. 验证是否为同一宿舍（禁止跨宿舍转移）
    if (oldBed.dormitory !== targetBed.dormitory) {
      throw new Error('禁止跨宿舍转移床位，只能转移到同一宿舍的床位');
    }

    if (targetBed.status === 'occupied') {
      throw new Error('目标床位已被占用');
    }

    if (targetBed.status === 'maintenance') {
      throw new Error('目标床位正在维修中，无法入住');
    }

    // 5. 更新入住记录的床位ID
    const { error: updateCheckInError } = await client
      .from('check_ins')
      .update({ bed_id: targetBedId, updated_at: new Date().toISOString() })
      .eq('id', checkInId);

    if (updateCheckInError) {
      console.error('更新入住记录失败:', updateCheckInError);
      throw new Error('转移床位失败');
    }

    // 6. 更新原床位状态为空闲
    const { error: updateOldBedError } = await client
      .from('beds')
      .update({ status: 'empty', updated_at: new Date().toISOString() })
      .eq('id', oldBedId);

    if (updateOldBedError) {
      console.error('更新原床位状态失败:', updateOldBedError);
      // 回滚入住记录
      await client.from('check_ins').update({ bed_id: oldBedId }).eq('id', checkInId);
      throw new Error('转移床位失败');
    }

    // 7. 更新目标床位状态为占用
    const { error: updateNewBedError } = await client
      .from('beds')
      .update({ status: 'occupied', updated_at: new Date().toISOString() })
      .eq('id', targetBedId);

    if (updateNewBedError) {
      console.error('更新目标床位状态失败:', updateNewBedError);
      // 回滚
      await client.from('check_ins').update({ bed_id: oldBedId }).eq('id', checkInId);
      await client.from('beds').update({ status: 'occupied' }).eq('id', oldBedId);
      throw new Error('转移床位失败');
    }

    // 转移床位不创建通知

    console.log('转移床位成功:', { checkInId, oldBedId, targetBedId });

    return {
      code: 200,
      msg: '转移成功',
      data: {
        checkInId,
        oldBedId,
        newBedId: targetBedId,
        name: checkIn.name,
      },
    };
  }

  /**
   * 更新入住日期
   * @param checkInId 入住记录ID
   * @param checkInDate 新的入住日期
   */
  async updateCheckInDate(checkInId: number, checkInDate: string) {
    const client = getSupabaseClient();

    console.log('更新入住日期请求:', { checkInId, checkInDate });

    // 检查入住记录是否存在
    const { data: checkIn, error: checkInError } = await client
      .from('check_ins')
      .select('*')
      .eq('id', checkInId)
      .single();

    if (checkInError || !checkIn) {
      throw new Error('入住记录不存在');
    }

    // 更新入住日期
    const checkInTime = new Date(checkInDate).toISOString();
    const { error: updateError } = await client
      .from('check_ins')
      .update({ check_in_time: checkInTime, updated_at: new Date().toISOString() })
      .eq('id', checkInId);

    if (updateError) {
      console.error('更新入住日期失败:', updateError);
      throw new Error('更新入住日期失败');
    }

    console.log('更新入住日期成功:', { checkInId, checkInTime });

    return {
      code: 200,
      msg: '更新成功',
      data: { checkInId, checkInTime },
    };
  }

  /**
   * 搜索入住人员
   * @param keyword 搜索关键词（姓名、手机号、身份证号）
   */
  async searchResident(keyword: string) {
    const client = getSupabaseClient();

    if (!keyword || keyword.trim() === '') {
      return {
        code: 200,
        msg: '获取成功',
        data: [],
      };
    }

    const searchTerm = keyword.trim();
    console.log('[CheckInService] 搜索关键词:', searchTerm);

    // 搜索入住记录（支持姓名、手机号、身份证号）
    // 对于姓名，使用 ilike 进行模糊匹配（按顺序包含关键词）
    // check_ins 表中的记录都是当前入住人员（未搬离），无需过滤 check_out_time
    const { data: checkIns, error } = await client
      .from('check_ins')
      .select(`
        id,
        name,
        id_card,
        phone,
        check_in_time,
        bed_id,
        is_station_marked,
        is_rider
      `)
      .or(`name.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%,id_card.ilike.%${searchTerm}%`);

    if (error) {
      console.error('[CheckInService] 搜索失败:', error);
      throw new Error('搜索失败');
    }

    if (!checkIns || checkIns.length === 0) {
      return {
        code: 200,
        msg: '获取成功',
        data: [],
      };
    }

    // 获取床位信息
    const bedIds = checkIns.map((c: any) => c.bed_id);
    const { data: beds, error: bedsError } = await client
      .from('beds')
      .select('id, floor, bed_number, position, dormitory, room')
      .in('id', bedIds);

    if (bedsError) {
      console.error('[CheckInService] 获取床位信息失败:', bedsError);
    }

    // 组装返回数据
    const results = checkIns.map((checkIn: any) => {
      const bed = beds?.find((b: any) => b.id === checkIn.bed_id);
      const dormitoryName = bed?.dormitory === 'nansi' ? '南四巷180号宿舍' : '南二巷24号宿舍';

      return {
        checkInId: checkIn.id,
        name: checkIn.name,
        idCard: checkIn.id_card,
        phone: checkIn.phone,
        checkInTime: checkIn.check_in_time,
        dormitory: bed?.dormitory || 'nansi',
        dormitoryName,
        floor: bed?.floor || 0,
        room: bed?.room || '',
        bedNumber: bed?.bed_number || 0,
        position: bed?.position || 'upper',
        positionLabel: bed?.position === 'upper' ? '上铺' : '下铺',
        bedId: checkIn.bed_id,
        isStationMarked: checkIn.is_station_marked ?? false,
        isRider: checkIn.is_rider ?? false,
        stationName: checkIn.station_name || null,
      };
    });

    console.log('[CheckInService] 搜索结果:', results.length, '条');

    return {
      code: 200,
      msg: '获取成功',
      data: results,
    };
  }

  /**
   * 获取所有入住人员（用于前端搜索）
   */
  async getAllCheckIns() {
    const client = getSupabaseClient();

    // 获取所有未搬离的入住记录
    const { data: checkIns, error } = await client
      .from('check_ins')
      .select(`
        id,
        name,
        id_card,
        phone,
        check_in_time,
        bed_id,
        is_station_marked,
        is_rider,
        station_name
      `);

    if (error) {
      console.error('[CheckInService] 获取入住记录失败:', error);
      throw new Error('获取入住记录失败');
    }

    if (!checkIns || checkIns.length === 0) {
      return {
        code: 200,
        msg: '获取成功',
        data: [],
      };
    }

    // 获取床位信息
    const bedIds = checkIns.map((c: any) => c.bed_id);
    const { data: beds, error: bedsError } = await client
      .from('beds')
      .select('id, floor, bed_number, position, dormitory, room')
      .in('id', bedIds);

    if (bedsError) {
      console.error('[CheckInService] 获取床位信息失败:', bedsError);
    }

    // 组装返回数据
    const results = checkIns.map((checkIn: any) => {
      const bed = beds?.find((b: any) => b.id === checkIn.bed_id);
      const dormitoryName = bed?.dormitory === 'nansi' ? '南四巷180号宿舍' : '南二巷24号宿舍';

      return {
        checkInId: checkIn.id,
        name: checkIn.name,
        idCard: checkIn.id_card,
        phone: checkIn.phone,
        checkInTime: checkIn.check_in_time,
        dormitory: bed?.dormitory || 'nansi',
        dormitoryName,
        floor: bed?.floor || 0,
        room: bed?.room || '',
        bedNumber: bed?.bed_number || 0,
        position: bed?.position || 'upper',
        positionLabel: bed?.position === 'upper' ? '上铺' : '下铺',
        bedId: checkIn.bed_id,
        isStationMarked: checkIn.is_station_marked ?? false,
        isRider: checkIn.is_rider ?? false,
        stationName: checkIn.station_name || null,
      };
    });

    console.log('[CheckInService] 获取入住记录:', results.length, '条');

    return {
      code: 200,
      msg: '获取成功',
      data: results,
    };
  }

  /**
   * 设置站点标注
   * @param checkInId 入住记录ID
   * @param stationName 站点名称: 'exhibition'=会展中心站, 'wuyue'=吾悦广场站, 'rider'=众包骑手, null=取消标注
   */
  async setStationMarked(checkInId: number, stationName: string | null) {
    const client = getSupabaseClient();

    const updateData: any = { updated_at: new Date().toISOString() };
    if (stationName === null) {
      updateData.is_station_marked = false;
      updateData.station_name = null;
    } else if (stationName === 'rider') {
      updateData.is_rider = true;
      updateData.is_station_marked = false;
      updateData.station_name = 'rider';
    } else {
      updateData.is_station_marked = true;
      updateData.is_rider = false;
      updateData.station_name = stationName;
    }

    const { error: updateError } = await client
      .from('check_ins')
      .update(updateData)
      .eq('id', checkInId);

    if (updateError) {
      console.error('设置站点标注失败:', updateError);
      throw new Error('设置失败');
    }

    return {
      code: 200,
      msg: '设置成功',
      data: { stationName },
    };
  }

  /**
   * 切换骑手状态
   */
  async toggleRider(checkInId: number, value?: boolean) {
    const client = getSupabaseClient();

    const { data: current, error: getError } = await client
      .from('check_ins')
      .select('is_station_marked, is_rider')
      .eq('id', checkInId)
      .single();

    if (getError || !current) {
      throw new Error('记录不存在');
    }

    const newValue = value !== undefined ? value : !current.is_rider;

    const { error: updateError } = await client
      .from('check_ins')
      .update({ is_rider: newValue, updated_at: new Date().toISOString() })
      .eq('id', checkInId);

    if (updateError) {
      console.error('更新骑手状态失败:', updateError);
      throw new Error('更新失败');
    }

    return {
      code: 200,
      msg: '更新成功',
      data: { isRider: newValue },
    };
  }
}
