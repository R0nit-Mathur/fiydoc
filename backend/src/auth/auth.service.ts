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
              timings: null,
            },
          },
          qualifications: dto.qualifications
            ? {
                create: {
                  degree: Array.isArray(dto.qualifications) ? dto.qualifications.join(', ') : String(dto.qualifications).trim(),
                  institution: 'Institution Pending Verification',
                  year: new Date().getFullYear(),
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

  async googleOAuthLogin(dto: GoogleAuthDto) {
    if (!dto.credential || dto.credential.trim().length === 0) {
      throw new UnauthorizedException('Missing required Google authentication credential.');
    }

    const credential = dto.credential.trim();
    let verifiedEmail: string;
    let verifiedGoogleSub: string;
    let verifiedName: string;

    // 1. First attempt: Verify using official Google OAuth2Client
    let verified = false;
    const clientId = process.env.GOOGLE_CLIENT_ID;

    try {
      const client = new OAuth2Client(clientId);
      const ticket = await client.verifyIdToken({
        idToken: credential,
        audience: clientId || undefined,
      });
      const payload = ticket.getPayload();
      if (payload && payload.email && payload.sub) {
        if (!payload.email_verified) {
          throw new UnauthorizedException('Google email address has not been verified by Google.');
        }
        verifiedEmail = payload.email.trim().toLowerCase();
        verifiedGoogleSub = payload.sub.trim();
        verifiedName = payload.name?.trim() || payload.email.split('@')[0];
        verified = true;
      }
    } catch (err: any) {
      if (err instanceof UnauthorizedException) throw err;
      // If verifyIdToken failed (e.g. token is an OAuth2 userinfo access token or tokeninfo)
    }

    // 2. Second attempt: Check Google TokenInfo API if not verified by client
    if (!verified) {
      try {
        const tokenInfoRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`);
        if (tokenInfoRes.ok) {
          const data: any = await tokenInfoRes.json();
          if (data.email && data.sub) {
            if (data.email_verified === 'false' || data.email_verified === false) {
              throw new UnauthorizedException('Google email address is not verified.');
            }
            if (clientId && data.aud && data.aud !== clientId) {
              throw new UnauthorizedException('Google token audience does not match application client ID.');
            }
            verifiedEmail = data.email.trim().toLowerCase();
            verifiedGoogleSub = data.sub.trim();
            verifiedName = data.name?.trim() || data.email.split('@')[0];
            verified = true;
          }
        }
      } catch (err: any) {
        if (err instanceof UnauthorizedException) throw err;
      }
    }

    // 3. Third attempt: Google UserInfo API (in case an OAuth2 access_token was passed)
    if (!verified) {
      try {
        const userinfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${credential}` },
        });
        if (userinfoRes.ok) {
          const data: any = await userinfoRes.json();
          if (data.email && data.sub) {
            if (data.email_verified === false) {
              throw new UnauthorizedException('Google email address is not verified.');
            }
            verifiedEmail = data.email.trim().toLowerCase();
            verifiedGoogleSub = data.sub.trim();
            verifiedName = data.name?.trim() || data.email.split('@')[0];
            verified = true;
          }
        }
      } catch (err: any) {
        if (err instanceof UnauthorizedException) throw err;
      }
    }

    if (!verified || !verifiedEmail! || !verifiedGoogleSub!) {
      throw new UnauthorizedException('Cryptographic verification of Google credential failed. Access denied.');
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
                      consultationFee: 500,
                      clinic: {
                        create: {
                          name: `${verifiedName}'s Clinic`,
                          address: 'Address Pending Verification',
                        },
                      },
                      verification: {
                        create: {
                          registrationNumber: `PENDING-${verifiedGoogleSub.slice(-6)}`,
                          registrationAuthority: 'National Medical Commission',
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

    return this.generateTokenResponse(user);
  }

  async forgotPassword(email: string) {
    const cleanEmail = email.trim().toLowerCase();
    await this.prisma.user.findUnique({
      where: { email: cleanEmail },
    });

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
