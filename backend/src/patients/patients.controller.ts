import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  UseGuards,
  Req,
} from '@nestjs/common';
import { PatientsService } from './patients.service';
import { UpdatePatientProfileDto } from './dto/update-patient-profile.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('patients')
export class PatientsController {
  constructor(private patientsService: PatientsService) {}

  @Get(':id')
  async getProfile(@Param('id') id: string) {
    return this.patientsService.getProfile(id);
  }

  @Patch(':id')
  async updateProfile(
    @Param('id') id: string,
    @Body() dto: UpdatePatientProfileDto
  ) {
    return this.patientsService.updateProfile(id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('me/profile')
  async updateMyProfile(
    @Req() req: any,
    @Body() dto: UpdatePatientProfileDto
  ) {
    const userId = req.user?.id;
    return this.patientsService.updateProfile(userId, dto);
  }
}
