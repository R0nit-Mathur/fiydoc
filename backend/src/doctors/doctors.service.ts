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
    const qualificationText = doc.qualifications?.map((q: any) => q.degree).join(', ') || 'MBBS, MD Specialist';
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
      avatar: doc.profilePhoto || 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&q=80',
      profilePhoto: doc.profilePhoto,
      consultationFee: doc.consultationFee,
      consultationModes: doc.consultationModes || ['CLINIC'],
      qualification: qualificationText,
      hospital: doc.clinic?.name || 'In-Clinic Practice',
      location: doc.clinic?.address || 'Medical Practice Clinic',
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
      timings: doc.clinic?.timings || '09:00 AM - 05:00 PM',
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
    const whereClause: any = {};

    if (specialty && specialty !== 'All') {
      // Search categories are human labels (e.g. "Cardiology") while database
      // specializations may be "Interventional Cardiologist". Exact equality hid valid doctors.
      whereClause.specialization = { contains: specialty, mode: 'insensitive' };
    }

    if (query) {
      whereClause.OR = [
        { fullName: { contains: query, mode: 'insensitive' } },
        { specialization: { contains: query, mode: 'insensitive' } },
        { clinic: { is: { name: { contains: query, mode: 'insensitive' } } } },
        { clinic: { is: { address: { contains: query, mode: 'insensitive' } } } },
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
    if (!doctor) throw new NotFoundException('Doctor not found');
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
    const doctor = await this.prisma.doctor.findUnique({ where: { userId } });
    if (!doctor) throw new ForbiddenException('Only doctors can update a practice profile.');

    const updated = await this.prisma.doctor.update({
      where: { userId },
      data: {
        fullName: dto.fullName?.trim() || undefined,
        specialization: dto.specialization?.trim() || undefined,
        profilePhoto: dto.profilePhoto === null ? null : dto.profilePhoto?.trim() || undefined,
        consultationFee: dto.consultationFee && dto.consultationFee > 0 ? dto.consultationFee : undefined,
        ...(dto.clinicName?.trim() || dto.clinicAddress?.trim() || dto.clinicTimings?.trim()
          ? {
              clinic: {
                upsert: {
                  create: {
                    name: dto.clinicName?.trim() || 'Private Practice',
                    address: dto.clinicAddress?.trim() || 'Address pending',
                    timings: dto.clinicTimings?.trim() || undefined,
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
    return this.formatDoctor(updated);
  }

  async generateAvailableSlots(doctorId: string, date: string) {
    const doctor = await this.prisma.doctor.findUnique({
      where: { id: doctorId },
      include: { availabilities: true },
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
    } else {
      // Fallback: if no specific availabilities configured, standard business hours
      candidateSlots = ['09:30', '10:30', '11:30', '14:00', '15:30', '17:00'];
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
