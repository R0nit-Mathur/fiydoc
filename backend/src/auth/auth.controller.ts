import { Controller, Post, Get, Body, Query, Res, HttpCode, HttpStatus } from '@nestjs/common';
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

  @Get('google/callback')
  async googleCallback(@Query() query: Record<string, string>, @Res() res: any) {
    const params = new URLSearchParams(query).toString();
    const redirectTarget = `fiydoc://oauth/google${params ? '?' + params : ''}`;
    return res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>FiYDoc - Authentication Complete</title>
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background: #0f172a; color: white; text-align: center; }
            .card { background: #1e293b; padding: 2.5rem; border-radius: 1rem; box-shadow: 0 10px 25px rgba(0,0,0,0.5); max-width: 400px; width: 90%; }
            .btn { display: inline-block; margin-top: 1.5rem; padding: 0.75rem 1.5rem; background: #0284c7; color: white; border-radius: 0.5rem; text-decoration: none; font-weight: 600; }
            .icon { font-size: 3rem; margin-bottom: 1rem; color: #10b981; }
          </style>
          <script>
            window.location.href = "${redirectTarget}";
          </script>
        </head>
        <body>
          <div class="card">
            <div class="icon">✓</div>
            <h2>Google Sign-In Verified</h2>
            <p style="color: #94a3b8; font-size: 0.95rem;">You are signed in! If you are not redirected automatically, tap the button below to return to FiYDoc.</p>
            <a href="${redirectTarget}" class="btn">Open FiYDoc App</a>
          </div>
        </body>
      </html>
    `);
  }
}

