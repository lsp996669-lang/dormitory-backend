import { Injectable } from '@nestjs/common';
import { getSupabaseClient } from '@/storage/database/supabase-client';

@Injectable()
export class RollCallService {
  /**
   * 获取点名列表（获取某楼层的入住人员列表，附带点名状态）
   */
  async getRollCallList(floor: number, date?: string) {
    const client = getSupabaseClient();

    // 获取该楼层的所有床位
    const { data: beds, error: bedsError } = await client
      .from('beds')
      .select('id, bed_number, position')
      .eq('floor', floor)
      .eq('status', 'occupied');

    if (bedsError) {
      console.error('获取床位失败:', bedsError);
      throw new Error('获取床位失败');
    }

    if (!beds || beds.length === 0) {
      return {
        code: 200,
        msg: '获取成功',
        data: [],
      };
    }

    const bedIds = beds.map(b => b.id);

    // 获取该楼层的入住记录
    const { data: checkIns, error: checkInError } = await client
      .from('check_ins')
      .select('id, bed_id, name, id_card, phone, check_in_time')
      .in('bed_id', bedIds);

    if (checkInError) {
      console.error('获取入住记录失败:', checkInError);
      throw new Error('获取入住记录失败');
    }

    // 获取当天的点名记录
    const targetDate = date || new Date().toISOString().split('T')[0];
    const dayStart = `${targetDate}T00:00:00+08:00`;
    const dayEnd = `${targetDate}T23:59:59+08:00`;

    const { data: rollCalls, error: rollCallError } = await client
      .from('roll_calls')
      .select('id, check_in_id, status, remark, roll_call_time')
      .eq('floor', floor)
      .gte('roll_call_time', dayStart)
      .lte('roll_call_time', dayEnd);

    if (rollCallError) {
      console.error('获取点名记录失败:', rollCallError);
    }

    // 组装数据
    const rollCallList = checkIns?.map(checkIn => {
      const bed = beds.find(b => b.id === checkIn.bed_id);
      const rollCall = rollCalls?.find(r => r.check_in_id === checkIn.id);
      
      return {
        checkInId: checkIn.id,
        bedId: checkIn.bed_id,
        bedNumber: bed?.bed_number,
        position: bed?.position,
        name: checkIn.name,
        idCard: checkIn.id_card,
        phone: checkIn.phone,
        checkInTime: checkIn.check_in_time,
        rollCallId: rollCall?.id || null,
        status: rollCall?.status || null, // null表示未点名
        remark: rollCall?.remark || null,
        rollCallTime: rollCall?.roll_call_time || null,
      };
    }) || [];

    // 按床号排序
    rollCallList.sort((a, b) => {
      if (a.bedNumber !== b.bedNumber) {
        return (a.bedNumber || 0) - (b.bedNumber || 0);
      }
      return (a.position === 'upper' ? 0 : 1) - (b.position === 'upper' ? 0 : 1);
    });

    return {
      code: 200,
      msg: '获取成功',
      data: rollCallList,
    };
  }

  /**
   * 点名（标记人员在场或缺席）
   */
  async markRollCall(
    floor: number,
    checkInId: number,
    name: string,
    status: 'present' | 'absent',
    remark?: string
  ) {
    const client = getSupabaseClient();

    // 检查今天是否已经点名
    const today = new Date().toISOString().split('T')[0];
    const dayStart = `${today}T00:00:00+08:00`;
    const dayEnd = `${today}T23:59:59+08:00`;

    const { data: existingRollCall, error: searchError } = await client
      .from('roll_calls')
      .select('id')
      .eq('check_in_id', checkInId)
      .eq('floor', floor)
      .gte('roll_call_time', dayStart)
      .lte('roll_call_time', dayEnd)
      .maybeSingle();

    if (searchError) {
      console.error('查询点名记录失败:', searchError);
    }

    if (existingRollCall) {
      // 更新已有记录
      const { error: updateError } = await client
        .from('roll_calls')
        .update({
          status,
          remark: remark || null,
          roll_call_time: new Date().toISOString(),
        })
        .eq('id', existingRollCall.id);

      if (updateError) {
        console.error('更新点名记录失败:', updateError);
        throw new Error('点名失败');
      }

      return {
        code: 200,
        msg: '点名成功（已更新）',
        data: { id: existingRollCall.id },
      };
    }

    // 创建新点名记录
    const { data: rollCall, error: insertError } = await client
      .from('roll_calls')
      .insert({
        floor,
        check_in_id: checkInId,
        name,
        status,
        remark: remark || null,
        roll_call_time: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertError) {
      console.error('创建点名记录失败:', insertError);
      throw new Error('点名失败');
    }

    return {
      code: 200,
      msg: '点名成功',
      data: rollCall,
    };
  }

  /**
   * 批量点名
   */
  async batchRollCall(
    floor: number,
    items: Array<{
      checkInId: number;
      name: string;
      status: 'present' | 'absent';
      remark?: string;
    }>
  ) {
    const client = getSupabaseClient();

    const today = new Date().toISOString().split('T')[0];
    const dayStart = `${today}T00:00:00+08:00`;
    const dayEnd = `${today}T23:59:59+08:00`;

    // 获取今天已有的点名记录
    const { data: existingRollCalls, error: searchError } = await client
      .from('roll_calls')
      .select('id, check_in_id')
      .eq('floor', floor)
      .gte('roll_call_time', dayStart)
      .lte('roll_call_time', dayEnd);

    if (searchError) {
      console.error('查询点名记录失败:', searchError);
    }

    const existingMap = new Map(
      existingRollCalls?.map(r => [r.check_in_id, r.id]) || []
    );

    const toInsert: Array<{
      floor: number;
      check_in_id: number;
      name: string;
      status: string;
      remark: string | null;
      roll_call_time: string;
    }> = [];

    const toUpdate: Array<{ id: number; status: string; remark: string | null }> = [];

    for (const item of items) {
      const existingId = existingMap.get(item.checkInId);
      
      if (existingId) {
        toUpdate.push({
          id: existingId,
          status: item.status,
          remark: item.remark || null,
        });
      } else {
        toInsert.push({
          floor,
          check_in_id: item.checkInId,
          name: item.name,
          status: item.status,
          remark: item.remark || null,
          roll_call_time: new Date().toISOString(),
        });
      }
    }

    // 批量插入新记录
    if (toInsert.length > 0) {
      const { error: insertError } = await client
        .from('roll_calls')
        .insert(toInsert);

      if (insertError) {
        console.error('批量插入点名记录失败:', insertError);
      }
    }

    // 批量更新已有记录
    for (const update of toUpdate) {
      await client
        .from('roll_calls')
        .update({
          status: update.status,
          remark: update.remark,
          roll_call_time: new Date().toISOString(),
        })
        .eq('id', update.id);
    }

    return {
      code: 200,
      msg: `批量点名成功：新增 ${toInsert.length} 条，更新 ${toUpdate.length} 条`,
      data: {
        inserted: toInsert.length,
        updated: toUpdate.length,
      },
    };
  }

  /**
   * 获取点名统计
   */
  async getRollCallStats(floor: number, date?: string) {
    const client = getSupabaseClient();

    const targetDate = date || new Date().toISOString().split('T')[0];
    const dayStart = `${targetDate}T00:00:00+08:00`;
    const dayEnd = `${targetDate}T23:59:59+08:00`;

    // 获取该楼层的入住人数
    const { data: beds, error: bedsError } = await client
      .from('beds')
      .select('id')
      .eq('floor', floor)
      .eq('status', 'occupied');

    if (bedsError) {
      console.error('获取床位失败:', bedsError);
      throw new Error('获取统计失败');
    }

    const totalPeople = beds?.length || 0;

    // 获取点名记录
    const { data: rollCalls, error: rollCallError } = await client
      .from('roll_calls')
      .select('status')
      .eq('floor', floor)
      .gte('roll_call_time', dayStart)
      .lte('roll_call_time', dayEnd);

    if (rollCallError) {
      console.error('获取点名记录失败:', rollCallError);
    }

    const presentCount = rollCalls?.filter(r => r.status === 'present').length || 0;
    const absentCount = rollCalls?.filter(r => r.status === 'absent').length || 0;
    const notCheckedCount = totalPeople - presentCount - absentCount;

    return {
      code: 200,
      msg: '获取成功',
      data: {
        date: targetDate,
        floor,
        totalPeople,
        presentCount,
        absentCount,
        notCheckedCount,
      },
    };
  }

  /**
   * 获取历史点名记录
   */
  async getRollCallHistory(floor: number, limit: number = 7) {
    const client = getSupabaseClient();

    // 获取最近几天的点名记录（按日期分组）
    const { data: rollCalls, error } = await client
      .from('roll_calls')
      .select('id, name, status, remark, roll_call_time')
      .eq('floor', floor)
      .order('roll_call_time', { ascending: false })
      .limit(500);

    if (error) {
      console.error('获取历史记录失败:', error);
      throw new Error('获取历史记录失败');
    }

    // 按日期分组
    const groupedByDate: { [date: string]: Array<{
      id: number;
      name: string;
      status: string;
      remark: string | null;
      rollCallTime: string;
    }> } = {};

    rollCalls?.forEach(rc => {
      const date = rc.roll_call_time.split('T')[0];
      if (!groupedByDate[date]) {
        groupedByDate[date] = [];
      }
      groupedByDate[date].push({
        id: rc.id,
        name: rc.name,
        status: rc.status,
        remark: rc.remark,
        rollCallTime: rc.roll_call_time,
      });
    });

    // 转换为数组并限制数量
    const history = Object.entries(groupedByDate)
      .sort((a, b) => b[0].localeCompare(a[0]))
      .slice(0, limit)
      .map(([date, records]) => ({
        date,
        total: records.length,
        present: records.filter(r => r.status === 'present').length,
        absent: records.filter(r => r.status === 'absent').length,
        records,
      }));

    return {
      code: 200,
      msg: '获取成功',
      data: history,
    };
  }
}
