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

    // 2. 检查目标床位是否存在且为空
    const { data: targetBed, error: targetBedError } = await client
      .from('beds')
      .select('*')
      .eq('id', targetBedId)
      .single();

    if (targetBedError || !targetBed) {
      throw new Error('目标床位不存在');
    }

    if (targetBed.status === 'occupied') {
      throw new Error('目标床位已被占用');
    }

    // 3. 更新入住记录的床位ID
    const { error: updateCheckInError } = await client
      .from('check_ins')
      .update({ bed_id: targetBedId, updated_at: new Date().toISOString() })
      .eq('id', checkInId);

    if (updateCheckInError) {
      console.error('更新入住记录失败:', updateCheckInError);
      throw new Error('转移床位失败');
    }

    // 4. 更新原床位状态为空闲
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

    // 5. 更新目标床位状态为占用
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
}
