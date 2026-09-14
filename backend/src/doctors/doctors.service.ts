import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { VerificationStatus } from '@prisma/client';

@Injectable()
export class DoctorsService {
  constructor(private prisma: PrismaService) {}

  private calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371;
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c * 10) / 10;
  }

  private formatDoctor(doc: any, userLat?: number, userLng?: number, override?: any) {
    if (!doc) return null;
    const qualificationText = doc.qualifications?.length > 0
      ? doc.qualifications.map((q: any) => q.degree).join(', ')
      : null;
    const clinicLat = doc.clinic?.latitude ?? null;
    const clinicLng = doc.clinic?.longitude ?? null;

    let distanceKm: number | null = null;
    if (userLat != null && userLng != null && clinicLat != null && clinicLng != null) {
      distanceKm = this.calculateDistanceKm(userLat, userLng, clinicLat, clinicLng);
    }

    const modes = (doc.consultationModes || ['CLINIC']).map((m: any) => String(m).toLowerCase());

    return {
      id: doc.id,
      name: doc.fullName,
      fullName: doc.fullName,
      specialty: doc.specialization,
      specialization: doc.specialization,
      avatar: doc.profilePhoto || null,
      profilePhoto: doc.profilePhoto || null,
      consultationFee: doc.consultationFee,
      patientsPerSlot: doc.patientsPerSlot || 1,
      consultationModes: doc.consultationModes || ['CLINIC'],
      qualification: qualificationText,
      hospital: doc.clinic?.name || null,
      location: doc.clinic?.address || null,
      latitude: clinicLat,
      longitude: clinicLng,
      distanceKm,
      delayMinutes: override?.delayMinutes || 0,
      delayReason: override?.reason || null,
      isOnLeave: Boolean(override?.isOnLeave),
      leaveReason: override?.isOnLeave ? (override?.reason || 'Doctor on leave') : null,
      clinic: doc.clinic
        ? {
            id: doc.clinic.id,
            name: doc.clinic.name,
            address: doc.clinic.address,
            latitude: doc.clinic.latitude,
            longitude: doc.clinic.longitude,
            timings: doc.clinic.timings,
          }
        : null,
      timings: doc.clinic?.timings || null,
      rating: null,
      reviewCount: 0,
      experienceYears: doc.experienceYears || 0,
      verificationStatus: (doc.verification?.status || VerificationStatus.REGISTERED).toLowerCase(),
      modes,
      isInPersonAvailable: modes.includes('clinic'),
      isOnlineAvailable: modes.includes('video') || modes.includes('chat'),
      availabilities: (doc.availabilities || []).map((a: any) => ({
        id: a.id,
        dayOfWeek: a.dayOfWeek,
        startTime: a.startTime,
        endTime: a.endTime,
        slotDurationMinutes: a.slotDurationMinutes || 30,
      })),
    };
  }

  async searchDoctors(query?: string, specialty?: string, lat?: number, lng?: number) {
    const whereClause: any = {
      verification: {
        status: VerificationStatus.VERIFIED,
      },
    };

    if (specialty && specialty !== 'All') {
      // Search categories are human labels (e.g. "Cardiology") while database
      // specializations may be "Interventional Cardiologist". Exact equality hid valid doctors.
      whereClause.specialization = { contains: specialty, mode: 'insensitive' };
    }

    if (query) {
      whereClause.AND = [
        {
          OR: [
            { fullName: { contains: query, mode: 'insensitive' } },
            { specialization: { contains: query, mode: 'insensitive' } },
            { clinic: { is: { name: { contains: query, mode: 'insensitive' } } } },
            { clinic: { is: { address: { contains: query, mode: 'insensitive' } } } },
          ],
        },
      ];
    }

    const doctors = await this.prisma.doctor.findMany({
      where: whereClause,
      include: {
        qualifications: true,
        clinic: true,
        verification: true,
        availabilities: true,
      },
    });

    const today = new Date();
    const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    let todayOverrides: any[] = [];
    try {
      todayOverrides = await (this.prisma as any).doctorScheduleOverride?.findMany({
        where: {
          doctorId: { in: doctors.map((d) => d.id) },
          date: todayKey,
        },
      }) || [];
    } catch {
      try {
        todayOverrides = await this.prisma.$queryRawUnsafe(`
          SELECT * FROM "DoctorScheduleOverride"
          WHERE "doctorId" = ANY($1::text[]) AND "date" = $2
        `, doctors.map((d) => d.id), todayKey) as any[] || [];
      } catch {}
    }
    const overrideMap = new Map((todayOverrides || []).map((o: any) => [o.doctorId, o]));

    const formatted = doctors.map((d) => this.formatDoctor(d, lat, lng, overrideMap.get(d.id)));
    if (lat != null && lng != null) {
      return formatted.sort((a, b) => {
        if (a.distanceKm != null && b.distanceKm != null) return a.distanceKm - b.distanceKm;
        if (a.distanceKm != null) return -1;
        if (b.distanceKm != null) return 1;
        return 0;
      });
    }
    return formatted;
  }

  async getDoctorById(id: string) {
    const doctor = await this.prisma.doctor.findUnique({
      where: { id },
      include: {
        qualifications: true,
        clinic: true,
        verification: true,
        availabilities: true,
      },
    });
    if (!doctor || doctor.verification?.status !== VerificationStatus.VERIFIED) {
      throw new NotFoundException('Doctor not found or pending verification.');
    }

    const today = new Date();
    const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    let todayOverride: any = null;
    try {
      todayOverride = await (this.prisma as any).doctorScheduleOverride?.findFirst({
        where: {
          doctorId: { in: [doctor.id, doctor.userId] },
          date: todayKey,
        },
      });
    } catch {}

    return this.formatDoctor(doctor, undefined, undefined, todayOverride);
  }

  async updateDoctorProfile(userId: string, dto: {
    fullName?: string;
    specialization?: string;
    profilePhoto?: string | null;
    consultationFee?: number;
    patientsPerSlot?: number;
    clinicName?: string;
    clinicAddress?: string;
    clinicTimings?: string;
    slotDurationMinutes?: number;
    experienceYears?: number;
  }) {
    const doctor = await this.prisma.doctor.findUnique({
      where: { userId },
      include: { verification: true, availabilities: true },
    });
    if (!doctor) throw new ForbiddenException('Only doctors can update a practice profile.');

    const nameChanged = dto.fullName?.trim() && dto.fullName.trim() !== doctor.fullName;
    const specChanged = dto.specialization?.trim() && dto.specialization.trim() !== doctor.specialization;

    // Rule: Clinical identity (name & specialty) are credential-backed.
    // If a verified doctor alters their clinical name or specialty, require re-verification.
    const shouldResetVerification = (nameChanged || specChanged) && doctor.verification?.status === VerificationStatus.VERIFIED;

    // Resolve slot duration: use DTO value, or existing availability's value, or default 30
    const resolvedSlotDuration =
      (dto.slotDurationMinutes && dto.slotDurationMinutes > 0 ? dto.slotDurationMinutes : null) ||
      doctor.availabilities?.[0]?.slotDurationMinutes ||
      30;

    const updated: any = await this.prisma.doctor.update({
      where: { userId },
      data: {
        fullName: dto.fullName?.trim() || undefined,
        specialization: dto.specialization?.trim() || undefined,
        profilePhoto: dto.profilePhoto === null ? null : dto.profilePhoto?.trim() || undefined,
        consultationFee: dto.consultationFee && dto.consultationFee > 0 ? dto.consultationFee : undefined,
        experienceYears: dto.experienceYears != null && dto.experienceYears >= 0 ? dto.experienceYears : undefined,
        patientsPerSlot: dto.patientsPerSlot && dto.patientsPerSlot > 0 ? dto.patientsPerSlot : undefined,
        ...(shouldResetVerification
          ? {
              verification: {
                update: {
                  status: VerificationStatus.PENDING,
                  rejectionReason: null,
                },
              },
            }
          : {}),
        ...(dto.clinicName?.trim() || dto.clinicAddress?.trim() || dto.clinicTimings?.trim()
          ? {
              clinic: {
                upsert: {
                  create: {
                    name: dto.clinicName?.trim() || `${doctor.fullName}'s Clinic`,
                    address: dto.clinicAddress?.trim() || 'Clinical Practice Address Pending',
                    timings: dto.clinicTimings?.trim() || '09:00 - 13:00, 17:00 - 20:00',
                  },
                  update: {
                    name: dto.clinicName?.trim() || undefined,
                    address: dto.clinicAddress?.trim() || undefined,
                    timings: dto.clinicTimings?.trim() || undefined,
                  },
                },
              },
            }
          : {}),
      } as any,
      include: { qualifications: true, clinic: true, verification: true, availabilities: true },
    });

    // If clinicTimings OR slotDurationMinutes was provided, rebuild availabilities for Mon-Sat
    if (dto.clinicTimings?.trim() || dto.slotDurationMinutes) {
      try {
        const timingStr = dto.clinicTimings?.trim() || updated.clinic?.timings || '09:00 - 13:00, 17:00 - 20:00';
        const parsedIntervals = this.parseTimingsToIntervals(timingStr);
        if (parsedIntervals.length > 0) {
          await this.prisma.availability.deleteMany({ where: { doctorId: doctor.id } });
          const newAvailabilities: { doctorId: string; dayOfWeek: number; startTime: string; endTime: string; slotDurationMinutes: number }[] = [];
          for (let day = 1; day <= 6; day++) {
            for (const interval of parsedIntervals) {
              newAvailabilities.push({
                doctorId: doctor.id,
                dayOfWeek: day,
                startTime: interval.startTime,
                endTime: interval.endTime,
                slotDurationMinutes: resolvedSlotDuration,
              });
            }
          }
          await this.prisma.availability.createMany({ data: newAvailabilities });
        } else if (dto.slotDurationMinutes && dto.slotDurationMinutes > 0) {
          // No new timing string but slot duration changed — update existing availabilities in-place
          await this.prisma.availability.updateMany({
            where: { doctorId: doctor.id },
            data: { slotDurationMinutes: resolvedSlotDuration },
          });
        }
      } catch (err) {
        // Continue if sync encounters an error
      }
    }

    return this.formatDoctor(updated);
  }

  async updateAvailability(userId: string, dto: {
    slotDurationMinutes?: number;
    patientsPerSlot?: number;
    availabilities?: { dayOfWeek: number; startTime: string; endTime: string; slotDurationMinutes?: number }[];
  }) {
    const doctor = await this.prisma.doctor.findFirst({
      where: { OR: [{ userId }, { id: userId }] },
      include: { availabilities: true, clinic: true, verification: true },
    });
    if (!doctor) throw new ForbiddenException('Doctor profile not found.');

    // Update patientsPerSlot on doctor directly
    if (dto.patientsPerSlot && dto.patientsPerSlot > 0) {
      await this.prisma.doctor.update({
        where: { id: doctor.id },
        data: { patientsPerSlot: dto.patientsPerSlot } as any,
      });
    }

    if (dto.availabilities && dto.availabilities.length > 0) {
      // Full replace with provided schedule
      await this.prisma.availability.deleteMany({ where: { doctorId: doctor.id } });
      await this.prisma.availability.createMany({
        data: dto.availabilities.map((a) => ({
          doctorId: doctor.id,
          dayOfWeek: a.dayOfWeek,
          startTime: a.startTime,
          endTime: a.endTime,
          slotDurationMinutes: a.slotDurationMinutes || dto.slotDurationMinutes || 30,
        })),
      });
    } else if (dto.slotDurationMinutes && dto.slotDurationMinutes > 0) {
      // Just update slot duration on all existing availabilities
      await this.prisma.availability.updateMany({
        where: { doctorId: doctor.id },
        data: { slotDurationMinutes: dto.slotDurationMinutes },
      });
    }

    const refreshed = await this.prisma.doctor.findUnique({
      where: { id: doctor.id },
      include: { qualifications: true, clinic: true, verification: true, availabilities: true },
    });
    return this.formatDoctor(refreshed);
  }
  private parseTimingsToIntervals(timings: string): { startTime: string; endTime: string }[] {
    const intervals: { startTime: string; endTime: string }[] = [];
    const parts = timings.split(/[,;•|]|\band\b/i);
    for (const part of parts) {
      const match = part.match(/(\d{1,2}(?::\d{2})?\s*(?:AM|PM)?)\s*[-–—to]+\s*(\d{1,2}(?::\d{2})?\s*(?:AM|PM)?)/i);
      if (match) {
        const start = this.normalizeTimeTo24h(match[1].trim());
        const end = this.normalizeTimeTo24h(match[2].trim());
        if (start && end) {
          intervals.push({ startTime: start, endTime: end });
        }
      }
    }
    return intervals;
  }

  private normalizeTimeTo24h(str: string): string | null {
    const clean = str.trim().toUpperCase();
    const match12 = clean.match(/^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)$/);
    if (match12) {
      let h = parseInt(match12[1], 10);
      const m = match12[2] ? parseInt(match12[2], 10) : 0;
      const meridian = match12[3];
      if (meridian === 'PM' && h < 12) h += 12;
      if (meridian === 'AM' && h === 12) h = 0;
      return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    }
    const match24 = clean.match(/^(\d{1,2}):(\d{2})$/);
    if (match24) {
      const h = parseInt(match24[1], 10);
      const m = parseInt(match24[2], 10);
      return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    }
    return null;
  }

  async generateAvailableSlots(doctorId: string, date: string) {
    const doctor = await this.prisma.doctor.findFirst({
      where: {
        OR: [
          { id: doctorId },
          { userId: doctorId },
        ],
      },
      include: { availabilities: true, clinic: true },
    });
    if (!doctor) throw new NotFoundException('Doctor not found');

    const dateObj = new Date(`${date}T00:00:00`);
    if (isNaN(dateObj.getTime())) {
      throw new NotFoundException('Invalid date format. Expected YYYY-MM-DD.');
    }
    const dayOfWeek = dateObj.getDay();

    const matchingAvailabilities = (doctor.availabilities || []).filter(
      (a) => a.dayOfWeek === dayOfWeek
    );

    let candidateSlots: string[] = [];

    if (matchingAvailabilities.length > 0) {
      for (const avail of matchingAvailabilities) {
        const slotDuration = avail.slotDurationMinutes || 30;
        const [startH, startM] = avail.startTime.split(':').map(Number);
        const [endH, endM] = avail.endTime.split(':').map(Number);

        let currentMinutes = startH * 60 + startM;
        const endMinutes = endH * 60 + endM;

        while (currentMinutes + slotDuration <= endMinutes) {
          const h = Math.floor(currentMinutes / 60);
          const m = currentMinutes % 60;
          const timeStr = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
          candidateSlots.push(timeStr);
          currentMinutes += slotDuration;
        }
      }
    } else if (doctor.clinic?.timings) {
      // Fallback: parse clinic timings string (e.g. "09:00 - 13:00, 17:00 - 20:00")
      const intervals = this.parseTimingsToIntervals(doctor.clinic.timings);
      for (const interval of intervals) {
        const [startH, startM] = interval.startTime.split(':').map(Number);
        const [endH, endM] = interval.endTime.split(':').map(Number);
        let currentMinutes = startH * 60 + startM;
        const endMinutes = endH * 60 + endM;
        while (currentMinutes + 30 <= endMinutes) {
          const h = Math.floor(currentMinutes / 60);
          const m = currentMinutes % 60;
          candidateSlots.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
          currentMinutes += 30;
        }
      }
    }

    // Secondary fallback: standard OPD slots (Morning & Evening) so an approved doctor always has bookable slots
    if (candidateSlots.length === 0) {
      candidateSlots = [
        '09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30',
        '17:00', '17:30', '18:00', '18:30', '19:00', '19:30'
      ];
    }

    // Check for schedule override (delay / leave)
    const cleanDate = (date ? String(date).split('T')[0] : new Date().toISOString().split('T')[0]).trim();
    let override: any = null;
    try {
      override = await (this.prisma as any).doctorScheduleOverride?.findFirst({
        where: {
          doctorId: { in: [doctor.id, doctor.userId] },
          date: cleanDate,
        },
      });
    } catch {
      try {
        const rows: any = await this.prisma.$queryRawUnsafe(`
          SELECT * FROM "DoctorScheduleOverride"
          WHERE ("doctorId" = $1 OR "doctorId" = $2) AND "date" = $3
          ORDER BY "updatedAt" DESC LIMIT 1
        `, doctor.id, doctor.userId, cleanDate);
        override = rows?.[0] || null;
      } catch (sqlErr: any) {
        console.warn('[doctors] raw SQL slot override lookup failed:', sqlErr?.message);
      }
    }

    if (override?.isOnLeave) {
      return {
        date: cleanDate,
        doctorId: doctor.id,
        slots: [],
        isOnLeave: true,
        leaveReason: override.reason || 'Doctor is on leave on this date',
      };
    }

    const delayMinutes = override?.delayMinutes || 0;
    if (delayMinutes > 0) {
      candidateSlots = candidateSlots.map((slot) => this.shift24hTime(slot, delayMinutes));
    }

    const bookedAppointments = await this.prisma.appointment.findMany({
      where: {
        doctorId: { in: [doctor.id, doctor.userId] },
        date: cleanDate,
        status: { in: ['CONFIRMED', 'PENDING'] },
      },
      select: { startTime: true },
    });

    // Count bookings per time slot to support patientsPerSlot
    const patientsPerSlot = (doctor as any).patientsPerSlot || 1;
    const bookedCountByTime = new Map<string, number>();
    for (const apt of bookedAppointments) {
      const slotKey = apt.startTime.slice(0, 5);
      bookedCountByTime.set(slotKey, (bookedCountByTime.get(slotKey) || 0) + 1);
    }

    const now = new Date();
    const todayIso = now.toISOString().slice(0, 10);
    const localYear = now.getFullYear();
    const localMonth = String(now.getMonth() + 1).padStart(2, '0');
    const localDay = String(now.getDate()).padStart(2, '0');
    const todayLocal = `${localYear}-${localMonth}-${localDay}`;
    const isToday = cleanDate === todayIso || cleanDate === todayLocal;
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    const availableSlots = candidateSlots.filter((slot) => {
      // Check if slot is still under patient capacity
      const bookedCount = bookedCountByTime.get(slot) || 0;
      if (bookedCount >= patientsPerSlot) return false;

      // If slot is for today, enforce that past slots and slots within 15 mins are hidden
      if (isToday) {
        const [h, m] = slot.split(':').map(Number);
        const slotMinutes = h * 60 + m;
        // Only allow booking before 15 mins (slot time - current time >= 15)
        if (slotMinutes - currentMinutes < 15) {
          return false;
        }
      }
      return true;
    });

    return {
      date: cleanDate,
      doctorId: doctor.id,
      patientsPerSlot,
      slots: availableSlots,
      delayMinutes,
      delayReason: override?.reason || null,
      isOnLeave: false,
    };
  }

  private shift24hTime(timeStr: string, shiftMins: number): string {
    const parts = timeStr.split(':');
    const h = parseInt(parts[0], 10) || 0;
    const m = parseInt(parts[1], 10) || 0;
    const total = h * 60 + m + shiftMins;
    const wrapped = ((total % 1440) + 1440) % 1440;
    const newH = Math.floor(wrapped / 60);
    const newM = wrapped % 60;
    return `${String(newH).padStart(2, '0')}:${String(newM).padStart(2, '0')}`;
  }

  async applyScheduleDelay(
    doctorId: string | undefined,
    date: string,
    delayMinutes: number,
    reason?: string,
    currentUser?: any
  ) {
    const doctor = await this.prisma.doctor.findFirst({
      where: {
        OR: [
          ...(doctorId ? [{ id: doctorId }, { userId: doctorId }] : []),
          ...(currentUser?.id ? [{ userId: currentUser.id }, { id: currentUser.id }] : []),
        ],
      },
    });
    if (!doctor) throw new NotFoundException('Doctor not found.');

    const cleanReason = reason?.trim() || 'Clinical emergency / OPD delay';
    const cleanDate = (date ? String(date).split('T')[0] : new Date().toISOString().split('T')[0]).trim();
    const id = (require('crypto').randomUUID ? require('crypto').randomUUID() : `dso_${Date.now()}`);

    try {
      await (this.prisma as any).doctorScheduleOverride?.upsert({
        where: {
          doctorId_date: {
            doctorId: doctor.id,
            date: cleanDate,
          },
        },
        create: {
          id,
          doctorId: doctor.id,
          date: cleanDate,
          delayMinutes,
          isOnLeave: false,
          reason: cleanReason,
        },
        update: {
          delayMinutes,
          isOnLeave: false,
          reason: cleanReason,
        },
      });
    } catch (err: any) {
      console.warn('[doctors] Prisma delay upsert failed, attempting raw SQL:', err?.message);
      try {
        await this.prisma.$executeRawUnsafe(`
          INSERT INTO "DoctorScheduleOverride" ("id", "doctorId", "date", "delayMinutes", "isOnLeave", "reason", "updatedAt", "createdAt")
          VALUES ($1, $2, $3, $4, false, $5, NOW(), NOW())
          ON CONFLICT ("doctorId", "date")
          DO UPDATE SET "delayMinutes" = $4, "isOnLeave" = false, "reason" = $5, "updatedAt" = NOW()
        `, id, doctor.id, cleanDate, delayMinutes, cleanReason);
      } catch (sqlErr: any) {
        console.error('[doctors] Raw SQL delay upsert also failed:', sqlErr?.message);
      }
    }

    // Update existing active appointments with delay tag
    const appointments = await this.prisma.appointment.findMany({
      where: {
        doctorId: { in: [doctor.id, doctor.userId] },
        date: cleanDate,
        status: { in: ['PENDING', 'CONFIRMED'] },
      },
      include: { patient: true },
    });

    for (const apt of appointments) {
      const cleanNotes = (apt.notes || '').replace(/\[(?:Delayed|Postponed):[^\]]*\]/gi, '').trim();
      const updatedNotes = cleanNotes
        ? `${cleanNotes} [Delayed: +${delayMinutes}m. Reason: ${cleanReason}]`
        : `[Delayed: +${delayMinutes}m. Reason: ${cleanReason}]`;

      await this.prisma.appointment.update({
        where: { id: apt.id },
        data: { notes: updatedNotes },
      });

      // Send patient notification
      if (apt.patient?.userId) {
        try {
          const shiftedTime = this.shift24hTime(apt.startTime, delayMinutes);
          await this.prisma.notification.create({
            data: {
              userId: apt.patient.userId,
              type: 'SCHEDULE_DELAY',
              title: `⚠️ OPD Delay (+${delayMinutes}m)`,
              message: `Dr. ${doctor.fullName} is delayed by ~${delayMinutes} mins on ${cleanDate}. Your updated appointment time is approximately ${shiftedTime}. Reason: ${cleanReason}.`,
            },
          });
        } catch (notifErr: any) {
          console.warn('[doctors] Notification failed:', notifErr?.message);
        }
      }
    }

    return {
      success: true,
      doctorId: doctor.id,
      date: cleanDate,
      delayMinutes,
      reason: cleanReason,
      affectedAppointments: appointments.length,
    };
  }

  async applyScheduleLeave(
    doctorId: string | undefined,
    date: string,
    reason?: string,
    currentUser?: any
  ) {
    const doctor = await this.prisma.doctor.findFirst({
      where: {
        OR: [
          ...(doctorId ? [{ id: doctorId }, { userId: doctorId }] : []),
          ...(currentUser?.id ? [{ userId: currentUser.id }, { id: currentUser.id }] : []),
        ],
      },
    });
    if (!doctor) throw new NotFoundException('Doctor not found.');

    const cleanReason = reason?.trim() || 'Personal / Medical leave';
    const cleanDate = (date ? String(date).split('T')[0] : new Date().toISOString().split('T')[0]).trim();
    const id = (require('crypto').randomUUID ? require('crypto').randomUUID() : `dso_${Date.now()}`);

    try {
      await (this.prisma as any).doctorScheduleOverride?.upsert({
        where: {
          doctorId_date: {
            doctorId: doctor.id,
            date: cleanDate,
          },
        },
        create: {
          id,
          doctorId: doctor.id,
          date: cleanDate,
          delayMinutes: 0,
          isOnLeave: true,
          reason: cleanReason,
        },
        update: {
          delayMinutes: 0,
          isOnLeave: true,
          reason: cleanReason,
        },
      });
    } catch (err: any) {
      console.warn('[doctors] Prisma leave upsert failed, attempting raw SQL:', err?.message);
      try {
        await this.prisma.$executeRawUnsafe(`
          INSERT INTO "DoctorScheduleOverride" ("id", "doctorId", "date", "delayMinutes", "isOnLeave", "reason", "updatedAt", "createdAt")
          VALUES ($1, $2, $3, 0, true, $4, NOW(), NOW())
          ON CONFLICT ("doctorId", "date")
          DO UPDATE SET "delayMinutes" = 0, "isOnLeave" = true, "reason" = $4, "updatedAt" = NOW()
        `, id, doctor.id, cleanDate, cleanReason);
      } catch (sqlErr: any) {
        console.error('[doctors] Raw SQL leave upsert also failed:', sqlErr?.message);
      }
    }

    // Cancel all active appointments for this date
    const appointments = await this.prisma.appointment.findMany({
      where: {
        doctorId: { in: [doctor.id, doctor.userId] },
        date: cleanDate,
        status: { in: ['PENDING', 'CONFIRMED'] },
      },
      include: { patient: true },
    });

    for (const apt of appointments) {
      const cleanNotes = (apt.notes || '').replace(/\[Cancelled:[^\]]*\]/gi, '').trim();
      const updatedNotes = cleanNotes
        ? `${cleanNotes} [Cancelled: Doctor on leave - ${cleanReason}]`
        : `[Cancelled: Doctor on leave - ${cleanReason}]`;

      await this.prisma.appointment.update({
        where: { id: apt.id },
        data: {
          status: 'CANCELLED',
          notes: updatedNotes,
        },
      });

      if (apt.patient?.userId) {
        try {
          await this.prisma.notification.create({
            data: {
              userId: apt.patient.userId,
              type: 'SCHEDULE_LEAVE',
              title: '❌ Appointment Cancelled — Doctor on Leave',
              message: `Dr. ${doctor.fullName} will be on leave on ${cleanDate} (${cleanReason}). Your appointment has been cancelled. Full refund/rescheduling is enabled in the app.`,
            },
          });
        } catch (notifErr: any) {
          console.warn('[doctors] Notification failed:', notifErr?.message);
        }
      }
    }

    return {
      success: true,
      doctorId: doctor.id,
      date: cleanDate,
      isOnLeave: true,
      reason: cleanReason,
      cancelledAppointments: appointments.length,
    };
  }

  async undoScheduleOverride(
    doctorId: string | undefined,
    date: string,
    action: 'delay' | 'leave',
    currentUser?: any
  ) {
    const doctor = await this.prisma.doctor.findFirst({
      where: {
        OR: [
          ...(doctorId ? [{ id: doctorId }, { userId: doctorId }] : []),
          ...(currentUser?.id ? [{ userId: currentUser.id }, { id: currentUser.id }] : []),
        ],
      },
    });
    if (!doctor) throw new NotFoundException('Doctor not found.');

    const cleanDate = (date ? String(date).split('T')[0] : new Date().toISOString().split('T')[0]).trim();
    const id = (require('crypto').randomUUID ? require('crypto').randomUUID() : `dso_${Date.now()}`);

    try {
      if (action === 'delay') {
        await (this.prisma as any).doctorScheduleOverride?.upsert({
          where: { doctorId_date: { doctorId: doctor.id, date: cleanDate } },
          create: { id, doctorId: doctor.id, date: cleanDate, delayMinutes: 0, isOnLeave: false },
          update: { delayMinutes: 0, reason: null },
        });

        // Clean delay note tag from appointments
        const appointments = await this.prisma.appointment.findMany({
          where: { doctorId: { in: [doctor.id, doctor.userId] }, date: cleanDate },
          include: { patient: true },
        });
        for (const apt of appointments) {
          if (apt.notes?.includes('[Delayed:')) {
            const clean = apt.notes.replace(/\[(?:Delayed|Postponed):[^\]]*\]/gi, '').trim();
            await this.prisma.appointment.update({
              where: { id: apt.id },
              data: { notes: clean },
            });
          }
          if (apt.patient?.userId) {
            try {
              await this.prisma.notification.create({
                data: {
                  userId: apt.patient.userId,
                  type: 'SCHEDULE_RESTORED',
                  title: 'Schedule Restored',
                  message: `Dr. ${doctor.fullName}'s delay has been resolved. Consultation is proceeding at normal scheduled time.`,
                },
              });
            } catch {}
          }
        }
      } else {
        await (this.prisma as any).doctorScheduleOverride?.upsert({
          where: { doctorId_date: { doctorId: doctor.id, date: cleanDate } },
          create: { id, doctorId: doctor.id, date: cleanDate, delayMinutes: 0, isOnLeave: false },
          update: { isOnLeave: false, reason: null },
        });
      }
    } catch (err: any) {
      console.warn('[doctors] Prisma undo failed, attempting raw SQL:', err?.message);
      try {
        if (action === 'delay') {
          await this.prisma.$executeRawUnsafe(`
            INSERT INTO "DoctorScheduleOverride" ("id", "doctorId", "date", "delayMinutes", "isOnLeave", "reason", "updatedAt", "createdAt")
            VALUES ($1, $2, $3, 0, false, NULL, NOW(), NOW())
            ON CONFLICT ("doctorId", "date")
            DO UPDATE SET "delayMinutes" = 0, "reason" = NULL, "updatedAt" = NOW()
          `, id, doctor.id, cleanDate);
        } else {
          await this.prisma.$executeRawUnsafe(`
            INSERT INTO "DoctorScheduleOverride" ("id", "doctorId", "date", "delayMinutes", "isOnLeave", "reason", "updatedAt", "createdAt")
            VALUES ($1, $2, $3, 0, false, NULL, NOW(), NOW())
            ON CONFLICT ("doctorId", "date")
            DO UPDATE SET "isOnLeave" = false, "reason" = NULL, "updatedAt" = NOW()
          `, id, doctor.id, cleanDate);
        }
      } catch (sqlErr: any) {
        console.error('[doctors] Raw SQL undo also failed:', sqlErr?.message);
      }
    }

    return {
      success: true,
      doctorId: doctor.id,
      date: cleanDate,
      action,
      reverted: true,
    };
  }

  async getScheduleStatus(doctorId: string, date: string) {
    const doctor = await this.prisma.doctor.findFirst({
      where: {
        OR: [
          { id: doctorId },
          { userId: doctorId },
        ],
      },
    });
    if (!doctor) throw new NotFoundException('Doctor not found.');

    const cleanDate = (date ? String(date).split('T')[0] : new Date().toISOString().split('T')[0]).trim();

    let override: any = null;
    try {
      override = await (this.prisma as any).doctorScheduleOverride?.findFirst({
        where: {
          doctorId: { in: [doctor.id, doctor.userId] },
          date: cleanDate,
        },
      });
    } catch {
      try {
        const rows: any = await this.prisma.$queryRawUnsafe(`
          SELECT * FROM "DoctorScheduleOverride"
          WHERE ("doctorId" = $1 OR "doctorId" = $2) AND "date" = $3
          ORDER BY "updatedAt" DESC LIMIT 1
        `, doctor.id, doctor.userId, cleanDate);
        override = rows?.[0] || null;
      } catch (sqlErr: any) {
        console.warn('[doctors] Raw SQL getScheduleStatus lookup failed:', sqlErr?.message);
      }
    }

    return {
      doctorId: doctor.id,
      date: cleanDate,
      delayMinutes: override?.delayMinutes || 0,
      delayReason: override?.reason || null,
      isOnLeave: Boolean(override?.isOnLeave),
      leaveReason: override?.isOnLeave ? (override?.reason || 'Doctor on leave') : null,
    };
  }

  async getScheduleOverrides(doctorId: string, startDate?: string, endDate?: string) {
    const doctor = await this.prisma.doctor.findFirst({
      where: {
        OR: [
          { id: doctorId },
          { userId: doctorId },
        ],
      },
    });
    if (!doctor) throw new NotFoundException('Doctor not found.');

    const cleanStart = startDate ? startDate.split('T')[0] : new Date().toISOString().split('T')[0];
    let overrides: any[] = [];
    try {
      overrides = await (this.prisma as any).doctorScheduleOverride?.findMany({
        where: {
          doctorId: { in: [doctor.id, doctor.userId] },
          ...(endDate
            ? { date: { gte: cleanStart, lte: endDate.split('T')[0] } }
            : { date: { gte: cleanStart } }),
        },
        orderBy: { date: 'asc' },
      });
    } catch {
      try {
        const rows: any = await this.prisma.$queryRawUnsafe(`
          SELECT * FROM "DoctorScheduleOverride"
          WHERE ("doctorId" = $1 OR "doctorId" = $2)
          ORDER BY "date" ASC
        `, doctor.id, doctor.userId);
        overrides = rows || [];
      } catch (sqlErr: any) {
        console.warn('[doctors] Raw SQL getScheduleOverrides lookup failed:', sqlErr?.message);
      }
    }

    const map: Record<string, {
      doctorId: string;
      date: string;
      delayMinutes: number;
      delayReason: string | null;
      isOnLeave: boolean;
      leaveReason: string | null;
    }> = {};

    for (const ov of overrides || []) {
      map[ov.date] = {
        doctorId: doctor.id,
        date: ov.date,
        delayMinutes: ov.delayMinutes || 0,
        delayReason: ov.reason || null,
        isOnLeave: Boolean(ov.isOnLeave),
        leaveReason: ov.isOnLeave ? (ov.reason || 'Doctor on leave') : null,
      };
    }

    return map;
  }
}

