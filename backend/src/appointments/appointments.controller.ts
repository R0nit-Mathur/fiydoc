import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { AppointmentsService } from './appointments.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ConsultationType } from '@prisma/client';

@Controller('appointments')
@UseGuards(JwtAuthGuard)
export class AppointmentsController {
  constructor(private appointmentsService: AppointmentsService) {}

  @Post()
  async create(
    @Request() req,
    @Body()
    body: {
      patientId: string;
      doctorId: string;
      date: string;
      startTime: string;
      endTime: string;
      consultationType: ConsultationType;
      fee: number;
      symptoms?: string[];
    }
  ) {
    return this.appointmentsService.createAppointment({
      ...body,
      patientId: req.user.patient?.id || body.patientId,
    });
  }

  @Get('patient/:patientId')
  async getForPatient(@Param('patientId') patientId: string, @Request() req) {
    return this.appointmentsService.getPatientAppointments(patientId, req.user);
  }

  @Get('doctor/:doctorId')
  async getForDoctor(@Param('doctorId') doctorId: string, @Request() req) {
    return this.appointmentsService.getDoctorAppointments(doctorId, req.user);
  }

  @Get(':id')
  async getOne(@Param('id') id: string, @Request() req) {
    return this.appointmentsService.getAppointmentById(id, req.user);
  }

  @Post(':id/cancel')
  async cancel(@Param('id') id: string, @Request() req) {
    return this.appointmentsService.cancelAppointment(id, req.user);
  }

  @Post(':id/approve')
  async approve(@Param('id') id: string, @Request() req) {
    return this.appointmentsService.updateAppointmentStatus(id, 'CONFIRMED' as any, req.user);
  }

  @Post(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body() body: { status: any },
    @Request() req
  ) {
    return this.appointmentsService.updateAppointmentStatus(id, body.status, req.user);
  }
}
