import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Role } from '@prisma/client';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  async register(
    @Body() body: { email?: string; phone?: string; password?: string; role: Role; fullName?: string }
  ) {
    return this.authService.register(body);
  }

  @HttpCode(HttpStatus.OK)
  @Post('login')
  async login(@Body() body: { email?: string; phone?: string; password?: string }) {
    return this.authService.login(body);
  }

  @HttpCode(HttpStatus.OK)
  @Post('google')
  async googleAuth(@Body() body: { googleId: string; email: string; name: string }) {
    return this.authService.googleOAuthLogin(body);
  }
}
