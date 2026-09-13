import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdatePatientProfileDto } from './dto/update-patient-profile.dto';

@Injectable()
export class PatientsService {
  constructor(private prisma: PrismaService) {}

  async getProfile(userIdOrPatientId: string, currentUser?: any) {
    const patient = await this.prisma.patient.findFirst({
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

    if (currentUser) {
      const isOwner = currentUser.id === patient.userId || currentUser.patient?.id === patient.id;
      const isAdmin = currentUser.role === 'ADMIN';

      if (!isOwner && !isAdmin) {
        if (currentUser.role === 'DOCTOR' && currentUser.doctor?.id) {
          // Doctor must have had or have an appointment with this patient
          const encounter = await this.prisma.appointment.findFirst({
            where: {
              patientId: patient.id,
              doctorId: currentUser.doctor.id,
            },
          });
          if (!encounter) {
            throw new ForbiddenException('You do not have a clinical treatment relationship with this patient.');
          }
        } else {
          throw new ForbiddenException('You do not have permission to view this patient profile.');
        }
      }
    }

    return patient;
  }

  async updateProfile(userIdOrPatientId: string, dto: UpdatePatientProfileDto, currentUser?: any) {
    const existing = await this.prisma.patient.findFirst({
      where: {
        OR: [{ id: userIdOrPatientId }, { userId: userIdOrPatientId }],
      },
    });

    if (!existing) {
      throw new NotFoundException('Patient record not found.');
    }

    if (currentUser) {
      const isOwner = currentUser.id === existing.userId || currentUser.patient?.id === existing.id;
      const isAdmin = currentUser.role === 'ADMIN';
      if (!isOwner && !isAdmin) {
        throw new ForbiddenException('You can only update your own patient profile.');
      }
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
        throw new BadRequestException('Unique constraint violation on patient profile.');
      }
      throw error;
    }
  }
}

