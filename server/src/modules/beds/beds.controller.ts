import { Controller, Get, Param, Post, Body } from '@nestjs/common';
import { BedsService } from './beds.service';

@Controller('beds')
export class BedsController {
  constructor(private readonly bedsService: BedsService) {}

  @Get('floor/:floor')
  async getBedsByFloor(@Param('floor') floor: string) {
    console.log('获取楼层床位请求:', floor);
    return await this.bedsService.getBedsByFloor(parseInt(floor, 10));
  }

  @Post('init')
  async initBeds() {
    console.log('初始化床位请求');
    return await this.bedsService.initBeds();
  }
}

@Controller('floors')
export class FloorsController {
  constructor(private readonly bedsService: BedsService) {}

  @Get('stats')
  async getFloorStats() {
    console.log('获取楼层统计请求');
    return await this.bedsService.getFloorStats();
  }
}
