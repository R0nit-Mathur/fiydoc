import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit() {
    try {
      await this.$connect();
      this.logger.log('✅ Connected to PostgreSQL database via Prisma.');

      // Ensure DoctorScheduleOverride table and indexes exist in PostgreSQL
      await this.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "DoctorScheduleOverride" (
          "id" TEXT NOT NULL PRIMARY KEY,
          "doctorId" TEXT NOT NULL,
          "date" TEXT NOT NULL,
          "delayMinutes" INTEGER NOT NULL DEFAULT 0,
          "isOnLeave" BOOLEAN NOT NULL DEFAULT false,
          "reason" TEXT,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
      `);
      await this.$executeRawUnsafe(`
        CREATE UNIQUE INDEX IF NOT EXISTS "DoctorScheduleOverride_doctorId_date_key" 
        ON "DoctorScheduleOverride"("doctorId", "date");
      `);
      await this.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS "DoctorScheduleOverride_doctorId_date_idx" 
        ON "DoctorScheduleOverride"("doctorId", "date");
      `);
      this.logger.log('✅ DoctorScheduleOverride schema verified in PostgreSQL.');
    } catch (err: any) {
      this.logger.warn(`⚠️ Prisma connection or schema warning: ${err?.message || err}`);
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
