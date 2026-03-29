import { Controller, Get, Post, Body, Query, Param } from '@nestjs/common';
import { RollCallService } from './rollcall.service';

@Controller('rollcall')
export class RollCallController {
  constructor(private readonly rollCallService: RollCallService) {}

  /**
   * 获取点名列表
   * GET /api/rollcall/list?floor=2&date=2024-01-01
   */
  @Get('list')
  async getRollCallList(
    @Query('floor') floor: string,
    @Query('date') date?: string
  ) {
    const floorNum = parseInt(floor, 10);
    if (isNaN(floorNum)) {
      return { code: 400, msg: '楼层参数无效' };
    }
    return this.rollCallService.getRollCallList(floorNum, date);
  }

  /**
   * 点名（单个）
   * POST /api/rollcall/mark
   */
  @Post('mark')
  async markRollCall(
    @Body() body: {
      floor: number;
      checkInId: number;
      name: string;
      status: 'present' | 'absent';
      remark?: string;
    }
  ) {
    if (!body.floor || !body.checkInId || !body.name || !body.status) {
      return { code: 400, msg: '参数不完整' };
    }

    if (!['present', 'absent'].includes(body.status)) {
      return { code: 400, msg: '状态值无效' };
    }

    return this.rollCallService.markRollCall(
      body.floor,
      body.checkInId,
      body.name,
      body.status,
      body.remark
    );
  }

  /**
   * 批量点名
   * POST /api/rollcall/batch
   */
  @Post('batch')
  async batchRollCall(
    @Body() body: {
      floor: number;
      items: Array<{
        checkInId: number;
        name: string;
        status: 'present' | 'absent';
        remark?: string;
      }>;
    }
  ) {
    if (!body.floor || !body.items || !Array.isArray(body.items)) {
      return { code: 400, msg: '参数不完整' };
    }

    return this.rollCallService.batchRollCall(body.floor, body.items);
  }

  /**
   * 获取点名统计
   * GET /api/rollcall/stats?floor=2&date=2024-01-01
   */
  @Get('stats')
  async getRollCallStats(
    @Query('floor') floor: string,
    @Query('date') date?: string
  ) {
    const floorNum = parseInt(floor, 10);
    if (isNaN(floorNum)) {
      return { code: 400, msg: '楼层参数无效' };
    }
    return this.rollCallService.getRollCallStats(floorNum, date);
  }

  /**
   * 获取历史点名记录
   * GET /api/rollcall/history/:floor
   */
  @Get('history/:floor')
  async getRollCallHistory(
    @Param('floor') floor: string,
    @Query('limit') limit?: string
  ) {
    const floorNum = parseInt(floor, 10);
    if (isNaN(floorNum)) {
      return { code: 400, msg: '楼层参数无效' };
    }
    const limitNum = limit ? parseInt(limit, 10) : 7;
    return this.rollCallService.getRollCallHistory(floorNum, limitNum);
  }
}
