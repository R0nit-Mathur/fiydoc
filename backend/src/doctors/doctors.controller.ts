import { Controller, Get, Post, Query, Param, Patch, Body, Request, UseGuards } from '@nestjs/common';
import { DoctorsService } from './doctors.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('doctors')
export class DoctorsController {
  constructor(private doctorsService: DoctorsService) {}

  @Get()
  async search(
    @Query('q') q?: string,
    @Query('specialty') specialty?: string,
    @Query('lat') lat?: string,
    @Query('lng') lng?: string,
  ) {
    const parsedLat = lat ? parseFloat(lat) : undefined;
    const parsedLng = lng ? parseFloat(lng) : undefined;
    return this.doctorsService.searchDoctors(q, specialty, parsedLat, parsedLng);
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard)
  async updateMyProfile(@Request() req: any, @Body() body: any) {
    return this.doctorsService.updateDoctorProfile(req.user.id, body);
  }

  @Post('schedule/delay')
  @UseGuards(JwtAuthGuard)
  async applyDelay(
    @Request() req: any,
    @Body() body: { doctorId?: string; date: string; delayMinutes: number; reason?: string }
  ) {
    return this.doctorsService.applyScheduleDelay(body.doctorId, body.date, body.delayMinutes, body.reason, req.user);
  }

  @Post('schedule/leave')
  @UseGuards(JwtAuthGuard)
  async applyLeave(
    @Request() req: any,
    @Body() body: { doctorId?: string; date: string; reason?: string }
  ) {
    return this.doctorsService.applyScheduleLeave(body.doctorId, body.date, body.reason, req.user);
  }

  @Post('schedule/undo')
  @UseGuards(JwtAuthGuard)
  async undoSchedule(
    @Request() req: any,
    @Body() body: { doctorId?: string; date: string; action: 'delay' | 'leave' }
  ) {
    return this.doctorsService.undoScheduleOverride(body.doctorId, body.date, body.action, req.user);
  }

  @Get(':id/schedule/overrides')
  async getScheduleOverrides(
    @Param('id') id: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ) {
    return this.doctorsService.getScheduleOverrides(id, startDate, endDate);
  }

  @Get(':id/schedule/week')
  async getScheduleWeek(
    @Param('id') id: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ) {
    return this.doctorsService.getScheduleOverrides(id, startDate, endDate);
  }

  @Get(':id/schedule/status')
  async getScheduleStatus(@Param('id') id: string, @Query('date') date: string) {
    return this.doctorsService.getScheduleStatus(id, date || new Date().toISOString().split('T')[0]);
  }

  @Get(':id')
  async getOne(@Param('id') id: string) {
    return this.doctorsService.getDoctorById(id);
  }

  @Get(':id/slots')
  async getSlots(@Param('id') id: string, @Query('date') date: string) {
    return this.doctorsService.generateAvailableSlots(id, date || new Date().toISOString().split('T')[0]);
  }
}

