import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit() {
    try {
      await this.$connect();
      this.logger.log('✅ Connected to PostgreSQL database via Prisma.');

      // Ensure UserStatus enum exists (was added to schema but never migrated)
      await this.$executeRawUnsafe(`
        DO $$ BEGIN
          CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'REVOKED');
        EXCEPTION WHEN duplicate_object THEN NULL;
        END $$;
      `);

      // Ensure User.status column exists with ACTIVE default
      await this.$executeRawUnsafe(`
        ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE';
      `);

      // Ensure Patient.address column exists (added in schema revision)
      await this.$executeRawUnsafe(`
        ALTER TABLE "Patient" ADD COLUMN IF NOT EXISTS "address" TEXT;
      `);

      // Ensure Doctor.patientsPerSlot column exists (allows concurrent patients per time slot)
      await this.$executeRawUnsafe(`
        ALTER TABLE "Doctor" ADD COLUMN IF NOT EXISTS "patientsPerSlot" INTEGER NOT NULL DEFAULT 1;
      `);

      // Ensure Doctor.experienceYears column exists
      await this.$executeRawUnsafe(`
        ALTER TABLE "Doctor" ADD COLUMN IF NOT EXISTS "experienceYears" INTEGER NOT NULL DEFAULT 0;
      `);

      this.logger.log('✅ Schema migrations verified (UserStatus, patientsPerSlot, experienceYears).');

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

      // Ensure Prescription.issuedAt column exists (missing from older DB migrations)
      await this.$executeRawUnsafe(`
        ALTER TABLE "Prescription" ADD COLUMN IF NOT EXISTS "issuedAt" TIMESTAMP(3);
      `);

      // Ensure Prescription.pdfUrl column exists
      await this.$executeRawUnsafe(`
        ALTER TABLE "Prescription" ADD COLUMN IF NOT EXISTS "pdfUrl" TEXT;
      `);

      // Ensure Prescription.verificationCode has a default if null
      await this.$executeRawUnsafe(`
        ALTER TABLE "Prescription" ALTER COLUMN "verificationCode" SET DEFAULT gen_random_uuid()::text;
      `);

      this.logger.log('✅ Prescription schema columns verified.');

      // Ensure Consultation.completedAt exists (may be missing in older migrations)
      await this.$executeRawUnsafe(`
        ALTER TABLE "Consultation" ADD COLUMN IF NOT EXISTS "completedAt" TIMESTAMP(3);
      `);
      // Ensure Consultation.diagnosis, treatmentPlan columns exist
      await this.$executeRawUnsafe(`
        ALTER TABLE "Consultation" ADD COLUMN IF NOT EXISTS "diagnosis" TEXT;
      `);
      await this.$executeRawUnsafe(`
        ALTER TABLE "Consultation" ADD COLUMN IF NOT EXISTS "treatmentPlan" TEXT;
      `);

      // Ensure MedicalRecord.documentUrl exists
      await this.$executeRawUnsafe(`
        ALTER TABLE "MedicalRecord" ADD COLUMN IF NOT EXISTS "documentUrl" TEXT;
      `);
      await this.$executeRawUnsafe(`
        ALTER TABLE "MedicalRecord" ADD COLUMN IF NOT EXISTS "tags" TEXT[] DEFAULT '{}';
      `);

      this.logger.log('✅ Consultation and MedicalRecord schema columns verified.');




      // Seed default admin user if none exists
      await this.seedAdminUser();

    } catch (err: any) {
      this.logger.warn(`⚠️ Prisma connection or schema warning: ${err?.message || err}`);
    }
  }

  private async seedAdminUser() {
    try {
      const existing = await this.user.findFirst({
        where: { role: 'ADMIN' },
      });
      if (!existing) {
        const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@fiydoc.com';
        const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'FiYDoc@Admin2026!';
        const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);
        await this.user.create({
          data: {
            email: ADMIN_EMAIL,
            passwordHash,
            role: 'ADMIN',
            status: 'ACTIVE',
          },
        });
        this.logger.log(`✅ Default admin user seeded: ${ADMIN_EMAIL}`);
      }
    } catch (err: any) {
      this.logger.warn(`⚠️ Admin seed skipped: ${err?.message || err}`);
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
