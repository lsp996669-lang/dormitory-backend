import { Controller, Post, Body, Get, Query } from '@nestjs/common';
import { CheckInService } from './checkin.service';

@Controller('checkin')
export class CheckInController {
  constructor(private readonly checkInService: CheckInService) {}

  @Post()
  async checkIn(@Body() body: { bedId: number; name: string; idCard: string; phone: string; checkInDate?: string }) {
    console.log('入住登记请求:', body);
    return await this.checkInService.checkIn(
      body.bedId, 
      body.name, 
      body.idCard, 
      body.phone,
      body.checkInDate
    );
  }

  @Post('transfer')
  async transferBed(@Body() body: { checkInId: number; targetBedId: number }) {
    console.log('转移床位请求:', body);
    return await this.checkInService.transferBed(
      body.checkInId,
      body.targetBedId
    );
  }

  @Post('update-date')
  async updateCheckInDate(@Body() body: { checkInId: number; checkInDate: string }) {
    console.log('更新入住日期请求:', body);
    return await this.checkInService.updateCheckInDate(
      body.checkInId,
      body.checkInDate
    );
  }

  @Get('search')
  async searchResident(@Query('keyword') keyword: string) {
    console.log('搜索人员请求:', keyword);
    return await this.checkInService.searchResident(keyword);
  }

  @Get('list')
  async getAllCheckIns() {
    console.log('获取所有入住人员请求');
    return await this.checkInService.getAllCheckIns();
  }

  @Post('list')
  async getAllCheckInsPost() {
    console.log('获取所有入住人员请求 (POST)');
    return await this.checkInService.getAllCheckIns();
  }
}
