import { ForbiddenException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { VerificationStatus, Role } from '@prisma/client';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class DoctorsService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

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
      avatar: doc.profilePhoto || doc.user?.profilePhoto || null,
      profilePhoto: doc.profilePhoto || doc.user?.profilePhoto || null,
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

  async searchDoctors(
    query?: string,
    specialty?: string,
    lat?: number,
    lng?: number,
    filters?: {
      minFee?: number;
      maxFee?: number;
      mode?: string;
      limit?: number;
      offset?: number;
      sortBy?: string;
    }
  ) {
    const whereClause: any = {};

    if (specialty && specialty !== 'All') {
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

    if (filters?.minFee !== undefined || filters?.maxFee !== undefined) {
      whereClause.consultationFee = {};
      if (filters.minFee !== undefined) whereClause.consultationFee.gte = filters.minFee;
      if (filters.maxFee !== undefined) whereClause.consultationFee.lte = filters.maxFee;
    }

    if (filters?.mode) {
      const upperMode = filters.mode.toUpperCase() as any;
      if (upperMode === 'CLINIC' || upperMode === 'VIDEO') {
        whereClause.consultationModes = { has: upperMode };
      }
    }

    const doctors = await this.prisma.doctor.findMany({
      where: whereClause,
      include: {
        user: true,
        qualifications: true,
        clinic: true,
        verification: true,
        availabilities: true,
      },
      take: filters?.limit ? Number(filters.limit) : undefined,
      skip: filters?.offset ? Number(filters.offset) : undefined,
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
    return formatted.sort((a, b) => {
      if (a.distanceKm != null && b.distanceKm != null) return a.distanceKm - b.distanceKm;
      if (a.distanceKm != null) return -1;
      if (b.distanceKm != null) return 1;
      return (a.name || '').localeCompare(b.name || '');
    });
  }

  async getMyDoctorProfile(currentUser: any) {
    if (!currentUser?.id) throw new UnauthorizedException('Authentication required.');
    let doctor =
      (await this.prisma.doctor.findFirst({
        where: {
          OR: [
            { userId: currentUser.id },
            ...(currentUser.doctor?.id ? [{ id: currentUser.doctor.id }] : []),
          ],
        },
        include: {
          qualifications: true,
          clinic: true,
          verification: true,
          availabilities: true,
        },
      })) ||
      (currentUser.doctor?.id
        ? await this.prisma.doctor.findUnique({
            where: { id: currentUser.doctor.id },
            include: { qualifications: true, clinic: true, verification: true, availabilities: true },
          })
        : null);

    if (!doctor && currentUser.role === Role.DOCTOR) {
      const doctorName = (currentUser.email ? currentUser.email.split('@')[0] : 'Doctor');
      const cleanName = doctorName.startsWith('Dr.') ? doctorName : `Dr. ${doctorName}`;
      const defaultAvailabilities: { dayOfWeek: number; startTime: string; endTime: string; slotDurationMinutes: number }[] = [];
      for (let day = 1; day <= 6; day++) {
        defaultAvailabilities.push(
          { dayOfWeek: day, startTime: '09:00', endTime: '13:00', slotDurationMinutes: 30 },
          { dayOfWeek: day, startTime: '17:00', endTime: '20:00', slotDurationMinutes: 30 },
        );
      }
      try {
        doctor = await this.prisma.doctor.create({
          data: {
            userId: currentUser.id,
            fullName: cleanName,
            specialization: 'General Medicine',
            consultationFee: 500,
            clinic: {
              create: {
                name: `${cleanName}'s Clinic`,
                address: 'Clinical Practice Address Pending',
                timings: '09:00 - 13:00, 17:00 - 20:00',
              },
            },
            availabilities: {
              create: defaultAvailabilities,
            },
            verification: {
              create: {
                registrationNumber: `NMC-${Date.now().toString().slice(-6)}`,
                registrationAuthority: 'National Medical Commission / State Council',
                status: VerificationStatus.PENDING,
              },
            },
          },
          include: {
            qualifications: true,
            clinic: true,
            verification: true,
            availabilities: true,
          },
        });
      } catch (err: any) {
        console.warn('[doctors] getMyDoctorProfile auto-heal failed:', err?.message);
      }
    }

    if (!doctor) throw new NotFoundException('Doctor profile not found for this account.');
    return this.formatDoctor(doctor);
  }

  async updateDoctorAvailability(
    currentUser: any,
    availabilities: { dayOfWeek: number; startTime: string; endTime: string; slotDurationMinutes?: number }[]
  ) {
    if (!currentUser?.id) throw new UnauthorizedException('Authentication required.');
    const doctor =
      (await this.prisma.doctor.findFirst({
        where: {
          OR: [
            { userId: currentUser.id },
            ...(currentUser.doctor?.id ? [{ id: currentUser.doctor.id }] : []),
          ],
        },
      })) ||
      (currentUser.doctor?.id
        ? await this.prisma.doctor.findUnique({
            where: { id: currentUser.doctor.id },
          })
        : null);

    if (!doctor) throw new NotFoundException('Doctor profile not found.');

    await this.prisma.$transaction(async (tx) => {
      await tx.availability.deleteMany({
        where: { doctorId: doctor.id },
      });

      if (availabilities && availabilities.length > 0) {
        await tx.availability.createMany({
          data: availabilities.map((a) => ({
            doctorId: doctor.id,
            dayOfWeek: Number(a.dayOfWeek),
            startTime: a.startTime.trim().slice(0, 5),
            endTime: a.endTime.trim().slice(0, 5),
            slotDurationMinutes: Number(a.slotDurationMinutes) || 30,
          })),
        });
      }
    }, { maxWait: 5000, timeout: 10000 });

    return this.getMyDoctorProfile(currentUser);
  }

  async getDoctorById(id: string, currentUser?: any) {
    if (id === 'me' && currentUser) {
      return this.getMyDoctorProfile(currentUser);
    }

    const doctor =
      (await this.prisma.doctor.findUnique({
        where: { id },
        include: {
          qualifications: true,
          clinic: true,
          verification: true,
          availabilities: true,
        },
      })) ||
      (await this.prisma.doctor.findFirst({
        where: {
          OR: [{ id }, { userId: id }],
        },
        include: {
          user: true,
          qualifications: true,
          clinic: true,
          verification: true,
          availabilities: true,
        },
      }));

    if (!doctor) {
      throw new NotFoundException('Doctor not found or pending verification.');
    }

    const isOwner = currentUser && (currentUser.id === doctor.userId || currentUser.doctor?.id === doctor.id);
    const isAdmin = currentUser?.role === 'ADMIN';

    if (doctor.verification?.status !== VerificationStatus.VERIFIED && !isOwner && !isAdmin) {
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
    let doctor = await this.prisma.doctor.findUnique({
      where: { userId },
      include: { verification: true, availabilities: true },
    });

    if (!doctor) {
      const user = await this.prisma.user.findUnique({ where: { id: userId } });
      if (user && user.role === Role.DOCTOR) {
        const doctorName = (user.email ? user.email.split('@')[0] : 'Doctor');
        const cleanName = dto.fullName?.trim() || (doctorName.startsWith('Dr.') ? doctorName : `Dr. ${doctorName}`);
        const defaultAvailabilities: { dayOfWeek: number; startTime: string; endTime: string; slotDurationMinutes: number }[] = [];
        for (let day = 1; day <= 6; day++) {
          defaultAvailabilities.push(
            { dayOfWeek: day, startTime: '09:00', endTime: '13:00', slotDurationMinutes: 30 },
            { dayOfWeek: day, startTime: '17:00', endTime: '20:00', slotDurationMinutes: 30 },
          );
        }
        try {
          doctor = await this.prisma.doctor.create({
            data: {
              userId: user.id,
              fullName: cleanName,
              specialization: dto.specialization?.trim() || 'General Medicine',
              consultationFee: dto.consultationFee && dto.consultationFee > 0 ? dto.consultationFee : 500,
              clinic: {
                create: {
                  name: dto.clinicName?.trim() || `${cleanName}'s Clinic`,
                  address: dto.clinicAddress?.trim() || 'Clinical Practice Address Pending',
                  timings: dto.clinicTimings?.trim() || '09:00 - 13:00, 17:00 - 20:00',
                },
              },
              availabilities: {
                create: defaultAvailabilities,
              },
              verification: {
                create: {
                  registrationNumber: `NMC-${Date.now().toString().slice(-6)}`,
                  registrationAuthority: 'National Medical Commission / State Council',
                  status: VerificationStatus.PENDING,
                },
              },
            },
            include: { verification: true, availabilities: true },
          });
        } catch (err: any) {
          console.warn('[doctors] updateDoctorProfile auto-heal failed:', err?.message);
        }
      }
    }

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
          await this.prisma.$transaction(async (tx) => {
            await tx.availability.deleteMany({ where: { doctorId: doctor.id } });
            await tx.availability.createMany({ data: newAvailabilities });
          }, { maxWait: 5000, timeout: 10000 });
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
      // Full replace with provided schedule inside an atomic transaction
      const newAvails = dto.availabilities.map((a) => ({
        doctorId: doctor.id,
        dayOfWeek: a.dayOfWeek,
        startTime: a.startTime,
        endTime: a.endTime,
        slotDurationMinutes: a.slotDurationMinutes || dto.slotDurationMinutes || 30,
      }));
      await this.prisma.$transaction(async (tx) => {
        await tx.availability.deleteMany({ where: { doctorId: doctor.id } });
        await tx.availability.createMany({ data: newAvails });
      }, { maxWait: 5000, timeout: 10000 });
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
    const doctor =
      (await this.prisma.doctor.findFirst({
        where: {
          OR: [
            { id: doctorId },
            { userId: doctorId },
          ],
        },
        include: { availabilities: true, clinic: true },
      })) ||
      (await this.prisma.doctor.findUnique({
        where: { id: doctorId },
        include: { availabilities: true, clinic: true },
      }));
    if (!doctor) throw new NotFoundException('Doctor not found');

    const dateObj = new Date(`${date}T00:00:00`);
    if (isNaN(dateObj.getTime())) {
      throw new NotFoundException('Invalid date format. Expected YYYY-MM-DD.');
    }
    const dayOfWeek = dateObj.getDay();

    // Check for schedule override (delay / leave / custom slots / capacity)
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
        allGeneratedSlots: [],
        isOnLeave: true,
        leaveReason: override.reason || 'Doctor is on leave on this date',
      };
    }

    const matchingAvailabilities = (doctor.availabilities || []).filter(
      (a) => a.dayOfWeek === dayOfWeek
    );

    let candidateSlots: string[] = [];

    if (matchingAvailabilities.length > 0) {
      for (const avail of matchingAvailabilities) {
        const slotDuration = override?.slotDurationMinutes || avail.slotDurationMinutes || 15;
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
    } else if (doctor.clinic?.timings && (!doctor.availabilities || doctor.availabilities.length === 0)) {
      // Fallback: parse clinic timings string if doctor has no explicit availabilities configured
      const intervals = this.parseTimingsToIntervals(doctor.clinic.timings);
      const slotDuration = override?.slotDurationMinutes || 15;
      for (const interval of intervals) {
        const [startH, startM] = interval.startTime.split(':').map(Number);
        const [endH, endM] = interval.endTime.split(':').map(Number);
        let currentMinutes = startH * 60 + startM;
        const endMinutes = endH * 60 + endM;
        while (currentMinutes + slotDuration <= endMinutes) {
          const h = Math.floor(currentMinutes / 60);
          const m = currentMinutes % 60;
          candidateSlots.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
          currentMinutes += slotDuration;
        }
      }
    }

    // Combine with customSlots and remove blockedSlots
    const blockedSet = new Set(Array.isArray(override?.blockedSlots) ? override.blockedSlots : []);
    const customList = Array.isArray(override?.customSlots) ? override.customSlots : [];

    let candidateSlotsCombined = Array.from(new Set([...candidateSlots, ...customList]))
      .filter((slot) => !blockedSet.has(slot));

    // Sort chronologically
    candidateSlotsCombined.sort((a, b) => {
      const [ha, ma] = a.split(':').map(Number);
      const [hb, mb] = b.split(':').map(Number);
      return (ha * 60 + ma) - (hb * 60 + mb);
    });

    const delayMinutes = override?.delayMinutes || 0;
    if (delayMinutes > 0) {
      candidateSlotsCombined = candidateSlotsCombined.map((slot) => this.shift24hTime(slot, delayMinutes));
    }

    // Parse break intervals configured by doctor
    let activeBreaks: { id: string; title: string; startTime: string; endTime: string }[] = [];
    if (override?.breaks) {
      if (Array.isArray(override.breaks)) {
        activeBreaks = override.breaks;
      } else if (typeof override.breaks === 'string') {
        try {
          activeBreaks = JSON.parse(override.breaks);
        } catch {}
      }
    }

    const slotDurationMins = override?.slotDurationMinutes || 15;

    const bookedAppointments = await this.prisma.appointment.findMany({
      where: {
        doctorId: { in: [doctor.id, doctor.userId] },
        date: cleanDate,
        status: { in: ['CONFIRMED', 'PENDING'] },
      },
      select: { startTime: true },
    });

    // Count bookings per time slot to support patientsPerSlot
    const patientsPerSlot = override?.patientsPerSlot || (doctor as any).patientsPerSlot || 1;
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

    const availableSlots = candidateSlotsCombined.filter((slot) => {
      // Check if slot falls in any break
      const [h, m] = slot.split(':').map(Number);
      const slotStart = h * 60 + m;
      const slotEnd = slotStart + slotDurationMins;

      const inBreak = activeBreaks.some((b) => {
        const [bh, bm] = b.startTime.split(':').map(Number);
        const [eh, em] = b.endTime.split(':').map(Number);
        const bStart = bh * 60 + bm;
        const bEnd = eh * 60 + em;
        return slotStart < bEnd && slotEnd > bStart;
      });
      if (inBreak) return false;

      // Check if slot is still under patient capacity
      const bookedCount = bookedCountByTime.get(slot) || 0;
      if (bookedCount >= patientsPerSlot) return false;

      // If slot is for today, enforce that past slots and slots within 15 mins are hidden
      if (isToday) {
        // Only allow booking before 15 mins (slot time - current time >= 15)
        if (slotStart - currentMinutes < 15) {
          return false;
        }
      }
      return true;
    });

    return {
      date: cleanDate,
      doctorId: doctor.id,
      patientsPerSlot,
      slotDurationMinutes: slotDurationMins,
      slots: availableSlots,
      allGeneratedSlots: candidateSlotsCombined,
      breaks: activeBreaks,
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

    if (currentUser) {
      const isOwner = currentUser.id === doctor.userId || currentUser.doctor?.id === doctor.id;
      const isAdmin = currentUser.role === 'ADMIN';
      if (!isOwner && !isAdmin) {
        throw new ForbiddenException('You can only modify schedule overrides for your own doctor account.');
      }
    }

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

      // Send patient notification and dispatch push
      if (apt.patient?.userId) {
        try {
          const shiftedTime = this.shift24hTime(apt.startTime, delayMinutes);
          await this.notificationsService.create({
            userId: apt.patient.userId,
            type: 'SCHEDULE_DELAY',
            title: `⚠️ OPD Delay (+${delayMinutes}m)`,
            message: `Dr. ${doctor.fullName} is delayed by ~${delayMinutes} mins on ${cleanDate}. Your updated appointment time is approximately ${shiftedTime}. Reason: ${cleanReason}.`,
            payload: { appointmentId: apt.id, date: cleanDate, delayMinutes },
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
    dateOrStartDate: string,
    reason?: string,
    currentUser?: any,
    endDate?: string,
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

    if (currentUser) {
      const isOwner = currentUser.id === doctor.userId || currentUser.doctor?.id === doctor.id;
      const isAdmin = currentUser.role === 'ADMIN';
      if (!isOwner && !isAdmin) {
        throw new ForbiddenException('You can only modify schedule overrides for your own doctor account.');
      }
    }

    const cleanReason = reason?.trim() || 'Personal / Medical leave';
    const startStr = (dateOrStartDate ? String(dateOrStartDate).split('T')[0] : new Date().toISOString().split('T')[0]).trim();
    const endStr = endDate ? String(endDate).split('T')[0].trim() : startStr;

    // Collect all dates in range [startStr, endStr]
    const datesToApply: string[] = [];
    const curr = new Date(`${startStr}T00:00:00Z`);
    const end = new Date(`${endStr}T00:00:00Z`);

    if (curr > end) {
      datesToApply.push(startStr);
    } else {
      while (curr <= end) {
        datesToApply.push(curr.toISOString().split('T')[0]);
        curr.setUTCDate(curr.getUTCDate() + 1);
      }
    }

    let totalCancelled = 0;

    for (const cleanDate of datesToApply) {
      const id = require('crypto').randomUUID ? require('crypto').randomUUID() : `dso_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

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
            await this.notificationsService.create({
              userId: apt.patient.userId,
              type: 'SCHEDULE_LEAVE',
              title: '❌ Appointment Cancelled — Doctor on Leave',
              message: `Dr. ${doctor.fullName} will be on leave on ${cleanDate} (${cleanReason}). Your appointment has been cancelled. Full refund/rescheduling is enabled in the app.`,
              payload: { appointmentId: apt.id, date: cleanDate },
            });
          } catch (notifErr: any) {
            console.warn('[doctors] Notification failed:', notifErr?.message);
          }
        }
      }

      totalCancelled += appointments.length;
    }

    return {
      success: true,
      doctorId: doctor.id,
      startDate: startStr,
      endDate: endStr,
      dates: datesToApply,
      isOnLeave: true,
      reason: cleanReason,
      cancelledAppointments: totalCancelled,
    };
  }

  async applyEarlyDeparture(
    doctorId: string | undefined,
    date: string,
    cutoffTime: string,
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

    if (currentUser) {
      const isOwner = currentUser.id === doctor.userId || currentUser.doctor?.id === doctor.id;
      const isAdmin = currentUser.role === 'ADMIN';
      if (!isOwner && !isAdmin) {
        throw new ForbiddenException('You can only modify schedule overrides for your own doctor account.');
      }
    }

    const cleanReason = reason?.trim() || 'Doctor ended clinic early / Emergency departure';
    const cleanDate = (date ? String(date).split('T')[0] : new Date().toISOString().split('T')[0]).trim();
    const cleanCutoff = (cutoffTime || '12:00').trim().slice(0, 5);

    // Cancel all active appointments on this date with startTime >= cutoffTime
    const appointments = await this.prisma.appointment.findMany({
      where: {
        doctorId: { in: [doctor.id, doctor.userId] },
        date: cleanDate,
        status: { in: ['PENDING', 'CONFIRMED'] },
      },
      include: { patient: true },
    });

    let affectedCount = 0;
    const cancelledSlotTimes: string[] = [];

    for (const apt of appointments) {
      if (apt.startTime >= cleanCutoff) {
        affectedCount++;
        cancelledSlotTimes.push(apt.startTime);
        const cleanNotes = (apt.notes || '').replace(/\[Cancelled:[^\]]*\]/gi, '').trim();
        const updatedNotes = cleanNotes
          ? `${cleanNotes} [Cancelled: Clinic ended early at ${cleanCutoff} - ${cleanReason}]`
          : `[Cancelled: Clinic ended early at ${cleanCutoff} - ${cleanReason}]`;

        await this.prisma.appointment.update({
          where: { id: apt.id },
          data: {
            status: 'CANCELLED',
            notes: updatedNotes,
          },
        });

        if (apt.patient?.userId) {
          try {
            await this.notificationsService.create({
              userId: apt.patient.userId,
              type: 'SCHEDULE_EARLY_DEPARTURE',
              title: '❌ Appointment Cancelled — Clinic Ended Early',
              message: `Dr. ${doctor.fullName} ended clinic early at ${cleanCutoff} today (${cleanReason}). Your appointment was cancelled. Rescheduling options are open in the app.`,
              payload: { appointmentId: apt.id, date: cleanDate },
            });
          } catch (notifErr: any) {
            console.warn('[doctors] Early departure notification failed:', notifErr?.message);
          }
        }
      }
    }

    // Persist early departure in DoctorScheduleOverride
    const id = (require('crypto').randomUUID ? require('crypto').randomUUID() : `dso_${Date.now()}`);
    try {
      const existing = await (this.prisma as any).doctorScheduleOverride?.findUnique({
        where: { doctorId_date: { doctorId: doctor.id, date: cleanDate } },
      });
      const prevBlocked = Array.isArray(existing?.blockedSlots) ? existing.blockedSlots : [];
      const updatedBlocked = Array.from(new Set([...prevBlocked, ...cancelledSlotTimes]));

      await (this.prisma as any).doctorScheduleOverride?.upsert({
        where: { doctorId_date: { doctorId: doctor.id, date: cleanDate } },
        create: {
          id,
          doctorId: doctor.id,
          date: cleanDate,
          delayMinutes: 0,
          isOnLeave: false,
          blockedSlots: updatedBlocked,
          reason: `[EarlyCutoff:${cleanCutoff}] ${cleanReason}`,
        },
        update: {
          blockedSlots: updatedBlocked,
          reason: `[EarlyCutoff:${cleanCutoff}] ${cleanReason}`,
        },
      });
    } catch (err: any) {
      console.warn('[doctors] Early departure override upsert warning:', err?.message);
    }

    return {
      success: true,
      doctorId: doctor.id,
      date: cleanDate,
      cutoffTime: cleanCutoff,
      reason: cleanReason,
      affectedAppointments: affectedCount,
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

    if (currentUser) {
      const isOwner = currentUser.id === doctor.userId || currentUser.doctor?.id === doctor.id;
      const isAdmin = currentUser.role === 'ADMIN';
      if (!isOwner && !isAdmin) {
        throw new ForbiddenException('You can only modify schedule overrides for your own doctor account.');
      }
    }

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

  async manageCustomSlot(
    doctorId: string | undefined,
    date: string,
    rawTime: string,
    action: 'add' | 'remove' | 'block',
    currentUser: any
  ) {
    const targetDocId = doctorId || currentUser?.doctorId || currentUser?.id;
    const doctor = await this.prisma.doctor.findFirst({
      where: {
        OR: [{ id: targetDocId }, { userId: targetDocId }, { userId: currentUser?.id }],
      },
    });
    if (!doctor) throw new NotFoundException('Doctor profile not found.');

    const cleanDate = (date ? String(date).split('T')[0] : new Date().toISOString().split('T')[0]).trim();

    // Normalize time to HH:mm (24-hour format)
    const match = rawTime.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
    let normalizedTime = rawTime.trim();
    if (match) {
      let h = parseInt(match[1], 10);
      const m = parseInt(match[2], 10);
      const meri = match[3]?.toUpperCase();
      if (meri === 'PM' && h !== 12) h += 12;
      if (meri === 'AM' && h === 12) h = 0;
      normalizedTime = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    }

    const existing = await this.prisma.doctorScheduleOverride.findFirst({
      where: {
        doctorId: { in: [doctor.id, doctor.userId] },
        date: cleanDate,
      },
    });

    let currentCustom = Array.isArray(existing?.customSlots) ? [...existing!.customSlots] : [];
    let currentBlocked = Array.isArray(existing?.blockedSlots) ? [...existing!.blockedSlots] : [];

    if (action === 'add') {
      if (!currentCustom.includes(normalizedTime)) {
        currentCustom.push(normalizedTime);
      }
      currentBlocked = currentBlocked.filter((t) => t !== normalizedTime);
    } else if (action === 'remove') {
      currentCustom = currentCustom.filter((t) => t !== normalizedTime);
      if (!currentBlocked.includes(normalizedTime)) {
        currentBlocked.push(normalizedTime);
      }
    } else if (action === 'block') {
      if (!currentBlocked.includes(normalizedTime)) {
        currentBlocked.push(normalizedTime);
      }
      currentCustom = currentCustom.filter((t) => t !== normalizedTime);
    }

    await this.prisma.doctorScheduleOverride.upsert({
      where: {
        doctorId_date: {
          doctorId: doctor.id,
          date: cleanDate,
        },
      },
      create: {
        doctorId: doctor.id,
        date: cleanDate,
        customSlots: currentCustom,
        blockedSlots: currentBlocked,
      },
      update: {
        customSlots: currentCustom,
        blockedSlots: currentBlocked,
      },
    });

    // Audit log entry
    if (currentUser?.id) {
      try {
        await this.prisma.auditLog.create({
          data: {
            actorUserId: currentUser.id,
            action: `SLOT_${action.toUpperCase()}`,
            targetType: 'DOCTOR_SCHEDULE',
            targetId: doctor.id,
            metadata: { date: cleanDate, time: normalizedTime, action },
          },
        });
      } catch {}
    }

    return this.generateAvailableSlots(doctor.id, cleanDate);
  }

  private normalizeTimeTo24(t: string): string {
    if (!t) return '12:00';
    const trimmed = t.trim();
    const match12 = trimmed.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
    if (match12) {
      let h = parseInt(match12[1], 10);
      const m = match12[2];
      const meri = match12[3]?.toUpperCase();
      if (meri === 'PM' && h !== 12) h += 12;
      if (meri === 'AM' && h === 12) h = 0;
      return `${String(h).padStart(2, '0')}:${m}`;
    }
    return trimmed.slice(0, 5);
  }

  async manageDoctorBreak(
    targetDocId: string,
    date: string,
    breakData: { id?: string; title: string; startTime: string; endTime: string },
    action: 'add' | 'remove',
    currentUser: any
  ) {
    const doctor = await this.prisma.doctor.findFirst({
      where: {
        OR: [{ id: targetDocId }, { userId: targetDocId }, { userId: currentUser?.id }],
      },
    });
    if (!doctor) throw new NotFoundException('Doctor profile not found.');

    const cleanDate = (date ? String(date).split('T')[0] : new Date().toISOString().split('T')[0]).trim();

    const existing = await this.prisma.doctorScheduleOverride.findFirst({
      where: {
        doctorId: { in: [doctor.id, doctor.userId] },
        date: cleanDate,
      },
    });

    let currentBreaks: any[] = [];
    if (existing?.breaks) {
      if (Array.isArray(existing.breaks)) currentBreaks = [...existing.breaks];
      else if (typeof existing.breaks === 'string') {
        try { currentBreaks = JSON.parse(existing.breaks); } catch {}
      }
    }

    const normStartTime = this.normalizeTimeTo24(breakData.startTime);
    const normEndTime = this.normalizeTimeTo24(breakData.endTime);
    const breakId = breakData.id || `brk_${Date.now()}`;

    if (action === 'add') {
      currentBreaks = currentBreaks.filter((b) => b.id !== breakId && !(b.startTime === normStartTime && b.endTime === normEndTime));
      currentBreaks.push({
        id: breakId,
        title: breakData.title?.trim() || 'Break',
        startTime: normStartTime,
        endTime: normEndTime,
      });
    } else if (action === 'remove') {
      currentBreaks = currentBreaks.filter((b) => b.id !== breakId && b.id !== breakData.id && !(b.startTime === normStartTime && b.endTime === normEndTime));
    }

    await this.prisma.doctorScheduleOverride.upsert({
      where: {
        doctorId_date: {
          doctorId: doctor.id,
          date: cleanDate,
        },
      },
      create: {
        doctorId: doctor.id,
        date: cleanDate,
        breaks: currentBreaks,
      },
      update: {
        breaks: currentBreaks,
      },
    });

    return this.generateAvailableSlots(doctor.id, cleanDate);
  }

  async getPatientPastConsultations(patientId: string) {
    const consultations = await this.prisma.consultation.findMany({
      where: {
        OR: [
          { patientId: patientId },
          { patient: { userId: patientId } },
        ],
      },
      include: {
        doctor: {
          select: {
            id: true,
            fullName: true,
            specialization: true,
            profilePhoto: true,
          },
        },
        prescription: true,
        appointment: {
          select: {
            id: true,
            date: true,
            startTime: true,
            status: true,
            symptoms: true,
            notes: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    return consultations.map((c) => ({
      id: c.id,
      appointmentId: c.appointmentId,
      date: c.appointment?.date || c.createdAt.toISOString().slice(0, 10),
      time: c.appointment?.startTime || '10:00',
      doctorName: c.doctor?.fullName || 'Doctor',
      doctorSpecialty: c.doctor?.specialization || 'General',
      doctorAvatar: c.doctor?.profilePhoto || null,
      diagnosis: c.prescription?.diagnosis || c.chiefComplaint || 'Consultation Record',
      notes: c.assessment || c.observations || c.appointment?.notes || '',
      vitals: c.prescription?.vitals || null,
      status: 'completed',
    }));
  }

  async updateScheduleSettings(
    dto: {
      doctorId?: string;
      date?: string;
      slotDurationMinutes?: number;
      patientsPerSlot?: number;
      morningStart?: string;
      morningEnd?: string;
      eveningStart?: string;
      eveningEnd?: string;
    },
    currentUser: any
  ) {
    const targetDocId = dto.doctorId || currentUser?.doctorId || currentUser?.id;
    const doctor = await this.prisma.doctor.findFirst({
      where: {
        OR: [{ id: targetDocId }, { userId: targetDocId }, { userId: currentUser?.id }],
      },
      include: { availabilities: true },
    });
    if (!doctor) throw new NotFoundException('Doctor profile not found.');

    const cleanDate = dto.date ? String(dto.date).split('T')[0].trim() : null;

    // 1. If date provided, update or create override for that date
    if (cleanDate) {
      await this.prisma.doctorScheduleOverride.upsert({
        where: {
          doctorId_date: {
            doctorId: doctor.id,
            date: cleanDate,
          },
        },
        create: {
          doctorId: doctor.id,
          date: cleanDate,
          slotDurationMinutes: dto.slotDurationMinutes,
          patientsPerSlot: dto.patientsPerSlot,
        },
        update: {
          ...(dto.slotDurationMinutes ? { slotDurationMinutes: dto.slotDurationMinutes } : {}),
          ...(dto.patientsPerSlot ? { patientsPerSlot: dto.patientsPerSlot } : {}),
        },
      });
    }

    // 2. Also update doctor default patientsPerSlot if provided
    if (dto.patientsPerSlot && dto.patientsPerSlot > 0) {
      await this.prisma.doctor.update({
        where: { id: doctor.id },
        data: { patientsPerSlot: dto.patientsPerSlot },
      });
    }

    // 3. Update shift availabilities (Mon-Sat, 1-6)
    const slotDuration = dto.slotDurationMinutes || 15;
    const to24 = (t?: string) => {
      if (!t) return null;
      const m = t.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
      if (!m) return t.trim();
      let h = Number(m[1]);
      const min = Number(m[2]);
      const meri = m[3]?.toUpperCase();
      if (meri === 'PM' && h !== 12) h += 12;
      if (meri === 'AM' && h === 12) h = 0;
      return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
    };

    const mStart = to24(dto.morningStart) || '10:30';
    const mEnd = to24(dto.morningEnd) || '13:30';
    const eStart = to24(dto.eveningStart) || '17:00';
    const eEnd = to24(dto.eveningEnd) || '20:00';

    if (dto.morningStart || dto.eveningStart || dto.slotDurationMinutes) {
      await this.prisma.availability.deleteMany({ where: { doctorId: doctor.id } });
      const newAvails = [1, 2, 3, 4, 5, 6].flatMap((dayOfWeek) => [
        { doctorId: doctor.id, dayOfWeek, startTime: mStart, endTime: mEnd, slotDurationMinutes: slotDuration },
        { doctorId: doctor.id, dayOfWeek, startTime: eStart, endTime: eEnd, slotDurationMinutes: slotDuration },
      ]);
      await this.prisma.availability.createMany({ data: newAvails });
    }

    // Audit log
    if (currentUser?.id) {
      try {
        await this.prisma.auditLog.create({
          data: {
            actorUserId: currentUser.id,
            action: 'SCHEDULE_SETTINGS_UPDATED',
            targetType: 'DOCTOR_SCHEDULE',
            targetId: doctor.id,
            metadata: dto as any,
          },
        });
      } catch {}
    }

    return {
      success: true,
      doctorId: doctor.id,
      date: cleanDate,
      patientsPerSlot: dto.patientsPerSlot || doctor.patientsPerSlot,
      slotDurationMinutes: slotDuration,
    };
  }
}

