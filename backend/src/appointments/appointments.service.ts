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
    // Allow same-day walk-in OPD reservations with a 12-hour grace buffer
    const sameDayBufferMs = 12 * 60 * 60 * 1000;
    if (parsedStart.getTime() + sameDayBufferMs < now.getTime()) {
      throw new BadRequestException('Appointment slot cannot be in the past.');
    }

    return this.prisma.$transaction(async (tx) => {
      // Fetch doctor to authoritatively determine consultation fee and verify existence
      const doctor = await tx.doctor.findUnique({
        where: { id: dto.doctorId },
        include: { clinic: true, availabilities: true, verification: true },
      });
      if (!doctor) {
        throw new NotFoundException('Selected doctor does not exist.');
      }

      // Ensure doctor is verified before accepting patient bookings
      if (doctor.verification?.status !== 'VERIFIED') {
        throw new BadRequestException('Appointments can only be booked with verified healthcare providers.');
      }

      // Verify consultation fee is authoritatively configured on doctor profile
      const rawFee = Number(doctor.consultationFee);
      if (isNaN(rawFee) || rawFee <= 0) {
        throw new BadRequestException('Selected doctor has not set an authoritative consultation fee.');
      }
      const authoritativeFee = rawFee;

      // Validate consultation type is supported by doctor
      const authoritativeConsultationType = dto.consultationType || ConsultationType.CLINIC;
      const doctorModes = doctor.consultationModes || [ConsultationType.CLINIC];
      if (!doctorModes.includes(authoritativeConsultationType)) {
        throw new BadRequestException(
          `Doctor does not support '${authoritativeConsultationType}' consultation mode.`
        );
      }

      // Verify patient exists
      const patient = await tx.patient.findUnique({
        where: { id: dto.patientId },
      });
      if (!patient) {
        throw new NotFoundException('Patient record not found.');
      }

      // Derive authoritative slot duration and end time
      let slotDuration = 30;

      // Check doctor availability rules if configured
      if (doctor.availabilities && doctor.availabilities.length > 0) {
        const appointmentDayOfWeek = parsedStart.getDay(); // 0 = Sun, 1 = Mon ...
        const matchingDayAvailabilities = doctor.availabilities.filter(
          (a) => a.dayOfWeek === appointmentDayOfWeek
        );

        if (matchingDayAvailabilities.length === 0) {
          throw new BadRequestException(
            `Doctor does not have scheduled availability for the selected day of week.`
          );
        }

        const slotStartNorm = dto.startTime.slice(0, 5);
        const matchedSlot = matchingDayAvailabilities.find((avail) => {
          const availStartNorm = avail.startTime.slice(0, 5);
          const availEndNorm = avail.endTime.slice(0, 5);
          if (slotStartNorm < availStartNorm || slotStartNorm >= availEndNorm) {
            return false;
          }
          // Check alignment with slotDurationMinutes
          const duration = avail.slotDurationMinutes || 30;
          const [startH, startM] = availStartNorm.split(':').map(Number);
          const [reqH, reqM] = slotStartNorm.split(':').map(Number);
          const diffMinutes = (reqH * 60 + reqM) - (startH * 60 + startM);
          return diffMinutes % duration === 0;
        });

        if (!matchedSlot) {
          throw new BadRequestException(
            `The requested time ${dto.startTime} is outside the doctor's scheduled availability intervals for this day.`
          );
        }
        slotDuration = matchedSlot.slotDurationMinutes || 30;
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

      // Trigger notification for both patient and doctor
      await tx.notification.createMany({
        data: [
          {
            userId: patient.userId,
            type: 'APPOINTMENT_QUEUED',
            title: 'Appointment Slot Queued',
            message: `Your slot request with ${appointment.doctor.fullName} on ${dto.date} at ${dto.startTime} is awaiting doctor approval.`,
          },
          {
            userId: appointment.doctor.userId,
            type: 'NEW_BOOKING_REQUEST',
            title: 'New Patient Slot Request',
            message: `${appointment.patient.fullName} requested ${dto.startTime} on ${dto.date}. Review and approve.`,
          },
        ],
      });

      return this.formatAppointment(appointment);
    });
  }

  async getPatientAppointments(patientId: string, currentUser: any) {
    const targetPatientId =
      patientId === 'me' || patientId === currentUser.id || !patientId
        ? currentUser.patient?.id
        : patientId;

    if (currentUser.role === Role.PATIENT) {
      if (currentUser.patient?.id !== targetPatientId && currentUser.id !== targetPatientId) {
        throw new ForbiddenException('Cannot access another patient’s appointments.');
      }
    }

    const queryId = currentUser.patient?.id || targetPatientId;

    const appointments = await this.prisma.appointment.findMany({
      where: { patientId: queryId },
      include: { doctor: { include: { clinic: true } }, patient: true, consultation: true },
      orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
    });

    return appointments.map((a) => this.formatAppointment(a));
  }

  async getDoctorAppointments(doctorId: string, currentUser: any) {
    const targetDoctorId =
      doctorId === 'me' || doctorId === currentUser.id || !doctorId
        ? currentUser.doctor?.id
        : doctorId;

    if (currentUser.role === Role.DOCTOR) {
      if (currentUser.doctor?.id !== targetDoctorId && currentUser.id !== targetDoctorId) {
        throw new ForbiddenException('Cannot access another doctor’s queue.');
      }
    }

    const queryId = currentUser.doctor?.id || targetDoctorId;

    const appointments = await this.prisma.appointment.findMany({
      where: { doctorId: queryId },
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
