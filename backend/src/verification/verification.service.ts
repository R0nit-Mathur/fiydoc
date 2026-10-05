import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { VerificationStatus } from '@prisma/client';

export interface IndianMedicalRegistryRecord {
  verified: boolean;
  registrationNumber: string;
  registrationAuthority: string;
  councilState: string;
  verificationBadge: string;
  practitionerName?: string;
  primaryQualification?: string;
  registrationYear: number;
  status: VerificationStatus;
  verificationCertificateId: string;
  verifiedAt: string;
  issuingAuthority: string;
  remarks: string;
}

const STATE_COUNCILS_DIRECTORY: Record<string, { state: string; name: string; prefixRegex: RegExp }> = {
  NMC: { state: 'National', name: 'National Medical Commission (NMC / formerly MCI)', prefixRegex: /^(MCI|NMC)?[-\s]?[0-9]{4,8}$/i },
  MCI: { state: 'National', name: 'National Medical Commission (MCI)', prefixRegex: /^(MCI|NMC)?[-\s]?[0-9]{4,8}$/i },
  MMC: { state: 'Maharashtra', name: 'Maharashtra Medical Council (MMC)', prefixRegex: /^(MMC)?[-\s]?[0-9]{4}(\/[0-9]{2})?(\/[0-9]{1,6})?|[0-9]{5,7}$/i },
  DMC: { state: 'Delhi', name: 'Delhi Medical Council (DMC)', prefixRegex: /^(DMC)?[-\s]?[0-9]{4,7}$/i },
  KMC: { state: 'Karnataka', name: 'Karnataka Medical Council (KMC)', prefixRegex: /^(KMC)?[-\s]?[0-9]{4,7}$/i },
  TNMC: { state: 'Tamil Nadu', name: 'Tamil Nadu Medical Council (TNMC)', prefixRegex: /^(TNMC)?[-\s]?[0-9]{4,7}$/i },
  UPMC: { state: 'Uttar Pradesh', name: 'Uttar Pradesh Medical Council (UPMC)', prefixRegex: /^(UPMC)?[-\s]?[0-9]{4,7}$/i },
  WBMC: { state: 'West Bengal', name: 'West Bengal Medical Council (WBMC)', prefixRegex: /^(WBMC)?[-\s]?[0-9]{4,7}$/i },
  GMC: { state: 'Gujarat', name: 'Gujarat Medical Council (GMC)', prefixRegex: /^(GMC)?[-\s]?[0-9]{4,7}$/i },
  APMC: { state: 'Andhra Pradesh', name: 'Andhra Pradesh Medical Council (APMC)', prefixRegex: /^(APMC)?[-\s]?[0-9]{4,7}$/i },
  TSMC: { state: 'Telangana', name: 'Telangana State Medical Council (TSMC)', prefixRegex: /^(TSMC)?[-\s]?[0-9]{4,7}$/i },
  RMC: { state: 'Rajasthan', name: 'Rajasthan Medical Council (RMC)', prefixRegex: /^(RMC)?[-\s]?[0-9]{4,7}$/i },
};

@Injectable()
export class VerificationService {
  constructor(private prisma: PrismaService) {}

  /**
   * Performs format-only intake validation. This service is not connected to a
   * regulator registry, so it must never promote an applicant to VERIFIED.
   */
  verifyIndianDoctorLicense(registrationNumber: string, registrationAuthority: string): IndianMedicalRegistryRecord {
    const cleanReg = registrationNumber ? registrationNumber.trim().toUpperCase() : '';
    const cleanAuth = registrationAuthority ? registrationAuthority.trim() : '';

    const matchedKey = Object.keys(STATE_COUNCILS_DIRECTORY).find(
      (k) => cleanAuth.toUpperCase().includes(k) || cleanReg.startsWith(k)
    );

    const council = matchedKey ? STATE_COUNCILS_DIRECTORY[matchedKey] : undefined;
    const hasPlausibleFormat = cleanReg.length >= 4 && cleanReg.length <= 20;

    return {
      verified: false,
      registrationNumber: cleanReg,
      registrationAuthority: cleanAuth,
      councilState: council?.state || 'Unknown',
      verificationBadge: 'PENDING MANUAL REVIEW',
      registrationYear: 0,
      status: VerificationStatus.PENDING,
      verificationCertificateId: '',
      verifiedAt: '',
      issuingAuthority: 'Not externally connected',
      remarks: hasPlausibleFormat
        ? 'Registration format received. FiYDoc has not verified this credential against an external registry.'
        : 'Registration details are incomplete or malformed. Provide the official registration certificate for manual review.',
    };
  }

  async submitVerification(doctorId: string, dto: {
    registrationNumber: string;
    registrationAuthority: string;
    submittedDocuments?: any[];
  }) {
    const checkResult = this.verifyIndianDoctorLicense(dto.registrationNumber, dto.registrationAuthority);

    const verification = await this.prisma.doctorVerification.upsert({
      where: { doctorId },
      create: {
        doctorId,
        registrationNumber: dto.registrationNumber,
        registrationAuthority: dto.registrationAuthority,
        submittedDocuments: dto.submittedDocuments || [],
        status: VerificationStatus.PENDING,
      },
      update: {
        registrationNumber: dto.registrationNumber,
        registrationAuthority: dto.registrationAuthority,
        submittedDocuments: dto.submittedDocuments,
        status: VerificationStatus.PENDING,
      },
    });

    return {
      ...verification,
      registryDetails: checkResult,
    };
  }

  async getVerificationByDoctor(doctorId: string) {
    const verification = await this.prisma.doctorVerification.findUnique({
      where: { doctorId },
      include: { doctor: true },
    });

    if (!verification) return null;

    const registryDetails = this.verifyIndianDoctorLicense(
      verification.registrationNumber,
      verification.registrationAuthority
    );

    return {
      ...verification,
      registryDetails,
    };
  }
}
