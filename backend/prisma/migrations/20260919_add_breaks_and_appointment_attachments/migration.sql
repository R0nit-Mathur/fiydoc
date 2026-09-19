-- AlterTable Appointment: add attachmentUrl and attachmentName
ALTER TABLE "Appointment" ADD COLUMN IF NOT EXISTS "attachmentUrl" TEXT;
ALTER TABLE "Appointment" ADD COLUMN IF NOT EXISTS "attachmentName" TEXT;

-- AlterTable DoctorScheduleOverride: add breaks
ALTER TABLE "DoctorScheduleOverride" ADD COLUMN IF NOT EXISTS "breaks" JSONB DEFAULT '[]'::jsonb;
