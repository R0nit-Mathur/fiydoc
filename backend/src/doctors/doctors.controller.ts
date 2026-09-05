import { Controller, Get, Query, Param } from '@nestjs/common';
import { DoctorsService } from './doctors.service';

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

  @Get(':id')
  async getOne(@Param('id') id: string) {
    return this.doctorsService.getDoctorById(id);
  }

  @Get(':id/slots')
  async getSlots(@Param('id') id: string, @Query('date') date: string) {
    return this.doctorsService.generateAvailableSlots(id, date || new Date().toISOString().split('T')[0]);
  }
}
