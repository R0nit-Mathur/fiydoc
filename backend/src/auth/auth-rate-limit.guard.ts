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
  private readonly limit = 10; // Max 10 auth requests
  private readonly windowMs = 60 * 1000; // per 1 minute window

  canActivate(context: ExecutionContext): boolean {
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
    return true;
  }
}
