import { Controller, Get, Delete, Param, Post } from '@nestjs/common';
import { NotificationService } from './notification.service';

@Controller('notification')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get('list')
  async getNotifications() {
    console.log('获取通知列表请求');
    return await this.notificationService.getNotifications();
  }

  @Get('count')
  async getUnreadCount() {
    console.log('获取通知数量请求');
    return await this.notificationService.getUnreadCount();
  }

  @Delete(':id')
  async deleteNotification(@Param('id') id: string) {
    console.log('删除通知请求:', id);
    return await this.notificationService.deleteNotification(parseInt(id, 10));
  }

  @Post('clear')
  async clearAll() {
    console.log('清空所有通知请求');
    return await this.notificationService.clearAll();
  }
}
