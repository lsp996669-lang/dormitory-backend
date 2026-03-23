import { Controller, Get, Res, Query } from '@nestjs/common';
import { Response } from 'express';
import { ExportService } from './export.service';

@Controller('export')
export class ExportController {
  constructor(private readonly exportService: ExportService) {}

  /**
   * 导出入住人员数据
   */
  @Get('checkin')
  async exportCheckIn(@Res() res: Response) {
    console.log('导出入住人员数据请求');
    
    const buffer = await this.exportService.exportCheckInData();
    const filename = `入住人员名单_${this.getDateStr()}.xlsx`;
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`);
    res.send(buffer);
  }

  /**
   * 导出搬离人员数据
   */
  @Get('checkout')
  async exportCheckOut(@Res() res: Response) {
    console.log('导出搬离人员数据请求');
    
    const buffer = await this.exportService.exportCheckOutData();
    const filename = `搬离人员名单_${this.getDateStr()}.xlsx`;
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`);
    res.send(buffer);
  }

  /**
   * 导出所有数据
   */
  @Get('all')
  async exportAll(@Res() res: Response, @Query('floor') floor?: string) {
    console.log('导出所有数据请求, 楼层:', floor);
    
    const buffer = await this.exportService.exportAllData();
    const filename = `宿舍管理数据_${this.getDateStr()}.xlsx`;
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`);
    res.send(buffer);
  }

  /**
   * 获取导出统计数据
   */
  @Get('stats')
  async getExportStats() {
    console.log('获取导出统计数据请求');
    return await this.exportService.getExportStats();
  }

  private getDateStr(): string {
    const now = new Date();
    return `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
  }
}
