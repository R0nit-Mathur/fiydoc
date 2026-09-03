import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { VerificationStatus } from '@prisma/client';

@Injectable()
export class VerificationService {
  constructor(private prisma: PrismaService) {}

  async submitVerification(doctorId: string, dto: {
    registrationNumber: string;
    registrationAuthority: string;
    submittedDocuments: any[];
  }) {
    // Perform external medical registry API check simulation
    const externalRegistryValid = this.checkExternalMedicalRegistry(dto.registrationNumber, dto.registrationAuthority);

    const verification = await this.prisma.doctorVerification.upsert({
      where: { doctorId },
      create: {
        doctorId,
        registrationNumber: dto.registrationNumber,
        registrationAuthority: dto.registrationAuthority,
        submittedDocuments: dto.submittedDocuments || [],
        status: externalRegistryValid ? VerificationStatus.PENDING : VerificationStatus.INFO_REQUIRED,
      },
      update: {
        registrationNumber: dto.registrationNumber,
        registrationAuthority: dto.registrationAuthority,
        submittedDocuments: dto.submittedDocuments,
        status: VerificationStatus.PENDING,
      },
    });

    return verification;
  }

  async getVerificationByDoctor(doctorId: string) {
    return this.prisma.doctorVerification.findUnique({
      where: { doctorId },
      include: { doctor: true },
    });
  }

  private checkExternalMedicalRegistry(regNumber: string, authority: string): boolean {
    // External Medical Council Registry API validation driver
    return regNumber && regNumber.length >= 4;
  }
}
