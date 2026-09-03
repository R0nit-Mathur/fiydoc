import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { PrescriptionsService } from './prescriptions.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('prescriptions')
export class PrescriptionsController {
  constructor(private prescriptionsService: PrescriptionsService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  async create(@Body() body: any) {
    return this.prescriptionsService.createPrescription(body);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async getOne(@Param('id') id: string) {
    return this.prescriptionsService.getPrescriptionById(id);
  }

  @Get('verify/:code')
  async verify(@Param('code') code: string) {
    return this.prescriptionsService.verifyPrescriptionCode(code);
  }
}
