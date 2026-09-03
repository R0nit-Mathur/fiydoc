import { Controller, Get, Query, Param } from '@nestjs/common';
import { DoctorsService } from './doctors.service';

@Controller('doctors')
export class DoctorsController {
  constructor(private doctorsService: DoctorsService) {}

  @Get()
  async search(@Query('q') q?: string, @Query('specialty') specialty?: string) {
    return this.doctorsService.searchDoctors(q, specialty);
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
