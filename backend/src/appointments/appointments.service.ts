import { Injectable, BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AppointmentStatus, ConsultationType, Role } from '@prisma/client';

@Injectable()
export class AppointmentsService {
  constructor(private prisma: PrismaService) {}

  private formatAppointment(apt: any) {
    if (!apt) return null;
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
      status: (apt.status || 'CONFIRMED').toLowerCase(),
      mode: 'clinic',
      fee: apt.fee,
      symptoms: apt.symptoms || [],
      notes: apt.notes,
    };
  }

  async createAppointment(dto: {
    patientId: string;
    doctorId: string;
    date: string;
    startTime: string;
    endTime: string;
    consultationType: ConsultationType;
    fee: number;
    symptoms?: string[];
    notes?: string;
  }) {
    return this.prisma.$transaction(async (tx) => {
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

      const appointment = await tx.appointment.create({
        data: {
          patientId: dto.patientId,
          doctorId: dto.doctorId,
          date: dto.date,
          startTime: dto.startTime,
          endTime: dto.endTime,
          consultationType: ConsultationType.CLINIC,
          fee: dto.fee,
          symptoms: dto.symptoms || [],
          notes: dto.notes,
          status: AppointmentStatus.CONFIRMED,
        },
        include: {
          doctor: { include: { clinic: true } },
          patient: true,
        },
      });

      // Trigger notification for both patient and doctor
      await tx.notification.createMany({
        data: [
          {
            userId: dto.patientId,
            type: 'APPOINTMENT_CONFIRMED',
            title: 'In-Clinic Appointment Confirmed',
            message: `Your appointment with ${appointment.doctor.fullName} on ${dto.date} at ${dto.startTime} is confirmed.`,
          },
          {
            userId: appointment.doctor.userId,
            type: 'NEW_APPOINTMENT',
            title: 'New Patient Booked',
            message: `Patient ${appointment.patient.fullName} booked an in-clinic slot on ${dto.date} at ${dto.startTime}.`,
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

    if (currentUser.role === Role.PATIENT && currentUser.patient && currentUser.patient.id !== targetPatientId) {
      // Allow access if matching user id or patient id
      if (currentUser.id !== patientId && currentUser.patient.id !== patientId) {
        throw new ForbiddenException('Cannot access another patient’s appointments.');
      }
    }

    const queryId = currentUser.patient?.id || targetPatientId;

    const appointments = await this.prisma.appointment.findMany({
      where: { patientId: queryId },
      include: { doctor: { include: { clinic: true } }, patient: true, consultation: true },
      orderBy: { createdAt: 'desc' },
    });

    return appointments.map((a) => this.formatAppointment(a));
  }

  async getDoctorAppointments(doctorId: string, currentUser: any) {
    const targetDoctorId =
      doctorId === 'me' || doctorId === currentUser.id || !doctorId
        ? currentUser.doctor?.id
        : doctorId;

    if (currentUser.role === Role.DOCTOR && currentUser.doctor && currentUser.doctor.id !== targetDoctorId) {
      if (currentUser.id !== doctorId && currentUser.doctor.id !== doctorId) {
        throw new ForbiddenException('Cannot access another doctor’s queue.');
      }
    }

    const queryId = currentUser.doctor?.id || targetDoctorId;

    const appointments = await this.prisma.appointment.findMany({
      where: { doctorId: queryId },
      include: { patient: true, doctor: { include: { clinic: true } }, consultation: true },
      orderBy: { date: 'asc' },
    });

    return appointments.map((a) => this.formatAppointment(a));
  }

  async getAppointmentById(id: string, currentUser: any) {
    const apt = await this.prisma.appointment.findUnique({
      where: { id },
      include: { doctor: { include: { clinic: true } }, patient: true, consultation: true },
    });
    if (!apt) throw new NotFoundException('Appointment not found.');

    return this.formatAppointment(apt);
  }

  async cancelAppointment(id: string, currentUser: any) {
    const apt = await this.getAppointmentById(id, currentUser);

    const updated = await this.prisma.appointment.update({
      where: { id },
      data: { status: AppointmentStatus.CANCELLED },
      include: { doctor: { include: { clinic: true } }, patient: true },
    });

    return this.formatAppointment(updated);
  }
}
