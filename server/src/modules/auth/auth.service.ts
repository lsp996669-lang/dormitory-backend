import { Injectable } from '@nestjs/common';
import { getSupabaseClient } from '@/storage/database/supabase-client';

@Injectable()
export class AuthService {
  async login(openid: string, nickname?: string, avatar?: string) {
    const client = getSupabaseClient();

    // 检查是否是第一个用户（自动设为主机）
    const { data: existingUsers, error: countError } = await client
      .from('users')
      .select('id')
      .limit(1);

    if (countError) {
      console.error('查询用户数量失败:', countError);
      throw new Error('登录失败');
    }

    const isFirstUser = !existingUsers || existingUsers.length === 0;

    // 查找或创建用户
    const { data: existingUser, error: findError } = await client
      .from('users')
      .select('*')
      .eq('openid', openid)
      .single();

    if (findError && findError.code !== 'PGRST116') {
      console.error('查询用户失败:', findError);
      throw new Error('登录失败');
    }

    let user;
    if (existingUser) {
      // 更新用户信息
      const { data: updatedUser, error: updateError } = await client
        .from('users')
        .update({
          nickname: nickname || existingUser.nickname,
          avatar: avatar || existingUser.avatar,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingUser.id)
        .select()
        .single();

      if (updateError) {
        console.error('更新用户失败:', updateError);
        throw new Error('登录失败');
      }
      user = updatedUser;
    } else {
      // 创建新用户
      const { data: newUser, error: createError } = await client
        .from('users')
        .insert({
          openid,
          nickname: nickname || '用户',
          avatar: avatar || '',
          is_host: isFirstUser,
          is_approved: isFirstUser, // 第一个用户自动批准
        })
        .select()
        .single();

      if (createError) {
        console.error('创建用户失败:', createError);
        throw new Error('登录失败');
      }
      user = newUser;
    }

    console.log('登录成功:', user);
    return {
      code: 200,
      msg: '登录成功',
      data: user,
    };
  }

  async getUsers() {
    const client = getSupabaseClient();

    const { data, error } = await client
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('获取用户列表失败:', error);
      throw new Error('获取用户列表失败');
    }

    return {
      code: 200,
      msg: '获取成功',
      data,
    };
  }

  async approveUser(userId: string) {
    const client = getSupabaseClient();

    const { data, error } = await client
      .from('users')
      .update({ is_approved: true, updated_at: new Date().toISOString() })
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error('审批用户失败:', error);
      throw new Error('审批失败');
    }

    return {
      code: 200,
      msg: '审批成功',
      data,
    };
  }

  async setHost(userId: string) {
    const client = getSupabaseClient();

    const { data, error } = await client
      .from('users')
      .update({ is_host: true, updated_at: new Date().toISOString() })
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error('设置主机失败:', error);
      throw new Error('设置失败');
    }

    return {
      code: 200,
      msg: '设置成功',
      data,
    };
  }
}
