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
}
