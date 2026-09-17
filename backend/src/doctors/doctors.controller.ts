import { Controller, Get, Post, Query, Param, Patch, Body, Request, UseGuards, Delete } from '@nestjs/common';
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
    @Query('minFee') minFee?: string,
    @Query('maxFee') maxFee?: string,
    @Query('mode') mode?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
    @Query('sortBy') sortBy?: string,
  ) {
    const parsedLat = lat ? parseFloat(lat) : undefined;
    const parsedLng = lng ? parseFloat(lng) : undefined;
    return this.doctorsService.searchDoctors(q, specialty, parsedLat, parsedLng, {
      minFee: minFee ? parseFloat(minFee) : undefined,
      maxFee: maxFee ? parseFloat(maxFee) : undefined,
      mode,
      limit: limit ? parseInt(limit, 10) : undefined,
      offset: offset ? parseInt(offset, 10) : undefined,
      sortBy,
    });
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getMyProfile(@Request() req: any) {
    return this.doctorsService.getMyDoctorProfile(req.user);
  }

  @Patch('me/availability')
  @UseGuards(JwtAuthGuard)
  async updateMyAvailability(
    @Request() req: any,
    @Body() body: { availabilities: { dayOfWeek: number; startTime: string; endTime: string; slotDurationMinutes?: number }[] }
  ) {
    return this.doctorsService.updateDoctorAvailability(req.user, body.availabilities);
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
    @Body() body: { doctorId?: string; date?: string; startDate?: string; endDate?: string; reason?: string }
  ) {
    const startDate = body.startDate || body.date;
    return this.doctorsService.applyScheduleLeave(body.doctorId, startDate, body.reason, req.user, body.endDate);
  }

  @Post('schedule/undo')
  @UseGuards(JwtAuthGuard)
  async undoSchedule(
    @Request() req: any,
    @Body() body: { doctorId?: string; date: string; action: 'delay' | 'leave' }
  ) {
    return this.doctorsService.undoScheduleOverride(body.doctorId, body.date, body.action, req.user);
  }

  @Post('schedule/custom-slot')
  @UseGuards(JwtAuthGuard)
  async manageCustomSlot(
    @Request() req: any,
    @Body()
    body: {
      doctorId?: string;
      date: string;
      time: string;
      action: 'add' | 'remove' | 'block';
    }
  ) {
    return this.doctorsService.manageCustomSlot(
      body.doctorId,
      body.date,
      body.time,
      body.action,
      req.user
    );
  }

  @Post('schedule/settings')
  @UseGuards(JwtAuthGuard)
  async updateScheduleSettings(
    @Request() req: any,
    @Body()
    body: {
      doctorId?: string;
      date?: string;
      slotDurationMinutes?: number;
      patientsPerSlot?: number;
      morningStart?: string;
      morningEnd?: string;
      eveningStart?: string;
      eveningEnd?: string;
    }
  ) {
    return this.doctorsService.updateScheduleSettings(body, req.user);
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

  @Get(':id/slots')
  async getSlots(@Param('id') id: string, @Query('date') date: string) {
    return this.doctorsService.generateAvailableSlots(id, date || new Date().toISOString().split('T')[0]);
  }

  @Get(':id')
  async getOne(@Param('id') id: string, @Request() req: any) {
    return this.doctorsService.getDoctorById(id, req?.user);
  }
}
