import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() body: { code: string; nickname?: string; avatar?: string }) {
    console.log('登录请求:', body);
    return await this.authService.login(body.code, body.nickname, body.avatar);
  }

  @Get('users')
  async getUsers() {
    console.log('获取用户列表请求');
    return await this.authService.getUsers();
  }

  @Get('user/:id')
  async getUser(@Param('id') id: string) {
    console.log('获取用户信息请求:', id);
    return await this.authService.getUserById(id);
  }

  @Post('approve')
  async approveUser(@Body() body: { userId: string }) {
    console.log('审批用户请求:', body);
    return await this.authService.approveUser(body.userId);
  }

  @Post('set-host')
  async setHost(@Body() body: { userId: string }) {
    console.log('设置主机请求:', body);
    return await this.authService.setHost(body.userId);
  }
}
