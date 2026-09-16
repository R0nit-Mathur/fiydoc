import { Controller, Get, HttpStatus, Res } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';

@Controller()
export class AppController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  getRoot() {
    return {
      status: 'ok',
      service: 'FiYDoc Healthcare REST API',
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      documentation: '/api/docs',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('health')
  async getHealth(@Res({ passthrough: true }) res: any) {
    let databaseStatus = 'connected';
    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch (err: any) {
      databaseStatus = 'disconnected';
      if (res && res.status) res.status(HttpStatus.SERVICE_UNAVAILABLE);
      return {
        status: 'unhealthy',
        service: 'fiydoc-backend',
        database: databaseStatus,
        error: err?.message || 'Database connection error',
        uptimeSeconds: Math.floor(process.uptime()),
        timestamp: new Date().toISOString(),
      };
    }

    return {
      status: 'healthy',
      service: 'fiydoc-backend',
      database: databaseStatus,
      uptimeSeconds: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
    };
  }
}
