import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { PrescriptionsService } from './prescriptions.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AuthRateLimitGuard } from '../auth/auth-rate-limit.guard';

@Controller('prescriptions')
export class PrescriptionsController {
  constructor(private prescriptionsService: PrescriptionsService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  async create(@Request() req: any, @Body() body: any) {
    return this.prescriptionsService.createPrescription(body, req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Get('patient/:patientId')
  async getForPatient(@Param('patientId') patientId: string, @Request() req: any) {
    return this.prescriptionsService.getPrescriptionsForPatient(patientId, req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async getOne(@Param('id') id: string, @Request() req: any) {
    return this.prescriptionsService.getPrescriptionById(id, req.user);
  }

  @UseGuards(AuthRateLimitGuard)
  @Get('verify/:code')
  async verify(@Param('code') code: string) {
    return this.prescriptionsService.verifyPrescriptionCode(code);
  }
}

