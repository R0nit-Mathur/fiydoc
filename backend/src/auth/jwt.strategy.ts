import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private prisma: PrismaService, private configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: 'fiydoc_production_jwt_secret_key_98472019842',
    });
  }

  async validate(payload: { sub: string; email: string; role: string }) {
    console.log('⚡ [JwtStrategy] Validating token payload:', payload);
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      include: { patient: true, doctor: true },
    });
    if (!user) {
      console.error('❌ [JwtStrategy] User not found for id:', payload.sub);
      throw new UnauthorizedException('Invalid user token');
    }
    console.log('✅ [JwtStrategy] User validated successfully:', user.email);
    return user;
  }
}
