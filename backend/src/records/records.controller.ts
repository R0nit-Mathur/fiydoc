import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { RecordsService } from './records.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('records')
@UseGuards(JwtAuthGuard)
export class RecordsController {
  constructor(private recordsService: RecordsService) {}

  @Get('patient/:patientId')
  async getTimeline(@Param('patientId') patientId: string, @Request() req) {
    return this.recordsService.getPatientTimeline(patientId, req.user);
  }

  @Post('upload')
  async upload(@Body() body: any) {
    return this.recordsService.uploadRecord(body);
  }
}
