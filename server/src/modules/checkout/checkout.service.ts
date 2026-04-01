import { Injectable } from '@nestjs/common';
import { getSupabaseClient } from '@/storage/database/supabase-client';

@Injectable()
export class CheckOutService {
  async checkOut(checkInId: number, bedId: number, checkOutDate?: string) {
    const client = getSupabaseClient();

    // 获取入住记录
    const { data: checkIn, error: checkInError } = await client
      .from('check_ins')
      .select('*')
      .eq('id', checkInId)
      .single();

    if (checkInError || !checkIn) {
      throw new Error('入住记录不存在');
    }

    // 获取床位信息
    const { data: bed, error: bedError } = await client
      .from('beds')
      .select('*')
      .eq('id', bedId)
      .single();

    if (bedError || !bed) {
      throw new Error('床位不存在');
    }

    // 处理搬离日期
    const checkOutTime = checkOutDate ? new Date(checkOutDate).toISOString() : new Date().toISOString();

    // 创建搬离记录
    const { data: checkOut, error: checkOutError } = await client
      .from('check_outs')
      .insert({
        check_in_id: checkInId,
        bed_id: bedId,
        name: checkIn.name,
        id_card: checkIn.id_card,
        phone: checkIn.phone,
        check_in_time: checkIn.check_in_time,
        check_out_time: checkOutTime,
      })
      .select()
      .single();

    if (checkOutError) {
      console.error('创建搬离记录失败:', checkOutError);
      throw new Error('搬离登记失败');
    }

    // 更新床位状态为空
    const { error: updateError } = await client
      .from('beds')
      .update({ status: 'empty', updated_at: new Date().toISOString() })
      .eq('id', bedId);

    if (updateError) {
      console.error('更新床位状态失败:', updateError);
      throw new Error('搬离登记失败');
    }

    // 删除入住记录
    const { error: deleteError } = await client
      .from('check_ins')
      .delete()
      .eq('id', checkInId);

    if (deleteError) {
      console.error('删除入住记录失败:', deleteError);
      // 不抛出错误，因为搬离记录已创建成功
    }

    console.log('搬离登记成功:', checkOut);
    return {
      code: 200,
      msg: '搬离成功',
      data: checkOut,
    };
  }

  async getCheckOutList() {
    const client = getSupabaseClient();

    // 获取所有搬离记录
    const { data: checkOuts, error } = await client
      .from('check_outs')
      .select('*')
      .order('check_out_time', { ascending: false });

    if (error) {
      console.error('获取搬离记录失败:', error);
      throw new Error('获取搬离记录失败');
    }

    // 获取床位信息
    const bedIds = [...new Set(checkOuts?.map(c => c.bed_id) || [])];
    const { data: beds } = await client
      .from('beds')
      .select('id, floor, bed_number, position, dormitory, room')
      .in('id', bedIds);

    // 组装数据
    const records = checkOuts?.map(checkOut => {
      const bed = beds?.find(b => b.id === checkOut.bed_id);
      return {
        ...checkOut,
        floor: bed?.floor,
        bedNumber: bed?.bed_number,
        position: bed?.position,
        dormitory: bed?.dormitory || 'nanfour_180',
        room: bed?.room,
      };
    });

    console.log('获取搬离记录成功:', records?.length);
    return {
      code: 200,
      msg: '获取成功',
      data: records,
    };
  }

  async deleteCheckOut(id: number) {
    const client = getSupabaseClient();

    // 删除搬离记录
    const { error } = await client
      .from('check_outs')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('删除搬离记录失败:', error);
      throw new Error('删除失败');
    }

    console.log('删除搬离记录成功:', id);
    return {
      code: 200,
      msg: '删除成功',
      data: null,
    };
  }

  async batchDeleteCheckOut(ids: number[]) {
    const client = getSupabaseClient();

    if (!ids || ids.length === 0) {
      throw new Error('请选择要删除的记录');
    }

    // 批量删除搬离记录
    const { error } = await client
      .from('check_outs')
      .delete()
      .in('id', ids);

    if (error) {
      console.error('批量删除搬离记录失败:', error);
      throw new Error('批量删除失败');
    }

    console.log('批量删除搬离记录成功:', ids);
    return {
      code: 200,
      msg: `成功删除 ${ids.length} 条记录`,
      data: { deletedCount: ids.length },
    };
  }
}
