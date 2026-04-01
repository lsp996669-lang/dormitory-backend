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

  // 南二巷宿舍接口
  @Get('nantwo/floors')
  async getNanTwoFloors() {
    console.log('获取南二巷楼层列表请求');
    return await this.bedsService.getNanTwoFloors();
  }

  @Get('nantwo/floor/:floor/rooms')
  async getNanTwoRoomsByFloor(@Param('floor') floor: string) {
    console.log('获取南二巷楼层房间列表请求:', floor);
    return await this.bedsService.getNanTwoRoomsByFloor(parseInt(floor, 10));
  }

  @Get('nantwo/floor/:floor/room/:room')
  async getNanTwoBedsByRoom(
    @Param('floor') floor: string,
    @Param('room') room: string,
  ) {
    console.log('获取南二巷房间床位请求:', floor, room);
    return await this.bedsService.getNanTwoBedsByRoom(parseInt(floor, 10), room);
  }

  @Get('nantwo/floor/:floor/beds')
  async getNanTwoBedsByFloor(@Param('floor') floor: string) {
    console.log('获取南二巷楼层所有床位请求:', floor);
    return await this.bedsService.getNanTwoBedsByFloor(parseInt(floor, 10));
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

  @Get('nantwo/stats')
  async getNanTwoStats() {
    console.log('获取南二巷统计请求');
    return await this.bedsService.getNanTwoStats();
  }

  @Get('nantwo/floor-stats')
  async getNanTwoFloorStats() {
    console.log('获取南二巷楼层统计请求');
    return await this.bedsService.getNanTwoFloorStats();
  }
}
