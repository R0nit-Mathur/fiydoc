import * as bcrypt from 'bcryptjs';
import { PrismaClient, Role, UserStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const adminEmail = (process.env.ADMIN_EMAIL || 'admin@fiydoc.app').trim().toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD || 'FiYDoc@SuperAdmin2026!';

  const existingAdmin = await prisma.user.findFirst({
    where: {
      OR: [
        { role: Role.ADMIN },
        { email: adminEmail },
      ],
    },
  });

  if (!existingAdmin) {
    const passwordHash = await bcrypt.hash(adminPassword, 10);
    const superAdmin = await prisma.user.create({
      data: {
        email: adminEmail,
        passwordHash,
        role: Role.ADMIN,
        status: UserStatus.ACTIVE,
      },
    });
    console.log(`[Seed] Created Super-Admin user: ${superAdmin.email} (${superAdmin.id})`);
  } else {
    console.log(`[Seed] Super-Admin user already exists: ${existingAdmin.email} (${existingAdmin.id})`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

