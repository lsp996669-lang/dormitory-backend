import { Controller, Post, Body, Get, Delete, Param } from '@nestjs/common';
import { CheckOutService } from './checkout.service';

@Controller('checkout')
export class CheckOutController {
  constructor(private readonly checkOutService: CheckOutService) {}

  @Post()
  async checkOut(@Body() body: { checkInId: number; bedId: number; checkOutDate?: string }) {
    console.log('搬离登记请求:', body);
    return await this.checkOutService.checkOut(body.checkInId, body.bedId, body.checkOutDate);
  }

  @Get('list')
  async getCheckOutList() {
    console.log('获取搬离记录列表请求');
    return await this.checkOutService.getCheckOutList();
  }

  @Delete(':id')
  async deleteCheckOut(@Param('id') id: string) {
    console.log('删除搬离记录请求:', id);
    return await this.checkOutService.deleteCheckOut(parseInt(id, 10));
  }

  @Post('batch-delete')
  async batchDeleteCheckOut(@Body() body: { ids: number[] }) {
    console.log('批量删除搬离记录请求:', body.ids);
    return await this.checkOutService.batchDeleteCheckOut(body.ids);
  }

  @Post('update-checkin-date')
  async updateCheckInDate(@Body() body: { checkOutId: number; checkInDate: string }) {
    console.log('更新搬离记录入住日期请求:', body);
    return await this.checkOutService.updateCheckInDate(
      body.checkOutId,
      body.checkInDate
    );
  }

  @Post('update-checkout-date')
  async updateCheckOutDate(@Body() body: { checkOutId: number; checkOutDate: string }) {
    console.log('更新搬离日期请求:', body);
    return await this.checkOutService.updateCheckOutDate(
      body.checkOutId,
      body.checkOutDate
    );
  }
}
