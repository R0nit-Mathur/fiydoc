import { Injectable, BadRequestException, ForbiddenException, NotFoundException, HttpException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AppointmentStatus, ConsultationType, Role } from '@prisma/client';

@Injectable()
export class AppointmentsService {
  constructor(private prisma: PrismaService) {}

  private calculateShiftedTime(timeStr: string, minutes: number): string {
    if (!timeStr) return '';
    const match = timeStr.match(/^(\d{1,2}):(\d{2})/);
    if (!match) return timeStr;
    const h = parseInt(match[1], 10);
    const m = parseInt(match[2], 10);
    const total = h * 60 + m + minutes;
    const wrapped = ((total % 1440) + 1440) % 1440;
    const newH = Math.floor(wrapped / 60);
    const newM = wrapped % 60;
    const meridian = newH >= 12 ? 'PM' : 'AM';
    const displayH = newH > 12 ? newH - 12 : newH === 0 ? 12 : newH;
    return `${String(displayH).padStart(2, '0')}:${String(newM).padStart(2, '0')} ${meridian}`;
  }

  private formatAppointment(apt: any) {
    if (!apt) return null;
    const tokenMatch = apt.notes?.match(/\[(Token\s*#\d+)\]/) || apt.notes?.match(/(Token\s*#\d+)/);
    const tokenNumber = tokenMatch ? tokenMatch[1] : (apt.tokenNumber || null);

    const delayMatch = apt.notes?.match(/\[(?:Delayed|Postponed):\s*\+?(\d+)m?(?:\.\s*Reason:\s*([^\]]+))?\]/i);
    const delayMinutes = delayMatch ? parseInt(delayMatch[1], 10) : 0;
    const delayReason = delayMatch && delayMatch[2] ? delayMatch[2].trim() : null;

    const leaveMatch = apt.notes?.match(/\[Cancelled:\s*Doctor on leave(?:\s*-\s*([^\]]+))?\]/i);
    const isDoctorOnLeave = Boolean(leaveMatch);
    const leaveReason = leaveMatch && leaveMatch[1] ? leaveMatch[1].trim() : null;

    const expectedTime = delayMinutes > 0 ? this.calculateShiftedTime(apt.startTime, delayMinutes) : apt.startTime;

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
      expectedTime,
      delayMinutes,
      delayReason,
      isDoctorOnLeave,
      cancelReason: isDoctorOnLeave ? `Doctor on leave: ${leaveReason || 'Clinic closed'}` : null,
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

    // Fetch doctor to authoritatively determine consultation fee and verify existence
    const doctor = await this.prisma.doctor.findFirst({
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
    let patient = await this.prisma.patient.findFirst({
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
      patient = await this.prisma.patient.create({
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

    // Concurrency-safe atomic token sequence allocation via DailyDoctorToken (non-fatal, outside tx)
    let allocatedToken = `Token #01`;
    try {
      const tokenRecord = await this.prisma.dailyDoctorToken.upsert({
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
      allocatedToken = `Token #${String(tokenRecord.lastToken).padStart(2, '0')}`;
    } catch (tokenErr: any) {
      console.warn('[appointments] DailyDoctorToken upsert failed (non-fatal):', tokenErr?.message);
      allocatedToken = `Token #${String((Math.floor(Date.now() / 1000) % 99) + 1).padStart(2, '0')}`;
    }

    const canonicalNotes = dto.notes
      ? `${dto.notes.trim()} [${allocatedToken}]`
      : `[${allocatedToken}]`;

    // Lean transactional check for double-booking and creation
    let createdApt;
    try {
      createdApt = await this.prisma.$transaction(async (tx) => {
        const existing = await tx.appointment.findFirst({
          where: {
            doctorId: dto.doctorId,
            date: dto.date,
            startTime: dto.startTime.slice(0, 5),
            status: { in: [AppointmentStatus.CONFIRMED, AppointmentStatus.PENDING] },
          },
        });

        if (existing) {
          throw new BadRequestException('This slot is already booked. Please choose another time.');
        }

        return tx.appointment.create({
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
      });
    } catch (err: any) {
      if (err?.code === 'P2002') {
        throw new BadRequestException('This slot is already booked. Please choose another time.');
      }
      throw err;
    }

    // Audit log entry — non-fatal (outside tx)
    if (currentUser?.id) {
      try {
        await this.prisma.auditLog.create({
          data: {
            actorUserId: currentUser.id,
            action: 'APPOINTMENT_CREATED',
            targetType: 'APPOINTMENT',
            targetId: createdApt.id,
            metadata: {
              doctorId: dto.doctorId,
              patientId: dto.patientId,
              date: dto.date,
              startTime: dto.startTime,
              token: allocatedToken,
            },
          },
        });
      } catch (auditErr: any) {
        console.warn('[appointments] AuditLog insert failed (non-fatal):', auditErr?.message);
      }
    }

    // Trigger notification for both patient and doctor — non-fatal (outside tx)
    try {
      const notifData: any[] = [];
      if (patient?.userId) {
        notifData.push({
          userId: patient.userId,
          type: 'APPOINTMENT_QUEUED',
          title: 'Appointment Slot Queued',
          message: `Your slot request with ${createdApt.doctor.fullName} on ${dto.date} at ${dto.startTime} is awaiting doctor approval.`,
        });
      }
      if (createdApt.doctor?.userId) {
        notifData.push({
          userId: createdApt.doctor.userId,
          type: 'NEW_BOOKING_REQUEST',
          title: 'New Patient Slot Request',
          message: `${createdApt.patient.fullName} requested ${dto.startTime} on ${dto.date}. Review and approve.`,
        });
      }
      if (notifData.length > 0) {
        await this.prisma.notification.createMany({ data: notifData });
      }
    } catch (notifErr: any) {
      console.warn('[appointments] Notification insert failed (non-fatal):', notifErr?.message);
    }

    return this.formatAppointment(createdApt);
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
    try {
      const apt = await this.prisma.appointment.findUnique({
        where: { id },
        include: { doctor: { include: { clinic: true } }, patient: true, consultation: true },
      });
      if (!apt) throw new NotFoundException('Appointment not found.');

      this.checkAppointmentActorAccess(apt, currentUser);

      // Validate state transition for cancellation
      const cancellableStatuses: string[] = ['PENDING', 'CONFIRMED'];
      if (!cancellableStatuses.includes(String(apt.status).toUpperCase())) {
        throw new BadRequestException(
          `Cannot cancel appointment in '${apt.status}' state. Only pending or confirmed appointments can be cancelled.`
        );
      }

      const updated = await this.prisma.appointment.update({
        where: { id },
        data: { status: AppointmentStatus.CANCELLED },
        include: { doctor: { include: { clinic: true } }, patient: true, consultation: true },
      });

      // Audit log entry (non-fatal)
      if (currentUser?.id) {
        try {
          await this.prisma.auditLog.create({
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
        } catch (auditErr: any) {
          console.warn('[appointments] AuditLog insert failed (non-fatal):', auditErr?.message);
        }
      }

      // Notify the other party (non-fatal)
      try {
        const isCancelledByPatient =
          (currentUser.patient && currentUser.patient.id === updated.patientId) ||
          (updated.patient && updated.patient.userId === currentUser.id);
        const recipientUserId = isCancelledByPatient ? updated.doctor?.userId : updated.patient?.userId;
        const cancelledByName = isCancelledByPatient ? updated.patient?.fullName || 'Patient' : `Dr. ${updated.doctor?.fullName || 'Doctor'}`;

        if (recipientUserId) {
          await this.prisma.notification.create({
            data: {
              userId: recipientUserId,
              type: 'APPOINTMENT_CANCELLED',
              title: 'Appointment Cancelled',
              message: `The appointment for ${updated.date} at ${updated.startTime} was cancelled by ${cancelledByName}.`,
            },
          });
        }
      } catch (notifErr: any) {
        console.warn('[appointments] Notification creation failed (non-fatal):', notifErr?.message);
      }

      return this.formatAppointment(updated);
    } catch (err: any) {
      if (err instanceof HttpException) throw err;
      console.error('[appointments] cancelAppointment unhandled error:', err);
      throw new BadRequestException(err?.message || 'Failed to cancel appointment');
    }
  }

  async updateAppointmentStatus(id: string, targetStatus: AppointmentStatus | string, currentUser: any) {
    try {
      const normalizedStatus = String(targetStatus).toUpperCase() as AppointmentStatus;

      const apt = await this.prisma.appointment.findUnique({
        where: { id },
        include: { doctor: { include: { clinic: true } }, patient: true, consultation: true },
      });
      if (!apt) throw new NotFoundException('Appointment not found.');

      this.checkAppointmentActorAccess(apt, currentUser);

      // State machine validation
      const allowedTransitions: Record<string, string[]> = {
        PENDING: ['CONFIRMED', 'CANCELLED'],
        CONFIRMED: ['COMPLETED', 'CANCELLED', 'NO_SHOW'],
        COMPLETED: [],
        CANCELLED: [],
        NO_SHOW: [],
      };

      const currentStatusStr = String(apt.status).toUpperCase();
      const validNextStates = allowedTransitions[currentStatusStr] || [];
      if (!validNextStates.includes(normalizedStatus)) {
        throw new BadRequestException(
          `Invalid status transition from '${apt.status}' to '${normalizedStatus}'.`
        );
      }

      // Role-specific constraints on transitions
      if (normalizedStatus === AppointmentStatus.CONFIRMED || normalizedStatus === AppointmentStatus.COMPLETED || normalizedStatus === AppointmentStatus.NO_SHOW) {
        const isDoctor =
          currentUser.role === Role.DOCTOR &&
          ((currentUser.doctor && currentUser.doctor.id === apt.doctorId) ||
            apt.doctor?.userId === currentUser.id ||
            apt.doctorId === currentUser.id);
        const isAdmin = currentUser.role === Role.ADMIN;
        if (!isDoctor && !isAdmin) {
          throw new ForbiddenException('Only the assigned doctor or admin can modify this appointment status.');
        }
      }

      const updated = await this.prisma.appointment.update({
        where: { id },
        data: { status: normalizedStatus },
        include: { doctor: { include: { clinic: true } }, patient: true, consultation: true },
      });

      // Audit log entry (non-fatal)
      if (currentUser?.id) {
        try {
          await this.prisma.auditLog.create({
            data: {
              actorUserId: currentUser.id,
              action: 'APPOINTMENT_STATUS_UPDATED',
              targetType: 'APPOINTMENT',
              targetId: id,
              metadata: {
                previousStatus: apt.status,
                newStatus: normalizedStatus,
              },
            },
          });
        } catch (auditErr: any) {
          console.warn('[appointments] AuditLog insert failed (non-fatal):', auditErr?.message);
        }
      }

      // Notify patient on confirmation (non-fatal)
      if (normalizedStatus === AppointmentStatus.CONFIRMED && updated.patient?.userId) {
        try {
          await this.prisma.notification.create({
            data: {
              userId: updated.patient.userId,
              type: 'APPOINTMENT_APPROVED',
              title: 'Appointment Approved by Doctor',
              message: `Dr. ${updated.doctor?.fullName || 'Doctor'} approved your appointment for ${updated.date} at ${updated.startTime}.`,
            },
          });
        } catch (notifErr: any) {
          console.warn('[appointments] Notification creation failed (non-fatal):', notifErr?.message);
        }
      }

      return this.formatAppointment(updated);
    } catch (err: any) {
      if (err instanceof HttpException) throw err;
      console.error('[appointments] updateAppointmentStatus unhandled error:', err);
      throw new BadRequestException(err?.message || 'Failed to update appointment status');
    }
  }

  private checkAppointmentActorAccess(apt: any, currentUser: any) {
    if (!currentUser) {
      throw new ForbiddenException('Authentication required.');
    }
    if (currentUser.role === Role.ADMIN) {
      return;
    }

    const isPatientOwner =
      (currentUser.patient && currentUser.patient.id === apt.patientId) ||
      (apt.patient && apt.patient.userId === currentUser.id) ||
      apt.patientId === currentUser.id;
    const isDoctorOwner =
      (currentUser.doctor && currentUser.doctor.id === apt.doctorId) ||
      (apt.doctor && apt.doctor.userId === currentUser.id) ||
      apt.doctorId === currentUser.id;

    if (!isPatientOwner && !isDoctorOwner) {
      throw new ForbiddenException('You do not have permission to view or manage this appointment.');
    }
  }
}
