import { Injectable, BadRequestException, UnauthorizedException, Logger, HttpException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';
import { Role, VerificationStatus } from '@prisma/client';

import { RegisterDto, PublicRegisterRole } from './dto/register.dto';
import { GoogleAuthDto } from './dto/google-auth.dto';
import { OAuth2Client } from 'google-auth-library';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService
  ) {}

  async register(dto: RegisterDto) {
    try {
      if ((dto.role as any) === Role.ADMIN || (dto.role as any) === 'ADMIN') {
        throw new BadRequestException('Public administrator registration is prohibited.');
      }

      if (!dto.email && !dto.phone) {
        throw new BadRequestException('Email or phone number is required.');
      }

      const cleanEmail = dto.email ? dto.email.trim().toLowerCase() : null;
      const cleanPhone = dto.phone ? dto.phone.trim() : null;

      if (cleanEmail) {
        const existing = await this.prisma.user.findUnique({ where: { email: cleanEmail } });
        if (existing) {
          throw new BadRequestException({
            code: 'EMAIL_ALREADY_REGISTERED',
            message: 'This email is already registered. Please sign in instead.',
          });
        }
      }

      if (cleanPhone) {
        const existing = await this.prisma.user.findUnique({ where: { phone: cleanPhone } });
        if (existing) {
          throw new BadRequestException({
            code: 'PHONE_ALREADY_REGISTERED',
            message: 'This phone number is already registered. Please sign in instead.',
          });
        }
      }

      const passwordHash = dto.password ? await bcrypt.hash(dto.password, 10) : null;
      const isDoctor = (dto.role as any) === Role.DOCTOR || (dto.role as any) === 'DOCTOR';
      const roleToSet = isDoctor ? Role.DOCTOR : Role.PATIENT;

      let doctorDataToCreate: any = null;
      const defaultAvailabilities: { dayOfWeek: number; startTime: string; endTime: string; slotDurationMinutes: number }[] = [];

      if (isDoctor) {
        const cleanName = dto.fullName?.trim() || 'Dr. Doctor';
        const registrationNumber = dto.licenseNumber?.trim() || `NMC-${Date.now().toString().slice(-6)}`;
        const registrationAuthority = dto.registrationAuthority?.trim() || 'National Medical Commission / State Council';
        const specialization = dto.specialization?.trim() || 'General Medicine';
        const fee = dto.consultationFee !== undefined && dto.consultationFee !== null && Number(dto.consultationFee) >= 0
          ? Number(dto.consultationFee)
          : 500;
        const clinicName = dto.clinicName?.trim() || `${cleanName}'s Clinic`;
        const clinicAddress = dto.clinicAddress?.trim() || 'Clinical Practice Address Pending';
        const clinicTimings = dto.clinicTimings?.trim() || '09:00 - 13:00, 17:00 - 20:00';
        const clinicLatitude = dto.clinicLatitude !== undefined && dto.clinicLatitude !== null ? Number(dto.clinicLatitude) : null;
        const clinicLongitude = dto.clinicLongitude !== undefined && dto.clinicLongitude !== null ? Number(dto.clinicLongitude) : null;

        for (let day = 1; day <= 6; day++) {
          defaultAvailabilities.push(
            { dayOfWeek: day, startTime: '09:00', endTime: '13:00', slotDurationMinutes: 30 },
            { dayOfWeek: day, startTime: '17:00', endTime: '20:00', slotDurationMinutes: 30 },
          );
        }

        const qualString = dto.qualifications
          ? (Array.isArray(dto.qualifications) ? dto.qualifications.join(', ') : String(dto.qualifications).trim())
          : null;

        doctorDataToCreate = {
          fullName: cleanName.startsWith('Dr.') ? cleanName : `Dr. ${cleanName}`,
          specialization,
          consultationFee: fee,
          experienceYears: dto.experienceYears ? Number(dto.experienceYears) : 0,
          patientsPerSlot: dto.patientsPerSlot ? Number(dto.patientsPerSlot) : 1,
          clinic: {
            create: {
              name: clinicName,
              address: clinicAddress,
              latitude: clinicLatitude,
              longitude: clinicLongitude,
              timings: clinicTimings,
            },
          },
          qualifications: qualString
            ? {
                create: {
                  degree: qualString,
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
        };
      }

      const fullUser = await this.prisma.$transaction(
        async (tx) => {
          const user = await tx.user.create({
            data: {
              email: cleanEmail || undefined,
              phone: cleanPhone || undefined,
              passwordHash,
              role: roleToSet,
            },
          });

          if (roleToSet === Role.PATIENT) {
            await tx.patient.create({
              data: {
                userId: user.id,
                fullName: dto.fullName?.trim() || 'Patient User',
              },
            });
          } else if (roleToSet === Role.DOCTOR && doctorDataToCreate) {
            const createdDoc = await tx.doctor.create({
              data: {
                ...doctorDataToCreate,
                userId: user.id,
              },
            });

            if (defaultAvailabilities.length > 0) {
              await tx.availability.createMany({
                data: defaultAvailabilities.map((a) => ({
                  doctorId: createdDoc.id,
                  dayOfWeek: a.dayOfWeek,
                  startTime: a.startTime,
                  endTime: a.endTime,
                  slotDurationMinutes: a.slotDurationMinutes,
                })),
              });
            }
          }

          return tx.user.findUnique({
            where: { id: user.id },
            include: {
              patient: true,
              doctor: {
                include: { verification: true, clinic: true, qualifications: true },
              },
            },
          });
        },
        {
          maxWait: 15000,
          timeout: 45000,
        }
      );

      this.logger.log(`✅ Registered new ${fullUser?.role}: ${fullUser?.email || fullUser?.phone}`);
      return this.generateTokenResponse(fullUser);
    } catch (err: any) {
      this.logger.error(`❌ [register] Failed for ${dto?.email || dto?.phone}: ${err?.message}`, err?.stack);
      if (err instanceof HttpException) {
        throw err;
      }
      throw new BadRequestException(
        `Registration failed: ${err?.message || 'Database error during account creation'}`
      );
    }
  }

  async ensureDoctorRecordForUser(user: any): Promise<any> {
    if (!user || user.role !== Role.DOCTOR || user.doctor) {
      return user;
    }

    const doctorName = (user.email ? user.email.split('@')[0] : 'Doctor');
    const cleanName = doctorName.startsWith('Dr.') ? doctorName : `Dr. ${doctorName}`;
    const defaultAvailabilities: { dayOfWeek: number; startTime: string; endTime: string; slotDurationMinutes: number }[] = [];
    for (let day = 1; day <= 6; day++) {
      defaultAvailabilities.push(
        { dayOfWeek: day, startTime: '09:00', endTime: '13:00', slotDurationMinutes: 30 },
        { dayOfWeek: day, startTime: '17:00', endTime: '20:00', slotDurationMinutes: 30 },
      );
    }

    try {
      const createdDoc = await this.prisma.doctor.create({
        data: {
          userId: user.id,
          fullName: cleanName,
          specialization: 'General Medicine',
          consultationFee: 500,
          clinic: {
            create: {
              name: `${cleanName}'s Clinic`,
              address: 'Clinical Practice Address Pending',
              timings: '09:00 - 13:00, 17:00 - 20:00',
            },
          },
          verification: {
            create: {
              registrationNumber: `NMC-${Date.now().toString().slice(-6)}`,
              registrationAuthority: 'National Medical Commission / State Council',
              status: VerificationStatus.PENDING,
            },
          },
        },
      });

      if (defaultAvailabilities.length > 0) {
        await this.prisma.availability.createMany({
          data: defaultAvailabilities.map((a) => ({
            doctorId: createdDoc.id,
            dayOfWeek: a.dayOfWeek,
            startTime: a.startTime,
            endTime: a.endTime,
            slotDurationMinutes: a.slotDurationMinutes,
          })),
        });
      }
    } catch (err: any) {
      this.logger.warn(`⚠️ [ensureDoctorRecordForUser] Warning: ${err?.message}`);
    }

    return this.prisma.user.findUnique({
      where: { id: user.id },
      include: {
        patient: true,
        doctor: {
          include: { verification: true, clinic: true, qualifications: true, availabilities: true },
        },
      },
    });
  }

  async login(dto: { email?: string; phone?: string; password?: string }) {
    let user;
    const includeRelations = {
      patient: true,
      doctor: {
        include: { verification: true, clinic: true, qualifications: true },
      },
    };

    const normalizedEmail = dto.email ? dto.email.trim().toLowerCase() : undefined;
    const normalizedPhone = dto.phone ? dto.phone.trim() : undefined;

    if (normalizedEmail) {
      user = await this.prisma.user.findUnique({
        where: { email: normalizedEmail },
        include: includeRelations,
      });
    } else if (normalizedPhone) {
      user = await this.prisma.user.findUnique({
        where: { phone: normalizedPhone },
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

    if (user.role === Role.DOCTOR && !user.doctor) {
      user = await this.ensureDoctorRecordForUser(user);
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

    // Enforce Product Invariant: Google Sign-In is strictly PATIENT-ONLY.
    // Doctors must register/authenticate using medical credentials.
    if (user && user.role === Role.DOCTOR) {
      throw new UnauthorizedException('Doctor accounts must authenticate using password and institutional credentials, not Google Sign-In.');
    }

    if (!user) {
      // Check if user exists by verified email
      const existingByEmail = await this.prisma.user.findUnique({
        where: { email: verifiedEmail },
        include: includeRelations,
      });

      if (existingByEmail) {
        if (existingByEmail.role === Role.DOCTOR) {
          throw new UnauthorizedException('Doctor accounts must authenticate using password and institutional credentials, not Google Sign-In.');
        }

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
        // Create new account: Google accounts are always PATIENT
        user = await this.prisma.user.create({
          data: {
            email: verifiedEmail,
            googleId: verifiedGoogleSub,
            role: Role.PATIENT,
            patient: {
              create: {
                fullName: verifiedName,
              },
            },
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

  async getMe(currentUser: any) {
    if (!currentUser?.id) {
      throw new UnauthorizedException('Authentication session is required.');
    }
    const user = await this.prisma.user.findUnique({
      where: { id: currentUser.id },
      include: {
        patient: true,
        doctor: {
          include: { verification: true, clinic: true, qualifications: true, availabilities: true },
        },
      },
    });
    if (!user || user.status !== 'ACTIVE') {
      throw new UnauthorizedException('User account not found or suspended.');
    }
    return {
      id: user.id,
      email: user.email,
      phone: user.phone,
      role: user.role,
      patient: user.patient,
      doctor: user.doctor,
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
