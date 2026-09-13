-- Add UserStatus enum and status column to User table
-- This migration adds the status field that was added to schema.prisma but never migrated

-- CreateEnum
CREATE TYPE IF NOT EXISTS "UserStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'REVOKED');

-- Add status column to User table with ACTIVE as default
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE';

-- Also add address to Patient if missing (added in a later schema revision)
ALTER TABLE "Patient" ADD COLUMN IF NOT EXISTS "address" TEXT;
