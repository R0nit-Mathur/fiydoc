import { Injectable, NotFoundException } from '@nestjs/common';
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

    return {
      ...doc,
      id: doc.id,
      name: doc.fullName,
      fullName: doc.fullName,
      specialty: doc.specialization,
      specialization: doc.specialization,
      avatar: doc.profilePhoto || 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&q=80',
      profilePhoto: doc.profilePhoto,
      consultationFee: doc.consultationFee,
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
      rating: 4.9,
      reviewCount: 128,
      experienceYears: doc.experienceYears || 10,
      verificationStatus: 'verified',
      modes: ['clinic'],
      isInPersonAvailable: true,
      isOnlineAvailable: false,
      nextAvailableSlot: 'Today, 11:30 AM',
      timeSlots: ['09:30 AM', '10:30 AM', '11:30 AM', '02:00 PM', '03:30 PM', '05:00 PM'],
    };
  }

  async searchDoctors(query?: string, specialty?: string, lat?: number, lng?: number) {
    const whereClause: any = {
      verification: {
        status: VerificationStatus.VERIFIED,
      },
    };

    if (specialty && specialty !== 'All') {
      whereClause.specialization = specialty;
    }

    if (query) {
      whereClause.OR = [
        { fullName: { contains: query, mode: 'insensitive' } },
        { specialization: { contains: query, mode: 'insensitive' } },
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

  async generateAvailableSlots(doctorId: string, date: string) {
    const doctor = await this.prisma.doctor.findUnique({
      where: { id: doctorId },
      include: { availabilities: true },
    });
    if (!doctor) throw new NotFoundException('Doctor not found');

    const defaultSlots = ['09:30 AM', '10:30 AM', '11:30 AM', '02:00 PM', '03:30 PM', '05:00 PM'];

    const bookedAppointments = await this.prisma.appointment.findMany({
      where: {
        doctorId,
        date,
        status: { in: ['CONFIRMED', 'PENDING'] },
      },
    });

    const bookedTimes = new Set(bookedAppointments.map((a) => a.startTime));
    const availableSlots = defaultSlots.filter((slot) => !bookedTimes.has(slot));

    return {
      date,
      doctorId,
      slots: availableSlots,
    };
  }
}
