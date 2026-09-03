import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { VerificationStatus } from '@prisma/client';

@Injectable()
export class DoctorsService {
  constructor(private prisma: PrismaService) {}

  private formatDoctor(doc: any) {
    if (!doc) return null;
    const qualificationText = doc.qualifications?.map((q: any) => q.degree).join(', ') || 'MBBS, MD Specialist';
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
      hospital: doc.clinic?.name || 'FiYDoc Healthcare Clinic',
      location: doc.clinic?.address || 'Metro Medical Center',
      timings: doc.clinic?.timings || '09:00 AM - 05:00 PM',
      rating: 4.9,
      reviewCount: 128,
      experienceYears: 12,
      verificationStatus: 'verified',
      modes: ['clinic'],
      isInPersonAvailable: true,
      isOnlineAvailable: false,
      nextAvailableSlot: 'Today, 11:30 AM',
      timeSlots: ['09:30 AM', '10:30 AM', '11:30 AM', '02:00 PM', '03:30 PM', '05:00 PM'],
    };
  }

  async searchDoctors(query?: string, specialty?: string) {
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

    return doctors.map((d) => this.formatDoctor(d));
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
