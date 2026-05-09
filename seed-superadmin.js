const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const hash = await bcrypt.hash('password', 10);
  const user = await prisma.users.upsert({
    where: { email: 'superadmin@disnaker.id' },
    update: { password: hash, role: 'superadmin' },
    create: {
      name: 'Super Admin',
      email: 'superadmin@disnaker.id',
      password: hash,
      role: 'superadmin',
      created_at: new Date(),
      updated_at: new Date(),
    },
  });
  console.log('Done:', user.email, '|', user.role);
  await prisma.$disconnect();
}

main().catch(e => { console.error(e.message); prisma.$disconnect(); });
