import { Controller, Get, Post, Patch, Body, Query, Param, UseGuards, Request } from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard, Roles } from '../auth/roles.guard';
import { Role } from '@prisma/client';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class AdminController {
  constructor(private adminService: AdminService) {}

  @Get('stats')
  async getStats() {
    return this.adminService.getSystemStats();
  }

  @Get('doctors')
  async getDoctors(
    @Query('status') status?: string,
    @Query('search') search?: string,
  ) {
    const doctors = await this.adminService.getAllDoctors({ status, search });
    return {
      doctors,
      total: doctors.length,
    };
  }

  @Get('doctors/:id')
  async getDoctorDetail(@Param('id') id: string) {
    return this.adminService.getDoctorDetail(id);
  }

  @Patch('doctors/:id/verify')
  async verifyDoctorDirect(
    @Request() req,
    @Param('id') id: string,
    @Body() body: { status?: string; rejectionReason?: string },
  ) {
    const action = body.status === 'REJECTED' ? 'REJECT' : 'APPROVE';
    return this.adminService.reviewVerification({
      doctorId: id,
      action,
      rejectionReason: body.rejectionReason,
      adminUserId: req.user.id,
    });
  }

  @Get('verifications')
  async getVerificationQueue() {
    return this.adminService.getVerificationQueue();
  }

  @Post('verifications/review')
  async review(@Request() req, @Body() body: any) {
    return this.adminService.reviewVerification({
      ...body,
      adminUserId: req.user.id,
    });
  }

  @Get('audit-logs')
  async getAuditLogs(@Query('take') take?: string) {
    return this.adminService.getAuditLogs(take ? parseInt(take, 10) : 50);
  }

  @Get('users')
  async getUsers(@Query('search') search?: string) {
    return this.adminService.getAllUsers(search);
  }
}
