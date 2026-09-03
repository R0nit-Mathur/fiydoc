import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { VerificationService } from './verification.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('verification')
@UseGuards(JwtAuthGuard)
export class VerificationController {
  constructor(private verificationService: VerificationService) {}

  @Post(':doctorId/submit')
  async submit(@Param('doctorId') doctorId: string, @Body() body: any) {
    return this.verificationService.submitVerification(doctorId, body);
  }

  @Get(':doctorId')
  async getOne(@Param('doctorId') doctorId: string) {
    return this.verificationService.getVerificationByDoctor(doctorId);
  }
}
