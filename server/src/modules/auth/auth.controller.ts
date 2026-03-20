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

  @Get('user/:id')
  async getUser(@Param('id') id: string) {
    console.log('获取用户信息请求:', id);
    return await this.authService.getUserById(id);
  }
}
