import * as bcrypt from 'bcryptjs';
import { PrismaClient, Role, UserStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('[Reset] Connecting to PostgreSQL database...');

  const tables = [
    'AuditLog',
    'Notification',
    'PrescriptionItem',
    'Prescription',
    'MedicalRecord',
    'Appointment',
    'Availability',
    'DoctorScheduleOverride',
    'DailyDoctorToken',
    'DoctorVerification',
    'Qualification',
    'Clinic',
    'Doctor',
    'Patient',
    'User',
  ];

  console.log('[Reset] Wiping existing data across all application tables...');
  for (const table of tables) {
    try {
      await prisma.$executeRawUnsafe(`TRUNCATE TABLE "${table}" CASCADE;`);
      console.log(`[Reset] Truncated table: ${table}`);
    } catch (err: any) {
      console.warn(`[Reset] Table ${table} truncate notice: ${err?.message}`);
    }
  }

  const adminEmail = (process.env.ADMIN_EMAIL || 'admin@fiydoc.app').trim().toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD || 'FiYDoc@SuperAdmin2026!';

  const passwordHash = await bcrypt.hash(adminPassword, 10);
  const superAdmin = await prisma.user.create({
    data: {
      email: adminEmail,
      passwordHash,
      role: Role.ADMIN,
      status: UserStatus.ACTIVE,
    },
  });

  console.log('\n======================================================');
  console.log('✅ DATABASE SUCCESSFULLY CLEARED & INITIALIZED');
  console.log('======================================================');
  console.log(`👤 Super Admin Email:    ${superAdmin.email}`);
  console.log(`🔑 Super Admin Password: ${adminPassword}`);
  console.log(`🆔 Super Admin User ID:  ${superAdmin.id}`);
  console.log(`🛡️ Role:                 ${superAdmin.role}`);
  console.log('======================================================\n');
}

main()
  .catch((e) => {
    console.error('[Reset] Fatal error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
