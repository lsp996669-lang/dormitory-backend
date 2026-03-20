import { Controller, Post, Body } from '@nestjs/common';
import { CheckInService } from './checkin.service';

@Controller('checkin')
export class CheckInController {
  constructor(private readonly checkInService: CheckInService) {}

  @Post()
  async checkIn(@Body() body: { bedId: number; name: string; idCard: string; phone: string }) {
    console.log('入住登记请求:', body);
    return await this.checkInService.checkIn(body.bedId, body.name, body.idCard, body.phone);
  }
}
