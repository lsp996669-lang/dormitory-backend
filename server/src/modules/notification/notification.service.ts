import { Injectable } from '@nestjs/common';
import { getSupabaseClient } from '@/storage/database/supabase-client';

@Injectable()
export class NotificationService {
  private readonly MAX_NOTIFICATIONS = 20;

  async createCheckInNotification(data: {
    floor: number;
    bedNumber: number;
    position: string;
    name: string;
    dormitory?: string;
    checkInId?: number;
  }) {
    const client = getSupabaseClient();

    const positionLabel = data.position === 'upper' ? '上铺' : '下铺';
    // 确保宿舍标识正确传递
    const dormitoryValue = data.dormitory || 'nansi';
    const dormitoryLabel = dormitoryValue === 'nantwo' ? '南二巷24号' : '南四巷180号';
    const message = `${data.name} 入住 ${dormitoryLabel} ${data.floor}楼 ${data.bedNumber}号床 ${positionLabel}`;

    // 创建通知
    const { data: notification, error } = await client
      .from('notifications')
      .insert({
        type: 'check_in',
        floor: data.floor,
        bed_number: data.bedNumber,
        position: data.position,
        name: data.name,
        message,
        dormitory: dormitoryValue,
        check_in_id: data.checkInId ?? null,
      })
      .select()
      .single();

    if (error) {
      console.error('创建通知失败:', error);
      // 不抛出错误，通知失败不影响入住流程
      return null;
    }

    console.log('创建入住通知成功:', notification);

    // 检查并删除超出的通知
    await this.cleanupOldNotifications();

    return notification;
  }

  async getNotifications() {
    const client = getSupabaseClient();

    const { data: notifications, error } = await client
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(this.MAX_NOTIFICATIONS);

    if (error) {
      console.error('获取通知失败:', error);
      throw new Error('获取通知失败');
    }

    // 获取每个通知对应的 is_flagged 状态
    if (notifications && notifications.length > 0) {
      const checkInIds = notifications
        .map((n) => n.check_in_id)
        .filter((id) => id != null);

      if (checkInIds.length > 0) {
        const { data: checkIns } = await client
          .from('check_ins')
          .select('id, is_flagged')
          .in('id', checkInIds);

        const flagMap = new Map(
          (checkIns || []).map((c) => [c.id, c.is_flagged ?? false])
        );

        notifications.forEach((n) => {
          if (n.check_in_id) {
            (n as any).is_flagged = flagMap.get(n.check_in_id) ?? false;
          }
        });
      }
    }

    return {
      code: 200,
      msg: '获取成功',
      data: notifications || [],
    };
  }

  async deleteNotification(id: number) {
    const client = getSupabaseClient();

    const { error } = await client
      .from('notifications')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('删除通知失败:', error);
      throw new Error('删除失败');
    }

    return {
      code: 200,
      msg: '删除成功',
      data: null,
    };
  }

  async clearAll() {
    const client = getSupabaseClient();

    const { error } = await client
      .from('notifications')
      .delete()
      .neq('id', 0); // 删除所有记录

    if (error) {
      console.error('清空通知失败:', error);
      throw new Error('清空失败');
    }

    return {
      code: 200,
      msg: '已清空所有通知',
      data: null,
    };
  }

  private async cleanupOldNotifications() {
    const client = getSupabaseClient();

    // 获取当前通知数量
    const { count, error: countError } = await client
      .from('notifications')
      .select('*', { count: 'exact', head: true });

    if (countError || !count) {
      return;
    }

    // 如果超过上限，删除最旧的通知
    if (count > this.MAX_NOTIFICATIONS) {
      // 获取要保留的通知ID
      const { data: keepIds, error: fetchError } = await client
        .from('notifications')
        .select('id')
        .order('created_at', { ascending: false })
        .limit(this.MAX_NOTIFICATIONS);

      if (fetchError || !keepIds) {
        return;
      }

      const idsToKeep = keepIds.map(n => n.id);

      // 删除不在保留列表中的通知
      const { error: deleteError } = await client
        .from('notifications')
        .delete()
        .not('id', 'in', `(${idsToKeep.join(',')})`);

      if (deleteError) {
        console.error('清理旧通知失败:', deleteError);
      } else {
        console.log(`清理了 ${count - this.MAX_NOTIFICATIONS} 条旧通知`);
      }
    }
  }

  async getUnreadCount() {
    const client = getSupabaseClient();

    const { count, error } = await client
      .from('notifications')
      .select('*', { count: 'exact', head: true });

    if (error) {
      console.error('获取通知数量失败:', error);
      return { code: 200, msg: '获取成功', data: { count: 0 } };
    }

    return {
      code: 200,
      msg: '获取成功',
      data: { count: count || 0 },
    };
  }
}
