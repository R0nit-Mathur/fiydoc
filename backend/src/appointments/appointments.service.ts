import { Injectable, BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AppointmentStatus, ConsultationType, Role } from '@prisma/client';

@Injectable()
export class AppointmentsService {
  constructor(private prisma: PrismaService) {}

  private formatAppointment(apt: any) {
    if (!apt) return null;
    const tokenMatch = apt.notes?.match(/\[(Token\s*#\d+)\]/) || apt.notes?.match(/(Token\s*#\d+)/);
    const tokenNumber = tokenMatch ? tokenMatch[1] : (apt.tokenNumber || null);

    return {
      id: apt.id,
      patientId: apt.patientId,
      patientName: apt.patient?.fullName || null,
      patientAvatar: apt.patient?.profilePhoto || null,
      doctorId: apt.doctorId,
      doctorName: apt.doctor?.fullName || null,
      doctorSpecialty: apt.doctor?.specialization || null,
      doctorAvatar: apt.doctor?.profilePhoto || null,
      hospital: apt.doctor?.clinic?.name || null,
      location: apt.doctor?.clinic?.address || null,
      date: apt.date,
      time: apt.startTime,
      startTime: apt.startTime,
      endTime: apt.endTime,
      tokenNumber,
      status: (apt.status || 'CONFIRMED').toLowerCase(),
      consultationType: apt.consultationType,
      mode: (apt.consultationType || 'clinic').toLowerCase(),
      fee: apt.fee,
      symptoms: apt.symptoms || [],
      notes: apt.notes,
      createdAt: apt.createdAt,
      updatedAt: apt.updatedAt,
      hasConsultation: Boolean(apt.consultation),
    };
  }

  async createAppointment(
    dto: {
      patientId: string;
      doctorId: string;
      date: string;
      startTime: string;
      endTime: string;
      consultationType?: ConsultationType;
      fee?: number;
      symptoms?: string[];
      notes?: string;
    },
    currentUser?: any
  ) {
    if (!dto.date || !dto.startTime) {
      throw new BadRequestException('Appointment date and start time are required.');
    }

    // Normalize startTime to HH:mm (supporting 12h AM/PM as well)
    let normalizedStart = dto.startTime.trim();
    const match12 = normalizedStart.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
    if (match12 && match12[3]) {
      let h = Number(match12[1]);
      const m = match12[2];
      const meridiem = match12[3].toUpperCase();
      if (meridiem === 'PM' && h !== 12) h += 12;
      if (meridiem === 'AM' && h === 12) h = 0;
      normalizedStart = `${String(h).padStart(2, '0')}:${m}`;
    }
    dto.startTime = normalizedStart.length === 5 ? normalizedStart : normalizedStart.slice(0, 5);

    // Validate date and time format
    const parsedStart = new Date(`${dto.date}T${dto.startTime}:00`);
    if (isNaN(parsedStart.getTime())) {
      throw new BadRequestException('Invalid date or start time format. Use YYYY-MM-DD and HH:mm.');
    }
    const now = new Date();
    const todayIso = now.toISOString().slice(0, 10);
    const localYear = now.getFullYear();
    const localMonth = String(now.getMonth() + 1).padStart(2, '0');
    const localDay = String(now.getDate()).padStart(2, '0');
    const todayLocal = `${localYear}-${localMonth}-${localDay}`;
    const isToday = dto.date === todayIso || dto.date === todayLocal;

    // Reject bookings for past dates
    if (dto.date < todayLocal && dto.date < todayIso) {
      throw new BadRequestException('Appointment date cannot be in the past.');
    }

    // If booking for today, slot timing must be at least 15 minutes in the future
    if (isToday) {
      const [startH, startM] = dto.startTime.split(':').map(Number);
      const slotMinutes = startH * 60 + startM;
      const currentMinutes = now.getHours() * 60 + now.getMinutes();
      if (slotMinutes - currentMinutes < 15) {
        throw new BadRequestException(
          'This slot is no longer available. Appointments must be booked at least 15 minutes before the slot starts.'
        );
      }
    }

    return this.prisma.$transaction(async (tx) => {
      // Fetch doctor to authoritatively determine consultation fee and verify existence
      const doctor = await tx.doctor.findFirst({
        where: {
          OR: [
            { id: dto.doctorId },
            { userId: dto.doctorId },
          ],
        },
        include: { clinic: true, availabilities: true, verification: true },
      });
      if (!doctor) {
        throw new NotFoundException('Selected doctor does not exist.');
      }
      dto.doctorId = doctor.id;

      // Ensure doctor is active/verified before accepting patient bookings
      const isVerified = doctor.verification?.status === 'VERIFIED';
      const isPendingOrRegistered = !doctor.verification || ['PENDING', 'REGISTERED'].includes(doctor.verification?.status);
      if (!isVerified && !isPendingOrRegistered) {
        throw new BadRequestException('Doctor profile is inactive or suspended.');
      }

      // Verify consultation fee is authoritatively configured on doctor profile (fallback to 500 default)
      let authoritativeFee = Number(doctor.consultationFee);
      if (isNaN(authoritativeFee) || authoritativeFee <= 0) {
        authoritativeFee = 500;
      }

      // Validate consultation type is supported by doctor
      const authoritativeConsultationType = dto.consultationType || ConsultationType.CLINIC;

      // Verify patient exists or auto-upsert patient profile for authenticated user
      let patient = await tx.patient.findFirst({
        where: {
          OR: [
            { id: dto.patientId },
            { userId: dto.patientId },
            ...(currentUser?.id ? [{ userId: currentUser.id }, { id: currentUser.id }] : []),
          ],
        },
      });

      if (!patient && currentUser?.id) {
        // Auto-create patient record for active user
        const patientName = currentUser.name || currentUser.fullName || currentUser.email?.split('@')[0] || 'Patient';
        patient = await tx.patient.create({
          data: {
            userId: currentUser.id,
            fullName: patientName,
            onboardingComplete: true,
          },
        });
      }

      if (!patient) {
        throw new NotFoundException('Patient record not found. Please complete profile setup.');
      }
      dto.patientId = patient.id;

      // Derive authoritative slot duration and end time
      let slotDuration = 30;

      // Check doctor availability rules if configured
      if (doctor.availabilities && doctor.availabilities.length > 0) {
        const appointmentDayOfWeek = parsedStart.getDay(); // 0 = Sun, 1 = Mon ...
        const matchingDayAvailabilities = doctor.availabilities.filter(
          (a) => a.dayOfWeek === appointmentDayOfWeek
        );

        if (matchingDayAvailabilities.length > 0) {
          const slotStartNorm = dto.startTime.slice(0, 5);
          const matchedSlot = matchingDayAvailabilities.find((avail) => {
            const availStartNorm = avail.startTime.slice(0, 5);
            const availEndNorm = avail.endTime.slice(0, 5);
            return slotStartNorm >= availStartNorm && slotStartNorm < availEndNorm;
          });

          if (matchedSlot) {
            slotDuration = matchedSlot.slotDurationMinutes || 30;
          }
        }
      }

      // Authoritatively compute endTime from startTime + slotDuration
      const [startH, startM] = dto.startTime.slice(0, 5).split(':').map(Number);
      const totalMinutes = startH * 60 + startM + slotDuration;
      const endH = Math.floor(totalMinutes / 60);
      const endM = totalMinutes % 60;
      const authoritativeEndTime = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;

      // Transactional check for double-booking
      const existing = await tx.appointment.findFirst({
        where: {
          doctorId: dto.doctorId,
          date: dto.date,
          startTime: dto.startTime,
          status: { in: [AppointmentStatus.CONFIRMED, AppointmentStatus.PENDING] },
        },
      });

      if (existing) {
        throw new BadRequestException('This slot is already booked. Please choose another time.');
      }

      // Concurrency-safe atomic token sequence allocation via DailyDoctorToken
      const tokenRecord = await tx.dailyDoctorToken.upsert({
        where: {
          doctorId_date: {
            doctorId: dto.doctorId,
            date: dto.date,
          },
        },
        create: {
          doctorId: dto.doctorId,
          date: dto.date,
          lastToken: 1,
        },
        update: {
          lastToken: { increment: 1 },
        },
      });

      const nextTokenNum = tokenRecord.lastToken;
      const allocatedToken = `Token #${String(nextTokenNum).padStart(2, '0')}`;
      const canonicalNotes = dto.notes
        ? `${dto.notes.trim()} [${allocatedToken}]`
        : `[${allocatedToken}]`;

      let appointment;
      try {
        appointment = await tx.appointment.create({
          data: {
            patientId: dto.patientId,
            doctorId: dto.doctorId,
            date: dto.date,
            startTime: dto.startTime.slice(0, 5),
            endTime: authoritativeEndTime,
            consultationType: authoritativeConsultationType,
            fee: authoritativeFee,
            symptoms: dto.symptoms || [],
            notes: canonicalNotes,
            status: AppointmentStatus.PENDING,
          },
          include: {
            doctor: { include: { clinic: true } },
            patient: true,
          },
        });
      } catch (err: any) {
        // Intercept DB-level unique constraint violation (P2002) for race condition protection
        if (err?.code === 'P2002') {
          throw new BadRequestException('This slot is already booked. Please choose another time.');
        }
        throw err;
      }

      // Audit log entry
      if (currentUser?.id) {
        await tx.auditLog.create({
          data: {
            actorUserId: currentUser.id,
            action: 'APPOINTMENT_CREATED',
            targetType: 'APPOINTMENT',
            targetId: appointment.id,
            metadata: {
              doctorId: dto.doctorId,
              patientId: dto.patientId,
              date: dto.date,
              startTime: dto.startTime,
              token: allocatedToken,
            },
          },
        });
      }

      // Trigger notification for both patient and doctor — non-fatal
      // If this fails (e.g. missing userId), the appointment is still saved
      try {
        const notifData: any[] = [];
        if (patient.userId) {
          notifData.push({
            userId: patient.userId,
            type: 'APPOINTMENT_QUEUED',
            title: 'Appointment Slot Queued',
            message: `Your slot request with ${appointment.doctor.fullName} on ${dto.date} at ${dto.startTime} is awaiting doctor approval.`,
          });
        }
        if (appointment.doctor.userId) {
          notifData.push({
            userId: appointment.doctor.userId,
            type: 'NEW_BOOKING_REQUEST',
            title: 'New Patient Slot Request',
            message: `${appointment.patient.fullName} requested ${dto.startTime} on ${dto.date}. Review and approve.`,
          });
        }
        if (notifData.length > 0) {
          await tx.notification.createMany({ data: notifData });
        }
      } catch (notifErr: any) {
        console.warn('[appointments] Notification insert failed (non-fatal):', notifErr?.message);
      }

      return this.formatAppointment(appointment);
    });
  }

  async getPatientAppointments(patientId: string, currentUser: any) {
    // Resolve the canonical Patient.id to query with
    // patientId from client = User.id (auth user UUID), not Patient row UUID
    let resolvedPatientId: string | null = currentUser.patient?.id || null;

    // If the JWT-loaded patient relation is missing, do a fresh DB lookup by userId
    if (!resolvedPatientId) {
      const patientRecord = await this.prisma.patient.findFirst({
        where: {
          OR: [
            { id: patientId },
            { userId: patientId },
            ...(currentUser?.id && currentUser.id !== patientId ? [{ userId: currentUser.id }] : []),
          ],
        },
      });
      resolvedPatientId = patientRecord?.id || null;
    }

    if (!resolvedPatientId) {
      // No patient record yet — return empty list rather than throwing
      return [];
    }

    const appointments = await this.prisma.appointment.findMany({
      where: { patientId: resolvedPatientId },
      include: { doctor: { include: { clinic: true } }, patient: true, consultation: true },
      orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
    });

    return appointments.map((a) => this.formatAppointment(a));
  }

  async getDoctorAppointments(doctorId: string, currentUser: any) {
    const doctorRecord = currentUser?.doctor || (await this.prisma.doctor.findFirst({
      where: {
        OR: [
          { id: doctorId },
          { userId: doctorId },
          ...(currentUser?.id ? [{ userId: currentUser.id }, { id: currentUser.id }] : []),
        ],
      },
    }));

    const possibleDoctorIds = Array.from(
      new Set(
        [
          doctorId,
          currentUser?.id,
          doctorRecord?.id,
          doctorRecord?.userId,
        ].filter(Boolean) as string[]
      )
    );

    const appointments = await this.prisma.appointment.findMany({
      where: {
        doctorId: { in: possibleDoctorIds },
      },
      include: { patient: true, doctor: { include: { clinic: true } }, consultation: true },
      orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
    });

    return appointments.map((a) => this.formatAppointment(a));
  }

  async getAppointmentById(id: string, currentUser: any) {
    const apt = await this.prisma.appointment.findUnique({
      where: { id },
      include: { doctor: { include: { clinic: true } }, patient: true, consultation: true },
    });
    if (!apt) throw new NotFoundException('Appointment not found.');

    this.checkAppointmentActorAccess(apt, currentUser);

    return this.formatAppointment(apt);
  }

  async cancelAppointment(id: string, currentUser: any) {
    return this.prisma.$transaction(async (tx) => {
      const apt = await tx.appointment.findUnique({
        where: { id },
        include: { doctor: { include: { clinic: true } }, patient: true },
      });
      if (!apt) throw new NotFoundException('Appointment not found.');

      this.checkAppointmentActorAccess(apt, currentUser);

      // Validate state transition for cancellation
      const cancellableStatuses: AppointmentStatus[] = [
        AppointmentStatus.PENDING,
        AppointmentStatus.CONFIRMED,
      ];
      if (!cancellableStatuses.includes(apt.status)) {
        throw new BadRequestException(
          `Cannot cancel appointment in '${apt.status}' state. Only pending or confirmed appointments can be cancelled.`
        );
      }

      // Atomic conditional update to prevent race conditions
      const updateResult = await tx.appointment.updateMany({
        where: {
          id,
          status: { in: cancellableStatuses },
        },
        data: { status: AppointmentStatus.CANCELLED },
      });

      if (updateResult.count === 0) {
        throw new BadRequestException('Appointment state changed concurrently. Cancellation aborted.');
      }

      const updated = await tx.appointment.findUnique({
        where: { id },
        include: { doctor: { include: { clinic: true } }, patient: true },
      });

      // Audit log entry
      if (currentUser?.id) {
        await tx.auditLog.create({
          data: {
            actorUserId: currentUser.id,
            action: 'APPOINTMENT_CANCELLED',
            targetType: 'APPOINTMENT',
            targetId: id,
            metadata: {
              previousStatus: apt.status,
              newStatus: AppointmentStatus.CANCELLED,
            },
          },
        });
      }

      // Notify the other party
      const isCancelledByPatient = currentUser.patient?.id === apt.patientId;
      const recipientUserId = isCancelledByPatient ? apt.doctor.userId : apt.patient.userId;
      const cancelledByName = isCancelledByPatient ? apt.patient.fullName : `Dr. ${apt.doctor.fullName}`;

      if (recipientUserId) {
        await tx.notification.create({
          data: {
            userId: recipientUserId,
            type: 'APPOINTMENT_CANCELLED',
            title: 'Appointment Cancelled',
            message: `The appointment for ${apt.date} at ${apt.startTime} was cancelled by ${cancelledByName}.`,
          },
        });
      }

      return this.formatAppointment(updated);
    });
  }

  async updateAppointmentStatus(id: string, targetStatus: AppointmentStatus, currentUser: any) {
    return this.prisma.$transaction(async (tx) => {
      const apt = await tx.appointment.findUnique({
        where: { id },
        include: { doctor: { include: { clinic: true } }, patient: true },
      });
      if (!apt) throw new NotFoundException('Appointment not found.');

      this.checkAppointmentActorAccess(apt, currentUser);

      // State machine validation
      const allowedTransitions: Record<AppointmentStatus, AppointmentStatus[]> = {
        [AppointmentStatus.PENDING]: [AppointmentStatus.CONFIRMED, AppointmentStatus.CANCELLED],
        [AppointmentStatus.CONFIRMED]: [
          AppointmentStatus.COMPLETED,
          AppointmentStatus.CANCELLED,
          AppointmentStatus.NO_SHOW,
        ],
        [AppointmentStatus.COMPLETED]: [],
        [AppointmentStatus.CANCELLED]: [],
        [AppointmentStatus.NO_SHOW]: [],
      };

      const validNextStates = allowedTransitions[apt.status] || [];
      if (!validNextStates.includes(targetStatus)) {
        throw new BadRequestException(
          `Invalid status transition from '${apt.status}' to '${targetStatus}'.`
        );
      }

      // Role-specific constraints on transitions
      if (targetStatus === AppointmentStatus.CONFIRMED) {
        const isDoctor = currentUser.role === Role.DOCTOR && currentUser.doctor?.id === apt.doctorId;
        const isAdmin = currentUser.role === Role.ADMIN;
        if (!isDoctor && !isAdmin) {
          throw new ForbiddenException('Only the assigned doctor or admin can confirm/approve an appointment.');
        }
      }

      if (targetStatus === AppointmentStatus.COMPLETED || targetStatus === AppointmentStatus.NO_SHOW) {
        const isDoctor = currentUser.role === Role.DOCTOR && currentUser.doctor?.id === apt.doctorId;
        const isAdmin = currentUser.role === Role.ADMIN;
        if (!isDoctor && !isAdmin) {
          throw new ForbiddenException('Only the assigned doctor or admin can complete or mark no-show for an appointment.');
        }
      }

      // Atomic conditional update
      const updateResult = await tx.appointment.updateMany({
        where: {
          id,
          status: apt.status,
        },
        data: { status: targetStatus },
      });

      if (updateResult.count === 0) {
        throw new BadRequestException('Appointment state changed concurrently. Update aborted.');
      }

      const updated = await tx.appointment.findUnique({
        where: { id },
        include: { doctor: { include: { clinic: true } }, patient: true, consultation: true },
      });

      // Audit log entry
      if (currentUser?.id) {
        await tx.auditLog.create({
          data: {
            actorUserId: currentUser.id,
            action: `APPOINTMENT_STATUS_${targetStatus}`,
            targetType: 'APPOINTMENT',
            targetId: id,
            metadata: {
              previousStatus: apt.status,
              newStatus: targetStatus,
            },
          },
        });
      }

      if (targetStatus === AppointmentStatus.CONFIRMED && apt.patient?.userId) {
        await tx.notification.create({
          data: {
            userId: apt.patient.userId,
            type: 'APPOINTMENT_APPROVED',
            title: 'Appointment Approved by Doctor',
            message: `Dr. ${apt.doctor.fullName} approved your appointment for ${apt.date} at ${apt.startTime}.`,
          },
        });
      }

      return this.formatAppointment(updated);
    });
  }

  private checkAppointmentActorAccess(apt: any, currentUser: any) {
    if (!currentUser) {
      throw new ForbiddenException('Authentication required.');
    }
    if (currentUser.role === Role.ADMIN) {
      return;
    }

    const isPatientOwner = currentUser.patient && currentUser.patient.id === apt.patientId;
    const isDoctorOwner = currentUser.doctor && currentUser.doctor.id === apt.doctorId;

    if (!isPatientOwner && !isDoctorOwner) {
      throw new ForbiddenException('You do not have permission to view or manage this appointment.');
    }
  }
}
