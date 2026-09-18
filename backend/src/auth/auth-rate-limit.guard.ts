import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
} from '@nestjs/common';

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

@Injectable()
export class AuthRateLimitGuard implements CanActivate {
  private readonly rateLimits = new Map<string, RateLimitRecord>();
  private readonly limit = 30; // Max 30 auth requests per minute (allows multi-step onboarding)
  private readonly windowMs = 60 * 1000; // per 1 minute window
  private lastCleanup = Date.now();

  private cleanupExpired() {
    const now = Date.now();
    if (now - this.lastCleanup > 60000) {
      this.lastCleanup = now;
      for (const [ip, rec] of this.rateLimits.entries()) {
        if (now > rec.resetTime) {
          this.rateLimits.delete(ip);
        }
      }
    }
  }

  canActivate(context: ExecutionContext): boolean {
    this.cleanupExpired();
    const request = context.switchToHttp().getRequest();
    const ip =
      request.headers['x-forwarded-for']?.toString().split(',')[0].trim() ||
      request.ip ||
      request.connection?.remoteAddress ||
      'unknown-client';

    const now = Date.now();
    const record = this.rateLimits.get(ip);

    if (!record || now > record.resetTime) {
      this.rateLimits.set(ip, {
        count: 1,
        resetTime: now + this.windowMs,
      });
      return true;
    }

    if (record.count >= this.limit) {
      const retryAfter = Math.ceil((record.resetTime - now) / 1000);
      const response = context.switchToHttp().getResponse();
      if (response && response.setHeader) {
        response.setHeader('Retry-After', retryAfter.toString());
        response.setHeader('X-RateLimit-Limit', this.limit.toString());
        response.setHeader('X-RateLimit-Remaining', '0');
        response.setHeader('X-RateLimit-Reset', Math.ceil(record.resetTime / 1000).toString());
      }
      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message: `Too many authentication attempts. Please wait ${retryAfter} seconds before trying again.`,
          error: 'Too Many Requests',
        },
        HttpStatus.TOO_MANY_REQUESTS
      );
    }

    record.count += 1;
    const response = context.switchToHttp().getResponse();
    if (response && response.setHeader) {
      response.setHeader('X-RateLimit-Limit', this.limit.toString());
      response.setHeader('X-RateLimit-Remaining', (this.limit - record.count).toString());
      response.setHeader('X-RateLimit-Reset', Math.ceil(record.resetTime / 1000).toString());
    }
    return true;
  }
}
