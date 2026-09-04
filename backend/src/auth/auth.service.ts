import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';
import { Role } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService
  ) {}

  async register(dto: { email?: string; phone?: string; password?: string; role: Role; fullName?: string }) {
    if (!dto.email && !dto.phone) {
      throw new BadRequestException('Email or phone number is required.');
    }

    if (dto.email) {
      const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
      if (existing) throw new BadRequestException('Email already registered.');
    }

    if (dto.phone) {
      const existing = await this.prisma.user.findUnique({ where: { phone: dto.phone } });
      if (existing) throw new BadRequestException('Phone number already registered.');
    }

    const passwordHash = dto.password ? await bcrypt.hash(dto.password, 10) : null;

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        phone: dto.phone,
        passwordHash,
        role: dto.role,
      },
    });

    if (dto.role === Role.PATIENT) {
      await this.prisma.patient.create({
        data: {
          userId: user.id,
          fullName: dto.fullName || 'Patient User',
        },
      });
    } else if (dto.role === Role.DOCTOR) {
      await this.prisma.doctor.create({
        data: {
          userId: user.id,
          fullName: dto.fullName || 'Dr. Specialist',
          specialization: 'General Medicine',
          consultationFee: 750,
          clinic: {
            create: {
              name: 'FiYDoc Clinical Practice Center',
              address: 'Metro Health Hub, Suite 304',
              timings: '09:00 AM - 05:00 PM',
            },
          },
          verification: {
            create: {
              registrationNumber: `MCI-${Math.floor(100000 + Math.random() * 900000)}`,
              registrationAuthority: 'National Medical Commission / MCI',
              status: 'REGISTERED',
            },
          },
        },
      });
    }

    const fullUser = await this.prisma.user.findUnique({
      where: { id: user.id },
      include: {
        patient: true,
        doctor: {
          include: { verification: true, clinic: true },
        },
      },
    });

    return this.generateTokenResponse(fullUser);
  }

  async login(dto: { email?: string; phone?: string; password?: string }) {
    let user;
    const includeRelations = {
      patient: true,
      doctor: {
        include: { verification: true, clinic: true },
      },
    };

    if (dto.email) {
      user = await this.prisma.user.findUnique({
        where: { email: dto.email },
        include: includeRelations,
      });
    } else if (dto.phone) {
      user = await this.prisma.user.findUnique({
        where: { phone: dto.phone },
        include: includeRelations,
      });
    }

    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Invalid login credentials.');
    }

    const valid = await bcrypt.compare(dto.password || '', user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Invalid login credentials.');
    }

    return this.generateTokenResponse(user);
  }

  async googleOAuthLogin(googleUser: { googleId: string; email: string; name: string }) {
    const includeRelations = {
      patient: true,
      doctor: {
        include: { verification: true, clinic: true },
      },
    };

    let user = await this.prisma.user.findFirst({
      where: {
        OR: [
          { googleId: googleUser.googleId },
          { email: googleUser.email },
        ],
      },
      include: includeRelations,
    });

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          email: googleUser.email,
          googleId: googleUser.googleId,
          role: Role.PATIENT,
          patient: {
            create: {
              fullName: googleUser.name,
            },
          },
        },
        include: includeRelations,
      });
    } else if (!user.googleId) {
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: { googleId: googleUser.googleId },
        include: includeRelations,
      });
    }

    return this.generateTokenResponse(user);
  }

  private generateTokenResponse(user: any) {
    const payload = { sub: user.id, email: user.email, role: user.role };
    const accessToken = this.jwtService.sign(payload);
    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        role: user.role,
        patient: user.patient,
        doctor: user.doctor,
      },
    };
  }
}
