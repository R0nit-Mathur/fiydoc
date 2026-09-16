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
@UseGuards(JwtAuthGuard)
export class PatientsController {
  constructor(private patientsService: PatientsService) {}

  @Get('me')
  async getMyProfileDirect(@Req() req: any) {
    return this.patientsService.getProfile(req.user?.id, req.user);
  }

  @Get('me/profile')
  async getMyProfile(@Req() req: any) {
    return this.patientsService.getProfile(req.user?.id, req.user);
  }

  @Patch('me')
  async updateMyProfileDirect(
    @Req() req: any,
    @Body() dto: UpdatePatientProfileDto,
  ) {
    const userId = req.user?.id;
    return this.patientsService.updateProfile(userId, dto, req.user);
  }

  @Patch('me/profile')
  async updateMyProfile(
    @Req() req: any,
    @Body() dto: UpdatePatientProfileDto,
  ) {
    const userId = req.user?.id;
    return this.patientsService.updateProfile(userId, dto, req.user);
  }

  @Get(':id')
  async getProfile(@Param('id') id: string, @Req() req: any) {
    return this.patientsService.getProfile(id, req.user);
  }

  @Patch(':id')
  async updateProfile(
    @Param('id') id: string,
    @Body() dto: UpdatePatientProfileDto,
    @Req() req: any,
  ) {
    return this.patientsService.updateProfile(id, dto, req.user);
  }
}

