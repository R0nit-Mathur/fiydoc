import { Injectable, BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AppointmentStatus, ConsultationType, Role } from '@prisma/client';

@Injectable()
export class AppointmentsService {
  constructor(private prisma: PrismaService) {}

  private formatAppointment(apt: any) {
    if (!apt) return null;
    const tokenMatch = apt.notes?.match(/\[(Token\s*#\d+)\]/) || apt.notes?.match(/(Token\s*#\d+)/);
    const tokenNumber = tokenMatch ? tokenMatch[1] : (apt.tokenNumber || 'Token #01');

    return {
      ...apt,
      id: apt.id,
      patientId: apt.patientId,
      patientName: apt.patient?.fullName || 'Patient',
      patientAvatar: apt.patient?.profilePhoto || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&q=80',
      doctorId: apt.doctorId,
      doctorName: apt.doctor?.fullName || 'Dr. Specialist',
      doctorSpecialty: apt.doctor?.specialization || 'Consultant',
      doctorAvatar: apt.doctor?.profilePhoto || 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&q=80',
      hospital: apt.doctor?.clinic?.name || 'FiYDoc Healthcare Clinic',
      location: apt.doctor?.clinic?.address || 'Medical Enclave, Mumbai',
      date: apt.date,
      time: apt.startTime,
      tokenNumber,
      status: (apt.status || 'CONFIRMED').toLowerCase(),
      mode: 'clinic',
      fee: apt.fee,
      symptoms: apt.symptoms || [],
      notes: apt.notes,
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

    // Validate that appointment date/time is strictly in the future
    // Support date "YYYY-MM-DD" and startTime "HH:mm" or "HH:mm:ss"
    const parsedStart = new Date(`${dto.date}T${dto.startTime.length === 5 ? dto.startTime + ':00' : dto.startTime}`);
    if (isNaN(parsedStart.getTime())) {
      throw new BadRequestException('Invalid date or start time format. Use YYYY-MM-DD and HH:mm.');
    }
    const now = new Date();
    if (parsedStart.getTime() <= now.getTime()) {
      throw new BadRequestException('Appointment slot must be strictly in the future.');
    }

    return this.prisma.$transaction(async (tx) => {
      // Fetch doctor to authoritatively determine consultation fee and verify existence
      const doctor = await tx.doctor.findUnique({
        where: { id: dto.doctorId },
        include: { clinic: true, availabilities: true },
      });
      if (!doctor) {
        throw new NotFoundException('Selected doctor does not exist.');
      }

      // Verify patient exists
      const patient = await tx.patient.findUnique({
        where: { id: dto.patientId },
      });
      if (!patient) {
        throw new NotFoundException('Patient record not found.');
      }

      // Check doctor availability rules if configured
      if (doctor.availabilities && doctor.availabilities.length > 0) {
        const appointmentDayOfWeek = parsedStart.getDay(); // 0 = Sun, 1 = Mon ...
        const matchingDayAvailabilities = doctor.availabilities.filter(
          (a) => a.dayOfWeek === appointmentDayOfWeek
        );

        if (matchingDayAvailabilities.length > 0) {
          const slotStartNorm = dto.startTime.slice(0, 5);
          const isWithinSlot = matchingDayAvailabilities.some((avail) => {
            const availStartNorm = avail.startTime.slice(0, 5);
            const availEndNorm = avail.endTime.slice(0, 5);
            return slotStartNorm >= availStartNorm && slotStartNorm < availEndNorm;
          });

          if (!isWithinSlot) {
            throw new BadRequestException(
              `The requested time ${dto.startTime} is outside the doctor's scheduled availability for this day.`
            );
          }
        }
      }

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

      // Derive highest existing token sequence for this doctor and date
      const dayAppointments = await tx.appointment.findMany({
        where: {
          doctorId: dto.doctorId,
          date: dto.date,
        },
        select: { notes: true },
      });

      let maxTokenNum = 0;
      for (const apt of dayAppointments) {
        const match = apt.notes?.match(/Token\s*#(\d+)/i);
        if (match && match[1]) {
          const num = parseInt(match[1], 10);
          if (num > maxTokenNum) maxTokenNum = num;
        }
      }
      if (maxTokenNum === 0) {
        maxTokenNum = dayAppointments.length;
      }

      const nextTokenNum = maxTokenNum + 1;
      const allocatedToken = `Token #${String(nextTokenNum).padStart(2, '0')}`;
      const canonicalNotes = dto.notes
        ? `${dto.notes.trim()} [${allocatedToken}]`
        : `[${allocatedToken}]`;

      // Server-authoritative fee from doctor record
      const authoritativeFee = doctor.consultationFee ?? 800;
      const authoritativeConsultationType = dto.consultationType || ConsultationType.CLINIC;

      const appointment = await tx.appointment.create({
        data: {
          patientId: dto.patientId,
          doctorId: dto.doctorId,
          date: dto.date,
          startTime: dto.startTime,
          endTime: dto.endTime,
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
