import { Controller, Get, Post, Body, Query, UseGuards, Request } from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard, Roles } from '../auth/roles.guard';
import { Role } from '@prisma/client';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class AdminController {
  constructor(private adminService: AdminService) {}

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

  @Get('users')
  async getUsers(@Query('search') search?: string) {
    return this.adminService.getAllUsers(search);
  }
}
