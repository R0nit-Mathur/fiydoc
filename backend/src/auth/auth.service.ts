import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';
import { Role, VerificationStatus } from '@prisma/client';

import { RegisterDto, PublicRegisterRole } from './dto/register.dto';
import { GoogleAuthDto } from './dto/google-auth.dto';
import { OAuth2Client } from 'google-auth-library';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService
  ) {}

  async register(dto: RegisterDto) {
    if ((dto.role as any) === Role.ADMIN || (dto.role as any) === 'ADMIN') {
      throw new BadRequestException('Public administrator registration is prohibited.');
    }

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
      if (!dto.specialization?.trim()) {
        throw new BadRequestException('Specialization is required for doctor registration.');
      }
      if (dto.consultationFee === undefined || dto.consultationFee === null || Number(dto.consultationFee) < 0) {
        throw new BadRequestException('A valid consultation fee (>= 0) is required for doctor registration.');
      }

      const registrationNumber = dto.licenseNumber.trim();
      const registrationAuthority = dto.registrationAuthority?.trim() || 'National Medical Commission / State Council';
      const specialization = dto.specialization.trim();
      const fee = Number(dto.consultationFee);
      const clinicName = dto.clinicName.trim();
      const clinicAddress = dto.clinicAddress?.trim() || null;
      const clinicLatitude = dto.clinicLatitude !== undefined && dto.clinicLatitude !== null ? Number(dto.clinicLatitude) : null;
      const clinicLongitude = dto.clinicLongitude !== undefined && dto.clinicLongitude !== null ? Number(dto.clinicLongitude) : null;

      await this.prisma.doctor.create({
        data: {
          userId: user.id,
          fullName: dto.fullName.trim(),
          specialization,
          consultationFee: fee,
          clinic: clinicAddress
            ? {
                create: {
                  name: clinicName,
                  address: clinicAddress,
                  latitude: clinicLatitude,
                  longitude: clinicLongitude,
                  timings: null,
                },
              }
            : undefined,
          qualifications: dto.qualifications && dto.qualifications.length > 0
            ? {
                create: {
                  degree: Array.isArray(dto.qualifications) ? dto.qualifications.join(', ') : String(dto.qualifications).trim(),
                  institution: null,
                  year: null,
                },
              }
            : undefined,
          verification: {
            create: {
              registrationNumber,
              registrationAuthority,
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

    if (user.status !== 'ACTIVE') {
      throw new UnauthorizedException('User account is suspended or revoked.');
    }

    const valid = await bcrypt.compare(dto.password || '', user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Invalid login credentials.');
    }

    return this.generateTokenResponse(user);
  }

  async googleOAuthLogin(dto: GoogleAuthDto) {
    if (!dto.credential || dto.credential.trim().length === 0) {
      throw new UnauthorizedException('Missing required Google authentication credential.');
    }

    const credential = dto.credential.trim();
    let verifiedEmail: string;
    let verifiedGoogleSub: string;
    let verifiedName: string;

    // Cryptographically verify ID token using official Google OAuth2Client
    const clientId = process.env.GOOGLE_CLIENT_ID;

    try {
      const client = new OAuth2Client(clientId);
      const ticket = await client.verifyIdToken({
        idToken: credential,
        audience: clientId || undefined,
      });
      const payload = ticket.getPayload();
      if (!payload || !payload.email || !payload.sub) {
        throw new UnauthorizedException('Invalid Google ID token payload.');
      }
      if (!payload.email_verified) {
        throw new UnauthorizedException('Google email address has not been verified by Google.');
      }
      verifiedEmail = payload.email.trim().toLowerCase();
      verifiedGoogleSub = payload.sub.trim();
      verifiedName = payload.name?.trim() || payload.email.split('@')[0];
    } catch (err: any) {
      if (err instanceof UnauthorizedException) throw err;
      throw new UnauthorizedException(`Cryptographic verification of Google ID token failed: ${err.message || 'Access denied'}`);
    }

    const includeRelations = {
      patient: true,
      doctor: {
        include: { verification: true, clinic: true },
      },
    };

    // Check if user already exists by verified googleId
    let user = await this.prisma.user.findUnique({
      where: { googleId: verifiedGoogleSub },
      include: includeRelations,
    });

    if (!user) {
      // Check if user exists by verified email
      const existingByEmail = await this.prisma.user.findUnique({
        where: { email: verifiedEmail },
        include: includeRelations,
      });

      if (existingByEmail) {
        // Prevent Account Takeover: If the account was created with a password,
        // and doesn't have a googleId linked, require that the existing account does not have a conflicting googleId
        if (existingByEmail.googleId && existingByEmail.googleId !== verifiedGoogleSub) {
          throw new UnauthorizedException('Conflict: Account is already linked to a different Google account.');
        }

        // Link verified googleId to the verified email owner
        user = await this.prisma.user.update({
          where: { id: existingByEmail.id },
          data: { googleId: verifiedGoogleSub },
          include: includeRelations,
        });
      } else {
        // Create new account: Role can only be PATIENT or DOCTOR (never ADMIN)
        const assignedRole = dto.role === PublicRegisterRole.DOCTOR ? Role.DOCTOR : Role.PATIENT;

        user = await this.prisma.user.create({
          data: {
            email: verifiedEmail,
            googleId: verifiedGoogleSub,
            role: assignedRole,
            ...(assignedRole === Role.PATIENT
              ? {
                  patient: {
                    create: {
                      fullName: verifiedName,
                    },
                  },
                }
              : {
                  doctor: {
                    create: {
                      fullName: verifiedName,
                      specialization: 'General Medicine',
                      consultationFee: 0,
                      verification: {
                        create: {
                          registrationNumber: null,
                          registrationAuthority: null,
                          status: VerificationStatus.PENDING,
                        },
                      },
                    },
                  },
                }),
          },
          include: includeRelations,
        });
      }
    }

    if (user.status !== 'ACTIVE') {
      throw new UnauthorizedException('User account is suspended or revoked.');
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
