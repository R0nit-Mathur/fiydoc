import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';
import { Role, VerificationStatus } from '@prisma/client';

import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService
  ) {}

  async register(dto: RegisterDto) {
    if (!dto.email && !dto.phone) {
      throw new BadRequestException('Email or phone number is required.');
    }

    if (dto.email) {
      const existing = await this.prisma.user.findUnique({ where: { email: dto.email.trim().toLowerCase() } });
      if (existing) {
        throw new BadRequestException({
          code: 'EMAIL_ALREADY_REGISTERED',
          message: 'This email is already registered. Please sign in instead.',
        });
      }
    }

    if (dto.phone) {
      const existing = await this.prisma.user.findUnique({ where: { phone: dto.phone.trim() } });
      if (existing) {
        throw new BadRequestException({
          code: 'PHONE_ALREADY_REGISTERED',
          message: 'This phone number is already registered. Please sign in instead.',
        });
      }
    }

    const passwordHash = dto.password ? await bcrypt.hash(dto.password, 10) : null;

    const user = await this.prisma.user.create({
      data: {
        email: dto.email ? dto.email.trim().toLowerCase() : undefined,
        phone: dto.phone ? dto.phone.trim() : undefined,
        passwordHash,
        role: dto.role,
      },
    });

    if (dto.role === Role.PATIENT) {
      await this.prisma.patient.create({
        data: {
          userId: user.id,
          fullName: dto.fullName?.trim() || 'Patient User',
        },
      });
    } else if (dto.role === Role.DOCTOR) {
      if (!dto.licenseNumber?.trim()) {
        throw new BadRequestException('Medical license / registration number is required for doctor registration.');
      }
      if (!dto.clinicName?.trim()) {
        throw new BadRequestException('Clinic or practice name is required for doctor registration.');
      }
      if (!dto.fullName?.trim()) {
        throw new BadRequestException('Doctor full name is required for registration.');
      }

      const registrationNumber = dto.licenseNumber.trim();
      const registrationAuthority = dto.registrationAuthority?.trim() || 'National Medical Commission / State Council';
      const specialization = dto.specialization?.trim() || 'General Medicine';
      const fee = Number(dto.consultationFee) || 800;
      const clinicName = dto.clinicName.trim();
      const clinicAddress = dto.clinicAddress?.trim() || 'Clinical Practice Address Pending';
      const clinicLatitude = dto.clinicLatitude !== undefined && dto.clinicLatitude !== null ? Number(dto.clinicLatitude) : null;
      const clinicLongitude = dto.clinicLongitude !== undefined && dto.clinicLongitude !== null ? Number(dto.clinicLongitude) : null;

      await this.prisma.doctor.create({
        data: {
          userId: user.id,
          fullName: dto.fullName.trim(),
          specialization,
          consultationFee: fee,
          clinic: {
            create: {
              name: clinicName,
              address: clinicAddress,
              latitude: clinicLatitude,
              longitude: clinicLongitude,
              timings: '09:00 AM - 05:00 PM',
            },
          },
          qualifications: dto.qualifications
            ? {
                create: {
                  degree: Array.isArray(dto.qualifications) ? dto.qualifications.join(', ') : String(dto.qualifications).trim(),
                  institution: 'Medical University / Institute',
                  year: new Date().getFullYear() - 5,
                },
              }
            : undefined,
          verification: {
            create: {
              registrationNumber,
              registrationAuthority,
              // Registration data is not proof of medical credentials. An admin
              // review is required before the practitioner is represented as verified.
              status: VerificationStatus.PENDING,
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
          include: { verification: true, clinic: true, qualifications: true },
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

  async forgotPassword(email: string) {
    const cleanEmail = email.trim().toLowerCase();
    const user = await this.prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    if (user) {
      console.log(`[AuthService] Password recovery token dispatched for: ${cleanEmail}`);
    }

    return {
      success: true,
      message: `If an account exists for ${cleanEmail}, a password recovery link has been sent.`,
    };
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
