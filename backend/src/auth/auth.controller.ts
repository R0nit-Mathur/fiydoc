import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  Res,
  Request,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { GoogleAuthDto } from './dto/google-auth.dto';
import { AuthRateLimitGuard } from './auth-rate-limit.guard';
import { JwtAuthGuard } from './jwt-auth.guard';

@Controller('auth')
@UseGuards(AuthRateLimitGuard)
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @HttpCode(HttpStatus.OK)
  @Post('login')
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getMe(@Request() req: any) {
    return this.authService.getMe(req.user);
  }

  @HttpCode(HttpStatus.OK)
  @Post('google')
  async googleAuth(@Body() dto: GoogleAuthDto) {
    return this.authService.googleOAuthLogin(dto);
  }

  @Get('google/callback')
  async googleCallback(@Query() query: Record<string, string>, @Res() res: any) {
    const params = new URLSearchParams(query).toString();
    const redirectTarget = `fiydoc://oauth/google${params ? '?' + params : ''}`;
    return res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>FiYDoc - Redirecting to Application</title>
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background: #0f172a; color: white; text-align: center; }
            .card { background: #1e293b; padding: 2.5rem; border-radius: 1rem; box-shadow: 0 10px 25px rgba(0,0,0,0.5); max-width: 400px; width: 90%; }
            .btn { display: inline-block; margin-top: 1.5rem; padding: 0.75rem 1.5rem; background: #0284c7; color: white; border-radius: 0.5rem; text-decoration: none; font-weight: 600; }
            .spinner { border: 3px solid rgba(255,255,255,0.1); border-radius: 50%; border-top: 3px solid #0284c7; width: 36px; height: 36px; animation: spin 1s linear infinite; margin: 0 auto 1.5rem auto; }
            @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
          </style>
          <script>
            window.location.href = "${redirectTarget}";
          </script>
        </head>
        <body>
          <div class="card">
            <div class="spinner"></div>
            <h2>Connecting to FiYDoc</h2>
            <p style="color: #94a3b8; font-size: 0.95rem;">Redirecting authentication response to the app. If you are not redirected automatically, tap below.</p>
            <a href="${redirectTarget}" class="btn">Open FiYDoc App</a>
          </div>
        </body>
      </html>
    `);
  }
}
