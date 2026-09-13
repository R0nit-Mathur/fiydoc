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

  private formatDoctor(doc: any, userLat?: number, userLng?: number) {
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
      consultationModes: doc.consultationModes || ['CLINIC'],
      qualification: qualificationText,
      hospital: doc.clinic?.name || null,
      location: doc.clinic?.address || null,
      latitude: clinicLat,
      longitude: clinicLng,
      distanceKm,
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

    const formatted = doctors.map((d) => this.formatDoctor(d, lat, lng));
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
    return this.formatDoctor(doctor);
  }

  async updateDoctorProfile(userId: string, dto: {
    fullName?: string;
    specialization?: string;
    profilePhoto?: string | null;
    consultationFee?: number;
    clinicName?: string;
    clinicAddress?: string;
    clinicTimings?: string;
  }) {
    const doctor = await this.prisma.doctor.findUnique({
      where: { userId },
      include: { verification: true },
    });
    if (!doctor) throw new ForbiddenException('Only doctors can update a practice profile.');

    const nameChanged = dto.fullName?.trim() && dto.fullName.trim() !== doctor.fullName;
    const specChanged = dto.specialization?.trim() && dto.specialization.trim() !== doctor.specialization;

    // Rule: Clinical identity (name & specialty) are credential-backed.
    // If a verified doctor alters their clinical name or specialty, require re-verification.
    const shouldResetVerification = (nameChanged || specChanged) && doctor.verification?.status === VerificationStatus.VERIFIED;

    const updated = await this.prisma.doctor.update({
      where: { userId },
      data: {
        fullName: dto.fullName?.trim() || undefined,
        specialization: dto.specialization?.trim() || undefined,
        profilePhoto: dto.profilePhoto === null ? null : dto.profilePhoto?.trim() || undefined,
        consultationFee: dto.consultationFee && dto.consultationFee > 0 ? dto.consultationFee : undefined,
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
      },
      include: { qualifications: true, clinic: true, verification: true, availabilities: true },
    });

    // If clinicTimings was provided, sync doctor's availabilities for Mon-Sat
    if (dto.clinicTimings?.trim()) {
      try {
        const parsedIntervals = this.parseTimingsToIntervals(dto.clinicTimings.trim());
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
                slotDurationMinutes: 30,
              });
            }
          }
          await this.prisma.availability.createMany({ data: newAvailabilities });
        }
      } catch (err) {
        // Continue if sync encounters an error
      }
    }

    return this.formatDoctor(updated);
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
    const doctor = await this.prisma.doctor.findUnique({
      where: { id: doctorId },
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

    const bookedAppointments = await this.prisma.appointment.findMany({
      where: {
        doctorId,
        date,
        status: { in: ['CONFIRMED', 'PENDING'] },
      },
      select: { startTime: true },
    });

    const bookedTimes = new Set(bookedAppointments.map((a) => a.startTime.slice(0, 5)));
    const availableSlots = candidateSlots.filter((slot) => !bookedTimes.has(slot));

    return {
      date,
      doctorId,
      slots: availableSlots,
    };
  }
}
