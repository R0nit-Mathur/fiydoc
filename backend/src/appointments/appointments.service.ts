import { Injectable, BadRequestException, ForbiddenException, NotFoundException, HttpException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { AppointmentStatus, ConsultationType, Role } from '@prisma/client';

@Injectable()
export class AppointmentsService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService
  ) {}

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

  private formatAppointment(apt: any, overrideMap?: Map<string, any>) {
    if (!apt) return null;
    const tokenMatch = apt.notes?.match(/\[(Token\s*#\d+)\]/) || apt.notes?.match(/(Token\s*#\d+)/);
    const tokenNumber = tokenMatch ? tokenMatch[1] : (apt.tokenNumber || null);

    // 1. Authoritative lookup from DoctorScheduleOverride
    const override = overrideMap?.get(`${apt.doctorId}_${apt.date}`) ||
      overrideMap?.get(`${apt.doctor?.id}_${apt.date}`) ||
      overrideMap?.get(`${apt.doctor?.userId}_${apt.date}`);

    // 2. Fallback to notes tags if overrideMap not provided
    const delayMatch = apt.notes?.match(/\[(?:Delayed|Postponed):\s*\+?(\d+)m?(?:\.\s*Reason:\s*([^\]]+))?\]/i);
    const delayMinutes = override
      ? (override.delayMinutes || 0)
      : (delayMatch ? parseInt(delayMatch[1], 10) : 0);
    const delayReason = override
      ? (override.reason || null)
      : (delayMatch && delayMatch[2] ? delayMatch[2].trim() : null);

    const leaveMatch = apt.notes?.match(/\[Cancelled:\s*Doctor on leave(?:\s*-\s*([^\]]+))?\]/i);
    const isDoctorOnLeave = override
      ? Boolean(override.isOnLeave)
      : Boolean(leaveMatch);
    const leaveReason = override && override.isOnLeave
      ? (override.reason || 'Doctor on leave')
      : (leaveMatch && leaveMatch[1] ? leaveMatch[1].trim() : null);

    const expectedTime = delayMinutes > 0 ? this.calculateShiftedTime(apt.startTime, delayMinutes) : apt.startTime;

    const allergyTagMatch = apt.notes?.match(/\[Allergies:\s*([^\]]+)\]/i);
    const conditionTagMatch = apt.notes?.match(/\[Conditions:\s*([^\]]+)\]/i);
    const notesAllergies = allergyTagMatch ? allergyTagMatch[1].split(',').map((s: string) => s.trim()).filter(Boolean) : [];
    const notesConditions = conditionTagMatch ? conditionTagMatch[1].split(',').map((s: string) => s.trim()).filter(Boolean) : [];
    const patientAllergies = Array.from(new Set([...(apt.patient?.allergies || []), ...notesAllergies]));
    const patientConditions = Array.from(new Set([...(apt.patient?.chronicConditions || []), ...notesConditions]));

    return {
      id: apt.id,
      patientId: apt.patientId,
      patientName: apt.patient?.fullName || null,
      patientAvatar: apt.patient?.profilePhoto || apt.patient?.user?.profilePhoto || null,
      patientAllergies,
      patientConditions,
      doctorId: apt.doctorId,
      doctorName: apt.doctor?.fullName || null,
      doctorSpecialty: apt.doctor?.specialization || null,
      doctorAvatar: apt.doctor?.profilePhoto || apt.doctor?.user?.profilePhoto || null,
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
      rejectionReason: apt.rejectionReason || null,
      tokenNumber,
      status: (apt.status || 'CONFIRMED').toLowerCase(),
      consultationType: apt.consultationType,
      mode: (apt.consultationType || 'clinic').toLowerCase(),
      fee: apt.fee,
      symptoms: apt.symptoms || [],
      notes: apt.notes,
      attachmentUrl: apt.attachmentUrl || null,
      attachmentName: apt.attachmentName || null,
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
      attachmentUrl?: string;
      attachmentName?: string;
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

    // Reject bookings for past dates or past times
    const [startH_check, startM_check] = dto.startTime.split(':').map(Number);
    const slotTotalMins = startH_check * 60 + startM_check;
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    if (dto.date < todayLocal && dto.date < todayIso) {
      throw new BadRequestException('Appointment date/time must be strictly in the future.');
    }

    // If booking for today, slot timing must be at least 15 minutes in the future
    if (isToday && slotTotalMins - currentMinutes < 15) {
      throw new BadRequestException(
        'Appointment date/time must be strictly in the future. Appointments must be booked at least 15 minutes before the slot starts.'
      );
    }

    // Fetch doctor to authoritatively determine consultation fee and verify existence
    const doctor =
      (await this.prisma.doctor.findFirst({
        where: {
          OR: [
            { id: dto.doctorId },
            { userId: dto.doctorId },
          ],
        },
        include: { clinic: true, availabilities: true, verification: true },
      })) ||
      (await this.prisma.doctor.findUnique({
        where: { id: dto.doctorId },
        include: { clinic: true, availabilities: true, verification: true },
      }));
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
    let patient =
      (await this.prisma.patient.findFirst({
        where: {
          OR: [
            { id: dto.patientId },
            { userId: dto.patientId },
            ...(currentUser?.id ? [{ userId: currentUser.id }, { id: currentUser.id }] : []),
          ],
        },
      })) ||
      (await this.prisma.patient.findUnique({
        where: { id: dto.patientId },
      }));

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

    // Check schedule override for this date (breaks, custom slots, delay, slot duration)
    const override = await this.prisma.doctorScheduleOverride.findFirst({
      where: {
        doctorId: { in: [doctor.id, doctor.userId] },
        date: dto.date,
      },
    });

    if (override?.isOnLeave) {
      throw new BadRequestException(override.reason || 'The doctor is on leave on this date.');
    }

    const slotStartNorm = dto.startTime.slice(0, 5);

    // 1. Check if slot is explicitly blocked
    const blockedSlots = Array.isArray(override?.blockedSlots) ? override.blockedSlots : [];
    if (blockedSlots.includes(slotStartNorm)) {
      throw new BadRequestException('The requested slot has been blocked or is unavailable.');
    }

    // 2. Check if slot falls in any break
    let breaksList: any[] = [];
    if (override?.breaks) {
      if (Array.isArray(override.breaks)) breaksList = override.breaks;
      else if (typeof override.breaks === 'string') {
        try { breaksList = JSON.parse(override.breaks); } catch {}
      }
    }

    const [slotH, slotM] = slotStartNorm.split(':').map(Number);
    const slotMins = slotH * 60 + slotM;

    // Derive authoritative slot duration
    let slotDuration = override?.slotDurationMinutes || 15;

    for (const b of breaksList) {
      const [bh, bm] = (b.startTime || '00:00').split(':').map(Number);
      const [eh, em] = (b.endTime || '00:00').split(':').map(Number);
      const bStart = bh * 60 + bm;
      const bEnd = eh * 60 + em;
      if (slotMins < bEnd && (slotMins + slotDuration) > bStart) {
        throw new BadRequestException(`Doctor has a scheduled break (${b.title || 'Break'}) during this time.`);
      }
    }

    // Check doctor availability rules if configured and not custom slot
    const customSlots = Array.isArray(override?.customSlots) ? override.customSlots : [];
    const isCustomSlot = customSlots.includes(slotStartNorm);

    if (!isCustomSlot && doctor.availabilities && doctor.availabilities.length > 0) {
      const appointmentDayOfWeek = parsedStart.getDay(); // 0 = Sun, 1 = Mon ...
      const matchingDayAvailabilities = doctor.availabilities.filter(
        (a) => a.dayOfWeek === appointmentDayOfWeek
      );

      if (matchingDayAvailabilities.length > 0) {
        const matchedSlot = matchingDayAvailabilities.find((avail) => {
          const availStartNorm = avail.startTime.slice(0, 5);
          const availEndNorm = avail.endTime.slice(0, 5);
          return slotStartNorm >= availStartNorm && slotStartNorm < availEndNorm;
        });

        if (matchedSlot) {
          slotDuration = override?.slotDurationMinutes || matchedSlot.slotDurationMinutes || slotDuration;
        }
      }
    }

    // Authoritatively compute endTime from startTime + slotDuration
    const totalMinutes = slotH * 60 + slotM + slotDuration;
    const endH = Math.floor(totalMinutes / 60);
    const endM = totalMinutes % 60;
    const authoritativeEndTime = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;

    // Concurrency-safe atomic reservation & token allocation inside a lean transaction
    let createdApt: any;
    let allocatedToken = 'Token #01';
    try {
      createdApt = await this.prisma.$transaction(async (tx) => {
        // 1. Capacity check: count active bookings for this doctor, date, and slot
        const activeCount = await tx.appointment.count({
          where: {
            doctorId: dto.doctorId,
            date: dto.date,
            startTime: dto.startTime.slice(0, 5),
            status: { in: [AppointmentStatus.CONFIRMED, AppointmentStatus.PENDING] },
          },
        });

        const maxCapacity = (doctor as any).patientsPerSlot || 1;
        if (activeCount >= maxCapacity) {
          throw new BadRequestException('This slot is already fully booked. Please choose another time.');
        }

        // 2. Concurrency-safe atomic token sequence allocation via DailyDoctorToken
        let tokenNum = 1;
        try {
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
          tokenNum = tokenRecord.lastToken;
        } catch {
          // Fallback atomic raw SQL in case of concurrent first-day insert
          try {
            const rawRes: any = await tx.$queryRawUnsafe(`
              INSERT INTO "DailyDoctorToken" ("id", "doctorId", "date", "lastToken", "updatedAt")
              VALUES (gen_random_uuid()::text, $1, $2, 1, CURRENT_TIMESTAMP)
              ON CONFLICT ("doctorId", "date")
              DO UPDATE SET "lastToken" = "DailyDoctorToken"."lastToken" + 1, "updatedAt" = CURRENT_TIMESTAMP
              RETURNING "lastToken"
            `, dto.doctorId, dto.date);
            tokenNum = rawRes?.[0]?.lastToken || activeCount + 1;
          } catch {
            tokenNum = activeCount + 1;
          }
        }
        allocatedToken = `Token #${String(tokenNum).padStart(2, '0')}`;

        const canonicalNotes = dto.notes
          ? `${dto.notes.trim()} [${allocatedToken}]`
          : `[${allocatedToken}]`;

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
            attachmentUrl: dto.attachmentUrl || null,
            attachmentName: dto.attachmentName || null,
            status: AppointmentStatus.CONFIRMED,
          },
          include: {
            doctor: { include: { clinic: true, user: true } },
            patient: { include: { user: true } },
          },
        });
      }, {
        maxWait: 5000,
        timeout: 10000,
      });
    } catch (err: any) {
      if (err?.code === 'P2002' || err?.message?.includes('P2002') || err?.message?.includes('Unique constraint')) {
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

    // Trigger push notifications for both patient and doctor — non-fatal (outside tx)
    try {
      if (patient?.userId) {
        this.notificationsService.create({
          userId: patient.userId,
          type: 'APPOINTMENT_CONFIRMED',
          title: 'Appointment Confirmed',
          message: `Your appointment with ${createdApt.doctor.fullName} on ${dto.date} at ${dto.startTime} is confirmed. Token: ${allocatedToken}. Show token at OPD.`,
          payload: { appointmentId: createdApt.id, doctorId: dto.doctorId, date: dto.date },
        }).catch(() => {});
      }
      if (createdApt.doctor?.userId) {
        this.notificationsService.create({
          userId: createdApt.doctor.userId,
          type: 'NEW_BOOKING_CONFIRMED',
          title: 'New Confirmed Appointment',
          message: `${createdApt.patient.fullName} booked ${dto.startTime} on ${dto.date} (${allocatedToken}).`,
          payload: { appointmentId: createdApt.id, patientId: dto.patientId, date: dto.date },
        }).catch(() => {});
      }
    } catch (notifErr: any) {
      console.warn('[appointments] Notification dispatch failed (non-fatal):', notifErr?.message);
    }

    return this.formatAppointment(createdApt);
  }

  private async getOverridesForAppointments(appointments: any[]): Promise<Map<string, any>> {
    const overrideMap = new Map<string, any>();
    if (!appointments || appointments.length === 0) return overrideMap;

    const doctorIds = Array.from(new Set(appointments.map((a) => a.doctorId).filter(Boolean)));
    const dates = Array.from(new Set(appointments.map((a) => a.date).filter(Boolean)));
    if (doctorIds.length === 0 || dates.length === 0) return overrideMap;

    try {
      const overrides = await (this.prisma as any).doctorScheduleOverride?.findMany({
        where: {
          doctorId: { in: doctorIds },
          date: { in: dates },
        },
      });
      if (overrides) {
        for (const ov of overrides) {
          overrideMap.set(`${ov.doctorId}_${ov.date}`, ov);
        }
      }
    } catch {
      try {
        const rows: any = await this.prisma.$queryRawUnsafe(`
          SELECT * FROM "DoctorScheduleOverride"
          WHERE "doctorId" = ANY($1::text[]) AND "date" = ANY($2::text[])
        `, doctorIds, dates);
        if (rows) {
          for (const ov of rows) {
            overrideMap.set(`${ov.doctorId}_${ov.date}`, ov);
          }
        }
      } catch (sqlErr: any) {
        console.warn('[appointments] Batch override lookup fallback failed:', sqlErr?.message);
      }
    }
    return overrideMap;
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
      include: { doctor: { include: { clinic: true, user: true } }, patient: { include: { user: true } }, consultation: true },
      orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
    });

    const overrideMap = await this.getOverridesForAppointments(appointments);
    return appointments.map((a) => this.formatAppointment(a, overrideMap));
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
      include: { patient: { include: { user: true } }, doctor: { include: { clinic: true, user: true } }, consultation: true },
      orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
    });

    const overrideMap = await this.getOverridesForAppointments(appointments);
    return appointments.map((a) => this.formatAppointment(a, overrideMap));
  }

  async getAppointmentById(id: string, currentUser: any) {
    const apt = await this.prisma.appointment.findUnique({
      where: { id },
      include: { doctor: { include: { clinic: true, user: true } }, patient: { include: { user: true } }, consultation: true },
    });
    if (!apt) throw new NotFoundException('Appointment not found.');

    this.checkAppointmentActorAccess(apt, currentUser);

    const overrideMap = await this.getOverridesForAppointments([apt]);
    return this.formatAppointment(apt, overrideMap);
  }

  async cancelAppointment(id: string, currentUser: any) {
    try {
      const apt = await this.prisma.appointment.findUnique({
        where: { id },
        include: { doctor: { include: { clinic: true, user: true } }, patient: { include: { user: true } }, consultation: true },
      });
      if (!apt) throw new NotFoundException('Appointment not found.');

      this.checkAppointmentActorAccess(apt, currentUser);

      // Rule: Only the appointment's patient, assigned doctor, or admin can cancel
      const isOwnerPatient =
        (currentUser.patient && currentUser.patient.id === apt.patientId) ||
        (apt.patient && apt.patient.userId === currentUser.id);
      const isOwnerDoctor =
        (currentUser.doctor && currentUser.doctor.id === apt.doctorId) ||
        (apt.doctor && apt.doctor.userId === currentUser.id) ||
        apt.doctorId === currentUser.id;
      const isAdmin = currentUser.role === Role.ADMIN;

      if (!isOwnerPatient && !isOwnerDoctor && !isAdmin) {
        throw new ForbiddenException('Only the appointment patient, doctor, or an admin can cancel an appointment.');
      }

      if (apt.status === AppointmentStatus.CANCELLED || String(apt.status).toUpperCase() === 'CANCELLED') {
        throw new BadRequestException('This appointment has already been cancelled.');
      }

      const cancellableStatuses: string[] = ['PENDING', 'CONFIRMED', 'UPCOMING', 'CHECKED_IN', 'IN_PROGRESS'];
      if (!cancellableStatuses.includes(String(apt.status).toUpperCase())) {
        throw new BadRequestException(
          `Cannot cancel appointment in '${apt.status}' state. Only active or scheduled appointments can be cancelled.`
        );
      }

      const updated = await this.prisma.appointment.update({
        where: { id },
        data: { status: AppointmentStatus.CANCELLED },
        include: { doctor: { include: { clinic: true, user: true } }, patient: { include: { user: true } }, consultation: true },
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
          this.notificationsService.create({
            userId: recipientUserId,
            type: 'APPOINTMENT_CANCELLED',
            title: 'Appointment Cancelled',
            message: `The appointment for ${updated.date} at ${updated.startTime} was cancelled by ${cancelledByName}.`,
            payload: { appointmentId: updated.id, date: updated.date },
          }).catch(() => {});
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
        include: { doctor: { include: { clinic: true, user: true } }, patient: { include: { user: true } }, consultation: true },
      });
      if (!apt) throw new NotFoundException('Appointment not found.');

      this.checkAppointmentActorAccess(apt, currentUser);

      // State machine validation
      const allowedTransitions: Record<string, string[]> = {
        PENDING: ['CONFIRMED', 'CANCELLED', 'REJECTED'],
        CONFIRMED: ['COMPLETED', 'CANCELLED', 'NO_SHOW'],
        COMPLETED: [],
        CANCELLED: [],
        NO_SHOW: [],
        REJECTED: [],
      };

      const currentStatusStr = String(apt.status).toUpperCase();
      const validNextStates = allowedTransitions[currentStatusStr] || [];
      if (!validNextStates.includes(normalizedStatus)) {
        throw new BadRequestException(
          `Invalid status transition from '${apt.status}' to '${normalizedStatus}'.`
        );
      }

      // Role-specific constraints on transitions
      if (
        normalizedStatus === AppointmentStatus.CONFIRMED ||
        normalizedStatus === AppointmentStatus.COMPLETED ||
        normalizedStatus === AppointmentStatus.NO_SHOW ||
        normalizedStatus === AppointmentStatus.REJECTED
      ) {
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
        include: { doctor: { include: { clinic: true, user: true } }, patient: { include: { user: true } }, consultation: true },
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
          this.notificationsService.create({
            userId: updated.patient.userId,
            type: 'APPOINTMENT_APPROVED',
            title: 'Appointment Approved by Doctor',
            message: `Dr. ${updated.doctor?.fullName || 'Doctor'} approved your appointment for ${updated.date} at ${updated.startTime}.`,
            payload: { appointmentId: updated.id, date: updated.date },
          }).catch(() => {});
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

  async rejectAppointment(id: string, reason?: string, currentUser?: any) {
    const apt = await this.prisma.appointment.findUnique({
      where: { id },
      include: { doctor: { include: { clinic: true, user: true } }, patient: { include: { user: true } } },
    });
    if (!apt) throw new NotFoundException('Appointment not found.');

    this.checkAppointmentActorAccess(apt, currentUser);

    const isDoctor =
      currentUser.role === Role.DOCTOR &&
      ((currentUser.doctor && currentUser.doctor.id === apt.doctorId) ||
        apt.doctor?.userId === currentUser.id ||
        apt.doctorId === currentUser.id);
    const isAdmin = currentUser.role === Role.ADMIN;
    if (!isDoctor && !isAdmin) {
      throw new ForbiddenException('Only the assigned doctor or admin can reject an appointment request.');
    }

    if (apt.status !== AppointmentStatus.PENDING) {
      throw new BadRequestException(`Cannot reject appointment with status '${apt.status}'. Only pending requests can be rejected.`);
    }

    const rejectionReason = reason?.trim() || 'Declined by doctor due to scheduling conflicts';

    const updated = await this.prisma.appointment.update({
      where: { id },
      data: {
        status: AppointmentStatus.REJECTED,
        rejectionReason,
        notes: apt.notes ? `${apt.notes} [Rejected: ${rejectionReason}]` : `[Rejected: ${rejectionReason}]`,
      },
      include: { doctor: { include: { clinic: true, user: true } }, patient: { include: { user: true } } },
    });

    if (currentUser?.id) {
      try {
        await this.prisma.auditLog.create({
          data: {
            actorUserId: currentUser.id,
            action: 'APPOINTMENT_REJECTED',
            targetType: 'APPOINTMENT',
            targetId: id,
            metadata: {
              reason: rejectionReason,
            },
          },
        });
      } catch {}
    }

    if (updated.patient?.userId) {
      try {
        this.notificationsService.create({
          userId: updated.patient.userId,
          type: 'APPOINTMENT_REJECTED',
          title: 'Appointment Request Declined',
          message: `Dr. ${updated.doctor.fullName} was unable to accept your appointment for ${updated.date} at ${updated.startTime}. Reason: ${rejectionReason}.`,
          payload: { appointmentId: updated.id, date: updated.date, reason: rejectionReason },
        }).catch(() => {});
      } catch {}
    }

    return this.formatAppointment(updated);
  }

  async rescheduleAppointment(
    id: string,
    body: {
      date?: string;
      startTime: string;
      endTime?: string;
      delayMinutes?: number;
      reason?: string;
    },
    currentUser?: any
  ) {
    const apt = await this.prisma.appointment.findUnique({
      where: { id },
      include: { doctor: { include: { clinic: true, user: true } }, patient: { include: { user: true } } },
    });

    if (!apt) {
      throw new NotFoundException('Appointment not found.');
    }

    this.checkAppointmentActorAccess(apt, currentUser);

    if (apt.status === AppointmentStatus.CANCELLED || apt.status === AppointmentStatus.REJECTED) {
      throw new BadRequestException(`Cannot reschedule an appointment that has been ${apt.status.toLowerCase()}.`);
    }

    const newDate = body.date || apt.date;
    const newStartTime = body.startTime;
    const newEndTime =
      body.endTime ||
      (body.delayMinutes ? this.calculateShiftedTime(apt.endTime, body.delayMinutes) : apt.endTime);
    const reason = body.reason || (body.delayMinutes ? `Postponed by ${body.delayMinutes} mins` : 'Rescheduled by doctor');

    const updated = await this.prisma.appointment.update({
      where: { id },
      data: {
        date: newDate,
        startTime: newStartTime,
        endTime: newEndTime,
        notes: apt.notes ? `${apt.notes} [Rescheduled: ${reason}]` : `[Rescheduled: ${reason}]`,
        status: AppointmentStatus.CONFIRMED,
      },
      include: { doctor: { include: { clinic: true, user: true } }, patient: { include: { user: true } } },
    });

    if (currentUser?.id) {
      try {
        await this.prisma.auditLog.create({
          data: {
            actorUserId: currentUser.id,
            action: 'APPOINTMENT_RESCHEDULED',
            targetType: 'APPOINTMENT',
            targetId: id,
            metadata: {
              previousDate: apt.date,
              previousStartTime: apt.startTime,
              newDate,
              newStartTime,
              reason,
            },
          },
        });
      } catch {}
    }

    if (updated.patient?.userId) {
      try {
        this.notificationsService.create({
          userId: updated.patient.userId,
          type: 'APPOINTMENT_CONFIRMED',
          title: 'Appointment Rescheduled',
          message: `Dr. ${updated.doctor.fullName} has rescheduled your appointment to ${newDate} at ${newStartTime}.${reason ? ` Reason: ${reason}` : ''}`,
          payload: {
            appointmentId: updated.id,
            date: newDate,
            startTime: newStartTime,
            reason,
          },
        }).catch(() => {});
      } catch {}
    }

    return this.formatAppointment(updated);
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
      apt.patientId === currentUser.id ||
      (currentUser.email && apt.patient?.email === currentUser.email);
    const isDoctorOwner =
      (currentUser.doctor && currentUser.doctor.id === apt.doctorId) ||
      (apt.doctor && apt.doctor.userId === currentUser.id) ||
      apt.doctorId === currentUser.id ||
      (currentUser.email && apt.doctor?.email === currentUser.email);

    if (!isPatientOwner && !isDoctorOwner) {
      throw new ForbiddenException('You do not have permission to view or manage this appointment.');
    }
  }
}
