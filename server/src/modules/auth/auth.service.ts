import { Injectable } from '@nestjs/common';
import { getSupabaseClient } from '@/storage/database/supabase-client';

@Injectable()
export class AuthService {
  /**
   * 通过微信登录 code 获取 openid
   * H5 开发环境使用模拟 code
   */
  private async getOpenIdFromCode(code: string): Promise<string> {
    // 检测是否是模拟 code（H5 开发环境）
    if (code.startsWith('mock_code_')) {
      console.log('检测到模拟登录 code，生成模拟 openid');
      // 使用 code 中的时间戳生成唯一 openid
      return `mock_openid_${code.replace('mock_code_', '')}`;
    }

    // 真实微信登录：需要调用微信 API
    // 这里需要配置 WX_APP_ID 和 WX_APP_SECRET
    const appId = process.env.WX_APP_ID;
    const secret = process.env.WX_APP_SECRET;

    if (!appId || !secret) {
      console.warn('未配置微信小程序 appid 或 secret，使用 code 作为 openid');
      // 降级处理：直接使用 code 作为 openid
      return `openid_${code}`;
    }

    try {
      // 调用微信 jscode2session 接口
      const url = `https://api.weixin.qq.com/sns/jscode2session?appid=${appId}&secret=${secret}&js_code=${code}&grant_type=authorization_code`;
      
      const response = await fetch(url);
      const data = await response.json() as any;

      if (data.errcode) {
        console.error('微信登录失败:', data);
        throw new Error(data.errmsg || '微信登录失败');
      }

      console.log('微信登录成功，openid:', data.openid);
      return data.openid;
    } catch (error) {
      console.error('调用微信 API 失败:', error);
      // 降级处理
      return `openid_${code}`;
    }
  }

  async login(code: string, nickname?: string, avatar?: string) {
    const client = getSupabaseClient();

    // 通过 code 获取 openid
    const openid = await this.getOpenIdFromCode(code);
    console.log('获取到 openid:', openid);

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
    console.log('是否第一个用户:', isFirstUser);

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
      console.log('更新用户成功:', user);
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
      console.log('创建新用户成功:', user);
    }

    return {
      code: 200,
      msg: '登录成功',
      data: user,
    };
  }

  async getUserById(userId: string) {
    const client = getSupabaseClient();

    const { data, error } = await client
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('获取用户失败:', error);
      return {
        code: 404,
        msg: '用户不存在',
        data: null,
      };
    }

    return {
      code: 200,
      msg: '获取成功',
      data,
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
