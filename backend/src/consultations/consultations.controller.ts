import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ConsultationsService } from './consultations.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('consultations')
@UseGuards(JwtAuthGuard)
export class ConsultationsController {
  constructor(private consultationsService: ConsultationsService) {}

  @Post()
  async upsert(@Request() req, @Body() body: any) {
    return this.consultationsService.createOrUpdateConsultation(body, req.user);
  }

  @Get('appointment/:appointmentId')
  async getByAppointment(@Param('appointmentId') appointmentId: string) {
    return this.consultationsService.getConsultationByAppointment(appointmentId);
  }
}
