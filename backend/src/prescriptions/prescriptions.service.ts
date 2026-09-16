import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SupabaseService } from '../supabase/supabase.service';
import { Role, VerificationStatus } from '@prisma/client';
import PDFDocument from 'pdfkit';
import * as crypto from 'crypto';

@Injectable()
export class PrescriptionsService {
  constructor(
    private prisma: PrismaService,
    private supabase: SupabaseService,
  ) {}

  private buildPrescriptionDocument(prescription: any): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const pdf = new PDFDocument({ margin: 48, size: 'A4' });
      const chunks: Buffer[] = [];
      pdf.on('data', (chunk: Buffer) => chunks.push(chunk));
      pdf.on('end', () => resolve(Buffer.concat(chunks)));
      pdf.on('error', reject);

      pdf.fillColor('#3055A8').fontSize(22).text('FiYDoc Digital Prescription');
      pdf.fillColor('#52606D').fontSize(10).text(`Verification code: ${prescription.verificationCode || '—'}`);
      pdf.moveDown();
      pdf.fillColor('#172033').fontSize(11)
        .text(`Doctor: ${prescription.doctor?.fullName || 'Licensed Practitioner'}`)
        .text(`Patient: ${prescription.patient?.fullName || 'Patient'}`)
        .text(`Issued: ${new Date((prescription as any).issuedAt || (prescription as any).signedAt || prescription.createdAt || Date.now()).toLocaleString('en-IN')}`);
      pdf.moveDown().fontSize(13).fillColor('#3055A8').text('Medicines');
      pdf.moveDown(0.4).fontSize(10).fillColor('#172033');
      if (!prescription.medicines || prescription.medicines.length === 0) {
        pdf.text('No medicines prescribed.');
      } else {
        prescription.medicines.forEach((medicine: any, index: number) => {
          pdf.font('Helvetica-Bold').text(`${index + 1}. ${medicine.name}`);
          pdf.font('Helvetica').text(`${medicine.dosage} • ${medicine.frequency} • ${medicine.durationDays} days`);
          if (medicine.instructions) pdf.fillColor('#52606D').text(medicine.instructions).fillColor('#172033');
          pdf.moveDown(0.5);
        });
      }
      pdf.moveDown().fontSize(13).fillColor('#3055A8').text('Clinical notes');
      pdf.moveDown(0.4).fontSize(10).fillColor('#172033').text(prescription.doctorNotes || '—');
      pdf.moveDown().fontSize(13).fillColor('#3055A8').text('Follow-up');
      pdf.moveDown(0.4).fontSize(10).fillColor('#172033').text(prescription.followUpInstructions || 'As advised by your clinician.');
      pdf.end();
    });
  }

  async createPrescription(
    dto: {
      consultationId: string;
      doctorNotes?: string;
      followUpInstructions?: string;
      medicines?: {
        name: string;
        dosage: string;
        frequency: string;
        durationDays: number;
        instructions?: string;
      }[];
      tests?: {
        name: string;
        category?: string;
      }[];
    },
    currentUser: any,
  ) {
    if (!currentUser) {
      throw new ForbiddenException('Authentication required to issue prescriptions.');
    }

    if (currentUser.role !== Role.DOCTOR && currentUser.role !== Role.ADMIN) {
      throw new ForbiddenException('Only a licensed doctor or authorized admin can issue prescriptions.');
    }

    if (!dto.consultationId) {
      throw new BadRequestException('An existing consultationId is strictly required to issue a prescription.');
    }

    // Doctor must be registered/verified to write prescriptions
    let docRecord: any = null;
    if (currentUser.role === Role.DOCTOR) {
      if (currentUser.doctor?.id) {
        docRecord = await this.prisma.doctor.findUnique({
          where: { id: currentUser.doctor.id },
          include: { verification: true },
        });
      }
      if (!docRecord && currentUser.id) {
        docRecord = await this.prisma.doctor.findFirst({
          where: { userId: currentUser.id },
          include: { verification: true },
        });
      }
      if (!docRecord) {
        throw new ForbiddenException('Doctor profile not found.');
      }
      // Strictly require verified status to issue prescriptions
      if (docRecord.verification?.status !== VerificationStatus.VERIFIED) {
        throw new ForbiddenException(
          'Only verified medical practitioners can issue prescriptions. Your credentials are under review or unverified.'
        );
      }
    }

    // Check if prescription already exists for this consultation (Idempotency)
    const existingRx = await this.prisma.prescription.findUnique({
      where: { consultationId: dto.consultationId },
      include: { medicines: true, doctor: true, patient: true },
    });
    if (existingRx) {
      const effectiveIssuedAt = (existingRx as any).issuedAt || existingRx.createdAt;
      return {
        ...existingRx,
        issuedAt: effectiveIssuedAt,
        signedAt: effectiveIssuedAt,
      };
    }

    // Require genuine, existing clinical consultation
    const consultation = await this.prisma.consultation.findUnique({
      where: { id: dto.consultationId },
      include: { doctor: true, patient: true, appointment: true },
    });

    if (!consultation) {
      throw new NotFoundException('Specified clinical consultation does not exist.');
    }

    // Accept consultations that are completed or whose appointment is COMPLETED
    const isCompletedConsultation =
      consultation.completedAt ||
      consultation.appointment?.status === 'COMPLETED';
    if (!isCompletedConsultation) {
      throw new BadRequestException(
        'Prescriptions can only be issued for completed, finalized clinical consultations. Please mark the appointment as completed first.'
      );
    }

    // Authenticated doctor must match the assigned consultation doctor
    const isAssignedDoctor =
      consultation.doctorId === currentUser.doctor?.id ||
      consultation.doctorId === docRecord?.id ||
      consultation.doctor?.userId === currentUser.id ||
      consultation.doctorId === currentUser.id;
    if (currentUser.role === Role.DOCTOR && !isAssignedDoctor) {
      throw new ForbiddenException('You cannot issue a prescription for another doctor’s patient encounter.');
    }

    // Validate and sanitize medicine items
    if (!dto.medicines || dto.medicines.length === 0) {
      throw new BadRequestException('Prescription must include at least one medication.');
    }

    const sanitizedMedicines = dto.medicines.map((m: any) => {
      const name = m.name?.trim();
      if (!name) {
        throw new BadRequestException('Every prescribed medicine must have a valid medication name.');
      }
      const dosage = m.dosage?.trim();
      if (!dosage) {
        throw new BadRequestException('Dosage is required for every prescribed medication.');
      }
      const frequency = m.frequency?.trim();
      if (!frequency) {
        throw new BadRequestException('Frequency is required for every prescribed medication.');
      }
      const durationDays = Number(m.durationDays);
      if (isNaN(durationDays) || durationDays <= 0) {
        throw new BadRequestException('Valid duration in days is required for every prescribed medication.');
      }
      const instructions = m.instructions?.trim() || '';

      return {
        name,
        dosage,
        frequency,
        durationDays,
        instructions,
      };
    });

    // Cryptographically secure verification code
    const randomSuffix = crypto.randomBytes(3).toString('hex').toUpperCase();
    const verificationCode = `FYD-RX-${Date.now().toString().slice(-6)}-${randomSuffix}`;
    const issuedTimestamp = new Date();

    // Core transaction: Only prescription and its medicines
    const createdPrescription = await this.prisma.$transaction(async (tx) => {
      const rxData: any = {
        consultationId: consultation.id,
        patientId: consultation.patientId,
        doctorId: consultation.doctorId,
        doctorNotes: dto.doctorNotes,
        followUpInstructions: dto.followUpInstructions,
        verificationCode,
        issuedAt: issuedTimestamp,
        medicines: {
          create: sanitizedMedicines,
        },
      };

      return tx.prescription.create({
        data: rxData,
        include: { medicines: true, doctor: true, patient: true },
      });
    });

    // Auto-create timeline MedicalRecord entry (non-fatal)
    try {
      await this.prisma.medicalRecord.create({
        data: {
          patientId: consultation.patientId,
          title: `Prescription from ${consultation.doctor.fullName}`,
          type: 'PRESCRIPTION',
          sourceId: createdPrescription.id,
          summary: `Prescribed ${dto.medicines.length} medicine(s)`,
          tags: ['DIGITAL_RX', 'OFFICIAL_PRESCRIPTION'],
        },
      });
    } catch (recordErr: any) {
      console.warn('[prescriptions] Timeline MedicalRecord creation failed (non-fatal):', recordErr?.message);
    }

    // Audit log entry (non-fatal)
    try {
      if (currentUser?.id) {
        await this.prisma.auditLog.create({
          data: {
            actorUserId: currentUser.id,
            action: 'PRESCRIPTION_ISSUED',
            targetType: 'PRESCRIPTION',
            targetId: createdPrescription.id,
            metadata: {
              consultationId: consultation.id,
              patientId: consultation.patientId,
              medicineCount: dto.medicines.length,
            },
          },
        });
      }
    } catch (auditErr: any) {
      console.warn('[prescriptions] AuditLog insert failed (non-fatal):', auditErr?.message);
    }

    // Notify patient (non-fatal)
    try {
      if (consultation.patient?.userId) {
        await this.prisma.notification.create({
          data: {
            userId: consultation.patient.userId,
            type: 'PRESCRIPTION_ISSUED',
            title: 'Prescription Ready',
            message: `${consultation.doctor.fullName} has issued your digital prescription.`,
          },
        });
      }
    } catch (notifErr: any) {
      console.warn('[prescriptions] Notification creation failed (non-fatal):', notifErr?.message);
    }

    // Generate PDF and upload in background (non-blocking) for instant signing response
    let storagePath: string | null = null;
    if (this.supabase.isConfigured()) {
      const bucket = process.env.SUPABASE_STORAGE_BUCKET || 'fiydoc-medical-docs';
      storagePath = `prescriptions/${consultation.patientId}/${createdPrescription.id}.pdf`;
      this.generateAndStorePdf(createdPrescription, bucket, storagePath).catch((err) => {
        console.warn('[prescriptions] Background PDF upload error:', err?.message);
      });
    }

    const effectiveIssuedAt = (createdPrescription as any).issuedAt || createdPrescription.createdAt;
    return {
      ...createdPrescription,
      issuedAt: effectiveIssuedAt,
      signedAt: effectiveIssuedAt,
      pdfUrl: storagePath,
    };
  }

  private async generateAndStorePdf(prescription: any, bucket: string, storagePath: string) {
    try {
      const pdfBuffer = await this.buildPrescriptionDocument(prescription);
      await this.supabase.uploadPrivateFile(bucket, storagePath, pdfBuffer, 'application/pdf');

      await this.prisma.prescription.update({
        where: { id: prescription.id },
        data: { pdfUrl: storagePath },
      });

      await this.prisma.medicalRecord.updateMany({
        where: { sourceId: prescription.id, type: 'PRESCRIPTION' },
        data: { documentUrl: storagePath },
      });
    } catch (err: any) {
      console.warn('[prescriptions] Background PDF generation/upload error:', err?.message);
    }
  }

  async getPrescriptionById(id: string, currentUser: any) {
    const rx = await this.prisma.prescription.findUnique({
      where: { id },
      include: { medicines: true, doctor: true, patient: true },
    });
    if (!rx) throw new NotFoundException('Prescription not found.');

    this.checkPrescriptionActorAccess(rx, currentUser);

    let signedUrl = rx.pdfUrl;
    if (rx.pdfUrl && this.supabase.isConfigured() && !rx.pdfUrl.startsWith('http')) {
      const bucket = process.env.SUPABASE_STORAGE_BUCKET || 'fiydoc-medical-docs';
      try {
        signedUrl = await this.supabase.createSignedUrl(bucket, rx.pdfUrl, 3600);
      } catch (err) {
        // Fallback to stored path
      }
    }

    const effectiveIssuedAt = (rx as any).issuedAt || rx.createdAt;
    return { ...rx, issuedAt: effectiveIssuedAt, signedAt: effectiveIssuedAt, pdfUrl: signedUrl };
  }

  async verifyPrescriptionCode(verificationCode: string) {
    const rx = await this.prisma.prescription.findUnique({
      where: { verificationCode: verificationCode.trim() },
      include: {
        doctor: { select: { fullName: true, specialization: true } },
        medicines: { select: { name: true } },
      },
    });

    if (!rx) {
      return { verified: false, message: 'Invalid or fraudulent prescription code.' };
    }

    // Minimum required verification info to protect PHI
    const effectiveIssuedAt = (rx as any).issuedAt || rx.createdAt;
    return {
      verified: true,
      doctorName: rx.doctor.fullName,
      specialization: rx.doctor.specialization,
      issuedAt: effectiveIssuedAt,
      signedAt: effectiveIssuedAt,
      medicineCount: rx.medicines.length,
      verificationCode: rx.verificationCode,
    };
  }

  async getPrescriptionsForPatient(patientId: string, currentUser: any) {
    if (!currentUser) {
      throw new ForbiddenException('Authentication required.');
    }

    // Step 1: Enforce patient ownership immediately if role is PATIENT
    if (currentUser.role === Role.PATIENT) {
      const isOwner =
        patientId === 'me' ||
        patientId === currentUser.patient?.id ||
        patientId === currentUser.id;
      if (!isOwner) {
        throw new ForbiddenException('Cannot access another patient\'s prescriptions.');
      }
    }

    // Step 2: Resolve canonical Patient record (not User.id)
    const targetId = patientId === 'me' ? (currentUser.patient?.id || currentUser.id) : patientId;
    const resolvedPatientRecord = await this.prisma.patient.findFirst({
      where: {
        OR: [
          { id: targetId },
          { userId: targetId },
        ],
      },
    });

    if (!resolvedPatientRecord) {
      return [];
    }

    const resolvedPatientId = resolvedPatientRecord.id;

    // Doctor can only access prescriptions for patients with whom they have an active or completed encounter relationship
    if (currentUser.role === Role.DOCTOR) {
      const docId = currentUser.doctor?.id || (
        await this.prisma.doctor.findFirst({ where: { userId: currentUser.id } })
      )?.id;
      if (!docId) {
        throw new ForbiddenException('Doctor profile not found.');
      }
      const hasEncounter = await this.prisma.appointment.findFirst({
        where: {
          patientId: resolvedPatientId,
          doctorId: docId,
          status: { in: ['CONFIRMED', 'COMPLETED'] },
        },
      });
      if (!hasEncounter) {
        throw new ForbiddenException('You are not authorized to view prescriptions for patients outside your practice.');
      }
    }

    // Step 3: Fetch prescriptions using only the canonical patient UUID (never userId)
    const list = await this.prisma.prescription.findMany({
      where: { patientId: resolvedPatientId },
      include: {
        medicines: true,
        doctor: {
          include: {
            clinic: true,
            verification: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return list.map((rx) => {
      const effectiveIssuedAt = (rx as any).issuedAt || rx.createdAt;
      return {
        ...rx,
        issuedAt: effectiveIssuedAt,
        signedAt: effectiveIssuedAt,
      };
    });
  }

  private checkPrescriptionActorAccess(rx: any, currentUser: any) {
    if (!currentUser) {
      throw new ForbiddenException('Authentication required.');
    }
    if (currentUser.role === Role.ADMIN) {
      return;
    }

    const isPatient =
      (currentUser.patient && currentUser.patient.id === rx.patientId) ||
      currentUser.id === rx.patientId ||
      (rx.patient && rx.patient.userId === currentUser.id);

    const isDoctor =
      (currentUser.doctor && currentUser.doctor.id === rx.doctorId) ||
      currentUser.id === rx.doctorId ||
      (rx.doctor && rx.doctor.userId === currentUser.id);

    if (!isPatient && !isDoctor) {
      throw new ForbiddenException('You do not have permission to view this prescription.');
    }
  }
}

