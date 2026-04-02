import { Controller, Get } from '@nestjs/common';
import { AppService } from '@/app.service';
import { getSupabaseClient } from '@/storage/database/supabase-client';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('hello')
  getHello(): { status: string; data: string } {
    return {
      status: 'success',
      data: this.appService.getHello()
    };
  }

  @Get('health')
  getHealth(): { status: string; data: string } {
    return {
      status: 'success',
      data: new Date().toISOString(),
    };
  }

  @Get('debug')
  async getDebug() {
    try {
      const client = getSupabaseClient();
      
      // 测试数据库连接
      const { data: bedsTest, error: bedsError } = await client
        .from('beds')
        .select('id, status, dormitory')
        .limit(5);
      
      const { data: checkinsTest, error: checkinsError } = await client
        .from('check_ins')
        .select('id, bed_id, name')
        .limit(5);

      return {
        status: 'success',
        env: {
          hasUrl: !!process.env.COZE_SUPABASE_URL,
          hasKey: !!process.env.COZE_SUPABASE_ANON_KEY,
          urlPrefix: process.env.COZE_SUPABASE_URL?.substring(0, 30),
        },
        beds: {
          count: bedsTest?.length || 0,
          error: bedsError?.message || null,
          sample: bedsTest?.[0] || null,
        },
        checkins: {
          count: checkinsTest?.length || 0,
          error: checkinsError?.message || null,
          sample: checkinsTest?.[0] || null,
        },
      };
    } catch (error: any) {
      return {
        status: 'error',
        message: error.message,
        stack: error.stack,
      };
    }
  }
}
