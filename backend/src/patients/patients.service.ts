import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdatePatientProfileDto } from './dto/update-patient-profile.dto';

@Injectable()
export class PatientsService {
  constructor(private prisma: PrismaService) {}

  async getProfile(userIdOrPatientId: string) {
    let patient = await this.prisma.patient.findFirst({
      where: {
        OR: [{ id: userIdOrPatientId }, { userId: userIdOrPatientId }],
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            phone: true,
            role: true,
          },
        },
      },
    });

    if (!patient) {
      throw new NotFoundException('Patient record not found.');
    }

    return patient;
  }

  async updateProfile(userIdOrPatientId: string, dto: UpdatePatientProfileDto) {
    const existing = await this.prisma.patient.findFirst({
      where: {
        OR: [{ id: userIdOrPatientId }, { userId: userIdOrPatientId }],
      },
    });

    if (!existing) {
      throw new NotFoundException('Patient record not found.');
    }

    try {
      return await this.prisma.patient.update({
      where: { id: existing.id },
      data: {
        fullName: dto.fullName !== undefined ? dto.fullName.trim() : undefined,
        dob: dto.dob !== undefined ? dto.dob : undefined,
        address: dto.address !== undefined ? dto.address.trim() : undefined,
        gender: dto.gender !== undefined ? dto.gender : undefined,
        profilePhoto: dto.profilePhoto !== undefined ? dto.profilePhoto : undefined,
        bloodGroup: dto.bloodGroup !== undefined ? dto.bloodGroup : undefined,
        allergies: dto.allergies !== undefined ? dto.allergies : undefined,
        conditions: dto.conditions !== undefined ? dto.conditions : undefined,
        medications: dto.medications !== undefined ? dto.medications : undefined,
        emergencyContact: dto.emergencyContact !== undefined ? dto.emergencyContact : undefined,
        onboardingComplete: dto.onboardingComplete !== undefined ? dto.onboardingComplete : undefined,
        user: dto.email !== undefined || dto.phone !== undefined ? {
          update: {
            email: dto.email?.trim().toLowerCase() || undefined,
            phone: dto.phone?.trim() || undefined,
          },
        } : undefined,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            phone: true,
            role: true,
          },
        },
      },
      });
    } catch (error: any) {
      if (error?.code === 'P2002') {
        throw new BadRequestException('That email address or phone number is already in use.');
      }
      throw error;
    }
  }
}
