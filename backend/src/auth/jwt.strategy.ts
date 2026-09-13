import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private prisma: PrismaService, private configService: ConfigService) {
    const jwtSecret = configService.get<string>('JWT_SECRET') || process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error('FATAL: JWT_SECRET environment variable is missing.');
    }
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtSecret,
    });
  }

  async validate(payload: { sub: string; email: string; role: string }) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      include: { patient: true, doctor: true },
    });
    if (!user) {
      throw new UnauthorizedException('Invalid user token');
    }
    if (user.status !== 'ACTIVE') {
      throw new UnauthorizedException('User account is suspended or revoked.');
    }
    return user;
  }
}
